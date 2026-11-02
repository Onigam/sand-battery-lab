import type { LabSim } from '@onigam/lab-kit/ui';
import { fillConditions, newConditions, planWeek, type Operation } from './operate';
import {
  applySpec,
  createPlant,
  floorTemperature,
  heatAbove,
  resetBalance,
  retargetBed,
  setBedField,
  stepPlant,
  swapConductivity,
  totalMass,
  wallEnergy,
  wallState,
  ZONE_CORE,
  ZONE_MIDDLE,
  ZONE_OUTER,
  type Conditions,
  type Plant,
} from './plant';
import {
  DEFAULT_TIME_SCALE,
  presetOf,
  presetParams,
  rangeOf,
  RANGES,
  scenarioSetup,
  specOf,
  START_DAY,
  type RangedKey,
  type Ramp,
  type ScheduledEvent,
  type StartState,
} from './presets';
import {
  capacityPoint,
  capacityStep,
  capacityRun,
  chargeOrderCompare,
  CURVE_SHARES,
  defaultOperation,
  gamePlan,
  scaleRow,
  startField,
  weekRun,
  yearRun,
  type CapacityPoint,
  type CapacityResult,
  type GamePlan,
  type ScaleRow,
  type WeekResult,
  type YearResult,
} from './runs';
import {
  BLOWER_TAU,
  blowerFlow,
  ELEMENT_C_PER_MW,
  ELEMENT_LIMIT,
  ELEMENT_RISE,
  FLOW_SWITCH,
  GRID_LAYERS,
  GRID_RINGS,
  LIMITS,
  materialFor,
  siloSpec,
  ZONE_EDGES,
  ZONE_IDS,
  type SiloSpec,
} from './silo';
import { pipeCellShape, pitchRadius, airRho } from './thermal';
import type { PresetId, SandParams, SandState, ScenarioId, Scope } from './types';
import { BOILER_PRICE, hourOfWeekAt, HOURS_PER_WEEK, priceAt, winterness } from './week';

// SandSim: the whole plant as the kit's `LabSim`. The stone moves on a slow clock in steps of at most half an hour (the plant is cheap: about
// 60 µs a step), while the blowers and the heating element follow on the fast clock, in real seconds, so that a failure can be watched as it
// happens. Deterministic: nothing is drawn at run time.

/** Longest real step taken at once, s (a tab back from the background does not make one giant step). */
const DT_MAX = 0.25;
/** Longest step of the stone, s. */
const SLOW_STEP = 1800;
/** The stone is stepped at least this often, in real seconds, so that a slider moved at low speed answers at once. */
const REFRESH = 0.25;
/** Most steps of the stone in one frame (1 week per second at a low frame rate stays within this). */
const MAX_STEPS = 40;
/** One sample per simulated hour, three weeks of them. */
const SCOPE_EVERY = 3600;
const SCOPE_LENGTH = 504;

const TIME_KEYS: (keyof SandParams)[] = ['slowMo', 'timeScale', 'running'];
/** What needs a new bed. */
const GEOMETRY_KEYS: (keyof SandParams)[] = ['silo'];
/** The clock rule of a blower's drawing: at most this many turns a second on screen (the wagon wheel). */
const VISUAL_TURNS_PER_SECOND = 2;

/** The sizes the scale table compares. */
export const SCALE_SILOS = ['two-drums', 'kankaanpaa', 'pornainen', 'vaaksy'] as const;

const newState = (spec: SiloSpec): SandState => ({
  simTime: 0,
  day: START_DAY,
  hour: 6,
  winter: 0,
  outsideT: 0,
  bedT: new Float64Array(GRID_RINGS * GRID_LAYERS),
  rings: GRID_RINGS,
  layers: GRID_LAYERS,
  bedRadius: spec.bedRadius,
  bedHeight: spec.bedHeight,
  onDrawnSilo: true,
  zones: ZONE_IDS.map((id, i) => ({
    id,
    mode: 'idle',
    meanT: 0,
    rOuter: ZONE_EDGES[i]! * spec.bedRadius,
    chargeDamper: 0,
    dischargeDamper: 0,
  })),
  pitch: spec.pitch,
  pipeRadius: spec.pipeRadius,
  meanT: 0,
  coreT: 0,
  edgeT: 0,
  maxT: 0,
  minT: 0,
  shellT: 0,
  surfaceT: 0,
  chargeLevel: 0,
  floorT: 0,
  usableNow: 0,
  heatAbove: 0,
  heater: 0,
  heatOut: 0,
  demand: 0,
  boiler: 0,
  wallLoss: 0,
  ductLoss: 0,
  electricity: 0,
  blowerElectric: 0,
  chargeFlow: 0,
  dischargeFlow: 0,
  airHot: 0,
  chargeReturnT: 0,
  exchangerAirIn: 0,
  exchangerAirOut: 0,
  waterFlow: 0,
  supplyT: 85,
  returnT: 45,
  chargeDp: 0,
  dischargeDp: 0,
  chargeBlower: 0,
  dischargeBlower: 0,
  chargeBlowerAngle: 0,
  dischargeBlowerAngle: 0,
  pumpAngle: 0,
  elementT: 20,
  heaterGlow: 0,
  tripped: false,
  price: 0,
  energyElectric: 0,
  energyHeater: 0,
  energyHeat: 0,
  energyBoiler: 0,
  energyWalls: 0,
  energyRest: 0,
  costElectric: 0,
  costBoiler: 0,
  costOfHeat: 0,
  efficiency: 0,
  alarms: [],
});

export class SandSim implements LabSim {
  readonly params: SandParams;
  readonly state: SandState;
  readonly scope: Scope = {
    t: [],
    meanT: [],
    coreT: [],
    edgeT: [],
    heater: [],
    heatOut: [],
    boiler: [],
    wallLoss: [],
    price: [],
    level: [],
  };
  private plant: Plant;
  private conditions: Conditions = newConditions();
  private operation: Operation;
  private listeners = new Set<() => void>();
  private events: ScheduledEvent[] = [];
  private ramps: Ramp[] = [];
  private scriptTime = 0;
  private fired = new Set<number>();
  private lastKind: 'preset' | 'scenario' = 'preset';
  private lastId: PresetId | ScenarioId = 'pornainen-soapstone';
  private clock = 0;
  private startDay = START_DAY;
  private startHour = 6;
  private pending = 0;
  private sinceRefresh = 0;
  private sinceScope = 0;
  private flowClock = 0;
  private stock0 = 0;
  private planWeekIndex = -1;
  private cache = new Map<string, unknown>();

  constructor() {
    this.params = presetParams('pornainen-soapstone');
    const spec = specOf(this.params);
    this.state = newState(spec);
    this.plant = createPlant(spec, 200);
    this.operation = defaultOperation();
    this.rebuild('half');
  }

  // ------------------------------------------------------------------ the LabSim contract

  onChange(fn: () => void): void {
    this.listeners.add(fn);
  }

  emit(): void {
    this.listeners.forEach((fn) => fn());
  }

  /** Change parameters (clamped to the range of the machine). Anything but the time controls turns the preset into 'custom', unless the settings are those of another preset. */
  set(patch: Partial<SandParams>): void {
    const p = this.params as unknown as Record<string, unknown>;
    let physical = false;
    const silo = patch.silo ?? this.params.silo;
    const mediumBefore = this.params.medium;
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if (key in RANGES) {
        const r = rangeOf(key as RangedKey, silo);
        p[key] = Math.min(r.max, Math.max(r.min, Number(value)));
      } else if (key === 'slowMo' || key === 'timeScale') {
        p[key] = Math.max(0, Number(value));
      } else {
        p[key] = value;
      }
      if (!TIME_KEYS.includes(key as keyof SandParams) && key !== 'preset') {
        physical = true;
        this.ramps = this.ramps.filter((r) => r.key !== key);
      }
    }
    if (physical && patch.preset === undefined) this.params.preset = presetOf(this.params);
    if (GEOMETRY_KEYS.some((k) => patch[k] !== undefined)) this.rebuild('half');
    else if (physical) this.applySettings(mediumBefore);
    this.emit();
  }

  applyPreset(id: string): void {
    this.lastKind = 'preset';
    this.lastId = id as PresetId;
    this.load(presetParams(id as PresetId), 'half', START_DAY, 6, [], [], DEFAULT_TIME_SCALE);
  }

  applyScenario(id: string): void {
    this.lastKind = 'scenario';
    this.lastId = id as ScenarioId;
    const s = scenarioSetup(id as ScenarioId);
    this.load(s.params, s.start, s.day, s.hour, s.events, s.ramps, s.params.timeScale);
  }

  /** Start again from the last preset or scenario. */
  reset(): void {
    if (this.lastKind === 'preset') this.applyPreset(this.lastId);
    else this.applyScenario(this.lastId);
  }

  private load(
    next: SandParams,
    start: StartState,
    day: number,
    hour: number,
    events: ScheduledEvent[],
    ramps: Ramp[],
    timeScale: number,
  ): void {
    const keep = { slowMo: this.params.slowMo, running: this.params.running, painted: this.params.painted };
    Object.assign(this.params, next, keep, { timeScale });
    this.events = events;
    this.ramps = ramps;
    this.scriptTime = 0;
    this.fired.clear();
    this.startDay = day;
    this.startHour = hour;
    this.rebuild(start);
    this.emit();
  }

  /** A new bed for the machine of the parameters, its stone at a state, the clock and the counters at their start. */
  private rebuild(start: StartState): void {
    const p = this.params;
    const spec = specOf(p);
    this.plant = createPlant(spec, 200);
    this.loadStone(start);
    this.clock = 0;
    this.pending = 0;
    this.sinceRefresh = 0;
    this.sinceScope = 0;
    this.planWeekIndex = -1;
    const s = this.state;
    s.tripped = false;
    s.elementT = 20;
    s.chargeBlower = 0;
    s.dischargeBlower = 0;
    s.simTime = 0;
    s.bedRadius = spec.bedRadius;
    s.bedHeight = spec.bedHeight;
    s.onDrawnSilo = p.silo === 'pornainen';
    s.zones.forEach((z, i) => (z.rOuter = ZONE_EDGES[i]! * spec.bedRadius));
    for (const k of Object.keys(this.scope) as (keyof Scope)[]) this.scope[k].length = 0;
    this.applyRamps();
    this.refreshOperation();
    this.stepStone(1);
    this.resetCounters();
    this.sample();
    this.refreshState();
    this.settleFast();
  }

  private loadStone(start: StartState): void {
    const spec = this.plant.spec;
    const key = `field|${start}|${JSON.stringify(spec)}`;
    let field = this.cache.get(key) as Float64Array | undefined;
    if (!field) {
      field = startField(spec, start);
      this.cache.set(key, field);
    }
    setBedField(this.plant, (ring, layer) => field![ring + GRID_RINGS * layer]!);
  }

  private applySettings(mediumBefore: SandParams['medium']): void {
    const p = this.params;
    const plant = this.plant;
    const spec = specOf(p);
    const kChanged = p.kScale !== plant.spec.kScale;
    plant.spec = spec;
    if (p.medium !== mediumBefore) {
      retargetBed(plant, materialFor(p.medium, p.kScale));
      this.resetCounters();
    } else if (kChanged) swapConductivity(plant, materialFor(p.medium, p.kScale));
    applySpec(plant);
    this.planWeekIndex = -1;
    this.refreshOperation();
    this.refreshFloor();
  }

  private refreshOperation(): void {
    const p = this.params;
    Object.assign(this.operation, {
      strategy: p.strategy,
      threshold: p.threshold,
      painted: p.painted,
      priceWeek: p.priceWeek,
      season: p.season,
      outsideShift: p.outsideShift,
      demandOn: p.demandOn,
      supplyT: p.supplyT,
      returnT: p.returnT,
      chargeOrder: p.chargeOrder,
      reserveCall: p.reserveCall,
    });
  }

  private resetCounters(): void {
    resetBalance(this.plant);
    const s = this.state;
    this.stock0 = heatAbove(this.plant, this.params.returnT);
    s.energyElectric = 0;
    s.energyHeater = 0;
    s.energyHeat = 0;
    s.energyBoiler = 0;
    s.energyWalls = 0;
    s.energyRest = 0;
    s.costElectric = 0;
    s.costBoiler = 0;
    this.refreshFloor();
  }

  private refreshFloor(): void {
    const p = this.params;
    this.state.floorT = floorTemperature(
      this.plant,
      { supplyT: p.supplyT, returnT: p.returnT, outsideT: 5 },
      p.ratedPower,
    );
  }

  // ------------------------------------------------------------------ time

  step(dtReal: number): void {
    if (!this.params.running) return;
    const dt = Math.min(Math.max(dtReal, 0), DT_MAX);
    if (dt === 0) return;
    this.advanceScript(dt);
    const clockDt = dt * this.params.timeScale;
    this.pending += clockDt;
    this.sinceRefresh += dt;
    this.stepFast(dt, clockDt);
    let n = 0;
    while (this.pending >= SLOW_STEP && n < MAX_STEPS) {
      this.stepStone(SLOW_STEP);
      this.pending -= SLOW_STEP;
      n++;
    }
    if (this.pending >= SLOW_STEP) this.pending = 0;
    if (n === 0 && this.sinceRefresh >= REFRESH && this.pending > 0) {
      this.stepStone(this.pending);
      this.pending = 0;
      n = 1;
    }
    if (n > 0) {
      this.sinceRefresh = 0;
      this.refreshState();
    } else this.refreshLive();
  }

  private clockDay(): number {
    return this.startDay + (this.startHour * 3600 + this.clock) / 86400;
  }

  /** One step of the stone, with the rule of the hour. */
  private stepStone(dt: number): void {
    const p = this.params;
    const s = this.state;
    const plant = this.plant;
    const c = this.conditions;
    const days = this.clockDay();
    const day = days % 365;
    const hour = (days - Math.floor(days)) * 24;
    const hw = hourOfWeekAt(Math.floor(days), hour);
    if (p.strategy === 'optimal') {
      const index = Math.floor((days * 24) / HOURS_PER_WEEK);
      if (index !== this.planWeekIndex) {
        this.operation.optimal = planWeek(plant, this.operation, day, hw);
        this.planWeekIndex = index;
      }
    }
    fillConditions(c, this.operation, p.ratedPower, p.chargePower, Math.floor(days), hour);
    // a tripped heater, or one left with no air and no switch, sends nothing into the stone; until the switch trips, the loop carries on
    if (s.tripped || (p.blowerFailed && !p.interlock)) c.chargeRequest = 0;
    const walls0 = wallEnergy(plant);
    stepPlant(plant, c, dt);
    this.clock += dt;
    s.simTime = this.clock;
    this.sinceScope += dt;
    // the money and the energy of this step
    const price = priceAt(p.priceWeek, hw);
    const op = plant.op;
    const mwh = (dt * op.electricity) / 3.6e9;
    s.energyElectric += dt * op.electricity;
    s.energyHeater += dt * op.charge.heater;
    s.energyHeat += dt * op.discharge.heat;
    s.energyBoiler += dt * op.boiler;
    s.energyWalls += wallEnergy(plant) - walls0;
    s.energyRest += dt * (op.auxLoss + op.charge.ductLoss + op.discharge.ductLoss);
    s.costElectric += mwh * price;
    s.costBoiler += ((dt * op.boiler) / 3.6e9) * BOILER_PRICE;
    if (this.sinceScope >= SCOPE_EVERY) {
      this.sinceScope -= SCOPE_EVERY;
      this.sample();
    }
  }

  /** The blowers run up and down on real time, the element follows its air: at high speed they are simply at their final value. */
  private stepFast(dt: number, clockDt: number): void {
    const p = this.params;
    const s = this.state;
    const op = this.plant.op;
    const rated = blowerFlow(p.chargePower, p.blowerPerMW);
    const commanded = op.charge.mdot / Math.max(rated * airRho(Math.max(op.charge.bedOut, 20)), 1e-9);
    const chargeTarget = p.blowerFailed ? 0 : Math.min(1, commanded);
    const dischargeRated = blowerFlow(p.ratedPower, p.blowerPerMW) * airRho(p.returnT + 15);
    const dischargeTarget = Math.min(1, op.discharge.mdot / Math.max(dischargeRated, 1e-9));
    const lag = 1 - Math.exp(-clockDt / BLOWER_TAU);
    s.chargeBlower += (chargeTarget - s.chargeBlower) * lag;
    s.dischargeBlower += (dischargeTarget - s.dischargeBlower) * lag;
    if (s.chargeBlower < 1e-4) s.chargeBlower = 0;
    if (s.dischargeBlower < 1e-4) s.dischargeBlower = 0;

    // the flow switch: a heater that is asked to heat needs its air
    const wanted = this.heaterAsked();
    if (p.interlock && p.blowerFailed && wanted && s.chargeBlower < FLOW_SWITCH * Math.max(this.flowClock, 0.1))
      s.tripped = true;
    if (!p.blowerFailed) {
      if (s.tripped) this.planWeekIndex = -1;
      s.tripped = false;
    }
    if (!p.blowerFailed) this.flowClock = Math.max(s.chargeBlower, 0.1);

    // the element: its heat goes to the air through a film that follows the flow, a small part by radiation when the air has stopped
    const heating = this.liveHeater();
    const C = ELEMENT_C_PER_MW * (p.chargePower / 1e6);
    const airNow = s.airHot > 0 ? s.airHot : 20;
    const G = Math.max(
      (p.chargePower / ELEMENT_RISE) * Math.pow(Math.max(s.chargeBlower, 0), 0.6),
      0.015 * (p.chargePower / ELEMENT_RISE),
    );
    const target = airNow + heating / G;
    s.elementT = target + (s.elementT - target) * Math.exp(-clockDt / (C / G));
    s.heaterGlow = Math.max(0, Math.min(1, (s.elementT - 300) / (ELEMENT_LIMIT - 300)));

    // the drawings of the fans: real blowers turn far too fast for the eye
    const turn = (v: number) => (2 * Math.PI * VISUAL_TURNS_PER_SECOND * v * dt * p.slowMo) % (2 * Math.PI);
    s.chargeBlowerAngle = (s.chargeBlowerAngle + turn(s.chargeBlower)) % (2 * Math.PI);
    s.dischargeBlowerAngle = (s.dischargeBlowerAngle + turn(s.dischargeBlower)) % (2 * Math.PI);
    s.pumpAngle =
      (s.pumpAngle + turn(Math.min(1, s.waterFlow / Math.max(p.ratedPower / (40 * 4186), 1e-9)))) % (2 * Math.PI);
  }

  private settleFast(): void {
    const s = this.state;
    const op = this.plant.op;
    const p = this.params;
    s.chargeBlower = Math.min(
      1,
      op.charge.mdot /
        Math.max(blowerFlow(p.chargePower, p.blowerPerMW) * airRho(Math.max(op.charge.bedOut, 20)), 1e-9),
    );
    s.dischargeBlower = Math.min(
      1,
      op.discharge.mdot / Math.max(blowerFlow(p.ratedPower, p.blowerPerMW) * airRho(p.returnT + 15), 1e-9),
    );
    this.flowClock = Math.max(s.chargeBlower, 0.1);
    this.stepFast(0.016, 1e7);
    this.refreshState();
  }

  /** The rule of the hour asks for the heater (whatever the flow does). */
  private heaterAsked(): boolean {
    const c = this.conditions;
    const op = this.plant.op;
    return c.chargeRequest > 0 || op.charge.heater > 0 || this.params.strategy === 'always';
  }

  /** The heater now: at low speed a trip or a failed blower shows at once, ahead of the next step of the stone. */
  private liveHeater(): number {
    const p = this.params;
    const s = this.state;
    if (s.tripped || p.reserveCall) return 0;
    // no interlock and no air: the heater keeps its power and has nowhere to send it
    if (p.blowerFailed && !p.interlock) return p.strategy === 'off' ? 0 : p.chargePower;
    return this.plant.op.charge.heater;
  }

  private advanceScript(dt: number): void {
    this.scriptTime += dt;
    this.events.forEach((e, i) => {
      if (this.fired.has(i) || this.scriptTime < e.at) return;
      this.fired.add(i);
      if (e.preset) {
        const events = this.events;
        const fired = new Set(this.fired);
        const at = this.scriptTime;
        this.load(
          { ...presetParams(e.preset), ...e.patch },
          e.start ?? 'half',
          this.startDay,
          this.startHour,
          events,
          [],
          e.patch.timeScale ?? this.params.timeScale,
        );
        this.params.preset = 'custom';
        this.fired = fired;
        this.scriptTime = at;
      } else {
        const preset = this.params.preset;
        this.set(e.patch);
        this.params.preset = preset === 'custom' ? 'custom' : this.params.preset;
      }
    });
    if (this.ramps.length) {
      this.applyRamps();
      this.plant.spec.chargeAirT = this.params.chargeAirT;
    }
  }

  private applyRamps(): void {
    for (const r of this.ramps) {
      const u = Math.max(0, Math.min(1, (this.scriptTime - r.at) / r.duration));
      (this.params as unknown as Record<string, number>)[r.key] = r.from + (r.to - r.from) * u;
    }
  }

  // ------------------------------------------------------------------ the state

  private refreshLive(): void {
    const s = this.state;
    const p = this.params;
    const op = this.plant.op;
    s.heater = this.liveHeater();
    s.chargeFlow = op.charge.mdot * (p.blowerFailed ? s.chargeBlower / Math.max(this.flowClock, 0.05) : 1);
    s.alarms = this.alarms();
  }

  private refreshState(): void {
    const s = this.state;
    const p = this.params;
    const plant = this.plant;
    const { net, grid, op, material } = plant;
    const c = this.conditions;
    const days = this.clockDay();
    s.day = days % 365;
    s.hour = (days - Math.floor(days)) * 24;
    s.winter = winterness(p.season, s.day);
    s.outsideT = c.outsideT;
    let maxT = -1e9;
    let minT = 1e9;
    for (let j = 0; j < GRID_LAYERS; j++) {
      for (let i = 0; i < GRID_RINGS; i++) {
        const T = net.T[grid.id(i, j)]!;
        s.bedT[i + GRID_RINGS * j] = T;
        if (T > maxT) maxT = T;
        if (T < minT) minT = T;
      }
    }
    s.maxT = maxT;
    s.minT = minT;
    s.meanT = plant.meanT;
    s.coreT = net.T[grid.id(0, GRID_LAYERS >> 1)]!;
    const wall = wallState(plant, c.outsideT);
    s.edgeT = wall.edge;
    s.shellT = wall.shell;
    s.surfaceT = wall.surface;
    const m = plant.mass;
    const hRet = material.h(p.returnT);
    s.chargeLevel = Math.max(0, (material.h(plant.meanT) - hRet) / (material.h(p.fullMeanT) - hRet));
    s.usableNow = Math.max(0, m * (material.h(plant.meanT) - material.h(s.floorT)));
    s.heatAbove = heatAbove(plant, 10);
    const chargeBit = op.charge.mask;
    const dischargeBit = op.discharge.mask;
    s.zones.forEach((z, i) => {
      const bit = i === 0 ? ZONE_CORE : i === 1 ? ZONE_MIDDLE : ZONE_OUTER;
      z.meanT = plant.zoneT[i]!;
      z.mode =
        chargeBit & bit && op.charge.heater > 0
          ? 'charge'
          : dischargeBit & bit && op.discharge.heat > 0
            ? 'discharge'
            : 'idle';
      z.chargeDamper = z.mode === 'charge' ? 1 : 0;
      z.dischargeDamper = z.mode === 'discharge' ? 1 : 0;
    });
    s.pitch = plant.spec.pitch;
    s.pipeRadius = plant.spec.pipeRadius;
    s.heater = this.liveHeater();
    s.heatOut = op.discharge.heat;
    s.demand = c.demand;
    s.boiler = op.boiler;
    s.wallLoss = op.wallLoss;
    s.ductLoss = op.charge.ductLoss + op.discharge.ductLoss;
    s.electricity = op.electricity;
    s.blowerElectric = op.charge.fanElectric + op.discharge.fanElectric;
    s.chargeFlow = op.charge.mdot;
    s.dischargeFlow = op.discharge.mdot;
    s.airHot = op.charge.heater > 0 ? op.charge.airHot : 0;
    s.chargeReturnT = op.charge.heater > 0 ? op.charge.bedOut : 0;
    s.exchangerAirIn = op.discharge.heat > 0 ? op.discharge.airHot : 0;
    s.exchangerAirOut = op.discharge.heat > 0 ? op.discharge.airCold : 0;
    s.waterFlow = op.discharge.water;
    s.supplyT = c.supplyT;
    s.returnT = c.returnT;
    s.chargeDp = op.charge.dp;
    s.dischargeDp = op.discharge.dp;
    s.price = priceAt(p.priceWeek, hourOfWeekAt(Math.floor(days), s.hour));
    const heatAll = s.energyHeat + s.energyBoiler;
    s.costOfHeat = heatAll > 0 ? (s.costElectric + s.costBoiler) / (heatAll / 3.6e9) : 0;
    const stock = heatAbove(plant, p.returnT) - this.stock0;
    const paid = s.energyElectric - stock;
    s.efficiency = paid > 1 ? Math.max(0, Math.min(1, s.energyHeat / paid)) : 0;
    s.alarms = this.alarms();
  }

  private alarms(): SandState['alarms'] {
    const s = this.state;
    const p = this.params;
    const a: SandState['alarms'] = [];
    if (p.blowerFailed && (s.tripped || this.heaterAsked())) a.push('noFlow');
    if (s.elementT > ELEMENT_LIMIT) a.push('elementHot');
    if (s.airHot > LIMITS.air) a.push('airHot');
    if (s.maxT > p.coreLimit + 2) a.push('coreHot');
    if (s.shellT > LIMITS.wall) a.push('wallHot');
    if (s.surfaceT > LIMITS.surface) a.push('surfaceWarm');
    if (s.boiler > 0.02 * Math.max(s.demand, 1) && s.demand > 0) a.push('lowCharge');
    if (p.supplyT - p.returnT < LIMITS.waterSpan) a.push('returnWarm');
    if (p.medium === 'sand' && s.maxT > LIMITS.quartzInversion) a.push('quartzInversion');
    return a;
  }

  private sample(): void {
    const sc = this.scope;
    const s = this.state;
    this.refreshState();
    sc.t.push(this.clock / 3600);
    sc.meanT.push(s.meanT);
    sc.coreT.push(s.coreT);
    sc.edgeT.push(s.edgeT);
    sc.heater.push(s.heater);
    sc.heatOut.push(s.heatOut);
    sc.boiler.push(s.boiler);
    sc.wallLoss.push(s.wallLoss);
    sc.price.push(s.price);
    sc.level.push(s.chargeLevel);
    if (sc.t.length > SCOPE_LENGTH) for (const k of Object.keys(sc) as (keyof Scope)[]) sc[k].shift();
  }

  // ------------------------------------------------------------------ what the panel asks for (cached: a few to a few hundred ms)

  private cached<T>(key: string, make: () => T): T {
    if (this.cache.has(key)) return this.cache.get(key) as T;
    const v = make();
    if (this.cache.size > 200) this.cache.clear();
    this.cache.set(key, v);
    return v;
  }

  /** The machine as it is set now. */
  get spec(): SiloSpec {
    return specOf(this.params);
  }

  /** Mass of the bed, kg. */
  get mass(): number {
    return totalMass(this.plant);
  }

  /** What a full discharge at rated power gives, on this machine. */
  getCapacity(): CapacityResult {
    const spec = this.spec;
    return this.cached(`capacity|${JSON.stringify(spec)}`, () =>
      capacityRun(spec, spec.ratedPower, 3, capacityStep(spec)),
    );
  }

  /** A point of the usable heat against the power asked: `index` in `CURVE_SHARES`. */
  getCapacityPoint(index: number): CapacityPoint {
    const spec = this.spec;
    const power = CURVE_SHARES[index]! * spec.ratedPower;
    return this.cached(`curve|${power}|${JSON.stringify(spec)}`, () => capacityPoint(spec, power));
  }

  /** Usable heat against the power asked. */
  getCapacityCurve(): CapacityPoint[] {
    return CURVE_SHARES.map((_, i) => this.getCapacityPoint(i));
  }

  /** The same charge with the core first and evenly. */
  getChargeOrder(): ReturnType<typeof chargeOrderCompare> {
    const spec = this.spec;
    return this.cached(`order|${JSON.stringify(spec)}`, () => chargeOrderCompare(spec));
  }

  /** A row of the table of sizes, at its own default settings. */
  getScaleRow(index: number): ScaleRow {
    const id = SCALE_SILOS[index]!;
    return this.cached(`scale|${id}`, () => scaleRow(id, siloSpec(id)));
  }

  /** The four sizes on one table. */
  getScale(): ScaleRow[] {
    return SCALE_SILOS.map((_, i) => this.getScaleRow(i));
  }

  /** A year of this machine under the rule set now. */
  getYear(): YearResult {
    const spec = this.spec;
    const op = this.operationCopy();
    const key = JSON.stringify({ ...op, optimal: null, painted: op.strategy === 'painted' ? op.painted : null });
    return this.cached(`year|${JSON.stringify(spec)}|${key}`, () => yearRun(spec, op, 6 * 3600, undefined, 90));
  }

  private operationCopy(): Operation {
    return { ...this.operation, optimal: [...this.operation.optimal] };
  }

  /** The start of the game's week: the plant in mid-swing, the coldest demand. */
  private gameField(): Float64Array {
    const spec = this.spec;
    return this.cached(`gameField|${JSON.stringify(spec)}`, () => startField(spec, 'half'));
  }

  /** The opponent of the game on the current machine and prices. */
  getGamePlan(): GamePlan {
    const spec = this.spec;
    const op = this.gameOperation();
    return this.cached(`game|${JSON.stringify(spec)}|${op.priceWeek}`, () => gamePlan(spec, op, this.gameField()));
  }

  /** The week the visitor painted, through the full model. */
  getPaintedWeek(): WeekResult {
    const spec = this.spec;
    const op = this.gameOperation();
    const painted = this.params.painted;
    return this.cached(
      `painted|${JSON.stringify(spec)}|${op.priceWeek}|${painted.map((b) => (b ? 1 : 0)).join('')}`,
      () => weekRun(spec, { ...op, strategy: 'painted', painted }, this.gameField()),
    );
  }

  private gameOperation(): Operation {
    return { ...this.operationCopy(), season: 'winter', strategy: 'optimal', demandOn: true, reserveCall: false };
  }

  /** The temperature around one pipe of a cell, for the magnified world: ρ from the pipe wall to the edge of its cell, °C. */
  getPipeProfile(ring: number, layer: number, points = 16): { rho: number[]; T: number[]; wallT: number } {
    const plant = this.plant;
    const spec = plant.spec;
    const R = pitchRadius(spec.pitch);
    const r0 = spec.pipeRadius;
    const id = plant.grid.id(ring, layer);
    const mean = plant.net.T[id]!;
    const legs = plant.ringLegs[ring]! * (spec.bedHeight / GRID_LAYERS);
    const cellHeat = plant.net.Q[id]!;
    const g = plant.gStone[id]!;
    const wallT = mean + (legs > 0 && g > 0 ? cellHeat / (g * legs) : 0);
    const rho: number[] = [];
    const T: number[] = [];
    for (let i = 0; i < points; i++) {
      const r = r0 + ((R - r0) * i) / (points - 1);
      rho.push(r);
      T.push(wallT + (mean - wallT) * pipeCellShape(r, R, r0));
    }
    return { rho, T, wallT };
  }
}
