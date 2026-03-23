import { VirtualType } from "@Renderer/types/virtual";
import DefyWireless from "./DefyWireless";

const SonseiWireless: VirtualType = {
  ...DefyWireless,
  device: {
    ...DefyWireless.device,
    info: {
      ...DefyWireless.device.info,
      product: "Sonsei",
      displayName: "Dygma Sonsei",
      urls: [
        {
          name: "Homepage",
          url: "https://www.dygma.com/sonsei/",
        },
      ],
    },
    usb: {
      ...DefyWireless.device.usb,
      productId: 0x0031,
    },
  },
};

export default SonseiWireless;
