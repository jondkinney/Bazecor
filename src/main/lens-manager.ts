/* Bazecor
 * Copyright (C) 2024  DygmaLab SE.
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { app } from "electron";
import log from "electron-log/main";

const PID_FILE = path.join(os.homedir(), ".lens", "lens.pid");

export function getLensPath(): string {
  if (process.env.LENS_DEV_PATH) {
    log.info("[LensManager] Using LENS_DEV_PATH:", process.env.LENS_DEV_PATH);
    return process.env.LENS_DEV_PATH;
  }
  const base = app.isPackaged
    ? path.join(process.resourcesPath, "lens")
    : path.join(app.getAppPath(), "src", "lens-bin"); // Dev mode: getAppPath() is the Bazecor project root.
  if (process.platform === "win32") return path.join(base, "dygma-lens.exe");
  // On macOS Lens ships as a .app bundle (not a bare binary); the real Mach-O executable
  // lives inside it, alongside the Resources/Frameworks it needs to run standalone.
  if (process.platform === "darwin") return path.join(base, "Dygma Lens.app", "Contents", "MacOS", "dygma-lens");
  return path.join(base, "dygma-lens");
}

export function isLensRunning(): boolean {
  try {
    const raw = fs.readFileSync(PID_FILE, "utf-8").trim();
    const pid = parseInt(raw, 10);
    if (isNaN(pid)) return false;
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function startLens(): void {
  if (isLensRunning()) {
    log.info("[LensManager] Lens already running, skipping spawn.");
    return;
  }
  const lensPath = getLensPath();
  if (!fs.existsSync(lensPath)) {
    log.warn("[LensManager] Lens executable not found at:", lensPath);
    return;
  }
  log.info("[LensManager] Spawning Lens from:", lensPath);
  const child = spawn(lensPath, [], {
    detached: true,
    stdio: "ignore",
    cwd: path.dirname(lensPath),
  });
  child.unref();
}

export function stopLens(): void {
  try {
    const raw = fs.readFileSync(PID_FILE, "utf-8").trim();
    const pid = parseInt(raw, 10);
    if (isNaN(pid)) return;
    log.info("[LensManager] Sending SIGTERM to Lens PID:", pid);
    process.kill(pid, "SIGTERM");
  } catch {
    log.info("[LensManager] Lens was not running.");
  }
}
