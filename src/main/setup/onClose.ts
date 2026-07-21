import { app, nativeTheme } from "electron";
import { onThemeChange } from "./theme";
import { removeIPCs } from "./configureIPCs";
import Window from "../managers/Window";
import { isAppQuitting } from "../managers/AppLifecycle";
import { getRunInBackground } from "../../lens/main/lens-settings";

const onClose = () => {
  const window = Window.getWindow();
  window.on("closed", () => {
    nativeTheme.off("updated", onThemeChange);
    Window.setWindow(null);
    // configureIPCs() re-runs on the next createWindow(); drop the handlers so
    // they don't double-register. (window-all-closed can't be relied on for
    // this anymore: a live Lens overlay window keeps it from ever firing.)
    removeIPCs();
    // Background mode: keep the process alive (tray + Lens overlay only) without
    // the configurator's window/renderer. Otherwise quit explicitly — with the
    // overlay still alive the app would silently stay running after the main
    // window closes (macOS keeps the app in the dock as usual either way).
    if (process.platform !== "darwin" && !isAppQuitting() && !getRunInBackground()) {
      app.quit();
    }
  });
};

export default onClose;
