import { expect, describe, it } from "vitest";
import { parsePaletteRaw } from "./palette";

describe("parsePaletteRaw", () => {
  it("should parse RGB data", () => {
    expect(parsePaletteRaw("10 20 30", false)).toEqual([{ r: 10, g: 20, b: 30, rgb: "rgb(10, 20, 30)" }]);
  });

  it("should parse RGBW data", () => {
    expect(parsePaletteRaw("10 20 30 40", true)).toEqual([{ r: 50, g: 60, b: 70, rgb: "rgb(50, 60, 70)" }]);
  });

  it("should normalize numbers data", () => {
    expect(parsePaletteRaw("-10 400 10", true)).toEqual([{ r: 0, g: 255, b: 10, rgb: "rgb(0, 255, 10)" }]);
  });

  it("should make a best effort to parse RGB data with the incorrect number of colors", () => {
    expect(parsePaletteRaw("10 20 30 40 50", false)).toEqual([
      { r: 10, g: 20, b: 30, rgb: "rgb(10, 20, 30)" },
      { r: 40, g: 50, b: 0, rgb: "rgb(40, 50, 0)" },
    ]);
  });

  it("should make a best effort to parse RGBW data with the incorrect number of colors", () => {
    expect(parsePaletteRaw("10 20 30 40 50", true)).toEqual([
      { r: 50, g: 60, b: 70, rgb: "rgb(50, 60, 70)" },
      { r: 50, g: 0, b: 0, rgb: "rgb(50, 0, 0)" },
    ]);
  });

  it("should not care about extra whitespace", () => {
    expect(parsePaletteRaw("  10   20 30  40  ", true)).toEqual([{ r: 50, g: 60, b: 70, rgb: "rgb(50, 60, 70)" }]);
  });
});
