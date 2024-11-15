import { expect, describe, it } from "vitest";
import { parseSuperkeysRaw, serializeSuperkeys } from "./superkeys";

describe("parseSuperkeysRaw", () => {
  it("should parse", () => {
    expect(
      parseSuperkeysRaw("55 2104 54 2078 1 0 2099 51 1 1 1 0 2100 52 1 53 1 0 0 65535 65535 65535 65535", [
        { id: 0, name: "first", actions: [] },
        { id: 1, name: "second", actions: [] },
      ]),
    ).toEqual([
      {
        actions: [55, 2104, 54, 2078, 1],
        id: 0,
        name: "first",
      },
      {
        actions: [2099, 51, 1, 1, 1],
        id: 1,
        name: "second",
      },
      {
        actions: [2100, 52, 1, 53, 1],
        id: 2,
        name: "",
      },
    ]);
  });

  it("should return empty array when no superkeys", () => {
    expect(
      parseSuperkeysRaw("65535 65535 65535 65535", [
        { id: 0, name: "first", actions: [] },
        { id: 1, name: "second", actions: [] },
      ]),
    ).toEqual([]);
  });
});

describe("serializeSuperkeysRaw", () => {
  it("should serialize empty", () => {
    expect(serializeSuperkeys([])).toEqual(Array(512).fill(0xffff).join(" "));
  });

  it("should serialize no actions to empty", () => {
    expect(serializeSuperkeys([{ actions: [], id: 0, name: "test" }])).toEqual(Array(512).fill(0xffff).join(" "));
  });

  it("should serialize a zero actions to empty", () => {
    expect(serializeSuperkeys([{ actions: [0], id: 0, name: "test" }])).toEqual(Array(512).fill(0xffff).join(" "));
  });

  it("should serialize a superkey", () => {
    expect(serializeSuperkeys([{ actions: [10, 20], id: 0, name: "test" }])).toEqual("10 20 1 1 1 0 0");
  });

  it("should handle zero", () => {
    expect(serializeSuperkeys([{ actions: [10, 0, 20], id: 0, name: "test" }])).toEqual("10 1 20 1 1 0 0");
  });

  it("should handle undefined", () => {
    expect(serializeSuperkeys([{ actions: [10, undefined, 20], id: 0, name: "test" }])).toEqual("10 1 20 1 1 0 0");
  });

  it("should handle null", () => {
    expect(serializeSuperkeys([{ actions: [10, null, 20], id: 0, name: "test" }])).toEqual("10 1 20 1 1 0 0");
  });

  it("should serialize two superkeys", () => {
    expect(
      serializeSuperkeys([
        { actions: [10, 20], id: 0, name: "test" },
        {
          actions: [30, 40],
          id: 1,
          name: "second",
        },
      ]),
    ).toEqual("10 20 1 1 1 0 30 40 1 1 1 0 0");
  });
});
