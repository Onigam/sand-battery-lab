// Helpers shared by the part catalogues (src/data/parts/*.ts), the guides, the overviews and the lessons. The helpers of the Mill lab, adapted.
//
// Status of the figures (the same words as docs/physics.md). A figure with NO tag is REPORTED by a source the text names in words (« le constructeur »,
// « the operator », « a measured sand »): the research code never shows. Tagged figures are not reported:
//   « dérivé / derived »                 computed from reported figures;
//   « résultat du modèle / model result » an output of the simulation (src/sim), held to it by data.test.ts;
//   « hypothèse / assumption »           a value the model needs and no source gives;
//   « estimation / estimate »            a dimension or an order of magnitude no source gives.
// The panel of the simulation writes † (a model result) and * (an estimate) in its figures, with one legend; the drawings ‡ (derived) and *. A part sheet has no legend, so it writes the words.
// Nothing here is copied from a transcript or from a source: facts and figures only, in the lab's own words.
import type { Spec } from '@onigam/lab-kit/content';
import { l, type L } from '@onigam/lab-kit/i18n';
import { ASSUMED_KEYS, DERIVED_KEYS, ESTIMATE_KEYS, FIG, MODEL_KEYS } from './figures';
import { nEn, nFr } from './units';

/** English form of a number written the French way (7,5 -> 7.5 ; 5 700 -> 5,700 ; 40 % -> 40%). */
export function enNum(fr: string): string {
  return fr
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/(\d) (\d{3})(?!\d)/g, '$1,$2')
    .replace(/(\d) %/g, '$1%');
}

/** Plain value written the French way: derive the English form when it differs. */
export function num(fr: string): L | string {
  const en = enNum(fr);
  return en === fr ? fr : l(fr, en);
}

/** Spec row with a bilingual label and a plain (auto-localised) or bilingual value. */
export function sp(fr: string, en: string, value: string | L): Spec {
  return { label: l(fr, en), value: typeof value === 'string' ? num(value) : value };
}

export type Status = 'derived' | 'model' | 'assumed' | 'estimate';

export const TAG: Record<Status, readonly [string, string]> = {
  derived: ['dérivé', 'derived'],
  model: ['résultat du modèle', 'model result'],
  assumed: ['hypothèse', 'assumption'],
  estimate: ['estimation', 'estimate'],
};

/** A value that is not reported by a source, tagged in both languages. `en` defaults to the converted `fr`. */
export function tagged(status: Status, fr: string, en?: string): L {
  const [tf, te] = TAG[status];
  return l(`${fr} (${tf})`, `${en ?? enNum(fr)} (${te})`);
}

/** A length in metres shown in metres, tagged unless reported (status null). */
export function lenM(status: Status | null, digits: number, ...metres: number[]): L {
  const fr = metres.map((m) => nFr(m, digits)).join(' × ');
  const en = metres.map((m) => nEn(m, digits)).join(' × ');
  return status ? tagged(status, `${fr} m`, `${en} m`) : l(`${fr} m`, `${en} m`);
}

/** A length in metres shown in millimetres, tagged unless reported (status null). */
export function lenMm(status: Status | null, ...metres: number[]): L {
  const fr = metres.map((m) => nFr(m * 1000, 0)).join(' × ');
  const en = metres.map((m) => nEn(m * 1000, 0)).join(' × ');
  return status ? tagged(status, `${fr} mm`, `${en} mm`) : l(`${fr} mm`, `${en} mm`);
}

function fill(text: string, lang: 'fr' | 'en'): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => {
    const f = FIG[key];
    if (!f) throw new Error(`unknown figure {${key}} in "${text}"`);
    return lang === 'fr' ? nFr(f[0], f[1]) : nEn(f[0], f[1]);
  });
}

/** A text that uses a model result, a derived figure, an assumption or an estimate must say so in the same text, in each language. */
function checkStatus(fr: string, en: string, filledFr: string, filledEn: string): void {
  const keys = [...new Set([...fr.matchAll(/\{(\w+)\}/g), ...en.matchAll(/\{(\w+)\}/g)].map((m) => m[1] as string))];
  const need = (set: ReadonlySet<string>, reFr: RegExp, reEn: RegExp, what: string) => {
    if (keys.some((k) => set.has(k)) && !(reFr.test(filledFr) && reEn.test(filledEn)))
      throw new Error(`a ${what} figure is used without saying so (both languages): "${filledFr}" / "${filledEn}"`);
  };
  need(MODEL_KEYS, /modèle/i, /model/i, 'model-result');
  need(DERIVED_KEYS, /dérivé/i, /derived/i, 'derived');
  need(ASSUMED_KEYS, /hypoth|suppos/i, /assum/i, 'assumed');
  need(ESTIMATE_KEYS, /estim/i, /estimat/i, 'estimated');
}

/** Bilingual text whose {placeholders} are FIG numbers, written the French way in `fr` and the English way in `en`. */
export function lf(fr: string, en: string): L {
  const filled = { fr: fill(fr, 'fr'), en: fill(en, 'en') };
  checkStatus(fr, en, filled.fr, filled.en);
  return l(filled.fr, filled.en);
}

/** Same as `lf` for a spec value that is not reported by a source: adds the status tag. `en` defaults to `fr`. */
export function tf(status: Status, fr: string, en?: string): L {
  const [tagFr, tagEn] = TAG[status];
  const filled = { fr: `${fill(fr, 'fr')} (${tagFr})`, en: `${fill(en ?? fr, 'en')} (${tagEn})` };
  checkStatus(fr, en ?? fr, filled.fr, filled.en);
  return l(filled.fr, filled.en);
}

/**
 * The three paragraphs of a `maintenance` text (the kit renders a blank line as a paragraph break), each opened by a bold label, in this order: the
 * typical failure, how it is checked, the routine care.
 */
export function maint(
  fr: { failure: string; check: string; care: string },
  en: { failure: string; check: string; care: string },
): L {
  return lf(
    `**Panne à prévoir.** ${fr.failure}\n\n**À vérifier.** ${fr.check}\n\n**Entretien.** ${fr.care}`,
    `**Typical failure.** ${en.failure}\n\n**How to check.** ${en.check}\n\n**Maintenance.** ${en.care}`,
  );
}

/** Where a guide step comes from: the last sentence of its text, in both languages (docs/research.md §0.5). */
export type Origin = 'reported' | 'practice' | 'reading';
const ORIGIN: Record<Origin, readonly [string, string]> = {
  reported: ['rapporté', 'reported'],
  practice: ['pratique courante', 'usual practice'],
  reading: ['notre lecture', 'our reading'],
};

/** A guide step's text with its origin as its last words: `Origine : pratique courante.` An optional precision goes after the word. */
export function step(origin: Origin, fr: string, en: string, more?: readonly [string, string]): L {
  const [of, oe] = ORIGIN[origin];
  return lf(`${fr} Origine : ${of}${more ? ` ${more[0]}` : ''}.`, `${en} Origin: ${oe}${more ? ` ${more[1]}` : ''}.`);
}
