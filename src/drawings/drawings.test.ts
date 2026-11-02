import { beforeAll, describe, expect, it } from 'vitest';
import { setLang } from '@onigam/lab-kit/i18n';
import { ASSEMBLY } from '../data/assembly';
import { FIG, MODEL } from '../data/figures';
import { partIds, PART_CATEGORIES, type WorldId } from '../data/ids';
import { PARTS } from '../data/parts';
import { MWH } from '../sim/runs';
import { PIPE, SILO, WALL } from '../three/dims';
import { HEAT_STOPS } from '../three/heat';
import { PRINTED } from './geom';
import { PLAN_GROUPS, SHEETS } from './index';
import { blowerCurve, chargeCurve, powerCurve, scaleRows, temperatureMaps } from './model';
import { rampColor } from './pl03-maps';
import { stepOf } from './pl09-sequence';
import { FakeElement, installFakeDom, textBoxes, type TextBox } from './test-dom';

// The ten A3 sheets by script: the contract (ids, numbers, groups, worlds, parts), a render in French and in English with no NaN, every number printed from dims.ts, src/sim or src/data/figures.ts, or an allowed constant with its
// source, the marks, and the model results on the sheets against the figures of the texts.

const LANGS = ['fr', 'en'] as const;
type Lang = (typeof LANGS)[number];
const rendered = new Map<string, FakeElement>();
const root = (d: { svg: SVGSVGElement }): FakeElement => d.svg as unknown as FakeElement;
const key = (id: string, lang: Lang) => `${id}/${lang}`;

beforeAll(() => {
  installFakeDom();
  for (const lang of LANGS) {
    setLang(lang);
    for (const s of SHEETS) rendered.set(key(s.id, lang), root(s.render()));
  }
  setLang('fr');
});

const boxes = (id: string, lang: Lang): TextBox[] => textBoxes(rendered.get(key(id, lang)) as FakeElement);
const flat = (id: string, lang: Lang): string =>
  boxes(id, lang)
    .map((t) => t.content)
    .join(' ')
    .replace(/\s+/g, ' ');

describe('the contract', () => {
  it('has at least the eight sheets of the bar: ten, in reading order, with their numbers and groups', () => {
    expect(SHEETS.length).toBe(10);
    expect(SHEETS.map((s) => s.number)).toEqual([
      'PL-01',
      'PL-02',
      'PL-03',
      'PL-04',
      'PL-05',
      'PL-06',
      'PL-07',
      'PL-08',
      'PL-09',
      'PL-10',
    ]);
    expect(new Set(SHEETS.map((s) => s.id)).size).toBe(10);
    expect(SHEETS.map((s) => s.id)).toEqual([
      'general-arrangement',
      'silo-section',
      'temperature-maps',
      'pipe-field',
      'air-loop',
      'single-line',
      'heat-side',
      'energy-balance',
      'assembly-sequence',
      'scale-comparison',
    ]);
    const groups = new Set(PLAN_GROUPS.map((g) => g.id));
    for (const s of SHEETS) expect(groups.has(s.group), s.id).toBe(true);
    for (const g of PLAN_GROUPS)
      expect(
        SHEETS.some((s) => s.group === g.id),
        g.id,
      ).toBe(true);
  });

  it('shows only frozen part ids of the world it opens, each once', () => {
    for (const s of SHEETS) {
      expect(s.parts?.length, s.id).toBeGreaterThan(0);
      expect(new Set(s.parts).size, s.id).toBe(s.parts!.length);
      for (const id of s.parts!) {
        expect(partIds(s.scene as WorldId), `${s.id}: ${id}`).toContain(id);
        expect(PARTS.find((p) => p.id === id)?.scene, `${s.id}: ${id}`).toBe(s.scene);
        expect(PART_CATEGORIES[s.scene as WorldId][id], id).toBeDefined();
      }
    }
    expect(SHEETS[0]!.parts).toEqual(partIds('site'));
    expect(SHEETS[1]!.parts).toEqual(partIds('silo'));
  });

  it('gives each sheet a title and a description in both languages, different, of a similar length', () => {
    for (const s of SHEETS) {
      for (const t of [s.title, s.description]) {
        expect(t.fr.length, s.id).toBeGreaterThan(5);
        expect(t.en.length, s.id).toBeGreaterThan(5);
        expect(t.fr, s.id).not.toBe(t.en);
      }
      expect(s.description.fr.length / s.description.en.length, s.id).toBeGreaterThan(0.6);
      expect(s.description.fr.length / s.description.en.length, s.id).toBeLessThan(1.7);
    }
  });
});

describe('the render', () => {
  it('has no NaN, no undefined and no placeholder, in both languages', () => {
    for (const s of SHEETS)
      for (const lang of LANGS) {
        const t = flat(s.id, lang);
        expect(t.length, `${s.id} ${lang}`).toBeGreaterThan(100);
        expect(t, `${s.id} ${lang}`).not.toMatch(/NaN|undefined|\[object|\{\w+\}/);
      }
  });

  it('has no French left in the English sheets, the title block included', () => {
    for (const s of SHEETS) expect(flat(s.id, 'en'), s.id).not.toMatch(/[éèêàùûôîç]/);
  });

  it('says « reconstruction » in the title block, and nowhere else on the sheets', () => {
    for (const s of SHEETS) {
      const fr = flat(s.id, 'fr');
      const en = flat(s.id, 'en');
      expect(en.match(/educational reconstruction/gi)?.length, s.id).toBe(1);
      expect(fr.match(/Reconstitution pédagogique/g)?.length, s.id).toBe(1);
    }
  });

  it('stays on the sheet, away from the title block', () => {
    for (const s of SHEETS)
      for (const t of boxes(s.id, 'fr')) {
        expect(t.x, `${s.id}: ${t.content}`).toBeGreaterThan(5);
        expect(t.x, `${s.id}: ${t.content}`).toBeLessThan(415);
        expect(t.y, `${s.id}: ${t.content}`).toBeGreaterThan(5);
        expect(t.y, `${s.id}: ${t.content}`).toBeLessThan(292);
      }
  });

  it('marks the estimates and the derived figures: the legend, a star, a dagger, and the red tag on what the model gives', () => {
    for (const id of ['general-arrangement', 'silo-section', 'pipe-field', 'air-loop', 'single-line', 'heat-side']) {
      expect(flat(id, 'en'), id).toMatch(/given by a source/);
      expect(flat(id, 'en'), id).toMatch(/derived from reported figures/);
      expect(flat(id, 'en'), id).toMatch(/estimate: the sources are silent/);
    }
    for (const id of [
      'temperature-maps',
      'pipe-field',
      'air-loop',
      'single-line',
      'heat-side',
      'energy-balance',
      'scale-comparison',
    ])
      expect(flat(id, 'en'), id).toMatch(/MODEL RESULT · not a measurement/);
    expect(flat('silo-section', 'en')).toMatch(/0\.45 m\*/);
    expect(flat('silo-section', 'en')).toMatch(/0\.50 m†/);
    expect(flat('silo-section', 'fr')).toMatch(/0,45 m\*/);
    // the official dimensions carry no mark
    for (const t of ['13 m', '15 m', '14 m', '6 m']) {
      expect(flat('silo-section', 'en'), t).toContain(t);
      expect(flat('silo-section', 'en'), t).not.toContain(`${t}*`);
    }
  });

  it('prints only numbers that come from dims.ts, the simulation, the figures, or a short list of reported ones', () => {
    // reported or plain, with their source: the scales of the sheets and the chart's grid; 1 MW, 100 MWh, 85 °C, 500 °C, 40 €/MWh, 2 MW, 3 MW, 8 MWh, 250 MWh, 2022, 2024, 2025, 2027, 200 kW, 3 MWh, 5 kW, 300 K, 40 K (the research);
    // 600, 700: the ramp's end and the zones' labels; 1,443 A and 1 MW in a note; the sheet numbers and the zone numbers.
    const plain = new Set<number>([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15, 16, 20, 25, 30, 40, 50, 75, 80, 85, 100, 123, 150, 200, 250, 300,
      400, 500, 600, 750, 800, 1000, 1443, 2000, 2022, 2024, 2025, 2026, 2027, 2400, 11, 12, 17, 18, 19, 650,
    ]);
    const known = new Set<number>(plain);
    for (const v of PRINTED) known.add(Number(v));
    for (const [v, d] of Object.values(FIG)) known.add(Number(v.toFixed(d)));
    const stray: string[] = [];
    for (const s of SHEETS)
      for (const t of boxes(s.id, 'en')) {
        const text = t.content
          .replace(/PL-\d+|1:\d+|A3|3D|CO₂|m⁻¹|\b\d{4}-\d{2}-\d{2}\b|√3/g, '')
          .replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
        for (const m of text.match(/\d+(?:\.\d+)?/g) ?? [])
          if (!known.has(Number(m))) stray.push(`${s.id}: ${m} in « ${t.content} »`);
      }
    expect(stray.join('\n')).toBe('');
  });
});

describe('the sheets against the sources of their numbers', () => {
  it('the dimensions of the section are read from dims.ts', () => {
    expect(SILO.outerR).toBe(7.5);
    expect(WALL.claddingOut).toBe(SILO.outerR);
    expect(flat('pipe-field', 'en')).toContain(`${PIPE.pitch} m*`);
    expect(flat('silo-section', 'en')).toContain(`${(SILO.shellT * 1000).toFixed(0)} mm*`);
  });

  it('the temperature maps hold the ramp of the 3D, and find the mean and the order of the charge', () => {
    expect(rampColor(HEAT_STOPS[0]![0])).toBe('rgb(39,49,111)');
    expect(rampColor(600)).toBe('rgb(166,26,60)');
    const m = temperatureMaps();
    expect(m.length).toBe(4);
    expect(m[0]!.meanT).toBeCloseTo(45, 0);
    expect(m[3]!.meanT).toBeCloseTo(400, -1);
    expect(m[1]!.coreT).toBeGreaterThan(m[1]!.edgeT + 100);
    expect(m[3]!.coreT - m[3]!.edgeT).toBeLessThan(100);
    expect(chargeCurve().hours.length).toBeGreaterThan(10);
  });

  it('the balance prints the figures of the texts', () => {
    const t = flat('energy-balance', 'en');
    for (const s of ['69 MWh', '105 MWh', '43 MWh', '32%', '48%', '20%', '91%', '4.6%', '4.3%', '217 MWh†'])
      expect(t, s).toContain(s);
    const c = powerCurve();
    expect(Math.round(c[0]!.usable)).toBe(MODEL.usable);
    expect(Math.round(c[1]!.usable)).toBe(MODEL.usable800);
    expect(Math.abs(c[2]!.usable - MODEL.usableWinter)).toBeLessThan(2);
    expect(Math.abs(c[3]!.usable - MODEL.usableSummer)).toBeLessThan(3);
    // the maker's figure is a dashed line, never a point of the model
    expect(t).toMatch(/up to 100 MWh quoted, power unsaid/);
    expect(t).not.toMatch(/100 MWh†/);
  });

  it('the blower curve is the model’s, not typed: more blower, more MWh at 1 MW', () => {
    const c = blowerCurve();
    expect(c.map((x) => x.rate)).toEqual([2.5, 5, 7.5, 10, 15, 30]);
    expect(c[0]!.usable).toBeLessThan(1);
    expect(Math.round(c[1]!.usable)).toBe(MODEL.usable);
    for (let i = 1; i < c.length; i++) expect(c[i]!.usable).toBeGreaterThan(c[i - 1]!.usable);
    expect(Math.abs(c[5]!.usable - MODEL.rangeHigh)).toBeLessThan(3);
  });

  it('the scale keeps the direction, and the figures of the texts', () => {
    const r = scaleRows();
    const by = (id: string) => r.find((x) => x.id === id)!;
    expect(by('kankaanpaa').surfacePerVolume).toBeCloseTo(1.31, 1);
    expect(by('pornainen').surfacePerVolume).toBeCloseTo(0.62, 2);
    expect(by('two-drums').surfacePerVolume).toBeCloseTo(9.5, 0);
    expect(Math.round(by('pornainen').usable / MWH)).toBe(MODEL.usable);
    expect(Math.abs(by('vaaksy').usable / MWH - MODEL.usableV)).toBeLessThan(5);
    expect(by('two-drums').usable / 3.6e6).toBeLessThan(2);
    expect(by('kankaanpaa').efficiency).toBeLessThan(by('pornainen').efficiency);
    expect(by('two-drums').halfLife).toBeLessThan(by('kankaanpaa').halfLife);
    expect(by('kankaanpaa').halfLife).toBeLessThan(by('pornainen').halfLife);
  });

  it('the sequence takes its numbers from the assembly guide, and lists all twenty steps', () => {
    expect(stepOf('foundation-slab')).toBe(2);
    expect(stepOf('storage-bed')).toBe(12);
    expect(stepOf('control-cabinet')).toBe(20);
    for (const s of ASSEMBLY) expect(flat('assembly-sequence', 'en'), s.id).toContain(s.title.en);
  });
});
