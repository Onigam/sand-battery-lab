import { describe, expect, it } from 'vitest';
import { PARTS } from './parts';
import { LESSONS } from './lessons';
import { WORLDS, type WorldId } from './ids';
import { PRESET_IDS, SCENARIO_IDS } from '../sim/presets';
import { SandSim } from '../sim/engine';
import { LESSONS as FROM_LAB } from './lessons';
import { SCENARIO_TEXTS } from '../sim/texts';
import { PANEL_STRINGS } from '../panels/strings';

// The six lessons: the bar, the quiz, each tied to a scenario that exists and a part that stands in the world it opens, the heart of the fourth, the game of the fifth.

describe('the lessons', () => {
  it('meet the bar: six lessons, twelve questions, two each', () => {
    expect(LESSONS.length).toBe(6);
    expect(LESSONS.reduce((n, x) => n + (x.quiz?.length ?? 0), 0)).toBe(12);
    for (const x of LESSONS) expect(x.quiz?.length, x.id).toBe(2);
    expect(LESSONS.map((x) => x.id)).toEqual([
      'heat-in-stone',
      'the-gradient',
      'surface-and-volume',
      'air-carries-the-power',
      'the-cheap-hours',
      'heat-is-not-electricity',
    ]);
    expect(new Set(LESSONS.map((x) => x.id)).size).toBe(6);
    expect(FROM_LAB).toBe(LESSONS);
  });

  it('open each on a real scenario, in a real world, on a part that stands there', () => {
    const used = new Set<string>();
    for (const x of LESSONS) {
      expect(WORLDS, x.id).toContain(x.focus.scene as WorldId);
      expect(SCENARIO_IDS as readonly string[], x.id).toContain(x.focus.scenario);
      expect(x.focus.preset === undefined || (PRESET_IDS as readonly string[]).includes(x.focus.preset), x.id).toBe(
        true,
      );
      expect(PARTS.find((p) => p.id === x.focus.part)?.scene, x.id).toBe(x.focus.scene);
      used.add(x.focus.scenario!);
    }
    expect(used.size).toBe(6);
  });

  it('run: each scenario starts in the engine, with its name and its lesson in both languages', () => {
    const sim = new SandSim();
    for (const x of LESSONS) {
      expect(() => sim.applyScenario(x.focus.scenario!), x.id).not.toThrow();
      const t = SCENARIO_TEXTS[x.focus.scenario as keyof typeof SCENARIO_TEXTS];
      expect(t.name[0].length, x.id).toBeGreaterThan(3);
      expect(t.name[1].length, x.id).toBeGreaterThan(3);
    }
  });

  it('keep each paragraph to a few sentences, a title and a summary that say what the lesson holds', () => {
    for (const x of LESSONS) {
      expect(x.body.length, x.id).toBeGreaterThanOrEqual(3);
      expect(x.figures?.length ?? 0, x.id).toBeGreaterThanOrEqual(3);
      for (const lang of ['fr', 'en'] as const) {
        expect(x.title[lang].length, x.id).toBeGreaterThan(8);
        expect(x.summary[lang].length, x.id).toBeGreaterThan(40);
        for (const b of x.body) expect(b[lang].length, x.id).toBeLessThan(800);
      }
    }
  });

  it('give three choices or more, a good answer in range and not always in the same place, and an explanation', () => {
    const answers: number[] = [];
    for (const x of LESSONS)
      for (const q of x.quiz!) {
        expect(q.choices.length, q.q.en).toBeGreaterThanOrEqual(3);
        expect(q.answer, q.q.en).toBeGreaterThanOrEqual(0);
        expect(q.answer, q.q.en).toBeLessThan(q.choices.length);
        expect(q.explain.en.length, q.q.en).toBeGreaterThan(40);
        expect(q.explain.fr.length, q.q.fr).toBeGreaterThan(40);
        answers.push(q.answer);
      }
    expect(new Set(answers).size).toBeGreaterThan(1);
  });

  it('do not give the answer away by its length: the longest choice is right about as often as chance would have it', () => {
    for (const lang of ['fr', 'en'] as const) {
      let longest = 0;
      for (const x of LESSONS)
        for (const q of x.quiz!) {
          const lengths = q.choices.map((c) => c[lang].length);
          if (lengths[q.answer] === Math.max(...lengths)) longest++;
        }
      expect(longest, lang).toBeLessThanOrEqual(5);
    }
  });

  it('the fourth holds the heart: the budget, the same silo at four powers, what is unknown', () => {
    const l4 = LESSONS.find((x) => x.id === 'air-carries-the-power')!;
    const en = l4.body.map((b) => b.en).join(' ');
    const fr = l4.body.map((b) => b.fr).join(' ');
    expect(en).toMatch(/a capacity only means something at a given power/);
    expect(fr).toMatch(/une capacité n’a de sens qu’à une puissance donnée/);
    expect(en).toMatch(/69 MWh come out at 1 MW/);
    expect(en).toMatch(/105 MWh come out afterwards, at falling power/);
    expect(en).toMatch(/43 MWh stay in the stone/);
    expect(en).toMatch(/published nowhere/);
    expect(en).toMatch(/46 to 132 MWh/);
    expect(en).toMatch(/does not claim to contradict the maker/);
    expect(fr).toMatch(/69 MWh sortent à 1 MW/);
  });

  it('the first says the sand is not sand, c is a curve, soapstone’s an assumption, the ratio found and the figure not', () => {
    const en = LESSONS[0]!.body.map((b) => b.en).join(' ');
    expect(en).toMatch(/holds no sand/);
    expect(en).toMatch(/is no constant/);
    expect(en).toMatch(/an assumption/);
    expect(en).toMatch(/It finds the ratio, not the absolute figure/);
  });

  it('the third is the home question’s one honest answer: no build dimension, a few hours', () => {
    const l3 = LESSONS.find((x) => x.id === 'surface-and-volume')!;
    const en = l3.body.map((b) => b.en).join(' ');
    expect(en).toMatch(/a few hours/);
    expect(en).toMatch(/no product for homes/);
    expect(l3.quiz![1]!.explain.en).toMatch(/No building dimension is given here/);
    expect(en).not.toMatch(/\bmm\b|insulat\w+ of \d/);
  });

  it('the fifth is written around the game as it stands: the name of its section, its blocks, and no word of the backlog', () => {
    const l5 = LESSONS.find((x) => x.id === 'the-cheap-hours')!;
    const en = l5.body.map((b) => b.en).join(' ');
    const fr = l5.body.map((b) => b.fr).join(' ');
    const section = PANEL_STRINGS.secGame!;
    expect(fr).toContain(section[0]);
    expect(en).toContain(section[1]);
    expect(en).toMatch(/three-hour blocks/);
    expect(fr).toMatch(/tranches de trois heures/);
    expect(en).not.toMatch(/stopgap|waiting for|whisker/);
    expect(fr).not.toMatch(/provisoire|attend un vrai|cheveu/);
    expect(en).toMatch(/with whole blocks we have not beaten it/);
    expect(en).toMatch(/drawn by hand and labelled as such/);
    expect(en).toMatch(/The final stock counts/);
    expect(en).toMatch(/No price data ships with this lab/);
  });

  it('the sixth says what it cannot do, and when it is the wrong answer', () => {
    const en = LESSONS[5]!.body.map((b) => b.en).join(' ');
    expect(en).toMatch(/gives back heat/);
    expect(en).toMatch(/When is it the wrong choice/);
    expect(en).toMatch(/When is it the right choice/);
    expect(en).toMatch(/electric boiler/);
    expect(en).toMatch(/heat pump/);
    expect(en).toMatch(/water tank/);
  });
});
