import { parseAndGroupByCount } from "./parseAndGroupByCount";

export function parseColormapRaw(colormap: string, ColorLayerSize: number): number[][] {
  return parseAndGroupByCount(colormap, ColorLayerSize, 0, undefined);
}
