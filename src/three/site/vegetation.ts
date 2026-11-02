import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { rng } from '@onigam/lab-kit/three';
import { smoothstep } from '../common';
import { SITE } from '../dims';
import { birchBarkMap, fbm, foliageMap, spruceBarkMap, vnoise } from '../textures';
import { LEAVES, patchSnow } from './snow';
import { HOUSES, PADS, polyDistance, roadZ, terrainHeight } from './terrain';

// The trees of a Nordic village, all instanced: spruces with a straight trunk and drooping boughs, tier on tier; birches with a white trunk, slender branches and a light, broken crown that loses
// its leaves in winter; a far forest of crude spruces; junipers and low shrubs at the wood's edge. Each species is one unit geometry (height 1, its foot at the origin) with its colours in the
// vertices. The placement is seeded, every tree stands on the land (`terrainHeight`) and keeps off the buildings, the road, the trench, the line and the corridor of the home view.

export interface Inst {
  x: number;
  y: number;
  z: number;
  s: number;
  w: number;
  rot: number;
  tint: number;
}

export interface VegetationPlan {
  spruces: Inst[];
  birches: Inst[];
  forest: Inst[];
  shrubs: Inst[];
}

/** The line of sight of the home view: a tall tree must keep clear of it. Keep it in step with the home pose of the scene. */
export const HOME = { pos: [-10, 23, 100] as const, target: [-18, 11.5, 4] as const };

export function homeCorridorDistance(x: number, z: number): number {
  const [cx, , cz] = HOME.pos;
  const [tx, , tz] = HOME.target;
  const ex = (cx - tx) * 1.9;
  const ez = (cz - tz) * 1.9;
  const t = Math.min(1, Math.max(0, ((x - tx) * ex + (z - tz) * ez) / (ex * ex + ez * ez)));
  return Math.hypot(tx + ex * t - x, tz + ez * t - z);
}

const padDistance = (x: number, z: number): number => {
  let d = Infinity;
  for (const p of PADS) d = Math.min(d, Math.hypot(Math.max(p.x0 - x, 0, x - p.x1), Math.max(p.z0 - z, 0, z - p.z1)));
  return d;
};

/** Everything a tree needs of the place: off the pads, the road, the line, the trench. */
export function spotOk(x: number, z: number, r: number): boolean {
  if (padDistance(x, z) < r + 1) return false;
  if (Math.abs(z - roadZ(x)) < SITE.road.width / 2 + r + 1) return false;
  if (polyDistance(x, z, SITE.line.poles) < r + 5) return false;
  if (polyDistance(x, z, SITE.trench.path) < r + 2.5) return false;
  if (polyDistance(x, z, SITE.trench.schoolSpur) < r + 2) return false;
  if (polyDistance(x, z, SITE.trench.boilerSpur) < r + 2) return false;
  return true;
}

/** Where the forest stands: dense to the north, broken groves around, thin near the village. */
export function forestMask(x: number, z: number): number {
  const d = Math.hypot(x + 20, z - 8);
  const clear = smoothstep(58, 130, d);
  const north = smoothstep(-26, -62, z);
  const groves = smoothstep(0.46, 0.58, fbm(x * 0.008 + 2, z * 0.008 - 3, 3));
  // the clearing of the solar field stays open
  const field = smoothstep(16, 42, Math.abs(x - 62) + Math.abs(z + 40) - 36);
  return Math.min(1, (clear * groves + north * 0.95) * field);
}

// ------------------------------------------------------------------------------------------------ geometry

class Mesher {
  pos: number[] = [];
  col: number[] = [];
  uv: number[] = [];
  idx: number[] = [];
  get n(): number {
    return this.pos.length / 3;
  }
  vert(x: number, y: number, z: number, c: THREE.Color, u = 0, v = 0): number {
    this.pos.push(x, y, z);
    this.col.push(c.r, c.g, c.b);
    this.uv.push(u, v);
    return this.n - 1;
  }
  tri(a: number, b: number, c: number): void {
    this.idx.push(a, b, c);
  }
  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.idx);
    g.computeVertexNormals();
    return g;
  }
}

const C = (hex: number): THREE.Color => new THREE.Color(hex);

/** A tapered tube along a polyline: a trunk or a limb. */
function tube(
  m: Mesher,
  pts: [number, number, number][],
  radii: number[],
  sides: number,
  ca: THREE.Color,
  cb: THREE.Color,
  uvk = 6,
): void {
  const rings: number[][] = [];
  const t = new THREE.Vector3();
  const n = new THREE.Vector3();
  const b = new THREE.Vector3();
  const tmp = new THREE.Color();
  let len = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = new THREE.Vector3(...pts[Math.max(0, i - 1)]);
    const c = new THREE.Vector3(...pts[Math.min(pts.length - 1, i + 1)]);
    t.subVectors(c, a).normalize();
    const ref = Math.abs(t.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    n.crossVectors(t, ref).normalize();
    b.crossVectors(t, n).normalize();
    if (i > 0) len += new THREE.Vector3(...pts[i]).distanceTo(new THREE.Vector3(...pts[i - 1]));
    tmp.copy(ca).lerp(cb, i / Math.max(1, pts.length - 1));
    const ring: number[] = [];
    for (let s = 0; s <= sides; s++) {
      const ang = (s / sides) * Math.PI * 2;
      const cx = Math.cos(ang);
      const cz = Math.sin(ang);
      const r = radii[i];
      ring.push(
        m.vert(
          pts[i][0] + (n.x * cx + b.x * cz) * r,
          pts[i][1] + (n.y * cx + b.y * cz) * r,
          pts[i][2] + (n.z * cx + b.z * cz) * r,
          tmp,
          s / sides,
          len * uvk,
        ),
      );
    }
    rings.push(ring);
  }
  for (let i = 0; i < rings.length - 1; i++)
    for (let s = 0; s < sides; s++) {
      const a = rings[i][s];
      const b2 = rings[i][s + 1];
      const c = rings[i + 1][s];
      const d = rings[i + 1][s + 1];
      m.tri(a, b2, c);
      m.tri(b2, d, c);
    }
}

/**
 * A spruce: the trunk, and whorls of drooping boughs from the foot of the crown to the top. Each bough is a flat lens that leaves the trunk, droops and lifts its tip, darker underneath; the
 * boughs get shorter towards the top, which gives the tall narrow cone of the species. The colours fall from a live green at the tip to near-black at the trunk: the shadow inside the tree.
 */
function spruceGeometry(tiers: number, boughs: number, seed: number, keels: boolean): THREE.BufferGeometry {
  const m = new Mesher();
  const r = rng(seed);
  const tipC = C(0x4f6e47);
  const midC = C(0x2c4a30);
  const inC = C(0x121d15);
  const tmp = new THREE.Color();
  // the crown runs from 10 % to 100 % of the height, about a quarter of the height wide at its foot
  for (let t = 0; t < tiers; t++) {
    const f = t / (tiers - 1);
    const y = 0.09 + 0.87 * f ** 0.92;
    const reach = (0.205 * (1 - f) ** 0.85 + 0.018) * (0.9 + 0.2 * r());
    for (let b = 0; b < boughs; b++) {
      const a = (b / boughs) * Math.PI * 2 + t * 1.1 + r() * 0.5;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const rr = reach * (0.82 + 0.34 * r());
      const droop = 0.022 + 0.045 * (1 - f);
      const halfW = rr * 0.5 * (0.85 + 0.3 * r());
      // base at the trunk, two shoulders, a tip; the shoulders droop, the tip lifts a little
      const hx = -sa;
      const hz = ca;
      const base = m.vert(ca * 0.004, y + droop * 0.5, sa * 0.004, inC);
      const sx = ca * rr * 0.55;
      const sz = sa * rr * 0.55;
      const sy = y - droop * 0.9;
      tmp.copy(midC).multiplyScalar(0.85 + 0.3 * r());
      const left = m.vert(sx + hx * halfW, sy, sz + hz * halfW, tmp);
      const right = m.vert(sx - hx * halfW, sy, sz - hz * halfW, tmp);
      tmp.copy(tipC).multiplyScalar(0.8 + 0.4 * r());
      const tip = m.vert(ca * rr, y - droop * (1.1 + 0.3 * r()), sa * rr, tmp);
      // the top of the bough
      m.tri(base, left, tip);
      m.tri(base, tip, right);
      if (!keels) continue;
      // a keel under it, dark: so a bough has a volume from below
      const keel = m.vert(ca * rr * 0.4, y - droop * 2.2, sa * rr * 0.4, inC);
      m.tri(base, keel, left);
      m.tri(base, right, keel);
      m.tri(left, keel, tip);
      m.tri(tip, keel, right);
    }
  }
  // the leader at the top
  const top = m.vert(0, 1, 0, tipC);
  const ring: number[] = [];
  for (let s = 0; s < 5; s++) {
    const a = (s / 5) * Math.PI * 2;
    ring.push(m.vert(Math.cos(a) * 0.012, 0.93, Math.sin(a) * 0.012, midC));
  }
  for (let s = 0; s < 5; s++) m.tri(top, ring[(s + 1) % 5], ring[s]);
  const g = m.build();
  return g;
}

function spruceTrunk(): THREE.BufferGeometry {
  const m = new Mesher();
  tube(
    m,
    [
      [0, 0, 0],
      [0, 0.05, 0],
      [0.002, 0.5, 0.001],
      [0, 0.95, 0],
    ],
    [0.018, 0.014, 0.008, 0.002],
    7,
    C(0x4a3a2c),
    C(0x5d4a38),
    2,
  );
  return m.build();
}

/** A far spruce: two stacked narrow cones, dark at the foot, 12 triangles. */
function farSpruce(): THREE.BufferGeometry {
  const m = new Mesher();
  const lo = C(0x263b29);
  const hi = C(0x46624a);
  for (const [y0, y1, rad] of [
    [0.05, 0.64, 0.19],
    [0.42, 1.0, 0.125],
  ] as const) {
    const apex = m.vert(0, y1, 0, hi);
    const ring: number[] = [];
    for (let s = 0; s < 6; s++) {
      const a = (s / 6) * Math.PI * 2 + y0;
      ring.push(m.vert(Math.cos(a) * rad, y0, Math.sin(a) * rad, lo));
    }
    for (let s = 0; s < 6; s++) m.tri(apex, ring[(s + 1) % 6], ring[s]);
  }
  return m.build();
}

/** A birch's wood: a slim white trunk that forks into rising branches, thin twigs at their ends: what stays in winter. */
function birchWood(seed: number, twigs: boolean): THREE.BufferGeometry {
  const m = new Mesher();
  const r = rng(seed);
  const white = C(0xffffff);
  const foot = C(0x5c5348);
  const twig = C(0x4b3a30);
  tube(
    m,
    [
      [0, 0, 0],
      [0.003, 0.04, 0],
      [0.012, 0.22, 0.004],
      [0.004, 0.46, 0.012],
      [0.012, 0.72, 0.006],
      [0.006, 0.97, 0.002],
    ],
    [0.024, 0.02, 0.016, 0.012, 0.007, 0.002],
    8,
    foot,
    white,
    4,
  );
  const branches = 15;
  for (let i = 0; i < branches; i++) {
    const f = i / (branches - 1);
    const y0 = 0.28 + 0.62 * f;
    const a = i * 2.399 + r() * 0.3;
    const L = (0.28 - 0.17 * f) * (0.85 + 0.3 * r());
    const out = (s: number) =>
      [
        Math.cos(a) * L * s,
        y0 + L * (0.34 + 0.75 * f) * s + (s > 0.5 ? -L * 0.12 * (s - 0.5) * (1 - f) : 0),
        Math.sin(a) * L * s,
      ] as [number, number, number];
    tube(m, [out(0), out(0.33), out(0.68), out(1)], [0.005, 0.0035, 0.0024, 0.0008], 4, twig, twig, 6);
    // twigs that hang off, the species' look in winter; left out from afar, where they are under a pixel and crawl
    for (let t = 0; twigs && t < 3; t++) {
      const s = 0.5 + t * 0.2;
      const b = out(s);
      const a2 = a + (t - 1) * 0.9;
      const l2 = L * 0.34;
      tube(
        m,
        [
          b,
          [b[0] + Math.cos(a2) * l2 * 0.5, b[1] - l2 * 0.05, b[2] + Math.sin(a2) * l2 * 0.5],
          [b[0] + Math.cos(a2) * l2, b[1] - l2 * 0.32, b[2] + Math.sin(a2) * l2],
        ],
        [0.0018, 0.0012, 0.0006],
        3,
        twig,
        twig,
        6,
      );
    }
  }
  return m.build();
}

const unitIco = new Map<number, THREE.BufferGeometry>();
function ico(detail: number): THREE.BufferGeometry {
  let g = unitIco.get(detail);
  if (!g) {
    const raw = new THREE.IcosahedronGeometry(1, detail);
    raw.deleteAttribute('normal');
    raw.deleteAttribute('uv');
    g = mergeVertices(raw, 1e-4);
    unitIco.set(detail, g);
  }
  return g;
}

/** Puffs of small leaves: a displaced lobe. */
function lobe(
  m: Mesher,
  cx: number,
  cy: number,
  cz: number,
  rx: number,
  ry: number,
  rz: number,
  lo: THREE.Color,
  hi: THREE.Color,
  seed: number,
  detail = 1,
): void {
  const g = ico(detail);
  const p = g.attributes.position;
  const ix = g.index!;
  const base = m.n;
  const tmp = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const ux = p.getX(i);
    const uy = p.getY(i);
    const uz = p.getZ(i);
    const f = 1 + 0.32 * (vnoise(ux * 2.3 + seed, uy * 2.3 + uz * 1.7 + seed * 0.7) - 0.5) * 2;
    tmp
      .copy(lo)
      .lerp(hi, smoothstep(-0.8, 0.9, uy))
      .multiplyScalar(0.88 + 0.24 * vnoise(ux * 3.1 + seed * 1.3, uz * 3.1 + uy * 2));
    const x = cx + ux * rx * f;
    const y = cy + uy * ry * f;
    const z = cz + uz * rz * f;
    m.vert(x, y, z, tmp, (x + 0.5 * z) * 9, (y + 0.3 * z) * 9);
  }
  for (let i = 0; i < ix.count; i++) m.idx.push(base + ix.getX(i));
}

/** A birch's crown: many small puffs along the branches, light and airy, an oval that hangs a little. */
function birchLeaves(seed: number): THREE.BufferGeometry {
  const m = new Mesher();
  const r = rng(seed);
  const lo = C(0x4e6a26);
  const hi = C(0xa4bc55);
  const N = 26;
  for (let i = 0; i < N; i++) {
    const f = i / (N - 1);
    const y = 0.42 + 0.56 * f;
    const a = i * 2.399 + r() * 0.5;
    const rad = (0.2 - 0.14 * f) * (0.55 + 0.75 * r()) * smoothstep(0.32, 0.5, y + 0.1);
    const s = 0.062 + 0.05 * (1 - f) * r() + 0.018;
    lobe(m, Math.cos(a) * rad, y, Math.sin(a) * rad, s * 1.15, s * 0.9, s * 1.15, lo, hi, seed + i, 0);
  }
  return m.build();
}

// ------------------------------------------------------------------------------------------------ placement

const inst = (x: number, z: number, s: number, w: number, r: () => number): Inst => ({
  x,
  y: terrainHeight(x, z),
  z,
  s,
  w,
  rot: r() * Math.PI * 2,
  tint: r(),
});

/** Keep clear of the view's corridor from the home pose, in plan. */
const inHomeCorridor = (x: number, z: number, margin = 16): boolean => z > 34 && homeCorridorDistance(x, z) < margin;

export function planVegetation(): VegetationPlan {
  const r = rng(2026);
  const plan: VegetationPlan = { spruces: [], birches: [], forest: [], shrubs: [] };

  // ---- spruces near: the forest's edge on the north, groves around
  let tries = 0;
  while (plan.spruces.length < 460 && tries++ < 26000) {
    const ang = r() * Math.PI * 2;
    const d = 36 + r() * 330;
    const x = -20 + Math.cos(ang) * d * 1.3;
    const z = 8 + Math.sin(ang) * d;
    if (r() > forestMask(x, z) * 1.3 + 0.004) continue;
    if (!spotOk(x, z, 3) || inHomeCorridor(x, z)) continue;
    const h = 14 + 14 * r();
    plan.spruces.push(inst(x, z, h, 0.92 + 0.25 * r(), r));
  }

  // ---- birches: along the road, in the gardens, at the forest's edge
  tries = 0;
  while (plan.birches.length < 110 && tries++ < 12000) {
    const x = -150 + r() * 300;
    const z = -55 + r() * 150;
    const edge = r() < 0.6;
    if (edge && (forestMask(x, z) < 0.1 || forestMask(x, z) > 0.75)) continue;
    if (!edge && Math.abs(z - roadZ(x)) > 22) continue;
    if (!spotOk(x, z, 2.2) || inHomeCorridor(x, z, 12)) continue;
    let near = false;
    for (const h of HOUSES) if (Math.hypot(h.x - x, h.z - z) < 8) near = true;
    if (near) continue;
    const h = 11 + 8 * r();
    plan.birches.push(inst(x, z, h, 0.82 + 0.28 * r(), r));
  }

  // ---- the far forest
  tries = 0;
  while (plan.forest.length < 3400 && tries++ < 30000) {
    const ang = r() * Math.PI * 2;
    const d = 240 + 1500 * r() ** 0.8;
    const x = -20 + Math.cos(ang) * d * 1.25;
    const z = -30 + Math.sin(ang) * d;
    const f = forestMask(x, z);
    if (r() > f * 1.25 + 0.12) continue;
    if (Math.abs(z - roadZ(x)) < 9) continue;
    if (polyDistance(x, z, SITE.line.poles) < 9) continue;
    let nearWind = false;
    for (const [wx, wz] of SITE.wind.turbines) if (Math.hypot(wx - x, wz - z) < 45) nearWind = true;
    if (nearWind) continue;
    const h = 14 + 13 * r();
    plan.forest.push(inst(x, z, h, 0.95 + 0.2 * r(), r));
  }

  // ---- young spruces at the wood's edge: the forest comes down in steps, not at once
  tries = 0;
  while (plan.shrubs.length < 130 && tries++ < 9000) {
    const x = -170 + r() * 340;
    const z = -70 + r() * 150;
    if (!spotOk(x, z, 1.2)) continue;
    const f = forestMask(x, z);
    if (f < 0.04 || f > 0.8 || r() > 0.8) continue;
    if (inHomeCorridor(x, z, 10)) continue;
    plan.shrubs.push(inst(x, z, 1.6 + 3.6 * r(), 1.05, r));
  }
  return plan;
}

// ------------------------------------------------------------------------------------------------ the meshes

export interface Vegetation {
  group: THREE.Group;
  meshes: THREE.InstancedMesh[];
  counts: Record<string, number>;
  leaves: THREE.MeshStandardMaterial;
}

/** A birch's crown thins and goes gold as the leaves fall: a dither in the shader. */
function patchLeaves(mat: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  const prev = mat.onBeforeCompile;
  const key = mat.customProgramCacheKey.bind(mat);
  mat.onBeforeCompile = (shader, renderer) => {
    prev.call(mat, shader, renderer);
    shader.uniforms.uLeaves = LEAVES;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uLeaves;\nfloat lfHash( vec2 p ) { p = fract( p * vec2( 123.34, 456.21 ) ); p += dot( p, p + 45.32 ); return fract( p.x * p.y ); }',
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        if ( uLeaves < 0.995 ) {
          if ( lfHash( floor( gl_FragCoord.xy * 0.5 ) ) > uLeaves ) discard;
          diffuseColor.rgb = mix( vec3( 0.62, 0.5, 0.12 ) * ( 0.7 + 0.6 * diffuseColor.g ), diffuseColor.rgb, smoothstep( 0.1, 0.8, uLeaves ) );
        }`,
      );
  };
  mat.customProgramCacheKey = () => `${key()}|leaves`;
  return mat;
}

export function buildVegetation(plan: VegetationPlan): Vegetation {
  const group = new THREE.Group();
  group.name = 'vegetation';
  const meshes: THREE.InstancedMesh[] = [];
  const counts: Record<string, number> = {};
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const colour = new THREE.Color();

  const make = (
    name: string,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    list: Inst[],
    opts: { shadow?: boolean; tint: (i: Inst) => THREE.Color; size: (i: Inst, s: THREE.Vector3) => void },
  ): THREE.InstancedMesh | null => {
    if (list.length === 0) return null;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    im.name = name;
    list.forEach((it, i) => {
      q.setFromAxisAngle(up, it.rot);
      opts.size(it, scl);
      // the foot goes a few centimetres into the ground: a tree does not stand on a plane
      pos.set(it.x, it.y - 0.06, it.z);
      m4.compose(pos, q, scl);
      im.setMatrixAt(i, m4);
      im.setColorAt(i, opts.tint(it));
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = opts.shadow ?? false;
    im.receiveShadow = true;
    im.frustumCulled = false;
    im.userData.noShadow = !opts.shadow;
    counts[name] = list.length;
    group.add(im);
    meshes.push(im);
    return im;
  };
  const treeSize = (it: Inst, s: THREE.Vector3) => s.set(it.s * it.w, it.s, it.s * it.w);

  // spruces: the boughs catch the snow from the sky's side
  const spruceMat = patchSnow(
    new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }),
    { lo: 0.25, hi: 0.72, gain: 0.72, far: [130, 320], mean: [0.05, 0.085, 0.055] },
  );
  // the nearest spruces in full, those further off with fewer boughs: the same tree at this distance, a third of the triangles
  const nearOf = (it: Inst) => Math.hypot(it.x + 20, it.z - 8) < 150;
  const spruceTint = (it: Inst) => colour.setHSL(0.31 + 0.05 * it.tint, 0.25, 0.86 + 0.24 * it.tint);
  make('spruce-boughs', spruceGeometry(12, 7, 9, true), spruceMat, plan.spruces.filter(nearOf), {
    shadow: true,
    size: treeSize,
    tint: spruceTint,
  });
  // with no dark keels showing, the same snow would whiten them entirely
  const midMat = patchSnow(
    new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }),
    { lo: 0.4, hi: 0.95, gain: 0.34, far: [130, 320], mean: [0.05, 0.085, 0.055] },
  );
  make(
    'spruce-mid',
    spruceGeometry(9, 6, 13, false),
    midMat,
    plan.spruces.filter((it) => !nearOf(it)),
    { shadow: true, size: treeSize, tint: spruceTint },
  );
  const bark = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: spruceBarkMap(),
    vertexColors: true,
    roughness: 1,
  });
  make('spruce-trunk', spruceTrunk(), bark, plan.spruces, {
    shadow: true,
    size: treeSize,
    tint: () => colour.set(0xffffff),
  });

  // birches: bark and twigs, then the leaves
  const birchBark = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: birchBarkMap(),
    vertexColors: true,
    roughness: 0.9,
  });
  const nearBirch = (it: Inst) => Math.hypot(it.x + 20, it.z - 8) < 90;
  make('birch-wood', birchWood(3, true), birchBark, plan.birches.filter(nearBirch), {
    shadow: true,
    size: treeSize,
    tint: () => colour.set(0xffffff),
  });
  make(
    'birch-wood-far',
    birchWood(3, false),
    birchBark,
    plan.birches.filter((it) => !nearBirch(it)),
    { shadow: true, size: treeSize, tint: () => colour.set(0xffffff) },
  );
  const leafMat = patchLeaves(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: foliageMap(),
      vertexColors: true,
      roughness: 0.95,
      side: THREE.DoubleSide,
    }),
  );
  make('birch-leaves', birchLeaves(7), leafMat, plan.birches, {
    shadow: true,
    size: treeSize,
    tint: (it) => colour.setHSL(0.21 + 0.03 * it.tint, 0.28, 0.9 + 0.16 * it.tint),
  });

  // the far forest: no shadow, it greys with the snow
  make(
    'forest',
    farSpruce(),
    patchSnow(new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 1 }), {
      lo: 0.1,
      hi: 0.6,
      gain: 0.22,
      far: [150, 420],
    }),
    plan.forest,
    {
      size: treeSize,
      tint: (it) => colour.setHSL(0.33 + 0.05 * it.tint, 0.2, 0.8 + 0.28 * it.tint),
    },
  );

  const youngMat = patchSnow(
    new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }),
    { lo: 0.4, hi: 0.95, gain: 0.45, far: [110, 280], mean: [0.05, 0.085, 0.055] },
  );
  make('young-spruces', spruceGeometry(7, 6, 21, false), youngMat, plan.shrubs, {
    shadow: true,
    size: treeSize,
    tint: (it) => colour.setHSL(0.3 + 0.05 * it.tint, 0.28, 0.92 + 0.24 * it.tint),
  });
  return { group, meshes, counts, leaves: leafMat };
}
