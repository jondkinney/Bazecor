import { expect, describe, it } from "vitest";
import { parseKeymapRaw, serializeKeymap } from "./keymap";

describe("parseKeymapRaw", () => {
  it("should split into groups", () => {
    expect(parseKeymapRaw("10 20 30 40", 2)).toEqual([
      [10, 20],
      [30, 40],
    ]);
  });

  it("should ensure non-negative numbers", () => {
    expect(parseKeymapRaw("-10 400 10", 3)).toEqual([[0, 400, 10]]);
  });

  it("should fill in missing numbers with zeros", () => {
    expect(parseKeymapRaw("10", 3)).toEqual([[10, 0, 0]]);
  });

  it("should not care about extra whitespace", () => {
    expect(parseKeymapRaw("  10   20 30  40  ", 4)).toEqual([[10, 20, 30, 40]]);
  });
});

describe("serializeKeymap", () => {
  it("should serialize empty", () => {
    expect(serializeKeymap([])).toEqual("");
  });

  it("should serialize no actions to empty", () => {
    expect(serializeKeymap([[]])).toEqual("");
  });

  it("should serialize a keymap with one key", () => {
    expect(serializeKeymap([[{ keyCode: 10, label: "test" }]])).toEqual("10");
  });

  it("should serialize a keymap with 2 keys in one nested array", () => {
    expect(
      serializeKeymap([
        [
          { keyCode: 10, label: "test" },
          { keyCode: 20, label: "test_2" },
        ],
      ]),
    ).toEqual("10 20");
  });

  it("should serialize a keymap with 2 keys in separate nested arrays", () => {
    expect(serializeKeymap([[{ keyCode: 10, label: "test" }], [{ keyCode: 20, label: "test_2" }]])).toEqual("10 20");
  });
});
