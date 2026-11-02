// A small market core: an hourly price, a store of energy with a charging limit, a demand served from it, a backup for what it cannot
// serve. A dynamic programme over the level of the store, with perfect foresight, gives the cheapest charging plan. Pure, no import
// from a lab. Candidate for the kit if another lab needs it (the gravity battery may).

export interface DispatchProblem {
  /** Price of each period, €/MWh. */
  price: ArrayLike<number>;
  /** Energy asked in each period, MWh. */
  demand: ArrayLike<number>;
  /** Length of a period, h. */
  hours: number;
  /** Size of the store, MWh. */
  capacity: number;
  /** Largest charging power at a level (0 to 1 of the capacity), MW drawn. */
  chargeLimit: (fill: number) => number;
  /** Energy stored per MWh drawn. */
  efficiency: number;
  /** Share of the content lost per hour. */
  lossPerHour: number;
  /** What a MWh of the backup costs, €. */
  backupPrice: number;
  /** Level at the start, MWh. */
  initial: number;
  /** What a MWh left in the store at the end is worth, €. */
  terminalValue: number;
  /** Levels of the grid (default 41). */
  levels?: number;
}

export interface DispatchPlan {
  /** Whether to charge in each period. */
  charge: boolean[];
  /** The level the twin expects, MWh, at the start of each period and at the end (one more value than periods). */
  level: Float64Array;
  /** Total cost the twin expects, € (the value of what is left is taken off). */
  cost: number;
}

/** One period of the twin: the level after it and its cost. */
function advance(
  p: DispatchProblem,
  t: number,
  level: number,
  charge: boolean,
  out: { level: number; cost: number },
): void {
  const drawn = charge ? p.chargeLimit(level / p.capacity) * p.hours : 0;
  let l = level * (1 - p.lossPerHour * p.hours) + drawn * p.efficiency;
  const served = Math.min(l, p.demand[t]!);
  l -= served;
  if (l > p.capacity) {
    // a full store takes only what fits
    const spill = (l - p.capacity) / p.efficiency;
    out.level = p.capacity;
    out.cost = (drawn - spill) * p.price[t]! + (p.demand[t]! - served) * p.backupPrice;
    return;
  }
  out.level = l;
  out.cost = drawn * p.price[t]! + (p.demand[t]! - served) * p.backupPrice;
}

/**
 * The cheapest plan: backward induction on a grid of levels, with the value between two levels read by a straight line (so that a
 * coarse grid does not trap the store on a level). Cost: periods × levels × 2 small operations.
 */
export function solveDispatch(p: DispatchProblem): DispatchPlan {
  const T = p.price.length;
  const N = p.levels ?? 41;
  const dl = p.capacity / (N - 1);
  let next = new Float64Array(N);
  for (let i = 0; i < N; i++) next[i] = -p.terminalValue * i * dl;
  const decide = new Uint8Array(T * N);
  let now = new Float64Array(N);
  const step = { level: 0, cost: 0 };
  const read = (v: Float64Array, l: number): number => {
    const x = Math.max(0, Math.min(l / dl, N - 1));
    const i = Math.min(Math.floor(x), N - 2);
    return v[i]! + (x - i) * (v[i + 1]! - v[i]!);
  };
  for (let t = T - 1; t >= 0; t--) {
    for (let i = 0; i < N; i++) {
      const level = i * dl;
      advance(p, t, level, false, step);
      const off = step.cost + read(next, step.level);
      advance(p, t, level, true, step);
      const on = step.cost + read(next, step.level);
      now[i] = Math.min(off, on);
      decide[t * N + i] = on < off ? 1 : 0;
    }
    const swap = next;
    next = now;
    now = swap;
  }
  const charge: boolean[] = [];
  const level = new Float64Array(T + 1);
  level[0] = p.initial;
  let cost = 0;
  for (let t = 0; t < T; t++) {
    const x = Math.max(0, Math.min(level[t]! / dl, N - 1));
    const on = decide[t * N + Math.round(x)] === 1;
    charge.push(on);
    advance(p, t, level[t]!, on, step);
    cost += step.cost;
    level[t + 1] = step.level;
  }
  cost -= p.terminalValue * level[T]!;
  return { charge, level, cost };
}

/** What a charging plan costs on the twin, run forward, with the same accounting: to compare any plan with the optimum. */
export function planCost(p: DispatchProblem, plan: ArrayLike<boolean>): number {
  let l = p.initial;
  let cost = 0;
  const step = { level: 0, cost: 0 };
  for (let t = 0; t < p.price.length; t++) {
    advance(p, t, l, Boolean(plan[t]), step);
    cost += step.cost;
    l = step.level;
  }
  return cost - p.terminalValue * l;
}

/** Mean price paid and mean price on offer: how far under the average the charging was bought. */
export function chargeDiscount(
  price: ArrayLike<number>,
  drawn: ArrayLike<number>,
): { paid: number; mean: number; discount: number } {
  let money = 0;
  let energy = 0;
  let sum = 0;
  for (let t = 0; t < price.length; t++) {
    money += price[t]! * drawn[t]!;
    energy += drawn[t]!;
    sum += price[t]!;
  }
  const mean = sum / price.length;
  const paid = energy > 0 ? money / energy : 0;
  return { paid, mean, discount: mean !== 0 ? 1 - paid / mean : 0 };
}
