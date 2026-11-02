import { chargeDiscount } from './market';
import { DEFAULT_SPILL, fillConditions, newConditions, planWeek, type Operation } from './operate';
import {
  bedField,
  createPlant,
  floorTemperature,
  heatAbove,
  resetBalance,
  stepPlant,
  wallEnergy,
  wallState,
  type Conditions,
  type Plant,
} from './plant';
import type { SiloSpec } from './silo';
import { BOILER_PRICE, hourOfWeekAt, HOURS_PER_WEEK, PRICE_WEEKS, priceAt, WINTER_DAY } from './week';

// Whole runs of a plant, for the tests, docs/physics.md and the panel's charts: a full charge, a discharge down to where the power is lost,
// a long idle. No target anywhere: these report what the plant does.

export const MWH = 3.6e9;

/** Network temperatures: REPORTED (75 to 100 °C leaving, Kankaanpää), the return an ESTIMATE from other networks. */
export const SUPPLY_T = 85;
export const RETURN_T = 45;
/** Outside air of a capacity run, °C (near the plant's yearly mean). */
export const MEAN_OUTSIDE = 5;
/** Reference of "heat above ambient" (research: 10 °C). */
export const AMBIENT_T = 10;

const base = (demand: number, chargeRequest: number, order: Conditions['chargeOrder'] = 'core-first'): Conditions => ({
  outsideT: MEAN_OUTSIDE,
  supplyT: SUPPLY_T,
  returnT: RETURN_T,
  demand,
  chargeRequest,
  chargeOrder: order,
  spill: DEFAULT_SPILL,
});

/** Charge at full offered power until the mean reaches its full value or the power has fallen to a trickle. Returns the hours. */
export function chargeToFull(
  p: Plant,
  dt = 3600,
  order: Conditions['chargeOrder'] = 'core-first',
  maxDays = 365,
): number {
  const c = base(0, p.spec.chargePower, order);
  let t = 0;
  const limit = maxDays * 86400;
  while (t < limit) {
    stepPlant(p, c, dt);
    t += dt;
    if (p.full) break;
    // what the heater puts in is barely more than what the walls lose: the air cannot push the mean any higher
    const o = p.op;
    if (o.charge.heater + o.charge.fanAir - o.charge.ductLoss - o.wallLoss < 0.02 * p.spec.chargePower) break;
  }
  return t / 3600;
}

export interface DischargeResult {
  /** Delivered at the asked power, J; hours of it. */
  atPower: number;
  hoursAtPower: number;
  /** Delivered afterwards while the power falls, down to 2 % of it, J. */
  tail: number;
  hoursTail: number;
}

/** Discharge at a power: until the plant can no longer hold it, then on while the power falls. */
export function dischargeRun(p: Plant, power: number, dt = 3600, withTail = true): DischargeResult {
  const c = base(power, 0);
  const r: DischargeResult = { atPower: 0, hoursAtPower: 0, tail: 0, hoursTail: 0 };
  let held = true;
  for (let t = 0; t < 5 * 365 * 86400; t += dt) {
    stepPlant(p, c, dt);
    const heat = p.op.discharge.heat;
    if (held && heat >= 0.995 * power) {
      r.atPower += heat * dt;
      r.hoursAtPower += dt / 3600;
      continue;
    }
    held = false;
    if (!withTail || heat < 0.02 * power) break;
    r.tail += heat * dt;
    r.hoursTail += dt / 3600;
  }
  return r;
}

export interface FieldStats {
  meanT: number;
  coreT: number;
  edgeT: number;
  /** Hottest and coldest cell, °C. */
  maxT: number;
  minT: number;
  /** Heat above ambient, J. */
  heat: number;
}

export function fieldStats(p: Plant, outsideT = MEAN_OUTSIDE): FieldStats {
  let maxT = -1e9;
  let minT = 1e9;
  for (let i = 0; i < p.grid.nodes.length; i++) {
    const T = p.net.T[i]!;
    if (T > maxT) maxT = T;
    if (T < minT) minT = T;
  }
  return {
    meanT: p.meanT,
    coreT: p.net.T[p.grid.id(0, p.layers >> 1)]!,
    edgeT: wallState(p, outsideT).edge,
    maxT,
    minT,
    heat: heatAbove(p, AMBIENT_T),
  };
}

export interface CapacityResult {
  /** Delivered at rated power on the last of the cycles, J. */
  usable: number;
  hoursUsable: number;
  /** Delivered after that, while the power falls, J. */
  tail: number;
  /** Heat above ambient at full, J, and the share `usable` is of it. */
  heatFull: number;
  shareOfHeat: number;
  full: FieldStats;
  empty: FieldStats;
  /** Hours of the charge of the last cycle. */
  hoursCharge: number;
  /** Mean swing of the bed, K, and what the same swing is in the uniform estimate. */
  swing: number;
  /** Mean temperature of a uniform bed at which the rated power goes. */
  floorT: number;
}

/**
 * The usable capacity: charge to full, discharge at the power until it can no longer be held, on a plant that has already cycled so
 * that what stays in the stone from one cycle to the next is in place. `tail` then carries on the discharge from a copy.
 */
export function capacityRun(
  spec: SiloSpec,
  power = spec.ratedPower,
  cycles = 3,
  dt = 3600,
  rings?: number,
  layers?: number,
): CapacityResult {
  const p = createPlant(spec, 150, rings, layers);
  const c = base(0, 0);
  let hoursCharge = 0;
  let full: FieldStats | null = null;
  let usable = 0;
  let hoursUsable = 0;
  let tail = 0;
  let empty: FieldStats | null = null;
  for (let i = 0; i < cycles; i++) {
    hoursCharge = chargeToFull(p, dt);
    p.full = false;
    full = fieldStats(p);
    const d = dischargeRun(p, power, dt, false);
    usable = d.atPower;
    hoursUsable = d.hoursAtPower;
    empty = fieldStats(p);
  }
  const clone = dischargeRun(p, power, dt, true);
  tail = clone.tail + clone.atPower;
  return {
    usable,
    hoursUsable,
    tail,
    heatFull: full!.heat,
    shareOfHeat: usable / full!.heat,
    full: full!,
    empty: empty!,
    hoursCharge,
    swing: full!.meanT - empty!.meanT,
    floorT: floorTemperature(p, c, power),
  };
}

export interface IdleResult {
  /** Days for the heat above ambient to fall by half. */
  halfLifeHeat: number;
  /** Days for the usable heat (above the floor of rated power) to fall by half. */
  halfLifeUsable: number;
  /** Lost through the walls at the start, W. */
  lossStart: number;
  /** Wall and surface at the start, °C. */
  shell: number;
  surface: number;
  /** Lost per week at the start, as a share of the heat above ambient. */
  weekShare: number;
}

/** A full plant left alone: how fast its heat goes. */
export function idleRun(spec: SiloSpec, maxDays = 1500): IdleResult {
  const p = createPlant(spec, 150);
  chargeToFull(p, 3600);
  resetBalance(p);
  const c = base(0, 0);
  const floor = floorTemperature(p, c, spec.ratedPower);
  const h0 = heatAbove(p, AMBIENT_T);
  const u0 = heatAbove(p, floor);
  let halfLifeHeat = Number.NaN;
  let halfLifeUsable = Number.NaN;
  const dt = spec.ratedPower < 1e5 ? 600 : 6 * 3600;
  stepPlant(p, c, dt);
  const lossStart = p.op.wallLoss;
  const wall = wallState(p, MEAN_OUTSIDE);
  const weekShare = (lossStart * 7 * 86400) / h0;
  for (let t = dt; t < maxDays * 86400; t += dt) {
    stepPlant(p, c, dt);
    if (Number.isNaN(halfLifeUsable) && heatAbove(p, floor) <= 0.5 * u0) halfLifeUsable = t / 86400;
    if (Number.isNaN(halfLifeHeat) && heatAbove(p, AMBIENT_T) <= 0.5 * h0) {
      halfLifeHeat = t / 86400;
      break;
    }
  }
  return { halfLifeHeat, halfLifeUsable, lossStart, shell: wall.shell, surface: wall.surface, weekShare };
}

export interface CycleResult {
  /** Heat out over electricity in on the last cycle. */
  efficiency: number;
  electricity: number;
  heat: number;
  /** Share of the electricity lost by the walls during the cycle, and by the rest (motors, ducts, transformer, controls). */
  wallShare: number;
  circulationShare: number;
  days: number;
}

/**
 * A repeated cycle: charge, wait, discharge at a power down to the rated floor, wait. Round-trip efficiency measured on the last one, once
 * what stays in the stone has settled: `restDays` is the idle time between each half.
 */
export function cycleRun(spec: SiloSpec, power: number, restDays: number, cycles = 5, dt = 3600): CycleResult {
  const p = createPlant(spec, 150);
  let result: CycleResult | null = null;
  for (let i = 0; i < cycles; i++) {
    resetBalance(p);
    const stock0 = heatAbove(p, AMBIENT_T);
    let t = 0;
    const hc = chargeToFull(p, dt);
    t += hc * 3600;
    p.full = false;
    const idle = base(0, 0);
    for (let k = 0; k < restDays * 24 * (3600 / dt); k++) {
      stepPlant(p, idle, dt);
      t += dt;
    }
    const d = dischargeRun(p, power, dt, false);
    t += d.hoursAtPower * 3600;
    for (let k = 0; k < restDays * 24 * (3600 / dt); k++) {
      stepPlant(p, idle, dt);
      t += dt;
    }
    const tot = p.totals;
    const walls = wallEnergy(p);
    result = {
      // what the stone gained or lost over the cycle is taken off, so that a cycle not yet settled does not read high or low
      efficiency: tot.heat / (tot.electricity - (heatAbove(p, AMBIENT_T) - stock0)),
      electricity: tot.electricity,
      heat: tot.heat,
      wallShare: walls / tot.electricity,
      circulationShare: (tot.auxLoss + tot.ductLoss) / tot.electricity,
      days: t / 86400,
    };
  }
  return result!;
}

/** How the plant is run in the long runs unless told otherwise: the network connected, charging under a price. */
export function defaultOperation(patch: Partial<Operation> = {}): Operation {
  return {
    strategy: 'optimal',
    threshold: 40,
    painted: new Array<boolean>(HOURS_PER_WEEK).fill(false),
    optimal: new Array<boolean>(HOURS_PER_WEEK).fill(false),
    priceWeek: 'drawn',
    season: 'year',
    outsideShift: 0,
    demandOn: true,
    supplyT: SUPPLY_T,
    returnT: RETURN_T,
    chargeOrder: 'core-first',
    spill: DEFAULT_SPILL,
    reserveCall: false,
    ...patch,
  };
}

export interface YearResult {
  /** All in J. */
  heat: number;
  boiler: number;
  electricity: number;
  walls: number;
  circulation: number;
  /** Heat out over electricity in. The stock's change over the year is counted with the electricity it would take. */
  efficiency: number;
  /** Heat out over the usable capacity at rated power: how many times the silo's rating went through it. */
  cycles: number;
  /** Mean price paid for the electricity, mean price on offer, €/MWh, and the discount. */
  paid: number;
  mean: number;
  discount: number;
  /** Share of the heat the silo gave. */
  coverage: number;
  /** One value per day: mean temperature (°C), heat out and boiler (W, day means). */
  dayMean: Float64Array;
  dayHeat: Float64Array;
  dayBoiler: Float64Array;
  dayCharge: Float64Array;
}

/**
 * A year: a settling year first, so that the stock has found its level, then the one measured. `priceAtHour`, when given, replaces the
 * drawn week (the offline check with a real year of prices; none is committed).
 */
export function yearRun(
  spec: SiloSpec,
  op: Operation,
  dt = 3600,
  priceAtHour?: (hourOfYear: number) => number,
  settleDays = 365,
): YearResult {
  const p = createPlant(spec, 250);
  const c = newConditions();
  const days = 365;
  const stepsPerDay = Math.round(86400 / dt);
  const offerPlan = (day: number, hour: number): void => {
    if (op.strategy !== 'optimal') return;
    const hw = hourOfWeekAt(day, hour);
    if (priceAtHour) return;
    op.optimal = planWeek(p, op, day, hw);
  };
  const out: YearResult = {
    heat: 0,
    boiler: 0,
    electricity: 0,
    walls: 0,
    circulation: 0,
    efficiency: 0,
    cycles: 0,
    paid: 0,
    mean: 0,
    discount: 0,
    coverage: 0,
    dayMean: new Float64Array(days),
    dayHeat: new Float64Array(days),
    dayBoiler: new Float64Array(days),
    dayCharge: new Float64Array(days),
  };
  const prices: number[] = [];
  const drawn: number[] = [];
  for (let year = 0; year < 2; year++) {
    if (year === 1) resetBalance(p);
    const stock0 = heatAbove(p, AMBIENT_T);
    // the settling period ends on 31 December, so that the measured year starts on its own 1 January
    for (let d = year === 0 ? days - Math.min(days, settleDays) : 0; d < days; d++) {
      if (d % 7 === 0) offerPlan(d, 0);
      for (let k = 0; k < stepsPerDay; k++) {
        const hour = (k * dt) / 3600;
        fillConditions(c, op, spec.ratedPower, spec.chargePower, d, hour);
        const hourOfYear = d * 24 + Math.floor(hour);
        if (priceAtHour && op.strategy === 'threshold') {
          c.chargeRequest = priceAtHour(hourOfYear) <= op.threshold ? spec.chargePower : 0;
        }
        stepPlant(p, c, dt);
        if (year === 1) {
          out.dayHeat[d]! += p.op.discharge.heat / stepsPerDay;
          out.dayBoiler[d]! += p.op.boiler / stepsPerDay;
          out.dayCharge[d]! += p.op.charge.heater / stepsPerDay;
          prices.push(priceAtHour ? priceAtHour(hourOfYear) : priceAt(op.priceWeek, hourOfWeekAt(d, hour)));
          drawn.push(p.op.electricity);
        }
      }
      if (year === 1) out.dayMean[d] = p.meanT;
    }
    if (year === 1) {
      const t = p.totals;
      const stock = heatAbove(p, AMBIENT_T) - stock0;
      out.heat = t.heat;
      out.boiler = t.boiler;
      out.electricity = t.electricity;
      out.walls = wallEnergy(p);
      out.circulation = t.auxLoss + t.ductLoss;
      out.efficiency = t.heat / (t.electricity - stock);
      out.coverage = t.heat / Math.max(t.heat + t.boiler, 1);
      const dc = chargeDiscount(prices, drawn);
      out.paid = dc.paid;
      out.mean = dc.mean;
      out.discount = dc.discount;
    }
  }
  const usable = capacityRun(spec, spec.ratedPower, 2, 3 * 3600).usable;
  out.cycles = out.heat / Math.max(usable, 1);
  return out;
}

export interface WeekResult {
  /** €. */
  electricityCost: number;
  boilerCost: number;
  /** What the change of stock is worth, at the week's mean price, €: a full silo at the end is not a cost. */
  stockValue: number;
  /** The sum that scores: electricity + boiler − stock. */
  total: number;
  /** MWh. */
  heat: number;
  boiler: number;
  charged: number;
  /** €/MWh of heat delivered in all. */
  costOfHeat: number;
  /** Mean price paid, €/MWh. */
  paid: number;
}

/** A week of the full model from a given stone, for the game: the same start for every player and for the optimiser. */
export function weekRun(
  spec: SiloSpec,
  op: Operation,
  field: ArrayLike<number>,
  startDay = WINTER_DAY - 1,
  dt = 3600,
): WeekResult {
  const p = createPlant(spec, 200);
  for (let i = 0; i < p.grid.nodes.length; i++) {
    p.net.T[i] = field[i]!;
    p.net.H[i] = p.net.mass[i]! * p.material.h(field[i]!);
  }
  resetBalance(p);
  const c = newConditions();
  const floor = floorTemperature(p, { supplyT: op.supplyT, returnT: op.returnT, outsideT: 5 }, 0.5 * spec.ratedPower);
  const stock0 = heatAbove(p, floor);
  const run = { ...op };
  if (run.strategy === 'optimal') run.optimal = planWeek(p, run, startDay, 0);
  let electricityCost = 0;
  let boilerCost = 0;
  let sum = 0;
  const steps = Math.round((HOURS_PER_WEEK * 3600) / dt);
  let money = 0;
  let energy = 0;
  for (let k = 0; k < steps; k++) {
    const hours = (k * dt) / 3600;
    const d = startDay + Math.floor(hours / 24);
    const hour = hours % 24;
    const hw = Math.floor(hours) % HOURS_PER_WEEK;
    fillConditions(c, run, spec.ratedPower, spec.chargePower, d, hour);
    // the week starts on its own Monday, whatever day of the year it falls on
    if (run.strategy === 'always') c.chargeRequest = spec.chargePower;
    else if (run.strategy === 'threshold')
      c.chargeRequest = priceAt(run.priceWeek, hw) <= run.threshold ? spec.chargePower : 0;
    else if (run.strategy === 'optimal') c.chargeRequest = run.optimal[hw] ? spec.chargePower : 0;
    else if (run.strategy === 'painted') c.chargeRequest = run.painted[hw] ? spec.chargePower : 0;
    stepPlant(p, c, dt);
    const price = priceAt(run.priceWeek, hw);
    sum += price;
    const mwh = (p.op.electricity * dt) / 3.6e9;
    electricityCost += mwh * price;
    money += price * p.op.charge.heater;
    energy += p.op.charge.heater;
    boilerCost += ((p.op.boiler * dt) / 3.6e9) * BOILER_PRICE;
  }
  const mean = sum / steps;
  const stockValue = ((heatAbove(p, floor) - stock0) / 3.6e9) * mean;
  const total = electricityCost + boilerCost - stockValue;
  const heat = p.totals.heat / 3.6e9;
  const boiler = p.totals.boiler / 3.6e9;
  return {
    electricityCost,
    boilerCost,
    stockValue,
    total,
    heat,
    boiler,
    charged: p.totals.heater / 3.6e9,
    costOfHeat: total / Math.max(heat + boiler, 1e-6),
    paid: energy > 0 ? money / energy : 0,
  };
}

/** A field for the start of a run: `full` is a real charge from a cool bed; `half` carries on with a discharge to the middle of the swing. */
export function startField(spec: SiloSpec, start: 'cold' | 'half' | 'full', coldT = 15): Float64Array {
  const p = createPlant(spec, start === 'cold' ? coldT : 150);
  if (start === 'cold') return bedField(p);
  chargeToFull(p, 3 * 3600);
  p.full = false;
  if (start === 'half') {
    const c = base(spec.ratedPower, 0);
    const floor = floorTemperature(p, c, spec.ratedPower);
    const target = p.material.h(0.5 * (spec.fullMeanT + floor));
    for (let i = 0; i < 2000 && p.material.h(p.meanT) > target; i++) stepPlant(p, c, 3 * 3600);
  }
  return bedField(p);
}

export interface GamePlan {
  plan: boolean[];
  result: WeekResult;
  /** Which rule gave the best week: the optimiser on its tank model, or a plain price threshold. */
  source: 'optimiser' | 'threshold';
  threshold: number;
}

/**
 * The opponent of the game. The optimiser plans on a tank (operate.ts); its plan and a few plain price thresholds then run through the full model, and
 * the cheapest week wins, so that the opponent is never beaten by a rule anyone can write. A player can still beat it by a little, which is
 * fair: it is not a proof of optimality on the full model.
 */
export function gamePlan(spec: SiloSpec, op: Operation, field: ArrayLike<number>, startDay = WINTER_DAY - 1): GamePlan {
  const p = createPlant(spec, 200);
  for (let i = 0; i < p.grid.nodes.length; i++) {
    p.net.T[i] = field[i]!;
    p.net.H[i] = p.net.mass[i]! * p.material.h(field[i]!);
  }
  const week = PRICE_WEEKS[op.priceWeek];
  const dp = planWeek(p, op, startDay, 0);
  let best: GamePlan = {
    plan: dp,
    result: weekRun(spec, { ...op, strategy: 'painted', painted: dp }, field, startDay),
    source: 'optimiser',
    threshold: 0,
  };
  for (const threshold of [0, 10, 20, 30, 40, 50, 60, 80, 100]) {
    const plan = week.map((v) => v <= threshold);
    const result = weekRun(spec, { ...op, strategy: 'painted', painted: plan }, field, startDay);
    if (result.total < best.result.total) best = { plan, result, source: 'threshold', threshold };
  }
  return best;
}

export interface CapacityPoint {
  power: number;
  usable: number;
  hours: number;
}

/** A point of usable capacity against the power asked, quick version for a chart: two cycles at a coarse step. */
export function capacityPoint(spec: SiloSpec, power: number): CapacityPoint {
  const c = capacityRun(spec, power, 2, spec.ratedPower < 1e5 ? 300 : 6 * 3600);
  return { power, usable: c.usable, hours: c.hoursUsable };
}

/** Where the chart of usable capacity is read, as shares of the rated power. */
export const CURVE_SHARES: readonly number[] = [0.1, 0.2, 0.3, 0.4, 0.6, 0.8, 1, 1.2];

/** The same charge with the core first and evenly: same machine, same heat, different walls. */
export function chargeOrderCompare(
  spec: SiloSpec,
): Record<
  'core-first' | 'even',
  { hours: number; wallKW: number; edgeT: number; coreT: number; lostInCharge: number }
> {
  const one = (order: 'core-first' | 'even') => {
    const p = createPlant(spec, 150);
    const hours = chargeToFull(p, 3600, order);
    const f = fieldStats(p);
    const lost = wallEnergy(p);
    const c = base(0, 0);
    p.full = false;
    stepPlant(p, c, 3600);
    return { hours, wallKW: p.op.wallLoss / 1e3, edgeT: f.edgeT, coreT: f.coreT, lostInCharge: lost };
  };
  return { 'core-first': one('core-first'), even: one('even') };
}

export interface ScaleRow {
  id: string;
  /** Mass, kg; volume, m³; surface per volume, 1/m. */
  mass: number;
  volume: number;
  surfacePerVolume: number;
  /** Usable at rated power and heat above ambient, J. */
  usable: number;
  heat: number;
  ratedPower: number;
  /** Days. */
  halfLife: number;
  /** A week idle takes this share of the heat at full. */
  weekShare: number;
  /** Round trip on a cycle at rated power with a day of rest on each side. */
  efficiency: number;
}

/** One row of the scale chart: the same physics, whatever the size. */
export function scaleRow(id: string, spec: SiloSpec): ScaleRow {
  const r = spec.bedRadius;
  const h = spec.bedHeight;
  const volume = Math.PI * r * r * h;
  // a tiny plant lives in hours, a big one in days
  const dt = spec.ratedPower < 1e5 ? 300 : 3600;
  const c = capacityRun(spec, spec.ratedPower, 2, dt);
  const idle = idleRun(spec);
  const cy = cycleRun(spec, spec.ratedPower, 1, 3, dt);
  return {
    id,
    mass: createPlant(spec, 20).mass,
    volume,
    surfacePerVolume: (2 * Math.PI * r * h + 2 * Math.PI * r * r) / volume,
    usable: c.usable,
    heat: c.heatFull,
    ratedPower: spec.ratedPower,
    halfLife: idle.halfLifeHeat,
    weekShare: idle.weekShare,
    efficiency: cy.efficiency,
  };
}
