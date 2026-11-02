import { describe, expect, it } from 'vitest';
import { SandSim } from './engine';
import { balanceError, createPlant, stepPlant, wallEnergy, type Conditions } from './plant';
import {
  PRESET_IDS,
  presetParams,
  rangeOf,
  RANGES,
  SCENARIO_IDS,
  scenarioSetup,
  specOf,
  SPEEDS,
  type RangedKey,
} from './presets';
import {
  capacityRun,
  chargeOrderCompare,
  MWH,
  startField,
  weekRun,
  defaultOperation,
  gamePlan,
  scaleRow,
} from './runs';
import { siloSpec } from './silo';
import { ALARM_TEXTS, PRESET_TEXTS, SCENARIO_TEXTS } from './texts';
import {
  demandAt,
  hourOfWeekAt,
  HOURS_PER_WEEK,
  outsideAt,
  priceAt,
  PRICE_WEEKS,
  solarOverflowAt,
  WINTER_DAY,
  winterness,
} from './week';

// The engine as the frame and the 3D use it: time, presets, scenarios, failures, the balance. The key figures are in figures.test.ts.

const run = (sim: SandSim, seconds: number, fps = 30): void => {
  for (let i = 0; i < seconds * fps; i++) sim.step(1 / fps);
};
const spec = siloSpec('pornainen');

describe('energy', () => {
  it('the plant conserves energy to 1e-6 over cycles of charge, heat and both at once', () => {
    for (const s of [
      spec,
      siloSpec('pornainen', 'sand'),
      siloSpec('vaaksy'),
      siloSpec('kankaanpaa'),
      siloSpec('two-drums'),
    ]) {
      const p = createPlant(s, 150);
      const c: Conditions = {
        outsideT: 0,
        supplyT: 85,
        returnT: 45,
        demand: 0,
        chargeRequest: 0,
        chargeOrder: 'core-first',
        spill: 0.5,
      };
      for (let i = 0; i < 600; i++) {
        c.demand = i % 7 < 4 ? s.ratedPower * 0.8 : 0.1 * s.ratedPower;
        c.chargeRequest = i % 11 < 6 ? s.chargePower : 0;
        c.outsideT = -10 + (i % 24);
        stepPlant(p, c, 3600);
      }
      const passed = p.totals.heater + p.totals.heat + wallEnergy(p);
      expect(Math.abs(balanceError(p)) / passed).toBeLessThan(1e-6);
    }
  });

  it('the grid and the step are fine enough: a finer grid or a shorter step moves the usable heat by a few percent at most', () => {
    const base = capacityRun(spec, spec.ratedPower, 3, 3600).usable;
    const finer = capacityRun(spec, spec.ratedPower, 3, 3600, 20, 12).usable;
    const shorter = capacityRun(spec, spec.ratedPower, 3, 900).usable;
    expect(Math.abs(finer / base - 1)).toBeLessThan(0.05);
    expect(Math.abs(shorter / base - 1)).toBeLessThan(0.03);
  });

  it('heat only goes from hot to cold: a bed left alone never exceeds its hottest cell', () => {
    const p = createPlant(spec, 400);
    const c: Conditions = {
      outsideT: 5,
      supplyT: 85,
      returnT: 45,
      demand: 0,
      chargeRequest: 0,
      chargeOrder: 'core-first',
      spill: 0.5,
    };
    for (let i = 0; i < 1000; i++) stepPlant(p, c, 3600);
    for (let i = 0; i < p.grid.nodes.length; i++) expect(p.net.T[i]!).toBeLessThanOrEqual(400.0001);
    expect(p.op.discharge.heat).toBe(0);
  });

  it('no cold bed gives heat: under the supply temperature the exchanger has nothing to give', () => {
    const p = createPlant(spec, 70);
    const c: Conditions = {
      outsideT: 5,
      supplyT: 85,
      returnT: 45,
      demand: 500e3,
      chargeRequest: 0,
      chargeOrder: 'core-first',
      spill: 0.5,
    };
    stepPlant(p, c, 3600);
    expect(p.op.discharge.heat).toBe(0);
    expect(p.op.boiler).toBe(500e3);
  });

  it('a step stays cheap on a phone', () => {
    const p = createPlant(spec, 300);
    const c: Conditions = {
      outsideT: 5,
      supplyT: 85,
      returnT: 45,
      demand: 500e3,
      chargeRequest: 1e6,
      chargeOrder: 'core-first',
      spill: 0.5,
    };
    const t0 = performance.now();
    for (let i = 0; i < 2000; i++) stepPlant(p, c, 1800);
    expect((performance.now() - t0) / 2000).toBeLessThan(1);
  });
});

describe('the zones', () => {
  it('the charge goes to the core first, the discharge takes the outside first', () => {
    const p = createPlant(spec, 200);
    const c: Conditions = {
      outsideT: 5,
      supplyT: 85,
      returnT: 45,
      demand: 300e3,
      chargeRequest: 1e6,
      chargeOrder: 'core-first',
      spill: 0.5,
    };
    stepPlant(p, c, 3600);
    expect(p.op.charge.mask & 1).toBe(1);
    expect(p.op.discharge.mask & 4).toBe(4);
    expect(p.op.charge.mask & p.op.discharge.mask).toBe(0);
  });

  it('a mid-charge has a hot core and a cool edge; the charge then spreads', () => {
    const p = createPlant(spec, 100);
    const c: Conditions = {
      outsideT: 5,
      supplyT: 85,
      returnT: 45,
      demand: 0,
      chargeRequest: 1e6,
      chargeOrder: 'core-first',
      spill: 0.5,
    };
    for (let i = 0; i < 60; i++) stepPlant(p, c, 3600);
    expect(p.zoneT[0]! - p.zoneT[2]!).toBeGreaterThan(100);
  });

  it('charging evenly gives a hotter edge and more loss than the core first, for the same mean', () => {
    const r = chargeOrderCompare(spec);
    expect(r.even.edgeT).toBeGreaterThan(r['core-first'].edgeT);
    expect(r.even.lostInCharge).toBeGreaterThan(r['core-first'].lostInCharge);
  });

  it('a zone over its limit closes', () => {
    const p = createPlant({ ...spec, coreLimit: 300 }, 305);
    const c: Conditions = {
      outsideT: 5,
      supplyT: 85,
      returnT: 45,
      demand: 0,
      chargeRequest: 1e6,
      chargeOrder: 'core-first',
      spill: 0.5,
    };
    stepPlant(p, c, 3600);
    expect(p.op.charge.heater).toBe(0);
  });

  it('when the heat needs all the zones and a charge is on offer, one zone is left to the charge', () => {
    const p = createPlant(spec, 180);
    const c: Conditions = {
      outsideT: 5,
      supplyT: 85,
      returnT: 45,
      demand: 900e3,
      chargeRequest: 1e6,
      chargeOrder: 'core-first',
      spill: 0.5,
    };
    stepPlant(p, c, 3600);
    expect(p.op.charge.heater).toBeGreaterThan(0);
    expect(p.op.discharge.mask).not.toBe(7);
    expect(p.op.charge.mask & p.op.discharge.mask).toBe(0);
  });
});

describe('what the 3D reads', () => {
  it('the section, the zones, the flows and the moving parts are there and finite', () => {
    const sim = new SandSim();
    run(sim, 3);
    const s = sim.state;
    expect(s.bedT).toHaveLength(60);
    expect(s.rings).toBe(10);
    expect(s.layers).toBe(6);
    for (const T of s.bedT) expect(Number.isFinite(T)).toBe(true);
    expect(s.zones.map((z) => z.id)).toEqual(['core', 'middle', 'outer']);
    expect(s.zones[2]!.rOuter).toBeCloseTo(7, 8);
    expect(s.onDrawnSilo).toBe(true);
    for (const k of [
      'chargeBlower',
      'dischargeBlower',
      'chargeBlowerAngle',
      'dischargeBlowerAngle',
      'pumpAngle',
      'heaterGlow',
      'winter',
    ] as const) {
      expect(Number.isFinite(s[k]), k).toBe(true);
    }
  });

  it('the angles keep increasing while a blower runs, and stop when it stops', () => {
    const sim = new SandSim();
    sim.set({ timeScale: 1, demandOn: true, season: 'winter' });
    run(sim, 2);
    const a0 = sim.state.dischargeBlowerAngle;
    run(sim, 0.2);
    expect(sim.state.dischargeBlowerAngle).not.toBe(a0);
    sim.set({ demandOn: false, timeScale: 3600 });
    run(sim, 3);
    const a1 = sim.state.dischargeBlowerAngle;
    run(sim, 0.5);
    expect(sim.state.dischargeBlowerAngle).toBeCloseTo(a1, 3);
  });

  it('only the presets on the drawn silo colour the section', () => {
    const sim = new SandSim();
    for (const id of PRESET_IDS) {
      sim.applyPreset(id);
      expect(sim.state.onDrawnSilo, id).toBe(id === 'pornainen-soapstone' || id === 'same-silo-sand');
    }
  });

  it('the profile around a pipe goes from the wall to the mean temperature of its cell', () => {
    const sim = new SandSim();
    run(sim, 2);
    const prof = sim.getPipeProfile(2, 3);
    expect(prof.T).toHaveLength(16);
    expect(prof.T[0]).toBeCloseTo(prof.wallT, 6);
    for (const v of prof.T) expect(Number.isFinite(v)).toBe(true);
  });
});

describe('time', () => {
  it('pauses, and goes at the speed it is given', () => {
    const sim = new SandSim();
    sim.set({ running: false });
    const t0 = sim.state.simTime;
    run(sim, 1);
    expect(sim.state.simTime).toBe(t0);
    sim.set({ running: true, timeScale: 3600 });
    run(sim, 2);
    expect(sim.state.simTime - t0).toBeCloseTo(7200, -3);
  });

  it('a long frame does not make a giant step', () => {
    const sim = new SandSim();
    sim.set({ timeScale: 3600 });
    const t0 = sim.state.simTime;
    sim.step(30);
    expect(sim.state.simTime - t0).toBeLessThanOrEqual(0.25 * 3600 + 1);
  });

  it('runs at the week-per-second speed at any frame rate, with the same result within a little', () => {
    const a = new SandSim();
    const b = new SandSim();
    a.set({ timeScale: 604800 });
    b.set({ timeScale: 604800 });
    run(a, 4, 60);
    run(b, 4, 10);
    expect(a.state.meanT).toBeCloseTo(b.state.meanT, -1);
  });

  it('the strip’s speeds include real time for the failures', () => {
    expect(SPEEDS[0]).toBe(1);
    expect(SPEEDS).toContain(604800);
  });

  it('keeps the visitor’s slow motion across a preset', () => {
    const sim = new SandSim();
    sim.set({ slowMo: 0.2 });
    sim.applyPreset('vaaksy');
    expect(sim.params.slowMo).toBe(0.2);
  });
});

describe('the opening', () => {
  it('a new simulation is the same as asking for its preset: floor, usable heat and counters are there at once', () => {
    const fresh = new SandSim();
    const asked = new SandSim();
    asked.applyPreset('pornainen-soapstone');
    expect(fresh.state.floorT).toBeCloseTo(asked.state.floorT, 6);
    expect(fresh.state.floorT).toBeGreaterThan(200);
    expect(fresh.state.usableNow).toBeCloseTo(asked.state.usableNow, 0);
    expect(fresh.state.usableNow / MWH).toBeLessThan(70);
    expect(fresh.state.meanT).toBeCloseTo(asked.state.meanT, 6);
    expect(fresh.state.dischargeBlower).toBeGreaterThan(0);
    run(fresh, 20);
    expect(fresh.state.efficiency).toBeGreaterThan(0.5);
    expect(fresh.state.efficiency).toBeLessThan(1);
  });
});

describe('presets and sliders', () => {
  it('every preset starts in a sound state', () => {
    const sim = new SandSim();
    for (const id of PRESET_IDS) {
      sim.applyPreset(id);
      expect(sim.params.preset).toBe(id);
      expect(sim.state.meanT, id).toBeGreaterThan(50);
      expect(sim.state.alarms, id).toEqual([]);
      run(sim, 5);
      expect(Number.isFinite(sim.state.meanT)).toBe(true);
    }
  });

  it('values stay within their ranges', () => {
    const sim = new SandSim();
    sim.set({ insulation: 99, chargeAirT: -5, ratedPower: 1e9 });
    expect(sim.params.insulation).toBe(RANGES.insulation.max);
    expect(sim.params.chargeAirT).toBe(RANGES.chargeAirT.min);
    expect(sim.params.ratedPower).toBe(RANGES.ratedPower.max);
    expect(sim.params.preset).toBe('custom');
  });

  it('the ranges scale to the machine and hold each preset’s own value', () => {
    for (const id of PRESET_IDS) {
      const p = presetParams(id);
      for (const key of Object.keys(RANGES) as RangedKey[]) {
        const r = rangeOf(key, p.silo);
        const v = p[key] as number;
        expect(v, `${id} ${key}`).toBeGreaterThanOrEqual(r.min - 1e-9);
        expect(v, `${id} ${key}`).toBeLessThanOrEqual(r.max + 1e-9);
      }
    }
  });

  it('changing the medium keeps the temperatures and takes away a third of the mass', () => {
    const sim = new SandSim();
    const T0 = sim.state.meanT;
    const m0 = sim.mass;
    sim.set({ medium: 'sand' });
    run(sim, 0.3);
    expect(sim.mass / m0).toBeCloseTo(1425 / 2165, 3);
    expect(sim.state.meanT).toBeCloseTo(T0, -1);
  });

  it('less insulation means more loss, at once', () => {
    const sim = new SandSim();
    run(sim, 0.5);
    const before = sim.state.wallLoss;
    sim.set({ insulation: 0.2 });
    run(sim, 0.5);
    expect(sim.state.wallLoss).toBeGreaterThan(1.5 * before);
  });

  it('a bigger silo and a hotter one hold more, and specOf reads what the sliders set', () => {
    const p = presetParams('pornainen-soapstone');
    expect(specOf({ ...p, pitch: 0.4 }).pitch).toBe(0.4);
    const sim = new SandSim();
    sim.set({ fullMeanT: 500, chargeAirT: 650 });
    expect(sim.getCapacity().usable).toBeGreaterThan(capacityRun(spec, spec.ratedPower, 2, 2 * 3600).usable);
  });
});

describe('scenarios', () => {
  it('there are 8 to 12, each with its words in both languages, and all run without a broken number', () => {
    expect(SCENARIO_IDS.length).toBeGreaterThanOrEqual(8);
    expect(SCENARIO_IDS.length).toBeLessThanOrEqual(12);
    const sim = new SandSim();
    for (const id of SCENARIO_IDS) {
      const text = SCENARIO_TEXTS[id];
      expect(text.name[0].length * text.name[1].length).toBeGreaterThan(0);
      expect(text.lesson[0].length * text.lesson[1].length).toBeGreaterThan(0);
      sim.applyScenario(id);
      expect(sim.params.preset).toBe('custom');
      run(sim, 6, 20);
      for (const T of sim.state.bedT) expect(Number.isFinite(T), id).toBe(true);
      expect(Number.isFinite(sim.state.costOfHeat), id).toBe(true);
      for (const a of sim.state.alarms) expect(ALARM_TEXTS[a]).toBeDefined();
    }
  });

  it('the first heating: a cold stone, the air climbing, the core ahead of the edge', () => {
    const sim = new SandSim();
    sim.applyScenario('cold-start');
    expect(sim.state.meanT).toBeLessThan(20);
    expect(sim.params.chargeAirT).toBe(150);
    run(sim, 12);
    expect(sim.params.chargeAirT).toBeGreaterThan(150);
    expect(sim.state.meanT).toBeGreaterThan(50);
  });

  it('a winter week: full, no charge, the boiler stays out for days, then comes back', () => {
    const sim = new SandSim();
    sim.applyScenario('winter-week');
    expect(sim.state.chargeLevel).toBeCloseTo(1, 1);
    run(sim, 5); // five days
    expect(sim.state.boiler).toBe(0);
    run(sim, 25); // about 30 days in all
    expect(sim.state.boiler).toBeGreaterThan(0);
    expect(sim.state.alarms).toContain('lowCharge');
  });

  it('ten windless days: no charge bought, the stock falls, the boiler returns', () => {
    const sim = new SandSim();
    sim.applyScenario('windless-days');
    const start = sim.state.meanT;
    run(sim, 9.5);
    expect(sim.state.energyHeater).toBe(0);
    expect(sim.state.meanT).toBeLessThan(start - 100);
    expect(sim.state.energyBoiler).toBeGreaterThan(0);
    run(sim, 1); // the wind is back
    expect(sim.params.priceWeek).toBe('drawn');
  });

  it('a negative-price weekend: the heater is paid to run', () => {
    const sim = new SandSim();
    sim.applyScenario('negative-weekend');
    run(sim, 30);
    expect(sim.state.energyHeater).toBeGreaterThan(0);
    expect(sim.state.costElectric).toBeLessThan(0.5 * (sim.state.energyElectric / 3.6e9) * 60);
  });

  it('idle three months: nothing in, nothing out', () => {
    const sim = new SandSim();
    sim.applyScenario('idle-three-months');
    run(sim, 13);
    expect(sim.state.simTime / 86400).toBeCloseTo(91, -1);
    expect(sim.state.energyHeat).toBe(0);
    expect(sim.state.energyHeater).toBe(0);
    expect(sim.state.meanT).toBeLessThan(400);
    expect(sim.state.meanT).toBeGreaterThan(200);
  });

  it('half the insulation: about twice the loss, a warmer skin', () => {
    const a = new SandSim();
    const b = new SandSim();
    a.applyScenario('idle-three-months');
    b.applyScenario('half-insulation');
    run(a, 0.3);
    run(b, 0.3);
    expect(b.state.wallLoss / a.state.wallLoss).toBeGreaterThan(1.5);
    expect(b.state.surfaceT).toBeGreaterThan(a.state.surfaceT);
  });

  it('the scale: four sizes in turn', () => {
    const sim = new SandSim();
    sim.applyScenario('scale');
    expect(sim.params.silo).toBe('two-drums');
    run(sim, 13);
    expect(sim.params.silo).toBe('kankaanpaa');
    run(sim, 18);
    expect(sim.params.silo).toBe('pornainen');
    run(sim, 18);
    expect(sim.params.silo).toBe('vaaksy');
    expect(sim.state.onDrawnSilo).toBe(false);
  });

  it('the blower fails: the flow falls, the switch trips the heater in seconds, the alarm says so, and it comes back', () => {
    const sim = new SandSim();
    sim.applyScenario('blower-failure');
    run(sim, 6);
    expect(sim.state.heater).toBeGreaterThan(0);
    expect(sim.state.tripped).toBe(false);
    const elementBefore = sim.state.elementT;
    run(sim, 3); // the blower has just stopped: still heating, flow falling
    expect(sim.params.blowerFailed).toBe(true);
    expect(sim.state.heater).toBeGreaterThan(0);
    expect(sim.state.alarms).toContain('noFlow');
    run(sim, 30);
    expect(sim.state.tripped).toBe(true);
    expect(sim.state.heater).toBe(0);
    expect(sim.state.elementT).toBeLessThan(elementBefore + 150);
    expect(sim.state.heatOut).toBeGreaterThan(0); // the discharge has its own blower: the village sees nothing
    run(sim, 30);
    expect(sim.params.blowerFailed).toBe(false);
    expect(sim.state.tripped).toBe(false);
    expect(sim.state.heater).toBeGreaterThan(0);
  });

  it('without the switch the element burns: that is what the switch is for', () => {
    const sim = new SandSim();
    sim.set({ strategy: 'always', timeScale: 1 });
    run(sim, 60);
    sim.set({ interlock: false, blowerFailed: true });
    run(sim, 400);
    expect(sim.state.tripped).toBe(false);
    expect(sim.state.heater).toBeGreaterThan(0);
    expect(sim.state.elementT).toBeGreaterThan(800);
    expect(sim.state.alarms).toContain('elementHot');
  });

  it('K19 reported reserve markets, no revenue figure: the heater sheds at once, the heat to the village does not move', () => {
    const sim = new SandSim();
    sim.applyScenario('reserve-call');
    run(sim, 6);
    expect(sim.state.heater).toBeGreaterThan(0);
    const heat = sim.state.heatOut;
    run(sim, 3);
    expect(sim.state.heater).toBe(0);
    expect(sim.state.heatOut).toBeCloseTo(heat, -3);
    run(sim, 35);
    expect(sim.state.heater).toBeGreaterThan(0);
  });

  it('reset comes back to the start of the scenario', () => {
    const sim = new SandSim();
    sim.applyScenario('blower-failure');
    run(sim, 20);
    sim.reset();
    expect(sim.params.blowerFailed).toBe(false);
    expect(sim.state.tripped).toBe(false);
    expect(sim.state.simTime).toBeLessThan(5);
  });
});

describe('alarms', () => {
  const sim = new SandSim();
  it('each has its words in both languages', () => {
    for (const a of Object.values(ALARM_TEXTS)) {
      expect(a.text[0].length).toBeGreaterThan(0);
      expect(a.text[1].length).toBeGreaterThan(0);
    }
    for (const p of Object.values(PRESET_TEXTS)) expect(p[0] !== p[1]).toBe(true);
  });
  it('a return too near the supply', () => {
    sim.applyPreset('pornainen-soapstone');
    sim.set({ returnT: 60, supplyT: 70 });
    run(sim, 0.5);
    expect(sim.state.alarms).toContain('returnWarm');
  });
  it('too hot an air', () => {
    sim.applyPreset('pornainen-soapstone');
    sim.set({ chargeAirT: 650, strategy: 'always' });
    run(sim, 1);
    expect(sim.state.alarms).toContain('airHot');
  });
  it('a warm skin with almost no insulation', () => {
    sim.applyScenario('half-insulation');
    sim.set({ insulation: 0.05, outsideShift: 20, season: 'summer' });
    run(sim, 0.5);
    expect(sim.state.alarms).toContain('surfaceWarm');
  });
  it('a hot shell when the edge is charged hard with no insulation margin', () => {
    sim.applyScenario('soapstone-vs-sand');
    run(sim, 0.5);
    expect(sim.state.alarms).toContain('wallHot');
  });
  it('a core over its limit', () => {
    sim.applyPreset('pornainen-soapstone');
    sim.set({ coreLimit: 300 });
    run(sim, 0.5);
    expect(sim.state.maxT).toBeGreaterThan(300);
    expect(sim.state.alarms).toContain('coreHot');
  });
});

describe('the week', () => {
  it('prices: the drawn week, a week with no cheap hour, a week with a negative weekend', () => {
    expect(Math.min(...PRICE_WEEKS.windless)).toBeGreaterThanOrEqual(70);
    expect(Math.min(...PRICE_WEEKS.negative)).toBeLessThan(0);
    expect(PRICE_WEEKS.windless).toHaveLength(HOURS_PER_WEEK);
    expect(PRICE_WEEKS.negative).toHaveLength(HOURS_PER_WEEK);
    expect(priceAt('drawn', 168 + 3)).toBe(priceAt('drawn', 3));
    expect(hourOfWeekAt(8, 5)).toBe(24 + 5);
  });
  it('demand and weather follow the seasons', () => {
    expect(winterness('year', WINTER_DAY)).toBeCloseTo(1, 6);
    expect(winterness('summer', WINTER_DAY)).toBeCloseTo(0, 2);
    expect(demandAt('winter', 100, 8, 1e6)).toBeGreaterThan(demandAt('summer', 100, 8, 1e6) * 3);
    expect(outsideAt('winter', 0, 12, 0)).toBeLessThan(outsideAt('summer', 0, 12, 0));
    expect(outsideAt('winter', 0, 12, -17)).toBeLessThan(-20);
    expect(demandAt('winter', 0, 8, 2e6)).toBeCloseTo(2 * demandAt('winter', 0, 8, 1e6), 6);
  });
  it('the sun overflows at noon, never at night', () => {
    expect(solarOverflowAt(13)).toBeGreaterThan(0.9);
    expect(solarOverflowAt(1)).toBe(0);
  });
});

describe('the game', () => {
  const field = startField(spec, 'half');
  const op = defaultOperation({ season: 'winter' });
  const opponent = gamePlan(spec, op, field);
  it('every plan runs on the same week: charging only in the dearest hours costs more than the opponent', () => {
    const week = PRICE_WEEKS.drawn;
    const dearest = week.map((v) => v > 100);
    const bad = weekRun(spec, { ...op, strategy: 'painted', painted: dearest }, field);
    expect(bad.total).toBeGreaterThan(opponent.result.total);
  });
  it('no plain rule beats the opponent, and charging all the time costs far more', () => {
    for (const th of [20, 60, 120]) {
      const plan = PRICE_WEEKS.drawn.map((v) => v <= th);
      expect(weekRun(spec, { ...op, strategy: 'painted', painted: plan }, field).total).toBeGreaterThanOrEqual(
        opponent.result.total - 1e-6,
      );
    }
    const all = new Array<boolean>(HOURS_PER_WEEK).fill(true);
    const always = weekRun(spec, { ...op, strategy: 'painted', painted: all }, field);
    expect(always.total).toBeGreaterThan(1.2 * opponent.result.total);
  });
  it('doing nothing is not free: the stock falls, and the boiler has to answer', () => {
    const none = weekRun(
      spec,
      { ...op, strategy: 'painted', painted: new Array<boolean>(HOURS_PER_WEEK).fill(false) },
      field,
    );
    expect(none.charged).toBe(0);
    expect(none.stockValue).toBeLessThan(0);
    expect(none.total).toBeGreaterThan(opponent.result.total);
  });
  it('the engine scores a painted week, and the opponent', () => {
    const sim = new SandSim();
    const plan = sim.getGamePlan();
    expect(plan.plan).toHaveLength(HOURS_PER_WEEK);
    sim.set({ painted: plan.plan, strategy: 'painted' });
    expect(sim.getPaintedWeek().total).toBeCloseTo(plan.result.total, 0);
  });
});

describe('the charts’ runs', () => {
  it('the scale: the smaller, the quicker the heat goes', () => {
    const big = scaleRow('p', spec);
    const small = scaleRow('d', siloSpec('two-drums'));
    expect(big.halfLife).toBeGreaterThan(50 * small.halfLife);
    expect(small.surfacePerVolume).toBeGreaterThan(10 * big.surfacePerVolume);
    expect(big.heat / MWH).toBeCloseTo(217, -1);
  });
  it('the engine caches what it computes', () => {
    const sim = new SandSim();
    const a = sim.getCapacityCurve();
    const b = sim.getCapacityCurve();
    expect(a[0]).toBe(b[0]);
    expect(a.length).toBe(8);
    expect(a[0]!.usable).toBeGreaterThan(a[7]!.usable);
    expect(sim.getScale()).toHaveLength(4);
    expect(sim.getChargeOrder().even.hours).toBeGreaterThan(0);
    expect(sim.getYear().dayMean).toHaveLength(365);
  });
  it('scenarios start from a real charge, not a drawn field', () => {
    const f = scenarioSetup('winter-week');
    expect(f.start).toBe('full');
    const field = startField(spec, 'full');
    expect(Math.max(...field)).toBeGreaterThan(Math.min(...field));
  });
});
