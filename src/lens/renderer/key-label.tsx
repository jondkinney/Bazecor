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
