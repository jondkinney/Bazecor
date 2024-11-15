import { expect, describe, it } from "vitest";
import { parseColormapRaw } from "./colormap";

describe("parseColormapRaw", () => {
  it("should split into groups", () => {
    expect(parseColormapRaw("10 20 30 40", 2)).toEqual([
      [10, 20],
      [30, 40],
    ]);
  });

  it("should normalize numbers data", () => {
    expect(parseColormapRaw("-10 400 10", 3)).toEqual([[0, 255, 10]]);
  });

  it("should fill in missing numbers with zeros", () => {
    expect(parseColormapRaw("10", 3)).toEqual([[10, 0, 0]]);
  });

  it("should not care about extra whitespace", () => {
    expect(parseColormapRaw("  10   20 30  40  ", 4)).toEqual([[10, 20, 30, 40]]);
  });
});
