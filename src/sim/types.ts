import type { Strategy } from './operate';
import type { ChargeOrder } from './plant';
import type { MediumId, SiloId, ZoneId } from './silo';
import type { PriceWeekId, Season } from './week';

// The shared types of the simulation. The engine writes `SandState` every frame; the 3D worlds, the strip and the panel only read it.
// SI everywhere (m, W, J, kg/s), temperatures in °C.

export type PresetId = 'pornainen-soapstone' | 'same-silo-sand' | 'kankaanpaa' | 'vaaksy' | 'two-drums';

export type ScenarioId =
  | 'cold-start'
  | 'winter-week'
  | 'summer-month'
  | 'windless-days'
  | 'negative-weekend'
  | 'idle-three-months'
  | 'core-first'
  | 'half-insulation'
  | 'scale'
  | 'soapstone-vs-sand'
  | 'blower-failure'
  | 'reserve-call';

export type AlarmKey =
  | 'noFlow'
  | 'elementHot'
  | 'airHot'
  | 'coreHot'
  | 'wallHot'
  | 'surfaceWarm'
  | 'lowCharge'
  | 'returnWarm'
  | 'quartzInversion';

/** Everything the visitor can edit live (all through `SandSim.set`). Ranges are in presets.ts. */
export interface SandParams {
  // ---- the kit's time controls
  slowMo: number;
  /** Simulated seconds per real second. */
  timeScale: number;
  running: boolean;
  /** Where the values come from; 'custom' as soon as the visitor edits something physical. */
  preset: PresetId | 'custom';

  // ---- the machine (a new geometry rebuilds the bed)
  silo: SiloId;
  medium: MediumId;
  /** Heat output, W. */
  ratedPower: number;
  /** Heater, W. */
  chargePower: number;
  /** Mean temperature at full charge, °C. */
  fullMeanT: number;
  /** A zone closes at this temperature, °C. */
  coreLimit: number;
  /** Air leaving the heater, °C. */
  chargeAirT: number;
  /** Wall insulation, m; its conductivity, W/m·K. */
  insulation: number;
  lambda: number;
  /** Square pitch of the pipes, m. */
  pitch: number;
  /** Multiplies the conductivity of the bed. */
  kScale: number;
  /** Blower size, m³/s per MW of its loop. */
  blowerPerMW: number;

  // ---- what it serves
  supplyT: number;
  returnT: number;
  season: Season;
  /** Added to the outside air, K. */
  outsideShift: number;
  demandOn: boolean;

  // ---- how it is run
  strategy: Strategy;
  threshold: number;
  priceWeek: PriceWeekId;
  chargeOrder: ChargeOrder;
  /** What the visitor painted, by hour of the week. */
  painted: boolean[];

  // ---- what can go wrong
  blowerFailed: boolean;
  /** The flow switch that trips the heater; off only to see why it is there. */
  interlock: boolean;
  /** The grid has called on the reserve: the heater sheds at once. */
  reserveCall: boolean;
}

export type ZoneMode = 'idle' | 'charge' | 'discharge';

export interface ZoneState {
  id: ZoneId;
  mode: ZoneMode;
  /** Mean temperature of the zone, °C. */
  meanT: number;
  /** Outer radius, m. */
  rOuter: number;
  /** Damper of each loop, 0 to 1. */
  chargeDamper: number;
  dischargeDamper: number;
}

/** The state handed to the 3D scene, the strip and the panel every frame (read only). */
export interface SandState {
  // ---- clock
  simTime: number;
  /** Day of the year (0 = 1 January) and hour of the day. */
  day: number;
  hour: number;
  /** 0 on the warmest day to 1 on the coldest: for the snow of the site. */
  winter: number;
  outsideT: number;

  // ---- the bed: `bedT[ring + rings * layer]`, layer 0 at the bottom, ring 0 on the axis. Updated in place.
  bedT: Float64Array;
  rings: number;
  layers: number;
  bedRadius: number;
  bedHeight: number;
  /** The bed is on the silo the 3D draws (the two soapstone and sand presets); the others run in the charts only. */
  onDrawnSilo: boolean;
  zones: ZoneState[];
  /** Pipes, for the magnified world. */
  pitch: number;
  pipeRadius: number;

  // ---- the temperatures that matter, °C
  meanT: number;
  /** On the axis at mid-height; the zones have their own means. */
  coreT: number;
  /** The outer ring, averaged over the height. */
  edgeT: number;
  /** The hottest and the coldest cell. */
  maxT: number;
  minT: number;
  /** The inner shell and the outside of the cladding, at their hottest. */
  shellT: number;
  surfaceT: number;

  // ---- how much
  /** Share of the heat above the return water, at full = 1. */
  chargeLevel: number;
  /** Mean temperature under which the rated power cannot be held (for an even bed), °C. */
  floorT: number;
  /** Heat above that floor now, J (0 when under it): what can still come out at full power. */
  usableNow: number;
  /** Heat above ambient, J. */
  heatAbove: number;

  // ---- powers, W
  heater: number;
  heatOut: number;
  demand: number;
  boiler: number;
  wallLoss: number;
  ductLoss: number;
  /** All the electricity at the meter. */
  electricity: number;
  blowerElectric: number;

  // ---- the air and the water
  chargeFlow: number;
  dischargeFlow: number;
  /** Air leaving the heater, air leaving the bed on charge, air at the exchanger in and out, °C. */
  airHot: number;
  chargeReturnT: number;
  exchangerAirIn: number;
  exchangerAirOut: number;
  /** Network water, kg/s. */
  waterFlow: number;
  supplyT: number;
  returnT: number;
  /** Pressure at each blower, Pa. */
  chargeDp: number;
  dischargeDp: number;

  // ---- the 3D's moving parts
  /** Blower speed, 0 to 1 of full, with its run-up and run-down. */
  chargeBlower: number;
  dischargeBlower: number;
  /** Visual angles, rad in 0..2π, speed capped so that the eye reads the direction, scaled by the slow motion. */
  chargeBlowerAngle: number;
  dischargeBlowerAngle: number;
  pumpAngle: number;
  /** The same as `dischargeBlowerAngle`: what the template's placeholder scene turns, until the 3D role replaces it. */
  angle: number;
  /** Resistor element, °C, and a false-colour glow from 0 to 1. Real elements at this temperature barely show. */
  elementT: number;
  heaterGlow: number;
  /** The flow switch has tripped the heater. */
  tripped: boolean;

  // ---- money and energy since the last start: J and €
  price: number;
  energyElectric: number;
  energyHeater: number;
  energyHeat: number;
  energyBoiler: number;
  energyWalls: number;
  energyRest: number;
  costElectric: number;
  costBoiler: number;
  /** € per MWh of heat, from the boiler or the silo. */
  costOfHeat: number;
  /** Heat out over electricity in so far (stock change counted). */
  efficiency: number;

  alarms: AlarmKey[];
}

/** The last weeks of the live quantities, one sample per simulated hour (for the time charts). */
export interface Scope {
  t: number[];
  meanT: number[];
  coreT: number[];
  edgeT: number[];
  heater: number[];
  heatOut: number[];
  boiler: number[];
  wallLoss: number[];
  price: number[];
  level: number[];
}
