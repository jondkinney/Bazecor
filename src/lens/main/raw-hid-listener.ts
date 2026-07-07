import { EventEmitter } from "events";
import log from "electron-log/main";
import {
  SONSEI_VENDOR_ID,
  SONSEI_PRODUCT_ID,
  OVERLAY_MAGIC_BYTE,
  OVERLAY_PACKET_SIZE,
  PACKET_TYPE_OVERLAY,
  PACKET_TYPE_LAYER,
  PACKET_TYPE_OVERLAY_TAP,
  PACKET_TYPE_OVERLAY_HOLD,
  SONSEI_RAW_HID_REPORT_ID,
} from "../shared/constants";

export interface OverlayEvent {
  type: "overlay";
  eventType: number;
}

export interface OverlayTapEvent {
  type: "overlay-tap";
  eventType: number;
}

export interface OverlayHoldEvent {
  type: "overlay-hold";
  eventType: number;
}

export interface LayerEvent {
  type: "layer";
  layer: number;
}

type RawHidEvents = {
  overlay: [event: OverlayEvent];
  "overlay-tap": [event: OverlayTapEvent];
  "overlay-hold": [event: OverlayHoldEvent];
  "layer-change": [event: LayerEvent];
  connected: [];
  disconnected: [];
  /** macOS: the device is plugged in but TCC blocked the open (Input Monitoring
   * not granted). Fired on every failed retry; consumers must dedupe. */
  "permission-denied": [];
};

const RECONNECT_INTERVAL_MS = 2000;

const DEBOUNCE_MS: Record<number, number> = {
  0x00: 80, // RELEASE
  0x01: 150, // TAP
  0x02: 150, // HOLD
  0x03: 400, // DOUBLE_TAP
};
const DEFAULT_DEBOUNCE_MS = 150;

export class RawHidListener extends EventEmitter<RawHidEvents> {
  private device: import("node-hid").HID | null = null;
  private running = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastEventTime: Record<string, number> = {};

  // Debounces per (source, eventType) pair so bouncy/duplicate packets from a
  // single physical press can't fire the same handler twice in quick succession.
  private shouldEmit(source: string, eventType: number): boolean {
    const key = `${source}:${eventType}`;
    const now = Date.now();
    const debounce = DEBOUNCE_MS[eventType] ?? DEFAULT_DEBOUNCE_MS;
    const last = this.lastEventTime[key] ?? 0;
    if (now - last < debounce) {
      log.verbose(`[Lens/HID] ${source} eventType=0x${eventType.toString(16)} debounced (${now - last}ms < ${debounce}ms)`);
      return false;
    }
    this.lastEventTime[key] = now;
    return true;
  }

  async start(): Promise<void> {
    try {
      const HID = await import("node-hid");
      const devices = HID.devices();
      const target = devices.find(
        d => d.vendorId === SONSEI_VENDOR_ID && d.productId === SONSEI_PRODUCT_ID && d.usagePage === 0xff00 && d.usage === 0x01,
      );
      if (!target || !target.path) {
        log.verbose(
          `[Lens/HID] Device not found (VID=0x${SONSEI_VENDOR_ID.toString(16)} PID=0x${SONSEI_PRODUCT_ID.toString(16)} usagePage=0xff00 usage=0x01)`,
        );
        return;
      }
      try {
        this.device = new HID.HID(target.path);
      } catch (openErr) {
        // The device is enumerable but won't open. On macOS the raw HID collection
        // lives on an IOHIDDevice that also exposes keyboard usages, so TCC blocks
        // IOHIDDeviceOpen until the user grants Bazecor the Input Monitoring
        // permission — by far the most likely cause of this failure on darwin.
        // (The failed attempt also makes macOS add Bazecor to the Input Monitoring
        // list in System Settings, so the user only has to flip the toggle.)
        if (process.platform === "darwin") {
          log.warn(`[Lens/HID] Open blocked (Input Monitoring permission missing?): ${openErr}`);
          this.emit("permission-denied");
        } else {
          log.warn(`[Lens/HID] Cannot open device: ${openErr}`);
        }
        return;
      }
      log.info(`[Lens/HID] Device opened: ${target.path}`);
      this.running = true;
      this.emit("connected");
      this.device.on("data", (buf: Buffer) => this.onData(buf));
      this.device.on("error", () => {
        this.device = null;
        this.running = false;
        this.emit("disconnected");
        log.info("[Lens/HID] Device disconnected, scheduling reconnect...");
        this.scheduleReconnect();
      });
    } catch (err) {
      log.warn("[Lens/HID] start() error:", err);
    }
  }

  isConnected(): boolean {
    return this.running;
  }

  /** Keeps retrying until the device shows up (used when Lens is enabled before plugging in). */
  startWithRetry(): void {
    this.start().then(() => {
      if (!this.running) this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      await this.start();
      if (!this.running) this.scheduleReconnect();
    }, RECONNECT_INTERVAL_MS);
  }

  private onData(buf: Buffer): void {
    if (buf.length < OVERLAY_PACKET_SIZE) return;

    // USB HID prepends the report ID at buf[0]; BLE HID does not.
    const base = buf[0] === SONSEI_RAW_HID_REPORT_ID ? 1 : 0;
    if (buf[base] !== OVERLAY_MAGIC_BYTE) return;

    const packetType = buf[base + 1];

    if (packetType === PACKET_TYPE_OVERLAY) {
      const eventType = buf[base + 2];
      if (!this.shouldEmit("overlay", eventType)) return;
      log.verbose(`[Lens/HID] overlay (OVERLAY_KEY superkey): eventType=0x${eventType.toString(16)}`);
      this.emit("overlay", { type: "overlay", eventType });
    } else if (packetType === PACKET_TYPE_OVERLAY_TAP) {
      const eventType = buf[base + 2];
      if (!this.shouldEmit("overlay-tap", eventType)) return;
      log.verbose(`[Lens/HID] overlay-tap (OVERLAY_TAP key): eventType=0x${eventType.toString(16)}`);
      this.emit("overlay-tap", { type: "overlay-tap", eventType });
    } else if (packetType === PACKET_TYPE_OVERLAY_HOLD) {
      const eventType = buf[base + 2];
      if (!this.shouldEmit("overlay-hold", eventType)) return;
      log.verbose(`[Lens/HID] overlay-hold (OVERLAY_HOLD key): eventType=0x${eventType.toString(16)}`);
      this.emit("overlay-hold", { type: "overlay-hold", eventType });
    } else if (packetType === PACKET_TYPE_LAYER) {
      log.verbose(`[Lens/HID] layer-change: layer=${buf[base + 2]}`);
      this.emit("layer-change", { type: "layer", layer: buf[base + 2] });
    }
  }

  stop(): void {
    this.running = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    try {
      this.device?.close();
    } catch {
      // ignore
    }
    this.device = null;
  }
}
