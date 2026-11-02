import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Helpers of the four worlds: revolved geometry, tubes between points, the paper floor, the flow dots. Geometry and materials only (no canvas, no GL context), so
// everything here also runs in Node under vitest. The paper floor and the dots come from Mill Lab (docs/kit-requests.md asks for them in the kit).

export const TAU = Math.PI * 2;

export const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export const v3 = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);

/** A closed ring around Y between two radii and two heights: four faces, so the edges read crisp. `r1` differs from `r0` on a cone. */
export function ringY(rIn: number, rOut: number, y0: number, y1: number, segments = 64): THREE.BufferGeometry {
  const part = (pts: [number, number][]) =>
    new THREE.LatheGeometry(
      pts.map(([r, y]) => new THREE.Vector2(r, y)),
      segments,
    );
  // a lathe faces outward when its points rise: outer wall up, then the top inward, the bore down, the bottom outward
  const parts = [
    part([
      [rOut, y0],
      [rOut, y1],
    ]),
    part([
      [rOut, y1],
      [rIn, y1],
    ]),
    part([
      [rIn, y1],
      [rIn, y0],
    ]),
    part([
      [rIn, y0],
      [rOut, y0],
    ]),
  ];
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return merged;
}

/** A solid disc around Y (a cylinder with caps), its foot at y0. */
export function discY(r: number, y0: number, y1: number, segments = 64): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(r, r, y1 - y0, segments, 1);
  g.translate(0, (y0 + y1) / 2, 0);
  return g;
}

const UP = new THREE.Vector3(0, 1, 0);

/** A cylinder from a to b, radius r (a stick, a leg, a straight pipe). */
export function stick(a: THREE.Vector3, b: THREE.Vector3, r: number, segments = 10, caps = true): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(r, r, a.distanceTo(b), segments, 1, !caps);
  const m = new THREE.Matrix4().compose(
    a.clone().add(b).multiplyScalar(0.5),
    new THREE.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize()),
    new THREE.Vector3(1, 1, 1),
  );
  g.applyMatrix4(m);
  return g;
}

/** A box given by its centre and its size. */
export function box(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  g.translate(cx, cy, cz);
  return g;
}

/** Merge geometries into one (they must share their attributes: `plain` drops what differs). */
export function joined(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const clean = parts.map((p) => {
    const g = p.index ? p.toNonIndexed() : p;
    for (const name of Object.keys(g.attributes))
      if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
    if (!g.attributes.uv) {
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    return g;
  });
  const out = mergeGeometries(clean, false);
  parts.forEach((p) => p.dispose());
  return out;
}

/** Flag a whole subtree as never casting shadows (dots, overlays): the registry respects `userData.noShadow`. */
export function noShadow<T extends THREE.Object3D>(o: T): T {
  o.traverse((c) => {
    c.castShadow = false;
    c.userData.noShadow = true;
  });
  return o;
}

/** A tube through points (Catmull-Rom through them), for cables and wires. */
export function tubeGeometry(
  points: THREE.Vector3[],
  radius: number,
  segments = 24,
  radial = 6,
  closed = false,
): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
  return new THREE.TubeGeometry(curve, segments, radius, radial, closed);
}

/**
 * Drafting-table floor: a paper disc with a grid, as a DataTexture (no canvas, so it also builds in Node). `tile` is the side of one texture tile in
 * metres (eight cells of one fifth each), `radius` the radius of the disc. Its top is at `y`.
 */
export function paperFloor(radius = 12, tile = 8, y = 0, fade?: [number, number]): THREE.Mesh {
  const N = 512;
  const data = new Uint8Array(N * N * 4);
  const cell = N / 8;
  for (let py = 0; py < N; py++) {
    for (let px = 0; px < N; px++) {
      const k = (py * N + px) * 4;
      let a = 0;
      const mx = px % cell;
      const my = py % cell;
      if (mx < 2 || my < 2) a = 0.16;
      else if (mx % (cell / 5) < 1 || my % (cell / 5) < 1) a = 0.06;
      data[k] = Math.round(239 * (1 - a) + 40 * a);
      data[k + 1] = Math.round(230 * (1 - a) + 60 * a);
      data[k + 2] = Math.round(211 * (1 - a) + 90 * a);
      data[k + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set((2 * radius) / tile, (2 * radius) / tile);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, transparent: true, depthWrite: false });
  // the paper dissolves into the background well before the camera's far plane (60 m outside the site world): no edge, no horizon
  const f0 = fade?.[0] ?? radius * 0.45;
  const f1 = fade?.[1] ?? radius * 0.92;
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vFloorP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFloorP = position.xy;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vFloorP;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>\ndiffuseColor.a *= 1.0 - smoothstep( ${f0.toFixed(2)}, ${f1.toFixed(2)}, length( vFloorP ) );`,
      );
  };
  mat.customProgramCacheKey = () => `paper-${f0}-${f1}`;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(radius, 96), mat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = y;
  floor.receiveShadow = true;
  floor.renderOrder = -2;
  floor.name = 'floor';
  return floor;
}

// ------------------------------------------------------------------------------------------------ flow dots

/** Soft round sprite (white, alpha falling to the edge) for dots; a DataTexture, so no canvas is needed. */
export function softDotTexture(size = 32): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const d = Math.hypot((i + 0.5) / size - 0.5, (j + 0.5) / size - 0.5) * 2;
      const a = Math.max(0, 1 - d);
      const k = (j * size + i) * 4;
      data[k] = data[k + 1] = data[k + 2] = 255;
      data[k + 3] = Math.round(255 * Math.min(1, a * 1.8) * (a > 0 ? 1 : 0));
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

/** A polyline with its cumulative length, to place a dot at a distance along it. */
export class DotPath {
  readonly cum: number[] = [0];
  constructor(readonly points: THREE.Vector3[]) {
    for (let i = 1; i < points.length; i++) this.cum.push(this.cum[i - 1] + points[i].distanceTo(points[i - 1]));
  }
  get length(): number {
    return this.cum[this.cum.length - 1];
  }
  at(u: number, out: THREE.Vector3): THREE.Vector3 {
    const L = this.length;
    if (L <= 0) return out.copy(this.points[0]);
    let d = u % L;
    if (d < 0) d += L;
    let lo = 0;
    let hi = this.cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.cum[mid] <= d) lo = mid;
      else hi = mid;
    }
    const segLen = this.cum[hi] - this.cum[lo];
    const t = segLen > 0 ? (d - this.cum[lo]) / segLen : 0;
    return out.lerpVectors(this.points[lo], this.points[hi], t);
  }
}

export interface FlowDotsOptions {
  color: number;
  /** World size (metres) or, with `pixels`, screen size (pixels). */
  size: number;
  pixels?: boolean;
  opacity?: number;
  /** Draw through the walls (the "Flux" overlay). */
  throughWalls?: boolean;
}

/** Dots that travel along polylines: the speed of each path is set every frame (signed). Decoration whose speed comes from the simulation. */
export class FlowDots {
  readonly object: THREE.Points;
  private readonly paths: { path: DotPath; offset: number[]; first: number }[] = [];
  private readonly pos: Float32Array;
  private total = 0;
  private readonly tmp = new THREE.Vector3();
  private geometry: THREE.BufferGeometry;

  constructor(
    private readonly max: number,
    opts: FlowDotsOptions,
  ) {
    this.pos = new Float32Array(max * 3);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const mat = new THREE.PointsMaterial({
      color: opts.color,
      size: opts.size,
      sizeAttenuation: !opts.pixels,
      map: softDotTexture(),
      transparent: true,
      opacity: opts.opacity ?? 0.9,
      depthWrite: false,
      depthTest: !opts.throughWalls,
    });
    this.object = new THREE.Points(this.geometry, mat);
    this.object.frustumCulled = false;
    this.object.renderOrder = opts.throughWalls ? 20 : 4;
    this.object.userData.noShadow = true;
    this.object.castShadow = false;
    this.object.visible = false;
    this.geometry.setDrawRange(0, 0);
  }

  /** Add a path with `count` dots spread evenly along it; returns its index. */
  addPath(points: THREE.Vector3[], count: number): number {
    const path = new DotPath(points);
    const n = Math.max(1, Math.min(count, this.max - this.total));
    const offset: number[] = [];
    for (let i = 0; i < n; i++) offset.push((path.length * i) / n);
    this.paths.push({ path, offset, first: this.total });
    this.total += n;
    this.geometry.setDrawRange(0, this.total);
    this.place();
    return this.paths.length - 1;
  }

  advance(index: number, speed: number, dt: number): void {
    const p = this.paths[index];
    const L = p.path.length;
    if (L <= 0) return;
    for (let i = 0; i < p.offset.length; i++) {
      let u = (p.offset[i] + speed * dt) % L;
      if (u < 0) u += L;
      p.offset[i] = u;
    }
  }

  /** Write the positions after all `advance` calls of a frame. */
  place(): void {
    for (const p of this.paths) {
      for (let i = 0; i < p.offset.length; i++) {
        p.path.at(p.offset[i], this.tmp);
        const k = (p.first + i) * 3;
        this.pos[k] = this.tmp.x;
        this.pos[k + 1] = this.tmp.y;
        this.pos[k + 2] = this.tmp.z;
      }
    }
    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  get material(): THREE.PointsMaterial {
    return this.object.material as THREE.PointsMaterial;
  }

  get count(): number {
    return this.total;
  }
}
