import { app, nativeTheme } from "electron";
import { onThemeChange } from "./theme";
import { removeIPCs } from "./configureIPCs";
import Window from "../managers/Window";
import { isAppQuitting } from "../managers/AppLifecycle";

const onClose = () => {
  const window = Window.getWindow();
  window.on("closed", () => {
    nativeTheme.off("updated", onThemeChange);
    Window.setWindow(null);
    // configureIPCs() re-runs on the next createWindow(); drop the handlers so
    // they don't double-register. (window-all-closed can't be relied on for
    // this anymore: a live Lens overlay window keeps it from ever firing.)
    removeIPCs();
    // Same reason: with the overlay still alive the app would silently stay
    // running after the main window closes — quit explicitly (macOS keeps the
    // app in the dock as usual).
    if (process.platform !== "darwin" && !isAppQuitting()) {
      app.quit();
    }
  });
};

export default onClose;
