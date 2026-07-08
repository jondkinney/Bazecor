import React from "react";
import type { KeyboardModel } from "../shared/types";
import { DEFY_KEYS, DEFY_SVG_W, DEFY_VIEW_Y, DEFY_VIEW_H } from "./geometry-defy";
import { DEFY_THUMB_PATHS } from "./defy-thumb-paths";
import { decodeKey, superkeyIndex, layoutOverrides } from "./keycodes";

interface Props {
  model: KeyboardModel;
  activeLayer: number;
  layout: string;
  layerNames?: string[];
}

const FS = 13;
const FSS = 11; // two-line keys (Super/name, Macro/name) — same size both lines
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
function fg(r: number, g: number, b: number) {
  return lum(r, g, b) > 128 ? "#111" : "#eee";
}

interface DecodedLabel {
  primary: string;
  hold: string;
  subtitle?: string;
  modifiers?: string[];
}

/**
 * Text/modifier content for one key, positioned around center (cx, cy). `boxTop`
 * and `boxH` bound the key face so the hold line / modifier boxes sit near the
 * bottom. Shared by both rectangular keys (absolute coords) and thumb keys
 * (local coords inside their translated group).
 */
function keyLabel(cx: number, cy: number, boxTop: number, boxH: number, label: DecodedLabel, fgColor: string): JSX.Element {
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
          fontSize={FSS}
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
          fontSize={FSS}
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
        fontSize={FS}
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
        fontSize={FSH}
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

/**
 * Renders the Defy layout in the overlay. Shares Lens' key-cell look with the
 * Sonsei view (same fonts, modifier boxes, color/contrast rules) but drives it
 * from DEFY_KEYS geometry. Regular keys are rounded rects; thumb keys use their
 * real Layout-Editor silhouettes (DEFY_THUMB_PATHS: outer bezel + inset color
 * face). Unlike the Sonsei view the two halves are not rotated — the Defy
 * coordinates already bake the split-ergo stagger into their y values.
 */
export const DefyKeyboardView: React.FC<Props> = ({ model, activeLayer, layout, layerNames }) => {
  const overrides = layoutOverrides(layout);
  const layer = Math.min(activeLayer, model.keymap.length - 1);
  const keymapLayer = model.keymap[layer] ?? [];
  const colormapLayer = model.colormap[layer] ?? [];
  const { palette } = model;
  const names = model.layerNames?.length ? model.layerNames : (layerNames ?? []);
  const macroNames = model.macroNames ?? [];

  function getColor(ledIndex: number) {
    const pi = colormapLayer[ledIndex] ?? 0;
    const c = palette[pi] ?? { r: 30, g: 30, b: 30, rgb: "rgb(30,30,30)" };
    return { r: c.r, g: c.g, b: c.b, css: c.rgb };
  }

  function getLabel(keyIndex: number): DecodedLabel {
    const code = keymapLayer[keyIndex] ?? 0;
    const sk = superkeyIndex(code);
    if (sk !== null) {
      const name = model.superkeyNames?.[sk] || `SK${sk + 1}`;
      return { primary: "Super", subtitle: name, hold: "" };
    }
    return decodeKey(code, overrides, names, macroNames);
  }

  function renderKey(key: (typeof DEFY_KEYS)[0]) {
    const color = getColor(key.ledIndex);
    const label = getLabel(key.index);
    const fgColor = fg(color.r, color.g, color.b);
    const { x, y, w, h } = key;

    // Thumb keys: draw the editor silhouette (outer bezel + inset color face) in a
    // group translated to the key origin, so the extracted paths' local coords hold.
    const thumb = key.thumbType ? DEFY_THUMB_PATHS[key.thumbType] : undefined;
    if (thumb) {
      const lcx = 4 + (w - 8) / 2;
      const lcy = (h - 8) / 2;
      return (
        <g key={`k-${key.index}`} transform={`translate(${x},${y})`}>
          <path d={thumb.base} fill="#303949" />
          <g transform="translate(4,0)">
            <path d={thumb.inner} fill={color.css} />
          </g>
          {keyLabel(lcx, lcy, 0, h, label, fgColor)}
        </g>
      );
    }

    const cx = x + 4 + (w - 8) / 2;
    const cy = y + (h - 8) / 2;
    return (
      <g key={`k-${key.index}`}>
        <rect x={x} y={y} width={w} height={h} rx={4} fill="#303949" />
        <rect x={x + 4} y={y} width={w - 8} height={h - 8} rx={4} fill={color.css} />
        {keyLabel(cx, cy, y, h, label, fgColor)}
      </g>
    );
  }

  const layerName = names[layer] ?? `Layer ${layer}`;

  return (
    <div className="keyboard-view">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 ${DEFY_VIEW_Y} ${DEFY_SVG_W} ${DEFY_VIEW_H}`}
        style={{ width: "100%", display: "block" }}
      >
        <g id="defy-keyshapes">{DEFY_KEYS.map(renderKey)}</g>
        <text
          x={DEFY_SVG_W / 2}
          y={DEFY_VIEW_Y + DEFY_VIEW_H - 12}
          textAnchor="middle"
          fontSize={13}
          fill="rgba(255,255,255,0.35)"
          fontFamily="system-ui,-apple-system,sans-serif"
          className="layer-label"
        >
          {layerName}
        </text>
      </svg>
    </div>
  );
};
