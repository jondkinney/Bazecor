import React from "react";
import type { DecodedKey } from "../shared/types";

/* Shared key-face text rendering for every Lens keyboard view (Sonsei, Defy,
 * Raise2). Draws the decoded label — primary line, optional second line
 * (superkey/macro names, Bazecor "top+primary" two-line keys), hold hint, and
 * modifier tag boxes — centered on the key face. Extracted from the per-view
 * copies so label styling stays identical across boards. */

const FS = 13;
const FSS = 11; // two-line keys (Super/name, Macro/name, Mouse/UP) — same size both lines
const FSH = 9;
const MOD_BOX_H = 9;
const MOD_BOX_GAP = 2;
const MOD_BOX_FS = 6;
const MOD_BOX_PX = 3;
// Bazecor's LayerTag / OneShotTag glyph paths, mirrored as inline SVG for the overlay.
const HOLD_ICON_PATHS: Record<"lock" | "shift" | "oneshot", { viewBox: string; width: number; height: number; paths: string[] }> = {
  lock: {
    viewBox: "0 0 16 15",
    width: 16,
    height: 15,
    paths: [
      "M9.46875 10.3366L7.5 11.6491L3.15139 8.74998L3.35694 8.61295L2.45555 8.01202L1.34861 8.74998L7.5 12.8509L9.46875 11.5384V10.3366Z",
      "M13.6513 5.83331L7.5 1.73242L1.34861 5.83335L7.5 9.93427L9.46875 8.62177V7.41992L7.5 8.73242L3.15139 5.83335L7.5 2.93427L11.8486 5.83331H13.6513Z",
      "M11.6515 8.78981C11.6515 8.69914 11.7012 8.65381 11.8006 8.65381H12.9835C13.0763 8.65381 13.1227 8.69648 13.1227 8.78181V13.6138C13.1227 13.6778 13.1591 13.7098 13.232 13.7098H16.4925C16.5985 13.7098 16.6515 13.7471 16.6515 13.8218V14.4698C16.6515 14.5018 16.6383 14.5311 16.6118 14.5578C16.5852 14.5791 16.5422 14.5898 16.4825 14.5898H11.8404C11.7675 14.5898 11.7178 14.5791 11.6913 14.5578C11.6648 14.5311 11.6515 14.4938 11.6515 14.4458V8.78981Z",
    ],
  },
  shift: {
    viewBox: "0 0 16 15",
    width: 16,
    height: 15,
    paths: [
      "M8.96875 10.3366L7 11.6491L2.65139 8.74998L2.85694 8.61295L1.95555 8.01202L0.84861 8.74998L7 12.8509L8.96875 11.5384V10.3366Z",
      "M13.1513 5.83331L7 1.73242L0.84861 5.83335L7 9.93427L8.96875 8.62177V7.41992L7 8.73242L2.65139 5.83335L7 2.93427L11.3486 5.83331H13.1513Z",
      "M14.976 9.42251C14.848 9.28384 14.6907 9.16118 14.504 9.05451C14.3173 8.94784 14.0613 8.89451 13.736 8.89451C13.3787 8.89451 13.1067 8.96384 12.92 9.10251C12.7333 9.24118 12.64 9.42518 12.64 9.65451C12.64 9.72918 12.656 9.80918 12.688 9.89451C12.7253 9.97984 12.7947 10.0652 12.896 10.1505C13.0027 10.2305 13.1547 10.3025 13.352 10.3665L14.584 10.7345C15.0747 10.8785 15.4267 11.0945 15.64 11.3825C15.8587 11.6652 15.968 11.9958 15.968 12.3745C15.968 12.7372 15.8747 13.0518 15.688 13.3185C15.5013 13.5852 15.2373 13.7905 14.896 13.9345C14.5547 14.0732 14.1467 14.1425 13.672 14.1425C13.3253 14.1425 13 14.1025 12.696 14.0225C12.3973 13.9425 12.1307 13.8252 11.896 13.6705C11.6667 13.5158 11.48 13.3318 11.336 13.1185C11.3093 13.0758 11.2987 13.0385 11.304 13.0065C11.3147 12.9692 11.3413 12.9345 11.384 12.9025L11.888 12.5505C11.952 12.5132 12 12.4972 12.032 12.5025C12.0693 12.5078 12.1013 12.5265 12.128 12.5585C12.2613 12.7292 12.392 12.8705 12.52 12.9825C12.6533 13.0892 12.8053 13.1692 12.976 13.2225C13.1467 13.2758 13.3547 13.3025 13.6 13.3025C13.9733 13.3025 14.272 13.2412 14.496 13.1185C14.72 12.9905 14.832 12.7932 14.832 12.5265C14.832 12.4198 14.808 12.3238 14.76 12.2385C14.7173 12.1478 14.6427 12.0652 14.536 11.9905C14.4347 11.9158 14.2853 11.8465 14.088 11.7825L12.88 11.4145C12.5707 11.3185 12.3147 11.1905 12.112 11.0305C11.9147 10.8652 11.7653 10.6758 11.664 10.4625C11.5627 10.2492 11.512 10.0278 11.512 9.79851C11.512 9.45718 11.6027 9.15584 11.784 8.89451C11.9653 8.62784 12.2213 8.41984 12.552 8.27051C12.8827 8.12118 13.2693 8.04651 13.712 8.04651C14 8.04651 14.2693 8.08118 14.52 8.15051C14.776 8.21451 15.0053 8.30784 15.208 8.43051C15.416 8.55318 15.5867 8.69984 15.72 8.87051C15.7413 8.89718 15.7573 8.92651 15.768 8.95851C15.7787 8.98518 15.7627 9.01718 15.72 9.05451L15.152 9.47851C15.1253 9.49984 15.0987 9.50784 15.072 9.50251C15.0507 9.49184 15.0187 9.46518 14.976 9.42251Z",
    ],
  },
  oneshot: {
    viewBox: "0 0 19 16",
    width: 19,
    height: 16,
    paths: [
      "M14.481 8.5C14.4936 8.33497 14.5 8.16823 14.5 8C14.5 6.2934 13.8416 4.73944 12.766 3.58006C11.5796 2.30131 9.88297 1.5 8 1.5C6.11703 1.5 4.42045 2.30131 3.23403 3.58006C2.15836 4.73944 1.5 6.2934 1.5 8C1.5 9.7066 2.15836 11.2606 3.23403 12.4199C4.42045 13.6987 6.11703 14.5 8 14.5C8.17089 14.5 8.34024 14.4934 8.50781 14.4804L8.5 8.5H14.481ZM6.47611 7.5C6.33211 6.00074 5.54731 4.68907 4.40012 3.84163C5.247 3.10774 6.31961 2.6287 7.5 2.5224V7.5H6.47611ZM8.5 7.5V2.5224C9.68039 2.6287 10.753 3.10774 11.5999 3.84163C10.4527 4.68908 9.66789 6.00074 9.52389 7.5H8.5ZM10.5297 7.5C10.6748 6.28667 11.3412 5.2331 12.2999 4.57023C12.9537 5.38864 13.3783 6.39716 13.4776 7.5H10.5297ZM7.5 8.5V13.4776C6.31961 13.3713 5.247 12.8923 4.40012 12.1584C5.54731 11.3109 6.33211 9.99926 6.47611 8.5H7.5ZM5.47032 8.5C5.32524 9.71333 4.6588 10.7669 3.70009 11.4298C3.04633 10.6114 2.6217 9.60284 2.5224 8.5H5.47032Z",
      "M11.132 10.2C11.132 10.1094 11.172 10.064 11.252 10.064H12.204C12.2787 10.064 12.316 10.1067 12.316 10.192V15.024C12.316 15.088 12.3453 15.12 12.404 15.12H15.028C15.1133 15.12 15.156 15.1574 15.156 15.232V15.88C15.156 15.912 15.1453 15.9414 15.124 15.968C15.1027 15.9894 15.068 16 15.02 16H11.284C11.2253 16 11.1853 15.9894 11.164 15.968C11.1427 15.9414 11.132 15.904 11.132 15.856V10.2Z",
    ],
  },
};

const MOD_CHAR_W = 3.5;
const MOD_WIDTH: Record<string, number> = { Ctrl: 4, Shift: 5, Alt: 3, AltGr: 5, OS: 2 };

function modBoxWidth(label: string): number {
  const chars = MOD_WIDTH[label] ?? label.length;
  return chars * MOD_CHAR_W + MOD_BOX_PX * 2;
}

function lum(r: number, g: number, b: number) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Foreground (text) color with enough contrast against the key's LED color. */
export function fg(r: number, g: number, b: number): string {
  return lum(r, g, b) > 128 ? "#111" : "#eee";
}

/** Shrink a line's font so Bazecor's longer labels ("BACKSPACE", "PAGE DOWN")
 * still fit a standard 57px key face instead of overflowing. */
export function fitFontSize(text: string, base: number): number {
  if (text.length >= 9) return base * 0.62;
  if (text.length >= 7) return base * 0.72;
  if (text.length >= 5) return base * 0.85;
  return base;
}

/** Ported from Bazecor's own `getDivideKeys` (per-hardware Keymap.jsx): a
 * single word longer than 7 characters — and not a modifier combo like
 * "C+A" — gets cut at 4 chars onto two lines ("BACKSPACE" -> "BACK"/"SPACE")
 * instead of overflowing the key face. Multi-word labels are left alone (they
 * already wrap on the space). */
export function splitLongWord(text: string): [string, string] | null {
  if (!text || text.includes(" ")) return null;
  if (text.length <= 7) return null;
  if (text.startsWith("C+") || text.startsWith("A+") || text.startsWith("AGr+")) return null;
  return [text.slice(0, 4), text.slice(4)];
}

/**
 * Text/modifier content for one key, positioned around center (cx, cy). `boxTop`
 * and `boxH` bound the key face so the hold line / modifier boxes sit near the
 * bottom. Shared by both rectangular keys (absolute coords) and silhouette keys
 * (local coords inside their translated group). `rotation` (degrees, about
 * (cx, cy)) tilts the whole label block to follow a curved key silhouette
 * (Defy's fanned thumb keys) instead of sitting flat/horizontal.
 */
export function keyLabel(
  cx: number,
  cy: number,
  boxTop: number,
  boxH: number,
  label: DecodedKey,
  fgColor: string,
  rotation = 0,
): JSX.Element {
  const hasSub = Boolean(label.subtitle);
  const mods = label.modifiers ?? [];
  const hasMods = mods.length > 0;

  let primaryY = cy + 1;
  if (hasMods) primaryY = cy - 5;
  else if (label.hold) primaryY = cy - 2;

  let primaryContent: JSX.Element | null = null;
  if (hasSub) {
    primaryContent = (
      <>
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fitFontSize(label.primary, FSS)}
          fontWeight="700"
          fontFamily="system-ui,-apple-system,sans-serif"
          fill={fgColor}
          pointerEvents="none"
        >
          {label.primary}
        </text>
        <text
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fitFontSize(label.subtitle ?? "", FSS)}
          fontWeight="700"
          fontFamily="system-ui,-apple-system,sans-serif"
          fill={fgColor}
          pointerEvents="none"
        >
          {label.subtitle}
        </text>
      </>
    );
  } else if (label.primary) {
    const split = splitLongWord(label.primary);
    if (split) {
      primaryContent = (
        <>
          <text
            x={cx}
            y={primaryY - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={fitFontSize(split[0], FSS)}
            fontWeight="700"
            fontFamily="system-ui,-apple-system,sans-serif"
            fill={fgColor}
            pointerEvents="none"
          >
            {split[0]}
          </text>
          <text
            x={cx}
            y={primaryY + 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={fitFontSize(split[1], FSS)}
            fontWeight="700"
            fontFamily="system-ui,-apple-system,sans-serif"
            fill={fgColor}
            pointerEvents="none"
          >
            {split[1]}
          </text>
        </>
      );
    } else {
      primaryContent = (
        <text
          x={cx}
          y={primaryY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fitFontSize(label.primary, FS)}
          fontWeight="700"
          fontFamily="system-ui,-apple-system,sans-serif"
          fill={fgColor}
          pointerEvents="none"
        >
          {label.primary}
        </text>
      );
    }
  }

  let secondaryContent: JSX.Element[] | JSX.Element | null = null;
  if (label.holdIcon) {
    const icon = HOLD_ICON_PATHS[label.holdIcon];
    const scale = label.holdIcon === "oneshot" ? 0.65 : 0.7;
    const iw = icon.width * scale;
    const ih = icon.height * scale;
    const ix = cx - iw / 2;
    const iy = boxTop + boxH - 12 - ih;
    secondaryContent = (
      <svg
        x={ix}
        y={iy}
        width={iw}
        height={ih}
        viewBox={icon.viewBox}
        fill={fgColor}
        opacity={0.85}
        pointerEvents="none"
      >
        {icon.paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    );
  } else if (hasMods) {
    const totalW = mods.reduce((s, m) => s + modBoxWidth(m), 0) + MOD_BOX_GAP * (mods.length - 1);
    const boxY = boxTop + boxH - 10 - MOD_BOX_H;
    let bx = cx - totalW / 2;
    secondaryContent = mods.map(m => {
      const bw = modBoxWidth(m);
      const el = (
        <g key={m}>
          <rect
            x={bx}
            y={boxY}
            width={bw}
            height={MOD_BOX_H}
            rx={2}
            fill="rgba(0,0,0,0.28)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={0.5}
          />
          <text
            x={bx + bw / 2}
            y={boxY + MOD_BOX_H / 2 + 0.5}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={MOD_BOX_FS}
            fontWeight="600"
            fontFamily="system-ui,-apple-system,sans-serif"
            fill={fgColor}
            pointerEvents="none"
          >
            {m}
          </text>
        </g>
      );
      bx += bw + MOD_BOX_GAP;
      return el;
    });
  } else if (label.hold) {
    // boxTop+boxH is the full key cell, but the color face is inset 4px top/
    // bottom (see the "-8" rect height at each call site) — "-10" left this
    // (layer names, superkey/oneshot hints) sitting only 2px above the face's
    // real bottom edge, cramped against it.
    secondaryContent = (
      <text
        x={cx}
        y={boxTop + boxH - 13}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fitFontSize(label.hold, FSH)}
        fontWeight="600"
        fontFamily="system-ui,-apple-system,sans-serif"
        fill={fgColor}
        opacity={0.7}
        pointerEvents="none"
      >
        {label.hold}
      </text>
    );
  }

  const content = (
    <>
      {primaryContent}
      {secondaryContent}
    </>
  );

  if (!rotation) return content;
  return <g transform={`rotate(${rotation},${cx},${cy})`}>{content}</g>;
}
