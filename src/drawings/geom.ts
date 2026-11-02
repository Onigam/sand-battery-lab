// Numbers of the sheets: every length is read from the single source of dimensions (src/three/dims.ts, metres), every model result from src/data/figures.ts, and each carries its status so
// that a sheet can mark it: no mark, given by a source; † derived from reported figures; * an estimate. Model results carry no mark: they sit in a red box that says so. Every number that a label
// prints goes through `lab` here, which also records it in `PRINTED`, so that the test can tell a printed number from a typed one.
import { l, type L } from '@onigam/lab-kit/i18n';
import { FIG } from '../data/figures';
import { nEn, nFr } from '../data/units';

export type Status = 'R' | 'D' | 'E' | 'M';
export const MARK: Record<Status, string> = { R: '', D: '†', E: '*', M: '' };

/** Every number a sheet has printed through `lab`, for the test. */
export const PRINTED = new Set<number>();

/** A number with its unit and its mark, in both languages. */
export function lab(value: number, digits: number, status: Status, unit: string | L = ' m'): L {
  PRINTED.add(Number(value.toFixed(digits)));
  const m = MARK[status];
  const uf = typeof unit === 'string' ? unit : unit.fr;
  const ue = typeof unit === 'string' ? unit : unit.en;
  return l(`${nFr(value, digits)}${uf}${m}`, `${nEn(value, digits)}${ue}${m}`);
}

/** A figure of src/data/figures.ts by name, with its unit and its mark. */
export function fig(name: string, status: Status, unit: string | L = ''): L {
  const f = FIG[name];
  if (!f) throw new Error(`unknown figure ${name}`);
  return lab(f[0], f[1], status, unit);
}

/** The unit of a percentage: a space in French, none in English. */
export const PC: L = l(' %', '%');

/** Several bilingual pieces in a row. */
export function cat(...parts: (string | L)[]): L {
  const fr = parts.map((p) => (typeof p === 'string' ? p : p.fr)).join('');
  const en = parts.map((p) => (typeof p === 'string' ? p : p.en)).join('');
  return l(fr, en);
}

/** The title block's scale: 1:n. */
export const scaleText = (n: number): string => `1:${n}`;

/** Paper millimetres per model metre at a scale 1:n. */
export const perMetre = (n: number): number => 1000 / n;
