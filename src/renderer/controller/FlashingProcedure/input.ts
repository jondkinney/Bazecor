import log from "electron-log/renderer";
import { BackupType } from "@Renderer/types/backups";
import { State } from "src/api/comms/Device";
import { DygmaDeviceType } from "@Renderer/types/dygmaDefs";
import { validateSonshiKeyscannerSeal } from "../../../api/flash/validateSonshiSeal";
import type * as Context from "./context";

export interface InputType {
  readonly deviceState: State;
  readonly device: DygmaDeviceType;
  readonly firmwares: {
    fw: any;
    fwSides: any;
  };
  readonly backup: BackupType;
  readonly isUpdated: boolean;
  readonly RaiseBrightness: string;
  readonly sideLeftOk: boolean;
  readonly sideLeftBL: boolean;
  readonly sideRightOK: boolean;
  readonly sideRightBL: boolean;
  readonly stateUpdate: (data: {
    type: string;
    data: {
      globalProgress: number;
      leftProgress: number;
      rightProgress: number;
      resetProgress: number;
      neuronProgress: number;
      restoreProgress: number;
    };
  }) => void;
}

export const Input = async (input: InputType): Promise<Context.ContextType> => {
  // Validate Sonshi Keyscanner firmware SEAL BEFORE starting the flash process
  // This only applies to Sonshi keyboards - other keyboards (Raise, Raise2, Defy) don't use SEAL
  // The SEAL is in the Keyscanner firmware (fwSides), not the Neuron firmware (fw)
  if (input.device.info.product === "Sonshi" && input.firmwares?.fwSides) {
    log.info("Detected Sonshi keyboard - validating Keyscanner firmware SEAL before flashing...");
    
    const validationResult = validateSonshiKeyscannerSeal(input.firmwares.fwSides);
    
    if (!validationResult.valid) {
      log.error("Sonshi Keyscanner firmware SEAL validation failed:", validationResult.error);
      throw new Error(`Invalid Sonshi Keyscanner firmware: ${validationResult.error}`);
    }
    
    log.info("✓ Sonshi Keyscanner firmware SEAL validation passed - safe to proceed with flashing");
    
    // TODO: Add Neuron firmware validation when SEAL is implemented for Neuron
    // if (input.firmwares?.fw) {
    //   const neuronValidation = validateSonshiNeuronSeal(input.firmwares.fw);
    //   if (!neuronValidation.valid) {
    //     throw new Error(`Invalid Sonshi Neuron firmware: ${neuronValidation.error}`);
    //   }
    // }
  }

  const result: Context.ContextType = {
    stateblock: 0,
    deviceState: input.deviceState,
    device: input.device,
    originalDevice: input.deviceState.currentDevice,
    error: undefined,
    firmwares: input.firmwares,
    backup: input.backup,
    isUpdated: input.isUpdated,
    RaiseBrightness: input.RaiseBrightness,
    sideLeftOk: input.sideLeftOk,
    sideLeftBL: input.sideLeftBL,
    sideRightOK: input.sideRightOK,
    sideRightBL: input.sideRightBL,
    loadedComms: true,
    globalProgress: 0,
    leftProgress: 0,
    rightProgress: 0,
    resetProgress: 0,
    neuronProgress: 0,
    restoreProgress: 0,
    retriesRight: 0,
    retriesLeft: 0,
    retriesNeuron: 0,
    retriesDefyWired: 0,
    erasePairings: true,
    restoreResult: undefined,
    rightResult: undefined,
    leftResult: undefined,
    resetResult: undefined,
    flashResult: undefined,
    DeviceVariant: undefined,
    flashRaise: undefined,
    flashDefyWireless: undefined,
    flashSides: undefined,
    bootloader: undefined,
    comPath: undefined,
    stateUpdate: input.stateUpdate,
  };

  return result;
};
