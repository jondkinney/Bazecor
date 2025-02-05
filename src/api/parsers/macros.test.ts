import { expect, describe, it, test } from "vitest";
import { parseMacrosRaw, serializeMacros } from "./macros";
import { bkp, tester, result } from "./macroTester.json";
import { rgb2w } from "../color";

describe("parseMacrosRaw", () => {
  const tested = parseMacrosRaw(tester, bkp).filter(x => x !== undefined);

  console.log("DATA to be tested", tested[0]);
  console.log("DATA to be tested", result[0]);

  test.each([tested[0]])("Testing macro '$id' with '$name'", elem => {
    expect(elem).toEqual(result[elem.id]);
  });

  describe("fail to parse", () => {
    test.each([
      { input: "1 44 6 100 0 0" },
      { input: "2 44 0 0" },
      { input: "3 44 0 0" },
      { input: "4 44 0 0" },
      { input: "5 44 0 0" },
      { input: "6 0 0" },
      { input: "7 0 0" },
      { input: "8 0 0" },
    ])("with too few numbers '$input'", ({ input }) => {
      expect(parseMacrosRaw(input, [])).toEqual([{ actions: [], id: 0, macro: "", name: "" }]);
    });
  });

  describe("should parse", () => {
    test.each([
      {
        input: "1 20 30 40 50 0 0",
        expected: { actions: [{ type: 1, keyCode: [5150, 10290] }], id: 0, macro: "#5150,10290", name: "" },
      },
      { input: "2 20 30 0 0", expected: { actions: [{ type: 2, keyCode: 5150 }], id: 0, macro: "1", name: "" } },
      { input: "3 20 30 0 0", expected: { actions: [{ type: 3, keyCode: 5150 }], id: 0, macro: "1", name: "" } },
      { input: "4 20 30 0 0", expected: { actions: [{ type: 4, keyCode: 5150 }], id: 0, macro: "1", name: "" } },
      { input: "5 20 30 0 0", expected: { actions: [{ type: 5, keyCode: 5150 }], id: 0, macro: "1", name: "" } },
      { input: "6 20 0 0", expected: { actions: [{ type: 6, keyCode: 20 }], id: 0, macro: "Q", name: "" } },
      { input: "7 20 0 0", expected: { actions: [{ type: 7, keyCode: 20 }], id: 0, macro: "Q", name: "" } },
      { input: "8 20 0 0", expected: { actions: [{ type: 8, keyCode: 20 }], id: 0, macro: "Q", name: "" } },
    ])("valid input '$input'", ({ input, expected }) => {
      const objectResult = parseMacrosRaw(input, []);
      expect(objectResult).toEqual([expected]);

      expect(serializeMacros(objectResult, 10)).toEqual(input);
    });

    it("should parse type 9", () => {
      expect(parseMacrosRaw("9 0 0 0", [])).toEqual([{ actions: [], id: 0, macro: "", name: "" }]);
    });
  });

  it("should return empty array when no Macros", () => {
    expect(
      parseMacrosRaw("255 255 255 255 255", [
        { id: 0, name: "first", actions: [], macro: "" },
        { id: 1, name: "second", actions: [], macro: "" },
      ]),
    ).toEqual([]);
  });
});

describe("serializeMacrosRaw", () => {
  it("should serialize empty", () => {
    expect(serializeMacros([], 10)).toEqual(Array(10).fill(0xff).join(" "));
  });
});
