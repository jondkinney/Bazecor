import { VirtualType } from "@Renderer/types/virtual";
import DefyWireless from "./DefyWireless";

const SonshiWireless: VirtualType = {
  ...DefyWireless,
  device: {
    ...DefyWireless.device,
    info: {
      ...DefyWireless.device.info,
      product: "Sonshi",
      displayName: "Dygma Sonshi",
      urls: [
        {
          name: "Homepage",
          url: "https://www.dygma.com/sonshi/",
        },
      ],
    },
    usb: {
      ...DefyWireless.device.usb,
      productId: 0x0031,
    },
  },
};

export default SonshiWireless;
