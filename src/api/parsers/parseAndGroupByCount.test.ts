import { expect, describe, it } from "vitest";
import { parseAndGroupByCount } from "./parseAndGroupByCount";

describe("parseAndGroupByCount", () => {
  it("should split into groups", () => {
    expect(parseAndGroupByCount("10 20 30 40", 2, undefined, undefined)).toEqual([
      [10, 20],
      [30, 40],
    ]);
  });

  it("should fill in missing numbers with zeros", () => {
    expect(parseAndGroupByCount("10", 3, undefined, undefined)).toEqual([[10, 0, 0]]);
  });

  it("should not care about extra whitespace", () => {
    expect(parseAndGroupByCount("  10   20 30  40  ", 4, undefined, undefined)).toEqual([[10, 20, 30, 40]]);
  });

  it("should NOT normalize numbers data", () => {
    expect(parseAndGroupByCount("-10 400 10", 3, undefined, undefined)).toEqual([[-10, 400, 10]]);
  });

  it("should normalize min value", () => {
    expect(parseAndGroupByCount("-10 400 10", 3, 100, undefined)).toEqual([[100, 400, 100]]);
  });

  it("should normalize max value", () => {
    expect(parseAndGroupByCount("-10 400 10", 3, undefined, 5)).toEqual([[-10, 5, 5]]);
  });

  it("should normalize max and min value", () => {
    expect(parseAndGroupByCount("-10 400 10", 3, 5, 50)).toEqual([[5, 50, 10]]);
  });

  it("should NOT normalize numbers data by passing null", () => {
    expect(parseAndGroupByCount("-10 400 10", 3, null, null)).toEqual([[-10, 400, 10]]);
  });

  it("should normalize to 0 if passed", () => {
    expect(parseAndGroupByCount("-10 400 10", 3, 0, 0)).toEqual([[0, 0, 0]]);
  });
});
