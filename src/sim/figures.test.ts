import { describe, expect, it } from 'vitest';
import { lumpedTwin } from './operate';
import { createPlant, floorTemperature, heatAbove, stepPlant, wallState } from './plant';
import { presetParams, specOf } from './presets';
import {
  AMBIENT_T,
  capacityRun,
  chargeToFull,
  cycleRun,
  defaultOperation,
  dischargeRun,
  idleRun,
  MEAN_OUTSIDE,
  MWH,
  RETURN_T,
  SUPPLY_T,
  yearRun,
} from './runs';
import {
  designAirFlow,
  designExchangerUA,
  lineCurrent,
  materialFor,
  PORNAINEN,
  RHO_BULK,
  siloSpec,
  stoneDrop,
  STEEL_K,
} from './silo';
import {
  buildGrid,
  createNetwork,
  crushedSoapstone,
  makeMaterial,
  pipeCellFactor,
  pipeCellTime,
  pitchRadius,
  piecewise,
  QUARTZ_SAND_C,
  quartzNistC,
  quartzSand,
  stepNetwork,
  uniformEdges,
} from './thermal';
import { PRICE_WEEKS, SUMMER_DEMAND, WINTER_DEMAND } from './week';

// One test per key figure of docs/research.md, with its K number in the name.
//   exact figures: arithmetic, the model retrieves them.
//   compare figures: the test pins WHAT THE MODEL GIVES, with the reported value in its name. A pin is not a target: nothing in the model is tuned
//   to these. When a pin moves, the tables of docs/physics.md move with it. No figure of any real silo was measured independently.

const spec = siloSpec('pornainen');
const vaaksy = siloSpec('vaaksy');
const kanka = siloSpec('kankaanpaa');
const drums = siloSpec('two-drums');

/** Mean of a c(T) over a range, J/kg·K, by the enthalpy that goes with it. */
const meanC = (c: (T: number) => number, a: number, b: number): number => {
  const m = makeMaterial({ name: 'x', rho: 1, c, k: () => 1 });
  return (m.h(b) - m.h(a)) / (b - a);
};

// Runs shared by several figures: done once, they take a fraction of a second.
const capacity = capacityRun(spec);
const capacityWinter = capacityRun(spec, WINTER_DEMAND);
const capacitySummer = capacityRun(spec, SUMMER_DEMAND);
const capacityV = capacityRun(vaaksy);
const capacityK = capacityRun(kanka);
const capacityD = capacityRun(drums, drums.ratedPower, 3, 300);
const idle = idleRun(spec);
const yearOptimal = yearRun(spec, defaultOperation({ strategy: 'optimal' }));
const yearThreshold = yearRun(spec, defaultOperation({ strategy: 'threshold', threshold: 40 }));
const yearAlways = yearRun(spec, defaultOperation({ strategy: 'always' }));
const cycleRated = cycleRun(spec, spec.ratedPower, 1);

describe('the plant as reported', () => {
  it('K3 reported 1 MW of heat: the design point of the preset, held while the stone allows', () => {
    expect(presetParams('pornainen-soapstone').ratedPower).toBe(1e6);
    const p = createPlant(spec, 400);
    stepPlant(
      p,
      {
        outsideT: 5,
        supplyT: SUPPLY_T,
        returnT: RETURN_T,
        demand: 1e6,
        chargeRequest: 0,
        chargeOrder: 'core-first',
        spill: 0.5,
      },
      3600,
    );
    expect(p.op.discharge.heat / 1e6).toBeCloseTo(1, 2);
  });

  it('K4 reported up to 100 MWh: the model gives about 69 MWh at the rated 1 MW, with a blower of 5 m³/s per MW', () => {
    expect(capacity.usable / MWH).toBeCloseTo(69, -0.5);
    expect(capacity.hoursUsable).toBeGreaterThan(60);
    expect(capacity.hoursUsable).toBeLessThan(80);
  });

  it('K4 and K32: the usable heat depends on the power: about 122 MWh at winter demand, about 160 MWh at summer demand', () => {
    expect(capacityWinter.usable / MWH).toBeCloseTo(122, -0.5);
    expect(capacitySummer.usable / MWH).toBeCloseTo(160, -0.5);
  });

  it('K4 what would print 100 MWh: a blower about 1.7 times the estimate. Shown, never set', () => {
    const big = capacityRun({ ...spec, blowerPerMW: 8.5 });
    expect(Math.abs(big.usable / MWH - 100)).toBeLessThan(3);
    expect(spec.blowerPerMW).toBe(5);
  });

  it('K5 and K6 reported silo 15 × 13 m, bed 14 × 6 m: 924 m³, and a wall build-up of 0.5 m at most', () => {
    const volume = Math.PI * 7 * 7 * 6;
    expect(volume).toBeCloseTo(923.6, 1);
    expect(PORNAINEN.wallBuildUp).toBeCloseTo((PORNAINEN.outerDiameter - PORNAINEN.bedDiameter) / 2, 8);
    expect(PORNAINEN.wallInsulation).toBeLessThanOrEqual(PORNAINEN.wallBuildUp);
    const stack = PORNAINEN.stack;
    expect(stack.foundationAndBase + stack.bed + stack.topInsulation + stack.equipmentFloor + stack.roof).toBeCloseTo(
      PORNAINEN.totalHeight,
      8,
    );
  });

  it('K7 reported 2,000 t in 40 trucks: 50 t a truck, and the grid holds 2,000 t', () => {
    expect(PORNAINEN.mass / PORNAINEN.trucks).toBe(50000);
    expect(createPlant(spec).mass / 1000).toBeCloseTo(2000, 6);
  });

  it('K8 reported about 400 °C on average at full charge: an input the charge reaches, with 500 °C of air', () => {
    expect(capacity.full.meanT).toBeCloseTo(400, 0);
    expect(capacity.full.maxT).toBeLessThan(spec.chargeAirT);
  });

  it('K8 and K22: a mean of 400 °C under 500 °C of air leaves little room for a hot core: core about 417 °C, edge about 375 °C', () => {
    expect(capacity.full.coreT).toBeCloseTo(417, -1);
    expect(capacity.full.edgeT).toBeCloseTo(375, -1);
  });

  it('K9 reported half-life about 3 months, in the maker’s model: the model brackets it, 190 days for the heat above ambient, 45 days for the heat usable at full power', () => {
    expect(idle.halfLifeHeat).toBeCloseTo(190, -1);
    expect(idle.halfLifeUsable).toBeCloseTo(45, -1);
    expect(idle.halfLifeHeat).toBeGreaterThan(90);
    expect(idle.halfLifeUsable).toBeLessThan(90);
  });

  it('K10 reported about 80 %, above 85 %, 80 to 90 %: a year gives about 90 %, a cycle at full power with a day of rest each way about 84 %', () => {
    expect(yearOptimal.efficiency).toBeCloseTo(0.91, 1);
    expect(yearThreshold.efficiency).toBeCloseTo(0.91, 1);
    expect(yearAlways.efficiency).toBeCloseTo(0.9, 1);
    expect(cycleRated.efficiency).toBeCloseTo(0.84, 1);
  });

  it('K11 reported circulation and charging about 5 %, storage time often under 5 %: over a year about 4 % and 5 % of the electricity', () => {
    const y = yearOptimal;
    expect(y.circulation / y.electricity).toBeCloseTo(0.044, 3);
    expect(y.walls / y.electricity).toBeCloseTo(0.046, 3);
    // a single full-power cycle is shorter in heat and just as long in days: the walls weigh more
    expect(cycleRated.circulationShare).toBeCloseTo(0.043, 1);
    expect(cycleRated.wallShare).toBeCloseTo(0.115, 1);
  });

  it('K12 and K36 reported almost a month of summer, about a week of winter: DERIVED 139 and 595 kW, 3.2 GWh and 32 cycles of 100 MWh', () => {
    expect(WINTER_DEMAND / 1e3).toBeCloseTo(595, 0);
    expect(SUMMER_DEMAND / 1e3).toBeCloseTo(139, 0);
    const annual = ((WINTER_DEMAND + SUMMER_DEMAND) / 2) * 8760;
    expect(annual / 1e9).toBeCloseTo(3.2, 1);
    expect(annual / 100e6).toBeCloseTo(32, 0);
  });

  it('K12 how long the model holds these demands from full: about 8.5 days of winter, about 48 days of summer', () => {
    expect(capacityWinter.hoursUsable / 24).toBeCloseTo(8.5, 0);
    expect(capacitySummer.hoursUsable / 24).toBeCloseTo(48, -1);
  });

  it('K13 reported chips −60 %, oil −100 %: with the optimiser the silo gives about 83 % of the heat, under a 40 €/MWh rule about 81 %', () => {
    expect(yearOptimal.coverage).toBeCloseTo(0.83, 1);
    expect(yearThreshold.coverage).toBeCloseTo(0.81, 1);
  });

  it('K14 reported charging 70 to 80 % under the spot average: on the drawn week, the optimiser buys about 63 % under its mean (a real year is checked offline, docs/physics.md)', () => {
    expect(yearOptimal.discount).toBeCloseTo(0.63, 1);
    expect(yearThreshold.discount).toBeCloseTo(0.66, 1);
    expect(yearAlways.discount).toBeLessThan(0.02);
  });

  it('K15 reported 3 to 373 €/MWh within a week: the span of the drawn week', () => {
    const w = PRICE_WEEKS.drawn;
    expect(w).toHaveLength(168);
    expect(Math.min(...w)).toBe(3);
    expect(Math.max(...w)).toBe(373);
  });

  it('K16 reported, secondary, about 100 hours of charge: the model takes about 180 h from its floor to full at 1 MW offered, as the loop limits the power', () => {
    expect(capacity.hoursCharge).toBeCloseTo(183, -1);
    const hot = capacityRun({ ...spec, chargeAirT: 600 });
    expect(hot.hoursCharge).toBeCloseTo(120, -1);
  });

  it('K17 reported, unconfirmed, about 3,000 MWh and 30 cycles: the model passes 2.7 GWh with the optimiser, 3.2 GWh if it never refuses to charge', () => {
    expect(yearOptimal.heat / MWH / 1000).toBeCloseTo(2.7, 0);
    expect(yearAlways.heat / MWH / 1000).toBeCloseTo(3.2, 1);
  });
});

describe('the other silos', () => {
  it('K21 reported 20 kW, 3 MWh, 42 t: 257 kJ/kg, DERIVED', () => {
    expect((3 * MWH) / 42000 / 1000).toBeCloseTo(257, 0);
  });

  it('K22 reported 8 MWh at 200 kW, core about 500 °C, edge 150 to 200 °C: the model gives about 2 MWh at 200 kW, core about 404 °C, edge about 247 °C at a mean of 340 °C', () => {
    expect(capacityK.usable / MWH).toBeCloseTo(2.2, 0);
    expect(capacityK.full.coreT).toBeCloseTo(404, -1);
    expect(capacityK.full.edgeT).toBeCloseTo(247, -1);
    // going on at a falling power, the rest comes out
    expect((capacityK.usable + capacityK.tail) / MWH).toBeCloseTo(7.4, 0);
    expect(capacityRun(kanka, 100e3).usable / MWH).toBeCloseTo(5.5, 0);
  });

  it('K22 reported 60 to 75 % overall, 85 % on three-day cycles: the model gives about 75 % at a cycle with a day of rest each way, far less when it rests a week', () => {
    const short = cycleRun(kanka, kanka.ratedPower, 1);
    const long = cycleRun(kanka, kanka.ratedPower, 7);
    expect(short.efficiency).toBeCloseTo(0.75, 1);
    expect(long.efficiency).toBeLessThan(short.efficiency - 0.2);
  });

  it('K23 reported 250 MWh at 2 MW, about 2,400 t, above 500 °C: the model gives about 160 MWh with the same blower rule and a mean of 500 °C', () => {
    expect(capacityV.usable / MWH).toBeCloseTo(160, -1);
    expect(capacityV.full.meanT).toBeCloseTo(500, 0);
    expect(capacityV.floorT).toBeCloseTo(capacity.floorT, -1);
  });

  it('K23 and K31 reported ratio 2.5 at nearly the same size: the model gives 2.3, from the mass, from c(T), and most of all from a higher top above the same floor', () => {
    const ratio = capacityV.usable / capacity.usable;
    expect(ratio).toBeCloseTo(2.3, 0);
    // at a bigger blower for both, the same floor sits lower and the ratio falls
    const p10 = capacityRun({ ...spec, blowerPerMW: 10 });
    const v10 = capacityRun({ ...vaaksy, blowerPerMW: 10 });
    expect(v10.usable / p10.usable).toBeCloseTo(2, 0);
    // a reading, not a finding: the same bigger blower and a mean of about 560 °C print about 250 MWh
    expect(capacityRun({ ...vaaksy, blowerPerMW: 10, fullMeanT: 560 }).usable / MWH).toBeCloseTo(254, -1);
  });

  it('K24 reported 2 MW out, 3 MW of charge, 2,400 t: what the Vääksy preset takes', () => {
    expect(vaaksy.ratedPower).toBe(2e6);
    expect(vaaksy.chargePower).toBe(3e6);
    expect(createPlant(vaaksy).mass / 1000).toBeCloseTo(2400, 6);
  });

  it('K25 reported the bigger, the better (85 %, 90 %, over 90 %): the model agrees on the direction, Vääksy above Pornainen above Kankaanpää', () => {
    const v = cycleRun(vaaksy, vaaksy.ratedPower, 1).efficiency;
    const k = cycleRun(kanka, kanka.ratedPower, 1).efficiency;
    expect(v).toBeGreaterThan(cycleRated.efficiency);
    expect(cycleRated.efficiency).toBeGreaterThan(k);
  });
});

describe('the materials', () => {
  it('K26 measured c of sand: the table at each measured temperature', () => {
    const m = quartzSand();
    for (const [T, c] of QUARTZ_SAND_C) expect(m.c(T)).toBeCloseTo(c, 8);
    expect(m.c(600)).toBe(1187);
  });

  it('K26 mean c over 100 to 500 °C: 999 for the KTH sand, 1,045 for pure quartz, DERIVED; 0.8 kJ/kg·K holds near room temperature only', () => {
    expect(meanC(piecewise(QUARTZ_SAND_C), 100, 500)).toBeCloseTo(999, -1);
    expect(meanC(quartzNistC, 100, 500)).toBeCloseTo(1045, -1);
    expect(quartzSand().c(20)).toBeLessThan(800);
    expect(quartzSand().c(400)).toBeGreaterThan(1000);
  });

  it('K26 a constant 0.8 would understate the swing by about 20 %', () => {
    const m = quartzSand();
    const real = m.h(500) - m.h(100);
    expect(1 - (800 * 400) / real).toBeCloseTo(0.2, 1);
  });

  it('K27 reported inversion at about 573 °C: an alarm on sand, none on soapstone', async () => {
    const { SandSim } = await import('./engine');
    const sim = new SandSim();
    sim.applyScenario('soapstone-vs-sand');
    expect(sim.state.alarms).not.toContain('quartzInversion');
    for (let i = 0; i < 25 * 30; i++) sim.step(1 / 30);
    expect(sim.params.medium).toBe('sand');
    expect(sim.state.maxT).toBeGreaterThan(573);
    expect(sim.state.alarms).toContain('quartzInversion');
  });

  it('K28 measured conduction of a sand bed: 0.218 W/m·K at 25 °C, 0.451 at 500 °C; bulk density 1,425 kg/m³', () => {
    const m = quartzSand();
    expect(m.k(25)).toBeCloseTo(0.218, 6);
    expect(m.k(500)).toBeCloseTo(0.451, 6);
    expect(m.rho).toBe(1425);
  });

  it('K29 soapstone: bulk density DERIVED 2,165 kg/m³, porosity 0.31 against the measured solid at 3,140; c taken as 1.0 kJ/kg·K', () => {
    expect(RHO_BULK.soapstone).toBeCloseTo(2165, 0);
    expect(1 - RHO_BULK.soapstone / 3140).toBeCloseTo(0.31, 2);
    expect(crushedSoapstone().c(300)).toBe(1000);
    expect(materialFor('soapstone').k(300)).toBe(0.7);
  });

  it('K30 reported 1 m of sand, far face at 100 °C in a little over 8 days: the model gives about 7 days with the measured c(T) and k(T)', () => {
    const m = quartzSand();
    const n = 40;
    const grid = buildGrid({ geometry: 'xy', xEdges: uniformEdges(1, n), yEdges: [0, 1], material: m, T: 20 });
    const face = grid.faces('xMin')[0]!;
    const hot = grid.nodes.length;
    const net = createNetwork(
      [...grid.nodes, { T: 500, fixed: true }],
      [...grid.links, { a: face.node, b: hot, shapeA: face.shape }],
    );
    let t = 0;
    while (net.T[grid.id(n - 1, 0)]! < 100 && t < 40 * 86400) {
      stepNetwork(net, 600);
      t += 600;
    }
    expect(t / 86400).toBeCloseTo(7.3, 0);
    expect(t / 86400).toBeGreaterThan(5);
    expect(t / 86400).toBeLessThan(10);
  });
});

describe('what the figures become', () => {
  it('K31 DERIVED specific energy: 257, 288, 180, 375 kJ/kg, 2.5 times between the same-size silos', () => {
    const kJ = (mwh: number, tons: number) => (mwh * MWH) / (tons * 1000) / 1000;
    expect(kJ(3, 42)).toBeCloseTo(257, 0);
    expect(kJ(8, 100)).toBeCloseTo(288, 0);
    expect(kJ(100, 2000)).toBeCloseTo(180, 0);
    expect(kJ(250, 2400)).toBeCloseTo(375, 0);
    expect(250 / 100).toBe(2.5);
  });

  it('K32 DERIVED 217 MWh above 10 °C at 400 °C, so 100 MWh is 46 %: the model has the same 217', () => {
    const heat = (PORNAINEN.mass * 1000 * (400 - AMBIENT_T)) / MWH;
    expect(heat).toBeCloseTo(216.7, 1);
    expect(100 / heat).toBeCloseTo(0.46, 2);
    expect(capacity.heatFull / MWH).toBeCloseTo(217, -0.5);
  });

  it('K32 why: 32 % at rated power, 56 % at winter demand, 74 % at summer demand, about 80 % if the power may fall to nothing. The reported 46 % sits inside this range', () => {
    expect(capacity.shareOfHeat).toBeCloseTo(0.32, 1);
    expect(capacityWinter.shareOfHeat).toBeCloseTo(0.56, 1);
    expect(capacitySummer.shareOfHeat).toBeCloseTo(0.74, 1);
    const all = (capacity.usable + capacity.tail) / capacity.heatFull;
    expect(all).toBeCloseTo(0.8, 1);
    expect(0.46).toBeGreaterThan(capacity.shareOfHeat);
    expect(0.46).toBeLessThan(capacitySummer.shareOfHeat);
  });

  it('K33 DERIVED density: Pornainen 108 kWh/m³, Vääksy about 156 at 1,500 kg/m³, water 45 to 95 °C 58 kWh/m³', () => {
    expect((100e3 / 923.6).toFixed(0)).toBe('108');
    expect(250e3 / (2400 / 1.5)).toBeCloseTo(156, 0);
    expect((1000 * 4186 * 50) / 3.6e6).toBeCloseTo(58, 0);
  });

  it('K34 DERIVED 3.2 kg/s at 300 K, 20 to 34 kW of blower: the model finds about 5.3 kg/s of blower capacity and about 22 kW at 1 MW, about 2 % of the power', () => {
    expect(1e6 / (1040 * 300)).toBeCloseTo(3.2, 1);
    expect(designAirFlow(1e6, 5)).toBeCloseTo(5.3, 0);
    const p = createPlant(spec, 300);
    stepPlant(
      p,
      {
        outsideT: 5,
        supplyT: SUPPLY_T,
        returnT: RETURN_T,
        demand: 1e6,
        chargeRequest: 0,
        chargeOrder: 'core-first',
        spill: 0.5,
      },
      3600,
    );
    expect(p.op.discharge.fanElectric / 1e3).toBeCloseTo(22, -1);
    expect(p.op.discharge.dp).toBeGreaterThan(1000);
    expect(p.op.discharge.dp).toBeLessThanOrEqual(5100);
  });

  it('K34 the exchanger the sizing gives: about 16 kW/K at 1 MW', () => {
    expect(designExchangerUA(1e6) / 1e3).toBeCloseTo(16, 0);
  });

  it('K35 DERIVED 1,443 A at 400 V', () => {
    expect(lineCurrent(1e6)).toBeCloseTo(1443, 0);
  });

  it('K37 DERIVED standing loss 17 to 28 kW at an edge of 150 to 250 °C, 70 kW lumped: the model gives about 38 kW full (its edge is hotter), and about 15 kW averaged over a year', () => {
    expect(idle.lossStart / 1e3).toBeCloseTo(38, -0.5);
    expect(yearOptimal.walls / (8760 * 3600) / 1e3).toBeCloseTo(15, -0.5);
  });

  it('K38 DERIVED surface per volume 9.5, 5.6, 1.3, 0.62 per metre; two drums 570 kg, about 48 kWh over 300 K', () => {
    const av = (d: number, h: number) => 4 / d + 2 / h;
    expect(av(14, 6)).toBeCloseTo(0.62, 2);
    expect(av(4, 80 / (Math.PI * 4))).toBeCloseTo(1.31, 1);
    expect(av(0.46, 2.41)).toBeCloseTo(9.5, 0);
    expect(RHO_BULK.sand * 0.4).toBeCloseTo(570, 0);
    expect((570 * 1000 * 300) / 3.6e6).toBeCloseTo(47.5, 1);
  });

  it('K38 what the two drums do in the model: under 1 kWh at 5 kW, about 25 kWh of their 41 kWh at falling power, half-life just over a day', () => {
    expect(capacityD.usable / 3.6e6).toBeLessThan(2);
    expect((capacityD.usable + capacityD.tail) / 3.6e6).toBeCloseTo(25, -0.5);
    expect(capacityD.heatFull / 3.6e6).toBeCloseTo(41, 0);
    expect(idleRun(drums).halfLifeHeat).toBeCloseTo(1.3, 0);
  });

  it('K39 reported cold to the touch, DERIVED about 4 K above the air: the model gives about 8 K at full charge', () => {
    expect(idle.surface - MEAN_OUTSIDE).toBeCloseTo(8, 0);
    const p = createPlant(spec, 400);
    chargeToFull(p);
    const wall = wallState(p, MEAN_OUTSIDE);
    expect(wall.surface).toBeLessThan(wall.shell);
  });

  it('K41 DERIVED 6 m of stainless over 500 K grows about 5 cm', () => {
    expect(17e-6 * 6 * 500).toBeCloseTo(0.051, 3);
  });

  it('K42 sizing exercise, no maker figure: pitch 0.5 m gives about 616 legs and 3.7 km, about 60 K in the stone at 1 MW; pitch 1 m does not hold the power at 400 °C', () => {
    const legs = (Math.PI * 49) / 0.25;
    expect(legs).toBeCloseTo(616, 0);
    expect(legs * 6).toBeCloseTo(3695, -1);
    expect(stoneDrop(1e6, 0.7, 0.5, 0.05, Math.PI * 49, 6)).toBeCloseTo(66, -1);
    const coarse = capacityRun({ ...spec, pitch: 1 });
    expect(coarse.usable).toBe(0);
    expect(pipeCellTime(0.7, RHO_BULK.soapstone * 1000, pitchRadius(0.5), 0.05) / 3600).toBeCloseTo(33, -1);
    expect(pipeCellFactor(pitchRadius(0.5), 0.05)).toBeGreaterThan(Math.log(pitchRadius(0.5) / 0.05) - 0.75);
    expect(STEEL_K).toBe(17);
  });

  it('K44 reported, to be checked, about 500 °C of air: the input, and the top of what the air can reach in the bed', () => {
    expect(spec.chargeAirT).toBe(500);
    const p = createPlant(spec, 100);
    chargeToFull(p);
    expect(p.op.charge.airHot).toBeLessThanOrEqual(500.001);
  });
});

describe('the record of the figures', () => {
  const docs = import.meta.glob(['../../docs/research.md', '../../docs/physics.md'], {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;
  it('every key figure of the research has a line in docs/physics.md', () => {
    const research = docs['../../docs/research.md']!;
    const physics = docs['../../docs/physics.md']!;
    const figures = new Set([...research.matchAll(/^\| (K\d+) +\|/gm)].map((m) => m[1]!));
    expect(figures.size).toBeGreaterThan(40);
    for (const k of figures) expect(physics, k).toMatch(new RegExp(`^\\| ${k} +\\|`, 'm'));
  });
  it('the figures of the short version are the ones pinned here', () => {
    expect(docs['../../docs/physics.md']!).toContain('**32 % (69 MWh)**');
    expect(capacity.shareOfHeat).toBeCloseTo(0.32, 1);
    expect(capacity.usable / MWH).toBeCloseTo(69, -0.5);
  });
});

describe('the twin of the optimiser stays near the model', () => {
  it('the tank the optimiser plans on has about the usable heat of the full model at the week’s power', () => {
    const p = createPlant(spec, 300);
    chargeToFull(p);
    const week = PRICE_WEEKS.drawn;
    const twin = lumpedTwin(p, defaultOperation({ season: 'winter' }), 15, week);
    expect(twin.capacity).toBeGreaterThan(60);
    expect(twin.capacity).toBeLessThan(170);
    expect(heatAbove(p, floorTemperature(p, { supplyT: 85, returnT: 45, outsideT: 5 }, 1e6)) / MWH).toBeLessThan(
      twin.capacity + 1,
    );
    const c = specOf(presetParams('pornainen-soapstone'));
    expect(c.ratedPower).toBe(1e6);
    expect(dischargeRun(p, 1e6, 3600, false).atPower / MWH).toBeGreaterThan(60);
  });
});
