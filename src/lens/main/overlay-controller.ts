import { globalShortcut } from "electron";
import log from "electron-log/main";
import GlobalRecording from "../../main/managers/GlobalRecording";
import type { KeyboardModel, LensState } from "../shared/types";
import { OVERLAY_EVENT_TAP, OVERLAY_EVENT_HOLD, OVERLAY_EVENT_RELEASE, OVERLAY_EVENT_DOUBLE_TAP } from "../shared/constants";
import { RawHidListener } from "./raw-hid-listener";
import { getLensKeyboard, getLensSettings, setLensSettings } from "./lens-settings";
import { readLatestModel } from "./backup-reader";
import {
  broadcastSettings,
  createOverlayWindow,
  destroyOverlayWindow,
  hideOverlay,
  isOverlayVisible,
  overlayAlive,
  pushActiveLayer,
  pushModel,
  pushState,
  setOverlayShown,
  showOverlay,
  stopFade,
} from "./overlay-window";

const LAYER_CHANGE_AUTO_HIDE_MS = 3000;
const TOGGLE_SHORTCUT = "CommandOrControl+Alt+L";

class OverlayController {
  private hid = new RawHidListener();

  private hidWired = false;

  private enabled = false;

  // Master on/off the user can flip with the shortcut without disabling the
  // whole feature: while inactive the window stays hidden and HID overlay
  // gestures are ignored (mirrors standalone Lens's overlayActive flag).
  private overlayActive = false;

  private currentModel: KeyboardModel | null = null;

  private activeLayer = 0;

  private holdKeyActive = false;

  private layerAutoShowActive = false;

  private layerChangeHideTimer: ReturnType<typeof setTimeout> | null = null;

  isEnabled(): boolean {
    return this.enabled;
  }

  getState(): LensState {
    return {
      model: this.currentModel,
      activeLayer: this.activeLayer,
      configFound: getLensKeyboard() !== null,
    };
  }

  setEnabled(v: boolean): void {
    setLensSettings({ enabled: v });
    if (v) this.enable();
    else this.disable();
  }

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    log.info("[Lens] Enabling overlay");
    this.wireHidEvents();
    this.reloadModel(false);
    if (!overlayAlive()) {
      createOverlayWindow(() => {
        this.overlayActive = true;
        if (this.currentModel) {
          pushModel(this.currentModel);
          pushActiveLayer(this.activeLayer);
        }
        pushState(this.getState());
        broadcastSettings(getLensSettings());
      });
    }
    this.registerShortcut();
    this.hid.startWithRetry();
  }

  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    log.info("[Lens] Disabling overlay");
    globalShortcut.unregister(TOGGLE_SHORTCUT);
    this.clearLayerChangeHideTimer();
    this.holdKeyActive = false;
    this.layerAutoShowActive = false;
    this.overlayActive = false;
    this.hid.stop();
    destroyOverlayWindow();
  }

  /** Called on app quit. */
  shutdown(): void {
    globalShortcut.unregister(TOGGLE_SHORTCUT);
    this.clearLayerChangeHideTimer();
    stopFade();
    this.hid.stop();
  }

  /**
   * Re-reads the newest backup for the stored keyboard and pushes it to the
   * overlay. Called at startup and every time Bazecor saves a backup.
   */
  reloadModel(push = true): void {
    const keyboard = getLensKeyboard();
    if (!keyboard) return;
    const model = readLatestModel(keyboard);
    if (!model) return;
    this.currentModel = model;
    this.activeLayer = model.defaultLayer;
    if (push) {
      pushModel(model);
      pushActiveLayer(this.activeLayer);
    }
  }

  toggleOverlay(): void {
    if (!this.enabled || !overlayAlive()) return;
    this.overlayActive = !this.overlayActive;
    setOverlayShown(this.overlayActive);
  }

  private registerShortcut(): void {
    if (globalShortcut.isRegistered(TOGGLE_SHORTCUT)) return;
    globalShortcut.register(TOGGLE_SHORTCUT, () => {
      // Don't fire while a macro is being recorded (uiohook is capturing keys).
      if (GlobalRecording.getInstance().getRecording()) return;
      this.toggleOverlay();
    });
  }

  private wireHidEvents(): void {
    if (this.hidWired) return;
    this.hidWired = true;

    this.hid.on("layer-change", ({ layer }) => {
      this.activeLayer = layer;
      pushActiveLayer(layer);
      const defaultLayer = this.currentModel?.defaultLayer ?? 0;
      if (layer === defaultLayer) {
        this.onLayerChangeRelease();
      } else {
        this.onLayerChangeAutoShow();
      }
    });

    this.hid.on("overlay", ({ eventType }) => {
      if (eventType === OVERLAY_EVENT_TAP) {
        this.onOverlayTapAction();
      } else if (eventType === OVERLAY_EVENT_HOLD) {
        this.onOverlayHoldStart();
      } else if (eventType === OVERLAY_EVENT_RELEASE) {
        this.onOverlayHoldEnd();
      } else if (eventType === OVERLAY_EVENT_DOUBLE_TAP) {
        log.verbose("[Lens] DOUBLE_TAP event ignored (double-tap action removed)");
      }
    });

    this.hid.on("overlay-tap", ({ eventType }) => {
      if (eventType === OVERLAY_EVENT_TAP) this.onOverlayTapAction();
    });

    this.hid.on("overlay-hold", ({ eventType }) => {
      if (eventType === OVERLAY_EVENT_HOLD) this.onOverlayHoldStart();
      else if (eventType === OVERLAY_EVENT_RELEASE) this.onOverlayHoldEnd();
    });
  }

  private clearLayerChangeHideTimer(): void {
    if (this.layerChangeHideTimer) {
      clearTimeout(this.layerChangeHideTimer);
      this.layerChangeHideTimer = null;
    }
  }

  // Shared handlers for the overlay TAP / HOLD gesture, regardless of whether it
  // originates from the OVERLAY_KEY superkey (eventType-based) or a dedicated
  // OVERLAY_TAP / OVERLAY_HOLD key (its own packet type).
  private onOverlayTapAction(): void {
    if (!this.overlayActive || !overlayAlive()) return;
    this.clearLayerChangeHideTimer();
    this.layerAutoShowActive = false;
    log.verbose(`[Lens] TAP action → toggling visibility (currently ${isOverlayVisible() ? "visible" : "hidden"})`);
    if (isOverlayVisible()) hideOverlay();
    else showOverlay();
  }

  private onOverlayHoldStart(): void {
    if (!this.overlayActive || !overlayAlive()) return;
    if (isOverlayVisible()) {
      log.verbose("[Lens] HOLD start ignored (Lens already visible)");
      return;
    }
    this.clearLayerChangeHideTimer();
    this.layerAutoShowActive = false;
    this.holdKeyActive = true;
    showOverlay();
  }

  private onOverlayHoldEnd(): void {
    if (!this.holdKeyActive) return;
    this.holdKeyActive = false;
    this.clearLayerChangeHideTimer();
    hideOverlay();
  }

  private onLayerChangeAutoShow(): void {
    if (!this.overlayActive || !overlayAlive()) return;
    if (!getLensSettings().overlayAutoShow) return;
    if (isOverlayVisible()) {
      // Already visible for some other reason (e.g. a manual TAP) — leave it alone.
      // Only Lens' own layer-change auto-show is allowed to auto-hide on release.
      return;
    }
    this.layerAutoShowActive = true;
    showOverlay();
    // Fallback in case the layer never reverts to the default layer (e.g. a locked
    // layer switch instead of a momentary hold) — don't leave Lens on screen forever.
    this.clearLayerChangeHideTimer();
    this.layerChangeHideTimer = setTimeout(() => {
      this.layerChangeHideTimer = null;
      this.layerAutoShowActive = false;
      hideOverlay();
    }, LAYER_CHANGE_AUTO_HIDE_MS);
  }

  // A layer-change back to the model's default (resting) layer is the release of
  // whatever momentary layer-shift key caused the earlier change — hide right away
  // instead of waiting out the fallback timeout, but only if we're the ones who
  // showed it (don't clobber a window the user opened some other way).
  private onLayerChangeRelease(): void {
    this.clearLayerChangeHideTimer();
    if (!this.layerAutoShowActive) return;
    this.layerAutoShowActive = false;
    hideOverlay();
  }
}

export const overlayController = new OverlayController();
