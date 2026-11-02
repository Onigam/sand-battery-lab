// What the simulation gives, for the sheets that print MODEL RESULTS (the temperature maps and the energy balance). Computed on first use from src/sim, never typed: the figures of src/data/figures.ts
// are held to the same runs by data.test.ts, and drawings.test.ts holds these to those. No target anywhere.
import { DEFAULT_SPILL } from '../sim/operate';
import { bedField, createPlant, stepPlant } from '../sim/plant';
import { capacityRun, fieldStats, MEAN_OUTSIDE, MWH, RETURN_T, scaleRow, SUPPLY_T, type ScaleRow } from '../sim/runs';
import { siloSpec } from '../sim/silo';
import { SUMMER_DEMAND, WINTER_DEMAND } from '../sim/week';

export interface FieldSnapshot {
  /** Wanted share of the heat above the return water at full, 0 to 1. */
  level: number;
  /** °C, `field[ring + rings * layer]`, layer 0 at the bottom, ring 0 on the axis. */
  field: Float64Array;
  meanT: number;
  coreT: number;
  edgeT: number;
  /** Hours of charge at the 1 MW on offer from the start of the run. */
  hours: number;
  rings: number;
  layers: number;
}

/** One first charge, every six hours: hours, then the mean, the core and the edge, °C. */
export interface ChargeCurve {
  hours: number[];
  mean: number[];
  core: number[];
  edge: number[];
}

let cache: FieldSnapshot[] | null = null;
let curve: ChargeCurve = { hours: [], mean: [], core: [], edge: [] };

/** The first charge behind `temperatureMaps`. */
export function chargeCurve(): ChargeCurve {
  temperatureMaps();
  return curve;
}

/** The section at four stages of a first charge at the 1 MW on offer, core first, from the temperature of the return water. The level is the engine's: the share of the heat above the return water. */
export function temperatureMaps(levels: readonly number[] = [0, 0.25, 0.5, 1]): FieldSnapshot[] {
  if (cache) return cache;
  const spec = siloSpec('pornainen');
  const p = createPlant(spec, RETURN_T);
  const level = (): number =>
    (p.material.h(p.meanT) - p.material.h(RETURN_T)) / (p.material.h(spec.fullMeanT) - p.material.h(RETURN_T));
  const snap = (wanted: number, hours: number): FieldSnapshot => {
    const f = fieldStats(p);
    return {
      level: wanted,
      field: bedField(p),
      meanT: f.meanT,
      coreT: f.coreT,
      edgeT: f.edgeT,
      hours,
      rings: p.rings,
      layers: p.layers,
    };
  };
  const out: FieldSnapshot[] = [snap(levels[0]!, 0)];
  let next = 1;
  const dt = 3600;
  const c = {
    outsideT: MEAN_OUTSIDE,
    supplyT: SUPPLY_T,
    returnT: RETURN_T,
    demand: 0,
    chargeRequest: spec.chargePower,
    chargeOrder: 'core-first' as const,
    spill: DEFAULT_SPILL,
  };
  for (let t = dt; t < 2 * 365 * 86400 && next < levels.length; t += dt) {
    stepPlant(p, c, dt);
    if ((t / dt) % 6 === 0) {
      const f = fieldStats(p);
      curve.hours.push(t / 3600);
      curve.mean.push(f.meanT);
      curve.core.push(f.coreT);
      curve.edge.push(f.edgeT);
    }
    if (level() >= levels[next]! - 1e-3 || p.full) {
      out.push(snap(levels[next]!, t / 3600));
      next++;
    }
  }
  cache = out;
  return out;
}

let blowers: { rate: number; usable: number }[] | null = null;

/** What a full charge gives at 1 MW against the size of the blowers, the one setting nobody publishes: MWh, at m³/s per MW. */
export function blowerCurve(rates: readonly number[] = [2.5, 5, 7.5, 10, 15, 30]): { rate: number; usable: number }[] {
  if (blowers) return blowers;
  const spec = siloSpec('pornainen');
  blowers = rates.map((rate) => ({ rate, usable: capacityRun({ ...spec, blowerPerMW: rate }).usable / MWH }));
  return blowers;
}

let curvePower: { power: number; usable: number; share: number; days: number }[] | null = null;

/** What a full charge gives against the power asked, the same silo: kW, MWh, share of the heat above ambient, days. */
export function powerCurve(
  powersKw: readonly number[] = [1000, 800, WINTER_DEMAND / 1000, SUMMER_DEMAND / 1000],
): { power: number; usable: number; share: number; days: number }[] {
  if (curvePower) return curvePower;
  const spec = siloSpec('pornainen');
  curvePower = powersKw.map((power) => {
    const c = capacityRun(spec, power * 1000);
    return { power, usable: c.usable / MWH, share: c.shareOfHeat * 100, days: c.hoursUsable / 24 };
  });
  return curvePower;
}

let scale: ScaleRow[] | null = null;

/** The four sizes on one rule: the first silo, this one, the 250 MWh silo and the two drums. */
export function scaleRows(): ScaleRow[] {
  if (scale) return scale;
  scale = (['kankaanpaa', 'pornainen', 'vaaksy', 'two-drums'] as const).map((id) => {
    const spec = siloSpec(id);
    // the usable heat of the long run, the same as docs/physics.md prints; the two drums live in minutes, so they take a shorter step
    const usable = id === 'two-drums' ? capacityRun(spec, spec.ratedPower, 3, 300).usable : capacityRun(spec).usable;
    return { ...scaleRow(id, spec), usable };
  });
  return scale;
}
