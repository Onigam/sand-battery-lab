import type { CapacityResult, ScaleRow, YearResult } from '../sim/runs';
import { MWH } from '../sim/runs';
import { QUARTZ_SAND_C, piecewise, quartzNistC } from '../sim/thermal';
import { PORNAINEN } from '../sim/silo';
import type { SandParams, SandState, Scope } from '../sim/types';
import type { PanelKey } from './strings';

// What the panel plots and says, as plain functions of the simulation: a test checks the numbers and the status line without a browser.

/** A figure of the panel, with its tag: `†` a result of the model, `*` an estimate, nothing when it is a setting or a reported value. */
export interface Readout {
  key: PanelKey;
  value: number;
  digits: number;
  unit: string;
  tag: '' | '†' | '*';
}

/** A power, in the unit that reads best: kW under a megawatt, MW above; W for the drums. */
export function power(w: number): { value: number; digits: number; unit: string } {
  const a = Math.abs(w);
  if (a >= 1e6) return { value: w / 1e6, digits: 2, unit: 'MW' };
  if (a >= 1e3 || a === 0) return { value: w / 1e3, digits: a < 1e4 && a > 0 ? 1 : 0, unit: 'kW' };
  return { value: w, digits: 0, unit: 'W' };
}

/** An energy, in the unit that reads best. */
export function energy(j: number): { value: number; digits: number; unit: string } {
  const mwh = j / MWH;
  const a = Math.abs(mwh);
  if (a >= 1000) return { value: mwh / 1000, digits: 2, unit: 'GWh' };
  if (a >= 1) return { value: mwh, digits: a < 10 ? 1 : 0, unit: 'MWh' };
  return { value: mwh * 1000, digits: a < 0.01 ? 1 : 0, unit: 'kWh' };
}

const asPower = (key: PanelKey, w: number, tag: Readout['tag'] = '†'): Readout => ({ key, ...power(w), tag });
const asEnergy = (key: PanelKey, j: number, tag: Readout['tag'] = '†'): Readout => ({ key, ...energy(j), tag });

/** The few live figures that stay in sight. */
export function mainReadouts(s: SandState): Readout[] {
  return [
    { key: 'liveLevel', value: 100 * s.chargeLevel, digits: 0, unit: '%', tag: '†' },
    asEnergy('liveUsable', s.usableNow),
    { key: 'liveMean', value: s.meanT, digits: 0, unit: '°C', tag: '†' },
    { key: 'liveCore', value: s.coreT, digits: 0, unit: '°C', tag: '†' },
    { key: 'liveEdge', value: s.edgeT, digits: 0, unit: '°C', tag: '†' },
    asPower('liveHeater', s.heater),
    asPower('liveHeat', s.heatOut),
    asPower('liveBoiler', s.boiler),
    asPower('liveWalls', s.wallLoss),
    { key: 'livePrice', value: s.price, digits: 0, unit: '€/MWh', tag: '*' },
    { key: 'liveCost', value: s.costOfHeat, digits: 0, unit: '€/MWh', tag: '†' },
    { key: 'liveEfficiency', value: 100 * s.efficiency, digits: 0, unit: '%', tag: '†' },
  ];
}

/** The rest, folded. */
export function moreReadouts(s: SandState, mass: number): Readout[] {
  const t = (key: PanelKey, value: number, tag: Readout['tag'] = '†'): Readout => ({
    key,
    value,
    digits: 0,
    unit: '°C',
    tag,
  });
  return [
    asPower('moreDemand', s.demand, '*'),
    t('moreFloor', s.floorT),
    asEnergy('moreHeat', s.heatAbove),
    t('moreShell', s.shellT),
    { key: 'moreSurface', value: s.surfaceT, digits: 1, unit: '°C', tag: '†' },
    { key: 'moreOutside', value: s.outsideT, digits: 0, unit: '°C', tag: '*' },
    t('moreAirHot', s.airHot),
    t('moreAirBack', s.chargeReturnT),
    t('moreExIn', s.exchangerAirIn),
    t('moreExOut', s.exchangerAirOut),
    { key: 'moreChargeFlow', value: s.chargeFlow, digits: 2, unit: 'kg/s', tag: '†' },
    { key: 'moreDischargeFlow', value: s.dischargeFlow, digits: 2, unit: 'kg/s', tag: '†' },
    asPower('moreBlowers', s.blowerElectric),
    { key: 'moreWater', value: s.waterFlow, digits: 1, unit: 'kg/s', tag: '†' },
    asPower('moreElectric', s.electricity),
    t('moreElement', s.elementT),
    { key: 'moreMass', value: mass / 1000, digits: mass < 1e5 ? 1 : 0, unit: 't', tag: '' },
  ];
}

/** What has gone through since the start. */
export function sinceReadouts(s: SandState): Readout[] {
  return [
    asEnergy('moreElectricE', s.energyElectric),
    asEnergy('moreHeatE', s.energyHeat),
    asEnergy('moreBoilerE', s.energyBoiler),
    asEnergy('moreWallsE', s.energyWalls),
    asEnergy('moreRestE', s.energyRest),
    { key: 'moreCostE', value: s.costElectric, digits: 0, unit: '€', tag: '†' },
    { key: 'moreCostB', value: s.costBoiler, digits: 0, unit: '€', tag: '†' },
  ];
}

export type Tone = 'note' | 'warn';

/** What the status line says: one message, the most important first. */
export function statusOf(s: SandState, p: SandParams): { key: PanelKey; tone: Tone } {
  if (p.blowerFailed && !p.interlock && s.heater > 0) return { key: 'statusBurning', tone: 'warn' };
  if (s.tripped) return { key: 'statusTripped', tone: 'warn' };
  if (p.blowerFailed && s.chargeBlower > 0) return { key: 'statusFailing', tone: 'warn' };
  if (p.reserveCall) return { key: 'statusReserve', tone: 'note' };
  if (s.boiler > 0.02 * Math.max(s.demand, 1) && s.demand > 0) return { key: 'statusBoiler', tone: 'warn' };
  if (s.heater > 0 && s.heatOut > 0) return { key: 'statusBoth', tone: 'note' };
  if (s.heater > 0) return { key: 'statusCharging', tone: 'note' };
  if (s.heatOut > 0) return { key: 'statusDischarging', tone: 'note' };
  if (s.chargeLevel >= 0.995) return { key: 'statusFull', tone: 'note' };
  return { key: 'statusIdle', tone: 'note' };
}

export interface Segment {
  key: PanelKey;
  joules: number;
  colour: string;
}

/** The heat above ambient at full, split: given at full power, given at falling power, and what stays. They add up to the heat. */
export function budgetSegments(c: CapacityResult): Segment[] {
  return [
    { key: 'budgetAtPower', joules: c.usable, colour: '#2f8f5b' },
    { key: 'budgetTail', joules: c.tail, colour: '#c99700' },
    { key: 'budgetStays', joules: Math.max(0, c.heatFull - c.usable - c.tail), colour: '#8a7a5c' },
  ];
}

/** The chart's round top: three intervals, each a round number. */
export function niceCeil3(v: number): number {
  if (!(v > 0)) return 3;
  const p = Math.pow(10, Math.floor(Math.log10(v / 3)));
  for (const m of [1, 2, 2.5, 5, 10]) if (v <= 3 * m * p) return 3 * m * p;
  return 30 * p;
}

/** The last weeks, in days counted back from now. */
export function tempsChartData(scope: Scope) {
  const n = scope.t.length;
  const last = n ? scope.t[n - 1]! : 0;
  return { xs: scope.t.map((x) => (x - last) / 24), mean: scope.meanT, core: scope.coreT, edge: scope.edgeT };
}

/** Powers in kW (or W for a tiny plant, with the unit returned). */
export function powersChartData(scope: Scope) {
  const n = scope.t.length;
  const last = n ? scope.t[n - 1]! : 0;
  const top = Math.max(1, ...scope.heater, ...scope.heatOut, ...scope.boiler);
  const k = top >= 2e4 ? 1e3 : 1;
  const map = (a: number[]) => a.map((v) => v / k);
  return {
    xs: scope.t.map((x) => (x - last) / 24),
    unit: k === 1e3 ? 'kW' : 'W',
    heater: map(scope.heater),
    heat: map(scope.heatOut),
    boiler: map(scope.boiler),
    walls: map(scope.wallLoss),
  };
}

/** Temperature across the bed at three heights, from the axis to the wall. */
export function sectionChartData(s: SandState) {
  const xs: number[] = [];
  const top: number[] = [];
  const middle: number[] = [];
  const bottom: number[] = [];
  const dr = s.bedRadius / s.rings;
  for (let i = 0; i < s.rings; i++) {
    xs.push((i + 0.5) * dr);
    top.push(s.bedT[i + s.rings * (s.layers - 1)]!);
    middle.push(s.bedT[i + s.rings * (s.layers >> 1)]!);
    bottom.push(s.bedT[i]!);
  }
  return { xs, top, middle, bottom };
}

/** What a full charge gives against the power: kW or MW across, MWh or kWh up. */
export function capacityChartData(curve: { power: number; usable: number }[]) {
  const top = Math.max(...curve.map((c) => c.power));
  const px = top >= 1e6 ? 1e6 : 1e3;
  const big = Math.max(...curve.map((c) => c.usable)) >= MWH;
  const ey = big ? MWH : 3.6e6;
  return {
    xs: curve.map((c) => c.power / px),
    ys: curve.map((c) => c.usable / ey),
    xUnit: px === 1e6 ? 'MW' : 'kW',
    yUnit: big ? 'MWh' : 'kWh',
  };
}

/** The maker's point on the capacity chart, on the only machine it applies to. */
export const makerPoint = { power: PORNAINEN.ratedPower / 1e6, usable: PORNAINEN.ratedCapacity / MWH };

/** The week of prices, the plan beside it: the plan drawn as a step at the top of the chart. */
export function weekChartData(price: readonly number[], plan: readonly boolean[]) {
  const top = Math.max(...price);
  return {
    xs: price.map((_, h) => h),
    price: [...price],
    plan: plan.map((on) => (on ? top : Number.NaN)),
    top,
    bottom: Math.min(0, ...price),
  };
}

/** c(T) over the swing, in kJ/kg·K. */
export function specificHeatChartData() {
  const xs: number[] = [];
  const sand: number[] = [];
  const quartz: number[] = [];
  const soapstone: number[] = [];
  const fixed: number[] = [];
  const c = piecewise(QUARTZ_SAND_C);
  for (let T = 20; T <= 600; T += 20) {
    xs.push(T);
    sand.push(c(T) / 1000);
    quartz.push(quartzNistC(T) / 1000);
    soapstone.push(1);
    fixed.push(0.8);
  }
  return { xs, sand, quartz, soapstone, fixed };
}

/** A year: a value per day, kW. */
export function yearChartData(y: YearResult) {
  const n = y.dayHeat.length;
  const top = Math.max(1, ...y.dayHeat, ...y.dayBoiler);
  const k = top >= 2e4 ? 1e3 : 1;
  const xs: number[] = [];
  const heat: number[] = [];
  const boiler: number[] = [];
  const mean: number[] = [];
  for (let d = 0; d < n; d++) {
    xs.push(d);
    heat.push(y.dayHeat[d]! / k);
    boiler.push(y.dayBoiler[d]! / k);
    mean.push(y.dayMean[d]!);
  }
  return { xs, heat, boiler, mean, unit: k === 1e3 ? 'kW' : 'W' };
}

export function yearReadouts(y: YearResult): Readout[] {
  return [
    asEnergy('yearHeat', y.heat),
    asEnergy('yearBoiler', y.boiler),
    { key: 'yearShare', value: 100 * y.coverage, digits: 0, unit: '%', tag: '†' },
    { key: 'yearEfficiency', value: 100 * y.efficiency, digits: 0, unit: '%', tag: '†' },
    { key: 'yearWalls', value: (100 * y.walls) / y.electricity, digits: 1, unit: '%', tag: '†' },
    { key: 'yearCirc', value: (100 * y.circulation) / y.electricity, digits: 1, unit: '%', tag: '†' },
    { key: 'yearPaid', value: y.paid, digits: 0, unit: '€/MWh', tag: '†' },
    { key: 'yearDiscount', value: 100 * y.discount, digits: 0, unit: '%', tag: '†' },
  ];
}

export const SCALE_KEYS: Record<string, PanelKey> = {
  'two-drums': 'scaleTwoDrums',
  kankaanpaa: 'scaleKankaanpaa',
  pornainen: 'scalePornainen',
  vaaksy: 'scaleVaaksy',
};

/** Whole percentages of a budget that add up to 100 (largest remainder): 31.8, 48.6 and 19.6 read 32, 48 and 20, as on the sheet, not 32, 49 and 20. */
export function wholeShares(values: readonly number[]): number[] {
  const total = values.reduce((a, v) => a + v, 0);
  if (!(total > 0)) return values.map(() => 0);
  const exact = values.map((v) => (100 * v) / total);
  const shares = exact.map(Math.floor);
  const left = 100 - shares.reduce((a, v) => a + v, 0);
  const order = exact.map((v, i) => [v - shares[i]!, i] as const).sort((a, b) => b[0] - a[0]);
  for (let k = 0; k < left; k++) shares[order[k]![1]]!++;
  return shares;
}

/** One line of the scale's table. */
export function scaleLine(r: ScaleRow) {
  return {
    key: SCALE_KEYS[r.id] ?? ('scalePornainen' as PanelKey),
    usable: energy(r.usable),
    halfLife: r.halfLife,
    surfacePerVolume: r.surfacePerVolume,
    efficiency: r.efficiency,
  };
}

/** A painted week to and from blocks of three hours: a block is on when all its hours are. */
export const BLOCK_HOURS = 3;
export const BLOCKS_PER_DAY = 24 / BLOCK_HOURS;

export function blockOn(plan: readonly boolean[], day: number, block: number): boolean {
  const h0 = day * 24 + block * BLOCK_HOURS;
  for (let h = h0; h < h0 + BLOCK_HOURS; h++) if (!plan[h]) return false;
  return true;
}

export function setBlock(plan: readonly boolean[], day: number, block: number, on: boolean): boolean[] {
  const out = [...plan];
  const h0 = day * 24 + block * BLOCK_HOURS;
  for (let h = h0; h < h0 + BLOCK_HOURS; h++) out[h] = on;
  return out;
}
