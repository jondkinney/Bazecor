import Store from "../../main/managers/Store";
import type { LensKeyboardRef, LensSettings, LensStoreState } from "../shared/types";

export const LENS_DEFAULTS: LensSettings = {
  enabled: false,
  opacity: 0.85,
  showUnderglow: false,
  layout: "us",
  layerNames: [],
  overlayMode: true,
  overlayAutoShow: true,
  hoverMode: false,
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function sanitizeLensSettings(s: Partial<LensSettings>): LensSettings {
  return {
    enabled: typeof s.enabled === "boolean" ? s.enabled : LENS_DEFAULTS.enabled,
    opacity: clamp(typeof s.opacity === "number" ? s.opacity : LENS_DEFAULTS.opacity, 0.1, 1.0),
    showUnderglow: typeof s.showUnderglow === "boolean" ? s.showUnderglow : LENS_DEFAULTS.showUnderglow,
    layout: typeof s.layout === "string" ? s.layout : LENS_DEFAULTS.layout,
    layerNames: Array.isArray(s.layerNames) ? s.layerNames : LENS_DEFAULTS.layerNames,
    overlayMode: typeof s.overlayMode === "boolean" ? s.overlayMode : LENS_DEFAULTS.overlayMode,
    overlayAutoShow: typeof s.overlayAutoShow === "boolean" ? s.overlayAutoShow : LENS_DEFAULTS.overlayAutoShow,
    hoverMode: typeof s.hoverMode === "boolean" ? s.hoverMode : LENS_DEFAULTS.hoverMode,
  };
}

function readState(): LensStoreState {
  const raw = Store.getStore().get("lens");
  return { ...sanitizeLensSettings(raw ?? {}), keyboard: raw?.keyboard, migratedFromStandalone: raw?.migratedFromStandalone };
}

function writeState(state: LensStoreState): void {
  Store.getStore().set("lens", state);
}

export function getLensSettings(): LensSettings {
  return sanitizeLensSettings(readState());
}

export function setLensSettings(updates: Partial<LensSettings>): LensSettings {
  const state = readState();
  const next: LensStoreState = { ...state, ...sanitizeLensSettings({ ...state, ...updates }) };
  writeState(next);
  return sanitizeLensSettings(next);
}

export function getLensKeyboard(): LensKeyboardRef | null {
  const kb = readState().keyboard;
  return kb && kb.backupFolder && kb.neuronID && kb.product ? kb : null;
}

export function setLensKeyboard(keyboard: LensKeyboardRef): void {
  writeState({ ...readState(), keyboard });
}

export function isLegacyLensMigrated(): boolean {
  return readState().migratedFromStandalone === true;
}

export function markLegacyLensMigrated(): void {
  writeState({ ...readState(), migratedFromStandalone: true });
}

export function getRunInBackground(): boolean {
  return Store.getStore().get("settings").runInBackground === true;
}

export function setRunInBackground(v: boolean): void {
  const settings = Store.getStore().get("settings");
  Store.getStore().set("settings", { ...settings, runInBackground: v });
}

/** True until the user (or the first lens enable) has ever set runInBackground. */
export function isRunInBackgroundUnset(): boolean {
  return Store.getStore().get("settings").runInBackground === undefined;
}
