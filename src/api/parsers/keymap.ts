import { KeyType } from "@Types/layout";
import { KeymapDB } from "../keymap";

const keymapDB = new KeymapDB();

export function parseKeymapRaw(keymap: string, keyLayerSize: number): number[][] {
  const rawColorMapAsNumbers = keymap
    .trim()
    .split(/ +/)
    .map((value: string) => parseInt(value, 10));

  const result: number[][] = [];
  for (let i = 0; i < rawColorMapAsNumbers.length; ) {
    const keys: number[] = [];
    for (let c = 0; c < keyLayerSize; c++) {
      keys.push(i < rawColorMapAsNumbers.length ? rawColorMapAsNumbers[i++] : 0);
    }
    result.push(keys);
  }
  return result;
}

export const serializeKeymap = (keymap: KeyType[][]) =>
  keymap
    .flat()
    .map(k => keymapDB.serialize(k).toString())
    .join(" ");
