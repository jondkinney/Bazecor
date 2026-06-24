import fs from "fs";
import path from "path";
import os from "os";
import log from "electron-log";

const LENS_CONFIG_PATH = path.join(os.homedir(), ".lens", "lens-config.json");
const LENS_CONFIG_VERSION = "1.0";

export interface LensConfigPayload {
  backupFolder: string;
  neuronID: string;
  product: string;
}

export function writeLensConfig(payload: LensConfigPayload): void {
  const config = {
    version: LENS_CONFIG_VERSION,
    keyboard: {
      backupFolder: payload.backupFolder,
      neuronID: payload.neuronID,
      product: payload.product,
    },
    overlay: {},
    display: {},
  };

  try {
    const dir = path.dirname(LENS_CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LENS_CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
    log.info(`[lens-bridge] Wrote lens config to ${LENS_CONFIG_PATH}`);
  } catch (err) {
    log.error("[lens-bridge] Failed to write lens config:", err);
  }
}
