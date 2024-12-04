import { PaletteType } from "@Types/layout";
import { rgbw2b } from "../color";
import { parseAndGroupByCount } from "./parseAndGroupByCount";

/**
 * Converts a string of space delimited numbers from 0-255 representing R, G, B and possibly W channels to an array of PaletteType objects.
 * If any number is less than 0, it will be changed to 0. If any number is greater than 255, it will be changed to 255.
 * If there is are not enough numbers in the string to complete the last color, any missing values will be filled with 0.
 *
 * Examples:
 *   RGB string of "10 20 30" => { r: 10, g: 20, b: 30, rgb: "rgb(10, 20, 30)" }
 *   RGB string of "10" => { r: 10, g: 0, b: 0, rgb: "rgb(10, 0, 0)" }
 *   RGB string of "1000" => { r: 255, g: 0, b: 0, rgb: "rgb(255, 0, 0)" }
 *
 * @param palette Space delimited string of numbers whose values are [0-255]
 * @param isRGBW If true then 4 numbers will be used to create one PaletteType with RGBW color specified, otherwise 3 numbers will be used as the RGB color.
 */
export function parsePaletteRaw(palette: string, isRGBW: boolean): PaletteType[] {
  return parseAndGroupByCount(palette, isRGBW ? 4 : 3, 0, 255).map(colorArray => {
    if (isRGBW) {
      const [r,g,b,w] = colorArray;
      return rgbw2b({ r, g, b, w });
    } else {
      const [r,g,b] = colorArray;
      return { r, g, b, rgb: `rgb(${r}, ${g}, ${b})` };
    }
  });
}
