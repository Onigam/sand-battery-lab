// The figures that the texts of src/data write by {placeholder}, so that the French and the English spellings of a number (7,5 / 7.5) can never drift
// apart, and so that one test (data.test.ts) can check every model result against the simulation.
//
// A figure a SOURCE reports (1 MW, 100 MWh, 2,000 t, 400 °C…) is written in the text itself and checked against the allow-list of data.test.ts, with its
// source. A figure that is DERIVED, a MODEL RESULT, an ASSUMPTION or an ESTIMATE lives here, and a text that uses one says so in the same text (`lf` in
// part-helpers.ts refuses it otherwise).
//
//   MODEL     an output of src/sim for the default machine, rounded as the texts print it; data.test.ts recomputes each from the simulation or holds it to
//             the table of docs/physics.md. Never tuned to a reported figure: 69 MWh is not 100 MWh, and the texts say why.
//   DERIVED   computed from reported figures, with the computation next to it.
//   ASSUMED   a choice the lab makes where the sources are silent and the model needs a value.
//   ESTIMATE  a size or an order of magnitude no source gives. Lengths come from PORNAINEN in src/sim/silo.ts, which src/three/dims.ts imports: never retyped.
import { cableResistance } from '@onigam/lab-kit/sim/electric';
import {
  AUX_PER_MW,
  BLOWER_DP_MAX,
  BLOWER_PER_MW,
  BLOWER_TAU,
  DESIGN_RETURN,
  DESIGN_SUPPLY,
  DUCT_UA_AT_MW,
  DUCT_VELOCITY,
  ELEMENT_LIMIT,
  ELEMENT_RISE,
  ETA_TRANSFORMER,
  EXCHANGER_PINCH,
  FLOW_SWITCH,
  GROUND_T,
  LAMBDA_INSULATION,
  LIMITS,
  LV_VOLTS,
  PORNAINEN,
  PUMP_DP,
  RHO_BULK,
  RISER_LENGTH,
  RISER_SECTION_MM2,
  ZONE_EDGES,
} from '../sim/silo';
import { MAIN_DUCT_INNER_R, PIPE_GROWTH, PLANT, SILO, SITE, WALL } from '../three/dims';

const AMBIENT = 10; // °C, the reference of « heat above ambient » (docs/research.md K32)
const BED_AREA = Math.PI * (PORNAINEN.bedDiameter / 2) ** 2;
const BED_VOLUME = BED_AREA * PORNAINEN.bedHeight;
const LINE_AMPS = PORNAINEN.ratedPower / (Math.sqrt(3) * LV_VOLTS);
const ALPHA_STEEL = 17e-6; // 1/K, a usual value for stainless steel (docs/research.md K41)

/** What the model finds, with the table of docs/physics.md it comes from. data.test.ts holds each one to src/sim. */
export const MODEL = {
  // §5.1: the 217 MWh of a full charge
  usable: 69, // MWh at the rated 1 MW
  tail: 105, // MWh afterwards, at falling power
  stays: 43, // MWh that stay in the stone
  shareUsable: 32, // %
  shareTail: 48, // %
  shareStays: 20, // %
  shareAll: 80, // % if the power may fall to nothing
  floor: 275, // °C: mean of the stone under which 1 MW cannot be held
  usable800: 93, // MWh at 800 kW
  powerFor46: 750, // kW: where the model gives 46 % of the heat, the quoted capacity's share
  share800: 43, // %
  usableWinter: 122, // MWh at the winter demand
  shareWinter: 56, // %
  daysWinter: 8.5, // days of the winter demand from full
  usableSummer: 160, // MWh at the summer demand
  shareSummer: 74, // %
  daysSummer: 48, // days of the summer demand from full
  rangeLow: 46, // MWh at 1 MW, the lowest across the estimates of §6
  rangeHigh: 132, // MWh at 1 MW, the highest across the estimates of §6
  blowerFor100: 8.5, // m³/s per MW: the blower that would print 100 MWh, shown and never set
  blowerTimes: 1.7, // times the estimate
  // §5.2: the 250 MWh silo
  usableV: 160, // MWh at its 2 MW, on the same rule
  ratioV: 2.3, // times the 69 MWh
  factorMass: 1.2,
  factorTop: 1.8,
  factorC: 1.07,
  // §5.3, §5.4: efficiency and walls
  etaYear: 91, // % over a year under a 40 €/MWh rule, read as a ceiling
  etaCycle: 84, // % one rated cycle, a day of rest each way
  etaWeek: 74, // % the same, a week of rest
  wallsYear: 4.6, // % of the electricity over a year
  circYear: 4.3, // % of the electricity over a year
  wallsCycle: 11.5, // % on a rated cycle
  lossFull: 38, // kW through the walls, full
  lossYear: 15, // kW through the walls, mean over a year
  halfHeat: 190, // days, half-life of the heat above ambient, idle
  halfUsable: 45, // days, half-life of the heat usable at full power
  halfHeatThin: 116, // days, with half the insulation
  lossThin: 67, // kW, full, with half the insulation
  surfaceK: 8, // K over the air, outside of the cladding, full
  surfaceW: 76, // W/m² through it
  coreFull: 417, // °C at full, on the axis
  edgeFull: 375, // °C at full, outer ring
  coreHotAir: 516, // °C at full under 650 °C of air
  edgeHotAir: 258, // °C
  chargeHours: 183, // h from the floor to full at 1 MW offered
  chargeHours400: 515, // h with 400 °C of air
  chargeHours600: 120, // h with 600 °C of air
  block: 7.4, // days for the far face of 1 m of sand to reach 100 °C
  // §1.3, K42: the pipes
  legs: 616, // legs of pipe at the estimated pitch
  pipeKm: 3.7, // km of pipe
  dropK: 66, // K in the stone between pipe and cell mean, at 1 MW
  paths: 68, // air paths in parallel
  legsPerPath: 9, // legs in series on a path
  cellHours: 36, // h, time constant of a cell
  usablePitch04: 85, // MWh at 1 MW, pitch 0.4 m
  usablePitch06: 46, // MWh at 1 MW, pitch 0.6 m
  usableK05: 59, // MWh at 1 MW, bed k 0.5 W/m·K
  usableK10: 76, // MWh at 1 MW, bed k 1.0 W/m·K
  bridgeWK: 10, // W/K: all the legs together through the top insulation
  restWK: 103, // W/K: the rest of the silo
  // K34: the blowers at 1 MW
  blowerKwLow: 11,
  blowerKwHigh: 25,
  blowerKpaLow: 2.3,
  blowerKpaHigh: 3.4,
  blowerKgS: 5.3, // kg/s at the blower's limit
  exchangerUA: 16, // kW/K per MW
  // the sand and the other silos
  sandUsable: 30, // MWh at 1 MW, the same silo and pipes filled with sand
  sandUsableTight: 55, // MWh with a pitch of 0.35 m
  sandHeat: 131, // MWh above ambient in the same silo
  sandShare: 23, // %
  usableAt500: 123, // MWh at 1 MW with a mean of 500 °C under 650 °C of air
  kankaUsable: 2.2, // MWh at its 200 kW
  kankaFalling: 7.4, // MWh in all, at falling power
  kankaEta: 75, // % one cycle, a day of rest
  kankaCore: 404, // °C at full
  kankaEdge: 247, // °C at full
  kankaCoreKept: 497, // °C with the charge kept on the core
  kankaEdgeKept: 145, // °C
  drumsFull: 41, // kWh above ambient at full
  drumsHalfPower: 14, // kWh at 2.5 kW
  drumsFalling: 25, // kWh at falling power
  drumsHalfLife: 1.3, // days
  // §5.4, §5.5: a year
  coverageLow: 63, // % of the heat from the stone, the lowest rule of the table
  coverageHigh: 83, // % with the optimiser
  discountDrawn: 63, // % under the mean of the drawn week
  discountRealLow: 71, // % under the mean of a real year, a rule at 50 €/MWh
  discountRealHigh: 81, // % a rule at 30 €/MWh
  heatYearRule: 2.6, // GWh under a price rule
  heatYearAlways: 3.2, // GWh if it never refuses
  soapstoneCurved: 71, // MWh at 1 MW if soapstone's c had the shape of sand
  soapstoneCurvedHeat: 200, // MWh above ambient in that case
} as const;

export const DERIVED = {
  bedVolume: BED_VOLUME, // m³, π r² h
  bedVolumeV: 2400e3 / RHO_BULK.sand, // m³ of the 250 MWh silo's bed: 2,400 t of sand at 1,425 kg/m³
  bulkDensity: RHO_BULK.soapstone, // kg/m³, 2,000 t over that volume
  porosity: (1 - RHO_BULK.soapstone / 3140) * 100, // %, against the measured solid
  perTruck: PORNAINEN.mass / 1000 / PORNAINEN.trucks, // t a truck
  heatFull: (PORNAINEN.mass * 1000 * (PORNAINEN.fullMeanT - AMBIENT)) / 3.6e9, // MWh above 10 °C at a mean of 400 °C and 1 kJ/kg·K
  share100: (100 / ((PORNAINEN.mass * 1000 * (PORNAINEN.fullMeanT - AMBIENT)) / 3.6e9)) * 100, // %
  wallBuildUp: PORNAINEN.wallBuildUp, // m, (15 − 14) / 2
  belowSupply: (PORNAINEN.mass * 1000 * (DESIGN_SUPPLY - AMBIENT)) / 3.6e9, // MWh: 2,000 t × 1 kJ/kg·K × 75 K, under the 85 °C of the supply
  densityBed: 100e3 / BED_VOLUME, // kWh/m³ of the bed at its quoted capacity
  densityWater: (1000 * 4186 * 50) / 3.6e6, // kWh/m³, water from 45 to 95 °C
  densityV: 250e3 / (2400 / 1.5), // kWh/m³ of the 250 MWh silo, at 1,500 kg/m³
  airKgS: 1e6 / (1040 * 300), // kg/s: 1 MW carried over 300 K
  ductDiameter: 2 * MAIN_DUCT_INNER_R, // m, dims.ts: the blower's 5 m³/s at 15 m/s (the research's 4.7 m³/s gave 0.63 m)
  amps: LINE_AMPS, // A at 400 V, three-phase, for 1 MW
  winterKw: 100e3 / (7 * 24), // kW: 100 MWh over a week
  summerKw: 100e3 / (30 * 24), // kW: 100 MWh over a month
  yearGWh: 3.2, // half the year at each of them, (595 + 139) / 2 × 8,760 h
  cycles: 32, // those 3.2 GWh over 100 MWh
  growCm: PIPE_GROWTH * 100, // cm, dims.ts: 6 m of stainless over 500 K
  shellGrowCm: ALPHA_STEEL * PORNAINEN.bedDiameter * (375 - AMBIENT) * 100, // cm on the diameter, the same steel, the edge at 375 °C
  cyclesLow: 20 * 30, // cycles in 30 years at 20 a year
  cyclesHigh: 200 * 30, // cycles in 30 years at 200 a year
  bedPressure: (PORNAINEN.mass * 9.81) / BED_AREA / 1000, // kPa under the stone: weight over the bed's area
  bedArea: BED_AREA, // m²
  sandMass: (RHO_BULK.sand * BED_VOLUME) / 1000, // t of sand in the same bed
  waterKgS: 1e6 / (4186 * (DESIGN_SUPPLY - DESIGN_RETURN)), // kg/s: 1 MW carried by 40 K of water
  meterError: (1 / (DESIGN_SUPPLY - DESIGN_RETURN)) * 100, // %: 1 K of error on 40 K
  specificFirst: (8 * 3600) / 100, // kJ/kg of the 8 MWh silo, 100 t
  specificLab: (100 * 3600) / 2000, // kJ/kg of the 100 MWh silo
  specificV: (250 * 3600) / 2400, // kJ/kg of the 250 MWh silo
  specificPilot: (3 * 3600) / 42, // kJ/kg of the pilot
  swingLab: (100 * 3600) / 2000, // K of mean swing at 1 kJ/kg·K
  swingV: (250 * 3600) / 2400, // K
  ratioQuoted: 250 / 100, // the two quoted capacities
  drumsKwh: (570 * 1000 * 300) / 3.6e6, // kWh: 570 kg over 300 K at 1 kJ/kg·K
  drumsMass: 570, // kg of sand in two 200 L drums
  avDrum: 9.5, // surface over volume, per metre: a 200 L drum
  avBin: 5.6, // 1 m³ bin
  avFirst: 1.3, // the 8 MWh silo
  avBed: 0.62, // the bed drawn here
  meanCSand: 999, // J/kg·K, one measured sand, 100 to 500 °C
  meanCQuartz: 1045, // J/kg·K, pure quartz, the same range
  understate: 20, // % a fixed 0.8 understates the swing of sand from 100 to 500 °C
} as const;

export const ASSUMED = {
  volts: LV_VOLTS, // V, low-voltage side
  mediumV: 20, // kV, the line
  chargeMw: PORNAINEN.ratedPower / 1e6, // MW of resistors at this plant: the charging power is not published
  soapstoneC: 1.0, // kJ/kg·K, held constant: its real curve is unknown
} as const;

export const ESTIMATE = {
  wallInsulation: PORNAINEN.wallInsulation, // m
  topInsulation: PORNAINEN.stack.topInsulation, // m
  baseInsulation: SILO.baseInsulation, // m, dims.ts
  foundationStack: PORNAINEN.stack.foundationAndBase, // m, slab and base insulation together
  floorStack: PORNAINEN.stack.equipmentFloor, // m of clear height
  roofStack: PORNAINEN.stack.roof, // m
  deckAcross: 2 * WALL.roomIn, // m, dims.ts: the deck of the equipment floor, inside the room's wall
  lambda: LAMBDA_INSULATION, // W/m·K
  groundT: GROUND_T, // °C
  slabDiameter: 2 * SILO.slabR, // m, dims.ts
  pitch: PORNAINEN.pitch, // m
  pipeRadiusMm: PORNAINEN.pipeOuterRadius * 1000, // mm
  pipeWallMm: PORNAINEN.pipeWall * 1000, // mm
  airSpeed: DUCT_VELOCITY, // m/s in the pipes and ducts at full flow
  blowerRate: BLOWER_PER_MW, // m³/s per MW
  blowerLimitKpa: BLOWER_DP_MAX / 1000, // kPa
  blowerRunSeconds: BLOWER_TAU, // s
  kBed: 0.7, // W/m·K, the soapstone bed
  kBedLow: 0.5,
  kBedHigh: 1.0,
  zoneCore: ZONE_EDGES[0] * 100, // % of the bed's radius
  zoneMiddle: ZONE_EDGES[1] * 100, // %
  pipesCore: ZONE_EDGES[0] ** 2 * 100, // % of the pipes
  pipesMiddle: (ZONE_EDGES[1] ** 2 - ZONE_EDGES[0] ** 2) * 100, // %
  pipesOuter: (1 - ZONE_EDGES[1] ** 2) * 100, // %
  transformerKva: 1250, // kVA
  transformerEta: ETA_TRANSFORMER * 100, // %
  riserMm2: RISER_SECTION_MM2, // mm²
  riserLength: RISER_LENGTH, // m
  riserLossKw: (3 * LINE_AMPS * LINE_AMPS * (cableResistance(RISER_LENGTH, RISER_SECTION_MM2) / 2)) / 1000, // kW at 1 MW
  annexW: SITE.annex.length, // m, dims.ts
  annexD: SITE.annex.depth, // m
  annexH: SITE.annex.height, // m
  bankL: PLANT.bank.z1 - PLANT.bank.z0, // m, dims.ts: casing of the resistors
  bankS: PLANT.bank.w, // m
  elementLimit: ELEMENT_LIMIT, // °C
  elementRise: ELEMENT_RISE, // K from element to air at the design flow
  flowSwitch: FLOW_SWITCH * 100, // % of the flow the heater needs
  shellLimit: LIMITS.wall, // °C
  surfaceLimit: LIMITS.surface, // °C
  returnT: DESIGN_RETURN, // °C
  airOut: DESIGN_RETURN + EXCHANGER_PINCH, // °C, air leaving the exchanger at the design point
  pinch: EXCHANGER_PINCH, // K
  ductWK: DUCT_UA_AT_MW, // W/K a loop at 1 MW
  ductLength: 15, // m of duct in a loop
  auxKw: AUX_PER_MW / 1000, // kW per MW
  pumpKpa: PUMP_DP / 1000, // kPa
  boilerPrice: 45, // €/MWh
} as const;

const fig = (table: Record<string, number>, digits: Record<string, number> = {}): Record<string, [number, number]> =>
  Object.fromEntries(Object.entries(table).map(([k, v]) => [k, [v, digits[k] ?? 0]]));

/** The decimals a figure is printed with; the default is none. */
const DIGITS: Record<string, number> = {
  daysWinter: 1,
  blowerFor100: 1,
  blowerTimes: 1,
  ratioV: 1,
  factorMass: 1,
  factorTop: 1,
  factorC: 2,
  wallsYear: 1,
  circYear: 1,
  wallsCycle: 1,
  block: 1,
  pipeKm: 1,
  blowerKpaLow: 1,
  blowerKpaHigh: 1,
  blowerKgS: 1,
  kankaUsable: 1,
  kankaFalling: 1,
  drumsHalfLife: 1,
  heatYearRule: 1,
  heatYearAlways: 1,
  wallBuildUp: 1,
  airKgS: 1,
  ductDiameter: 2,
  yearGWh: 1,
  ratioQuoted: 1,
  avDrum: 1,
  avBin: 1,
  avFirst: 1,
  avBed: 2,
  meterError: 1,
  soapstoneC: 1,
  wallInsulation: 2,
  topInsulation: 1,
  baseInsulation: 1,
  foundationStack: 1,
  floorStack: 1,
  roofStack: 1,
  lambda: 1,
  deckAcross: 1,
  pitch: 1,
  kBed: 1,
  kBedLow: 1,
  kBedHigh: 1,
  bankS: 1,
  riserLossKw: 1,
};

export const FIG: Record<string, [value: number, digits: number]> = {
  ...fig(MODEL, DIGITS),
  ...fig(DERIVED, DIGITS),
  ...fig(ASSUMED, DIGITS),
  ...fig(ESTIMATE, DIGITS),
};

export type FigName = keyof typeof MODEL | keyof typeof DERIVED | keyof typeof ASSUMED | keyof typeof ESTIMATE;

export const MODEL_KEYS: ReadonlySet<string> = new Set(Object.keys(MODEL));
export const DERIVED_KEYS: ReadonlySet<string> = new Set(Object.keys(DERIVED));
export const ASSUMED_KEYS: ReadonlySet<string> = new Set(Object.keys(ASSUMED));
export const ESTIMATE_KEYS: ReadonlySet<string> = new Set(Object.keys(ESTIMATE));
