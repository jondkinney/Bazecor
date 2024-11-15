export function parseColormapRaw(colormap: string, ColorLayerSize: number): number[][] {
  const rawColorMapAsNumbers = colormap
    .trim()
    .split(/ +/)
    .map((value: string) => parseInt(value, 10))
    .map((value: number) => Math.max(0, Math.min(255, value)));

  const result: number[][] = [];
  for (let i = 0; i < rawColorMapAsNumbers.length; ) {
    const color: number[] = [];
    for (let c = 0; c < ColorLayerSize; c++) {
      color.push(i < rawColorMapAsNumbers.length ? rawColorMapAsNumbers[i++] : 0);
    }
    result.push(color);
  }
  return result;
}
