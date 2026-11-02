import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setLang } from '@onigam/lab-kit/i18n';
import { dayNames, months, num, PANEL_STRINGS, st, sx, type PanelKey } from './strings';
import { installFakeDom } from './test-dom';

// The panel's words: French and English written together, same detail, no placeholder, no research code, no internal word, and no number in a text
// that does not come from docs/research.md or docs/physics.md.

beforeAll(() => installFakeDom()); // setLang writes the language on the document element
afterEach(() => setLang('fr'));

const entries = Object.entries(PANEL_STRINGS);
/** The numbers of a text, decimal commas read as points: "0,8" and "0.8" give the same list. */
const numbers = (s: string): string[] => (s.replace(/(\d),(\d)/g, '$1.$2').match(/\d+(\.\d+)?/g) ?? []).sort();

/**
 * Every number a text may contain, with its source.
 * 8, 100, 250 (MWh): the capacities the maker quotes. 46: 100 MWh over 217 MWh, derived from what it quotes. 2027: the commissioning of the 250 MWh silo.
 * 573: the inversion of quartz. 3, 373: the span of a week of spot prices. 45: the estimated price of a MWh from the boiler (docs/physics.md).
 * 60, 75, 80, 85, 90: efficiencies quoted by the maker and its customers. 0.78, 1.13, 0.8: specific heat of measured sand, and the fixed value it replaces.
 */
const ALLOWED = new Set([
  '0.78',
  '0.8',
  '1.13',
  '3',
  '8',
  '45',
  '46',
  '60',
  '75',
  '80',
  '85',
  '90',
  '100',
  '250',
  '373',
  '573',
  '2027',
]);

describe('the panel’s words', () => {
  it('there are words to check', () => {
    expect(entries.length).toBeGreaterThan(150);
  });
  it('never show a research code (K12, S3…) or an internal word', () => {
    for (const [key, [fr, en]] of entries) {
      for (const text of [fr, en]) {
        expect(text, key).not.toMatch(/\b[KS]\d{1,2}\b/);
        expect(text, key).not.toMatch(/\bid\b|\bworld\b|\bpreset id\b|\bundefined\b/i);
      }
    }
  });
  it('exist in both languages, non-empty, with no placeholder', () => {
    for (const [key, [fr, en]] of entries) {
      expect(fr.trim().length, `${key} fr`).toBeGreaterThan(0);
      expect(en.trim().length, `${key} en`).toBeGreaterThan(0);
      for (const text of [fr, en]) expect(text, key).not.toMatch(/TODO|FIXME|lorem|xxx|\[\[|\{\{/i);
    }
  });
  it('carry the same numbers in French and in English', () => {
    for (const [key, [fr, en]] of entries) expect(numbers(fr), key).toEqual(numbers(en));
  });
  it('have the same level of detail', () => {
    for (const [key, [fr, en]] of entries) {
      if (fr.length < 40 && en.length < 40) continue;
      expect(fr.length / en.length, key).toBeGreaterThan(0.6);
      expect(fr.length / en.length, key).toBeLessThan(1.7);
    }
  });
  it('are only the same in both languages for a unit, a name or a single word', () => {
    for (const [key, [fr, en]] of entries) {
      if (fr === en) expect(fr.split(/\s+/).length, `${key}: ${fr}`).toBeLessThanOrEqual(2);
    }
  });
  it('hold no number but those of the research', () => {
    for (const [key, [, en]] of entries) {
      const text = en.replace(/\bA3\b|\b3D\b/g, '');
      for (const n of numbers(text)) expect(ALLOWED.has(n), `${key}: ${n} in « ${en} »`).toBe(true);
    }
  });
  it('say the model is a model once, and warn about the efficiencies once', () => {
    const count = (re: RegExp) => entries.filter(([, [, en]]) => re.test(en)).length;
    expect(count(/No independent measurement/)).toBe(0);
    expect(count(/Nobody has measured/)).toBe(1);
  });
  it('write 46% in English, 46 % in French', () => {
    for (const [key, [fr, en]] of entries) {
      expect(en, key).not.toMatch(/\d %/);
      expect(fr, key).not.toMatch(/\d%/);
    }
  });
  it('the panel’s lookups work in both languages', () => {
    for (const lang of ['fr', 'en'] as const) {
      setLang(lang);
      expect(months()).toHaveLength(12);
      expect(dayNames()).toHaveLength(7);
      expect(st('simIntro' as PanelKey).length).toBeGreaterThan(40);
      expect(sx('alarm', 'noFlow').length).toBeGreaterThan(5);
    }
  });
});

describe('num', () => {
  it('writes the decimal mark of the language', () => {
    setLang('fr');
    expect(num(7.5, 1)).toBe('7,5');
    setLang('en');
    expect(num(7.5, 1)).toBe('7.5');
    expect(num(Number.NaN)).toBe('—');
    expect(num(-0.001, 1)).toBe('0.0');
  });
});
