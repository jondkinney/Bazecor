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

/**
 * Text/modifier content for one key, positioned around center (cx, cy). `boxTop`
 * and `boxH` bound the key face so the hold line / modifier boxes sit near the
 * bottom. Shared by both rectangular keys (absolute coords) and silhouette keys
 * (local coords inside their translated group).
 */
export function keyLabel(cx: number, cy: number, boxTop: number, boxH: number, label: DecodedKey, fgColor: string): JSX.Element {
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

  let secondaryContent: JSX.Element[] | JSX.Element | null = null;
  if (hasMods) {
    const totalW = mods.reduce((s, m) => s + modBoxWidth(m), 0) + MOD_BOX_GAP * (mods.length - 1);
    const boxY = boxTop + boxH - 6 - MOD_BOX_H;
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
    secondaryContent = (
      <text
        x={cx}
        y={boxTop + boxH - 10}
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

  return (
    <>
      {primaryContent}
      {secondaryContent}
    </>
  );
}
