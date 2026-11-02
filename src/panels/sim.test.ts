import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setLang } from '@onigam/lab-kit/i18n';
import type { AppContext } from '@onigam/lab-kit/ui';
import { SandSim } from '../sim/engine';
import { PRESET_IDS, SCENARIO_IDS } from '../sim/presets';
import { MWH, capacityRun } from '../sim/runs';
import { siloSpec } from '../sim/silo';
import type { Scope } from '../sim/types';
import {
  BLOCKS_PER_DAY,
  blockOn,
  budgetSegments,
  capacityChartData,
  energy,
  mainReadouts,
  moreReadouts,
  niceCeil3,
  power,
  powersChartData,
  scaleLine,
  sectionChartData,
  setBlock,
  sinceReadouts,
  specificHeatChartData,
  statusOf,
  tempsChartData,
  weekChartData,
  yearChartData,
  yearReadouts,
} from './model';
import { SimPanel } from './sim';
import { st, sx } from './strings';
import { monthOf, stripAlarms, stripClock, stripValues, STRIP_SPEEDS } from './strip';
import { FakeElement, installFakeDom } from './test-dom';

// The panel rendered on a stand-in for the DOM: that it builds, what it offers, that it follows the simulation, that a click does what it says, in both languages.

beforeAll(() => installFakeDom());
afterEach(() => setLang('fr'));

interface Fixture {
  sim: SandSim;
  panel: SimPanel;
  root: FakeElement;
}

function open(lang: 'fr' | 'en' = 'fr', sim = new SandSim()): Fixture {
  setLang(lang);
  const ctx = { sim, ui: { scene: 'device' }, gotoScene: () => undefined } as unknown as AppContext<SandSim>;
  const panel = new SimPanel(ctx);
  panel.render();
  return { sim, panel, root: panel.el as unknown as FakeElement };
}

const button = (root: FakeElement, label: string): FakeElement => {
  const found = root.find('button').find((b) => b.textContent === label);
  if (!found) throw new Error(`no button « ${label} »`);
  return found;
};
const run = (panel: SimPanel, sim: SandSim, seconds: number): void => {
  for (let i = 0; i < seconds * 30; i++) {
    sim.step(1 / 30);
    panel.tick(1 / 30);
  }
};

describe('what the panel offers', () => {
  it('opens on the plant with its presets, a custom entry and a chip per scenario', () => {
    const { root, sim } = open();
    const options = root.find('option');
    expect(options.slice(0, PRESET_IDS.length).map((o) => o.textContent)).toEqual(
      PRESET_IDS.map((id) => sx('preset', id)),
    );
    expect(options.some((o) => o.textContent === st('custom'))).toBe(true);
    for (const id of SCENARIO_IDS) expect(button(root, sx('scenario', id))).toBeDefined();
    expect(sim.params.preset).toBe('pornainen-soapstone');
  });

  it('shows the live figures in boxes, each with its tag in the data', () => {
    const { root, sim, panel } = open();
    run(panel, sim, 1);
    expect(root.find('.readout')).toHaveLength(mainReadouts(sim.state).length);
    for (const r of mainReadouts(sim.state)) expect(['†', '*', '']).toContain(r.tag);
    expect(root.textContent).toContain('†');
    expect(root.textContent).toContain('°C');
  });

  it('runs the long jobs one by one and fills the budget, the scale, the year', () => {
    const { root, sim, panel } = open('en');
    expect(root.textContent).not.toContain(st('orderHours'));
    run(panel, sim, 1);
    const text = root.textContent;
    expect(text).toContain(st('budgetAtPower'));
    expect(text).toContain(st('scaleTwoDrums'));
    expect(text).toContain(st('yearEfficiency'));
    expect(text).toContain(st('orderHours'));
    expect(text).toContain(st('budgetMaker'));
  });

  it('says the maker’s figure only on the machine it belongs to', () => {
    const { root, sim, panel } = open('en');
    run(panel, sim, 1);
    expect(root.textContent).toContain(st('budgetMaker'));
    sim.applyPreset('vaaksy');
    panel.render();
    run(panel, sim, 1);
    expect(root.textContent).not.toContain(st('budgetMaker'));
  });

  it('builds in both languages, with no empty label', () => {
    for (const lang of ['fr', 'en'] as const) {
      const { root, sim, panel } = open(lang);
      run(panel, sim, 0.5);
      for (const b of root.find('button')) {
        if (b.children.length) expect(b.textContent.length + b.find('svg').length, 'button').toBeGreaterThan(0);
      }
    }
  });
});

describe('what the controls do', () => {
  it('a scenario chip starts it and says its lesson; a change of setting takes the lesson away', () => {
    const { root, sim, panel } = open('en');
    button(root, sx('scenario', 'winter-week')).click();
    expect(sim.params.season).toBe('winter');
    expect(root.textContent).toContain(sx('lesson', 'winter-week'));
    panel.tick(0.3);
    const slider = root.find('input')[0]!;
    slider.value = String(sim.params.ratedPower * 0.9);
    slider.dispatch('input', { target: slider });
    expect(root.textContent).not.toContain(sx('lesson', 'winter-week'));
  });

  it('the preset select changes the machine', () => {
    const { root, sim } = open();
    const select = root.find('select')[0]!;
    select.value = 'vaaksy';
    select.dispatch('change', { target: select });
    expect(sim.params.silo).toBe('vaaksy');
    expect(root.find('.readout').length).toBeGreaterThan(0);
  });

  it('a slider moves its parameter, and the panel follows a scenario that moves one by itself', () => {
    const { root, sim, panel } = open('en');
    button(root, sx('scenario', 'cold-start')).click();
    run(panel, sim, 8);
    expect(sim.params.chargeAirT).toBeGreaterThan(150);
    panel.tick(0.3);
    const inputs = root.find('input');
    expect(inputs.some((i) => Math.abs(Number(i.value) - sim.params.chargeAirT) < 1e-6)).toBe(true);
  });

  it('a failure shows in the status, then clears', () => {
    const { root, sim, panel } = open('en');
    button(root, sx('scenario', 'blower-failure')).click();
    run(panel, sim, 40);
    expect(sim.state.tripped).toBe(true);
    expect(root.textContent).toContain(st('statusTripped'));
    expect(stripAlarms(sim).map((a) => a.key)).toContain('noFlow');
    expect(stripAlarms(sim).find((a) => a.key === 'noFlow')?.severe).toBe(true);
    run(panel, sim, 30);
    expect(root.textContent).not.toContain(st('statusTripped'));
  });

  it('reset starts the machine again', () => {
    const { root, sim, panel } = open();
    run(panel, sim, 1);
    const reset = root.find('button').find((b) => b.getAttribute('aria-label') === st('resetSim'))!;
    reset.click();
    expect(sim.state.simTime).toBeLessThan(5);
  });
});

describe('the game on the panel', () => {
  it('paints a block of three hours, scores it, and can take the opponent’s plan', () => {
    const { root, sim, panel } = open('en');
    run(panel, sim, 1);
    const blocks = root.find('button').filter((b) => b.textContent === '03');
    expect(blocks).toHaveLength(7);
    blocks[0]!.click();
    expect(sim.params.painted.slice(3, 6)).toEqual([true, true, true]);
    expect(sim.params.painted[2]).toBe(false);
    expect(root.textContent).toContain(st('gameYou'));
    expect(root.textContent).toContain(st('gameOpponent'));
    button(root, st('gameCheap')).click();
    expect(sim.params.painted.some(Boolean)).toBe(true);
    expect(root.textContent).toContain(st('gameBeat'));
    button(root, st('gameUse')).click();
    expect(sim.params.strategy).toBe('painted');
    button(root, st('gameClear')).click();
    expect(sim.params.painted.some(Boolean)).toBe(false);
  });
  it('blocks read and write the plan', () => {
    const plan = new Array<boolean>(168).fill(false);
    const after = setBlock(plan, 1, 2, true);
    expect(blockOn(after, 1, 2)).toBe(true);
    expect(blockOn(after, 1, 3)).toBe(false);
    expect(after[24 + 6]).toBe(true);
    expect(BLOCKS_PER_DAY).toBe(8);
    expect(plan.some(Boolean)).toBe(false);
  });
});

describe('the status line', () => {
  it('tells charge, discharge, both, full and idle apart', () => {
    const s = new SandSim();
    const state = { ...s.state, tripped: false, boiler: 0, demand: 0, chargeLevel: 0.5 };
    const p = { ...s.params, blowerFailed: false, reserveCall: false, interlock: true };
    expect(statusOf({ ...state, heater: 0, heatOut: 0 }, p).key).toBe('statusIdle');
    expect(statusOf({ ...state, heater: 1, heatOut: 0 }, p).key).toBe('statusCharging');
    expect(statusOf({ ...state, heater: 0, heatOut: 1 }, p).key).toBe('statusDischarging');
    expect(statusOf({ ...state, heater: 1, heatOut: 1 }, p).key).toBe('statusBoth');
    expect(statusOf({ ...state, heater: 0, heatOut: 0, chargeLevel: 1 }, p).key).toBe('statusFull');
    expect(statusOf({ ...state, boiler: 100, demand: 1000, heater: 0, heatOut: 900 }, p)).toEqual({
      key: 'statusBoiler',
      tone: 'warn',
    });
    expect(statusOf({ ...state, heater: 0, heatOut: 0 }, { ...p, reserveCall: true }).key).toBe('statusReserve');
    expect(
      statusOf({ ...state, heater: 1e6, chargeBlower: 0 }, { ...p, blowerFailed: true, interlock: false }),
    ).toEqual({ key: 'statusBurning', tone: 'warn' });
    expect(statusOf({ ...state, chargeBlower: 0.5 }, { ...p, blowerFailed: true }).key).toBe('statusFailing');
    expect(statusOf({ ...state, tripped: true }, { ...p, blowerFailed: true }).key).toBe('statusTripped');
  });
});

describe('the numbers behind the charts', () => {
  const spec = siloSpec('pornainen');
  const c = capacityRun(spec, spec.ratedPower, 2, 2 * 3600);
  it('the budget adds up to the heat above ambient', () => {
    const rows = budgetSegments(c);
    expect(rows.reduce((a, r) => a + r.joules, 0)).toBeCloseTo(c.heatFull, -3);
    expect(rows[0]!.joules / MWH).toBeGreaterThan(50);
  });
  it('units read well', () => {
    expect(power(1.5e6)).toEqual({ value: 1.5, digits: 2, unit: 'MW' });
    expect(power(500e3).unit).toBe('kW');
    expect(power(500).unit).toBe('W');
    expect(energy(100 * MWH).unit).toBe('MWh');
    expect(energy(3000 * MWH).unit).toBe('GWh');
    expect(energy(0.04 * MWH).unit).toBe('kWh');
  });
  it('an axis top has three round intervals', () => {
    expect(niceCeil3(100) % 3).toBe(0);
    expect(niceCeil3(0)).toBe(3);
  });
  it('the live charts count back from now', () => {
    const scope: Scope = {
      t: [0, 24, 48],
      meanT: [1, 2, 3],
      coreT: [1, 2, 3],
      edgeT: [1, 2, 3],
      heater: [3e5, 0, 0],
      heatOut: [0, 5e5, 0],
      boiler: [0, 0, 0],
      wallLoss: [3e4, 3e4, 3e4],
      price: [1, 1, 1],
      level: [0, 0, 0],
    };
    expect(tempsChartData(scope).xs).toEqual([-2, -1, 0]);
    const w = powersChartData(scope);
    expect(w.unit).toBe('kW');
    expect(w.heat[1]).toBeCloseTo(500, 8);
  });
  it('the section goes from the axis to the wall', () => {
    const sim = new SandSim();
    const d = sectionChartData(sim.state);
    expect(d.xs).toHaveLength(10);
    expect(d.xs[0]).toBeCloseTo(0.35, 6);
    expect(d.xs[9]).toBeCloseTo(6.65, 6);
    expect(d.top).toHaveLength(10);
  });
  it('the capacity chart changes units with the size', () => {
    const big = capacityChartData([{ power: 1e6, usable: 69 * MWH }]);
    expect(big.xUnit).toBe('MW');
    expect(big.yUnit).toBe('MWh');
    const small = capacityChartData([{ power: 5e3, usable: 10 * 3.6e6 }]);
    expect(small.xUnit).toBe('kW');
    expect(small.yUnit).toBe('kWh');
  });
  it('the week’s chart leaves a gap where the plan is off', () => {
    const d = weekChartData([10, 20], [true, false]);
    expect(d.plan[0]).toBe(20);
    expect(d.plan[1]).toBeNaN();
    expect(d.bottom).toBe(0);
  });
  it('the c(T) chart spans the swing, in kJ/kg·K', () => {
    const d = specificHeatChartData();
    expect(d.xs[0]).toBe(20);
    expect(d.sand[0]).toBeLessThan(0.8);
    expect(d.sand[d.sand.length - 1]).toBeGreaterThan(1.1);
    expect(d.fixed[0]).toBe(0.8);
  });
  it('the year and the scale read their runs', () => {
    const sim = new SandSim();
    const y = sim.getYear();
    const d = yearChartData(y);
    expect(d.xs).toHaveLength(365);
    expect(yearReadouts(y).length).toBeGreaterThan(5);
    expect(scaleLine(sim.getScale()[0]!).key).toBe('scaleTwoDrums');
  });
  it('the folded figures exist and are finite', () => {
    const sim = new SandSim();
    for (const r of [...moreReadouts(sim.state, sim.mass), ...sinceReadouts(sim.state)])
      expect(Number.isFinite(r.value), r.key).toBe(true);
  });
});

describe('the strip', () => {
  it('shows the values, the date and the alarms', () => {
    setLang('en');
    const sim = new SandSim();
    const v = stripValues(sim);
    expect(v.map((x) => x.unit)).toContain('°C');
    expect(v).toHaveLength(5);
    expect(stripClock(sim).time).toMatch(/\d+ [A-Z][a-z]+/);
    expect(stripClock(sim).sub).toMatch(/^\d\d:\d\d$/);
    expect(stripAlarms(sim)).toEqual([]);
    expect(STRIP_SPEEDS).toContain(1);
  });
  it('knows its months', () => {
    expect(monthOf(0)).toBe(0);
    expect(monthOf(31)).toBe(1);
    expect(monthOf(364)).toBe(11);
  });
});
