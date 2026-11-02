import * as THREE from 'three';
import { MAT, emissive, mesh } from '@onigam/lab-kit/three';
import { TAU, box, joined, stick, tubeGeometry, v3 } from '../common';
import { AZIMUTH, DEG, LEVEL, SILO, SITE, siteFromSilo, wallPoint } from '../dims';
import { atAzimuth, type WallRisers } from '../machine/silo';
import { concreteMap, tiled, vnoise } from '../textures';
import { metricBox, type BuildingMaterials } from './buildings';
import { patchSnow } from './snow';
import { terrainHeight } from './terrain';

// What stands on the plot and around the village: the annex and the transformer at the silo's foot, the fence and its gate, the medium-voltage line on its wooden poles, the solar field, the
// far wind farm, the network's trench drawn open with its two pipes on their sand, the cellar with a house's substation. Everything ends on something: a wire on its insulator, a pipe in a wall.

// ------------------------------------------------------------------------------------------------ the annex

export interface AnnexBuild {
  group: THREE.Group;
  /** The point of its long wall where the stub of the cable riser arrives, silo frame. */
  wallPoint: THREE.Vector3;
  /** Where the transformer's cable comes in, silo frame. */
  inlet: THREE.Vector3;
}

/** The annex at the silo's foot (seen in a photograph, S14; read as electrical): a low clad box, its long wall tangent to the slab under the cable riser. In the silo frame. */
export function buildAnnex(m: BuildingMaterials): AnnexBuild {
  const A = SITE.annex;
  const group = new THREE.Group();
  group.name = 'electrical-annex';
  const g = atAzimuth(AZIMUTH.cable);
  // local x outward from the axis: its inner wall touches the slab's edge
  const x0 = SILO.slabR;
  const cx = x0 + A.depth / 2;
  const concrete = patchSnow(
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: tiled(concreteMap(), 0.5), roughness: 0.95 }),
    { lo: 0.6, hi: 0.9 },
  );
  g.add(mesh(box(cx, 0.1, 0, A.depth + 0.2, 0.2, A.length + 0.2), concrete));
  g.add(mesh(metricBox(cx, 0.2 + (A.height - 0.2) / 2, 0, A.depth, A.height - 0.2, A.length), m.cladHall));
  // a low flat roof with its flashing, a double steel door, louvres
  const roof = patchSnow(new THREE.MeshStandardMaterial({ color: 0x3f4447, roughness: 0.7, metalness: 0.3 }), {
    lo: 0.6,
    hi: 0.9,
  });
  g.add(mesh(box(cx, A.height + A.roofH / 2, 0, A.depth + 0.3, A.roofH, A.length + 0.3), roof));
  g.add(mesh(box(x0 + A.depth + 0.04, 1.2, -A.length / 4, 0.06, 2.1, 1.6), m.door));
  const trim: THREE.BufferGeometry[] = [box(x0 + A.depth + 0.07, 1.2, -A.length / 4, 0.03, 2.1, 0.04)];
  for (let i = 0; i < 6; i++) trim.push(box(x0 + A.depth + 0.05, 1.3 + i * 0.11, A.length / 4, 0.05, 0.05, 1.1));
  g.add(mesh(joined(trim), m.frame));
  group.add(g);
  const a = wallPoint(AZIMUTH.cable, SILO.slabR, LEVEL.slabTop + 0.14);
  return { group, wallPoint: v3(a[0], a[1], a[2]), inlet: v3(...wallPoint(AZIMUTH.cable, x0 + A.depth, 0.4)) };
}

// ------------------------------------------------------------------------------------------------ the transformer and the line

export interface TransformerBuild {
  group: THREE.Group;
  /** Tops of the three medium-voltage bushings, and the low-voltage side where the cable to the annex leaves. */
  mv: THREE.Vector3[];
  lv: THREE.Vector3;
}

/** A pad-mounted oil transformer, 20 kV to 400 V (estimate): a concrete pad, a tank with radiators, an expansion tank, three bushings. Site frame. */
export function buildTransformer(m: BuildingMaterials): TransformerBuild {
  const T = SITE.transformer;
  const g = new THREE.Group();
  g.name = 'pad-transformer';
  const pad = T.padH;
  g.add(mesh(box(T.x, pad / 2, T.z, T.padW, pad, T.padD), m.concrete));
  const paint = patchSnow(new THREE.MeshStandardMaterial({ color: 0x6d7f78, roughness: 0.55, metalness: 0.4 }), {
    lo: 0.6,
    hi: 0.9,
  });
  const tankBottom = pad + 0.12;
  // the skids
  g.add(
    mesh(
      joined([
        box(T.x, pad + 0.06, T.z - T.tankD * 0.34, T.tankW * 1.1, 0.12, 0.14),
        box(T.x, pad + 0.06, T.z + T.tankD * 0.34, T.tankW * 1.1, 0.12, 0.14),
      ]),
      MAT.steelBlack(),
    ),
  );
  g.add(mesh(box(T.x, tankBottom + T.tankH / 2, T.z, T.tankW, T.tankH, T.tankD), paint));
  // the radiators: thin fins on the two long sides
  const fins: THREE.BufferGeometry[] = [];
  for (let i = 0; i < T.finsEach; i++) {
    const x = T.x - T.tankW * 0.42 + (i * T.tankW * 0.84) / (T.finsEach - 1);
    for (const s of [-1, 1])
      fins.push(box(x, tankBottom + T.tankH * 0.5, T.z + s * (T.tankD / 2 + 0.16), 0.05, T.tankH * 0.82, 0.32));
  }
  g.add(mesh(joined(fins), paint));
  // the lid, the conservator, the bushings
  g.add(mesh(box(T.x, tankBottom + T.tankH + 0.03, T.z, T.tankW + 0.06, 0.06, T.tankD + 0.06), paint));
  const consY = tankBottom + T.tankH + 0.34;
  g.add(
    mesh(
      stick(
        v3(T.x - T.tankW * 0.42, consY, T.z - T.tankD * 0.25),
        v3(T.x + T.tankW * 0.42, consY, T.z - T.tankD * 0.25),
        0.16,
        16,
      ),
      paint,
    ),
  );
  for (const dx of [-0.5, 0.5])
    g.add(
      mesh(
        stick(
          v3(T.x + dx, tankBottom + T.tankH + 0.05, T.z - T.tankD * 0.25),
          v3(T.x + dx, consY, T.z - T.tankD * 0.25),
          0.03,
          8,
        ),
        paint,
      ),
    );
  const porcelain = new THREE.MeshStandardMaterial({ color: 0x8b5c3f, roughness: 0.35 });
  const mv: THREE.Vector3[] = [];
  for (const dx of [-0.45, 0, 0.45]) {
    const x = T.x + dx + 0.1;
    const z = T.z + T.tankD * 0.2;
    const parts: THREE.BufferGeometry[] = [];
    const y0 = tankBottom + T.tankH + 0.05;
    for (let k = 0; k < 4; k++)
      parts.push(new THREE.CylinderGeometry(0.06, 0.08, 0.1, 10).translate(x, y0 + 0.08 + k * 0.1, z));
    g.add(mesh(joined(parts), porcelain));
    mv.push(v3(x, y0 + 0.5, z));
  }
  // the low-voltage box on the side, its steel duct along the ground goes to the annex
  const lv = v3(T.x - T.tankW / 2 - 0.05, pad + 0.5, T.z);
  g.add(mesh(box(lv.x + 0.02, lv.y, lv.z, 0.16, 0.5, 0.6), paint));
  return { group: g, mv, lv };
}

export interface LineBuild {
  group: THREE.Group;
  /** The points of each wire, from the far pole to the terminal pole; the first pole's insulators. */
  phases: THREE.Vector3[][];
  /** The insulators' tips, pole by pole (tests). */
  insulators: THREE.Vector3[][];
  /** The flows' path along the wires, far end first, then down to the transformer. */
  path: THREE.Vector3[];
  /** Where the three drop wires end: on the transformer's bushings. */
  drops: { from: THREE.Vector3; to: THREE.Vector3 }[];
}

/** The medium-voltage line: wooden poles with their crossarm and three insulators, three wires that sag, three drops from the first pole to the bushings. */
export function buildLine(m: BuildingMaterials, bushings: THREE.Vector3[]): LineBuild {
  const L = SITE.line;
  const group = new THREE.Group();
  group.name = 'power-line';
  const wood = new THREE.MeshStandardMaterial({ color: 0x4d3b2d, roughness: 0.95 });
  const porcelain = new THREE.MeshStandardMaterial({ color: 0x8b5c3f, roughness: 0.32 });
  const steelMat = MAT.steelBlack();
  const poleGeos: THREE.BufferGeometry[] = [];
  const armGeos: THREE.BufferGeometry[] = [];
  const insGeos: THREE.BufferGeometry[] = [];
  const insulators: THREE.Vector3[][] = [];
  const dirAt = (i: number): number => {
    // the crossarm is square to the bisector of the two spans
    const a = L.poles[Math.max(0, i - 1)];
    const b = L.poles[Math.min(L.poles.length - 1, i + 1)];
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  };
  L.poles.forEach(([x, z], i) => {
    const y0 = terrainHeight(x, z);
    const top = y0 + L.poleH;
    // the pole goes into the ground; a little lean is not modelled
    poleGeos.push(new THREE.CylinderGeometry(0.11, 0.16, L.poleH + 0.8, 10).translate(x, y0 + L.poleH / 2 - 0.4, z));
    const dir = dirAt(i);
    const nx = -Math.sin(dir);
    const nz = Math.cos(dir);
    const armY = top - 0.35;
    armGeos.push(
      stick(
        v3(x - (nx * L.crossArm) / 2, armY, z - (nz * L.crossArm) / 2),
        v3(x + (nx * L.crossArm) / 2, armY, z + (nz * L.crossArm) / 2),
        0.05,
        6,
      ),
    );
    // two braces under the arm
    for (const s of [-1, 1])
      armGeos.push(stick(v3(x + s * nx * 0.7, armY - 0.03, z + s * nz * 0.7), v3(x, armY - 0.6, z), 0.02, 5));
    const tips: THREE.Vector3[] = [];
    for (const s of [-0.8, 0, 0.8]) {
      const px = x + s * nx * (L.crossArm / 2 / 0.8) * 0.8;
      const pz = z + s * nz * (L.crossArm / 2 / 0.8) * 0.8;
      // the middle one stands on the pole's top
      const yb = s === 0 ? top : armY + 0.05;
      insGeos.push(new THREE.CylinderGeometry(0.05, 0.075, 0.22, 8).translate(px, yb + 0.11, pz));
      tips.push(v3(px, yb + 0.22, pz));
    }
    insulators.push(tips);
  });
  group.add(mesh(joined(poleGeos), wood));
  group.add(mesh(joined(armGeos), steelMat));
  group.add(mesh(joined(insGeos), porcelain));

  // the wires: from each insulator to the next pole's same insulator, a parabola of sag
  const phases: THREE.Vector3[][] = [[], [], []];
  const wireGeos: THREE.BufferGeometry[] = [];
  for (let p = 0; p < 3; p++) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < insulators.length - 1; i++) {
      const a = insulators[i][p];
      const b = insulators[i + 1][p];
      const n = 10;
      for (let k = 0; k <= n; k++) {
        if (k === 0 && i > 0) continue;
        const t = k / n;
        const q = a.clone().lerp(b, t);
        q.y -= L.sag * (a.distanceTo(b) / 40) * 4 * t * (1 - t);
        pts.push(q);
      }
    }
    phases[p] = pts;
    wireGeos.push(tubeLine(pts, 0.012));
  }
  // the drops from the first pole's insulators to the transformer's bushings, a slack curve
  const drops: LineBuild['drops'] = [];
  for (let p = 0; p < 3; p++) {
    const a = insulators[0][p];
    const b = bushings[p];
    const mid = a.clone().lerp(b, 0.5);
    mid.y -= 0.5;
    wireGeos.push(tubeGeometry([a, mid, b], 0.012, 16, 5));
    drops.push({ from: a.clone(), to: b.clone() });
  }
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x25282b, roughness: 0.55, metalness: 0.4 });
  const wires = mesh(joined(wireGeos), wireMat);
  wires.castShadow = false;
  wires.userData.noShadow = true;
  group.add(wires);

  // the flows come from the far end to the first pole, then down to the bushing
  const towards = phases[1].slice().reverse();
  void m;
  return { group, phases, insulators, path: [...towards, bushings[1].clone()], drops };
}

function tubeLine(pts: THREE.Vector3[], r: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < pts.length - 1; i++) parts.push(stick(pts[i], pts[i + 1], r, 4, false));
  return joined(parts);
}

// ------------------------------------------------------------------------------------------------ the fence

/** A square of welded mesh, a map with its mipmaps: from afar it fades to a light veil instead of crawling, as thin wires would. */
function meshPanelMap(): THREE.DataTexture {
  const N = 64;
  const data = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const k = (j * N + i) * 4;
      const on = i % 16 < 2 || j % 16 < 2;
      data[k] = 90;
      data[k + 1] = 96;
      data[k + 2] = 100;
      data[k + 3] = on ? 255 : 0;
    }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** The yard's fence: posts on the gravel, rails, a welded mesh between them, the gate standing open. */
export function buildFence(): THREE.Group {
  const Y = SITE.yard;
  const g = new THREE.Group();
  g.name = 'fence';
  const posts: THREE.BufferGeometry[] = [];
  const panels: THREE.BufferGeometry[] = [];
  /** A panel between two points, its UVs in cells of 16 cm. */
  const panel = (ax: number, az: number, bx: number, bz: number, y0: number, y1: number) => {
    const L = Math.hypot(bx - ax, bz - az);
    const pos = [ax, y0, az, bx, y0, bz, bx, y1, bz, ax, y0, az, bx, y1, bz, ax, y1, az];
    const u = L / 0.64;
    const v = (y1 - y0) / 0.64;
    const uv = [0, 0, u, 0, u, v, 0, 0, u, v, 0, v];
    const p = new THREE.BufferGeometry();
    p.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    p.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    p.computeVertexNormals();
    panels.push(p);
  };
  const run = (x0: number, z0: number, x1: number, z1: number) => {
    const L = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(1, Math.round(L / Y.postEvery));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = x0 + (x1 - x0) * t;
      const z = z0 + (z1 - z0) * t;
      posts.push(stick(v3(x, -0.1, z), v3(x, Y.fenceH, z), 0.03, 6));
      if (i < n) {
        const xb = x0 + (x1 - x0) * ((i + 1) / n);
        const zb = z0 + (z1 - z0) * ((i + 1) / n);
        posts.push(stick(v3(x, Y.fenceH - 0.05, z), v3(xb, Y.fenceH - 0.05, zb), 0.014, 4, false));
        posts.push(stick(v3(x, 0.12, z), v3(xb, 0.12, zb), 0.014, 4, false));
        panel(x, z, xb, zb, 0.12, Y.fenceH - 0.05);
      }
    }
  };
  const gateA = Y.gateX - Y.gateW / 2;
  const gateB = Y.gateX + Y.gateW / 2;
  run(Y.x0, Y.z0, Y.x1, Y.z0);
  run(Y.x1, Y.z0, Y.x1, Y.z1);
  run(Y.x1, Y.z1, gateB, Y.z1);
  run(gateA, Y.z1, Y.x0, Y.z1);
  run(Y.x0, Y.z1, Y.x0, Y.z0);
  // the two gate leaves, open
  const leaf = (x: number, sign: 1 | -1) => {
    const a = v3(x, 0, Y.z1);
    const leafLen = Y.gateW / 2 - 0.1;
    const dx = sign * Math.cos(1.15) * leafLen;
    const dz = Math.sin(1.15) * leafLen;
    const b = v3(x + dx, 0, Y.z1 + dz);
    for (const h of [0.15, Y.fenceH - 0.1]) posts.push(stick(v3(a.x, h, a.z), v3(b.x, h, b.z), 0.02, 5, false));
    posts.push(stick(v3(b.x, 0.1, b.z), v3(b.x, Y.fenceH, b.z), 0.02, 5));
    panel(a.x, a.z, b.x, b.z, 0.15, Y.fenceH - 0.1);
  };
  leaf(gateA, -1);
  leaf(gateB, 1);
  const steel = new THREE.MeshStandardMaterial({ color: 0x8d9398, roughness: 0.5, metalness: 0.7 });
  g.add(mesh(joined(posts), steel));
  const wireMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: meshPanelMap(),
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.6,
  });
  const wire = mesh(joined(panels), wireMat);
  wire.castShadow = false;
  wire.receiveShadow = false;
  wire.userData.noShadow = true;
  g.add(wire);
  return g;
}

// ------------------------------------------------------------------------------------------------ the solar field

export interface SolarBuild {
  group: THREE.Group;
  /** Where its cable leaves, for the flows. */
  out: THREE.Vector3;
  feet: THREE.Vector3[];
}

/** A generic solar field: rows of tilted tables on posts, facing south. The scenario of the overflow; not at the real plot. */
export function buildSolar(m: BuildingMaterials): SolarBuild {
  const S = SITE.solar;
  const g = new THREE.Group();
  g.name = 'solar-field';
  const tilt = S.tiltDeg * DEG;
  const panelCount = S.rows * S.panels;
  const panelGeo = new THREE.BoxGeometry(S.panelW - 0.02, 0.04, S.panelL);
  const panelMat = patchSnow(new THREE.MeshStandardMaterial({ color: 0x18284a, roughness: 0.22, metalness: 0.65 }), {
    lo: 0.25,
    hi: 0.7,
    gain: 0.22,
  });
  const panels = new THREE.InstancedMesh(panelGeo, panelMat, panelCount);
  panels.name = 'panels';
  panels.castShadow = true;
  panels.receiveShadow = true;
  const q = new THREE.Quaternion().setFromAxisAngle(v3(1, 0, 0), tilt);
  const M = new THREE.Matrix4();
  const one = v3(1, 1, 1);
  const feet: THREE.Vector3[] = [];
  const posts: THREE.BufferGeometry[] = [];
  const rails: THREE.BufferGeometry[] = [];
  let k = 0;
  const hLow = S.postH;
  const dy = (Math.sin(tilt) * S.panelL) / 2;
  const dz = (Math.cos(tilt) * S.panelL) / 2;
  for (let r = 0; r < S.rows; r++) {
    const z = S.z0 + r * S.rowEvery;
    const y0 = terrainHeight(S.x0 + (S.panels * S.panelW) / 2, z);
    const cy = y0 + hLow + dy;
    for (let p = 0; p < S.panels; p++) {
      M.compose(v3(S.x0 + (p + 0.5) * S.panelW, cy, z), q, one);
      panels.setMatrixAt(k++, M);
    }
    // the table: two rails under the panels, posts every 2 panels
    const xEnd = S.x0 + S.panels * S.panelW;
    const yHi = cy + dy * 0.62 - 0.05;
    const zHi = z - dz * 0.62;
    const yLo = cy - dy * 0.62 - 0.05;
    const zLo = z + dz * 0.62;
    rails.push(stick(v3(S.x0, yHi, zHi), v3(xEnd, yHi, zHi), 0.03, 4));
    rails.push(stick(v3(S.x0, yLo, zLo), v3(xEnd, yLo, zLo), 0.03, 4));
    for (let p = 1; p < S.panels; p += 3) {
      const x = S.x0 + p * S.panelW;
      posts.push(stick(v3(x, y0 - 0.2, zLo), v3(x, yLo, zLo), 0.04, 6));
      posts.push(stick(v3(x, y0 - 0.2, zHi), v3(x, yHi, zHi), 0.04, 6));
      rails.push(stick(v3(x, yLo, zLo), v3(x, yHi, zHi), 0.024, 4));
      feet.push(v3(x, y0, zLo));
    }
  }
  panels.instanceMatrix.needsUpdate = true;
  panels.computeBoundingBox();
  panels.computeBoundingSphere();
  g.add(panels);
  const steel = patchSnow(new THREE.MeshStandardMaterial({ color: 0x9aa0a5, roughness: 0.5, metalness: 0.7 }), {
    lo: 0.7,
    hi: 0.95,
  });
  g.add(mesh(joined(posts), steel));
  g.add(mesh(joined(rails), steel));
  // the inverter's cabinet at the end of the field, on its pad
  const invX = S.x0 - 1.4;
  const invZ = S.z0 + (S.rows * S.rowEvery) / 2;
  g.add(mesh(box(invX, 0.1, invZ, 1.5, 0.2, 1), m.concrete));
  g.add(mesh(box(invX, 0.2 + 0.85, invZ, 1.2, 1.7, 0.7), m.frame));
  return { group: g, out: v3(invX, 1.2, invZ), feet };
}

// ------------------------------------------------------------------------------------------------ the wind farm

export interface WindBuild {
  group: THREE.Group;
  rotors: THREE.Group[];
  /** Foot of each tower. */
  feet: THREE.Vector3[];
}

/** A distant wind farm on the ridge: why prices fall at night. Towers from the land, a nacelle, three blades on a hub that turns. */
export function buildWind(): WindBuild {
  const W = SITE.wind;
  const group = new THREE.Group();
  group.name = 'wind-farm';
  const white = patchSnow(new THREE.MeshStandardMaterial({ color: 0xd9dcde, roughness: 0.55 }), { lo: 0.9, hi: 1 });
  const towers: THREE.BufferGeometry[] = [];
  const nacelles: THREE.BufferGeometry[] = [];
  const rotors: THREE.Group[] = [];
  const feet: THREE.Vector3[] = [];
  // one blade: a thin tapered plate along +Y of the hub
  const blade = (): THREE.BufferGeometry => {
    const pos: number[] = [];
    const prof: [number, number][] = [
      [0.02, 0.5],
      [0.2, 1.55],
      [0.55, 0.9],
      [1, 0.12],
    ];
    for (let i = 0; i < prof.length - 1; i++) {
      const [t0, w0] = prof[i];
      const [t1, w1] = prof[i + 1];
      const y0 = t0 * W.rotorR;
      const y1 = t1 * W.rotorR;
      const a = [-w0 * 0.4, y0, 0];
      const b = [w0 * 0.6, y0, 0.15];
      const c = [w1 * 0.6, y1, 0.08];
      const d = [-w1 * 0.4, y1, 0];
      for (const q of [a, b, c, a, c, d]) pos.push(q[0], q[1], q[2]);
      for (const q of [a, c, b, a, d, c]) pos.push(q[0], q[1], q[2] - 0.2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  };
  const oneBlade = blade();
  W.turbines.forEach(([x, z], i) => {
    const y0 = terrainHeight(x, z);
    feet.push(v3(x, y0, z));
    towers.push(new THREE.CylinderGeometry(W.towerR * 0.55, W.towerR, W.hub, 14).translate(x, y0 + W.hub / 2 - 0.5, z));
    towers.push(new THREE.CylinderGeometry(W.towerR * 2.6, W.towerR * 2.8, 1.2, 14).translate(x, y0 - 0.1, z));
    const yaw = -0.5 + i * 0.03;
    const nac = new THREE.BoxGeometry(4.2, 4, 12);
    nac.translate(0, 0, -1);
    nac.rotateY(yaw);
    nac.translate(x, y0 + W.hub, z);
    nacelles.push(nac);
    const rotor = new THREE.Group();
    rotor.name = 'turbine-rotor';
    rotor.position.set(x, y0 + W.hub, z);
    rotor.rotation.y = yaw;
    const spinner = new THREE.Group();
    spinner.name = 'spinner';
    spinner.position.z = 5.5;
    for (let b = 0; b < 3; b++) {
      const m = new THREE.Mesh(oneBlade, white);
      m.rotation.z = (b / 3) * TAU;
      m.castShadow = false;
      spinner.add(m);
    }
    const hub = new THREE.Mesh(new THREE.SphereGeometry(2.1, 12, 8), white);
    hub.castShadow = false;
    spinner.add(hub);
    rotor.add(spinner);
    group.add(rotor);
    rotors.push(spinner);
  });
  const t = mesh(joined(towers), white);
  t.castShadow = false;
  group.add(t);
  const n = mesh(joined(nacelles), white);
  n.castShadow = false;
  group.add(n);
  return { group, rotors, feet };
}

// ------------------------------------------------------------------------------------------------ the trench

export interface TrenchBuild {
  group: THREE.Group;
  /** The polyline of each pipe, from the foot of the riser to the end (the flows use them). */
  supply: THREE.Vector3[];
  ret: THREE.Vector3[];
  /** The pipes' first points, on the riser's feet. */
  start: { supply: THREE.Vector3; ret: THREE.Vector3 };
  /** Their last points, in the cellar's wall. */
  end: { supply: THREE.Vector3; ret: THREE.Vector3 };
  /** The floor of the trench, m. */
  floorY: number;
  pipeY: number;
}

/** Offset a polyline sideways, as a list of points (mitred at the corners). */
function offsetLine(pts: readonly (readonly [number, number])[], d: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    // the bisector normal: from the segments on both sides
    const n1 = i > 0 ? seg(pts[i - 1], pts[i]) : seg(pts[i], pts[i + 1]);
    const n2 = i < pts.length - 1 ? seg(pts[i], pts[i + 1]) : seg(pts[i - 1], pts[i]);
    let nx = n1[0] + n2[0];
    let nz = n1[1] + n2[1];
    const l = Math.hypot(nx, nz) || 1;
    nx /= l;
    nz /= l;
    const cos = nx * n1[0] + nz * n1[1];
    const k = d / Math.max(0.4, cos);
    out.push([pts[i][0] + nx * k, pts[i][1] + nz * k]);
  }
  return out;
}

const seg = (a: readonly [number, number], b: readonly [number, number]): [number, number] => {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const l = Math.hypot(dx, dz) || 1;
  return [-dz / l, dx / l];
};

/**
 * The network's trench, drawn open: earth walls with timber along the lips, a bed of sand, two pre-insulated pipes on it (a red and a blue band show which is which), lengths of warning tape
 * and a spoil heap along one side. It starts at the foot of the riser and ends in the cellar's wall; a spur goes to the school and another to the boiler plant.
 */
export function buildTrench(m: BuildingMaterials, risers: WallRisers, yaw: number): TrenchBuild {
  const T = SITE.trench;
  const group = new THREE.Group();
  group.name = 'dh-trench';
  // seen from inside the hole: both faces
  const earth = new THREE.MeshStandardMaterial({
    color: 0x8a6c4e,
    map: tiled(concreteMap(), 0.9),
    roughness: 1,
    side: THREE.DoubleSide,
  });
  const sand = new THREE.MeshStandardMaterial({ color: 0x9c8863, roughness: 1, side: THREE.DoubleSide });
  const timber = new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 0.9 });
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x232527, roughness: 0.62, metalness: 0.05 });
  const floorY = -T.depth;
  const pipeY = floorY + T.sand + T.pipeR;
  const walls: THREE.BufferGeometry[] = [];
  const beds: THREE.BufferGeometry[] = [];
  const lips: THREE.BufferGeometry[] = [];
  const pipes: THREE.BufferGeometry[] = [];
  const bandsHot: THREE.BufferGeometry[] = [];
  const bandsCold: THREE.BufferGeometry[] = [];

  const wallOf = (pts: readonly (readonly [number, number])[]) => {
    const w = T.width / 2;
    const left = offsetLine(pts, w);
    const right = offsetLine(pts, -w);
    for (let i = 0; i < pts.length - 1; i++) {
      walls.push(quadWall(left[i], left[i + 1], floorY));
      walls.push(quadWall(right[i + 1], right[i], floorY));
      beds.push(quadFloor(left[i], left[i + 1], right[i + 1], right[i], floorY + T.sand));
      beds.push(quadFloor(left[i], left[i + 1], right[i + 1], right[i], floorY));
      // boards along the lips: they sit on the ground and cover the edge of the hole
      for (const side of [left, right]) {
        const a = side[i];
        const b = side[i + 1];
        lips.push(plank(a, b, 0.05, 0.16, 0.04));
      }
    }
    // the end walls
    walls.push(quadWall(right[0], left[0], floorY));
    walls.push(quadWall(left[left.length - 1], right[right.length - 1], floorY));
  };
  wallOf(T.path);
  wallOf(T.schoolSpur);
  wallOf(T.boilerSpur);
  // the round ends of the hole in the land: a half disc of boards, a wall follows it
  group.add(mesh(joined(walls), earth));
  group.add(mesh(joined(beds), sand));
  group.add(mesh(joined(lips), timber));

  // ---- the two pipes of the main run
  const off = T.pipeR + T.gap / 2;
  const mainA = offsetLine(T.path, off);
  const mainB = offsetLine(T.path, -off);
  // which side of the path the riser's pipes are on: the feet come from the silo frame
  const foot = (p: THREE.Vector3): THREE.Vector3 => {
    const q = siteFromSilo(p.x, p.y, p.z);
    return v3(q[0], q[1], q[2]);
  };
  void yaw;
  const footS = foot(risers.waterFoot.supply);
  const footR = foot(risers.waterFoot.ret);
  const nearerA =
    Math.hypot(footS.x - mainA[0][0], footS.z - mainA[0][1]) < Math.hypot(footS.x - mainB[0][0], footS.z - mainB[0][1]);
  const sLine = (nearerA ? mainA : mainB).map(([x, z]) => v3(x, pipeY, z));
  const rLine = (nearerA ? mainB : mainA).map(([x, z]) => v3(x, pipeY, z));
  const supply = [footS.clone(), ...sLine];
  const ret = [footR.clone(), ...rLine];
  const pipeOf = (pts: THREE.Vector3[]) => {
    const curve = new THREE.CatmullRomCurve3(rounded(pts), false, 'centripetal');
    pipes.push(new THREE.TubeGeometry(curve, pts.length * 22, T.pipeR, 12, false));
  };
  pipeOf(supply);
  pipeOf(ret);
  // the spurs: a pair of pipes from the main run, each from its pipe
  const spur = (path: readonly (readonly [number, number])[]) => {
    const a = offsetLine(path, off).map(([x, z]) => v3(x, pipeY, z));
    const b = offsetLine(path, -off).map(([x, z]) => v3(x, pipeY, z));
    pipes.push(stickLine(a, T.pipeR));
    pipes.push(stickLine(b, T.pipeR));
    bandEvery(a, bandsHot);
    bandEvery(b, bandsCold);
  };
  spur(T.schoolSpur);
  spur(T.boilerSpur);
  bandEvery(sLine, bandsHot);
  bandEvery(rLine, bandsCold);
  group.add(mesh(joined(pipes), pipeMat));
  group.add(mesh(joined(bandsHot), new THREE.MeshStandardMaterial({ color: 0xb5362b, roughness: 0.6 })));
  group.add(mesh(joined(bandsCold), new THREE.MeshStandardMaterial({ color: 0x2d62a8, roughness: 0.6 })));

  // ---- a long spoil heap along the road side, snow takes it too; tape on stakes along the far lip
  const spoil = patchSnow(new THREE.MeshStandardMaterial({ color: 0x57442f, roughness: 1 }), {
    lo: 0.4,
    hi: 0.8,
    gain: 0.85,
  });
  // it stops short of the corner and of the cellar's pit
  const heapLine: [number, number][] = [
    [-15.5, T.path[3][1] + T.width / 2 + 1.35],
    [SITE.cellar.x1 + 3, T.path[3][1] + T.width / 2 + 1.35],
  ];
  group.add(mesh(spoilRidge(heapLine), spoil));
  const stakes: THREE.BufferGeometry[] = [];
  const tape = new THREE.MeshStandardMaterial({ color: 0xd84f1f, roughness: 0.65 });
  const tapes: THREE.BufferGeometry[] = [];
  const stakeLine: [number, number][] = [
    [-14.5, T.path[3][1] - T.width / 2 - 0.55],
    [SITE.cellar.x1 + 1, T.path[3][1] - T.width / 2 - 0.55],
  ];
  for (let i = 0; i < stakeLine.length - 1; i++) {
    const [ax, az] = stakeLine[i];
    const [bx, bz] = stakeLine[i + 1];
    const L = Math.hypot(bx - ax, bz - az);
    const n = Math.floor(L / 3);
    let prev: THREE.Vector3 | null = null;
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      stakes.push(stick(v3(x, -0.1, z), v3(x, 1.02, z), 0.016, 5));
      const top = v3(x, 0.98, z);
      if (prev) tapes.push(stick(prev, top, 0.012, 4, false));
      prev = top;
    }
  }
  group.add(mesh(joined(stakes), timber));
  const tp = mesh(joined(tapes), tape);
  tp.castShadow = false;
  tp.userData.noShadow = true;
  group.add(tp);
  void m;
  return {
    group,
    supply: curvePoints(supply),
    ret: curvePoints(ret),
    start: { supply: footS, ret: footR },
    end: { supply: sLine[sLine.length - 1].clone(), ret: rLine[rLine.length - 1].clone() },
    floorY,
    pipeY,
  };
}

/** A low ridge of dug earth along a line, irregular: rows of points across and along, its edges on the ground. */
function spoilRidge(line: [number, number][]): THREE.BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  const uv: number[] = [];
  const across = 8;
  let row = 0;
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, az] = line[i];
    const [bx, bz] = line[i + 1];
    const L = Math.hypot(bx - ax, bz - az);
    const nx = -(bz - az) / L;
    const nz = (bx - ax) / L;
    const steps = Math.ceil(L / 0.6);
    for (let k = i === 0 ? 0 : 1; k <= steps; k++) {
      const t = k / steps;
      const s = i * 1000 + t * L;
      const px = ax + (bx - ax) * t;
      const pz = az + (bz - az) * t;
      // the heap fades out at its two ends
      const ends = Math.min(1, Math.min(t * L, (1 - t) * L) / 1.5);
      const h = (0.62 + 0.3 * (vnoise(s * 0.33, 3.1) - 0.5) * 2) * Math.sqrt(ends);
      const w = 1 + 0.25 * (vnoise(s * 0.2, 9.7) - 0.5) * 2;
      for (let c = 0; c <= across; c++) {
        const u = (c / across) * 2 - 1;
        const y = h * (1 - u * u) * (0.9 + 0.2 * vnoise(s * 1.1, c * 3.3));
        pos.push(px + nx * u * w, y - 0.02, pz + nz * u * w);
        uv.push(0, 0);
      }
      row++;
    }
  }
  for (let r = 0; r < row - 1; r++)
    for (let c = 0; c < across; c++) {
      const a = r * (across + 1) + c;
      const b = a + 1;
      const d = a + across + 1;
      const e = d + 1;
      idx.push(a, b, d, b, e, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const curvePoints = (pts: THREE.Vector3[]): THREE.Vector3[] =>
  new THREE.CatmullRomCurve3(rounded(pts), false, 'centripetal').getPoints(pts.length * 8);

/** More points near the corners, so that the Catmull-Rom keeps the straight runs straight. */
function rounded(pts: THREE.Vector3[]): THREE.Vector3[] {
  const out: THREE.Vector3[] = [pts[0].clone()];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const c = pts[i + 1];
    const toA = a.clone().sub(b);
    const toC = c.clone().sub(b);
    const r = Math.min(0.6, toA.length() / 2.2, toC.length() / 2.2);
    out.push(b.clone().addScaledVector(toA.normalize(), r), b.clone().addScaledVector(toC.normalize(), r));
  }
  out.push(pts[pts.length - 1].clone());
  return out;
}

function stickLine(pts: THREE.Vector3[], r: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < pts.length - 1; i++) parts.push(stick(pts[i], pts[i + 1], r, 12));
  return joined(parts);
}

function bandEvery(pts: THREE.Vector3[], list: THREE.BufferGeometry[]): void {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const L = a.distanceTo(b);
    const d = b.clone().sub(a).normalize();
    for (let t = 2; t < L - 1; t += 4) {
      const c = a.clone().addScaledVector(d, t);
      list.push(
        stick(c.clone().addScaledVector(d, -0.06), c.clone().addScaledVector(d, 0.06), SITE.trench.pipeR + 0.004, 12),
      );
    }
  }
}

function quadWall(a: readonly [number, number], b: readonly [number, number], y0: number): THREE.BufferGeometry {
  const pos = [a[0], y0, a[1], b[0], y0, b[1], b[0], 0.02, b[1], a[0], y0, a[1], b[0], 0.02, b[1], a[0], 0.02, a[1]];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

function quadFloor(
  a: readonly [number, number],
  b: readonly [number, number],
  c: readonly [number, number],
  d: readonly [number, number],
  y: number,
): THREE.BufferGeometry {
  const pos = [a[0], y, a[1], c[0], y, c[1], b[0], y, b[1], a[0], y, a[1], d[0], y, d[1], c[0], y, c[1]];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

function plank(
  a: readonly [number, number],
  b: readonly [number, number],
  thick: number,
  w: number,
  y: number,
): THREE.BufferGeometry {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const g = new THREE.BoxGeometry(L + 0.2, thick, w);
  g.rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0]));
  g.translate((a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2);
  return g;
}

// ------------------------------------------------------------------------------------------------ the cellar

export interface CellarBuild {
  group: THREE.Group;
  /** The foot of the plate exchanger, on the pit's floor. */
  feetY: number;
  floorY: number;
  /** Where the network's two pipes come through the east wall, the exchanger's two nozzles. */
  pipeIn: THREE.Vector3[];
  pipeOut: THREE.Vector3[];
}

/**
 * A house's substation, drawn open: the pit beside the house that opens its cellar. Concrete walls and a floor, the plate exchanger on its frame: no flame at home. The network's two pipes come
 * in through the east wall; the house's two go in through the west wall, under the house.
 */
export function buildCellar(m: BuildingMaterials, ends: { supply: THREE.Vector3; ret: THREE.Vector3 }): CellarBuild {
  const C = SITE.cellar;
  const group = new THREE.Group();
  group.name = 'house-substation';
  const floorY = -C.depth;
  const conc = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: tiled(concreteMap(), 0.5),
    roughness: 0.95,
    side: THREE.DoubleSide,
  });
  const t = 0.18;
  const w = C.x1 - C.x0;
  const d = C.z1 - C.z0;
  const cx = (C.x0 + C.x1) / 2;
  const cz = (C.z0 + C.z1) / 2;
  // the walls stop just above the ground (their top hides the edge of the hole)
  const top = 0.1;
  const H = top - floorY;
  const walls = [
    box(cx, floorY + H / 2, C.z0 - t / 2 + 0.02, w + 2 * t, H, t),
    box(cx, floorY + H / 2, C.z1 + t / 2 - 0.02, w + 2 * t, H, t),
    box(C.x0 - t / 2 + 0.02, floorY + H / 2, cz, t, H, d),
    box(C.x1 + t / 2 - 0.02, floorY + H / 2, cz, t, H, d),
    box(cx, floorY - 0.06, cz, w + 0.3, 0.12, d + 0.3),
  ];
  group.add(mesh(joined(walls), conc));
  // a ladder down the south wall: how anyone gets there
  const lad: THREE.BufferGeometry[] = [];
  const lz = C.z1 - 0.1;
  for (const dx of [-0.2, 0.2]) lad.push(stick(v3(cx + dx, floorY, lz), v3(cx + dx, 0.75, lz), 0.018, 6));
  for (let y = floorY + 0.3; y < 0.4; y += 0.3) lad.push(stick(v3(cx - 0.2, y, lz), v3(cx + 0.2, y, lz), 0.012, 5));
  group.add(mesh(joined(lad), m.metal));

  // ---- the plate exchanger: two end frames, a pack of plates, four tie rods, four nozzles, on feet
  const steel = MAT.steel();
  const white = new THREE.MeshStandardMaterial({ color: 0xcfd2d0, roughness: 0.4, metalness: 0.6 });
  const px = cx - 0.2;
  const pz = cz - 0.5;
  const feetY = floorY;
  const stand = 0.28;
  const hy = 1.0;
  const hz = 0.48;
  const cy = feetY + stand + hy / 2;
  const frames: THREE.BufferGeometry[] = [
    box(px - 0.42, cy, pz, 0.08, hy + 0.08, hz + 0.1),
    box(px + 0.42, cy, pz, 0.08, hy + 0.08, hz + 0.1),
  ];
  // feet that carry the frames
  for (const dx of [-0.42, 0.42]) frames.push(box(px + dx, feetY + stand / 2, pz, 0.08, stand + 0.02, hz + 0.26));
  // rods
  for (const y of [cy + hy / 2 + 0.03, cy - hy / 2 - 0.03])
    for (const z of [pz - hz / 2 - 0.05, pz + hz / 2 + 0.05])
      frames.push(stick(v3(px - 0.5, y, z), v3(px + 0.5, y, z), 0.014, 8));
  group.add(mesh(joined(frames), steel));
  const plates: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 22; i++) plates.push(box(px - 0.36 + i * 0.0345, cy, pz, 0.018, hy, hz));
  group.add(mesh(joined(plates), white));
  // the nozzles on the frames: network side on the east frame, house side on the west one
  const nozz = (x: number, y: number, dir: number) => [v3(x, y, pz), v3(x + dir * 0.12, y, pz)];
  const netHot = nozz(px + 0.46, cy + 0.3, 1);
  const netCold = nozz(px + 0.46, cy - 0.3, 1);
  const houseHot = nozz(px - 0.46, cy + 0.3, -1);
  const houseCold = nozz(px - 0.46, cy - 0.3, -1);
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x7f868c, roughness: 0.45, metalness: 0.7 });
  const pipeGeos: THREE.BufferGeometry[] = [];
  for (const [a, b] of [netHot, netCold, houseHot, houseCold]) pipeGeos.push(stick(a, b, 0.038, 12));
  const wE = C.x1 + 0.01;
  // the network's pipes: from the wall (the trench's ends are behind it), along to the nozzles
  const bendTo = (from: THREE.Vector3, to: THREE.Vector3, viaX: number): THREE.BufferGeometry => {
    const pts = [from, v3(viaX, from.y, from.z), v3(viaX, to.y, from.z), v3(viaX, to.y, to.z), to];
    return tubeThrough(pts, 0.038);
  };
  pipeGeos.push(bendTo(v3(wE, ends.supply.y, ends.supply.z), netHot[1], px + 1.0));
  pipeGeos.push(bendTo(v3(wE, ends.ret.y, ends.ret.z), netCold[1], px + 1.3));
  // the house's pipes: out through the west wall
  pipeGeos.push(tubeThrough([houseHot[1], v3(C.x0 + 0.02, houseHot[1].y, pz)], 0.038));
  pipeGeos.push(tubeThrough([houseCold[1], v3(C.x0 + 0.02, houseCold[1].y, pz)], 0.038));
  group.add(mesh(joined(pipeGeos), pipeMat));
  // the wall sleeves
  const sleeves: THREE.BufferGeometry[] = [];
  for (const p of [v3(wE, ends.supply.y, ends.supply.z), v3(wE, ends.ret.y, ends.ret.z)])
    sleeves.push(stick(p.clone().add(v3(-0.03, 0, 0)), p.clone().add(v3(0.25, 0, 0)), 0.14, 14));
  group.add(mesh(joined(sleeves), m.door));
  const lit = emissive(0xffb46a, 0.6);
  lit.userData.noShare = true;
  group.add(mesh(new THREE.BoxGeometry(0.36, 0.05, 0.1).translate(cx, -0.42, C.z0 + 0.1), lit));
  return {
    group,
    feetY,
    floorY,
    pipeIn: [v3(wE, ends.supply.y, ends.supply.z), v3(wE, ends.ret.y, ends.ret.z)],
    pipeOut: [netHot[0], netCold[0]],
  };
}

function tubeThrough(pts: THREE.Vector3[], r: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    if (pts[i].distanceTo(pts[i + 1]) < 1e-3) continue;
    parts.push(stick(pts[i], pts[i + 1], r, 12));
    if (i > 0) parts.push(new THREE.SphereGeometry(r, 12, 8).translate(pts[i].x, pts[i].y, pts[i].z));
  }
  return joined(parts);
}
