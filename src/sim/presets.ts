import { PORNAINEN, siloSpec, type MediumId, type SiloId, type SiloSpec } from './silo';
import { HOURS_PER_WEEK, SUMMER_DAY, WINTER_DAY } from './week';
import { RETURN_T, SUPPLY_T } from './runs';
import type { PresetId, SandParams, ScenarioId } from './types';

// The starting points and the small scripted situations. Scale presets live in the simulation only: the 3D draws one silo.

export const PRESET_IDS: PresetId[] = ['pornainen-soapstone', 'same-silo-sand', 'kankaanpaa', 'vaaksy', 'two-drums'];

export const SCENARIO_IDS: ScenarioId[] = [
  'cold-start',
  'winter-week',
  'summer-month',
  'windless-days',
  'negative-weekend',
  'idle-three-months',
  'core-first',
  'half-insulation',
  'scale',
  'soapstone-vs-sand',
  'blower-failure',
  'reserve-call',
];

const PRESET_SILO: Record<PresetId, { silo: SiloId; medium: MediumId }> = {
  'pornainen-soapstone': { silo: 'pornainen', medium: 'soapstone' },
  'same-silo-sand': { silo: 'pornainen', medium: 'sand' },
  kankaanpaa: { silo: 'kankaanpaa', medium: 'sand' },
  vaaksy: { silo: 'vaaksy', medium: 'sand' },
  'two-drums': { silo: 'two-drums', medium: 'sand' },
};

/** The clock opens at one hour simulated per second. */
export const DEFAULT_TIME_SCALE = 3600;
/** The speeds of the strip: real time for the failures, then an hour, a day, a week per second. */
export const SPEEDS = [1, 3600, 86400, 604800];

/** Start of the clock: mid-February, a cold day with the silo at work. */
export const START_DAY = 45;

/** The ranges of the sliders, which scale with the machine where they must. */
export const RANGES = {
  ratedPower: { min: 0.2e6, max: 2e6, step: 0.05e6 },
  chargePower: { min: 0.2e6, max: 3e6, step: 0.05e6 },
  fullMeanT: { min: 200, max: 550, step: 5 },
  coreLimit: { min: 300, max: 650, step: 10 },
  chargeAirT: { min: 150, max: 650, step: 10 },
  insulation: { min: 0.05, max: 1, step: 0.01 },
  lambda: { min: 0.05, max: 0.3, step: 0.01 },
  pitch: { min: 0.3, max: 1.2, step: 0.01 },
  kScale: { min: 0.4, max: 2, step: 0.05 },
  blowerPerMW: { min: 2, max: 30, step: 0.5 },
  supplyT: { min: 70, max: 100, step: 1 },
  returnT: { min: 35, max: 60, step: 1 },
  outsideShift: { min: -20, max: 20, step: 1 },
  threshold: { min: -30, max: 400, step: 5 },
} as const;

export type RangedKey = keyof typeof RANGES;

/** The range of a slider on a given machine: powers and pipes follow its size. */
export function rangeOf(key: RangedKey, silo: SiloId): { min: number; max: number; step: number } {
  const r = RANGES[key];
  const spec = siloSpec(silo);
  if (key === 'ratedPower' || key === 'chargePower') {
    const k = Math.min(1, spec.ratedPower / 1e6);
    const round = (v: number) => Number(v.toPrecision(3));
    return { min: round(r.min * k), max: round(r.max * k), step: round(r.step * k) };
  }
  if (key === 'pitch') {
    const k = spec.pitch / PORNAINEN.pitch;
    return {
      min: Number((r.min * k).toFixed(3)),
      max: Number((r.max * k).toFixed(3)),
      step: Number((r.step * k).toFixed(3)),
    };
  }
  return r;
}

/** A start of a scenario: the stone at this state. */
export type StartState = 'cold' | 'half' | 'full';

const noPlan = (): boolean[] => new Array<boolean>(HOURS_PER_WEEK).fill(false);

function machine(
  spec: SiloSpec,
  silo: SiloId,
  medium: MediumId,
): Pick<
  SandParams,
  | 'silo'
  | 'medium'
  | 'ratedPower'
  | 'chargePower'
  | 'fullMeanT'
  | 'coreLimit'
  | 'chargeAirT'
  | 'insulation'
  | 'lambda'
  | 'pitch'
  | 'kScale'
  | 'blowerPerMW'
> {
  return {
    silo,
    medium,
    ratedPower: spec.ratedPower,
    chargePower: spec.chargePower,
    fullMeanT: spec.fullMeanT,
    coreLimit: spec.coreLimit,
    chargeAirT: spec.chargeAirT,
    insulation: spec.insulation,
    lambda: spec.lambda,
    pitch: spec.pitch,
    kScale: spec.kScale,
    blowerPerMW: spec.blowerPerMW,
  };
}

export function presetParams(id: PresetId): SandParams {
  const { silo, medium } = PRESET_SILO[id];
  const spec = siloSpec(silo, medium);
  return {
    slowMo: 1,
    timeScale: DEFAULT_TIME_SCALE,
    running: true,
    preset: id,
    ...machine(spec, silo, medium),
    supplyT: SUPPLY_T,
    returnT: RETURN_T,
    season: 'year',
    outsideShift: 0,
    demandOn: true,
    strategy: 'threshold',
    threshold: 40,
    priceWeek: 'drawn',
    chargeOrder: 'core-first',
    painted: noPlan(),
    blowerFailed: false,
    interlock: true,
    reserveCall: false,
  };
}

/** What makes a preset: everything but the clock, the name itself, and a painted plan, which only counts under the rule that reads it. */
const NOT_THE_MACHINE: readonly (keyof SandParams)[] = ['slowMo', 'timeScale', 'running', 'preset', 'painted'];

/** The preset these settings are, if any: switching the medium gives « the same silo, filled with sand », and the list should say so. */
export function presetOf(p: SandParams): PresetId | 'custom' {
  const keys = (Object.keys(p) as (keyof SandParams)[]).filter((k) => !NOT_THE_MACHINE.includes(k));
  return PRESET_IDS.find((id) => keys.every((k) => presetParams(id)[k] === p[k])) ?? 'custom';
}

/** The machine a set of parameters describes. */
export function specOf(p: SandParams): SiloSpec {
  const base = siloSpec(p.silo, p.medium);
  return {
    ...base,
    medium: p.medium,
    ratedPower: p.ratedPower,
    chargePower: p.chargePower,
    fullMeanT: p.fullMeanT,
    coreLimit: p.coreLimit,
    chargeAirT: p.chargeAirT,
    insulation: p.insulation,
    lambda: p.lambda,
    pitch: p.pitch,
    kScale: p.kScale,
    blowerPerMW: p.blowerPerMW,
  };
}

/** A change scheduled in a scenario, at a time in real seconds. */
export interface ScheduledEvent {
  at: number;
  patch: Partial<SandParams>;
  /** Or a whole preset, its stone at this state. */
  preset?: PresetId;
  start?: StartState;
}

/** A number moving linearly from `from` to `to` between `at` and `at + duration`, in real seconds. */
export interface Ramp {
  key: 'chargeAirT';
  at: number;
  duration: number;
  from: number;
  to: number;
}

export interface ScenarioSetup {
  params: SandParams;
  start: StartState;
  /** Where the clock starts: a day of the year and an hour of the day. */
  day: number;
  hour: number;
  events: ScheduledEvent[];
  ramps: Ramp[];
}

export function scenarioSetup(id: ScenarioId): ScenarioSetup {
  const s = scenarioBase(id);
  return { ...s, params: { ...s.params, preset: 'custom' } };
}

function scenarioBase(id: ScenarioId): ScenarioSetup {
  const base = presetParams('pornainen-soapstone');
  const day = 86400;
  const week = 604800;
  const quiet = { events: [] as ScheduledEvent[], ramps: [] as Ramp[] };
  switch (id) {
    case 'cold-start':
      // a stone at the temperature of the yard: the air climbs slowly so that the moisture has time to leave (the rate is not published: a drawn ramp)
      return {
        params: { ...base, timeScale: day, strategy: 'always', demandOn: false, season: 'summer', chargeAirT: 150 },
        start: 'cold',
        day: SUMMER_DAY,
        hour: 8,
        events: [],
        ramps: [{ key: 'chargeAirT', at: 2, duration: 30, from: 150, to: base.chargeAirT }],
      };
    case 'winter-week':
      // no charge at all, full at the start: how long does it hold the coldest demand?
      return {
        params: { ...base, timeScale: day, strategy: 'off', season: 'winter' },
        start: 'full',
        day: WINTER_DAY,
        hour: 0,
        ...quiet,
      };
    case 'summer-month':
      return {
        params: { ...base, timeScale: day, strategy: 'off', season: 'summer' },
        start: 'full',
        day: SUMMER_DAY,
        hour: 0,
        ...quiet,
      };
    case 'windless-days':
      // ten days with no cheap hour: the rule stays out of the market, the stock goes, the boiler comes back; then the wind returns
      return {
        params: {
          ...base,
          timeScale: day,
          strategy: 'threshold',
          threshold: 40,
          priceWeek: 'windless',
          season: 'winter',
        },
        start: 'half',
        day: WINTER_DAY,
        hour: 0,
        events: [{ at: 10, patch: { priceWeek: 'drawn' } }],
        ramps: [],
      };
    case 'negative-weekend':
      // from Friday noon: prices fall below zero, the heater runs flat out, and the loop still sets how much goes in
      return {
        params: {
          ...base,
          timeScale: 3600,
          strategy: 'threshold',
          threshold: 0,
          priceWeek: 'negative',
          season: 'winter',
        },
        start: 'half',
        day: 4,
        hour: 12,
        ...quiet,
      };
    case 'idle-three-months':
      return {
        params: { ...base, timeScale: week, strategy: 'off', demandOn: false },
        start: 'full',
        day: 91,
        hour: 0,
        ...quiet,
      };
    case 'core-first':
      // the same charge spread evenly: the panel compares it with the core first
      return {
        params: { ...base, timeScale: day, strategy: 'always', demandOn: false, chargeOrder: 'even', season: 'summer' },
        start: 'cold',
        day: SUMMER_DAY,
        hour: 0,
        ...quiet,
      };
    case 'half-insulation':
      return {
        params: { ...base, timeScale: week, strategy: 'off', demandOn: false, insulation: base.insulation / 2 },
        start: 'full',
        day: 91,
        hour: 0,
        ...quiet,
      };
    case 'scale':
      // the four sizes left alone, one after the other, on the same clock
      return {
        params: { ...presetParams('two-drums'), timeScale: day, strategy: 'off', demandOn: false },
        start: 'full',
        day: 91,
        hour: 0,
        events: [
          { at: 12, patch: { timeScale: day, strategy: 'off', demandOn: false }, preset: 'kankaanpaa', start: 'full' },
          {
            at: 30,
            patch: { timeScale: day, strategy: 'off', demandOn: false },
            preset: 'pornainen-soapstone',
            start: 'full',
          },
          { at: 48, patch: { timeScale: day, strategy: 'off', demandOn: false }, preset: 'vaaksy', start: 'full' },
        ],
        ramps: [],
      };
    case 'soapstone-vs-sand':
      // hot air, a charge, then the medium changes under the same temperatures: a third less mass, and a line at 573 °C if the air goes above it
      return {
        params: {
          ...base,
          timeScale: day,
          strategy: 'always',
          demandOn: false,
          chargeAirT: 650,
          coreLimit: 650,
          fullMeanT: 550,
        },
        start: 'full',
        day: 91,
        hour: 0,
        events: [{ at: 10, patch: { medium: 'sand' } }],
        ramps: [],
      };
    case 'blower-failure':
      // real time: the blower dies during a charge, the flow falls, the switch trips the heater, the element cools
      return {
        params: { ...base, timeScale: 1, strategy: 'always', demandOn: true, season: 'winter' },
        start: 'half',
        day: WINTER_DAY,
        hour: 2,
        events: [
          { at: 8, patch: { blowerFailed: true } },
          { at: 60, patch: { blowerFailed: false } },
        ],
        ramps: [],
      };
    case 'reserve-call':
      // real time: the grid asks for less load, the heater sheds at once; the village sees nothing
      return {
        params: { ...base, timeScale: 1, strategy: 'always', demandOn: true, season: 'winter' },
        start: 'half',
        day: WINTER_DAY,
        hour: 2,
        events: [
          { at: 8, patch: { reserveCall: true } },
          { at: 38, patch: { reserveCall: false } },
        ],
        ramps: [],
      };
  }
}
