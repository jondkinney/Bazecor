export function parseAndGroupByCount(stringOfNumbers: string, countPerGroup: number, minValue: number, maxValue: number): number[][] {
  const arrayOfNumbers = stringOfNumbers
    .trim()
    .split(/ +/)
    .map((value: string) => parseInt(value, 10))
    .map((value: number) => {
      let result = value;
      if (minValue !== undefined && minValue !== null) {
        result = Math.max(result, minValue);
      }
      if (maxValue !== undefined && maxValue !== null) {
        result = Math.min(result, maxValue);
      }
      return result;
    });

  const result: number[][] = [];
  for (let i = 0; i < arrayOfNumbers.length; ) {
    const color: number[] = [];
    for (let c = 0; c < countPerGroup; c++) {
      color.push(i < arrayOfNumbers.length ? arrayOfNumbers[i++] : 0);
    }
    result.push(color);
  }
  return result;
}
