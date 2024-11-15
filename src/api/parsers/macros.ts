/* eslint-disable no-bitwise */
import { MacroActionsType, MacrosType } from "@Renderer/types/macros";
import { KeymapDB } from "../keymap";

const macrosEraser = (tMem: number) => Array(tMem).fill("255").join(" ");

export const parseMacrosRaw = (raw: string, storedMacros?: MacrosType[]) => {
  const keymapDB = new KeymapDB();

  function getCountOfNumbersForType(type: number): number {
    if (type < 1 || type > 8) {
      return 0;
    }
    if (type === 1) {
      return 4;
    }
    if (type <= 5) {
      return 2;
    }
    return 1;
  }

  function mergeHighLow(high: number, low: number): number {
    return (high << 8) + low;
  }

  return raw
    .trim()
    .split(" 0 0")[0] // " 0 0" marks the end of the defined super keys
    .split(" 0 ") // " 0 " marks the end of each super key
    .map(actionString =>
      actionString
        .trim()
        .split(/ +/)
        .map(v => parseInt(v, 10))
        .filter(v => v > 0 && v < 255),
    )
    .filter(actions => actions.length > 0)
    .map(actions => {
      let macroActions: MacroActionsType[] = [];

      for (let i = 0; i < actions.length; ) {
        const type = actions[i];
        i++;

        const countToRetrieve = getCountOfNumbersForType(type);
        if (countToRetrieve > 0 && (i + countToRetrieve <= actions.length)) {
          let keyCode: number | number[] = [];
          switch (countToRetrieve) {
            case 1:
              keyCode = actions[i];
              break;
            case 2:
              keyCode = mergeHighLow(actions[i], actions[i + 1]);
              break;
            case 4:
              keyCode = [mergeHighLow(actions[i], actions[i + 1]), mergeHighLow(actions[i + 2], actions[i + 3])];
              break;
          }
          macroActions.push({ type, keyCode });
        }
        i += countToRetrieve;
      }
      return macroActions;
    })
    .map((actions, id) => {
      return {
        actions,
        id,
        macro: actions.map(k => keymapDB.parse(k.keyCode as number).label).join(" "),
        // The "match" to lookup the name is based on array index position
        name: storedMacros.length >= id + 1 ? storedMacros[id].name : "",
      };
    });
};

export const serializeMacros = (macros: MacrosType[], tMem: number) => {
  if (macros.length === 0 || (macros.length === 1 && !Array.isArray(macros[0].actions))) {
    return macrosEraser(tMem);
  }

  function splitHighLow(val: number): number[] {
    return [(val & 0xff00) >> 8, (val & 0x00ff)]
  }

  return macros
    .map(m => m.actions
        .filter(a => [a.keyCode].flat().every(v => !Number.isNaN(v)))
        .map(a => {
          if (a.type <= 5) {
            return [a.type, ...[a.keyCode].flat().map(v => splitHighLow(v)).flat()].join(" ");
          }
          return [a.type, ...[a.keyCode].flat()].join(" ");
        }) + " 0")
    .join(" ") + " 0";
};
