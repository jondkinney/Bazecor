/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-buffer-constructor */
/* eslint-disable no-await-in-loop */
/* bazecor-flash-sonsei -- Dygma Sonsei flash helper for Bazecor
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
import { parseSealFromBinary } from "../parseSeal";

const PACKET_SIZE = 4096;
const FIRST_SECTOR_SIZE = 4096;

const TYPE_DAT = 0x00;
const TYPE_ESA = 0x02;
const TYPE_ELA = 0x04;

let serialPort;

/**
 * Object NRf52833 with flash method for Sonsei.
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
    lines: string[] | Uint8Array,
    stateUpdate: (arg0: string, arg1: number) => void,
    finished: (err: Error, result: unknown) => void,
    erasePairings: boolean,
  ) => {
    const dataObjects: HexType[] = [];
    let total = 0;
    let mergedArray: Uint8Array;
    let totalSaved: number;
    let hexCount = 0;
    let address: number;
    let isBinaryInput = false;

    // Check if input is binary (Uint8Array) or hex (string[])
    if (lines instanceof Uint8Array) {
      // Binary input (.bin file) - skip first 4KB sector (SEAL) and split application into chunks
      log.info("Processing binary firmware file (.bin)");
      mergedArray = lines;
      totalSaved = mergedArray.length;
      
      // Parse SEAL to get program_start address (the actual flash address for the application)
      const sealForAddress = parseSealFromBinary(mergedArray.slice(0, 32));
      const baseAddress = sealForAddress.program_start;
      
      // The first FIRST_SECTOR_SIZE bytes contain the SEAL sector - skip it
      // Only flash the application data starting after the SEAL sector
      const appData = mergedArray.slice(FIRST_SECTOR_SIZE);
      const CHUNK_SIZE = 16; // Match typical hex record size
      let offset = 0;
      while (offset < appData.length) {
        const chunkLen = Math.min(CHUNK_SIZE, appData.length - offset);
        dataObjects.push({
          str: "",
          len: chunkLen,
          address: baseAddress + offset,
          type: TYPE_DAT,
          data: appData.slice(offset, offset + chunkLen),
        });
        total += chunkLen;
        offset += chunkLen;
      }
      address = dataObjects[0].address;
      isBinaryInput = true;
      log.info(`Binary: skipped ${FIRST_SECTOR_SIZE} bytes SEAL sector, application size: ${appData.length}, start address: 0x${baseAddress.toString(16)}`);
    } else {
      // Hex input (.hex file) - parse as before
      log.info("Processing hex firmware file (.hex)");
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

        if (hex.type === TYPE_DAT) {
          total += hex.len;
          if (segment > 0) hex.address += segment;
          if (linear > 0) hex.address += linear;
          auxData.push(hex.data);
          dataObjects.push(hex);
        }
      }

      let ArrLenght = 0;
      auxData.forEach(item => {
        ArrLenght += item.length;
      });
      mergedArray = new Uint8Array(ArrLenght);
      let offset = 0;
      auxData.forEach(item => {
        mergedArray.set(item, offset);
        offset += item.length;
      });

      totalSaved = total;
      address = dataObjects[0].address;
    }

    // SEAL validation is done in input.ts before flashing starts.
    // Here we only parse the SEAL to extract values needed for the flash process.
    const embeddedSeal = parseSealFromBinary(mergedArray.slice(0, 32));
    log.info("Neuron firmware SEAL:", embeddedSeal);
    
    const programDataSize = embeddedSeal.program_size;
    const programData = mergedArray.slice(FIRST_SECTOR_SIZE, FIRST_SECTOR_SIZE + programDataSize);
    const calculatedProgramCrc = crc32("CRC-32", new Buffer(programData));

    // Prepare connection
    serialPort = await serialConnection();

    // GET INFO from device
    const info = (await rawCommand("I#", serialPort, 1000)) as InfoType;
    log.info("Result of sending I#: ", info);

    // Neuron Sonshi uses SEAL version 2 (with device_id) same as Keyscanner
    const sealData: SealType = {
      bldr_seal_header_t: {
        version: 2,
        size: 32,
        crc: 0,
      },
      device_id: embeddedSeal.device_id,
      program_start: info.program_space_start,
      program_size: programDataSize,
      program_crc: calculatedProgramCrc,
      program_version: embeddedSeal.program_version,
    };

    const newSeal = SealWithCRC(sealData);
    const sealSize = sealData.bldr_seal_header_t.size;

    // SEAL to device
    log.info("sending SEAL");
    let ans: Buffer = await rawCommand(`S${num2hexstr(sealSize, 8)}#`, serialPort, 1000);
    if (ans[0] !== 65) {
      log.info("answer to Seal size: ", String.fromCharCode.apply(null, ans));
      log.info(`RAW Command: S${num2hexstr(sealSize, 8)}#`);
      throw Error("error when sending SEAL size");
    }
    ans = await rawCommand(newSeal, serialPort, 1000);
    if (ans[0] !== 65) {
      log.info("answer to Seal data: ", String.fromCharCode.apply(null, ans));
      log.info(`RAW Command: ${newSeal}`);
      throw Error("error when sending SEAL data");
    }

    // ERASE device - always erase from program_space_start (includes SEAL sector)
    const eraseAddress = info.program_space_start;
    log.info("Erasing from address:", `0x${eraseAddress.toString(16)}`);
    
    // Start simulated progress for erase operation
    const ERASE_DURATION = 30000; // 30 seconds
    const PROGRESS_INTERVAL = 300; // Update every 300ms
    const totalSteps = ERASE_DURATION / PROGRESS_INTERVAL;
    let currentStep = 0;
    
    // Create promise for erase operation
    const erasePromise = erasePairings
      ? rawCommand(`E${num2hexstr(eraseAddress, 8)}#`, serialPort, 60000)
      : rawCommand(
          `E${num2hexstr(eraseAddress, 8)},${num2hexstr(0x00072000 - eraseAddress, 8)}#`,
          serialPort,
          60000,
        );
    
    // Start progress simulation (0% to 50% for erase)
    const progressInterval = setInterval(() => {
      currentStep += 1;
      const progress = Math.min(49.5, (currentStep / totalSteps) * 50); // Cap at 49.5% until erase completes
      stateUpdate("neuron", progress);
    }, PROGRESS_INTERVAL);
    
    // Wait for erase to complete
    try {
      ans = await erasePromise;
      clearInterval(progressInterval);
      stateUpdate("neuron", 50); // Set to 50% when erase completes
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
    
    if (ans[0] !== 65) {
      log.info("answer to Erase command: ", String.fromCharCode.apply(null, ans));
      log.info(`RAW Command: ${`E${num2hexstr(eraseAddress, 8)}#`}`);
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

    // Progress continues from 50% for write phase (no reset)

    let state = 1;
    const stateT = totalSaved / 4096;

    // Remove SEAL from firmware data - only for hex input
    // For binary input, the SEAL sector was already skipped during chunk creation
    if (!isBinaryInput) {
      log.info("Removing SEAL from firmware data before flashing...");
      const SEAL_SIZE = 32;
      
      // Skip the first 32 bytes (SEAL) from the first data object
      if (dataObjects[0].data.length >= SEAL_SIZE) {
        const originalData = dataObjects[0].data;
        dataObjects[0].data = originalData.slice(SEAL_SIZE);
        dataObjects[0].len -= SEAL_SIZE;
        dataObjects[0].address += SEAL_SIZE;
        total -= SEAL_SIZE;
        log.info(`Removed ${SEAL_SIZE} bytes of SEAL. New total: ${total}`);
      } else {
        log.warn("First data object is smaller than SEAL size, skipping SEAL removal");
      }
    } else {
      log.info("Binary input: SEAL sector already skipped during processing");
    }
    
    log.info("Starting flashing procedure", total, total / 4096);
    const totalInitial = total; // Save initial total for progress calculation
    const adjustedStateT = totalInitial / 4096;
    state = 1;
    
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

      // Update External State (50% to 100% for write phase)
      stateUpdate("neuron", 50 + (state / adjustedStateT) * 50);
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
