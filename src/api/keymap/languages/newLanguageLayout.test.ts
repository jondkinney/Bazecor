import { beforeEach, describe, expect, it } from "vitest";
import newLanguageLayout from "./newLanguageLayout";
import { BaseKeycodeTableType, KeymapCodeTableType } from "../types";

describe("newLanguageLayout", () => {
  it("should respond with input when language is 'en-US'", () => {
    const baseLayout: BaseKeycodeTableType[] = [];
    const extendedKeys: KeymapCodeTableType[] = [{ code: 1, labels: { primary: "A" }, newGroupName: "g1" }];

    expect(newLanguageLayout(baseLayout, "en-US", extendedKeys)).toStrictEqual(baseLayout);
  });

  describe("add new keycode", () => {
    it.skip("should create a new group", () => {
      const baseLayout: BaseKeycodeTableType[] = [];
      const extendedKeys: KeymapCodeTableType[] = [{ code: 1, labels: { primary: "A" }, newGroupName: "g1" }];
      const expected: BaseKeycodeTableType[] = [
        {
          groupName: "g1",
          keys: [{ code: 1, labels: { primary: "A" }, newGroupName: "g1" }],
        },
      ];

      expect(newLanguageLayout(baseLayout, "any", extendedKeys)).toStrictEqual(expected);
    });

    it("should insert into existing group", () => {
      const baseLayout: BaseKeycodeTableType[] = [{ groupName: "g1", keys: [] }];
      const extendedKeys: KeymapCodeTableType[] = [{ code: 1, labels: { primary: "A" }, newGroupName: "g1" }];
      const expected: BaseKeycodeTableType[] = [
        {
          groupName: "g1",
          keys: [{ code: 1, labels: { primary: "A" }, newGroupName: "g1" }],
        },
      ];

      expect(newLanguageLayout(baseLayout, "any", extendedKeys)).toStrictEqual(expected);
    });
  });
  describe("replace existing keycode", () => {
    let baseLayout: BaseKeycodeTableType[];
    beforeEach(() => {
      baseLayout = [
        {
          groupName: "g1",
          keys: [
            { code: 1, labels: { primary: "A" } },
            { code: 2, labels: { primary: "B" } },
          ],
        },
        {
          groupName: "g2",
          keys: [
            { code: 3, labels: { primary: "C" } },
            { code: 4, labels: { primary: "D" } },
          ],
        },
      ];
    });

    it("should replace in same group if no newGroupName", () => {
      const extendedKeys: KeymapCodeTableType[] = [{ code: 1, labels: { primary: "Z" } }];
      const expected: BaseKeycodeTableType[] = [
        {
          groupName: "g1",
          keys: [
            { code: 1, labels: { primary: "Z" } },
            { code: 2, labels: { primary: "B" } },
          ],
        },
        {
          groupName: "g2",
          keys: [
            { code: 3, labels: { primary: "C" } },
            { code: 4, labels: { primary: "D" } },
          ],
        },
      ];

      expect(newLanguageLayout(baseLayout, "any", extendedKeys)).toStrictEqual(expected);
    });

    it.skip("should replace in same group if same newGroupName", () => {
      const extendedKeys: KeymapCodeTableType[] = [{ code: 1, labels: { primary: "Z" }, newGroupName: "g1" }];
      const expected: BaseKeycodeTableType[] = [
        {
          groupName: "g1",
          keys: [
            { code: 1, labels: { primary: "Z" }, newGroupName: "g1" },
            { code: 2, labels: { primary: "B" } },
          ],
        },
        {
          groupName: "g2",
          keys: [
            { code: 3, labels: { primary: "C" } },
            { code: 4, labels: { primary: "D" } },
          ],
        },
      ];

      expect(newLanguageLayout(baseLayout, "any", extendedKeys)).toStrictEqual(expected);
    });

    it("should move to other existing group", () => {
      const extendedKeys: KeymapCodeTableType[] = [{ code: 1, labels: { primary: "Z" }, newGroupName: "g2" }];
      const expected: BaseKeycodeTableType[] = [
        {
          groupName: "g1",
          keys: [{ code: 2, labels: { primary: "B" } }],
        },
        {
          groupName: "g2",
          keys: [
            { code: 3, labels: { primary: "C" } },
            { code: 4, labels: { primary: "D" } },
            { code: 1, labels: { primary: "Z" }, newGroupName: "g2" },
          ],
        },
      ];

      expect(newLanguageLayout(baseLayout, "any", extendedKeys)).toStrictEqual(expected);
    });

    it.skip("should move to other new group", () => {
      const extendedKeys: KeymapCodeTableType[] = [{ code: 1, labels: { primary: "Z" }, newGroupName: "g3" }];
      const expected: BaseKeycodeTableType[] = [
        {
          groupName: "g1",
          keys: [{ code: 2, labels: { primary: "B" } }],
        },
        {
          groupName: "g2",
          keys: [
            { code: 3, labels: { primary: "C" } },
            { code: 4, labels: { primary: "D" } },
          ],
        },
        {
          groupName: "g3",
          keys: [{ code: 1, labels: { primary: "Z" }, newGroupName: "g3" }],
        },
      ];

      expect(newLanguageLayout(baseLayout, "any", extendedKeys)).toStrictEqual(expected);
    });
  });
});
