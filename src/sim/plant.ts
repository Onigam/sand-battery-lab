import {
  airCp,
  airK,
  airMu,
  airPr,
  airRho,
  buildGrid,
  createNetwork,
  effectiveness,
  fluidLine,
  marchFluid,
  pipeCellFactor,
  pitchRadius,
  seriesU,
  setLinkConductance,
  setNodeTemperature,
  stepNetwork,
  totalBoundaryEnergy,
  totalEnthalpy,
  tubeFlow,
  tubePressureDrop,
  uniformEdges,
  type GasProperties,
  type Grid,
  type LineCoefficients,
  type Material,
  type RCNetwork,
} from './thermal';
import {
  AUX_PER_MW,
  BASE_OVER_WALL,
  BEND_HEADS,
  BLOWER_DP_MAX,
  BLOWER_PER_MW,
  blowerFlow,
  designAirFlow,
  designExchangerUA,
  DUCT_UA_AT_MW,
  DUCT_VELOCITY,
  ETA_FAN,
  ETA_MOTOR,
  ETA_TRANSFORMER,
  EXCHANGER_FLOW_EXP,
  EXCHANGER_PINCH,
  FILM_OUT,
  GRID_LAYERS,
  GRID_RINGS,
  GROUND_T,
  legsOf,
  LEGS_PER_PATH_MAX,
  LOOP_HEADS,
  materialFor,
  PUMP_DP,
  PUMP_ETA,
  riserLoss,
  ROOM_OVER_OUTSIDE,
  STEEL_K,
  TOP_OVER_WALL,
  ZONE_EDGES,
  type SiloSpec,
} from './silo';

// The plant at one instant and over one step: the bed as an RC network, the pipes as a subgrid conductance per cell, the closed air loops
// marched through the cells, the exchanger, the losses. The air holds next to no heat, so each loop is solved as a steady state on the
// present temperatures of the stone; then the stone moves by one step. Everything is an outcome of these equations: `usable capacity`
// is what comes out when the loops can no longer hold the power (runs.ts).

/** Zone masks: bit 0 core, bit 1 middle, bit 2 outer. */
export const ZONE_CORE = 1;
export const ZONE_MIDDLE = 2;
export const ZONE_OUTER = 4;
export const ZONE_ALL = 7;

/** ESTIMATE: the discharge stops when the heat it gives falls under this many times the electricity of its blower. */
const WORTH_RUNNING = 3;

/** In which order sets of zones are tried: the coolest stone goes first on discharge, the core first on charge (the maker's principle). */
const DISCHARGE_SETS = [
  ZONE_OUTER,
  ZONE_OUTER | ZONE_MIDDLE,
  ZONE_MIDDLE,
  ZONE_ALL,
  ZONE_MIDDLE | ZONE_CORE,
  ZONE_CORE,
];
const CHARGE_SETS = [ZONE_CORE, ZONE_CORE | ZONE_MIDDLE, ZONE_MIDDLE, ZONE_ALL, ZONE_MIDDLE | ZONE_OUTER, ZONE_OUTER];

export type ChargeOrder = 'core-first' | 'even';

/** What the plant is asked to do during a step. */
export interface Conditions {
  /** Outside air, °C. */
  outsideT: number;
  /** Network temperatures, °C. */
  supplyT: number;
  returnT: number;
  /** Heat the network asks, W. */
  demand: number;
  /** Power the operator offers the heater, W. */
  chargeRequest: number;
  chargeOrder: ChargeOrder;
  /** The charge stays on the zones it has while they take at least this share of what is offered (0 to 1). */
  spill: number;
}

export interface Loop {
  /** Zones open on this loop (a mask) and the air flow, kg/s. */
  mask: number;
  mdot: number;
  /** Air going into the bed and leaving it, °C. */
  bedIn: number;
  bedOut: number;
  /** Fan: electricity, W; heat it gives the air, W; pressure, Pa. */
  fanElectric: number;
  fanAir: number;
  dp: number;
  /** Heat lost by the ducts, W. */
  ductLoss: number;
}

export interface Operating {
  charge: Loop & {
    /** Heater power, W; air leaving the heater, °C. */
    heater: number;
    airHot: number;
  };
  discharge: Loop & {
    /** Heat given to the network, W; air at the exchanger, °C; water flow, kg/s. */
    heat: number;
    airHot: number;
    airCold: number;
    water: number;
  };
  /** What the boiler has to bring, W. */
  boiler: number;
  /** Through the walls, W. */
  wallLoss: number;
  /** Everything taken from the grid, W, and the part of it that heats nothing useful (transformer, riser, motors, pump, controls). */
  electricity: number;
  auxLoss: number;
}

/** Running totals, J. */
export interface Totals {
  heater: number;
  fanAir: number;
  electricity: number;
  auxLoss: number;
  heat: number;
  boiler: number;
  ductLoss: number;
}

export interface Plant {
  spec: SiloSpec;
  material: Material;
  grid: Grid;
  net: RCNetwork;
  mass: number;
  /** The grid. */
  rings: number;
  layers: number;
  /** Zone bit of each ring. */
  ringZone: Int32Array;
  /** Legs of pipe in each ring. */
  ringLegs: Float64Array;
  /** The stretches of a U-pipe in each ring: down the layers and back up. */
  ringOrder: Int32Array[];
  ringG: Float64Array[];
  /** Pipe to stone, W/m·K of leg, per cell. */
  gStone: Float64Array;
  /** Boundary nodes. */
  nodeAir: number;
  nodeRoof: number;
  nodeGround: number;
  sideLinks: number[];
  topLinks: number[];
  baseLinks: number[];
  /** Air paths at full flow. */
  paths: number;
  pipeInner: number;
  /** m². */
  sideArea: number;
  topArea: number;
  /** Mean temperature of each zone, °C. */
  zoneT: Float64Array;
  /** Hottest cell of each zone, °C. */
  zoneMaxT: Float64Array;
  meanT: number;
  op: Operating;
  totals: Totals;
  /** Enthalpy at the start and what entered and left, for the balance. */
  h0: number;
  /** The charge stops at the full mean temperature and starts again 1 K under it. */
  full: boolean;
}

const emptyLoop = (): Loop => ({
  mask: 0,
  mdot: 0,
  bedIn: 0,
  bedOut: 0,
  fanElectric: 0,
  fanAir: 0,
  dp: 0,
  ductLoss: 0,
});

function zeroTotals(): Totals {
  return { heater: 0, fanAir: 0, electricity: 0, auxLoss: 0, heat: 0, boiler: 0, ductLoss: 0 };
}

const gasAt = (T: number): GasProperties => ({ rho: airRho(T), mu: airMu(T), k: airK(T), Pr: airPr(T) });

/** Rings to zones: the ring belongs to the zone its centre radius falls in. */
function zoneOfRing(ring: number, rings: number): number {
  const r = (ring + 0.5) / rings;
  if (r <= ZONE_EDGES[0]) return ZONE_CORE;
  if (r <= ZONE_EDGES[1]) return ZONE_MIDDLE;
  return ZONE_OUTER;
}

/** A plant with its stone at one temperature. `rings` and `layers` change only in the convergence tests. */
export function createPlant(spec: SiloSpec, startT = 20, rings = GRID_RINGS, layers = GRID_LAYERS): Plant {
  const material = materialFor(spec.medium, spec.kScale, spec.soapstoneC);
  const grid = buildGrid({
    geometry: 'rz',
    xEdges: uniformEdges(spec.bedRadius, rings),
    yEdges: uniformEdges(spec.bedHeight, layers),
    material,
    T: startT,
  });
  const nodeAir = grid.nodes.length;
  const nodeRoof = nodeAir + 1;
  const nodeGround = nodeAir + 2;
  const nodes = [...grid.nodes, { T: 5, fixed: true }, { T: 20, fixed: true }, { T: GROUND_T, fixed: true }];
  const links = [...grid.links];
  const sideLinks: number[] = [];
  const topLinks: number[] = [];
  const baseLinks: number[] = [];
  const add = (faces: ReturnType<Grid['faces']>, node: number, into: number[]) => {
    for (const f of faces) {
      into.push(links.length);
      links.push({ a: f.node, b: node, G: 1, shapeA: f.shape });
    }
  };
  add(grid.faces('xMax'), nodeAir, sideLinks);
  add(grid.faces('yMax'), nodeRoof, topLinks);
  add(grid.faces('yMin'), nodeGround, baseLinks);
  const net = createNetwork(nodes, links);

  const ringZone = new Int32Array(rings);
  const ringOrder: Int32Array[] = [];
  const ringG: Float64Array[] = [];
  for (let i = 0; i < rings; i++) {
    ringZone[i] = zoneOfRing(i, rings);
    const order = new Int32Array(2 * layers);
    for (let j = 0; j < layers; j++) {
      order[j] = grid.id(i, layers - 1 - j); // down from the top
      order[layers + j] = grid.id(i, j); // and back up
    }
    ringOrder.push(order);
    ringG.push(new Float64Array(2 * layers));
  }
  const mass = grid.nodes.reduce((sum, n) => sum + (n.mass ?? 0), 0);
  const plant: Plant = {
    spec,
    material,
    grid,
    net,
    mass,
    ringZone,
    rings,
    layers,
    ringLegs: new Float64Array(rings),
    ringOrder,
    ringG,
    gStone: new Float64Array(rings * layers),
    nodeAir,
    nodeRoof,
    nodeGround,
    sideLinks,
    topLinks,
    baseLinks,
    paths: 1,
    pipeInner: 0,
    sideArea: 2 * Math.PI * spec.bedRadius * spec.bedHeight,
    topArea: Math.PI * spec.bedRadius ** 2,
    zoneT: new Float64Array(3),
    zoneMaxT: new Float64Array(3),
    meanT: startT,
    op: {
      charge: { ...emptyLoop(), heater: 0, airHot: 0 },
      discharge: { ...emptyLoop(), heat: 0, airHot: 0, airCold: 0, water: 0 },
      boiler: 0,
      wallLoss: 0,
      electricity: 0,
      auxLoss: 0,
    },
    totals: zeroTotals(),
    h0: 0,
    full: false,
  };
  applySpec(plant);
  plant.h0 = totalEnthalpy(net);
  refreshZones(plant);
  return plant;
}

/** Take a change of the settings that needs no new grid: the insulation, the pipes, the blowers. */
export function applySpec(p: Plant): void {
  const s = p.spec;
  const legs = legsOf(s);
  const dr = s.bedRadius / p.rings;
  for (let i = 0; i < p.rings; i++) {
    const share = ((i + 1) ** 2 - i ** 2) * (dr * dr) * Math.PI;
    p.ringLegs[i] = (legs * share) / p.topArea;
  }
  p.pipeInner = 2 * (s.pipeRadius - Math.max(0.003, 0.06 * s.pipeRadius));
  // air paths: as many in parallel as keep the air at about the duct speed at full flow in a warm pipe
  const volume = blowerFlow(s.ratedPower, s.blowerPerMW) * (airRho(60) / airRho(200));
  const paths = volume / (DUCT_VELOCITY * ((Math.PI * p.pipeInner ** 2) / 4));
  p.paths = Math.max(1, Math.min(Math.max(paths, legs / LEGS_PER_PATH_MAX), legs / 2));
  // walls
  const uSide = seriesU([{ thickness: s.insulation, lambda: s.lambda }], Infinity, FILM_OUT);
  const uTop = seriesU([{ thickness: s.insulation * TOP_OVER_WALL, lambda: s.lambda }], Infinity, FILM_OUT);
  const uBase = seriesU([{ thickness: s.insulation * BASE_OVER_WALL, lambda: s.lambda }]);
  const faceArea = (links: number[], total: number) => total / links.length;
  for (const l of p.sideLinks) setLinkConductance(p.net, l, uSide * faceArea(p.sideLinks, p.sideArea));
  // the pipes cross the top insulation: each leg is a little bridge of steel
  const wall = (s.pipeRadius * 2 - p.pipeInner) / 2;
  const bridge = (STEEL_K * Math.PI * 2 * s.pipeRadius * wall) / (s.insulation * TOP_OVER_WALL);
  for (let i = 0; i < p.rings; i++) {
    const area = p.grid.faces('yMax')[i]!.area;
    setLinkConductance(p.net, p.topLinks[i]!, uTop * area + bridge * p.ringLegs[i]!);
    setLinkConductance(p.net, p.baseLinks[i]!, uBase * area);
  }
}

/** Change the medium's conductivity scale or the medium itself in place: same temperatures, new enthalpies. Mass follows the medium. */
export function retargetBed(p: Plant, material: Material): void {
  const n = p.grid.nodes.length;
  p.material = material;
  let mass = 0;
  for (let i = 0; i < n; i++) {
    const volume = p.grid.volume[i]!;
    p.net.material[i] = material;
    p.net.mass[i] = volume * material.rho;
    mass += p.net.mass[i]!;
    setNodeTemperature(p.net, i, p.net.T[i]!);
  }
  p.mass = mass;
  p.h0 = totalEnthalpy(p.net);
  p.net.boundaryEnergy.fill(0);
  p.totals = zeroTotals();
  refreshZones(p);
}

/** A new conductivity for the same medium: the stone keeps its enthalpy, the counters go on. */
export function swapConductivity(p: Plant, material: Material): void {
  p.material = material;
  for (let i = 0; i < p.grid.nodes.length; i++) p.net.material[i] = material;
}

/** Put a temperature field in the bed: `at(ring, layer)`, °C. */
export function setBedField(p: Plant, at: (ring: number, layer: number) => number): void {
  for (let j = 0; j < p.layers; j++) {
    for (let i = 0; i < p.rings; i++) setNodeTemperature(p.net, p.grid.id(i, j), at(i, j));
  }
  refreshZones(p);
  resetBalance(p);
}

/** Start the counters from here: the energy balance is checked from this state. */
export function resetBalance(p: Plant): void {
  p.h0 = totalEnthalpy(p.net);
  p.net.boundaryEnergy.fill(0);
  p.totals = zeroTotals();
}

/** Copy of the temperatures of the bed, °C. */
export const bedField = (p: Plant): Float64Array => p.net.T.slice(0, p.grid.nodes.length);

/** Mean temperature (from the mean enthalpy) and the figures of the zones. */
export function refreshZones(p: Plant): void {
  const { net, grid } = p;
  let h = 0;
  const sum = [0, 0, 0];
  const massOf = [0, 0, 0];
  p.zoneMaxT.fill(-1e9);
  for (let j = 0; j < p.layers; j++) {
    for (let i = 0; i < p.rings; i++) {
      const id = grid.id(i, j);
      h += net.H[id]!;
      const z = p.ringZone[i]! === ZONE_CORE ? 0 : p.ringZone[i]! === ZONE_MIDDLE ? 1 : 2;
      sum[z]! += net.H[id]!;
      massOf[z]! += net.mass[id]!;
      if (net.T[id]! > p.zoneMaxT[z]!) p.zoneMaxT[z] = net.T[id]!;
    }
  }
  for (let z = 0; z < 3; z++) p.zoneT[z] = p.material.Tof(sum[z]! / massOf[z]!);
  p.meanT = p.material.Tof(h / p.mass);
}

const massShare = (p: Plant, mask: number): number => {
  let legs = 0;
  for (let i = 0; i < p.rings; i++) if (p.ringZone[i]! & mask) legs += p.ringLegs[i]!;
  return legs;
};

function maskMeanT(p: Plant, mask: number): number {
  let sum = 0;
  let w = 0;
  for (let i = 0; i < p.rings; i++) {
    if (!(p.ringZone[i]! & mask)) continue;
    const z = p.ringZone[i]! === ZONE_CORE ? 0 : p.ringZone[i]! === ZONE_MIDDLE ? 1 : 2;
    sum += p.zoneT[z]! * p.ringLegs[i]!;
    w += p.ringLegs[i]!;
  }
  return w > 0 ? sum / w : p.meanT;
}

function refreshPipes(p: Plant): void {
  const { net, grid, material, spec } = p;
  const factor = pipeCellFactor(pitchRadius(spec.pitch), spec.pipeRadius);
  for (let j = 0; j < p.layers; j++) {
    for (let i = 0; i < p.rings; i++) {
      const id = grid.id(i, j);
      p.gStone[id] = (2 * Math.PI * material.k(net.T[id]!)) / factor;
    }
  }
}

// ------------------------------------------------------------------------------------------------ the air through the bed

const line: LineCoefficients = { A: 0, B: 0 };
const lineRing: LineCoefficients = { A: 0, B: 0 };

/** Fill the conductances of the open rings for a flow, and `line`: mixed outlet = A + B·inlet. */
function bedLine(p: Plant, mask: number, mdot: number, Tair: number, cp: number): void {
  const legsOpen = massShare(p, mask);
  const legsTotal = legsOf(p.spec);
  const pathsOpen = Math.max(1, (p.paths * legsOpen) / legsTotal);
  const flow = tubeFlow(mdot / pathsOpen, p.pipeInner, gasAt(Tair));
  const gFilm = flow.h * Math.PI * p.pipeInner;
  const dz = p.spec.bedHeight / p.layers;
  let A = 0;
  let B = 0;
  for (let i = 0; i < p.rings; i++) {
    if (!(p.ringZone[i]! & mask)) continue;
    const legs = p.ringLegs[i]!;
    const share = legs / legsOpen;
    const G = p.ringG[i]!;
    const order = p.ringOrder[i]!;
    const half = (legs * dz) / 2;
    for (let s = 0; s < order.length; s++) {
      G[s] = half / (1 / p.gStone[order[s]!]! + 1 / gFilm);
    }
    fluidLine(order, p.net.T, G, share * mdot * cp, lineRing);
    A += share * lineRing.A;
    B += share * lineRing.B;
  }
  line.A = A;
  line.B = B;
}

/** Add to `net.Q` the heat the air gives the open rings (negative when it takes), with the conductances of the last `bedLine`. */
function applyLine(p: Plant, mask: number, mdot: number, cp: number, Tin: number): void {
  const legsOpen = massShare(p, mask);
  for (let i = 0; i < p.rings; i++) {
    if (!(p.ringZone[i]! & mask)) continue;
    const share = p.ringLegs[i]! / legsOpen;
    marchFluid(Tin, p.ringOrder[i]!, p.net.T, p.ringG[i]!, share * mdot * cp, p.net.Q);
  }
}

/** Pressure of a loop at a flow, Pa: the pipes on an air path, plus the rest of the loop in velocity heads of the main duct. */
function loopPressure(p: Plant, mask: number, mdot: number, Tair: number, volume: number, ductFlow: number): number {
  const legsTotal = legsOf(p.spec);
  const legsOpen = massShare(p, mask);
  const pathsOpen = Math.max(1, (p.paths * legsOpen) / legsTotal);
  const gas = gasAt(Tair);
  const flow = tubeFlow(mdot / pathsOpen, p.pipeInner, gas);
  const legsPerPath = legsTotal / p.paths;
  const pipes =
    tubePressureDrop(flow, legsPerPath * p.spec.bedHeight, p.pipeInner, gas.rho) +
    BEND_HEADS * (legsPerPath / 2) * 0.5 * gas.rho * flow.velocity ** 2;
  // the duct is sized for 15 m/s at the blower's own full flow
  const vDuct = (volume / ductFlow) * DUCT_VELOCITY;
  return pipes + LOOP_HEADS * 0.5 * (mdot / volume) * vDuct * vDuct;
}

/** The largest flow of a blower with these zones open: its volume at its inlet, then the pressure it can reach, kg/s. */
function maxFlow(p: Plant, mask: number, power: number, Tinlet: number, Tair: number): number {
  const volume = blowerFlow(power, p.spec.blowerPerMW);
  const mdot = volume * airRho(Tinlet);
  const dp = loopPressure(p, mask, mdot, Tair, volume, volume);
  return dp > BLOWER_DP_MAX ? mdot * Math.sqrt(BLOWER_DP_MAX / dp) : mdot;
}

const ductUA = (power: number): number => DUCT_UA_AT_MW * Math.sqrt(Math.max(power, 1) / 1e6);

// ------------------------------------------------------------------------------------------------ discharge

interface DischargeTrial {
  heat: number;
  bedIn: number;
  bedOut: number;
  airHot: number;
  airCold: number;
  fanAir: number;
  fanElectric: number;
  dp: number;
  ductLoss: number;
}

const trial: DischargeTrial = {
  heat: 0,
  bedIn: 0,
  bedOut: 0,
  airHot: 0,
  airCold: 0,
  fanAir: 0,
  fanElectric: 0,
  dp: 0,
  ductLoss: 0,
};

/** The closed air loop of a discharge at a flow, for a water capacity rate: the exchanger gives the heat, W. Fills `trial`. */
function dischargeAt(p: Plant, c: Conditions, mask: number, mdot: number, waterC: number, room: number): number {
  const s = p.spec;
  const Tinlet = c.returnT + EXCHANGER_PINCH;
  const Tair = 0.5 * (maskMeanT(p, mask) + Tinlet);
  const cp = airCp(Tair);
  bedLine(p, mask, mdot, Tair, cp);
  const Ca = mdot * cp;
  const volume = mdot / airRho(Tinlet);
  const dp = loopPressure(p, mask, mdot, Tair, volume, blowerFlow(s.ratedPower, s.blowerPerMW));
  const fanAir = (volume * dp) / ETA_FAN;
  const b = fanAir / Ca;
  const d = Math.exp(-ductUA(s.ratedPower) / Ca);
  const UA =
    designExchangerUA(s.ratedPower) * Math.pow(mdot / designAirFlow(s.ratedPower, BLOWER_PER_MW), EXCHANGER_FLOW_EXP);
  const Cmin = Math.min(Ca, waterC);
  const Cmax = Math.max(Ca, waterC);
  const eps = effectiveness(UA, Cmin, Cmax, 'counter');
  const phi = (eps * Cmin) / Ca;
  // T_out = A + B·T_in; T_hot = room(1 − d) + d·T_out; T_in = (1 − φ)·T_hot + φ·T_ret + b
  const K0 = (1 - phi) * room * (1 - d) + phi * c.returnT + b;
  const bedOut = (line.A + line.B * K0) / (1 - line.B * (1 - phi) * d);
  const airHot = room * (1 - d) + d * bedOut;
  const heat = phi * Ca * (airHot - c.returnT);
  const airCold = airHot - heat / Ca;
  trial.heat = heat;
  trial.bedIn = airCold + b;
  trial.bedOut = bedOut;
  trial.airHot = airHot;
  trial.airCold = airCold;
  trial.fanAir = fanAir;
  trial.fanElectric = fanAir / ETA_MOTOR;
  trial.dp = dp;
  trial.ductLoss = Ca * (bedOut - airHot);
  return heat;
}

/** Choose the zones and the flow for a heat demand. `keepOne`: leave at least one zone (not in `closed`) free for a charge. */
function solveDischarge(p: Plant, c: Conditions, demand: number, keepOne: boolean, closed: number, room: number): void {
  const out = p.op.discharge;
  out.mask = 0;
  out.mdot = 0;
  out.heat = 0;
  out.fanAir = 0;
  out.fanElectric = 0;
  out.dp = 0;
  out.ductLoss = 0;
  out.water = 0;
  const span = c.supplyT - c.returnT;
  if (demand <= 0 || span <= 0) return;
  const s = p.spec;
  const Tinlet = c.returnT + EXCHANGER_PINCH;
  const waterC = demand / span;
  let bestMask = 0;
  let bestHeat = -1;
  let found = false;
  let mdot = 0;
  let mask = 0;
  for (const m of DISCHARGE_SETS) {
    if (keepOne && (m | closed) === ZONE_ALL) continue;
    const top = maxFlow(p, m, s.ratedPower, Tinlet, 0.5 * (maskMeanT(p, m) + Tinlet));
    const q = dischargeAt(p, c, m, top, waterC, room);
    if (q > bestHeat) {
      bestHeat = q;
      bestMask = m;
    }
    if (q >= demand) {
      mask = m;
      let lo = top * 0.005;
      let hi = top;
      for (let it = 0; it < 14; it++) {
        const mid = Math.sqrt(lo * hi);
        if (dischargeAt(p, c, m, mid, waterC, room) >= demand) hi = mid;
        else lo = mid;
      }
      mdot = hi;
      found = true;
      break;
    }
  }
  if (bestMask === 0) return;
  let water = waterC;
  if (!found) {
    // the demand cannot be held: the highest heat that still leaves the water at its supply temperature
    mask = bestMask;
    mdot = maxFlow(p, mask, s.ratedPower, Tinlet, 0.5 * (maskMeanT(p, mask) + Tinlet));
    let lo = 0;
    let hi = demand;
    for (let it = 0; it < 12; it++) {
      const mid = 0.5 * (lo + hi);
      if (dischargeAt(p, c, mask, mdot, mid / span, room) >= mid) lo = mid;
      else hi = mid;
    }
    if (lo <= 0) return;
    water = lo / span;
  }
  dischargeAt(p, c, mask, mdot, water, room);
  // a blower that only sends back its own heat is an electric heater with extra steps: the controller stops it
  if (trial.heat < WORTH_RUNNING * trial.fanElectric) return;
  const Tair = 0.5 * (maskMeanT(p, mask) + Tinlet);
  const cp = airCp(Tair);
  applyLine(p, mask, mdot, cp, trial.bedIn);
  out.mask = mask;
  out.mdot = mdot;
  out.heat = trial.heat;
  out.bedIn = trial.bedIn;
  out.bedOut = trial.bedOut;
  out.airHot = trial.airHot;
  out.airCold = trial.airCold;
  out.fanAir = trial.fanAir;
  out.fanElectric = trial.fanElectric;
  out.dp = trial.dp;
  out.ductLoss = trial.ductLoss;
  out.water = trial.heat / (span * 4186);
}

// ------------------------------------------------------------------------------------------------ charge

interface ChargeTrial {
  heater: number;
  bedIn: number;
  bedOut: number;
  airHot: number;
  fanAir: number;
  fanElectric: number;
  dp: number;
  ductLoss: number;
}

const ctrial: ChargeTrial = {
  heater: 0,
  bedIn: 0,
  bedOut: 0,
  airHot: 0,
  fanAir: 0,
  fanElectric: 0,
  dp: 0,
  ductLoss: 0,
};

/** The closed air loop of a charge at a flow, the heater holding the air at its limit: the power it takes, W. Fills `ctrial`. */
function chargeAt(p: Plant, mask: number, mdot: number, room: number): number {
  const s = p.spec;
  const limit = s.chargeAirT;
  const Tair = 0.5 * (maskMeanT(p, mask) + limit);
  const cp = airCp(Tair);
  bedLine(p, mask, mdot, Tair, cp);
  const Ca = mdot * cp;
  const d = Math.exp(-ductUA(s.chargePower) / Ca);
  const bedIn = room + (limit - room) * d;
  const bedOut = line.A + line.B * bedIn;
  const volume = mdot / airRho(bedOut);
  const dp = loopPressure(p, mask, mdot, Tair, volume, blowerFlow(s.chargePower, s.blowerPerMW));
  const fanAir = (volume * dp) / ETA_FAN;
  ctrial.heater = Ca * (limit - bedOut) - fanAir;
  ctrial.bedIn = bedIn;
  ctrial.bedOut = bedOut;
  ctrial.airHot = limit;
  ctrial.fanAir = fanAir;
  ctrial.fanElectric = fanAir / ETA_MOTOR;
  ctrial.dp = dp;
  ctrial.ductLoss = Ca * (limit - bedIn);
  return ctrial.heater;
}

/** A charge at a given power and flow, the air under its limit: the closed loop in one pass. */
function chargeAtPower(p: Plant, mask: number, mdot: number, power: number, room: number): void {
  const s = p.spec;
  const Tair = 0.5 * (maskMeanT(p, mask) + s.chargeAirT);
  const cp = airCp(Tair);
  bedLine(p, mask, mdot, Tair, cp);
  const Ca = mdot * cp;
  const d = Math.exp(-ductUA(s.chargePower) / Ca);
  // T_out = A + B·T_in; T_hot = T_out + b + P/C; T_in = room(1 − d) + d·T_hot
  const volume = mdot / airRho(p.meanT);
  const dp = loopPressure(p, mask, mdot, Tair, volume, blowerFlow(s.chargePower, s.blowerPerMW));
  const fanAir = (volume * dp) / ETA_FAN;
  const rise = (power + fanAir) / Ca;
  const airHot = (line.A + line.B * room * (1 - d) + rise) / (1 - line.B * d);
  const bedIn = room * (1 - d) + d * airHot;
  ctrial.heater = power;
  ctrial.bedIn = bedIn;
  ctrial.bedOut = line.A + line.B * bedIn;
  ctrial.airHot = airHot;
  ctrial.fanAir = fanAir;
  ctrial.fanElectric = fanAir / ETA_MOTOR;
  ctrial.dp = dp;
  ctrial.ductLoss = Ca * (airHot - bedIn);
}

function solveCharge(p: Plant, c: Conditions, power: number, forbid: number, room: number): void {
  const out = p.op.charge;
  out.mask = 0;
  out.mdot = 0;
  out.heater = 0;
  out.fanAir = 0;
  out.fanElectric = 0;
  out.dp = 0;
  out.ductLoss = 0;
  if (power <= 0 || p.spec.chargeAirT <= p.meanT) return;
  const s = p.spec;
  const sets = c.chargeOrder === 'even' ? [ZONE_ALL] : CHARGE_SETS;
  let bestMask = 0;
  let bestPower = -1;
  let bestFlow = 0;
  let mask = 0;
  let mdot = 0;
  let found = false;
  let below = false;
  const allowed = sets.map((m) => (c.chargeOrder === 'even' ? m & ~forbid : m)).filter((m) => m !== 0 && !(m & forbid));
  for (const m of allowed) {
    const inlet0 = maskMeanT(p, m);
    let top = maxFlow(p, m, s.chargePower, inlet0, 0.5 * (inlet0 + s.chargeAirT));
    chargeAt(p, m, top, room);
    top = maxFlow(p, m, s.chargePower, ctrial.bedOut, 0.5 * (ctrial.bedOut + s.chargeAirT));
    const q = chargeAt(p, m, top, room);
    if (q > bestPower) {
      bestPower = q;
      bestMask = m;
      bestFlow = top;
    }
    // this set takes enough of what is offered: stop here, even at a reduced power, rather than spread the heat to cooler stone
    if (q >= c.spill * power && q < power) {
      bestPower = q;
      bestMask = m;
      bestFlow = top;
      break;
    }
    if (q >= power) {
      mask = m;
      found = true;
      const floor = top * 0.02;
      if (chargeAt(p, m, floor, room) >= power) {
        mdot = floor;
        below = true;
      } else {
        let lo = floor;
        let hi = top;
        for (let it = 0; it < 14; it++) {
          const mid = Math.sqrt(lo * hi);
          if (chargeAt(p, m, mid, room) >= power) hi = mid;
          else lo = mid;
        }
        mdot = lo;
        chargeAt(p, m, mdot, room);
      }
      break;
    }
  }
  if (bestMask === 0 || (!found && bestPower <= 0)) return;
  if (!found) {
    mask = bestMask;
    mdot = bestFlow;
    chargeAt(p, mask, mdot, room);
  } else if (below) {
    chargeAtPower(p, mask, mdot, power, room);
  }
  const Tair = 0.5 * (maskMeanT(p, mask) + s.chargeAirT);
  const cp = airCp(Tair);
  // bedLine ran last for the same mask and flow
  applyLine(p, mask, mdot, cp, ctrial.bedIn);
  out.mask = mask;
  out.mdot = mdot;
  out.heater = ctrial.heater;
  out.bedIn = ctrial.bedIn;
  out.bedOut = ctrial.bedOut;
  out.airHot = ctrial.airHot;
  out.fanAir = ctrial.fanAir;
  out.fanElectric = ctrial.fanElectric;
  out.dp = ctrial.dp;
  out.ductLoss = ctrial.ductLoss;
}

// ------------------------------------------------------------------------------------------------ one step

/** One step of the plant: the loops on the present temperatures, the stone moves, the counters run. */
export function stepPlant(p: Plant, c: Conditions, dt: number): void {
  const { net, spec, op, totals } = p;
  net.T[p.nodeAir] = c.outsideT;
  const room = c.outsideT + ROOM_OVER_OUTSIDE;
  net.T[p.nodeRoof] = room;
  refreshZones(p);
  refreshPipes(p);
  net.Q.fill(0);

  if (p.meanT >= spec.fullMeanT) p.full = true;
  else if (p.meanT < spec.fullMeanT - 1) p.full = false;
  const offered = p.full ? 0 : Math.min(c.chargeRequest, spec.chargePower);
  // a zone at the core limit is closed
  let tooHot = 0;
  for (let z = 0; z < 3; z++) if (p.zoneMaxT[z]! >= spec.coreLimit) tooHot |= 1 << z;

  solveDischarge(p, c, c.demand, false, tooHot, room);
  if (offered > 0 && (op.discharge.mask | tooHot) === ZONE_ALL) {
    // the heat and the charge both want the stone: the heat takes the zones that can hold it and leaves one for the charge
    net.Q.fill(0);
    solveDischarge(p, c, c.demand, true, tooHot, room);
  }
  solveCharge(p, c, offered, tooHot | op.discharge.mask, room);

  op.boiler = Math.max(0, c.demand - op.discharge.heat);
  const walls0 = totalBoundaryEnergy(net);
  stepNetwork(net, dt);
  op.wallLoss = (totalBoundaryEnergy(net) - walls0) / dt;

  // electricity: the two fans, the pump, the controls; then the riser and the transformer in front of them
  const heater = op.charge.heater;
  const pump = (op.discharge.water / 1000) * (PUMP_DP / PUMP_ETA);
  const aux = AUX_PER_MW * (spec.ratedPower / 1e6);
  const loads = heater + op.charge.fanElectric + op.discharge.fanElectric + pump + aux;
  const riser = riserLoss(loads);
  const grid = (loads + riser) / ETA_TRANSFORMER;
  op.electricity = grid;
  op.auxLoss = grid - heater - op.charge.fanAir - op.discharge.fanAir;

  totals.heater += heater * dt;
  totals.fanAir += (op.charge.fanAir + op.discharge.fanAir) * dt;
  totals.electricity += grid * dt;
  totals.auxLoss += op.auxLoss * dt;
  totals.heat += op.discharge.heat * dt;
  totals.boiler += op.boiler * dt;
  totals.ductLoss += (op.charge.ductLoss + op.discharge.ductLoss) * dt;
}

/** Mass of the bed, kg. */
export const totalMass = (p: Plant): number => p.mass;

/** Heat in the bed above a reference temperature, J. */
export function heatAbove(p: Plant, Tref: number): number {
  return totalEnthalpy(p.net) - p.mass * p.material.h(Tref);
}

/** Enthalpy balance since the last reset: what entered minus what left minus what is stored, J (zero to rounding). */
export function balanceError(p: Plant): number {
  const stored = totalEnthalpy(p.net) - p.h0;
  const t = p.totals;
  return t.heater + t.fanAir - t.heat - t.ductLoss - totalBoundaryEnergy(p.net) - stored;
}

/** Heat lost through the walls so far, J. */
export const wallEnergy = (p: Plant): number => totalBoundaryEnergy(p.net);

/** What the walls see now: the hottest inner shell, the hottest outside surface, °C; the mean edge of the bed. */
export function wallState(p: Plant, outsideT: number): { shell: number; surface: number; edge: number } {
  const { net, grid, sideLinks, sideArea } = p;
  const faces = grid.faces('xMax');
  let shell = -1e9;
  let surface = -1e9;
  let edge = 0;
  const areaEach = sideArea / sideLinks.length;
  for (let j = 0; j < sideLinks.length; j++) {
    const id = faces[j]!.node;
    const T = net.T[id]!;
    edge += T / sideLinks.length;
    // the insulation stands in the fixed part of the link; the half-cell in front of it is the conduction part
    const G = net.linkG[sideLinks[j]!]!;
    const q = G * (T - outsideT);
    const halfCell = 1 / (p.material.k(T) * faces[j]!.shape);
    if (T - q * halfCell > shell) shell = T - q * halfCell;
    const qArea = q / areaEach;
    if (outsideT + qArea / FILM_OUT > surface) surface = outsideT + qArea / FILM_OUT;
  }
  return { shell, surface, edge };
}

/**
 * The mean temperature of a uniform bed below which the plant can no longer hold a power at its supply temperature, °C: what a
 * rated-power discharge would come down to if the stone stayed even. By bisection, each trial in closed form.
 */
export function floorTemperature(
  p: Plant,
  c: Pick<Conditions, 'supplyT' | 'returnT' | 'outsideT'>,
  power: number,
): number {
  const s = p.spec;
  const room = c.outsideT + ROOM_OVER_OUTSIDE;
  const span = c.supplyT - c.returnT;
  const legs = legsOf(s);
  const factor = pipeCellFactor(pitchRadius(s.pitch), s.pipeRadius);
  const Tinlet = c.returnT + EXCHANGER_PINCH;
  const heatAt = (T: number): number => {
    const Tair = 0.5 * (T + Tinlet);
    const volume = blowerFlow(s.ratedPower, s.blowerPerMW);
    const mdot0 = volume * airRho(Tinlet);
    const dp0 = loopPressure(p, ZONE_ALL, mdot0, Tair, volume, volume);
    const mdot = dp0 > BLOWER_DP_MAX ? mdot0 * Math.sqrt(BLOWER_DP_MAX / dp0) : mdot0;
    const cp = airCp(Tair);
    const Ca = mdot * cp;
    const flow = tubeFlow(mdot / p.paths, p.pipeInner, gasAt(Tair));
    const gFilm = flow.h * Math.PI * p.pipeInner;
    const gStone = (2 * Math.PI * p.material.k(T)) / factor;
    const G = (legs * s.bedHeight) / (1 / gStone + 1 / gFilm);
    const B = Math.exp(-G / Ca);
    const A = T * (1 - B);
    const volumeNow = mdot / airRho(Tinlet);
    const dp = loopPressure(p, ZONE_ALL, mdot, Tair, volumeNow, volume);
    const b = (volumeNow * dp) / ETA_FAN / Ca;
    const d = Math.exp(-ductUA(s.ratedPower) / Ca);
    const UA =
      designExchangerUA(s.ratedPower) * Math.pow(mdot / designAirFlow(s.ratedPower, BLOWER_PER_MW), EXCHANGER_FLOW_EXP);
    const waterC = power / span;
    const eps = effectiveness(UA, Math.min(Ca, waterC), Math.max(Ca, waterC), 'counter');
    const phi = (eps * Math.min(Ca, waterC)) / Ca;
    const K0 = (1 - phi) * room * (1 - d) + phi * c.returnT + b;
    const out = (A + B * K0) / (1 - B * (1 - phi) * d);
    return phi * Ca * (room * (1 - d) + d * out - c.returnT);
  };
  let lo = c.returnT;
  let hi = 900;
  for (let i = 0; i < 30; i++) {
    const mid = 0.5 * (lo + hi);
    if (heatAt(mid) >= power) hi = mid;
    else lo = mid;
  }
  return hi;
}
