import { PaletteType } from "@Types/layout";
import { sanitizeIntensity } from "./sanitizeIntensity";
import { RGBW } from "./types";

/**
 * Convert a RGBW color to RGB
 * @param {RGBW} color - A RGBW color
 * @returns {RGB} - The color converted to RGB
 */
export function rgbw2b(color: RGBW): PaletteType {
  const sanitizedR = sanitizeIntensity(color.r);
  const sanitizedG = sanitizeIntensity(color.g);
  const sanitizedB = sanitizeIntensity(color.b);
  const sanitizedW = sanitizeIntensity(color.w);

  const r = sanitizeIntensity(sanitizedW + sanitizedR);
  const g = sanitizeIntensity(sanitizedW + sanitizedG);
  const b = sanitizeIntensity(sanitizedW + sanitizedB);

  return { r, g, b, rgb: `rgb(${r}, ${g}, ${b})` };
}
