import { describe, expect, it } from 'vitest';
import { chargeDiscount, planCost, solveDispatch, type DispatchProblem } from './index';

// The market core against small problems whose answer is known, and against every possible plan.

const problem = (patch: Partial<DispatchProblem> = {}): DispatchProblem => ({
  price: [100, 10, 100, 10, 100, 10],
  demand: [1, 1, 1, 1, 1, 1],
  hours: 1,
  capacity: 10,
  chargeLimit: () => 2,
  efficiency: 1,
  lossPerHour: 0,
  backupPrice: 1000,
  initial: 1,
  terminalValue: 0,
  levels: 101,
  ...patch,
});

describe('the plan', () => {
  it('charges in the cheap hours', () => {
    const plan = solveDispatch(problem());
    expect(plan.charge[1]).toBe(true);
    expect(plan.charge[3]).toBe(true);
    expect(plan.charge[0]).toBe(false);
    expect(plan.charge[2]).toBe(false);
  });
  it('is as cheap as the best of all possible plans', () => {
    const p = problem({ price: [50, 20, 80, 5, 40, 90, 15, 60], demand: new Array(8).fill(1), levels: 201 });
    let best = Infinity;
    for (let bits = 0; bits < 256; bits++) {
      const candidate = Array.from({ length: 8 }, (_, i) => Boolean(bits & (1 << i)));
      best = Math.min(best, planCost(p, candidate));
    }
    const plan = solveDispatch(p);
    expect(planCost(p, plan.charge)).toBeCloseTo(best, 6);
    expect(plan.cost).toBeCloseTo(best, 6);
  });
  it('falls back on the backup when charging costs more than the backup', () => {
    const plan = solveDispatch(problem({ price: [500, 500, 500], demand: [1, 1, 1], initial: 0, backupPrice: 100 }));
    expect(plan.charge).toEqual([false, false, false]);
    expect(plan.cost).toBeCloseTo(300, 6);
  });
  it('pays to charge at a negative price, up to the size of the store', () => {
    const plan = solveDispatch(
      problem({ price: [-20, -20, -20], demand: [0, 0, 0], initial: 0, capacity: 3, chargeLimit: () => 2 }),
    );
    expect(plan.level[3]).toBeCloseTo(3, 6);
    expect(plan.cost).toBeCloseTo(-60, 6);
  });
  it('a loss per hour is paid for: the same plan delivers less', () => {
    const lossless = solveDispatch(problem());
    const lossy = solveDispatch(problem({ lossPerHour: 0.05 }));
    expect(lossy.cost).toBeGreaterThan(lossless.cost);
  });
  it('a terminal value keeps some in the store', () => {
    const p = problem({ price: [10, 10, 10], demand: [0, 0, 0], initial: 0, terminalValue: 50 });
    expect(solveDispatch(p).level[3]).toBeCloseTo(6, 6);
    expect(solveDispatch({ ...p, terminalValue: 0 }).level[3]).toBeCloseTo(0, 6);
  });
  it('respects a charging limit that falls with the level', () => {
    const p = problem({
      price: [1, 1, 1, 1],
      demand: [0, 0, 0, 0],
      initial: 0,
      capacity: 4,
      chargeLimit: (f) => (f < 0.5 ? 2 : 0.5),
      terminalValue: 10,
    });
    const plan = solveDispatch(p);
    expect(plan.level[1]).toBeCloseTo(2, 6);
    expect(plan.level[2]).toBeCloseTo(2.5, 6);
    expect(plan.level[4]).toBeCloseTo(3.5, 6);
  });
});

describe('the price paid', () => {
  it('compares what was paid with the average on offer', () => {
    const d = chargeDiscount([10, 100], [1, 0]);
    expect(d.paid).toBe(10);
    expect(d.mean).toBe(55);
    expect(d.discount).toBeCloseTo(1 - 10 / 55, 10);
  });
  it('a plant that buys nothing paid nothing', () => {
    expect(chargeDiscount([10, 100], [0, 0]).paid).toBe(0);
  });
});
