import * as THREE from 'three';
import { MAT, emissive, mesh } from '@onigam/lab-kit/three';
import { TAU, box, joined, stick, v3 } from '../common';
import { SITE } from '../dims';
import { boardsMap, concreteMap, roofSheetMap, tiled } from '../textures';
import { patchSnow } from './snow';
import type { HousePlan } from './terrain';

// The buildings of the village at true scale, every one from these few functions: boarded walls in the colours of the country (Falun red, ochre, white, a pale grey), steep sheet roofs that hold
// the snow, white frames, dark glass, a stone plinth, a chimney. The school is the same language at school size; the boiler plant a clad steel hall with its chip store, its conveyor and its stack.
// No sign, no text. Everything stands on its pad: the foot of each building is at y = 0 of its group.

export const WALL_COLOURS = [0x8a2f25, 0xc79a4a, 0xe6e0d0, 0x8fa2a3] as const;

export interface BuildingMaterials {
  walls: THREE.MeshStandardMaterial[];
  roof: THREE.MeshStandardMaterial;
  roofRed: THREE.MeshStandardMaterial;
  plinth: THREE.MeshStandardMaterial;
  frame: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  door: THREE.MeshStandardMaterial;
  chimney: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  concrete: THREE.MeshStandardMaterial;
  cladHall: THREE.MeshStandardMaterial;
}

export function buildingMaterials(): BuildingMaterials {
  const boards = boardsMap();
  const sheet = roofSheetMap();
  const wall = (hex: number) =>
    new THREE.MeshStandardMaterial({ color: hex, map: tiled(boards, 1 / 1.4), roughness: 0.82 });
  const roofMat = (hex: number) =>
    patchSnow(
      new THREE.MeshStandardMaterial({ color: hex, map: tiled(sheet, 1 / 1.4), roughness: 0.66, metalness: 0.3 }),
      { lo: 0.3, hi: 0.62 },
    );
  return {
    walls: WALL_COLOURS.map(wall),
    roof: roofMat(0x3d4245),
    roofRed: roofMat(0x6a2c25),
    plinth: new THREE.MeshStandardMaterial({ color: 0x6f6a62, roughness: 0.96 }),
    frame: new THREE.MeshStandardMaterial({ color: 0xf0ece1, roughness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x2a343b, roughness: 0.16, metalness: 0.55 }),
    door: new THREE.MeshStandardMaterial({ color: 0x47392d, roughness: 0.7 }),
    chimney: new THREE.MeshStandardMaterial({ color: 0x7c6f64, roughness: 0.92 }),
    metal: patchSnow(MAT.steel(), { lo: 0.6, hi: 0.9 }),
    concrete: patchSnow(
      new THREE.MeshStandardMaterial({ color: 0xffffff, map: tiled(concreteMap(), 0.5), roughness: 0.95 }),
      { lo: 0.6, hi: 0.9 },
    ),
    cladHall: new THREE.MeshStandardMaterial({
      color: 0x6f7c78,
      map: tiled(sheet, 1 / 1.1),
      roughness: 0.6,
      metalness: 0.35,
    }),
  };
}

/** A box whose faces have UVs in metres (boards keep their width whatever the wall). */
export function metricBox(
  cx: number,
  cy: number,
  cz: number,
  sx: number,
  sy: number,
  sz: number,
): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // the order of BoxGeometry's faces: +x, -x, +y, -y, +z, -z, four vertices each
  const dims = [
    [sz, sy],
    [sz, sy],
    [sx, sz],
    [sx, sz],
    [sx, sy],
    [sx, sy],
  ];
  for (let f = 0; f < 6; f++)
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, uv.getX(k) * dims[f][0], uv.getY(k) * dims[f][1]);
    }
  g.translate(cx, cy, cz);
  return g;
}

/** The two slopes and their gable triangles of a pitched roof, its ridge along X. */
function roofGeo(
  length: number,
  width: number,
  wallH: number,
  roofH: number,
  over: number,
): { slopes: THREE.BufferGeometry; gables: THREE.BufferGeometry } {
  const L = length / 2 + over;
  const W = width / 2 + over * 0.8;
  const R = wallH + roofH;
  const yEave = wallH - (over * 0.8 * roofH) / (width / 2);
  const thick = 0.1;
  const pos: number[] = [];
  const uv: number[] = [];
  const quad = (a: number[], b: number[], c: number[], d: number[], uu: number, vv: number) => {
    for (const [q, u, v] of [
      [a, 0, 0],
      [b, uu, 0],
      [c, uu, vv],
      [a, 0, 0],
      [c, uu, vv],
      [d, 0, vv],
    ] as [number[], number, number][]) {
      pos.push(q[0], q[1], q[2]);
      uv.push(u, v);
    }
  };
  const slopeLen = Math.hypot(W, R - yEave);
  // top faces, from the eave to the ridge (outward)
  quad([-L, yEave, W], [L, yEave, W], [L, R, 0], [-L, R, 0], 2 * L, slopeLen);
  quad([L, yEave, -W], [-L, yEave, -W], [-L, R, 0], [L, R, 0], 2 * L, slopeLen);
  // the eave's edge and the soffit
  quad([L, yEave - thick, W], [L, yEave, W], [-L, yEave, W], [-L, yEave - thick, W], 2 * L, thick);
  quad([-L, yEave - thick, -W], [-L, yEave, -W], [L, yEave, -W], [L, yEave - thick, -W], 2 * L, thick);
  quad(
    [-L, yEave - thick, W],
    [-L, wallH - 0.05, W - over * 0.8],
    [L, wallH - 0.05, W - over * 0.8],
    [L, yEave - thick, W],
    2 * L,
    0.5,
  );
  quad(
    [L, yEave - thick, -W],
    [L, wallH - 0.05, -W + over * 0.8],
    [-L, wallH - 0.05, -W + over * 0.8],
    [-L, yEave - thick, -W],
    2 * L,
    0.5,
  );
  // verges
  quad([L, yEave, W], [L, R, 0], [L, R - thick, 0], [L, yEave - thick, W], slopeLen, thick);
  quad([L, R, 0], [L, yEave, -W], [L, yEave - thick, -W], [L, R - thick, 0], slopeLen, thick);
  quad([-L, R, 0], [-L, yEave, W], [-L, yEave - thick, W], [-L, R - thick, 0], slopeLen, thick);
  quad([-L, yEave, -W], [-L, R, 0], [-L, R - thick, 0], [-L, yEave - thick, -W], slopeLen, thick);
  const slopes = new THREE.BufferGeometry();
  slopes.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  slopes.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  slopes.computeVertexNormals();

  // the gable triangles, flush with the end walls
  const gx = length / 2;
  const hw = width / 2;
  const gpos = [gx, wallH, hw, gx, wallH, -hw, gx, R - 0.04, 0, -gx, wallH, -hw, -gx, wallH, hw, -gx, R - 0.04, 0];
  const guv = [0, 0, width, 0, width / 2, roofH, 0, 0, width, 0, width / 2, roofH];
  const gables = new THREE.BufferGeometry();
  gables.setAttribute('position', new THREE.Float32BufferAttribute(gpos, 3));
  gables.setAttribute('uv', new THREE.Float32BufferAttribute(guv, 2));
  gables.computeVertexNormals();
  return { slopes, gables };
}

interface WindowOpts {
  w: number;
  h: number;
}

/** A window on a wall facing +Z at (x, y, z): a white frame, two panes, a sill; in world axes after `yawFace`. */
function windowGeos(
  x: number,
  y: number,
  z: number,
  o: WindowOpts,
  faceX: boolean,
  sign: 1 | -1,
  out: { frame: THREE.BufferGeometry[]; glass: THREE.BufferGeometry[] },
): void {
  const d = 0.05;
  const put = (
    cu: number,
    cv: number,
    su: number,
    sv: number,
    sd: number,
    offs: number,
    list: THREE.BufferGeometry[],
  ) => {
    if (faceX) list.push(box(x + sign * offs, cv, cu, sd, sv, su));
    else list.push(box(cu, cv, z + sign * offs, su, sv, sd));
  };
  const base = faceX ? z : x;
  const f = 0.055;
  // the glass sits a little in
  put(base, y, o.w - 2 * f, o.h - 2 * f, 0.02, 0.015, out.glass);
  // frame: head, sill, jambs, a mullion
  put(base, y + o.h / 2 - f / 2, o.w, f, d, d / 2, out.frame);
  put(base, y - o.h / 2 + f / 2, o.w, f, d, d / 2, out.frame);
  put(base - o.w / 2 + f / 2, y, f, o.h, d, d / 2, out.frame);
  put(base + o.w / 2 - f / 2, y, f, o.h, d, d / 2, out.frame);
  put(base, y, 0.04, o.h - 2 * f, d * 0.8, d / 2, out.frame);
  put(base, y - o.h / 2 - 0.02, o.w + 0.1, 0.04, 0.12, 0.06, out.frame);
}

export interface HouseOptions {
  length: number;
  width: number;
  wallH: number;
  roofH: number;
  colour: number;
  plinth: number;
}

/** A house: its long walls along X, the door on +Z. The foot of its plinth at y = 0. */
export function buildHouse(_m: BuildingMaterials, o: HouseOptions, parts: HouseParts): void {
  const { length: L, width: W, wallH, roofH, plinth: P } = o;
  const wallTop = P + wallH;
  parts.plinth.push(metricBox(0, P / 2, 0, L + 0.08, P, W + 0.08));
  parts.walls[o.colour].push(metricBox(0, P + wallH / 2, 0, L, wallH, W));
  const r = roofGeo(L, W, wallTop, roofH, 0.42);
  parts.roof.push(r.slopes);
  parts.walls[o.colour].push(r.gables);
  const out = { frame: parts.frame, glass: parts.glass };
  // windows on the long walls, the door in the middle of the front
  const n = Math.max(2, Math.floor((L - 1.2) / 2.1));
  const wy = P + wallH * 0.56;
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + (L * (i + 0.5)) / n;
    if (Math.abs(x) > 0.75) windowGeos(x, wy, W / 2, { w: 1.1, h: 1.25 }, false, 1, out);
    windowGeos(x, wy, -W / 2, { w: 1.1, h: 1.25 }, false, -1, out);
    if (wallH > 4.6) {
      windowGeos(x, wy + 2.6, W / 2, { w: 1.0, h: 1.1 }, false, 1, out);
      windowGeos(x, wy + 2.6, -W / 2, { w: 1.0, h: 1.1 }, false, -1, out);
    }
  }
  // gable windows
  windowGeos(0, wallTop - 0.1 + roofH * 0.34, 0, { w: 0.8, h: 0.9 }, true, 1, {
    frame: parts.frame,
    glass: parts.glass,
  });
  // the door and its steps
  parts.door.push(box(0, P + 1.02, W / 2 + 0.03, 0.95, 2.05, 0.06));
  parts.frame.push(
    box(0, P + 2.1, W / 2 + 0.035, 1.14, 0.08, 0.07),
    box(-0.53, P + 1.04, W / 2 + 0.035, 0.08, 2.08, 0.07),
    box(0.53, P + 1.04, W / 2 + 0.035, 0.08, 2.08, 0.07),
  );
  for (let s = 0; s < 2; s++)
    parts.plinth.push(
      metricBox(
        0,
        ((s + 0.5) * P) / 2,
        W / 2 + 0.2 + (1 - s) * 0.3,
        1.5,
        (P * (s + 1)) / 2 - (s * P) / 2 + 0.001,
        0.32,
      ),
    );
  // the chimney through the ridge
  parts.chimney.push(metricBox(L * 0.2, wallTop + roofH * 0.52, 0.2, 0.6, roofH + 0.75, 0.5));
  parts.chimney.push(metricBox(L * 0.2, wallTop + roofH + 0.42, 0.2, 0.68, 0.08, 0.58));
}

/** The geometry lists of many buildings, one draw call per material in the end. */
export interface HouseParts {
  walls: THREE.BufferGeometry[][];
  roof: THREE.BufferGeometry[];
  plinth: THREE.BufferGeometry[];
  frame: THREE.BufferGeometry[];
  glass: THREE.BufferGeometry[];
  door: THREE.BufferGeometry[];
  chimney: THREE.BufferGeometry[];
}

export const newHouseParts = (): HouseParts => ({
  walls: WALL_COLOURS.map(() => []),
  roof: [],
  plinth: [],
  frame: [],
  glass: [],
  door: [],
  chimney: [],
});

export function buildVillageHouses(m: BuildingMaterials, plans: HousePlan[]): THREE.Group {
  const parts = newHouseParts();
  const q = new THREE.Quaternion();
  const up = v3(0, 1, 0);
  const one = v3(1, 1, 1);
  for (const h of plans) {
    const own = newHouseParts();
    buildHouse(
      m,
      {
        length: h.length,
        width: h.width,
        wallH: h.floors === 2 ? 5.6 : 3.1,
        roofH: h.width * 0.42,
        colour: h.colour,
        plinth: 0.45,
      },
      own,
    );
    const mat = new THREE.Matrix4().compose(v3(h.x, 0, h.z), q.setFromAxisAngle(up, h.yaw), one);
    const push = (from: THREE.BufferGeometry[], to: THREE.BufferGeometry[]) => {
      for (const g of from) {
        g.applyMatrix4(mat);
        to.push(g);
      }
    };
    own.walls.forEach((list, i) => push(list, parts.walls[i]));
    push(own.roof, parts.roof);
    push(own.plinth, parts.plinth);
    push(own.frame, parts.frame);
    push(own.glass, parts.glass);
    push(own.door, parts.door);
    push(own.chimney, parts.chimney);
  }
  return partsToGroup(m, parts, 'houses');
}

export function partsToGroup(m: BuildingMaterials, parts: HouseParts, name: string): THREE.Group {
  const g = new THREE.Group();
  g.name = name;
  parts.walls.forEach((list, i) => {
    if (list.length) g.add(mesh(joined(list), m.walls[i]));
  });
  if (parts.roof.length) g.add(mesh(joined(parts.roof), m.roof));
  if (parts.plinth.length) g.add(mesh(joined(parts.plinth), m.plinth));
  if (parts.frame.length) g.add(mesh(joined(parts.frame), m.frame));
  if (parts.glass.length) g.add(mesh(joined(parts.glass), m.glass));
  if (parts.door.length) g.add(mesh(joined(parts.door), m.door));
  if (parts.chimney.length) g.add(mesh(joined(parts.chimney), m.chimney));
  return g;
}

// ------------------------------------------------------------------------------------------------ the school

export interface SchoolBuild {
  group: THREE.Group;
  /** Where the spur of the trench reaches its wall. */
  inlet: THREE.Vector3;
  windows: THREE.MeshStandardMaterial;
}

/** A long two-storey school: boarded in ochre, a white band, big windows, a porch, a flagpole. Its long sides along X. */
export function buildSchool(m: BuildingMaterials): SchoolBuild {
  const s = SITE.school;
  const P = 0.55;
  const H = s.storeys * s.storeyH;
  const parts = newHouseParts();
  const L = s.length;
  const W = s.width;
  const top = P + H;
  parts.plinth.push(metricBox(0, P / 2, 0, L + 0.08, P, W + 0.08));
  parts.walls[1].push(metricBox(0, P + H / 2, 0, L, H, W));
  const r = roofGeo(L, W, top, s.roofH, 0.55);
  parts.roof.push(r.slopes);
  parts.walls[1].push(r.gables);
  // a white band between the storeys
  parts.frame.push(
    box(0, P + s.storeyH, W / 2 + 0.03, L, 0.12, 0.05),
    box(0, P + s.storeyH, -W / 2 - 0.03, L, 0.12, 0.05),
  );
  const out = { frame: parts.frame, glass: parts.glass };
  const bays = 13;
  for (let i = 0; i < bays; i++) {
    const x = -L / 2 + (L * (i + 0.5)) / bays;
    for (let st = 0; st < s.storeys; st++) {
      const y = P + st * s.storeyH + s.storeyH * 0.55;
      if (st > 0 || Math.abs(x) > 2) windowGeos(x, y, W / 2, { w: 1.7, h: 1.8 }, false, 1, out);
      windowGeos(x, y, -W / 2, { w: 1.7, h: 1.8 }, false, -1, out);
    }
  }
  // the entrance: a porch with a low roof, a double door
  const pz = W / 2;
  parts.door.push(box(0, P + 1.15, pz + 0.04, 2.1, 2.3, 0.08));
  parts.frame.push(box(0, P + 2.35, pz + 0.05, 2.3, 0.1, 0.09));
  parts.frame.push(box(0, P + 1.15, pz + 0.06, 0.05, 2.3, 0.1));
  parts.plinth.push(metricBox(0, 0.14, pz + 1.3, 6, 0.28, 2.6));
  parts.plinth.push(metricBox(0, 0.42, pz + 0.75, 5, 0.28, 1.5));
  const porch = roofGeo(5, 3.2, P + 2.9, 0.7, 0.2);
  porch.slopes.rotateY(Math.PI / 2);
  porch.slopes.translate(0, 0, pz + 1.6);
  porch.gables.rotateY(Math.PI / 2);
  porch.gables.translate(0, 0, pz + 1.6);
  parts.roof.push(porch.slopes);
  parts.walls[2].push(porch.gables);
  for (const dx of [-1.5, 1.5]) parts.frame.push(box(dx, (0.56 + P + 2.9) / 2, pz + 3, 0.14, P + 2.9 - 0.56, 0.14));
  parts.frame.push(box(0, P + 2.84, pz + 3, 3.4, 0.14, 0.14));
  // two chimneys, a ventilation hood
  parts.chimney.push(metricBox(-8, top + s.roofH * 0.55, 0.8, 0.7, s.roofH + 0.9, 0.6));
  parts.chimney.push(metricBox(9, top + s.roofH * 0.55, -0.8, 0.7, s.roofH + 0.9, 0.6));
  const g = partsToGroup(m, parts, 'school');
  // a flagpole on the lawn, a bicycle rack, a bench: what makes it a school
  const pole = mesh(stick(v3(-6, 0, W / 2 + 7), v3(-6, 9, W / 2 + 7), 0.05, 8), m.frame);
  g.add(pole);
  g.add(mesh(box(-6, 0.1, W / 2 + 7, 0.5, 0.2, 0.5), m.concrete));
  const rack: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 9; i++)
    rack.push(stick(v3(6 + i * 0.7, 0, W / 2 + 4), v3(6 + i * 0.7, 0.7, W / 2 + 4), 0.018, 5));
  rack.push(stick(v3(6, 0.7, W / 2 + 4), v3(6 + 8 * 0.7, 0.7, W / 2 + 4), 0.018, 5));
  g.add(mesh(joined(rack), m.metal));
  g.position.set(s.x, 0, s.z);
  const lit = emissive(0xffd9a0, 0);
  lit.userData.noShare = true;
  // where the network's pipes reach the south wall
  return { group: g, inlet: v3(SITE.trench.schoolSpur[1][0], 0, s.z + W / 2), windows: lit };
}

// ------------------------------------------------------------------------------------------------ the boiler plant and its stack

export interface BoilerBuild {
  hall: THREE.Group;
  stack: THREE.Group;
  /** Top of the stack, for the smoke. */
  stackTop: THREE.Vector3;
  /** The flue's end on the stack and on the hall. */
  flue: { hall: THREE.Vector3; stack: THREE.Vector3 };
}

/** The boiler plant, kept as a backup (reported, S3): a clad steel hall, a chip store with an inclined conveyor, a big door. The stack is a part of its own. */
export function buildBoiler(m: BuildingMaterials): BoilerBuild {
  const b = SITE.boiler;
  const hall = new THREE.Group();
  hall.name = 'boiler-hall';
  const L = b.length;
  const W = b.width;
  const H = b.height;
  // the hall, its low roof, a band
  hall.add(mesh(metricBox(0, H / 2 + 0.2, 0, L, H - 0.4 + 0.4, W), m.cladHall));
  hall.add(mesh(box(0, 0.2, 0, L + 0.06, 0.4, W + 0.06), m.concrete));
  const r = roofGeo(L, W, H + 0.2, 1.1, 0.25);
  hall.add(mesh(r.slopes, m.roof));
  hall.add(mesh(r.gables, m.cladHall));
  // the big door on the front, windows high up, small personnel door
  hall.add(mesh(box(-L / 2 + 3.5, 2.3, W / 2 + 0.05, 4.2, 4.2, 0.1), m.door));
  const lines: THREE.BufferGeometry[] = [];
  for (let i = 1; i < 6; i++) lines.push(box(-L / 2 + 3.5, 0.5 + (i * 4.2) / 6, W / 2 + 0.11, 4.2, 0.03, 0.02));
  hall.add(mesh(joined(lines), m.frame));
  const out = { frame: [] as THREE.BufferGeometry[], glass: [] as THREE.BufferGeometry[] };
  for (let i = 0; i < 4; i++) windowGeos(1 + i * 1.8, H - 1.2, W / 2, { w: 1.3, h: 1 }, false, 1, out);
  hall.add(mesh(joined(out.frame), m.frame));
  hall.add(mesh(joined(out.glass), m.glass));
  hall.add(mesh(box(L / 2 - 2, 1.05, W / 2 + 0.03, 1, 2.05, 0.06), m.door));
  // the chip store on the east end, its conveyor rising into the hall
  const sx = L / 2 + b.storeL / 2 + 0.1;
  hall.add(mesh(box(sx, 1.2, 0, b.storeL, 2.4, b.storeW), m.concrete));
  const roofStore = roofGeo(b.storeL, b.storeW, b.storeH - 0.8, 0.8, 0.18);
  roofStore.slopes.translate(sx, 0, 0);
  roofStore.gables.translate(sx, 0, 0);
  hall.add(mesh(roofStore.slopes, m.roof));
  hall.add(mesh(roofStore.gables, m.cladHall));
  hall.add(mesh(box(sx, (2.4 + b.storeH - 0.8) / 2, 0, b.storeL, b.storeH - 0.8 - 2.4, b.storeW), m.cladHall));
  const conv = stick(v3(sx - 1, 2, W / 2 - 1.5), v3(L / 2 - 0.1, H * 0.76, W / 2 - 1.5), 0.42, 4);
  hall.add(mesh(conv, m.metal));
  hall.add(mesh(stick(v3(sx - 0.4, 0, W / 2 - 1.5), v3(sx - 0.4, 2.2, W / 2 - 1.5), 0.08, 6), m.metal));

  // ---- the stack: a steel chimney on a concrete foot, the flue from the hall's roof, guy wires to the ground
  const stack = new THREE.Group();
  stack.name = 'boiler-stack';
  const stackX = -L / 2 - 2;
  const stackZ = -W / 2 + 1.5;
  stack.add(mesh(box(stackX, 0.25, stackZ, 2.2, 0.5, 2.2), m.concrete));
  const mat = MAT.steel();
  stack.add(
    mesh(
      new THREE.CylinderGeometry(b.stackR * 0.82, b.stackR, b.stackH - 0.5, 18, 1).translate(
        stackX,
        (b.stackH + 0.5) / 2,
        stackZ,
      ),
      mat,
    ),
  );
  const flange: THREE.BufferGeometry[] = [];
  for (const y of [4, 9, 14, 19])
    flange.push(new THREE.CylinderGeometry(b.stackR + 0.03, b.stackR + 0.03, 0.08, 18).translate(stackX, y, stackZ));
  flange.push(new THREE.CylinderGeometry(b.stackR * 0.9, b.stackR * 0.82, 0.3, 18).translate(stackX, b.stackH, stackZ));
  stack.add(mesh(joined(flange), MAT.steelBlack()));
  const flueHall = v3(-L / 2 + 0.02, H - 1.6, stackZ);
  const flueStack = v3(stackX + b.stackR * 0.9, H - 1.6, stackZ);
  stack.add(mesh(stick(flueHall, flueStack, 0.32, 14), mat));
  // guy wires: three, from a collar to anchors on the ground
  const guys: THREE.BufferGeometry[] = [];
  const collarY = b.stackH * 0.68;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.6;
    const gx = stackX + Math.cos(a) * 9;
    const gz = stackZ + Math.sin(a) * 9;
    guys.push(
      stick(
        v3(stackX + Math.cos(a) * b.stackR * 0.85, collarY, stackZ + Math.sin(a) * b.stackR * 0.85),
        v3(gx, 0.06, gz),
        0.012,
        4,
      ),
    );
    guys.push(box(gx, 0.08, gz, 0.4, 0.16, 0.4));
  }
  stack.add(mesh(joined(guys), MAT.steelBlack()));
  hall.position.set(b.x, 0, b.z);
  stack.position.set(b.x, 0, b.z);
  return {
    hall,
    stack,
    stackTop: v3(b.x + stackX, b.stackH + 0.2, b.z + stackZ),
    flue: { hall: flueHall.clone().add(v3(b.x, 0, b.z)), stack: flueStack.clone().add(v3(b.x, 0, b.z)) },
  };
}
