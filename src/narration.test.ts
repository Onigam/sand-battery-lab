import { readManifest, validateManifest } from '@onigam/lab-kit/narration';
import { describe, expect, it } from 'vitest';
import { PART_CATEGORIES, WORLDS, partIds as partIdsOf, type WorldId } from './data/ids';

// The spoken guide: the scripts (narration/<lang>.json) and the manifests generated from them (public/audio/<lang>) must agree with the lab's worlds, parts
// and modes. The ids come from the frozen contract (src/data/ids.ts), which src/data/data.test.ts holds the lab to, so this file does not need src/lab.ts until
// the audio exists. The audio files are only listed, never loaded.

const sceneIds: string[] = [...WORLDS];
const partIds: string[] = WORLDS.flatMap((w) => partIdsOf(w));
const worldOf = (partId: string): WorldId | undefined => WORLDS.find((w) => partId in PART_CATEGORIES[w]);

const CUE = /\[\[([a-z]+)(?::([^\]]*))?\]\]/g;
const BOOLEAN_CUES = ['xray', 'cutaway', 'flows', 'isolate'];
const MODES = ['explore', 'assembly', 'install', 'sim', 'plans', 'lessons'];
const CAMERA_CUES = ['home', 'scene', 'frame', 'select'];
/** Ceiling set by the owner for the spoken characters of one language, and what a guide aims for (lab-kit/docs/narration-style.md). */
const BUDGET = 30_000;
const AIM = [17_000, 24_000] as const;
/** generate.mjs refuses a longer segment. */
const SEGMENT_CAP = 2_500;
/** What the 3D worlds allow (WORLD in src/three/index.ts, docs/3d.md): a section in the silo and the pipe cell only; X-ray only where it shows an inside (the site needs a
 * selection and hides nothing from the yard, the plant room is already open to the eye). */
const SECTION_IN: WorldId[] = ['silo', 'pipe-cell'];
const XRAY_IN: WorldId[] = ['silo', 'pipe-cell'];

interface Segment {
  id: string;
  scope: string;
  title: string;
  scene: string;
  text: string;
}
interface Script {
  lang: string;
  segments: Segment[];
}

const langOf = (path: string, folder: RegExp): string => folder.exec(path)![1]!;
const scripts = Object.fromEntries(
  Object.entries(
    import.meta.glob('../narration/*.json', { import: 'default', eager: true }) as Record<string, Script>,
  ).map(([path, script]) => [langOf(path, /\/(\w+)\.json$/), script]),
);
const manifests = Object.fromEntries(
  Object.entries(import.meta.glob('../public/audio/*/manifest.json', { import: 'default', eager: true })).map(
    ([path, raw]) => [langOf(path, /\/audio\/(\w+)\//), raw],
  ),
);
const audioFiles = Object.keys(import.meta.glob('../public/audio/*/*.mp3'));

const spokenOf = (s: Segment): string => s.text.replace(CUE, '').replace(/\s+/g, ' ').trim();

describe('narration wiring', () => {
  // the lab asks for the manifests only once the audio is generated
  it.skipIf(Object.keys(manifests).length === 0)('asks for the manifest of the interface language', async () => {
    const { lab } = await import('./lab');
    expect(lab.narration?.manifest).toBe('audio/{lang}/manifest.json');
  });
});

describe('the contract', () => {
  it('has 4 worlds and 51 parts, so 56 segments per language, in French and in English', () => {
    expect(sceneIds).toHaveLength(4);
    expect(partIds).toHaveLength(51);
    expect(Object.keys(scripts).sort()).toEqual(['en', 'fr']);
    for (const lang of Object.keys(scripts)) expect(scripts[lang]!.segments, lang).toHaveLength(1 + 4 + 51);
  });
});

describe.each(Object.keys(scripts))('narration script %s', (lang) => {
  const script = scripts[lang]!;
  const seg = (id: string): Segment => script.segments.find((s) => s.id === id)!;
  const where = (re: RegExp): string[] => script.segments.filter((s) => re.test(spokenOf(s))).map((s) => s.id);

  it('has the lab language and a segment for the intro, every world and every part, once each', () => {
    expect(script.lang).toBe(lang);
    const scopes = script.segments.map((s) => s.scope);
    expect(new Set(scopes).size).toBe(scopes.length);
    expect(new Set(script.segments.map((s) => s.id)).size).toBe(script.segments.length);
    expect(scopes).toEqual(['intro', ...sceneIds.map((id) => `scene:${id}`), ...partIds.map((id) => `part:${id}`)]);
  });

  it('names its segments intro, scene-<world> and part-<id>, with a title and the voice settings', () => {
    for (const s of script.segments) {
      const [kind, id = ''] = s.scope.split(':');
      expect(s.id, s.scope).toBe(kind === 'intro' ? 'intro' : `${kind === 'part' ? 'part' : 'scene'}-${id}`);
      expect(s.title.trim().length, s.id).toBeGreaterThan(2);
      expect(spokenOf(s).length, s.id).toBeGreaterThan(200);
    }
    expect(script).toHaveProperty('settings.speed', 0.95);
    expect(script).toHaveProperty('voiceLabel.fr', 'Voix de synthèse');
    expect(script).toHaveProperty('voiceLabel.en', 'Synthetic voice');
  });

  it('starts every segment in the right world', () => {
    for (const s of script.segments) {
      const [kind, id = ''] = s.scope.split(':');
      const expected = kind === 'part' ? worldOf(id) : kind === 'scene' ? id : 'site';
      expect(s.scene, s.id).toBe(expected);
    }
  });

  it('writes only cues the app knows, on worlds, parts and modes of the lab', () => {
    for (const s of script.segments) {
      for (const [, name = '', arg = ''] of s.text.matchAll(CUE)) {
        const at = `${s.id}: [[${name}${arg ? ':' + arg : ''}]]`;
        if (name === 'home') expect(arg, at).toBe('');
        else if (name === 'scene') expect(sceneIds, at).toContain(arg);
        else if (name === 'frame') for (const id of arg.split(',')) expect(partIds, at).toContain(id);
        else if (name === 'select') expect([...partIds, 'none'], at).toContain(arg);
        else if (name === 'explode') expect(Number(arg), at).toBeGreaterThanOrEqual(0);
        else if (BOOLEAN_CUES.includes(name)) expect(['on', 'off'], at).toContain(arg);
        else if (name === 'mode') expect(MODES, at).toContain(arg);
        else expect.fail(`${at}: unknown cue`);
      }
    }
  });

  it('frames only parts of the current world and switches off what it switches on', () => {
    for (const s of script.segments) {
      let world = s.scene;
      const on = new Set<string>();
      for (const [, name = '', arg = ''] of s.text.matchAll(CUE)) {
        if (name === 'scene') world = arg;
        if (name === 'frame') for (const id of arg.split(',')) expect(worldOf(id), `${s.id}: frame ${id}`).toBe(world);
        if (name === 'select' && arg !== 'none') expect(worldOf(arg), `${s.id}: select ${arg}`).toBe(world);
        if (BOOLEAN_CUES.includes(name)) {
          if (arg === 'on') on.add(name);
          else on.delete(name);
        }
        if (name === 'explode') {
          if (arg === '0') on.delete(name);
          else on.add(name);
        }
      }
      expect([...on], `${s.id} leaves cues on`).toEqual([]);
    }
  });

  it('uses the section and the X-ray only in the silo and the pipe cell', () => {
    for (const s of script.segments) {
      let world = s.scene as WorldId;
      for (const [, name = '', arg = ''] of s.text.matchAll(CUE)) {
        if (name === 'scene') world = arg as WorldId;
        if (name === 'cutaway' && arg === 'on') expect(SECTION_IN, `${s.id}: cutaway in ${world}`).toContain(world);
        if (name === 'xray' && arg === 'on') expect(XRAY_IN, `${s.id}: xray in ${world}`).toContain(world);
      }
    }
  });

  it('keeps a part segment framed by itself: no camera cue, no change of world or mode', () => {
    for (const s of script.segments.filter((x) => x.scope.startsWith('part:'))) {
      const camera = [...s.text.matchAll(CUE)].filter((m) => CAMERA_CUES.includes(m[1] ?? '') || m[1] === 'mode');
      expect(
        camera.map((m) => m[0]),
        s.id,
      ).toEqual([]);
    }
  });

  it('moves the camera at most once every 35 spoken characters', () => {
    for (const s of script.segments) {
      let last: { at: number; cue: string } | undefined;
      let removed = 0;
      for (const m of s.text.matchAll(CUE)) {
        const at = m.index - removed;
        removed += m[0].length;
        if (!CAMERA_CUES.includes(m[1] ?? '')) continue;
        if (last) expect(at - last.at, `${s.id}: ${last.cue} then ${m[0]}`).toBeGreaterThanOrEqual(35);
        last = { at, cue: m[0] };
      }
    }
  });

  it('hops through the four worlds and the modes in the introduction, and ends on the village, nothing selected', () => {
    const cues = [...seg('intro').text.matchAll(CUE)].map((m) => m[0]);
    for (const w of sceneIds) if (w !== 'site') expect(cues, w).toContain(`[[scene:${w}]]`);
    const modes = cues.filter((c) => c.startsWith('[[mode:'));
    expect(modes).toEqual(['assembly', 'install', 'sim', 'lessons', 'plans', 'explore'].map((m) => `[[mode:${m}]]`));
    expect(cues.slice(-2)).toEqual(['[[scene:site]]', '[[select:none]]']);
  });

  it('gives each world a home view first and walks through its parts', () => {
    for (const w of sceneIds) {
      const text = seg(`scene-${w}`).text;
      expect(text.startsWith('[[home]]'), w).toBe(true);
      const framed = new Set([...text.matchAll(/\[\[frame:([^\]]*)\]\]/g)].flatMap((m) => m[1]!.split(',')));
      expect(framed.size, `${w} frames at least 5 parts`).toBeGreaterThanOrEqual(5);
    }
  });

  it('carries each truth of the lab once, and never again', () => {
    const truths: Record<string, Record<string, [RegExp, string]>> = {
      fr: {
        noSand: [/pas de sable|sans sable|pas du sable/i, 'intro'],
        reconstruction: [/reconstitution pédagogique|plan officiel/i, 'intro'],
        generic: [/générique/i, 'intro'],
        whereFiguresComeFrom: [/les chiffres viennent/i, 'intro'],
        noMeasurement: [/mesure indépendante/i, 'intro'],
        heart: [/n’a de sens qu’à une puissance/i, 'intro'],
        full: [/deux cent dix-sept/i, 'intro'],
        atOneMegawatt: [/soixante-neuf/i, 'intro'],
        afterwards: [/cent cinq\b/i, 'intro'],
        stays: [/(?<!cent )quarante-trois/i, 'intro'],
        quoted: [/(?<!deux |trois |quatre )cent mégawattheures/i, 'intro'],
        falseColour: [/fausse couleur|rougeoie/i, 'scene-silo'],
      },
      en: {
        noSand: [/no sand|without sand|not sand/i, 'intro'],
        reconstruction: [/educational reconstruction|official plan/i, 'intro'],
        generic: [/\bgeneric\b/i, 'intro'],
        whereFiguresComeFrom: [/figures come from/i, 'intro'],
        noMeasurement: [/independent measurement/i, 'intro'],
        heart: [/only means something at a given power/i, 'intro'],
        full: [/two hundred and seventeen/i, 'intro'],
        atOneMegawatt: [/sixty-nine/i, 'intro'],
        afterwards: [/a hundred and five\b/i, 'intro'],
        stays: [/(?<!hundred and )forty-three/i, 'intro'],
        quoted: [/\ba hundred megawatt-hours/i, 'intro'],
        falseColour: [/false colour|does not glow/i, 'scene-silo'],
      },
    };
    for (const [truth, [re, id]] of Object.entries(truths[lang]!)) expect(where(re), truth).toEqual([id]);
  });

  it('does not hang a hedge on every figure', () => {
    const hedge = { fr: /dans le modèle/i, en: /in the model/i }[lang as 'fr' | 'en'];
    expect(where(hedge).length).toBeLessThanOrEqual(1);
    const reading = { fr: /notre lecture/i, en: /our reading/i }[lang as 'fr' | 'en'];
    expect(where(reading)).toEqual(['intro']);
  });

  it('says each safety line once, where the gesture is risky', () => {
    const lines: Record<string, Record<string, [RegExp, string]>> = {
      fr: {
        hiddenHeat: [/personne n’ouvre rien à chaud/i, 'part-storage-bed'],
        steam: [/devient de la vapeur/i, 'part-air-water-exchanger'],
        mediumVoltage: [/tue sans contact/i, 'part-pad-transformer'],
        arc: [/finit en arc/i, 'part-lv-switchboard'],
        ladder: [/deux mains/i, 'part-access-ladder'],
        digging: [/avant de creuser/i, 'part-dh-trench'],
        law: [/règles de chaque pays/i, 'scene-site'],
        home: [/deux fûts/i, 'part-quartz-sand'],
      },
      en: {
        hiddenHeat: [/nobody opens anything while hot/i, 'part-storage-bed'],
        steam: [/turns to steam/i, 'part-air-water-exchanger'],
        mediumVoltage: [/kills without contact/i, 'part-pad-transformer'],
        arc: [/ends in an arc/i, 'part-lv-switchboard'],
        ladder: [/both hands/i, 'part-access-ladder'],
        digging: [/before you dig/i, 'part-dh-trench'],
        law: [/rules of each country/i, 'scene-site'],
        home: [/two drums/i, 'part-quartz-sand'],
      },
    };
    for (const [hazard, [re, id]] of Object.entries(lines[lang]!)) expect(where(re), hazard).toEqual([id]);
  });

  it('is anonymous: no person, channel, company, brand, institution or series, and of the places only the country, once', () => {
    const names =
      /pornainen|polar night|loviisa|l[äa]mp[öo]\b|\belisa\b|fingrid|vatajankoski|kankaanp|v[äa][äa]ksy|hiedanranta|\blahti\b|capman|eronen|yl[öo]nen|\bjuul\b|baumann|zunft|\bkth\b|\bdlr\b|hinkelman|milner|tulikivi|greenstone|two bit|meanwhile in europe|german science|interesting engineering|solarthermalworld|new atlas|pv magazine|ess news|heat exchanger world|unric|chalmers|\baalto\b|eu-osha|youtube|wikipedia|maestro|il était une fois|once upon a time|pelton/i;
    for (const s of script.segments) expect(`${s.title} ${spokenOf(s)}`, s.id).not.toMatch(names);
    expect(where(/finlande|finland/i)).toEqual(['intro']);
  });

  it('is spoken text: no digit, symbol, abbreviation or straight quote, one space, no markdown', () => {
    for (const s of script.segments) {
      const spoken = spokenOf(s);
      expect(spoken, s.id).not.toMatch(/[*≈×Ø″%°²³_#<>/\\|«»]|\d/);
      expect(spoken, s.id).not.toMatch(/\b(MWh|kWh|GWh|MW|kW|kPa|kVA|kV|mm|cm|km|Hz|CO2|etc)\b/);
      expect(spoken, s.id).not.toMatch(/['"]/);
      // a cue stands between two spaces (or at an edge), so that taking it out never glues two words together
      expect(s.text, s.id).not.toMatch(/ {2}|\n|^\s|\s$|\S\[\[|\]\]\S/);
      expect(spoken, s.id).not.toMatch(/\.\.(?!\.)|\.{3}/);
    }
  });

  it('keeps the sentences short enough for the subtitles', () => {
    let over120 = 0;
    for (const s of script.segments) {
      for (const sentence of spokenOf(s).split(/(?<=[.!?…])\s+/)) {
        expect(sentence.length, `${s.id}: ${sentence.slice(0, 60)}`).toBeLessThanOrEqual(135);
        if (sentence.length > 120) over120++;
      }
    }
    expect(over120).toBeLessThanOrEqual(2);
  });

  it('marvels without gushing, and asks questions: exclamations and questions as in the style page', () => {
    const all = script.segments.map(spokenOf).join(' ');
    const per1000 = (re: RegExp): number => ((all.match(re) ?? []).length / all.length) * 1000;
    expect(per1000(/!/g)).toBeGreaterThanOrEqual(0.5);
    expect(per1000(/!/g)).toBeLessThanOrEqual(1);
    expect(per1000(/\?/g)).toBeGreaterThanOrEqual(0.25);
    // the same image is not served twice
    expect(where(/tonneau|barrel/i)).toEqual(['part-inner-shell']);
    expect(where(/plomberie|plumbing/i)).toEqual(['part-cold-air-duct']);
  });

  it('speaks to the listener the way the series does: "vous", "on", never "tu"', () => {
    if (lang !== 'fr') return;
    const tu = /(?<!\p{L})(tu|ton|ta|tes|toi)(?!\p{L})/iu;
    for (const s of script.segments) expect(spokenOf(s), s.id).not.toMatch(tu);
  });

  it('writes British English', () => {
    if (lang !== 'en') return;
    for (const s of script.segments)
      expect(`${s.title} ${spokenOf(s)}`, s.id).not.toMatch(
        /\b(color\w*|center\w*|liter\w*|fiber\w*|aluminum|labor|neighbor\w*|gray|meters|kilometers|centimeters|millimeters)\b/i,
      );
  });

  it('stays within the budget, the aim and what the generator accepts', () => {
    const lengths = script.segments.map((s) => spokenOf(s).length);
    const total = lengths.reduce((n, l) => n + l, 0);
    expect(total).toBeLessThanOrEqual(BUDGET);
    expect(total).toBeGreaterThanOrEqual(AIM[0]);
    expect(total).toBeLessThanOrEqual(AIM[1]);
    expect(Math.max(...lengths)).toBeLessThanOrEqual(SEGMENT_CAP);
  });
});

describe.each(Object.keys(manifests))('narration audio %s', (lang) => {
  const { manifest, problems } = readManifest(manifests[lang]);

  it('is a usable manifest that agrees with the lab', () => {
    expect(problems).toEqual([]);
    expect(manifest).not.toBeNull();
    expect(validateManifest(manifest!, { scenes: sceneIds, parts: partIds })).toEqual([]);
  });

  it('has an audio file for every segment and none without a segment', () => {
    const files = audioFiles.filter((f) => f.includes(`/audio/${lang}/`)).map((f) => f.split('/').pop());
    expect(files.sort()).toEqual(manifest!.segments.map((s) => s.file).sort());
  });

  it('is the audio of the script of the same language', () => {
    const script = scripts[lang];
    if (!script) return;
    expect(manifest!.segments.map((s) => s.id).sort()).toEqual(script.segments.map((s) => s.id).sort());
  });
});

describe('the private transcripts', () => {
  // Transcripts of third-party videos stay private: on this machine in ~/.cache/lab-review/research/sand-battery-lab/, or as git-ignored docs/transcript*.md. When they are
  // present, no run of seven words of a script may be copied from them (the captions only serve to check facts). Absent in CI: skipped. They are in English, so both scripts are held to them.
  const words = (t: string): string[] =>
    t
      .toLowerCase()
      .replace(/’/g, "'")
      .replace(/[^a-zàâäçéèêëîïôöùûüÿœ0-9' ]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  const grams = (w: string[], n: number): string[] =>
    Array.from({ length: Math.max(0, w.length - n + 1) }, (_, i) => w.slice(i, i + n).join(' '));
  /** Only what was said: no WebVTT header, no timing line, no inline tag, and rolling captions counted once. */
  const captions = (raw: string): string =>
    raw
      .split('\n')
      .filter((line) => !/^WEBVTT|^Kind:|^Language:|-->|^\d+$/.test(line.trim()))
      .map((line) => line.replace(/<[^>]*>/g, '').trim())
      .filter((line, i, all) => line && line !== all[i - 1])
      .join(' ');
  const inDocs = Object.values(
    import.meta.glob('../docs/transcript*.md', { query: '?raw', import: 'default', eager: true }) as Record<
      string,
      string
    >,
  );
  /** The cache is outside the repository, so it is read at run time; this repo has no Node types, hence the narrow one here. */
  interface Files {
    existsSync(path: string): boolean;
    readdirSync(path: string): string[];
    readFileSync(path: string, encoding: 'utf8'): string;
  }
  const inCache = async (): Promise<string[]> => {
    const home = (globalThis as unknown as { process?: { env: Record<string, string | undefined> } }).process?.env.HOME;
    if (!home) return [];
    const fs = (await import(/* @vite-ignore */ `node:${'fs'}`)) as Files;
    const dir = `${home}/.cache/lab-review/research/sand-battery-lab`;
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(vtt|txt|description)$/.test(f))
      .map((f) => fs.readFileSync(`${dir}/${f}`, 'utf8'));
  };

  it('copies no seven-word run of the captions', async (ctx) => {
    const transcripts = [...inDocs, ...(await inCache())];
    if (transcripts.length === 0) ctx.skip();
    const source = new Set(transcripts.flatMap((t) => grams(words(captions(t)), 7)));
    const copied = Object.entries(scripts).flatMap(([lang, script]) =>
      script.segments.flatMap((s) =>
        grams(words(spokenOf(s)), 7)
          .filter((g) => source.has(g))
          .map((g) => `${lang}/${s.id}: "${g}"`),
      ),
    );
    expect(copied).toEqual([]);
  });
});

describe('narration scripts agree between languages', () => {
  const cues = (text: string) => [...text.matchAll(CUE)].map((m) => m[0]);

  it('have the same segments and the same cues in the same order', () => {
    const [fr, en] = [scripts.fr!, scripts.en!];
    expect(en.segments.map((s) => [s.id, s.scope, s.scene])).toEqual(fr.segments.map((s) => [s.id, s.scope, s.scene]));
    for (const s of fr.segments) expect(cues(en.segments.find((x) => x.id === s.id)!.text), s.id).toEqual(cues(s.text));
  });

  it('put the cues at the same place in the sentence (within a tenth of the segment)', () => {
    const [fr, en] = [scripts.fr!, scripts.en!];
    const share = (s: Segment): number[] => {
      let removed = 0;
      const total = spokenOf(s).length || 1;
      return [...s.text.matchAll(CUE)].map((m) => {
        const at = m.index - removed;
        removed += m[0].length;
        return at / total;
      });
    };
    for (const s of fr.segments) {
      const [a, b] = [share(s), share(en.segments.find((x) => x.id === s.id)!)];
      a.forEach((x, i) => expect(Math.abs(x - b[i]!), `${s.id}: cue ${i}`).toBeLessThanOrEqual(0.1));
    }
  });
});
