import { KeyType } from "@Types/layout";
import { KeymapDB } from "../keymap";
import { parseAndGroupByCount } from "./parseAndGroupByCount";

const keymapDB = new KeymapDB();

export function parseKeymapRaw(keymap: string, keyLayerSize: number): number[][] {
  return parseAndGroupByCount(keymap, keyLayerSize, 0, undefined);
}

export const serializeKeymap = (keymap: KeyType[][]) =>
  keymap
    .flat()
    .map(k => keymapDB.serialize(k).toString())
    .join(" ");
