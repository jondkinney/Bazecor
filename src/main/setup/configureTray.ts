import { app, Menu, nativeImage, Tray } from "electron";
import fs from "fs";
import os from "os";
import path from "path";
import log from "electron-log/main";
import Window from "../managers/Window";
import createWindow from "../createWindow";
import { markAppQuitting } from "../managers/AppLifecycle";
import { getRunInBackground, setRunInBackground } from "../../lens/main/lens-settings";
import { overlayController } from "../../lens/main/overlay-controller";

let tray: Tray | null = null;

export function openMainWindow(): void {
  const win = Window.getWindow();
  if (win && !win.isDestroyed()) {
    win.show();
    win.focus();
  } else {
    createWindow();
  }
}

function createTray(): void {
  if (tray) return;
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "logo.png")
    : path.join(app.getAppPath(), "build", "logo.png");
  let icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {
    log.warn("[Tray] Icon not found at", iconPath);
  } else {
    icon = icon.resize({ width: 16, height: 16 });
  }
  tray = new Tray(icon);
  tray.setToolTip("Bazecor");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Open Bazecor", click: () => openMainWindow() },
      { label: "Toggle Lens overlay (Ctrl+Alt+L)", click: () => overlayController.toggleOverlay() },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          markAppQuitting();
          app.quit();
        },
      },
    ]),
  );
  tray.on("double-click", () => openMainWindow());
}

function destroyTray(): void {
  tray?.destroy();
  tray = null;
}

const LINUX_AUTOSTART_FILE = path.join(os.homedir(), ".config", "autostart", "bazecor.desktop");

function applyLoginItem(enabled: boolean): void {
  // In dev process.execPath is the bare electron binary — don't register that.
  if (!app.isPackaged) return;
  if (process.platform === "linux") {
    try {
      if (enabled) {
        fs.mkdirSync(path.dirname(LINUX_AUTOSTART_FILE), { recursive: true });
        fs.writeFileSync(
          LINUX_AUTOSTART_FILE,
          `[Desktop Entry]\nType=Application\nName=Bazecor\nExec=${process.execPath} --hidden\nX-GNOME-Autostart-enabled=true\n`,
        );
      } else {
        fs.rmSync(LINUX_AUTOSTART_FILE, { force: true });
      }
    } catch (err) {
      log.warn("[Tray] Failed to update Linux autostart entry:", err);
    }
  } else if (process.platform === "win32") {
    // Squirrel installs the app under a versioned app-x.y.z folder that changes on
    // every update; registering through Update.exe --processStart keeps the login
    // item valid across updates.
    const updateExe = path.resolve(path.dirname(process.execPath), "..", "Update.exe");
    const exeName = path.basename(process.execPath);
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: updateExe,
      args: ["--processStart", `"${exeName}"`, "--process-start-args", `"--hidden"`],
    });
  } else {
    app.setLoginItemSettings({ openAtLogin: enabled, openAsHidden: true });
  }
}

/** Persists the run-in-background setting and applies its side effects (tray + login item). */
export function applyRunInBackground(v: boolean): void {
  setRunInBackground(v);
  if (v) createTray();
  else destroyTray();
  applyLoginItem(v);
}

const configureTray = () => {
  app.on("before-quit", () => {
    markAppQuitting();
  });
  if (getRunInBackground()) {
    createTray();
    applyLoginItem(true);
  }
};

export default configureTray;
