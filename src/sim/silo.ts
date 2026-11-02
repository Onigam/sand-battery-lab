import { cableResistance } from '@onigam/lab-kit/sim/electric';
import {
  airRho,
  crushedSoapstone,
  makeMaterial,
  piecewise,
  pipeCellFactor,
  pitchRadius,
  QUARTZ_SAND_C,
  quartzSand,
  type Material,
} from './thermal';

// The machines of the lab and every constant of the plant, one file, each with its tag:
//   REPORTED (a source of docs/research.md), DERIVED (computed from reported figures), ESTIMATE (the sources are silent: a choice,
//   with its reason, listed again in docs/physics.md).
// `PORNAINEN` is the one source of the plant's dimensions: `src/three/dims.ts` imports them from here, as Mill Lab's dims import from its simulation.

export const PORNAINEN = {
  /** REPORTED, about: outside of the silo, m. */
  outerDiameter: 15,
  totalHeight: 13,
  /** REPORTED, about, from the maker's own model: the stone bed, m. */
  bedDiameter: 14,
  bedHeight: 6,
  /** REPORTED, about: crushed soapstone, kg, and the trucks that brought it. */
  mass: 2_000_000,
  trucks: 40,
  /** REPORTED, rated heat power, W, and capacity, J. */
  ratedPower: 1_000_000,
  ratedCapacity: 100 * 3.6e9,
  /** REPORTED, average temperature at full charge, °C (the maker's lead scientist; another page calls 400 °C the maximum). */
  fullMeanT: 400,
  /** DERIVED: (15 − 14) / 2, the ceiling on steel, insulation and cladding at the wall, m. */
  wallBuildUp: 0.5,
  /** ESTIMATE, sums to 13 m: the split of the height. */
  stack: { foundationAndBase: 1.0, bed: 6.0, topInsulation: 1.0, equipmentFloor: 3.5, roof: 1.5 },
  /** ESTIMATE, sized by the physics (docs/physics.md): outer radius and wall of a pipe, m; a square pitch, m. */
  pipeOuterRadius: 0.05,
  pipeWall: 0.003,
  pitch: 0.5,
  /** ESTIMATE: wall insulation, m. REPORTED only as a ceiling (wallBuildUp); the rest is steel and cladding. */
  wallInsulation: 0.45,
} as const;

/** ESTIMATE, from the maker's three-zone principle: outer radius of the core and middle zones, as a share of the bed radius. */
export const ZONE_EDGES = [0.6, 0.8, 1] as const;

export type MediumId = 'soapstone' | 'sand';
export type ZoneId = 'core' | 'middle' | 'outer';
export const ZONE_IDS: readonly ZoneId[] = ['core', 'middle', 'outer'];

/** Grid of the bed: cheap enough for a phone, fine enough for the section (docs/physics.md checks the convergence). */
export const GRID_RINGS = 10;
export const GRID_LAYERS = 6;

/** REPORTED: bulk density of the fill, kg/m³: soapstone DERIVED from the mass and the bed (2,000 t / 924 m³), sand measured. */
export const RHO_BULK: Record<MediumId, number> = {
  soapstone: PORNAINEN.mass / (Math.PI * (PORNAINEN.bedDiameter / 2) ** 2 * PORNAINEN.bedHeight),
  sand: 1425,
};

/**
 * The medium as a material; `kScale` multiplies its conductivity (an estimate for soapstone, measured for one sand). `soapstoneC` replaces the
 * constant c of soapstone, for the sensitivity table only: its real curve is unknown.
 */
export function materialFor(medium: MediumId, kScale = 1, soapstoneC?: SoapstoneC): Material {
  if (medium === 'sand') return quartzSand(RHO_BULK.sand, kScale);
  if (!soapstoneC) return crushedSoapstone(RHO_BULK.soapstone, 0.7 * kScale);
  if (soapstoneC.constant) return crushedSoapstone(RHO_BULK.soapstone, 0.7 * kScale, soapstoneC.constant);
  // the shape of measured sand, scaled to the same mean over 100 to 500 °C (999 J/kg·K for sand, 1,000 for soapstone)
  const shape = piecewise(QUARTZ_SAND_C);
  return makeMaterial({
    name: 'soapstone-curved',
    rho: RHO_BULK.soapstone,
    c: (T) => (shape(T) * 1000) / 999,
    k: () => 0.7 * kScale,
  });
}

export interface SoapstoneC {
  /** A constant c, J/kg·K, or, when absent, the shape of the measured sand. */
  constant?: number;
}

// ------------------------------------------------------------------------------------------------ plant constants

/** ESTIMATE, usual value: conductivity of stainless steel, W/m·K. */
export const STEEL_K = 17;
/** ESTIMATE, usual value: film on the outside of the cladding, wind included, W/m²·K. */
export const FILM_OUT = 10;
/** ESTIMATE: mean conductivity of the insulation at its mean temperature, W/m·K (the patent asks below 0.3). */
export const LAMBDA_INSULATION = 0.1;
/** ESTIMATE, from the height stack: top and base insulation as multiples of the wall's, so that "half the insulation" halves all three. */
export const TOP_OVER_WALL = PORNAINEN.stack.topInsulation / PORNAINEN.wallInsulation;
export const BASE_OVER_WALL = 0.5 / PORNAINEN.wallInsulation;
/** ESTIMATE: ground under the base insulation, °C. */
export const GROUND_T = 8;
/** ESTIMATE: the air around the plant equipment above outside air, K. */
export const ROOM_OVER_OUTSIDE = 15;

/** DERIVED (research): volume flow of a blower, m³/s per MW of its loop: 1 MW at 300 K of air, 4.7 m³/s at 250 °C, rounded. */
export const BLOWER_PER_MW = 5;
/** ESTIMATE, the top of the research's 3 to 5 kPa: what a blower can push, Pa. */
export const BLOWER_DP_MAX = 5000;
/** ESTIMATE, usual: fan and motor efficiencies. The fan's losses heat the air, the motor's heat the room. */
export const ETA_FAN = 0.7;
export const ETA_MOTOR = 0.93;
/** ESTIMATE: air speed in the main ducts at full flow, m/s; and the velocity heads of the loop out of the pipes (exchanger, dampers, bends). */
export const DUCT_VELOCITY = 15;
export const LOOP_HEADS = 20;
/** ESTIMATE: U-bend, velocity heads per leg pair. */
export const BEND_HEADS = 0.75;
/** ESTIMATE: at most this many legs of pipe in series on one air path (at Pornainen's pitch the 15 m/s rule gives 9). */
export const LEGS_PER_PATH_MAX = 10;
/** ESTIMATE: conductance of the insulated ducts of a loop at 1 MW, W/K: about 15 m of duct at about 1 W/m·K. */
export const DUCT_UA_AT_MW = 15;
/** ESTIMATE: the exchanger is designed for its rated power at 60 °C of air out, 15 K above the return water. */
export const EXCHANGER_PINCH = 15;
export const DESIGN_SUPPLY = 85;
export const DESIGN_RETURN = 45;
/** ESTIMATE, usual exponent of an air-side film: UA follows the air flow. */
export const EXCHANGER_FLOW_EXP = 0.6;
/** ESTIMATE: water side of the pump, Pa and efficiency. */
export const PUMP_DP = 150_000;
export const PUMP_ETA = 0.6;
/** ESTIMATE: controls and ventilation of the equipment floor, W per MW rated. */
export const AUX_PER_MW = 2000;
/** ESTIMATE, usual: transformer efficiency at load. */
export const ETA_TRANSFORMER = 0.99;
/** ESTIMATE: low-voltage side. The voltage is an assumption of the research; the riser and its section are a usual size for the current. */
export const LV_VOLTS = 400;
export const RISER_LENGTH = 15;
export const RISER_SECTION_MM2 = 960;
/** ESTIMATE: the air heater's mass, J/K per MW; element to air at the design flow, K at 1 MW; a limit of the element, °C. */
export const ELEMENT_C_PER_MW = 1000 * 500;
export const ELEMENT_RISE = 100;
export const ELEMENT_LIMIT = 800;
/** ESTIMATE: the pressure switch trips the heater under this share of the flow the heater needs. */
export const FLOW_SWITCH = 0.3;
/** ESTIMATE: how fast a blower runs down or up, s. */
export const BLOWER_TAU = 12;

/** Alarm limits: REPORTED where noted, else ESTIMATE. */
export const LIMITS = {
  /** °C, the air, the top of what the maker quotes for its product. */
  air: 600,
  /** °C, the inner shell: about where a plain structural steel starts to lose strength. */
  wall: 450,
  /** °C, the outside of the cladding: a choice for "warm to the touch", not a burn threshold (the standard's tables were not read). */
  surface: 45,
  /** K, supply minus return below which the exchanger has little left to do. */
  waterSpan: 15,
  /** REPORTED, °C: the inversion of quartz. */
  quartzInversion: 573,
} as const;

// ------------------------------------------------------------------------------------------------ a machine

export interface SiloSpec {
  medium: MediumId;
  /** m. */
  bedRadius: number;
  bedHeight: number;
  /** W. */
  ratedPower: number;
  chargePower: number;
  /** °C. */
  fullMeanT: number;
  coreLimit: number;
  chargeAirT: number;
  /** Wall insulation, m, and its conductivity, W/m·K. */
  insulation: number;
  lambda: number;
  /** Pipes: a square pitch, an outer radius, m. */
  pitch: number;
  pipeRadius: number;
  /** Multiplies the conductivity of the bed. */
  kScale: number;
  /** m³/s per MW of each loop. */
  blowerPerMW: number;
  /** Sensitivity table only: another c for soapstone. */
  soapstoneC?: SoapstoneC;
}

export const legsOf = (spec: SiloSpec): number => (Math.PI * spec.bedRadius ** 2) / spec.pitch ** 2;

/** Mass of the bed for its volume and its medium, kg. */
export const bedMass = (spec: Pick<SiloSpec, 'medium' | 'bedRadius' | 'bedHeight'>): number =>
  RHO_BULK[spec.medium] * Math.PI * spec.bedRadius ** 2 * spec.bedHeight;

/** The drop between a pipe wall and the stone's mean temperature when the pipes carry the rated power, K (the stone alone, no air film). */
export function stoneDrop(power: number, k: number, pitch: number, r: number, area: number, height: number): number {
  const length = (area / (pitch * pitch)) * height;
  return (power * pipeCellFactor(pitchRadius(pitch), r)) / (2 * Math.PI * k * length);
}

/**
 * The pitch that gives a stone drop, by bisection: how the pipes of the other silos are sized, none has a published layout. Pornainen's
 * pitch comes from the research's sizing, the others get the same drop at their own power (ESTIMATE, the same rule for all).
 */
export function pitchForDrop(drop: number, power: number, k: number, r: number, area: number, height: number): number {
  let lo = r * 2.5;
  let hi = 3;
  for (let i = 0; i < 40; i++) {
    const mid = 0.5 * (lo + hi);
    if (stoneDrop(power, k, mid, r, area, height) > drop) hi = mid;
    else lo = mid;
  }
  return 0.5 * (lo + hi);
}

/** Conductivity at a mid-swing temperature (300 °C), the figure the sizing and the panel use, W/m·K. */
export const kAtMidSwing = (spec: Pick<SiloSpec, 'medium' | 'kScale'>): number =>
  materialFor(spec.medium, spec.kScale).k(300);

const PORNAINEN_DROP = stoneDrop(
  PORNAINEN.ratedPower,
  0.7,
  PORNAINEN.pitch,
  PORNAINEN.pipeOuterRadius,
  Math.PI * (PORNAINEN.bedDiameter / 2) ** 2,
  PORNAINEN.bedHeight,
);

export type SiloId = 'pornainen' | 'kankaanpaa' | 'vaaksy' | 'two-drums';

const sized = (spec: Omit<SiloSpec, 'pitch'>): SiloSpec => ({
  ...spec,
  pitch: pitchForDrop(
    PORNAINEN_DROP,
    spec.ratedPower,
    kAtMidSwing(spec),
    spec.pipeRadius,
    Math.PI * spec.bedRadius ** 2,
    spec.bedHeight,
  ),
});

/** The machine each starting point runs. */
export function siloSpec(id: SiloId, medium?: MediumId): SiloSpec {
  switch (id) {
    case 'pornainen':
      return {
        medium: medium ?? 'soapstone',
        bedRadius: PORNAINEN.bedDiameter / 2,
        bedHeight: PORNAINEN.bedHeight,
        ratedPower: PORNAINEN.ratedPower,
        // ESTIMATE: the charging power of the real plant is not published; one secondary source says about 100 hours
        chargePower: PORNAINEN.ratedPower,
        fullMeanT: PORNAINEN.fullMeanT,
        // REPORTED: 600 °C is the limit the maker quotes for the core; 500 °C of air is REPORTED by a documentary, to be checked
        coreLimit: 600,
        chargeAirT: 500,
        insulation: PORNAINEN.wallInsulation,
        lambda: LAMBDA_INSULATION,
        pitch: PORNAINEN.pitch,
        pipeRadius: PORNAINEN.pipeOuterRadius,
        kScale: 1,
        blowerPerMW: BLOWER_PER_MW,
      };
    case 'kankaanpaa':
      // REPORTED: 200 kW (the maker; the operator and the 2022 press say 100), 80 m³ of sand in a tank of 4 m, core about 500 °C. ESTIMATE: 0.3 m of insulation
      return sized({
        medium: medium ?? 'sand',
        bedRadius: 2,
        bedHeight: 80 / (Math.PI * 4),
        ratedPower: 200_000,
        chargePower: 200_000,
        fullMeanT: 340,
        coreLimit: 500,
        chargeAirT: 550,
        insulation: 0.3,
        lambda: LAMBDA_INSULATION,
        pipeRadius: PORNAINEN.pipeOuterRadius,
        kScale: 1,
        blowerPerMW: BLOWER_PER_MW,
      });
    case 'vaaksy':
      // REPORTED: 2 MW, about 2,400 t of sand, silo 15 m wide and 14 m high, above 500 °C. 3 MW of charge: the maker's 2 MW product, very probably this one.
      // DERIVED: the bed height from the mass and the 14 m of bed inside a 15 m wall. ESTIMATE: 650 °C of air, the top of the maker's published section.
      return sized({
        medium: medium ?? 'sand',
        bedRadius: 7,
        bedHeight: 2_400_000 / (RHO_BULK.sand * Math.PI * 49),
        ratedPower: 2_000_000,
        chargePower: 3_000_000,
        fullMeanT: 500,
        coreLimit: 600,
        chargeAirT: 650,
        insulation: PORNAINEN.wallInsulation,
        lambda: LAMBDA_INSULATION,
        pipeRadius: PORNAINEN.pipeOuterRadius,
        kScale: 1,
        blowerPerMW: BLOWER_PER_MW,
      });
    case 'two-drums':
      // DERIVED: two 200 L drums of sand as one cylinder with the same volume and the same surface per volume (0.46 × 2.41 m).
      // ESTIMATE: a 5 kW house, 10 cm of insulation, a 30 mm pipe, air at 400 °C, a full mean of 310 °C (a 300 K swing). Not a design.
      return sized({
        medium: medium ?? 'sand',
        bedRadius: 0.23,
        bedHeight: 2.41,
        ratedPower: 5_000,
        chargePower: 5_000,
        fullMeanT: 310,
        coreLimit: 500,
        chargeAirT: 400,
        insulation: 0.1,
        lambda: LAMBDA_INSULATION,
        pipeRadius: 0.015,
        kScale: 1,
        blowerPerMW: BLOWER_PER_MW,
      });
  }
}

// ------------------------------------------------------------------------------------------------ what the sizing gives

/** Volume flow of a blower, m³/s. */
export const blowerFlow = (power: number, perMW: number): number => (power / 1e6) * perMW;

/** The air flow the exchanger is designed around, kg/s: the blower at the cold side of the design. */
export function designAirFlow(power: number, perMW: number): number {
  return blowerFlow(power, perMW) * airRho(DESIGN_RETURN + EXCHANGER_PINCH);
}

/** The exchanger sized for its power: UA from the log-mean difference at the design temperatures, W/K. */
export function designExchangerUA(power: number): number {
  const mdot = designAirFlow(power, BLOWER_PER_MW);
  const cold = DESIGN_RETURN + EXCHANGER_PINCH;
  const hot = cold + power / (mdot * 1010);
  const d1 = hot - DESIGN_SUPPLY;
  const d2 = cold - DESIGN_RETURN;
  const lmtd = (d1 - d2) / Math.log(d1 / d2);
  return power / lmtd;
}

/** Current on the low-voltage side at a power, A. */
export const lineCurrent = (power: number, volts = LV_VOLTS): number => power / (Math.sqrt(3) * volts);

/** Losses of the riser at a power, W: three phases, each with half of the kit's loop resistance. */
export function riserLoss(power: number): number {
  const I = lineCurrent(power);
  // the section follows the current, so a small plant has the same current density in its cable
  const section = RISER_SECTION_MM2 * Math.max(power / PORNAINEN.ratedPower, 1e-3);
  return 3 * I * I * (cableResistance(RISER_LENGTH, section) / 2);
}
