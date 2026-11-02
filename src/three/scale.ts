import * as THREE from 'three';
import { MAT, mesh } from '@onigam/lab-kit/three';
import { box, discY, joined } from './common';
import { HEAT_MAX, heatColor } from './heat';
import { anchor } from './world';

// The scale of the false colour, one function for the three coloured worlds: a bar on a stand, on the same ramp as the stone. No text on it: the labels are the kit's (a film is captured with no
// interface). It stands on what is under it (`baseY`), a post from there up to the board, a foot on the ground.

export interface ScaleOptions {
  /** Where its foot stands, in the world, and the height of that ground. */
  x: number;
  z: number;
  baseY: number;
  /** Bottom and top of the bar, above the world's zero. */
  y0: number;
  y1: number;
  width: number;
  depth: number;
  footR: number;
  /** About Y: the way the board looks, from +Z. */
  yaw: number;
  /** The board leans back by this much about its foot, radians, towards a camera that looks from above. */
  lean?: number;
}

export interface HeatScale {
  group: THREE.Group;
  /** What leans: the labels are anchored on it. */
  board: THREE.Group;
  /** An empty marker on the right of the bar at a temperature, °C. */
  anchorAt(T: number): THREE.Object3D;
  /** Its lowest point in the world's frame, for the test that it stands. */
  footY: number;
  options: ScaleOptions;
}

export function buildHeatScale(o: ScaleOptions): HeatScale {
  const g = new THREE.Group();
  g.name = 'heat-scale';
  const board = new THREE.Group();
  board.name = 'heat-scale-board';
  board.position.y = o.y0;
  board.rotation.x = -(o.lean ?? 0);
  g.add(board);
  const h = o.y1 - o.y0;
  const steps = 60;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const c = new THREE.Color();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    heatColor(t * HEAT_MAX, c);
    const y = t * h;
    pos.push(-o.width / 2, y, 0, o.width / 2, y, 0);
    col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    if (i < steps) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const bar = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.7,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0,
    }),
  );
  bar.position.z = o.depth / 2 + 0.03;
  bar.castShadow = false;
  board.add(bar);
  const mat = MAT.printBlack();
  const frame: THREE.BufferGeometry[] = [box(0, h / 2, 0, o.width + 0.1, h + 0.1, o.depth)];
  // ticks each 100 °C
  for (let T = 0; T <= HEAT_MAX; T += 100) {
    const y = (T / HEAT_MAX) * h;
    frame.push(box(o.width / 2 + 0.09, y, 0, 0.16, Math.min(0.025, h * 0.01), o.depth));
  }
  board.add(mesh(joined(frame), mat));
  // the post from the ground up to the board, and the foot
  const feet: THREE.BufferGeometry[] = [
    box(0, (o.baseY + o.y0) / 2, 0, 0.12, o.y0 - o.baseY, 0.08),
    discY(o.footR, o.baseY, o.baseY + 0.04, 32),
  ];
  g.add(mesh(joined(feet), mat));
  g.position.set(o.x, 0, o.z);
  g.rotation.y = o.yaw;
  return {
    group: g,
    board,
    footY: o.baseY,
    options: o,
    anchorAt(T: number) {
      return anchor(board, o.width / 2 + 0.17, (T / HEAT_MAX) * h, 0, `scale-${T}`);
    },
  };
}
