import * as THREE from 'three';
import { box, joined, stick, v3 } from '../common';
import { PIPE, PLANT, SILO, ZONE_R } from '../dims';

// The U-pipes, one function: a leg, its return bend, the expansion loop on its top, the header it reaches, the spacer that holds it. The `silo` world draws the whole field (about
// 600 legs, instanced); the `pipe-cell` world draws a few of them from the same pieces at a higher resolution. The field is generic and sized by the physics (K42), the maker keeps
// its layout secret.

export interface Leg {
  x: number;
  z: number;
  /** 0 feeds, 1 returns (each U-pipe has one of each). */
  side: 0 | 1;
  zone: 0 | 1 | 2;
}

export interface UPipe {
  /** Row (z), and the x of the two legs. */
  z: number;
  x0: number;
  x1: number;
  zone: 0 | 1 | 2;
}

export const zoneOf = (r: number): 0 | 1 | 2 => (r <= ZONE_R[0] ? 0 : r <= ZONE_R[1] ? 1 : 2);

/** The lattice of the field: rows along x, a leg every pitch, inside the bed; legs go in pairs along a row, so a section along a row shows them as U. */
export function pipeLattice(): UPipe[] {
  const out: UPipe[] = [];
  const p = PIPE.pitch;
  const reach = SILO.bedR - PIPE.r - 0.05;
  const J = Math.floor(reach / p);
  for (let j = -J; j <= J; j++) {
    const z = j * p;
    const I = Math.floor(Math.sqrt(Math.max(0, reach * reach - z * z)) / p);
    // pairs (even, odd): the row through the axis has a pair (0, 1)
    for (let i = -I; i <= I; i++) {
      if (((i % 2) + 2) % 2 !== 0 || i + 1 > I) continue;
      const x0 = i * p;
      const x1 = (i + 1) * p;
      out.push({ z, x0, x1, zone: zoneOf(Math.hypot((x0 + x1) / 2, z)) });
    }
  }
  return out;
}

/** The legs of a list of U-pipes. */
export function legsOf(us: UPipe[]): Leg[] {
  const out: Leg[] = [];
  for (const u of us) {
    out.push({ x: u.x0, z: u.z, side: 0, zone: u.zone }, { x: u.x1, z: u.z, side: 1, zone: u.zone });
  }
  return out;
}

export interface PipeQuality {
  legRadial: number;
  bendTubular: number;
  bendRadial: number;
  loopTubular: number;
  loopRadial: number;
}
export const FIELD_QUALITY: PipeQuality = {
  legRadial: 8,
  bendTubular: 6,
  bendRadial: 5,
  loopTubular: 10,
  loopRadial: 5,
};
export const CELL_QUALITY: PipeQuality = {
  legRadial: 18,
  bendTubular: 18,
  bendRadial: 14,
  loopTubular: 36,
  loopRadial: 12,
};

const legLength = PIPE.legTop - PIPE.legBottom;

/** A straight leg: from the origin up, its foot at y = 0 of its frame (the instance goes to the leg's foot). */
export function legGeometry(q: PipeQuality): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(PIPE.r, PIPE.r, legLength, q.legRadial, 1, true);
  g.translate(0, legLength / 2, 0);
  return g;
}

/** The return bend: a half circle below the origin, from (0, 0, 0) to (pitch, 0, 0). */
export function bendGeometry(q: PipeQuality): THREE.BufferGeometry {
  return new THREE.TubeGeometry(new HalfCircle(), q.bendTubular, PIPE.r, q.bendRadial, false);
}

class HalfCircle extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }
  override getPoint(t: number, out = new THREE.Vector3()): THREE.Vector3 {
    const a = Math.PI * (1 - t);
    return out.set(PIPE.bendR + Math.cos(a) * PIPE.bendR, -Math.sin(a) * PIPE.bendR, 0);
  }
}

/** The points of the expansion loop from the top of a leg (the origin) to the underside of its header: `off` is the header's offset on z. */
export function loopPoints(off: number): THREE.Vector3[] {
  const w = PIPE.loopWidth;
  const top = PIPE.headerY - PIPE.headerR + 0.012 - PIPE.legTop;
  return [
    v3(0, 0, 0),
    v3(0, 0.04, 0),
    v3(w * 0.55, 0.1, off * 0.12),
    v3(w, 0.18, off * 0.32),
    v3(w * 0.95, 0.26, off * 0.55),
    v3(w * 0.35, 0.31, off * 0.82),
    v3(0, top - 0.05, off),
    v3(0, top, off),
  ];
}

export function loopGeometry(q: PipeQuality, off: number): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(loopPoints(off), false, 'centripetal');
  return new THREE.TubeGeometry(curve, q.loopTubular, PIPE.r * 0.78, q.loopRadial, false);
}

/** A header's piece along x, centred at the origin, its length comes from the instance's scale on Y turned to x (length 1). */
export function headerGeometry(radial: number): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(PIPE.headerR, PIPE.headerR, 1, radial, 1, false);
  g.rotateZ(Math.PI / 2);
  return g;
}

export interface HeaderRun {
  /** Height is fixed; a run along x at this z, from x0 to x1, of a zone and a side. */
  z: number;
  x0: number;
  x1: number;
  zone: 0 | 1 | 2;
  side: 0 | 1;
}

/** The header runs of a list of U-pipes: for each row and each side, contiguous legs of one zone. */
export function headerRuns(us: UPipe[]): HeaderRun[] {
  const out: HeaderRun[] = [];
  const rows = new Map<number, UPipe[]>();
  for (const u of us) {
    const r = rows.get(u.z);
    if (r) r.push(u);
    else rows.set(u.z, [u]);
  }
  for (const [z, row] of rows) {
    row.sort((a, b) => a.x0 - b.x0);
    let start = 0;
    for (let i = 1; i <= row.length; i++) {
      const brk = i === row.length || row[i].zone !== row[start].zone || row[i].x0 - row[i - 1].x1 > PIPE.pitch * 1.5;
      if (!brk) continue;
      const a = row[start];
      const b = row[i - 1];
      const pad = PIPE.headerR + 0.02;
      out.push(
        { z: z - PIPE.headerOffset, x0: a.x0 - pad, x1: b.x0 + pad, zone: a.zone, side: 0 },
        { z: z + PIPE.headerOffset, x0: a.x1 - pad, x1: b.x1 + pad, zone: a.zone, side: 1 },
      );
      start = i;
    }
  }
  return out;
}

export interface PipeField {
  group: THREE.Group;
  us: UPipe[];
  legs: Leg[];
  runs: HeaderRun[];
  /** Strips of the section: straight legs on the two planes (x or z, and whether on the negative side). */
  stripsZ0: number[];
  stripsX0: number[];
  /** U-bends on the plane z = 0. */
  bendsZ0: UPipe[];
  meshes: Record<'legs' | 'bends' | 'loopsFeed' | 'loopsBack' | 'headers' | 'bars' | 'collars' | 'mains', THREE.Mesh>;
}

const instanced = (geo: THREE.BufferGeometry, mat: THREE.Material, n: number, name: string): THREE.InstancedMesh => {
  const m = new THREE.InstancedMesh(geo, mat, n);
  m.name = name;
  m.castShadow = false;
  m.receiveShadow = true;
  m.userData.noShadow = true;
  m.frustumCulled = false;
  return m;
};

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const S = new THREE.Vector3();
const T = new THREE.Vector3();

/** The whole field, in the silo frame. Every piece is instanced and stays inside the stone: no shadow. */
export function buildPipeField(
  steel: THREE.Material,
  spacerSteel: THREE.Material,
  mainSteel: THREE.Material,
): PipeField {
  const q = FIELD_QUALITY;
  const us = pipeLattice();
  const legs = legsOf(us);
  const group = new THREE.Group();
  group.name = 'pipe-field';

  const legMesh = instanced(legGeometry(q), steel, legs.length, 'legs');
  legs.forEach((l, i) => {
    legMesh.setMatrixAt(i, M.makeTranslation(l.x, PIPE.legBottom, l.z));
  });

  const bendMesh = instanced(bendGeometry(q), steel, us.length, 'bends');
  us.forEach((u, i) => bendMesh.setMatrixAt(i, M.makeTranslation(u.x0, PIPE.legBottom, u.z)));

  const feed = legs.filter((l) => l.side === 0);
  const back = legs.filter((l) => l.side === 1);
  const loopA = instanced(loopGeometry(q, -PIPE.headerOffset), steel, feed.length, 'loops-feed');
  feed.forEach((l, i) => loopA.setMatrixAt(i, M.makeTranslation(l.x, PIPE.legTop, l.z)));
  const loopB = instanced(loopGeometry(q, PIPE.headerOffset), steel, back.length, 'loops-back');
  back.forEach((l, i) => loopB.setMatrixAt(i, M.makeTranslation(l.x, PIPE.legTop, l.z)));

  const runs = headerRuns(us);
  const headerMesh = instanced(headerGeometry(8), steel, runs.length, 'headers');
  runs.forEach((r, i) => {
    Q.identity();
    M.compose(T.set((r.x0 + r.x1) / 2, PIPE.headerY, r.z), Q, S.set(r.x1 - r.x0, 1, 1));
    headerMesh.setMatrixAt(i, M);
  });

  // the spacers: a bar along each row at the two levels, collars on the legs
  const zs = [...new Set(us.map((u) => u.z))];
  const barCount = zs.length * PIPE.spacerYs.length;
  const bars = instanced(new THREE.BoxGeometry(1, PIPE.barH, PIPE.barW), spacerSteel, barCount, 'bars');
  let b = 0;
  for (const y of PIPE.spacerYs)
    for (const z of zs) {
      const row = us.filter((u) => u.z === z);
      const x0 = Math.min(...row.map((u) => u.x0)) - PIPE.collarR;
      const x1 = Math.max(...row.map((u) => u.x1)) + PIPE.collarR;
      bars.setMatrixAt(b++, M.compose(T.set((x0 + x1) / 2, y, z), Q.identity(), S.set(x1 - x0, 1, 1)));
    }
  const collarGeo = new THREE.CylinderGeometry(PIPE.collarR, PIPE.collarR, PIPE.collarH, 6, 1, true);
  const collars = instanced(collarGeo, spacerSteel, legs.length * PIPE.spacerYs.length, 'collars');
  let c = 0;
  for (const y of PIPE.spacerYs) for (const l of legs) collars.setMatrixAt(c++, M.makeTranslation(l.x, y, l.z));

  // the ring mains: one per zone and per side, the headers come up to them, and spokes to the zone's two ducts on the plane z = 0
  const mainGeos: THREE.BufferGeometry[] = [];
  PIPE.ringR.forEach((R, zone) => {
    for (const side of [0, 1] as const) {
      const y = PIPE.ringY[side];
      const t = new THREE.TorusGeometry(R, PIPE.ringPipeR, 6, 96);
      t.rotateX(Math.PI / 2);
      t.translate(0, y, 0);
      mainGeos.push(t);
      for (const r of runs) {
        if (r.zone !== zone || r.side !== side) continue;
        // the header's nearest point to the ring, and the ring's nearest point to that
        const xc =
          r.x0 + r.x1 > 0 ? Math.sqrt(Math.max(0, R * R - r.z * r.z)) : -Math.sqrt(Math.max(0, R * R - r.z * r.z));
        const x = Math.min(r.x1, Math.max(r.x0, xc));
        const len = Math.hypot(x, r.z) || 1;
        mainGeos.push(
          stick(v3(x, PIPE.headerY, r.z), v3((x / len) * R, y, (r.z / len) * R), PIPE.headerR * 0.7, 5, false),
        );
      }
      const xDuct = PLANT.zoneX[zone] + (side === 0 ? -PLANT.pairHalf : PLANT.pairHalf);
      const s = xDuct === 0 ? 1 : Math.sign(xDuct);
      mainGeos.push(stick(v3(xDuct, y, 0), v3(s * R, y, 0), PIPE.ringPipeR, 8, false));
    }
  });
  const mains = new THREE.Mesh(joined(mainGeos), mainSteel);
  mains.name = 'mains';
  mains.castShadow = false;
  mains.userData.noShadow = true;

  group.add(legMesh, bendMesh, loopA, loopB, headerMesh, bars, collars, mains);
  for (const im of [legMesh, bendMesh, loopA, loopB, headerMesh, bars, collars]) {
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingBox();
    im.computeBoundingSphere();
  }

  const row0 = us.filter((u) => u.z === 0);
  const stripsZ0 = row0.flatMap((u) => [u.x0, u.x1]);
  const stripsX0 = legs.filter((l) => l.x === 0).map((l) => l.z);
  return {
    group,
    us,
    legs,
    runs,
    stripsZ0,
    stripsX0,
    bendsZ0: row0,
    meshes: {
      legs: legMesh,
      bends: bendMesh,
      loopsFeed: loopA,
      loopsBack: loopB,
      headers: headerMesh,
      bars,
      collars,
      mains,
    },
  };
}

/** The flat section of the pipes on a plane: strips for the straight legs, half rings for the bends. In the frame of the section plane (x along it, y up). */
export function legStrips(xs: number[]): THREE.BufferGeometry | null {
  if (!xs.length) return null;
  const parts = xs.map((x) => {
    const g = new THREE.PlaneGeometry(2 * PIPE.r, PIPE.legTop + 0.04 - PIPE.legBottom);
    g.translate(x, (PIPE.legTop + 0.04 + PIPE.legBottom) / 2, 0);
    return g;
  });
  return joined(parts);
}

export function bendStrips(us: { x0: number }[]): THREE.BufferGeometry | null {
  if (!us.length) return null;
  const parts = us.map((u) => {
    const g = new THREE.RingGeometry(PIPE.bendR - PIPE.r, PIPE.bendR + PIPE.r, 20, 1, Math.PI, Math.PI);
    g.translate(u.x0 + PIPE.bendR, PIPE.legBottom, 0);
    return g;
  });
  return joined(parts);
}

/** The same frames of the spacers for a block of a few pipes (no instancing). */
export function spacerGeometry(us: UPipe[]): { bars: THREE.BufferGeometry; collars: THREE.BufferGeometry } {
  const bars: THREE.BufferGeometry[] = [];
  const collars: THREE.BufferGeometry[] = [];
  const zs = [...new Set(us.map((u) => u.z))];
  for (const y of PIPE.spacerYs) {
    for (const z of zs) {
      const row = us.filter((u) => u.z === z);
      const x0 = Math.min(...row.map((u) => u.x0)) - PIPE.collarR;
      const x1 = Math.max(...row.map((u) => u.x1)) + PIPE.collarR;
      bars.push(box((x0 + x1) / 2, y, z, x1 - x0, PIPE.barH, PIPE.barW));
    }
    for (const l of legsOf(us)) {
      const g = new THREE.CylinderGeometry(PIPE.collarR, PIPE.collarR, PIPE.collarH, 18, 1, false);
      g.translate(l.x, y, l.z);
      collars.push(g);
    }
  }
  return { bars: joined(bars), collars: joined(collars) };
}
