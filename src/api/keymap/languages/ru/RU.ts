/* Bazecor keymap library
 * Copyright (C) 2019  DygmaLab SE
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Russian keyboard layout keymap definitions.
 */

import {withModifiers} from "../../db/utils";
import {BaseKeycodeTableType, KeymapCodeTableType} from "../../types";

const ruRULetters: KeymapCodeTableType[] = [];

const ruRUModifierKey: KeymapCodeTableType[] = [
  {
    code: 4,
    labels: {
      primary: "Ф"
    },
    alt: true
  },
  {
    code: 5,
    labels: {
      primary: "И"
    },
    alt: true
  },
  {
    code: 6,
    labels: {
      primary: "С"
    },
    alt: true
  },
  {
    code: 7,
    labels: {
      primary: "В"
    },
    alt: true
  },
  {
    code: 8,
    labels: {
      primary: "У"
    },
    alt: true
  },
  {
    code: 9,
    labels: {
      primary: "А"
    },
    alt: true
  },
  {
    code: 10,
    labels: {
      primary: "П"
    },
    alt: true
  },
  {
    code: 11,
    labels: {
      primary: "Р"
    },
    alt: true
  },
  {
    code: 12,
    labels: {
      primary: "Ш"
    },
    alt: true
  },
  {
    code: 13,
    labels: {
      primary: "О"
    },
    alt: true
  },
  {
    code: 14,
    labels: {
      primary: "Л"
    },
    alt: true
  },
  {
    code: 15,
    labels: {
      primary: "Д"
    },
    alt: true
  },
  {
    code: 16,
    labels: {
      primary: "Ь"
    },
    alt: true
  },
  {
    code: 17,
    labels: {
      primary: "Т"
    },
    alt: true
  },
  {
    code: 18,
    labels: {
      primary: "Щ"
    },
    alt: true
  },
  {
    code: 19,
    labels: {
      primary: "З"
    },
    alt: true
  },
  {
    code: 20,
    labels: {
      primary: "Й"
    },
    alt: true
  },
  {
    code: 21,
    labels: {
      primary: "К"
    },
    alt: true
  },
  {
    code: 22,
    labels: {
      primary: "Ы"
    },
    alt: true
  },
  {
    code: 23,
    labels: {
      primary: "Е"
    },
    alt: true
  },
  {
    code: 24,
    labels: {
      primary: "Г"
    },
    alt: true
  },
  {
    code: 25,
    labels: {
      primary: "М"
    },
    alt: true
  },
  {
    code: 26,
    labels: {
      primary: "Ц"
    },
    alt: true
  },
  {
    code: 27,
    labels: {
      primary: "Ч"
    },
    alt: true
  },
  {
    code: 28,
    labels: {
      primary: "Н"
    },
    alt: true
  },
  {
    code: 29,
    labels: {
      primary: "Я"
    },
    alt: true
  },
];

const ruRUShiftSymbols: KeymapCodeTableType[] = [
    {
      code: 30,
      labels: {
        primary: "!"
      },
      alt: true
    },
    {
      code: 31,
      labels: {
        primary: '"'
      },
      alt: true
    },
    {
      code: 32,
      labels: {
        primary: "№"
      },
      alt: true
    },
    {
      code: 33,
      labels: {
        primary: ";"
      },
      alt: true
    },
    {
      code: 34,
      labels: {
        primary: "%"
      },
      alt: true
    },
    {
      code: 35,
      labels: {
        primary: ":"
      },
      alt: true
    },
    {
      code: 36,
      labels: {
        primary: "?"
      },
      alt: true
    },
    {
      code: 37,
      labels: {
        primary: "*"
      },
      alt: true
    },
    {
      code: 38,
      labels: {
        primary: "("
      },
      alt: true
    },
    {
      code: 39,
      labels: {
        primary: ")"
      },
      alt: true
    },
    {
      code: 45,
      labels: {
        primary: "_"
      },
      alt: true
    },
    {
      code: 46,
      labels: {
        primary: "+"
      },
      alt: true
    },
    {
      labels: {
        primary: "Х"
      },
      code: 47,
      alt: true
    },
    {
      code: 48,
      labels: {
        primary: "Ъ"
      },
      alt: true
    },
    {
      code: 49,
      labels: {
        primary: "/"
      },
      alt: true
    },
    {
      code: 51,
      labels: {
        primary: "Ж"
      },
      alt: true
    },
    {
      code: 52,
      labels: {
        primary: "Э"
      },
      alt: true
    },
    {
      code: 53,
      labels: {
        primary: "Ё"
      },
      alt: true
    },
    {
      code: 54,
      labels: {
        primary: "Б"
      },
      alt: true
    },
    {
      code: 55,
      labels: {
        primary: "Ю"
      },
      alt: true
    },
    {
      code: 56,
      labels: {
        primary: ","
      },
      alt: true
    }
];

const ruRU = ruRULetters

const table: BaseKeycodeTableType = {keys: ruRU, groupName: ""};
const tableRU: BaseKeycodeTableType = {keys: ruRUModifierKey.concat(ruRUShiftSymbols), groupName: ""};
const tableWithoutModifier: BaseKeycodeTableType = {keys: ruRULetters, groupName: ""};

// Modifier tables
const ruCtrlTable = withModifiers(table, "Control +", "C+", 256);
const ruLAltTable = withModifiers(table, "Alt +", "A+", 512);
const ruRAltTable = withModifiers(tableRU, "AltGr +", "AGr+", 1024);
const ruShiftTable = withModifiers(tableWithoutModifier, "Shift +", "O+", 2048);
const ruGuiTable = withModifiers(table, "Os+", "O+", 4096);

// Double

const ruRUCATable = withModifiers(table, "Control + Alt +", "C+A+", 768);
const ruRUCAGrTable = withModifiers(table, "Control + AltGr +", "C+AGr+", 1280);
const ruRUCSTable = withModifiers(table, "Control + Shift +", "C+O+", 2304);
const ruRUCGTable = withModifiers(table, "Control + Os +", "C+G+", 4352);
const ruRUAAGrTable = withModifiers(table, "Alt + AltGr +", "A+AGr+", 1536);
const ruRUASTable = withModifiers(table, "Alt + Shift +", "A+O+", 2560);
const ruRUAGTable = withModifiers(table, "Alt + Os +", "A+G+", 4608);
const ruRUAGrSTable = withModifiers(table, "AltGr + Shift +", "AGr+O+", 3072);
const ruRUAGrGTable = withModifiers(table, "AltGr + Os +", "AGr+G+", 5120);
const ruRUSGTable = withModifiers(table, "Shift + Os +", "O+G+", 6144);

// Triple

const ruRUCAAGTable = withModifiers(table, "Control + Alt + AltGr +", "C+A+AGr+", 1792);
const ruRUCASTable = withModifiers(table, "Meh +", "Meh+", 2816);
const ruRUCAGTable = withModifiers(table, "Control + Alt + Os +", "C+A+G+", 4864);
const ruRUCAGSTable = withModifiers(table, "Control + AltGr + Shift +", "C+AGr+O+", 3328);
const ruRUCAGGTable = withModifiers(table, "Control + AltGr + Os +", "C+AGr+G+", 5376);
const ruRUCSGTable = withModifiers(table, "Control + Shift + Os +", "C+O+G+", 6400);
const ruRUAAGSTable = withModifiers(table, "Alt + AltGr + Shift +", "A+AGr+O+", 3584);
const ruRUAAGGTable = withModifiers(table, "Alt + AltGr + Os +", "A+AGr+G+", 5632);
const ruRUASGTable = withModifiers(table, "Alt + Shift + Os +", "A+O+G+", 6656);
const ruRUAGSGTable = withModifiers(table, "AltGr + Shift + Os +", "AGr+O+G+", 7168);

// Quad

const ruRUCAAGrSTable = withModifiers(table, "Meh + AltGr +", "M+AGr+", 3840);
const ruRUCAAGrGTable = withModifiers(table, "Control + Alt + AltGr + Os +", "C+A+AGr+G+", 5888);
const ruRUAAGrSGTable = withModifiers(table, "Control + AltGr + Shift + Os +", "C+AGr+O+G+", 7424);
const ruRUCAGrSGTable = withModifiers(table, "Alt + AltGr + Shift + Os +", "A+AGr+O+G+", 7680);
const ruRUAllModTable = withModifiers(table, "Hyper + AltGr +", "H+AGr+", 7936);

const DualUseCtrlTable = withModifiers(table, "Control /", "CTRL/", 49169);
const DualUseShiftTable = withModifiers(table, "Shift /", "SHIFT/", 49425);
const DualUseAltTable = withModifiers(table, "Alt /", "ALT/", 49681);
const DualUseGuiTable = withModifiers(table, "Os /", "OS/", 49937);
const DualUseAltGrTable = withModifiers(table, "AltGr /", "ALTGR/", 50705);
const DualUseLayer1Tables = withModifiers(table, "Layer #1 /", "L#1/", 51218);
const DualUseLayer2Tables = withModifiers(table, "Layer #2 /", "L#2/", 51474);
const DualUseLayer3Tables = withModifiers(table, "Layer #3 /", "L#3/", 51730);
const DualUseLayer4Tables = withModifiers(table, "Layer #4 /", "L#4/", 51986);
const DualUseLayer5Tables = withModifiers(table, "Layer #5 /", "L#5/", 52242);
const DualUseLayer6Tables = withModifiers(table, "Layer #6 /", "L#6/", 52498);
const DualUseLayer7Tables = withModifiers(table, "Layer #7 /", "L#7/", 52754);
const DualUseLayer8Tables = withModifiers(table, "Layer #8 /", "L#8/", 53010);


// Combine all modified tables
const ruRUModifiedTables = [
  ruCtrlTable,
  ruLAltTable,
  ruRAltTable,
  ruShiftTable,
  ruGuiTable,
  ruRUCATable,
  ruRUCAGrTable,
  ruRUCSTable,
  ruRUCGTable,
  ruRUAAGrTable,
  ruRUASTable,
  ruRUAGTable,
  ruRUAGrSTable,
  ruRUAGrGTable,
  ruRUSGTable,
  ruRUCAAGTable,
  ruRUCASTable,
  ruRUCAGTable,
  ruRUCAGSTable,
  ruRUCAGGTable,
  ruRUCSGTable,
  ruRUAAGSTable,
  ruRUAAGGTable,
  ruRUASGTable,
  ruRUAGSGTable,
  ruRUCAAGrSTable,
  ruRUCAAGrGTable,
  withModifiers(table, "Hyper +", "Hyper+", 6912),
  ruRUCAGrSGTable,
  ruRUAAGrSGTable,
  ruRUAllModTable,
  DualUseCtrlTable,
  DualUseShiftTable,
  DualUseAltTable,
  DualUseGuiTable,
  DualUseAltGrTable,
  DualUseLayer1Tables,
  DualUseLayer2Tables,
  DualUseLayer3Tables,
  DualUseLayer4Tables,
  DualUseLayer5Tables,
  DualUseLayer6Tables,
  DualUseLayer7Tables,
  DualUseLayer8Tables,
];

export {ruRU, ruRUModifiedTables};
