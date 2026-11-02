import {
  BASE_OVER_WALL,
  DUCT_VELOCITY,
  BLOWER_PER_MW,
  GRID_LAYERS,
  GRID_RINGS,
  PORNAINEN,
  ZONE_EDGES,
  ELEMENT_LIMIT,
} from '../sim/silo';

// The one source of the dimensions of the lab, in metres. The 3D worlds and the drawings read it; whatever the simulation owns is imported from
// `PORNAINEN`, never retyped. Every constant carries its tag:
//   reported  said by a source of docs/research.md (K and S numbers)
//   derived   computed from reported figures, the formula is beside it
//   estimate  the sources are silent: a choice of ours, with its reason. Marked « estimé » in the sheets and on the drawings.
//
// Frames. Silo frame: Y up from the ground at the foot of the slab, the axis of the silo at x = z = 0, azimuth a measured from +X towards +Z, so a point
// of the wall is (R cos a, y, R sin a). The `silo` and `plant-room` worlds are drawn in the silo frame itself; the `site` world moves the same silo into
// place with `SITE.silo` (a yaw and a translation), `silo-frame → site-frame` in `siteFromSilo`.

export const DEG = Math.PI / 180;

/** The zones of the model: outer radius of the core, middle and outer zones, m. estimate (the radii), reported as a principle (S6, S14). */
export const ZONE_R: readonly [number, number, number] = [
  ZONE_EDGES[0] * (PORNAINEN.bedDiameter / 2),
  ZONE_EDGES[1] * (PORNAINEN.bedDiameter / 2),
  ZONE_EDGES[2] * (PORNAINEN.bedDiameter / 2),
];

/** The grid of the model, cells across the radius and the height. The section is coloured from it. */
export const GRID = { rings: GRID_RINGS, layers: GRID_LAYERS } as const;

// ------------------------------------------------------------------------------------------------ the silo, the machine of §3 of the research

const baseInsulation = BASE_OVER_WALL * PORNAINEN.wallInsulation;
const slabH = PORNAINEN.stack.foundationAndBase - baseInsulation;

/** The levels of the stack, m above the ground. derived from `PORNAINEN.stack` (an estimate that sums to the reported 13 m). */
export const LEVEL = {
  ground: 0,
  /** Top of the foundation slab. */
  slabTop: slabH,
  /** Top of the base insulation, bottom of the bed. */
  bedBottom: PORNAINEN.stack.foundationAndBase,
  /** Top of the bed: reported 6 m of stone. */
  bedTop: PORNAINEN.stack.foundationAndBase + PORNAINEN.stack.bed,
  /** Top of the top insulation, underside of the deck. */
  deckBottom: PORNAINEN.stack.foundationAndBase + PORNAINEN.stack.bed + PORNAINEN.stack.topInsulation,
  /** Top of the steel deck: the floor of the equipment room. estimate: a 12 cm deck. */
  floor: PORNAINEN.stack.foundationAndBase + PORNAINEN.stack.bed + PORNAINEN.stack.topInsulation + 0.12,
  /** Underside of the ceiling of the room. estimate. */
  ceiling: PORNAINEN.totalHeight - PORNAINEN.stack.roof - 0.1,
  /** The eaves, where the cladding ends and the roof starts. derived from the stack. */
  eaves: PORNAINEN.totalHeight - PORNAINEN.stack.roof,
  /** Top of the hub of the roof: reported 13 m in all. */
  apex: PORNAINEN.totalHeight,
} as const;

export const SILO = {
  /** reported, about (K5): the outside radius of the wall, m. */
  outerR: PORNAINEN.outerDiameter / 2,
  /** reported, about (K5). */
  totalHeight: PORNAINEN.totalHeight,
  /** reported, about, from the maker's model (K6). */
  bedR: PORNAINEN.bedDiameter / 2,
  bedHeight: PORNAINEN.bedHeight,
  /** estimate, usual practice: a ring slab about 16 m across. */
  slabR: 8,
  slabH,
  /** estimate, the physics' value: base insulation, m. */
  baseInsulation,
  /** estimate: the inner steel shell. */
  shellT: 0.015,
  /** estimate, capped by the reported 0.5 m of build-up (physics §1.6). */
  wallInsulation: PORNAINEN.wallInsulation,
  /** derived: what is left of the 0.5 m for the cladding, ribs included. */
  claddingT: PORNAINEN.wallBuildUp - 0.015 - PORNAINEN.wallInsulation,
  /** estimate, from a maker's photograph (S14): ribs of the cladding around the wall, and their depth. */
  ribs: 120,
  ribDepth: 0.03,
  /** estimate: wall of the equipment room (a liner inside the cladding). */
  roomWallT: 0.06,
  /** estimate: the deck of the equipment room. */
  deckT: LEVEL.floor - LEVEL.deckBottom,
  /** estimate, from the photographs (S14): the roof, a low cone with a central hub. */
  roof: {
    eaveR: PORNAINEN.outerDiameter / 2 + 0.12,
    hubR: 0.85,
    hubH: 0.22,
    /** Standing seams on the cone. */
    seams: 48,
    thick: 0.12,
  },
} as const;

/** The radii of the wall layers, m. derived. */
export const WALL = {
  shellIn: SILO.bedR,
  shellOut: SILO.bedR + SILO.shellT,
  insulationOut: SILO.bedR + SILO.shellT + SILO.wallInsulation,
  claddingOut: SILO.outerR,
  /** Inside face of the room's wall. */
  roomIn: SILO.outerR - SILO.claddingT - SILO.roomWallT,
} as const;

// ------------------------------------------------------------------------------------------------ what hangs on the wall

/** Azimuths on the wall, degrees in the silo frame. estimate: chosen so that the runs inside the room are short and the wedge of the section keeps them. */
export const AZIMUTH = {
  /** The two water pipes, seen in a maker's photograph (S14); the place is ours. */
  water: -60,
  /** Half the angle between the two pipes. */
  waterSpread: 1.15,
  /** The cable riser. */
  cable: -150,
  /** The two high openings. */
  vents: [-30, 100],
  /** The caged ladder and the landing at the door of the equipment room. */
  ladder: 125,
} as const;

export const RISERS = {
  /** estimate: bare water pipe DN100 and its clad jacket (S14 shows two clad pipes). 1 MW over 40 K is about 6 kg/s, 0.8 m/s in DN100. */
  pipeR: 0.057,
  jacketR: 0.13,
  /** Distance of their axis from the axis of the silo. */
  axisR: SILO.outerR + 0.22,
  /** derived: where the pipes come through the wall: the deck plus 2.6 m. */
  topY: LEVEL.floor + 2.6,
  /** Where they go out over the slab's edge, and how deep they go into the ground (the trench's pipes). */
  elbowY: 1.05,
  outR: SILO.slabR + 0.42,
  /** derived: on the axis of the trench's pipes (depth 1.05, sand 0.16, radius of the jacket). */
  bottomY: -(1.05 - 0.16 - 0.13),
  /** Brackets on the wall. */
  bracketEvery: 2.4,
} as const;

export const CABLE_RISER = {
  /** estimate: a closed steel cable duct, width and depth. 1,443 A in parallel cables (K35). */
  width: 0.46,
  depth: 0.14,
  /** Off the cladding. */
  standoff: 0.05,
  /** The junction box on the ledge of the slab, its stub reaches the annex at the slab's edge. */
  boxH: 0.42,
  topY: LEVEL.floor + 2.75,
  bracketEvery: 2.2,
} as const;

export const LADDER = {
  /** estimate, usual practice for fixed ladders: rail spacing, rung spacing, hoops. */
  width: 0.46,
  rungEvery: 0.3,
  hoopFromY: 2.6,
  hoopEvery: 0.9,
  hoopR: 0.38,
  /** Distance of the rungs from the wall. */
  standoff: 0.2,
  /** The landing at the door. */
  landingY: LEVEL.floor,
  landingW: 1.5,
  landingD: 1.1,
  railH: 1.1,
  doorW: 0.95,
  doorH: 2.05,
} as const;

export const VENT = {
  /** estimate, seen in a photograph (S14), read as the ventilation of the room: width, height of a louvre, the height of its centre. */
  width: 1.5,
  height: 0.9,
  y: LEVEL.floor + 2.2,
  slats: 8,
  depth: 0.12,
} as const;

/** estimate: temperature lances, thin tubes from the deck into the stone at these radii, on the two section planes. */
export const LANCES = {
  r: 0.018,
  headR: 0.06,
  /** Radius (on +X, on the plane z = 0) and depth below the top of the bed. */
  onX: [
    [2.75, 2.5],
    [4.75, 3.5],
    [6.25, 2.5],
  ],
  /** Radius (on +Z, on the plane x = 0) and depth below the top of the bed. */
  onZ: [
    [1.25, 3.5],
    [5.25, 1.5],
  ],
} as const;

// ------------------------------------------------------------------------------------------------ the pipes

const pipeR = PORNAINEN.pipeOuterRadius;
const pitch = PORNAINEN.pitch;

export const PIPE = {
  /** estimate, sized by the physics (K42): outer radius of a leg, its wall, the square pitch. */
  r: pipeR,
  wall: PORNAINEN.pipeWall,
  pitch,
  /** derived: a U-pipe joins two neighbours, so the bend's centre-line radius is half the pitch. */
  bendR: pitch / 2,
  /** estimate: stone under the bend. */
  bendClearance: 0.1,
  /** derived: bottom of the straight part of a leg. */
  legBottom: LEVEL.bedBottom + 0.1 + pipeR + pitch / 2,
  /** derived: the straight part ends at the top of the bed; the expansion loop starts there. */
  legTop: LEVEL.bedTop,
  /** Headers: the two of a row (the side of the row that feeds, the side that returns), their offset from the row, radius, height of the axis. */
  headerOffset: 0.11,
  headerR: 0.065,
  headerY: LEVEL.bedTop + 0.5,
  /** estimate: the expansion loop, how far it goes sideways and how high: room for the 5 cm of growth (K41). */
  loopWidth: 0.17,
  /** Spacers: heights of the two frames, the size of their bars, their collars. */
  spacerYs: [LEVEL.bedBottom + 2, LEVEL.bedBottom + 4],
  barW: 0.05,
  barH: 0.012,
  collarR: pipeR + 0.012,
  collarH: 0.05,
  /** Ring mains over the headers: their radii (one per zone) and heights (the feeding side, the returning side), radius. */
  ringR: [2.1, 4.9, 6.3] as readonly number[],
  ringY: [LEVEL.bedTop + 0.68, LEVEL.bedTop + 0.84] as readonly number[],
  ringPipeR: 0.075,
} as const;

/** derived: the growth of a 6 m stainless pipe over 500 K, m (K41: about 5 cm). */
export const PIPE_GROWTH = 17e-6 * PORNAINEN.bedHeight * 500;

/** derived: main duct, inside radius for the blower's flow at the duct velocity of the model (research: about 0.63 m inside). */
export const MAIN_DUCT_INNER_R = Math.sqrt(BLOWER_PER_MW / (Math.PI * DUCT_VELOCITY));

// ------------------------------------------------------------------------------------------------ the equipment room

/**
 * The room, in the order the current and the heat flow, all on the back half of the deck (z < 0), so that the visitor reads it from left to right.
 * Everything here is an estimate of size and place: the research reports the blowers (two loops assumed), the resistors, the exchanger and the dampers, not
 * their arrangement, and the floor itself is a reading (research §0.2 point 6). y is above the deck (`LEVEL.floor`).
 */
export const PLANT = {
  /** The zones' risers go through the deck on the plane z = 0: x of the centre of each zone's pair (core, middle, outer), half the gap of a pair. */
  zoneX: [-1.6, 0, 1.6] as readonly number[],
  pairHalf: 0.35,
  /** estimate: a zone's duct (inner radius), the jacket adds to it. */
  riserR: 0.18,
  jacket: 0.055,
  /** derived from MAIN_DUCT_INNER_R: a main duct with its jacket. */
  mainR: MAIN_DUCT_INNER_R + 0.055,
  /** The four headers along x: the hot one of the charge, the return of the charge, the hot one of the discharge, the cold one of the discharge. */
  header: {
    x0: -2.15,
    x1: 2.15,
    hot: { y: 2.25, z: -0.95 },
    back: { y: 0.95, z: -0.95 },
    out: { y: 2.25, z: -2.2 },
    cold: { y: 0.95, z: -2.2 },
  },
  /** Heights of the branches: from the feeding riser to the two loops, from the returning riser to the two loops. */
  branch: { feedHigh: 2.25, feedLow: 0.3, backLow: 0.95, backHigh: 2.9 },
  /** A damper box: width (x), height, length (z) and where it sits on its branch. */
  damper: { w: 0.5, h: 0.5, l: 0.26, nearZ: -0.4, farZ: -1.62 },
  /** The resistor bank (research: about 3 × 1.2 × 1.2 m). Long axis on z, the air flows towards +z. */
  bank: {
    x: -3.2,
    y: 1.9,
    z0: -4.75,
    z1: -1.75,
    w: 1.2,
    h: 1.2,
    hood: 0.3,
    stages: 4,
    elementsPerStage: 7,
    elementR: 0.018,
  },
  /** A blower: volute, width, impeller, shaft height, motor. Research: 2 × about 5 m³/s, 20 to 35 kW. */
  blower: {
    voluteR: 0.62,
    voluteGrow: 0.3,
    width: 0.52,
    impellerR: 0.52,
    blades: 12,
    axisY: 1.2,
    shaftR: 0.035,
    couplingR: 0.11,
    couplingW: 0.12,
    motorR: 0.27,
    motorL: 0.82,
    inletR: 0.31,
    inletL: 0.3,
    neck: 0.5,
    baseH: 0.14,
  },
  chargeBlower: { x: -3.2, z: -5.45 },
  dischargeBlower: { x: 4.25, z: -4.3 },
  /** The air-to-water exchanger: length along the air, depth, height, its centre. Research: 1 MW; size estimated from the air flow at about 3 m/s. */
  exchanger: { x0: 2.55, x1: 4.35, z: -2.2, y: 1.9, depth: 1.4, h: 1.4, hood: 0.36, bendsRows: 5, bendsCols: 7 },
  /** Cabinets: x, z of the centre of the back, width, depth, height, the way the door looks (radians about y from +z). */
  switchboard: { x: -6.8, z: -1.3, w: 2.4, d: 0.6, h: 2.1, bays: 4, face: Math.PI / 2 },
  controller: { x: -5.9, z: -3.2, w: 1.2, d: 0.6, h: 2.1, face: Math.PI / 2 },
  drive: { x: -1.0, z: -6.8, w: 1.2, d: 0.5, h: 2.0, face: 0 },
  control: { x: 0.55, z: -6.8, w: 1.0, d: 0.45, h: 2.0, face: 0 },
  /** The rails under the ceiling that carry the rods, along x, at these z; the trays and pipes hang from them. */
  railY: 3.18,
  railZ: [-0.95, -2.2, -3.4, -4.6, -5.8] as readonly number[],
  railW: 0.04,
  /** The trays. */
  trayY: 3.02,
  trayW: 0.34,
  /** The network pipes in the room: lower and upper level, x of the two runs over the exchanger. */
  water: { highY: 2.85, returnX: 2.72, supplyX: 3.95 },
  /** The pump: centre, shaft height; the meter on the supply; the vessel by the return. */
  pump: {
    x: 2.6,
    z: -5.7,
    axisY: 0.45,
    voluteR: 0.2,
    width: 0.14,
    motorR: 0.14,
    motorL: 0.5,
    couplingR: 0.075,
    baseH: 0.12,
    nozzleR: 0.07,
  },
  meter: { z: -4.7, bodyL: 0.42, boxW: 0.22 },
  vessel: { x: 1.35, z: -5.2, r: 0.27, h: 1.3 },
  /** The lamps along the ceiling and the things that make it a room (not parts). */
  lamps: 3,
} as const;

/** The resistor's limit, for the false-colour glow: imported from the simulation. */
export const ELEMENT_MAX = ELEMENT_LIMIT;

/** The ducts of a zone cross the top insulation here. estimate: a jacket and a collar, the weak point of any insulation. */
export const PENETRATION = {
  collarR: PLANT.riserR + PLANT.jacket + 0.13,
  collarH: 0.14,
  bottom: LEVEL.bedTop + 0.84,
} as const;

// ------------------------------------------------------------------------------------------------ the pipe cell

/** One block of bed around a few pipes. reported as a world by the research (about 2 m wide), the rest follows the pipes. */
export const CELL = {
  /** A block is four pitches wide and deep. derived. */
  n: 4,
  /** estimate: centre of each of the two blocks, and the plinth they stand on (the base of the silo at the same scale). */
  coreX: -1.55,
  outerX: 1.55,
  plinthH: LEVEL.bedBottom,
  plinthPad: 0.12,
  /** The two samples of grains on the table, in front: a tray of each, magnified. */
  tray: { w: 0.62, d: 0.62, h: 0.05, z: 0.7, sandX: -3.3, soapX: 3.3, standH: 1.15, grainsSand: 900, grainsSoap: 620 },
  /** estimate, generous: the size of a grain as drawn (the real ones are far smaller and they say so on the sheet). */
  magnified: { sand: 0.022, soap: 0.04 },
} as const;

/** derived: a block's half width. */
export const CELL_HALF = (CELL.n * PIPE.pitch) / 2;

// ------------------------------------------------------------------------------------------------ the site

/** Everything in the village is scenery of ours: generic, at true scale, never the real plot. Only the yard's size is reported (S2, for the 2 MW product). */
export const SITE = {
  /** The same silo, moved into place. estimate: chosen so that its two pipes and its cable face the road. */
  silo: { x: 0, z: 0, yawDeg: 155 },
  /** reported for the 2 MW product (S2): a plot of about 20 × 30 m. */
  yard: { x0: -10, x1: 10, z0: -9.5, z1: 20.5, fenceH: 2.0, postEvery: 2.5, gateX: -3, gateW: 4 },
  /** Annex at the foot, seen in a photograph (S14): 6 × 3 × 3 m (estimate), its long wall tangent to the slab under the cable riser. */
  annex: { length: 6, depth: 3, height: 3, roofH: 0.25 },
  /** Transformer on its pad: 20 kV to 400 V, about 1,250 kVA (estimate, K35). Pad, tank. */
  transformer: {
    x: 6,
    z: 14.5,
    padW: 3.2,
    padD: 2.8,
    padH: 0.2,
    tankW: 1.7,
    tankD: 1.1,
    tankH: 1.5,
    finsEach: 9,
    poleX: 12.5,
    poleZ: 14.5,
  },
  /** The medium-voltage line (generic): poles, height, and the sag of its span. */
  line: {
    poles: [
      [12.5, 14.5],
      [48, 9],
      [86, -7],
      [126, -30],
      [168, -58],
      [214, -92],
    ] as readonly (readonly [number, number])[],
    poleH: 9.5,
    crossArm: 1.9,
    sag: 0.9,
  },
  /** A generic solar field: rows, panels in a row, a panel's size. */
  solar: {
    x0: 36,
    z0: -62,
    rows: 6,
    rowEvery: 7.5,
    panels: 20,
    panelW: 1.05,
    panelL: 2.1,
    tiltDeg: 40,
    postH: 0.55,
    yawDeg: 180,
  },
  /** A far wind farm on the ridge: reference size of a current onshore machine. */
  wind: {
    turbines: [
      [-320, -1050],
      [-60, -1210],
      [190, -1000],
      [430, -1170],
      [660, -1020],
      [-560, -1260],
    ] as readonly (readonly [number, number])[],
    hub: 112,
    rotorR: 62,
    towerR: 2.1,
  },
  /** The wood-chip boiler kept as a backup (reported, S3), generic in shape: hall, its chip store with a conveyor, the stack. */
  boiler: {
    x: -21,
    z: -14,
    length: 16,
    width: 10,
    height: 7.5,
    storeL: 8,
    storeW: 6,
    storeH: 5,
    stackH: 22,
    stackR: 0.55,
  },
  /** The network's trench, drawn open: width, depth, the bed of sand. Polyline from the foot of the pipes to the school and the house. Generic (S19 4:51). */
  trench: {
    width: 1.3,
    depth: 1.05,
    sand: 0.16,
    pipeR: 0.13,
    gap: 0.14,
    path: [
      [-7.17, 5.02],
      [-13, 12],
      [-13, 21.5],
      [-40, 21.5],
      [-64, 21.5],
    ] as readonly (readonly [number, number])[],
    /** The spur into the school. */
    schoolSpur: [
      [-40, 21.5],
      [-40, 8.5],
    ] as readonly (readonly [number, number])[],
    /** The spur to the boiler plant. */
    boilerSpur: [
      [-13, 12],
      [-16.5, -9],
    ] as readonly (readonly [number, number])[],
  },
  /** The school: long body, wing, roof. */
  school: { x: -46, z: 2.5, length: 34, width: 12, storeyH: 3.4, storeys: 2, roofH: 2.6 },
  /** The house with the open cellar, on the end of the trench. */
  substationHouse: { x: -72, z: 21.5, length: 10, width: 7.5, wallH: 3.4, roofH: 3.2, plinthH: 0.5 },
  /** The pit that opens its cellar. */
  cellar: { x0: -67, x1: -63.4, z0: 18.8, z1: 24.2, depth: 2.3 },
  /** The road and the drive to the gate. */
  road: { width: 6, z: 28, driveW: 4.5 },
} as const;

/** The silo frame's point on the wall at an azimuth. */
export function wallPoint(azDeg: number, r: number, y: number): [number, number, number] {
  return [r * Math.cos(azDeg * DEG), y, r * Math.sin(azDeg * DEG)];
}

/** Silo frame → site frame: the rotation `rotation.y = yaw` of three.js, then the translation. */
export function siteFromSilo(x: number, y: number, z: number): [number, number, number] {
  const a = SITE.silo.yawDeg * DEG;
  return [x * Math.cos(a) + z * Math.sin(a) + SITE.silo.x, y, -x * Math.sin(a) + z * Math.cos(a) + SITE.silo.z];
}
