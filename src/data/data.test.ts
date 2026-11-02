import { describe, expect, it } from 'vitest';
import type { GuideStep, PartInfo } from '@onigam/lab-kit/content';
import type { L } from '@onigam/lab-kit/i18n';
import { setLang } from '@onigam/lab-kit/i18n';
import { LAB_STRINGS } from '../i18n/ui';
import { installFakeDom } from '../panels/test-dom';
import { capacityRun, cycleRun, defaultOperation, idleRun, MWH, yearRun } from '../sim/runs';
import { siloSpec, PORNAINEN, stoneDrop } from '../sim/silo';
import { pipeCellTime, pitchRadius } from '../sim/thermal';
import { SUMMER_DEMAND, WINTER_DEMAND } from '../sim/week';
import { PIPE, PLANT, SILO, SITE } from '../three/dims';
import { aboutPanel } from './about';
import { ASSEMBLY } from './assembly';
import { ASSUMED, DERIVED, ESTIMATE, FIG, MODEL } from './figures';
import { partIds, PART_CATEGORIES, WORLDS, type WorldId } from './ids';
import { INSTALL } from './install';
import { LESSONS } from './lessons';
import { OVERVIEWS } from './overviews';
import { PARTS } from './parts';
import { DIM_SPECS } from './parts/dim-specs';
import { CHAPTERS, SOURCES } from './sources';

// The content checks of the data role: the catalogue and the two guides against the frozen ids of docs/research.md §4, FR/EN parity, the rules of the visitor texts (no research code, no
// name, British English, typographic apostrophes, every number tagged or sourced), every model result quoted in a text against the simulation (a change of src/sim cannot go
// unnoticed), and what is said once.

const isL = (v: unknown): v is L => typeof v === 'object' && v !== null && 'fr' in v && 'en' in v;
const words = (t: string): number => t.trim().split(/\s+/).length;
const sentences = (t: string): number => t.split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Þ0-9«“"(*])/).length;

/** The bilingual texts of a part, without the rows generated from dims.ts. */
function partTexts(p: PartInfo): [string, L][] {
  const out: [string, L][] = [
    ['name', p.name],
    ['short', p.short],
    ['description', p.description],
    ['material', p.material],
  ];
  if (p.maintenance) out.push(['maintenance', p.maintenance]);
  if (p.tip) out.push(['tip', p.tip]);
  if (p.design) out.push(['design', p.design]);
  const generated = new Set((DIM_SPECS[p.id] ?? []).map((s) => s.label.en));
  p.specs.forEach((s, i) => {
    if (generated.has(s.label.en)) return;
    out.push([`specs[${i}].label`, s.label]);
    out.push([`specs[${i}].value`, isL(s.value) ? s.value : { fr: s.value, en: s.value }]);
  });
  return out;
}

function stepTexts(s: GuideStep): [string, L][] {
  const out: [string, L][] = [
    ['title', s.title],
    ['text', s.text],
  ];
  if (s.tip) out.push(['tip', s.tip]);
  if (s.warning) out.push(['warning', s.warning]);
  s.tools?.forEach((t, i) => out.push([`tools[${i}]`, t]));
  return out;
}

/** What a visitor reads outside the Sources panel, labelled. */
function visitorTexts(): [string, L][] {
  const out: [string, L][] = [];
  for (const p of PARTS) for (const [k, v] of partTexts(p)) out.push([`part ${p.id}.${k}`, v]);
  for (const [guide, steps] of [
    ['assembly', ASSEMBLY],
    ['install', INSTALL],
  ] as const)
    for (const s of steps) for (const [k, v] of stepTexts(s)) out.push([`${guide} ${s.id}.${k}`, v]);
  for (const [world, o] of Object.entries(OVERVIEWS)) {
    out.push([`overview ${world}.title`, o.title]);
    out.push([`overview ${world}.text`, o.text]);
  }
  for (const lesson of LESSONS) {
    out.push([`lesson ${lesson.id}.title`, lesson.title], [`lesson ${lesson.id}.summary`, lesson.summary]);
    lesson.body.forEach((b, i) => out.push([`lesson ${lesson.id}.body[${i}]`, b]));
    lesson.figures?.forEach((f, i) => {
      out.push([`lesson ${lesson.id}.figures[${i}].label`, f.label]);
      out.push([`lesson ${lesson.id}.figures[${i}].value`, isL(f.value) ? f.value : { fr: f.value, en: f.value }]);
    });
    lesson.quiz?.forEach((q, i) => {
      out.push([`lesson ${lesson.id}.quiz[${i}].q`, q.q], [`lesson ${lesson.id}.quiz[${i}].explain`, q.explain]);
      q.choices.forEach((c, j) => out.push([`lesson ${lesson.id}.quiz[${i}].choices[${j}]`, c]));
    });
  }
  return out;
}

const UI: [string, L][] = Object.entries(LAB_STRINGS).map(([k, [fr, en]]) => [`ui ${k}`, { fr, en }]);
const SOURCE_TEXTS: [string, L][] = [
  ...CHAPTERS.map(([ts, fr, en]): [string, L] => [`chapter ${ts}`, { fr, en }]),
  ...SOURCES.flatMap((g): [string, L][] => [
    [`source group ${g.en}`, { fr: g.fr, en: g.en }],
    ...g.items.map((s): [string, L] => [`source ${s.label}`, { fr: s.fr, en: s.en }]),
  ]),
];
const ALL_TEXTS: [string, L][] = [...visitorTexts(), ...UI, ...SOURCE_TEXTS];

/** Numbers of a text, normalised so that the French and English spellings compare equal (7,5 / 7.5, 5 700 / 5,700). */
function numbersOf(text: string, lang: 'fr' | 'en'): string[] {
  let t = text.replace(/[−–]/g, '-').replace(/CO₂e?/g, 'CO');
  if (lang === 'fr') t = t.replace(/(\d) (\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2');
  else t = t.replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
  return (t.match(/\d+(?:\.\d+)?/g) ?? []).sort();
}

// ------------------------------------------------------------------------------------------------ the catalogue

describe('parts catalogue', () => {
  it('has exactly the ids of docs/research.md §4, each once, in catalogue order, at least the 36 of the bar', () => {
    const ids = PARTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(WORLDS.flatMap((w) => partIds(w)));
    expect(ids.length).toBe(51);
    expect(ids.length).toBeGreaterThanOrEqual(36);
    expect(partIds('site').length).toBe(13);
    expect(partIds('silo').length).toBe(14);
    expect(partIds('pipe-cell').length).toBe(9);
    expect(partIds('plant-room').length).toBe(15);
  });

  it('agrees with the research file, id by id', () => {
    const docs = import.meta.glob('../../docs/research.md', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;
    const research = docs['../../docs/research.md']!;
    const section = research.slice(research.indexOf('## 4. The part ids'), research.indexOf('### 4.5'));
    const fromResearch = [...section.matchAll(/^\| `([a-z-]+)` +\|/gm)].map((m) => m[1]!);
    expect(fromResearch.length).toBe(51);
    expect(new Set(PARTS.map((p) => p.id))).toEqual(new Set(fromResearch));
  });

  it('gives every part its world and its category', () => {
    for (const world of WORLDS)
      for (const id of partIds(world)) {
        const p = PARTS.find((x) => x.id === id)!;
        expect(p.scene, id).toBe(world);
        expect(p.category, id).toBe(PART_CATEGORIES[world][id]);
      }
  });

  it('has at least three specs per part, a one-line short, a description of two to eight sentences', () => {
    for (const p of PARTS) {
      expect(p.specs.length, p.id).toBeGreaterThanOrEqual(3);
      for (const lang of ['fr', 'en'] as const) {
        expect(p.short[lang].length, `${p.id} short ${lang}`).toBeLessThanOrEqual(170);
        expect(p.short[lang], `${p.id} short`).not.toMatch(/\n/);
        const n = sentences(p.description[lang]);
        expect(n, `${p.id}.description ${lang}: ${n} sentences`).toBeGreaterThanOrEqual(2);
        expect(n, `${p.id}.description ${lang}: ${n} sentences`).toBeLessThanOrEqual(8);
      }
    }
  });

  it('writes the maintenance in three labelled paragraphs, and gives every part a tip and a design note', () => {
    for (const p of PARTS) {
      expect(p.tip, `${p.id} tip`).toBeDefined();
      expect(p.design, `${p.id} design`).toBeDefined();
      expect(p.maintenance, p.id).toBeDefined();
      for (const [lang, labels] of [
        ['fr', ['**Panne à prévoir.**', '**À vérifier.**', '**Entretien.**']],
        ['en', ['**Typical failure.**', '**How to check.**', '**Maintenance.**']],
      ] as const) {
        const paragraphs = p.maintenance![lang].split('\n\n');
        expect(paragraphs.length, `${p.id} ${lang}`).toBe(3);
        labels.forEach((label, i) => expect(paragraphs[i]!.startsWith(label), `${p.id} ${lang}`).toBe(true));
      }
    }
  });

  it('keeps the timestamps inside the main video (2:41)', () => {
    for (const p of PARTS)
      for (const ts of p.video ?? []) {
        const [m, s] = ts.split(':').map(Number);
        expect((m ?? 0) * 60 + (s ?? 0), `${p.id} ${ts}`).toBeLessThanOrEqual(161);
      }
  });

  it('adds a dimension row only for an id of the catalogue, all read from dims.ts and tagged', () => {
    for (const [id, rows] of Object.entries(DIM_SPECS)) {
      expect(
        PARTS.some((p) => p.id === id),
        id,
      ).toBe(true);
      for (const r of rows) {
        expect(isL(r.value) && r.value.en.endsWith('(estimate)'), `${id}: ${r.label.en}`).toBe(true);
        expect(isL(r.value) && r.value.fr.endsWith('(estimation)'), `${id}: ${r.label.fr}`).toBe(true);
      }
    }
    // the rows move with dims.ts: one sample of each world
    const row = (id: string, label: RegExp) =>
      PARTS.find((p) => p.id === id)!.specs.find((s) => label.test(s.label.en))!.value as L;
    expect(row('dh-trench', /width/).en).toContain(SITE.trench.width.toFixed(2));
    expect(row('inner-shell', /thickness/).en).toContain(String(SILO.shellT * 1000));
    expect(row('branch-header', /^Radius/).en).toContain(String(Math.round(PIPE.headerR * 1000)));
    expect(row('expansion-vessel', /^Height/).en).toContain(
      String(Math.round(PLANT.vessel.h * 1000).toLocaleString('en-GB')),
    );
  });
});

describe('what the sheets must say', () => {
  const part = (id: string) => PARTS.find((p) => p.id === id)!;
  const en = (id: string) =>
    partTexts(part(id))
      .map(([, v]) => v.en)
      .join(' ');
  const fr = (id: string) =>
    partTexts(part(id))
      .map(([, v]) => v.fr)
      .join(' ');

  it('the machine holds crushed soapstone, not sand: from the first line of the lab', () => {
    expect(OVERVIEWS.site.text.en.slice(0, 120)).toMatch(/holds no sand/);
    expect(OVERVIEWS.site.text.fr.slice(0, 140)).toMatch(/ne contient pas de sable/);
    expect(LAB_STRINGS.tagline[0]).toMatch(/ne contient pas de sable/);
    expect(LAB_STRINGS.tagline[1]).toMatch(/holds no sand/);
    expect(en('storage-bed')).toMatch(/there is no sand in it/);
    expect(fr('storage-bed')).toMatch(/il ne contient pas de sable/);
  });

  it('never presents 100 MWh as the model’s, nor 69 MWh as measured: both are said, and why they differ', () => {
    for (const [label, v] of visitorTexts()) {
      if (/\b69 MWh/.test(v.en)) expect(v.en, label).toMatch(/model/i);
      if (/\b69 MWh/.test(v.fr)) expect(v.fr, label).toMatch(/modèle/i);
      if (/\b100 MWh/.test(v.en)) expect(v.en, label).not.toMatch(/model (finds|gives) (about )?100 MWh/);
    }
    expect(en('discharge-blower')).toMatch(/published nowhere/);
    expect(en('discharge-blower')).toMatch(/69 MWh, against the 100 MWh quoted/);
    expect(en('storage-bed')).toMatch(/A capacity only means something at a given power/);
    expect(fr('storage-bed')).toMatch(/Une capacité n’a de sens qu’à une puissance donnée/);
    expect(en('storage-bed')).toMatch(/size of the blowers/);
  });

  it('the budget of the 217 MWh is on the sheet of the bed', () => {
    const t = part('storage-bed').description.en;
    expect(t).toMatch(/217 MWh/);
    expect(t).toMatch(/69 MWh out at 1 MW \(32%\)/);
    expect(t).toMatch(/105 MWh at falling power \(48%\)/);
    expect(t).toMatch(/43 MWh stay in the stone \(20%\)/);
    const f = part('storage-bed').description.fr;
    expect(f).toMatch(/69 MWh à 1 MW \(32 %\)/);
    expect(f).toMatch(/105 MWh à puissance décroissante \(48 %\)/);
    expect(f).toMatch(/43 MWh restent dans la pierre \(20 %\)/);
  });

  it('the 250 MWh silo: the ratio is found, the absolute figure is not, and the factors are the model’s', () => {
    const t = part('storage-bed').design!.en;
    expect(t).toMatch(/2\.3 times \(model result\)/);
    expect(t).toMatch(/×1\.2/);
    expect(t).toMatch(/×1\.8/);
    expect(t).toMatch(/×1\.07/);
    expect(t).toMatch(/160 MWh, is not found/);
  });

  it('efficiency: a ceiling on the heat meter, and « no independent measurement » left to the panel, which says it once', () => {
    const t = part('heat-meter').description.en;
    expect(t).toMatch(/91%/);
    expect(t).toMatch(/ceiling/);
    expect(t).toMatch(/they disagree/);
    expect(t).toMatch(/Every figure we found comes from the maker or its customers/);
    const say = /No independent|Nobody has measured a real silo|independent measurement/i;
    expect(visitorTexts().filter(([, v]) => say.test(v.en)).length).toBe(0);
  });

  it('the heat capacity is a curve, soapstone’s is unknown and held at 1.0, an assumption', () => {
    expect(en('quartz-sand')).toMatch(/776 J\/kg·K at 60 °C to 1,133 at 500 °C/);
    expect(en('quartz-sand')).toMatch(/fixed 0\.8 kJ\/kg·K understates/);
    expect(en('crushed-soapstone')).toMatch(
      /holds c fixed at 1\.0 kJ\/kg·K \(assumption\), as its real curve is unknown/,
    );
    expect(fr('crushed-soapstone')).toMatch(
      /tient c fixe à 1,0 kJ\/kg·K \(hypothèse\), car sa courbe réelle est inconnue/,
    );
  });

  it('the equipment floor is a reading, and says so; the pipes are generic and say so; the charging power is not published', () => {
    expect(part('equipment-floor').short.en).toMatch(/^Our reading/);
    expect(part('equipment-floor').short.fr).toMatch(/^Notre lecture/);
    expect(en('equipment-floor')).toMatch(/separate technical building/);
    expect(en('pipe-field')).toMatch(/keeps the layout secret/);
    expect(en('pipe-field')).toMatch(/generic U-pipes/);
    expect(en('resistor-bank')).toMatch(/charging power is not published/);
    expect(en('electrical-annex')).toMatch(/on our reading/);
    expect(en('upper-vent')).toMatch(/on our reading/);
    expect(en('cable-riser')).toMatch(/We read it/);
  });

  it('a pipe sees 5 cm of growth, a blower failure trips the heater, the model has no wear', () => {
    expect(en('expansion-loop')).toMatch(/about 5 cm longer/);
    expect(en('resistor-bank')).toMatch(/With no air/);
    expect(en('inner-shell')).toMatch(/knows no wear/);
  });
});

// ------------------------------------------------------------------------------------------------ the visitor texts

describe('the visitor texts', () => {
  it('have a non-empty French and English text everywhere, no placeholder, no straight apostrophe, balanced bold', () => {
    const bad = /todo|tbd|lorem|xxx|placeholder|\{\w+\}|undefined|NaN|\[object|\$\{/;
    for (const [label, v] of ALL_TEXTS) {
      expect(v.fr.trim().length, `${label} fr`).toBeGreaterThan(0);
      expect(v.en.trim().length, `${label} en`).toBeGreaterThan(0);
      expect(v.fr + v.en, label).not.toMatch(bad);
      expect(v.fr + v.en, label).not.toMatch(/\p{L}'\p{L}/u);
      expect(v.fr.split('**').length % 2, `${label}: unbalanced ** in fr`).toBe(1);
      expect(v.en.split('**').length % 2, `${label}: unbalanced ** in en`).toBe(1);
    }
  });

  it('have no doubled, leading or trailing space, and no space before a comma or a full stop', () => {
    for (const [label, v] of ALL_TEXTS)
      for (const t of [v.fr, v.en]) {
        expect(t, label).not.toMatch(/ {2,}/);
        expect(t, label).toBe(t.trim());
        expect(t, label).not.toMatch(/\s[,.]($|\s)/);
      }
  });

  it('are written differently in the two languages, at the same level of detail', () => {
    for (const [label, v] of ALL_TEXTS) {
      if (v.fr.length < 40 && v.en.length < 40) continue;
      expect(v.fr, label).not.toBe(v.en);
      expect(v.fr.length / v.en.length, label).toBeGreaterThan(0.6);
      expect(v.fr.length / v.en.length, label).toBeLessThan(1.7);
    }
  });

  it('write a percentage the way of each language', () => {
    for (const [label, v] of ALL_TEXTS) {
      expect(v.en, label).not.toMatch(/\d %/);
      expect(v.fr, label).not.toMatch(/\d%/);
    }
  });

  it('keep the same figures in French and English', () => {
    for (const [label, v] of ALL_TEXTS) expect(numbersOf(v.fr, 'fr'), label).toEqual(numbersOf(v.en, 'en'));
  });

  it('tag a non-reported figure the same way in both languages', () => {
    const pairs: [string, string][] = [
      ['(estimation)', '(estimate)'],
      ['(dérivé)', '(derived)'],
      ['(hypothèse)', '(assumption)'],
      ['(résultat du modèle)', '(model result)'],
    ];
    for (const [label, v] of ALL_TEXTS)
      for (const [fr, en] of pairs) expect(v.fr.includes(fr), `${label}: ${fr}: ${v.fr}`).toBe(v.en.includes(en));
  });

  it('leave no French in the English texts', () => {
    const allowed = /Vääksy|Kankaanpää|Lämpö|Ylönen/g;
    for (const [label, v] of ALL_TEXTS) expect(v.en.replace(allowed, ''), label).not.toMatch(/[éèêëàâùûôîïç]/i);
  });

  it('are in British English', () => {
    // "meter" is the measuring device in British English too (heat meter); only a length in meters is American
    const american =
      /\b(colors?|centers?|(?<=\d[  ]?)meters?|liters?|grays?|analyz\w*|behaviors?|fibers?|aluminum|favors?|honors?|labor|neighbors?|catalogs?|defense|license|plow|sulfur|gasoline|molds?|tons|realiz\w*|organiz\w*|recogniz\w*|minimiz\w*|maximiz\w*|optimiz\w*|utiliz\w*|standardiz\w*)\b/i;
    for (const [label, v] of ALL_TEXTS) expect(v.en, label).not.toMatch(american);
  });

  it('never cite the research notes by code, and leak no internal word', () => {
    for (const [label, v] of ALL_TEXTS) {
      expect(v.fr + v.en, label).not.toMatch(/\b(K\d{1,2}|S\d{1,2})\b/);
      expect(v.fr + ' ' + v.en, label).not.toMatch(/(?<!\p{L})(world|preset|undefined|dims\.ts)(?!\p{L})|\bsrc\//iu);
    }
  });

  it('name no person, company or brand outside the Sources panel; of the places, only Pornainen, once', () => {
    const names =
      /Polar Night|Loviisa|Lämpö|Vatajankoski|Lahti|Tulikivi|Elisa|Fingrid|Eronen|Kivioja|Ylönen|Kankaanp|Vääksy|Hiedanranta|Greenstone|Sand Battery\b|YouTube|Two Bit|German Science|Meanwhile In Europe|Baumann|Juul|Hinkelman/;
    for (const [label, v] of visitorTexts()) expect(v.fr + ' ' + v.en, label).not.toMatch(names);
    expect(
      visitorTexts()
        .filter(([, v]) => /Pornainen/.test(v.en))
        .map(([label]) => label),
    ).toEqual(['overview site.text']);
  });

  it('quote nothing from a source read in summary or from an automatic transcript', () => {
    const quotes =
      /equipment space|below us|behind those channels|charges over approximately|relatively high thermal conductivity|can retain heat for months|worst-case winter|local technique tel|sous nous/i;
    for (const [label, v] of ALL_TEXTS) expect(v.fr + ' ' + v.en, label).not.toMatch(quotes);
  });

  it('say no more than their sources: the review of 2 November read them', () => {
    const all = ALL_TEXTS.map(([, v]) => `${v.fr}\n${v.en}`).join('\n');
    // the 160 t is a forecast, absent from the first-year report; the maker says « cool »; a UN article gives the −23 °C; the testing « will begin during the winter »
    expect(all).not.toMatch(/first year the operator announces about 160|pour la première année environ 160/);
    expect(all).toMatch(/Before commissioning, the operator expected about 160 t/);
    expect(all).toMatch(/After a year, the maker reports a 70% cut/);
    expect(all).not.toMatch(/froid au toucher|cold to the touch|extérieur reste froid|surface reste froide/);
    expect(all).not.toMatch(/operator of the first silo has seen|opérateur du premier silo a connu/);
    expect(all).not.toMatch(/largest customer|plus gros client/);
    expect(all).not.toMatch(/all through the winter|tout l’hiver 2024/);
    expect(all).toMatch(/was due to begin during the winter of 2024-2025/);
  });

  it('state no law from memory: no article, no directive number, no limit value', () => {
    const law = /2017\/2398|mg\/m³|2023\/1230|2006\/42|2014\/68|2014\/35|13732/;
    for (const [label, v] of ALL_TEXTS) expect(v.fr + ' ' + v.en, label).not.toMatch(law);
    expect(LAB_STRINGS.legal[1]).toMatch(/industrial installation, subject to the rules of its country/);
    expect(LAB_STRINGS.legal[1]).toMatch(/have not been checked/);
    expect(LAB_STRINGS.legal[0]).toMatch(/n’ont pas été vérifiées/);
  });

  it('say once what is to be said once', () => {
    const count = (re: RegExp, texts: [string, L][] = ALL_TEXTS) => texts.filter(([, v]) => re.test(v.en)).length;
    expect(count(/educational reconstruction/i)).toBe(1);
    expect(count(/not affiliated/i)).toBe(1);
    expect(count(/subject to the rules of its country/)).toBe(1);
    expect(count(/no household product/)).toBe(1);
    // a warning is said once, where the gesture is risky
    expect(count(/respirable crystalline silica/)).toBe(1);
    expect(count(/Confined space/)).toBe(1);
    expect(count(/Work at height/)).toBe(1);
    expect(count(/kills without contact/)).toBe(3); // the transformer's sheet, the board's step, the line's step: three different gestures
  });

  it('hold no number but those of the research and of the model: every other number has to be added here, with its source', () => {
    // REPORTED, by source. The maker's pages and its lead scientist: 1 MW, 100 MWh, 13 × 15 m, 14 × 6 m, 2,000 t, 40 trucks, 400 °C, 2 MW, 3 MW, 250 MWh, 2,400 t, 600 °C, 650 °C (its section), 500 °C
    // (the first silo's core; the air, a documentary, to be checked), 85, 80, 90, 5 %, 60 to 75 %, 200 kW, 8 MWh, 100 t, 7 × 4 m, 80 m³, 30 years, 20 to 200 cycles, 20 kW, 3 MWh, 42 t, 100 m², 350 °C,
    // 6 GWh, 90 to 250 °C, 20 × 30 m, 70 to 80 %, 160 t, 70 %, 60 %, 3 to 373 €/MWh (a secondary source), 36 %, 100 Mt, 3 %, 30 to 35 %, the dates 2022, 2024, 2025, 2026, 2027, −23 °C.
    // MEASURED: sand 776 to 1,187 J/kg·K (60, 100, 200, 300, 400, 500, 600 °C), 1,425 kg/m³, 0.218 and 0.451 W/m·K (25, 500 °C), 0.44; quartz 573 °C, 0.8 %, 25 and 4 K/min; soapstone 3,140 kg/m³, 0.2 %,
    // 0.98 to 1.0 kJ/kg·K and 6 to 12 W/m·K (a heater maker). USUAL: 17 µm/m·K, 500 K, 6 m (the growth). LIMITS OF THE PANEL: 0.8 kJ/kg·K (the fixed value), 0.3 W/m·K (the patent).
    const reported = [
      0, 95, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 13, 14, 15, 16, 17, 20, 25, 30, 35, 36, 40, 42, 45, 50, 60, 70, 75, 80, 85,
      90, 100, 150, 160, 200, 250, 300, 350, 373, 400, 500, 573, 595, 600, 650, 776, 800, 827, 936, 1009, 1072, 1133,
      1187, 1425, 2000, 2024, 2025, 2026, 2022, 2027, 2400, 3140, 0.2, 0.218, 0.3, 0.35, 0.4, 0.44, 0.451, 0.6, 0.8,
      0.98, 1.0, 1.5, 2.5, 3, 7.5,
    ];
    const known = new Set<number>(reported);
    for (const [v, d] of Object.values(FIG)) known.add(Number(v.toFixed(d)));
    const stray: string[] = [];
    for (const [label, v] of ALL_TEXTS)
      for (const n of numbersOf(v.en.replace(/\bA3\b|\b3D\b|CO₂e?/g, ''), 'en').map(Number))
        if (!known.has(n)) stray.push(`${label}: ${n}`);
    expect(stray.join('\n')).toBe('');
  });
});

// ------------------------------------------------------------------------------------------------ the figures against the simulation

describe('the figures of the texts, against the simulation', () => {
  const spec = siloSpec('pornainen');
  const capacity = capacityRun(spec);
  const winter = capacityRun(spec, WINTER_DEMAND);
  const summer = capacityRun(spec, SUMMER_DEMAND);
  const near = (value: number, target: number, tol: number, what: string) =>
    expect(Math.abs(value - target), `${what}: ${value} against ${target}`).toBeLessThanOrEqual(tol);

  it('the budget of a full charge: 69 + 105 + 43 = 217 MWh, 32 + 48 + 20 = 100 %', () => {
    near(capacity.usable / MWH, MODEL.usable, 1.5, 'usable');
    near(capacity.tail / MWH, MODEL.tail, 2, 'tail');
    near((capacity.heatFull - capacity.usable - capacity.tail) / MWH, MODEL.stays, 2, 'stays');
    near(capacity.heatFull / MWH, DERIVED.heatFull, 1, 'heat');
    expect(Math.round(DERIVED.heatFull)).toBe(MODEL.usable + MODEL.tail + MODEL.stays);
    expect(MODEL.shareUsable + MODEL.shareTail + MODEL.shareStays).toBe(100);
    near(capacity.floorT, MODEL.floor, 3, 'floor');
  });

  it('a capacity only means something at a given power', () => {
    near(capacityRun(spec, 800e3).usable / MWH, MODEL.usable800, 2, '800 kW');
    near(winter.usable / MWH, MODEL.usableWinter, 2, 'winter');
    near(winter.hoursUsable / 24, MODEL.daysWinter, 0.4, 'winter days');
    near(winter.shareOfHeat * 100, MODEL.shareWinter, 1, 'winter share');
    near(summer.usable / MWH, MODEL.usableSummer, 3, 'summer');
    near(summer.hoursUsable / 24, MODEL.daysSummer, 3, 'summer days');
    near(summer.shareOfHeat * 100, MODEL.shareSummer, 1.5, 'summer share');
    near(((capacity.usable + capacity.tail) / capacity.heatFull) * 100, MODEL.shareAll, 1.5, 'all');
  });

  it('the range across the estimates, and what would print 100 MWh, never set', () => {
    near(capacityRun({ ...spec, pitch: 0.6 }).usable / MWH, MODEL.rangeLow, 2, 'pitch 0.6');
    near(capacityRun({ ...spec, pitch: 0.6 }).usable / MWH, MODEL.usablePitch06, 2, 'pitch 0.6');
    near(capacityRun({ ...spec, blowerPerMW: 30 }).usable / MWH, MODEL.rangeHigh, 3, 'blower 30');
    near(capacityRun({ ...spec, blowerPerMW: MODEL.blowerFor100 }).usable / MWH, 100, 3, 'blower 8.5');
    near(capacityRun({ ...spec, pitch: 0.4 }).usable / MWH, MODEL.usablePitch04, 2, 'pitch 0.4');
    near(capacityRun({ ...spec, kScale: 0.5 / 0.7 }).usable / MWH, MODEL.usableK05, 2, 'k 0.5');
    near(capacityRun({ ...spec, kScale: 1.0 / 0.7 }).usable / MWH, MODEL.usableK10, 2, 'k 1.0');
    expect(spec.blowerPerMW).toBe(ESTIMATE.blowerRate);
    expect(MODEL.blowerFor100 / spec.blowerPerMW).toBeCloseTo(MODEL.blowerTimes, 1);
  });

  it('the 250 MWh silo: the ratio is found (2.3), not the absolute figure (160 MWh)', () => {
    const v = capacityRun(siloSpec('vaaksy'));
    near(v.usable / MWH, MODEL.usableV, 5, 'usable');
    near(v.usable / capacity.usable, MODEL.ratioV, 0.1, 'ratio');
    near(MODEL.factorMass * MODEL.factorTop * MODEL.factorC, MODEL.ratioV, 0.05, 'the three factors');
  });

  it('efficiency, walls and half-life', () => {
    const year = yearRun(spec, defaultOperation({ strategy: 'threshold', threshold: 40 }));
    near(year.efficiency * 100, MODEL.etaYear, 1, 'year');
    near((year.walls / year.electricity) * 100, MODEL.wallsYear, 0.06, 'walls');
    near((year.circulation / year.electricity) * 100, MODEL.circYear, 0.06, 'circulation');
    near(year.walls / (8760 * 3600) / 1e3, MODEL.lossYear, 2, 'loss over a year');
    near(cycleRun(spec, spec.ratedPower, 1).efficiency * 100, MODEL.etaCycle, 1, 'cycle');
    near(cycleRun(spec, spec.ratedPower, 1).wallShare * 100, MODEL.wallsCycle, 0.6, 'cycle walls');
    near(cycleRun(spec, spec.ratedPower, 7).efficiency * 100, MODEL.etaWeek, 1.5, 'week');
    const idle = idleRun(spec);
    near(idle.halfLifeHeat, MODEL.halfHeat, 6, 'half-life');
    near(idle.halfLifeUsable, MODEL.halfUsable, 3, 'half-life usable');
    near(idle.lossStart / 1e3, MODEL.lossFull, 2, 'loss full');
    near(idle.surface - 5, MODEL.surfaceK, 1, 'surface');
    const thin = idleRun({ ...spec, insulation: spec.insulation / 2 });
    near(thin.halfLifeHeat, MODEL.halfHeatThin, 6, 'half-life thin');
    near(thin.lossStart / 1e3, MODEL.lossThin, 3, 'loss thin');
    near(capacity.full.coreT, MODEL.coreFull, 8, 'core');
    near(capacity.full.edgeT, MODEL.edgeFull, 8, 'edge');
  });

  it('the charge: 183 h at 500 °C of air, 515 h at 400 °C, 120 h at 600 °C', () => {
    near(capacity.hoursCharge, MODEL.chargeHours, 8, '500 °C');
    near(capacityRun({ ...spec, chargeAirT: 600 }).hoursCharge, MODEL.chargeHours600, 8, '600 °C');
    near(capacityRun({ ...spec, chargeAirT: 400 }).hoursCharge, MODEL.chargeHours400, 25, '400 °C');
  });

  it('the pipes: 616 legs, 3.7 km, 66 K, a cell of about 36 h', () => {
    near((Math.PI * 49) / PIPE.pitch ** 2, MODEL.legs, 1, 'legs');
    near((((Math.PI * 49) / PIPE.pitch ** 2) * 6) / 1000, MODEL.pipeKm, 0.05, 'km');
    near(stoneDrop(1e6, 0.7, 0.5, 0.05, Math.PI * 49, 6), MODEL.dropK, 1, 'drop');
    near(pipeCellTime(0.7, 2165 * 1000, pitchRadius(0.5), 0.05) / 3600, MODEL.cellHours, 5, 'cell');
  });

  it('the same silo filled with sand; the first silo; the two drums', () => {
    const sand = capacityRun(siloSpec('pornainen', 'sand'));
    near(sand.usable / MWH, MODEL.sandUsable, 2, 'sand');
    near(sand.heatFull / MWH, MODEL.sandHeat, 2, 'sand heat');
    near(sand.shareOfHeat * 100, MODEL.sandShare, 1.5, 'sand share');
    near(
      capacityRun({ ...siloSpec('pornainen', 'sand'), pitch: 0.35 }).usable / MWH,
      MODEL.sandUsableTight,
      2,
      'sand 0.35',
    );
    const k = capacityRun(siloSpec('kankaanpaa'));
    near(k.usable / MWH, MODEL.kankaUsable, 0.2, 'first silo');
    near((k.usable + k.tail) / MWH, MODEL.kankaFalling, 0.3, 'first silo, falling');
    near(cycleRun(siloSpec('kankaanpaa'), 200e3, 1).efficiency * 100, MODEL.kankaEta, 1.5, 'first silo, cycle');
    near(k.full.coreT, MODEL.kankaCore, 8, 'first silo, core');
    near(k.full.edgeT, MODEL.kankaEdge, 8, 'first silo, edge');
    const drums = siloSpec('two-drums');
    const d = capacityRun(drums, drums.ratedPower, 3, 300);
    near(d.heatFull / 3.6e6, MODEL.drumsFull, 1.5, 'drums heat');
    near((d.usable + d.tail) / 3.6e6, MODEL.drumsFalling, 2, 'drums falling');
    near(idleRun(drums).halfLifeHeat, MODEL.drumsHalfLife, 0.15, 'drums half-life');
  });

  it('a year: the stone’s share, the price paid on the drawn week', () => {
    const optimal = yearRun(spec, defaultOperation({ strategy: 'optimal' }));
    near(optimal.coverage * 100, MODEL.coverageHigh, 2, 'coverage');
    near(optimal.discount * 100, MODEL.discountDrawn, 2, 'discount');
    near(
      yearRun(spec, defaultOperation({ strategy: 'always' })).heat / MWH / 1000,
      MODEL.heatYearAlways,
      0.1,
      'always',
    );
  });

  it('the figures with no run of their own are in the tables of docs/physics.md', () => {
    const docs = import.meta.glob('../../docs/physics.md', { query: '?raw', import: 'default', eager: true }) as Record<
      string,
      string
    >;
    const physics = docs['../../docs/physics.md']!;
    expect(physics).toMatch(/core 516 °C, edge 258 °C/); // coreHotAir, edgeHotAir
    expect(physics).toMatch(/core 497 °C, edge 145 °C/); // kankaCoreKept, kankaEdgeKept
    expect(physics).toMatch(/\*\*7\.4 days\*\*/); // block
    expect(physics).toMatch(/the rule gives 68 paths of 9 legs/); // paths, legsPerPath
    expect(physics).toMatch(/about 10 W\/K in all, against 103 W\/K/); // bridgeWK, restWK
    expect(physics).toMatch(/about 8 K over the air at full, 76 W\/m²/i); // surfaceW
    expect(physics).toMatch(/11 to 25 kW at 1 MW, 2\.3 to 3\.4 kPa/); // the blowers
    expect(physics).toMatch(/\*\*16 kW\/K per MW\*\*/); // exchangerUA
    expect(physics).toMatch(/71 %/); // discountRealLow
    expect(physics).toMatch(/81 %/); // discountRealHigh
    expect(physics).toMatch(/from 217 to 200 MWh and the usable heat rises from 69 to 71 MWh/); // soapstoneCurved
    expect(physics).toMatch(/14 kWh at 2\.5 kW/); // drumsHalfPower
    expect(physics).toMatch(/\*\*46 to 132 MWh\*\*/); // rangeLow, rangeHigh
  });

  it('the derived figures are the arithmetic the research gives', () => {
    expect(Math.round(DERIVED.bedVolume)).toBe(924);
    expect(Math.round(DERIVED.bulkDensity)).toBe(2165);
    expect(Math.round(DERIVED.porosity)).toBe(31);
    expect(DERIVED.perTruck).toBe(50);
    expect(Math.round(DERIVED.heatFull)).toBe(217);
    expect(Math.round(DERIVED.share100)).toBe(46);
    expect(Math.round(DERIVED.densityBed)).toBe(108);
    expect(Math.round(DERIVED.densityWater)).toBe(58);
    expect(Math.round(DERIVED.densityV)).toBe(156);
    expect(Number(DERIVED.airKgS.toFixed(1))).toBe(3.2);
    expect(Math.round(DERIVED.amps)).toBe(1443);
    expect(Math.round(DERIVED.winterKw)).toBe(595);
    expect(Math.round(DERIVED.summerKw)).toBe(139);
    expect(Math.round(DERIVED.specificFirst)).toBe(288);
    expect(Math.round(DERIVED.specificLab)).toBe(180);
    expect(Math.round(DERIVED.specificV)).toBe(375);
    expect(Math.round(DERIVED.specificPilot)).toBe(257);
    expect(Number(DERIVED.growCm.toFixed(0))).toBe(5);
    expect(DERIVED.ratioQuoted).toBe(2.5);
    expect(Math.round(DERIVED.waterKgS)).toBe(6);
    expect(Math.round(DERIVED.sandMass)).toBe(1316);
    expect(ASSUMED.volts).toBe(400);
    expect(PORNAINEN.outerDiameter).toBe(15);
    expect(PORNAINEN.totalHeight).toBe(13);
    expect(PORNAINEN.bedDiameter).toBe(14);
    expect(PORNAINEN.bedHeight).toBe(6);
    expect(PORNAINEN.mass).toBe(2e6);
    expect(PORNAINEN.trucks).toBe(40);
  });
});

// ------------------------------------------------------------------------------------------------ the guides

const ORIGIN_FR = /Origine : (rapporté|pratique courante|notre lecture)[^.]*\.$/;
const ORIGIN_EN = /Origin: (reported|usual practice|our reading)[^.]*\.$/;

describe('the two guides', () => {
  it('have the steps of the bar, each with a unique id', () => {
    expect(ASSEMBLY.length).toBe(20);
    expect(INSTALL.length).toBe(10);
    expect(new Set(ASSEMBLY.map((s) => s.id)).size).toBe(20);
    expect(new Set(INSTALL.map((s) => s.id)).size).toBe(10);
  });

  it('every step ends with its origin, in both languages, the same one', () => {
    for (const s of [...ASSEMBLY, ...INSTALL]) {
      expect(s.text.fr, s.id).toMatch(ORIGIN_FR);
      expect(s.text.en, s.id).toMatch(ORIGIN_EN);
      const fr = ORIGIN_FR.exec(s.text.fr)![1]!;
      const en = ORIGIN_EN.exec(s.text.en)![1]!;
      expect(
        { rapporté: 'reported', 'pratique courante': 'usual practice', 'notre lecture': 'our reading' }[fr],
        s.id,
      ).toBe(en);
    }
  });

  it('say once, at the top of each, that this is a reading and not a plan', () => {
    expect(ASSEMBLY[0]!.text.en).toMatch(/it is our reading, not a plan to copy/);
    expect(ASSEMBLY[0]!.text.fr).toMatch(/c’est notre lecture, pas un plan à copier/);
    expect(INSTALL[0]!.text.en).toMatch(/it is our reading, not a procedure/);
    expect(INSTALL[0]!.text.fr).toMatch(/c’est notre lecture, pas une procédure/);
    const say = /not a plan to copy|not a procedure/;
    expect([...ASSEMBLY, ...INSTALL].filter((s) => say.test(s.text.en)).length).toBe(2);
  });

  it('install every id of silo, pipe-cell and plant-room once in the assembly, every id of the site once in the installation, each in its own world', () => {
    const asm = ASSEMBLY.flatMap((s) => s.parts);
    expect([...asm].sort()).toEqual([...partIds('silo'), ...partIds('pipe-cell'), ...partIds('plant-room')].sort());
    expect(INSTALL.flatMap((s) => s.parts).sort()).toEqual([...partIds('site')].sort());
    for (const s of [...ASSEMBLY, ...INSTALL])
      for (const id of s.parts)
        expect(Object.keys(PART_CATEGORIES[s.scene as WorldId]), `${s.id}: ${id}`).toContain(id);
  });

  it('follow a sensible order, and nothing floats: the spacer on its pipes before the stone, shell before stone, stone before its lid', () => {
    const at = (id: string) => ASSEMBLY.findIndex((s) => s.parts.includes(id));
    for (const [a, b] of [
      ['foundation-slab', 'base-insulation'],
      ['base-insulation', 'inner-shell'],
      ['inner-shell', 'storage-bed'],
      ['heat-pipe', 'pipe-spacer'],
      ['heat-pipe', 'expansion-loop'],
      ['pipe-field', 'thermocouple-lance'],
      ['pipe-spacer', 'storage-bed'],
      ['thermocouple-lance', 'storage-bed'],
      ['crushed-soapstone', 'storage-bed'],
      ['storage-bed', 'top-insulation'],
      ['top-insulation', 'equipment-floor'],
      ['equipment-floor', 'conical-roof'],
      ['equipment-floor', 'hot-air-duct'],
      ['hot-air-duct', 'resistor-bank'],
      ['resistor-bank', 'air-water-exchanger'],
      ['air-water-exchanger', 'control-cabinet'],
    ] as const)
      expect(at(a), `${a} before ${b}`).toBeLessThan(at(b));
    expect(ASSEMBLY[0]!.parts).toEqual([]);
    expect(ASSEMBLY[0]!.scene).toBe('site');
    expect(ASSEMBLY.filter((s) => s.parts.length === 0).length).toBe(1);
    expect(INSTALL.filter((s) => s.parts.length === 0).map((s) => s.id)).toEqual([
      'cold-tests',
      'first-heating',
      'winter-tests',
      'first-heat',
      'optimiser',
    ]);
  });

  it('give no recipe figure: no torque, no duration, no weld, no cure time, no steel grade, no pipe count beyond the model’s drawing', () => {
    for (const s of [...ASSEMBLY, ...INSTALL]) {
      expect(s.torque, s.id).toBeUndefined();
      expect(s.duration, s.id).toBeUndefined();
      expect(s.tools?.length ?? 0, s.id).toBeGreaterThan(0);
      expect(s.text.en, s.id).not.toMatch(/N·m|\bMPa\b|\bmm\b|\bbar\b|\b304\b|\b316\b|days? of cure/);
    }
  });

  it('keep each step readable, and say what it is for', () => {
    for (const s of [...ASSEMBLY, ...INSTALL]) {
      expect(s.text.en.length, s.id).toBeGreaterThan(200);
      for (const lang of ['fr', 'en'] as const) {
        expect(words(s.text[lang]), `${s.id} text ${lang}: ${words(s.text[lang])}`).toBeLessThanOrEqual(90);
        if (s.tip) expect(words(s.tip[lang]), `${s.id} tip ${lang}`).toBeLessThanOrEqual(35);
        if (s.warning) expect(words(s.warning[lang]), `${s.id} warning ${lang}`).toBeLessThanOrEqual(45);
      }
    }
    for (const s of ASSEMBLY.slice(1)) {
      if (s.id === 'stone-test') continue; // choosing a stone: nothing is fitted to check yet
      expect(s.text.en, s.id).toMatch(/check/i);
      expect(s.text.fr, s.id).toMatch(/contrôl/i);
    }
  });

  it('warn where the gesture is risky, once each', () => {
    const asm = (id: string) => ASSEMBLY.find((s) => s.id === id)!;
    const ins = (id: string) => INSTALL.find((s) => s.id === id)!;
    expect(asm('shell').warning?.en).toMatch(/Confined space/);
    expect(asm('filling').warning?.en).toMatch(/silica/);
    expect(asm('roof').warning?.en).toMatch(/Work at height/);
    expect(asm('heat-air').warning?.en).toMatch(/Without air the resistors burn/);
    expect(asm('water').warning?.en).toMatch(/hot and under pressure/);
    expect(asm('electrics').warning?.en).toMatch(/1,443 A/);
    expect(ins('grid').warning?.en).toMatch(/Medium voltage/);
    expect(ins('trench').warning?.en).toMatch(/collapses/);
    expect(ins('first-heating').warning?.en).toMatch(/steam/);
    expect(ins('winter-tests').warning?.en).toMatch(/does not show/);
  });
});

// ------------------------------------------------------------------------------------------------ the sources

describe('the Sources panel', () => {
  it('builds, with its notices and a link for every source', () => {
    installFakeDom();
    setLang('en');
    const panel = aboutPanel({ videoUrl: (ts) => `https://example.test/${ts}` });
    expect(panel.length).toBeGreaterThan(8);
    const text = panel.map((e) => e.textContent).join(' ');
    expect(text).toMatch(/independent educational reconstruction/i);
    expect(text).toMatch(/Polar Night Energy/);
    expect(text).toMatch(/Tulikivi/);
    setLang('fr');
  });

  it('links to every source of the research, as https', () => {
    const docs = import.meta.glob('../../docs/research.md', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;
    const research = docs['../../docs/research.md']!;
    const section = research.slice(research.indexOf('## 1. Sources'), research.indexOf('### 1.1'));
    const wanted = [...section.matchAll(/https:\/\/[^\s|]+/g)].map((m) => m[0]);
    expect(wanted.length).toBeGreaterThan(30);
    const have = new Set(SOURCES.flatMap((g) => g.items.map((s) => s.href)));
    have.add('https://www.youtube.com/watch?v=bZ9TyJ1bQ3Y');
    expect(wanted.filter((u) => !have.has(u)).join('\n')).toBe('');
    for (const u of have) expect(u).toMatch(/^https:\/\//);
  });

  it('keeps the outline of the main video inside its 2:41', () => {
    for (const [ts] of CHAPTERS) {
      const [m, s] = ts.split(':').map(Number);
      expect((m ?? 0) * 60 + (s ?? 0)).toBeLessThanOrEqual(161);
    }
    expect(CHAPTERS.length).toBe(5);
  });

  it('holds the notices: reconstruction, the reading of the figures, safety, the home, the law', () => {
    expect(LAB_STRINGS.disclaimer[1]).toMatch(/independent educational reconstruction/);
    expect(LAB_STRINGS.disclaimer[0]).toMatch(/Reconstitution pédagogique indépendante/);
    expect(LAB_STRINGS.noticeReading[1]).toMatch(/size of the blowers/);
    expect(LAB_STRINGS.safety[1]).toMatch(/does not show/);
    expect(LAB_STRINGS.homeBuild[1]).toMatch(/no household product/);
    expect(LAB_STRINGS.legal[1]).toMatch(/not legal advice/);
  });

  it('has no leftover of the template in the strings, and a real title in each language', () => {
    expect(LAB_STRINGS.labTitle[0]).toMatch(/BATTERIE DE SABLE/);
    expect(LAB_STRINGS.labTitle[1]).toMatch(/SAND BATTERY/);
    for (const [fr, en] of Object.values(LAB_STRINGS))
      expect(fr + en).not.toMatch(/Explorer · Comprendre|flywheel|volant/);
  });
});
