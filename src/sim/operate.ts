import { solveDispatch, type DispatchProblem } from './market';
import { floorTemperature, heatAbove, type ChargeOrder, type Conditions, type Plant } from './plant';
import {
  BOILER_PRICE,
  demandAt,
  hourOfWeekAt,
  HOURS_PER_WEEK,
  outsideAt,
  PRICE_WEEKS,
  priceAt,
  solarOverflowAt,
  type PriceWeekId,
  type Season,
} from './week';

// How the plant is run: which hours it charges in, what the village asks, what the weather is. No physics here: it fills the `Conditions` of a
// step. Run on the live engine and on the year (runs.ts) alike, so both follow one set of rules.

export type Strategy = 'always' | 'threshold' | 'optimal' | 'painted' | 'solar' | 'off';
export const STRATEGIES: readonly Strategy[] = ['always', 'threshold', 'optimal', 'painted', 'solar', 'off'];

export interface Operation {
  strategy: Strategy;
  /** Charge at or under this price, €/MWh. */
  threshold: number;
  /** Charge plan of the 'painted' strategy, by hour of the week. */
  painted: readonly boolean[];
  /** The plan of the optimiser, by hour of the week. */
  optimal: readonly boolean[];
  priceWeek: PriceWeekId;
  season: Season;
  outsideShift: number;
  /** The network is connected. */
  demandOn: boolean;
  supplyT: number;
  returnT: number;
  chargeOrder: ChargeOrder;
  spill: number;
  /** The grid has called on the reserve: the heater sheds at once. */
  reserveCall: boolean;
}

/** ESTIMATE: the charge moves on to cooler zones when the ones it has take under half of what is offered. */
export const DEFAULT_SPILL = 0.5;

/** The power offered to the heater at an hour, W. */
export function offeredPower(op: Operation, chargePower: number, hourOfWeek: number): number {
  if (op.reserveCall) return 0;
  switch (op.strategy) {
    case 'always':
      return chargePower;
    case 'threshold':
      return priceAt(op.priceWeek, hourOfWeek) <= op.threshold ? chargePower : 0;
    case 'optimal':
      return op.optimal[hourOfWeek] ? chargePower : 0;
    case 'painted':
      return op.painted[hourOfWeek] ? chargePower : 0;
    case 'solar':
      return chargePower * solarOverflowAt(hourOfWeek);
    case 'off':
      return 0;
  }
}

/** Fill the conditions of a step at a day of the year and an hour of the day. */
export function fillConditions(
  c: Conditions,
  op: Operation,
  rated: number,
  chargePower: number,
  day: number,
  hour: number,
): void {
  c.outsideT = outsideAt(op.season, day, hour, op.outsideShift);
  c.supplyT = op.supplyT;
  c.returnT = op.returnT;
  c.demand = op.demandOn ? demandAt(op.season, day, hour, rated) : 0;
  c.chargeRequest = offeredPower(op, chargePower, hourOfWeekAt(day, hour));
  c.chargeOrder = op.chargeOrder;
  c.spill = op.spill;
}

export const newConditions = (): Conditions => ({
  outsideT: 5,
  supplyT: 85,
  returnT: 45,
  demand: 0,
  chargeRequest: 0,
  chargeOrder: 'core-first',
  spill: DEFAULT_SPILL,
});

/**
 * The plant reduced to a tank for the optimiser: its usable heat above the floor of the week's power, a charging limit that falls in the top half
 * as the real loop's does, a loss from the walls now. The plan it gives then runs through the full model: only that counts.
 */
export function lumpedTwin(p: Plant, op: Operation, day: number, price: ArrayLike<number>): DispatchProblem {
  const s = p.spec;
  const demand = new Float64Array(HOURS_PER_WEEK);
  let peak = 0;
  for (let t = 0; t < HOURS_PER_WEEK; t++) {
    const d = day + ((t / 24) | 0);
    const q = op.demandOn ? demandAt(op.season, d, t % 24, s.ratedPower) : 0;
    demand[t] = q / 1e6;
    if (q > peak) peak = q;
  }
  const floor = floorTemperature(
    p,
    { supplyT: op.supplyT, returnT: op.returnT, outsideT: 5 },
    Math.max(peak, 0.1 * s.ratedPower),
  );
  const capacity = Math.max((p.mass * (p.material.h(s.fullMeanT) - p.material.h(floor))) / 3.6e9, 1e-3);
  const heat = Math.max(heatAbove(p, 10), 1);
  const loss = Math.max(p.op.wallLoss, 1);
  let sum = 0;
  for (let t = 0; t < HOURS_PER_WEEK; t++) sum += price[t]!;
  const charge = s.chargePower / 1e6;
  return {
    price,
    demand,
    hours: 1,
    capacity,
    // the loop takes the full power up to about half of the swing, then less, down to about a third at the top (measured on the full model)
    chargeLimit: (fill) => charge * (fill < 0.5 ? 1 : Math.max(0.35, 1 - 1.3 * (fill - 0.5))),
    efficiency: 0.97,
    lossPerHour: (loss * 3600) / heat,
    backupPrice: BOILER_PRICE,
    initial: Math.max(0, Math.min(capacity, heatAbove(p, floor) / 3.6e9)),
    terminalValue: sum / HOURS_PER_WEEK,
    levels: 41,
  };
}

/** The optimiser's plan for the next week from now, by hour of the week. */
export function planWeek(p: Plant, op: Operation, day: number, hourOfWeek: number): boolean[] {
  const week = PRICE_WEEKS[op.priceWeek];
  const price = new Float64Array(HOURS_PER_WEEK);
  for (let t = 0; t < HOURS_PER_WEEK; t++) price[t] = week[(hourOfWeek + t) % HOURS_PER_WEEK]!;
  const plan = solveDispatch(lumpedTwin(p, op, day, price));
  const out = new Array<boolean>(HOURS_PER_WEEK).fill(false);
  plan.charge.forEach((on, t) => (out[(hourOfWeek + t) % HOURS_PER_WEEK] = on));
  return out;
}
