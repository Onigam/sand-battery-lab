// Number formatting shared by the data files, so that a figure is written once and shown the right way in each language:
// 7,5 in French, 7.5 in English. The same helpers as the Mill and ram pump labs, trimmed to what this lab uses.

/** Round to `digits` decimals without the floating-point noise (0.1 + 0.2 -> 0.3). */
export function round(x: number, digits = 0): number {
  const f = 10 ** digits;
  return Math.round(x * f) / f;
}

function group(int: string, sep: string): string {
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/** French number: decimal comma, space between thousands (5 700, 7,5). */
export function nFr(x: number, digits = 0): string {
  const [int, dec] = round(x, digits).toFixed(digits).split('.');
  return group(int ?? '', ' ') + (dec ? `,${dec}` : '');
}

/** English number: decimal point, comma between thousands (5,700, 7.5). */
export function nEn(x: number, digits = 0): string {
  const [int, dec] = round(x, digits).toFixed(digits).split('.');
  return group(int ?? '', ',') + (dec ? `.${dec}` : '');
}
