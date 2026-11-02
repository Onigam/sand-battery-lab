import * as THREE from 'three';
import { rng } from '@onigam/lab-kit/three';
import { smoothstep } from './common';

// Procedural maps of the machine and the village: no texture file, every map is generated once per page from a seeded lattice and stored as a DataTexture (no canvas, so
// it also builds in Node under vitest). No text in any of them: a film is captured with no interface.

const LN = 256;
const lattice = (() => {
  const r = rng(90210);
  const a = new Float32Array(LN * LN);
  for (let i = 0; i < a.length; i++) a[i] = r();
  return a;
})();

const sm = (t: number) => t * t * (3 - 2 * t);

/** Smooth value noise in 0..1 (any real x, y; the lattice repeats every 256 cells). */
export function vnoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = sm(x - ix);
  const fy = sm(y - iy);
  const x0 = ix & 255;
  const x1 = (ix + 1) & 255;
  const y0 = (iy & 255) * LN;
  const y1 = ((iy + 1) & 255) * LN;
  const a = lattice[y0 + x0];
  const b = lattice[y0 + x1];
  const c = lattice[y1 + x0];
  const d = lattice[y1 + x1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** Fractal noise in about 0..1. */
export function fbm(x: number, y: number, octaves = 4, gain = 0.5): number {
  let s = 0;
  let amp = 0.5;
  let norm = 0;
  let f = 1;
  for (let o = 0; o < octaves; o++) {
    s += amp * vnoise(x * f + o * 17.3, y * f + o * 9.1);
    norm += amp;
    amp *= gain;
    f *= 2;
  }
  return s / norm;
}

/** Value noise that repeats every `px` cells in x and `py` in y (at most 256): for tileable maps. */
function tn(x: number, y: number, px: number, py: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = sm(x - ix);
  const fy = sm(y - iy);
  const x0 = ((ix % px) + px) % px;
  const x1 = (x0 + 1) % px;
  const y0 = (((iy % py) + py) % py) * LN;
  const y1 = (((((iy % py) + py) % py) + 1) % py) * LN;
  const a = lattice[y0 + x0];
  const b = lattice[y0 + x1];
  const c = lattice[y1 + x0];
  const d = lattice[y1 + x1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** Tileable fractal noise: `cells` lattice cells across the unit square at the first octave. */
export function tf(u: number, v: number, cells: number, octaves = 3, cellsY = cells): number {
  let s = 0;
  let amp = 0.5;
  let norm = 0;
  let cx = cells;
  let cy = cellsY;
  for (let o = 0; o < octaves; o++) {
    s += amp * tn(u * cx + o * 3.7, v * cy + o * 1.9, cx, cy);
    norm += amp;
    amp *= 0.5;
    cx *= 2;
    cy *= 2;
  }
  return s / norm;
}

const hash1 = (a: number, b: number): number => {
  let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

const b8 = (x: number): number => Math.max(0, Math.min(255, Math.round(x * 255)));

export interface TextureStat {
  name: string;
  size: number;
  bytes: number;
}
const stats: TextureStat[] = [];
export const textureStats = (): TextureStat[] => stats;

const cache = new Map<string, THREE.DataTexture>();

/** A square RGBA map made once; `fill` returns sRGB components in 0..1. */
function map(
  name: string,
  size: number,
  fill: (u: number, v: number, i: number, j: number) => [number, number, number],
  srgb = true,
): THREE.DataTexture {
  const hit = cache.get(name);
  if (hit) return hit;
  const data = new Uint8Array(size * size * 4);
  for (let j = 0; j < size; j++)
    for (let i = 0; i < size; i++) {
      const [r, g, b] = fill(i / size, j / size, i, j);
      const k = (j * size + i) * 4;
      data[k] = b8(r);
      data[k + 1] = b8(g);
      data[k + 2] = b8(b);
      data[k + 3] = 255;
    }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 16;
  t.name = name;
  t.needsUpdate = true;
  cache.set(name, t);
  stats.push({ name, size, bytes: Math.round(size * size * 4 * (4 / 3)) });
  return t;
}

/** A copy of a map with its own repeat (same pixels on the GPU's side of three: `source` is shared). */
export function tiled(t: THREE.Texture, u: number, w = u): THREE.Texture {
  const c = t.clone();
  c.repeat.set(u, w);
  c.needsUpdate = true;
  return c;
}

/** Cast concrete: mottled, a speckle of aggregate, faint form-board lines. */
export const concreteMap = (): THREE.DataTexture =>
  map('concrete', 256, (u, v, i, j) => {
    const n = tf(u, v, 6, 4) - 0.5;
    const speck = hash1(i, j) > 0.93 ? -0.05 : hash1(j, i) > 0.97 ? 0.04 : 0;
    const k = 0.62 + 0.22 * n + speck;
    return [k * 1.02, k, k * 0.95];
  });

/** Mineral wool in section: fibres that wave along the layer, as a drawing shows insulation, pale straw. */
export const woolMap = (): THREE.DataTexture =>
  map('wool', 256, (u, v) => {
    const warp = (tf(u, v, 8, 2) - 0.5) * 0.08;
    const w = Math.abs(((v * 8 + Math.sin(u * Math.PI * 8) * 0.35 + warp * 8) % 1) - 0.5) * 2;
    const line = smoothstep(0.0, 0.34, w);
    const n = tf(u, v, 24, 3, 24) - 0.5;
    const k = 0.72 + 0.16 * line + 0.2 * n;
    return [k * 1.0, k * 0.87, k * 0.62];
  });

/** Lightweight insulating blocks under the stone: expanded-clay aggregate (the patent's example, S15). */
export const clayBlockMap = (): THREE.DataTexture =>
  map('clay-block', 256, (u, v, i, j) => {
    const row = Math.floor(v * 4);
    const uu = (u * 4 + (row % 2 ? 0.5 : 0)) % 1;
    const vv = (v * 4) % 1;
    const joint = Math.min(uu, 1 - uu, vv, 1 - vv) < 0.018 ? 0.74 : 1;
    const n = tf(u, v, 32, 3) - 0.5;
    const pores = hash1(Math.floor(i / 3), Math.floor(j / 3)) > 0.86 ? 0.86 : 1;
    const k = (0.56 + 0.26 * n) * joint * pores;
    return [k * 1.1, k * 0.88, k * 0.72];
  });

/** A steel tread plate: raised lozenges in two directions, the grey varies a little. */
export const treadMap = (): THREE.DataTexture =>
  map('tread', 256, (u, v) => {
    const c = 12;
    const cx = Math.floor(u * c);
    const cy = Math.floor(v * c);
    const fx = u * c - cx - 0.5;
    const fy = v * c - cy - 0.5;
    const flip = (cx + cy) % 2 === 0 ? 1 : -1;
    const a = fx * 0.707 + flip * fy * 0.707;
    const b = -flip * fx * 0.707 + fy * 0.707;
    const lozenge = 1 - smoothstep(0.08, 0.13, Math.abs(a)) * 1;
    const long = 1 - smoothstep(0.26, 0.34, Math.abs(b));
    const raised = lozenge * long;
    const n = tf(u, v, 5, 3) - 0.5;
    const k = 0.44 + 0.08 * n + 0.035 * raised;
    return [k, k * 0.99, k * 0.96];
  });

/** Wooden cladding, grey boards to be tinted: vertical boards, a grain, a dark joint. */
export const boardsMap = (): THREE.DataTexture =>
  map('boards', 256, (u, v, i) => {
    const boards = 8;
    const b = Math.floor(u * boards);
    const joint = Math.abs(((u * boards) % 1) - 0.5) > 0.46 ? 0.62 : 1;
    const grain = tn(u * 40 + b * 7.3, v * 4, 256, 4);
    const tone = 0.9 + 0.14 * hash1(b, 3) + 0.04 * Math.sin(i * 0.9 + b);
    const k = (0.82 + 0.16 * grain) * tone * joint;
    return [k, k, k];
  });

/** Sheet-metal roof, grey to be tinted: standing seams and a wear. */
export const roofSheetMap = (): THREE.DataTexture =>
  map('roof-sheet', 128, (u, v) => {
    const seam = Math.abs(((u * 4) % 1) - 0.5) > 0.47 ? 1.22 : 1;
    const k = (0.8 + 0.25 * (tf(u, v, 8, 3) - 0.5)) * seam;
    return [k, k, k];
  });

/**
 * Crushed gravel of the yard: stones packed edge to edge, of uneven size, each its own tone, a thin dark line where they meet, no ground between them and no halo: a soft disc on a darker ground is
 * what read as polka dots (review D11). Two sizes of stone, one laid over the other. Tiles exactly.
 */
export const gravelMap = (): THREE.DataTexture =>
  map('gravel', 512, (u, v, i, j) => {
    const stones = (G: number, seed: number): { edge: number; tone: number } => {
      const gx = u * G;
      const gy = v * G;
      const cx = Math.floor(gx);
      const cy = Math.floor(gy);
      let d1 = 9;
      let d2 = 9;
      let id = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const wx = (cx + dx + G) % G;
          const wy = (cy + dy + G) % G;
          const ex = cx + dx + hash1(wx + seed, wy) - gx;
          const ey = cy + dy + hash1(wy + seed + 7, wx + 3) - gy;
          // an uneven weight: some stones take more room than their neighbours
          const d = (ex * ex + ey * ey) * (0.55 + 0.9 * hash1(wx + 11, wy + seed));
          if (d < d1) {
            d2 = d1;
            d1 = d;
            id = wx * 131 + wy;
          } else if (d < d2) d2 = d;
        }
      return { edge: Math.sqrt(d2) - Math.sqrt(d1), tone: hash1(id, seed + 5) };
    };
    const fine = stones(46, 0);
    const big = stones(19, 40);
    // a bigger stone here and there: where it is well inside its cell, it lies over the fine ones
    const useBig = hash1(Math.floor(big.tone * 4096), 17) > 0.72 && big.edge > 0.08;
    const s = useBig ? big : fine;
    const line = smoothstep(0.0, useBig ? 0.1 : 0.16, s.edge);
    const tone = 0.5 + 0.26 * s.tone + 0.08 * (tf(u, v, 7, 2) - 0.5);
    const k = (tone * (0.58 + 0.42 * line) + 0.03 * (hash1(i, j) - 0.5)) * 1.1;
    const warm = 0.97 + 0.08 * hash1(Math.floor(s.tone * 977), 3);
    return [k * warm, k, k * (1.04 - 0.1 * warm)];
  });

/**
 * A spray of small leaves on nothing: pointed ovals of varied tone scattered over a transparent square, for the crown of a birch. No canvas, so it builds in Node too. Tiles, so that a card can
 * start anywhere in it.
 */
export const leafSprayMap = (): THREE.DataTexture => {
  const hit = cache.get('leaf-spray');
  if (hit) return hit;
  const size = 256;
  const G = 13;
  const data = new Uint8Array(size * size * 4);
  for (let j = 0; j < size; j++)
    for (let i = 0; i < size; i++) {
      const gx = (i / size) * G;
      const gy = (j / size) * G;
      const cx = Math.floor(gx);
      const cy = Math.floor(gy);
      let best = 0;
      let tone = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const wx = (cx + dx + G) % G;
          const wy = (cy + dy + G) % G;
          // about one cell in three stays empty: light passes through
          if (hash1(wx + 3, wy + 91) < 0.33) continue;
          const px = cx + dx + hash1(wx, wy) - gx;
          const py = cy + dy + hash1(wy + 7, wx + 3) - gy;
          const a = hash1(wx + 11, wy + 5) * Math.PI * 2;
          const u = Math.cos(a) * px + Math.sin(a) * py;
          const v = -Math.sin(a) * px + Math.cos(a) * py;
          // a birch's leaf: a pointed oval, wider near its stalk
          const L = 0.62 + 0.26 * hash1(wx + 2, wy + 17);
          const t = u / L;
          if (Math.abs(t) >= 1) continue;
          const W = L * 0.62 * (1 - t * t) * (1 - 0.32 * t);
          const inside = 1 - Math.abs(v) / Math.max(W, 1e-3);
          if (inside > best) {
            best = inside;
            // each leaf its tone, lit on one side of its midrib
            tone = 0.62 + 0.42 * hash1(wx + 29, wy + 31) + (v > 0 ? 0.1 : -0.06);
          }
        }
      const k = (j * size + i) * 4;
      const on = best > 0;
      // the colour bleeds under the transparent part: mipmaps must not fade the leaves to black
      const c = on ? tone : 0.72;
      data[k] = b8(c * 0.8);
      data[k + 1] = b8(c);
      data[k + 2] = b8(c * 0.46);
      data[k + 3] = on ? 255 : 0;
    }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 4;
  t.name = 'leaf-spray';
  t.needsUpdate = true;
  cache.set('leaf-spray', t);
  stats.push({ name: 'leaf-spray', size, bytes: Math.round(size * size * 4 * (4 / 3)) });
  return t;
};

/** A closed green ground, with the grain the eye reads close up. */
export const grassMap = (): THREE.DataTexture =>
  map(
    'grass',
    256,
    (u, v, i, j) => {
      const blade = tn(u * 90, v * 30, 90, 30);
      const k = 0.5 + 0.5 * ((tf(u, v, 20, 3) - 0.5) * 0.9 + (blade - 0.5) * 0.5 + (hash1(i, j) - 0.5) * 0.14);
      return [k, k, k];
    },
    false,
  );

/** Road asphalt: fine dark grain. */
export const asphaltMap = (): THREE.DataTexture =>
  map('asphalt', 128, (u, v, i, j) => {
    const k = 0.26 + 0.08 * (tf(u, v, 12, 3) - 0.5) + 0.07 * (hash1(i, j) - 0.5);
    return [k, k, k * 1.02];
  });

/** Bark of a birch: white, black lenticels running across the trunk, darker fissures to the foot. */
export const birchBarkMap = (): THREE.DataTexture =>
  map('birch-bark', 128, (u, v, i, j) => {
    const n = tf(u, v, 8, 3, 16);
    const lenticel = hash1(Math.floor(j / 4), Math.floor(i / 22)) > 0.72 && j % 4 < 2 ? 0.34 : 1;
    const scar = smoothstep(0.66, 0.74, tf(u, v, 6, 2, 3)) * 0.8;
    const k = 0.86 * lenticel * (1 - scar) + 0.1 * n;
    return [k, k * 0.98, k * 0.92];
  });

/** Bark of a spruce: scaly, brown-grey. */
export const spruceBarkMap = (): THREE.DataTexture =>
  map('spruce-bark', 128, (u, v, i, j) => {
    const n = tf(u, v, 12, 4, 20);
    const k = 0.22 + 0.32 * n + 0.04 * (hash1(i, j) - 0.5);
    return [k * 1.08, k * 0.95, k * 0.82];
  });
