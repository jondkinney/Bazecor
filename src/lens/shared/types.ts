export interface PaletteColor {
  r: number;
  g: number;
  b: number;
  w: number;
  rgb: string;
}

export interface KeyboardModel {
  /** Bazecor product name this model was parsed from (e.g. "Sonsei", "Defy").
   * Drives which keyboard geometry the renderer draws. */
  product: string;
  keymap: number[][];
  palette: PaletteColor[];
  colormap: number[][];
  defaultLayer: number;
  superkeys: number[][];
  superkeyNames: string[];
  macroNames: string[];
  layerNames: string[];
}

/** Reference to the backup folder Lens reads the keyboard model from. */
export interface LensKeyboardRef {
  backupFolder: string;
  neuronID: string;
  product: string;
}

export interface LensSettings {
  enabled: boolean;
  opacity: number;
  showUnderglow: boolean;
  layout: string;
  layerNames: string[];
  overlayMode: boolean;
  overlayAutoShow: boolean;
  hoverMode: boolean;
}

/** Shape of the `lens` key persisted in Bazecor's electron-store. */
export interface LensStoreState extends LensSettings {
  /** Legacy single-keyboard ref (Sonsei-only Lens). Kept for one-time migration
   * into `keyboards`; new code writes/reads `keyboards`. */
  keyboard?: LensKeyboardRef;
  /** Per-product backup refs, keyed by Bazecor product name ("Sonsei", "Defy", …).
   * Lens reads the ref for whichever keyboard is currently the active device. */
  keyboards?: Record<string, LensKeyboardRef>;
  migratedFromStandalone?: boolean;
}

export interface LensState {
  model: KeyboardModel | null;
  activeLayer: number;
  configFound: boolean;
  /** Product name of the keyboard currently driving the overlay (last connected),
   * or null when none is active. */
  activeProduct: string | null;
  /** macOS only: the raw HID device exists but opening it was blocked by TCC
   * (Input Monitoring permission not granted to Bazecor). */
  hidPermissionDenied: boolean;
}

export interface DecodedKey {
  primary: string;
  hold: string;
  subtitle?: string; // second line at same size as primary (superkey name, macro name)
  modifiers?: string[]; // modifier tag boxes shown at bottom
}
