/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-buffer-constructor */
/* eslint-disable no-await-in-loop */
/* bazecor-flash-sonshi -- Dygma Sonshi flash helper for Bazecor
 * Copyright (C) 2025  DygmaLab SE
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <http://www.gnu.org/licenses/>.
 */

import { crc32 } from "easy-crc";
import log from "electron-log/renderer";
import { num2hexstr } from "../num2hexstr";
import { serialConnection, rawCommand, noWaitCommand } from "../serialConnection";
import { InfoType, SealType, HexType } from "../types";
import ihexDecode from "../ihexDecode";
import SealWithCRC from "../sealWithCRC";
import { parseSealFromBinary, validateSealCRC } from "../parseSeal";

const PACKET_SIZE = 4096;
const FIRST_SECTOR_SIZE = 4096;
const KEYSCANNER_SONSHI_DEVICE_ID = 0x4f53534b;

const TYPE_DAT = 0x00;
const TYPE_ESA = 0x02;
const TYPE_ELA = 0x04;

let serialPort;

/**
 * Object NRf52833 with flash method for Sonshi.
 *
 *
 * The new command structure developed y Ota fejfar for the NRf52833 Bootloader
 *
 * Erase 1:          E[addr]#   - Will erase the memory from the address to the end of the available memory
 * Erase 2:          E[addr],[size]#  - (optional) Will erase the size of the memory
 * Upload data:  U[size]#             - The size of incoming data to be stored in the internal temp buffer
 * Data:              [data]                 - The data of size specified in the previous 'S' command
 * Write data:    W[addr],[size]#  - Move the data in the flash memory
 * CRC check:   C[addr],[size],[crc]#  -  Check the uploaded firmware
 * Start app:       S#                       - Start the application
 *
 */
const SonshiFlash = {
  flash: async (
    lines: string[],
    stateUpdate: (arg0: string, arg1: number) => void,
    finished: (err: Error, result: unknown) => void,
    erasePairings: boolean,
  ) => {
    // let fileData = fs.readFileSync(firmware, { encoding: "utf8" });
    // fileData = fileData.replace(/(?:\r\n|\r|\n)/g, "");

    // var lines = fileData.split(":");
    // lines.splice(0, 1);

    const dataObjects: HexType[] = [];
    let total = 0;
    let segment = 0;
    let linear = 0;
    const auxData = [];

    for (let i = 0; i < lines.length; i += 1) {
      const hex = ihexDecode(lines[i]);

      if (hex.type === TYPE_ESA) {
        segment = parseInt(hex.str.substring(8, 8 + hex.len * 2), 16) * 16;
        linear = 0;
      }

      if (hex.type === TYPE_ELA) {
        linear = parseInt(hex.str.substring(8, 8 + hex.len * 2), 16) * 65536;
        segment = 0;
      }

      // let aux = hex.address;

      if (hex.type === TYPE_DAT) {
        total += hex.len;
        if (segment > 0) hex.address += segment;
        if (linear > 0) hex.address += linear;
        auxData.push(hex.data);
        dataObjects.push(hex);
      }
      //   log.info(num2hexstr(segment, 8), linear, num2hexstr(aux), num2hexstr(hex.address));
    }

    let ArrLenght = 0;
    auxData.forEach(item => {
      ArrLenght += item.length;
    });
    const mergedArray = new Uint8Array(ArrLenght);
    let offset = 0;
    auxData.forEach(item => {
      mergedArray.set(item, offset);
      offset += item.length;
    });

    const totalSaved = total;
    let hexCount = 0;
    let { address } = dataObjects[0];

    // Validate SEAL from firmware before flashing
    log.info("Validating firmware SEAL...");
    if (mergedArray.length < 32) {
      throw new Error("Firmware file too small to contain valid SEAL");
    }

    const embeddedSeal = parseSealFromBinary(mergedArray.slice(0, 32));
    log.info("Embedded SEAL:", embeddedSeal);

    // Check SEAL version
    if (embeddedSeal.bldr_seal_header_t.version !== 2) {
      log.error(`Wrong SEAL version. Expected: 2, Got: ${embeddedSeal.bldr_seal_header_t.version}`);
      throw new Error("Wrong FW: Invalid SEAL version. Expected version 2 for Keyscanner Sonshi.");
    }

    // Check device_id for Keyscanner Sonshi (0x4F53534B = "KSSO")
    if (embeddedSeal.device_id !== KEYSCANNER_SONSHI_DEVICE_ID) {
      log.error(
        `Wrong device_id. Expected: 0x${KEYSCANNER_SONSHI_DEVICE_ID.toString(16).toUpperCase()} (KSSO), Got: 0x${(embeddedSeal.device_id || 0).toString(16).toUpperCase()}`,
      );
      throw new Error("Wrong FW: This firmware is not for Keyscanner Sonshi.");
    }

    // Validate SEAL CRC
    if (!validateSealCRC(embeddedSeal)) {
      log.error("SEAL CRC validation failed");
      throw new Error("Wrong FW: SEAL CRC validation failed.");
    }

    // Validate program size
    const programDataSize = totalSaved - FIRST_SECTOR_SIZE;
    if (embeddedSeal.program_size !== programDataSize) {
      log.error(`Program size mismatch. SEAL says: ${embeddedSeal.program_size}, Actual: ${programDataSize}`);
      throw new Error("Wrong FW: Program size mismatch.");
    }

    // Validate program CRC (skip first 4kB sector which contains the SEAL)
    const programData = mergedArray.slice(FIRST_SECTOR_SIZE);
    const calculatedProgramCrc = crc32("CRC-32", new Buffer(programData));
    if (embeddedSeal.program_crc !== calculatedProgramCrc) {
      log.error(
        `Program CRC mismatch. SEAL says: 0x${embeddedSeal.program_crc.toString(16)}, Calculated: 0x${calculatedProgramCrc.toString(16)}`,
      );
      throw new Error("Wrong FW: Program CRC validation failed.");
    }

    log.info("✓ Firmware SEAL validation passed");

    // Prepare connection
    serialPort = await serialConnection();

    // GET INFO from device
    const info = (await rawCommand("I#", serialPort, 1000)) as InfoType;
    log.info("Result of sending I#: ", info);

    const sealData: SealType = {
      bldr_seal_header_t: {
        version: 2,
        size: 32,
        crc: 0,
      },
      device_id: KEYSCANNER_SONSHI_DEVICE_ID,
      program_start: info.program_space_start,
      program_size: programDataSize,
      program_crc: calculatedProgramCrc,
      program_version: embeddedSeal.program_version,
    };

    const newSeal = SealWithCRC(sealData);

    // SEAL to device
    log.info("sending SEAL");
    let ans: Buffer = await rawCommand(`S${num2hexstr(32, 8)}#`, serialPort, 1000);
    if (ans[0] !== 65) {
      log.info("answer to Seal size: ", String.fromCharCode.apply(null, ans));
      log.info(`RAW Command: S${num2hexstr(32, 8)}#`);
      throw Error("error when sending SEAL size");
    }
    ans = await rawCommand(newSeal, serialPort, 1000);
    if (ans[0] !== 65) {
      log.info("answer to Seal data: ", String.fromCharCode.apply(null, ans));
      log.info(`RAW Command: ${newSeal}`);
      throw Error("error when sending SEAL data");
    }

    // ERASE device
    log.info("Erasing...");
    if (erasePairings) {
      ans = await rawCommand(`E${num2hexstr(dataObjects[0].address, 8)}#`, serialPort, 60000);
    } else {
      ans = await rawCommand(
        `E${num2hexstr(dataObjects[0].address, 8)},${num2hexstr(0x00072000 - dataObjects[0].address, 8)}#`,
        serialPort,
        60000,
      );
    }
    if (ans[0] !== 65) {
      log.info("answer to Erase command: ", String.fromCharCode.apply(null, ans));
      log.info(`RAW Command: ${`E${num2hexstr(dataObjects[0].address, 8)}#`}`);
      throw Error("error when Erasing");
    }

    // Close and reconnect after erase (Sonshi bootloader may reset)
    log.info("Closing serial port after erase...");
    try {
      serialPort.close();
    } catch (e) {
      log.warn("Error closing port after erase:", e);
    }

    // Wait for bootloader to stabilize
    log.info("Waiting for bootloader to stabilize...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Reconnect to bootloader
    log.info("Reconnecting to bootloader...");
    serialPort = await serialConnection();
    log.info("Reconnected successfully");

    let state = 1;
    const stateT = totalSaved / 4096;

    log.info("Starting flashing procedure", totalSaved, stateT);
    while (total > 0) {
      let bufferSize = total < PACKET_SIZE ? total : PACKET_SIZE;

      let buffer = new Buffer(bufferSize);

      let bufferTotal = 0;

      while (bufferTotal < bufferSize) {
        const currentHex = dataObjects[hexCount];

        if (bufferSize - currentHex.len < bufferTotal) {
          // break early, we cannot completely fill the buffer.
          bufferSize = bufferTotal;
          const t = buffer.slice(0, bufferTotal);
          buffer = t;
          break;
        }

        // log.info(buffer, bufferTotal, currentHex);
        for (let i = 0; i < currentHex.data.length; i += 1) {
          buffer.writeUInt8(currentHex.data[i], bufferTotal + i);
        }
        // new Uint8Array(buffer, bufferTotal, currentHex.len).set(
        //   currentHex.data
        // );

        hexCount += 1;
        bufferTotal += currentHex.len;
      }

      // tell the NRf52833 the size of data being sent.
      ans = await rawCommand(`U${num2hexstr(bufferSize, 8)}#`, serialPort, 1000);

      // write our data.
      noWaitCommand(buffer, serialPort);

      // copy N bytes to memory location Y -> W function.
      ans = await rawCommand(`W${num2hexstr(address, 8)},${num2hexstr(bufferSize, 8)}#`, serialPort, 1000);

      // Update External State
      stateUpdate("neuron", (state / stateT) * 100);
      state += 1;
      total -= bufferSize;
      address += bufferSize;
    }

    // log.info("Validating...");
    // ans = await rawCommand("V#", serialPort, 1000);
    // if (ans[0] !== 65) throw Error("error when Validating");

    // START APPLICATION
    ans = await rawCommand("F#", serialPort, 1000);
    if (ans[0] !== 65) log.warn("error when disconnecting");

    // DISCONNECT
    finished(undefined, true);
    serialPort.close();
  },
};

export default SonshiFlash;
