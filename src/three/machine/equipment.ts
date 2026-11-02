import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MAT, emissive, mesh, roundedPath } from '@onigam/lab-kit/three';
import { TAU, box, joined, stick, v3 } from '../common';
import { AZIMUTH, LEVEL, PLANT, RISERS, WALL, wallPoint } from '../dims';

// The equipment room, one function: fifteen parts on the deck, in the order the current and the heat flow, all on the back half so that it reads from left to right from the door.
// `buildEquipment` draws it in the silo frame. The `plant-room` world registers each part; the `silo` world draws the same pieces as its `equipment-floor`.
// Sizes and places are estimates (research §3, `PLANT` in dims.ts); the floor itself is a reading of a film and a photograph, nothing on screen claims it.
//
// The model's order: the charge blower is on the RETURN side, before the resistors (a fan after them would see 500 °C), which the research's table had the other way round
// (research §0.4): the model is followed here, and `equipment.test.ts` holds it.

export const PLANT_PARTS = [
  'lv-switchboard',
  'heater-controller',
  'resistor-bank',
  'charge-blower',
  'discharge-blower',
  'blower-drive',
  'charge-damper',
  'discharge-damper',
  'hot-air-duct',
  'cold-air-duct',
  'air-water-exchanger',
  'dh-pump',
  'heat-meter',
  'expansion-vessel',
  'control-cabinet',
] as const;
export type PlantId = (typeof PLANT_PARTS)[number];

const Y = LEVEL.floor;
const P = (x: number, y: number, z: number) => v3(x, Y + y, z);

export interface PlantMaterials {
  jacket: THREE.MeshStandardMaterial;
  band: THREE.MeshStandardMaterial;
  paintGrey: THREE.MeshStandardMaterial;
  paintBlue: THREE.MeshStandardMaterial;
  paintGreen: THREE.MeshStandardMaterial;
  paintRed: THREE.MeshStandardMaterial;
  cabinet: THREE.MeshStandardMaterial;
  cabinetDark: THREE.MeshStandardMaterial;
  steel: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  rubber: THREE.MeshStandardMaterial;
  copper: THREE.MeshStandardMaterial;
  fins: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  cable: THREE.MeshStandardMaterial;
  tray: THREE.MeshStandardMaterial;
  white: THREE.MeshStandardMaterial;
  warning: THREE.MeshStandardMaterial;
  damperBlade: THREE.MeshStandardMaterial;
}

export function plantMaterials(): PlantMaterials {
  const std = (color: number, roughness: number, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  return {
    jacket: std(0x8f979c, 0.52, 0.42),
    band: std(0x5f666b, 0.55, 0.5),
    paintGrey: std(0x74787a, 0.55, 0.35),
    paintBlue: std(0x2f6a9e, 0.5, 0.25),
    paintGreen: std(0x3f7a5a, 0.5, 0.25),
    paintRed: std(0xb3362a, 0.5, 0.2),
    cabinet: std(0xa3a9aa, 0.62, 0.05),
    cabinetDark: std(0x3c3f42, 0.65, 0.15),
    steel: std(0x62676c, 0.5, 0.7),
    dark: std(0x212426, 0.75, 0.2),
    rubber: std(0x18191b, 0.9),
    copper: MAT.copperBright(),
    fins: std(0xb9bec2, 0.42, 0.85),
    brass: MAT.brass(),
    cable: std(0x17181a, 0.55),
    tray: std(0x5c6166, 0.55, 0.55),
    white: std(0xc6c8c4, 0.58, 0.05),
    warning: MAT.warningYellow(),
    damperBlade: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.55,
      metalness: 0.35,
    }),
  };
}

// ------------------------------------------------------------------------------------------------ small pieces

/** A round duct with its jacket: the tube through rounded corners, a band every metre on its straight runs. */
function duct(
  root: THREE.Object3D,
  mats: PlantMaterials,
  pts: THREE.Vector3[],
  r: number,
  bend = r * 1.2,
  bands = true,
): void {
  const path = roundedPath(pts, bend);
  const len = path.getLength();
  root.add(mesh(new THREE.TubeGeometry(path, Math.max(12, Math.round(len * 8)), r, 20, false), mats.jacket));
  if (!bands) return;
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const d = a.distanceTo(b);
    const dir = b.clone().sub(a).normalize();
    for (let t = bend + 0.3; t < d - bend - 0.2; t += 0.9) {
      const c = a.clone().addScaledVector(dir, t);
      parts.push(stick(c.clone().addScaledVector(dir, -0.012), c.clone().addScaledVector(dir, 0.012), r + 0.006, 20));
    }
  }
  if (parts.length) root.add(mesh(joined(parts), mats.band));
}

/** A flange: a short wide disc on a duct end. */
function flange(root: THREE.Object3D, mat: THREE.Material, p: THREE.Vector3, dir: THREE.Vector3, r: number): void {
  const d = dir.clone().normalize();
  root.add(mesh(stick(p.clone().addScaledVector(d, -0.016), p.clone().addScaledVector(d, 0.016), r, 24), mat));
}

/** A leg from the floor to a height, with its base plate. */
function legTo(root: THREE.Object3D, mats: PlantMaterials, x: number, z: number, yTop: number, r = 0.035): void {
  root.add(mesh(stick(P(x, 0, z), P(x, yTop, z), r, 8), mats.steel));
  root.add(mesh(box(x, Y + 0.006, z, 0.2, 0.012, 0.2), mats.steel));
}

/** The rail under the ceiling nearest to a z. */
export function nearestRail(z: number): number {
  let best = PLANT.railZ[0];
  for (const r of PLANT.railZ) if (Math.abs(r - z) < Math.abs(best - z)) best = r;
  return best;
}

/** A rod from under the ceiling down to a height, vertical; a short strut carries its top from the nearest rail. */
function hanger(root: THREE.Object3D, mats: PlantMaterials, x: number, z: number, yBottom: number): void {
  const rz = nearestRail(z);
  root.add(mesh(stick(P(x, yBottom, z), P(x, PLANT.railY, z), 0.012, 6), mats.steel));
  root.add(mesh(box(x, Y + PLANT.railY, (z + rz) / 2, 0.05, 0.03, Math.abs(z - rz) + 0.06), mats.steel));
}

/** A frustum along +X from a rectangle (y, z sizes) to another: a hood or a transition. */
function hoodX(
  x0: number,
  y0: number,
  z0: number,
  h0: number,
  d0: number,
  x1: number,
  y1: number,
  z1: number,
  h1: number,
  d1: number,
): THREE.BufferGeometry {
  const c = (x: number, y: number, z: number, h: number, d: number) => [
    [x, y - h / 2, z - d / 2],
    [x, y + h / 2, z - d / 2],
    [x, y + h / 2, z + d / 2],
    [x, y - h / 2, z + d / 2],
  ];
  return loft(c(x0, y0, z0, h0, d0), c(x1, y1, z1, h1, d1));
}

/** A frustum along +Z. */
function hoodZ(
  z0: number,
  x0: number,
  y0: number,
  w0: number,
  h0: number,
  z1: number,
  x1: number,
  y1: number,
  w1: number,
  h1: number,
): THREE.BufferGeometry {
  const c = (z: number, x: number, y: number, w: number, h: number) => [
    [x - w / 2, y - h / 2, z],
    [x + w / 2, y - h / 2, z],
    [x + w / 2, y + h / 2, z],
    [x - w / 2, y + h / 2, z],
  ];
  return loft(c(z0, x0, y0, w0, h0), c(z1, x1, y1, w1, h1));
}

function loft(a: number[][], b: number[][]): THREE.BufferGeometry {
  const pos: number[] = [];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    for (const q of [a[i], b[j], b[i], a[i], a[j], b[j]]) pos.push(q[0], q[1], q[2]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  return g;
}

/** A cabinet, its back at the origin, the door towards local +Z. */
function cabinet(
  mats: PlantMaterials,
  w: number,
  d: number,
  h: number,
  doors: number,
  body = mats.cabinet,
): { group: THREE.Group; lamps: THREE.Vector3[] } {
  const g = new THREE.Group();
  g.add(mesh(box(0, 0.05, d / 2, w, 0.1, d - 0.02), mats.dark));
  g.add(mesh(box(0, 0.1 + (h - 0.1) / 2, d / 2, w, h - 0.1, d), body));
  const seams: THREE.BufferGeometry[] = [];
  const handles: THREE.BufferGeometry[] = [];
  const dw = w / doors;
  for (let i = 0; i < doors; i++) {
    const x = -w / 2 + dw * (i + 0.5);
    // the door stands proud of the body, a dark seam around it
    seams.push(box(x, 0.1 + (h - 0.1) / 2, d + 0.004, dw - 0.006, h - 0.16, 0.008));
    handles.push(box(x + dw / 2 - 0.07, 0.1 + (h - 0.1) * 0.5, d + 0.03, 0.03, 0.2, 0.03));
    // a grille of slats at the foot
    for (let k = 0; k < 6; k++) handles.push(box(x, 0.28 + k * 0.035, d + 0.011, dw * 0.55, 0.012, 0.006));
  }
  g.add(mesh(joined(seams), body === mats.cabinet ? mats.white : mats.cabinetDark));
  g.add(mesh(joined(handles), mats.dark));
  g.add(mesh(box(0, h + 0.01, d / 2, w + 0.02, 0.02, d + 0.02), mats.paintGrey));
  return { group: g, lamps: [] };
}

/** A round pipe with its jacket, no bands (water, thin runs). */
function waterPipe(root: THREE.Object3D, mat: THREE.Material, pts: THREE.Vector3[], r: number): void {
  const path = roundedPath(pts, 0.14);
  root.add(mesh(new THREE.TubeGeometry(path, Math.max(16, Math.round(path.getLength() * 10)), r, 12, false), mat));
}

/** A cable through points, it ends in what it reaches. */
function cableRun(root: THREE.Object3D, mat: THREE.Material, pts: THREE.Vector3[], r = 0.02): void {
  const path = roundedPath(pts, 0.1);
  root.add(mesh(new THREE.TubeGeometry(path, Math.max(12, Math.round(path.getLength() * 7)), r, 8, false), mat));
}

/** A ladder tray under the ceiling, on rods: two rails and rungs along a straight run. */
function trayRun(root: THREE.Object3D, mats: PlantMaterials, a: THREE.Vector3, b: THREE.Vector3): void {
  const dir = b.clone().sub(a);
  const L = dir.length();
  dir.normalize();
  const side = v3(-dir.z, 0, dir.x).multiplyScalar(PLANT.trayW / 2);
  const parts: THREE.BufferGeometry[] = [];
  parts.push(stick(a.clone().add(side), b.clone().add(side), 0.016, 5));
  parts.push(stick(a.clone().sub(side), b.clone().sub(side), 0.016, 5));
  for (let t = 0.1; t < L; t += 0.3) {
    const c = a.clone().addScaledVector(dir, t);
    parts.push(stick(c.clone().add(side), c.clone().sub(side), 0.008, 5));
  }
  // vertical rods, a strut across to the nearest rail
  const top = Y + PLANT.railY;
  for (let t = 0.2; t < L; t += 1.6) {
    const c = a.clone().addScaledVector(dir, t);
    const rz = nearestRail(c.z);
    for (const p of [c.clone().add(side), c.clone().sub(side)]) {
      parts.push(stick(p, v3(p.x, top, p.z), 0.008, 5));
      parts.push(box(p.x, top, (p.z + rz) / 2, 0.03, 0.02, Math.abs(p.z - rz) + 0.04));
    }
  }
  root.add(mesh(joined(parts), mats.tray));
}

// ------------------------------------------------------------------------------------------------ a blower

export interface BlowerPieces {
  group: THREE.Group;
  /** Turns about the shaft (local X): the impeller seen through its port, the shaft, the coupling. `rotation.x = +angle` sends the top of the wheel towards the outlet. */
  rotor: THREE.Group;
  /** The motor's shaft end and the fan's, for the test that the coupling reaches both. */
  shaftFrom: THREE.Vector3;
  shaftTo: THREE.Vector3;
  /** In the group's frame: the outlet's flange centre and the inlet's. */
  outlet: THREE.Vector3;
  inlet: THREE.Vector3;
  terminal: THREE.Vector3;
}

/**
 * A centrifugal fan on its base, in a local frame whose X is the shaft (motor towards +X, inlet towards -X). `flip` turns the scroll half a turn about the shaft: its outlet leaves
 * at the bottom instead of the top (the base stays down). The wheel turns so that it throws the air towards the outlet.
 */
export function buildBlower(mats: PlantMaterials, flip: boolean): BlowerPieces {
  const B = PLANT.blower;
  const group = new THREE.Group();
  const scroll = new THREE.Group();
  scroll.position.y = B.axisY;
  if (flip) scroll.rotation.x = Math.PI;
  group.add(scroll);

  // the scroll: a spiral growing towards the outlet (in the plane of the wheel, shape X is the frame's Z, shape Y the frame's Y)
  const rMax = B.voluteR + B.voluteGrow;
  const outletH = 0.44;
  const shape = new THREE.Shape();
  const phi0 = Math.acos((rMax - outletH) / B.voluteR);
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const phi = phi0 + (i / n) * (TAU - phi0);
    const r = B.voluteR + B.voluteGrow * (phi / TAU);
    const sx = r * Math.sin(phi);
    const sy = r * Math.cos(phi);
    if (i === 0) shape.moveTo(sx, sy);
    else shape.lineTo(sx, sy);
  }
  shape.lineTo(B.neck, rMax);
  shape.lineTo(B.neck, rMax - outletH);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: B.width, bevelEnabled: false, curveSegments: 4 });
  geo.rotateY(-Math.PI / 2);
  geo.translate(B.width / 2, 0, 0);
  scroll.add(mesh(geo, mats.paintBlue));
  // the outlet's flange, the inlet cone on the -X side and a stiffening band
  scroll.add(mesh(box(0, rMax - outletH / 2, B.neck + 0.012, B.width + 0.14, outletH + 0.14, 0.024), mats.steel));
  // a lathe faces outward when its points rise; turned so that its Y becomes +X, its negative heights stand on -X
  const inlet = new THREE.LatheGeometry(
    [
      [B.inletR - 0.01, -B.width / 2 - B.inletL - 0.024],
      [B.inletR + 0.05, -B.width / 2 - B.inletL - 0.024],
      [B.inletR + 0.05, -B.width / 2 - B.inletL],
      [B.inletR, -B.width / 2 - B.inletL],
      [B.inletR + 0.02, -B.width / 2 - 0.05],
      [B.inletR + 0.06, -B.width / 2],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    28,
  );
  inlet.rotateZ(-Math.PI / 2);
  inlet.translate(0, B.axisY, 0);
  group.add(mesh(inlet, mats.paintBlue));

  // the port in the side plate: a dark disc and a ring, the wheel seen through it
  const portR = 0.3;
  const portX = B.width / 2;
  group.add(mesh(stick(v3(portX, B.axisY, 0), v3(portX + 0.004, B.axisY, 0), portR, 28), mats.dark));
  group.add(mesh(stick(v3(portX, B.axisY, 0), v3(portX + 0.018, B.axisY, 0), portR + 0.03, 28, true), mats.steel));
  // the bearing housing on the side plate
  group.add(mesh(stick(v3(portX + 0.018, B.axisY, 0), v3(portX + 0.1, B.axisY, 0), 0.09, 18), mats.steel));

  // the rotor: the shaft, from the inside of the scroll to the motor; the blades in the port; the two halves of the coupling, with marks that show it turning
  const rotor = new THREE.Group();
  rotor.name = 'rotor';
  rotor.position.set(0, B.axisY, 0);
  const couplingX = portX + 0.24;
  const motorX = couplingX + B.couplingW / 2 + 0.06;
  rotor.add(mesh(stick(v3(-B.width / 2 + 0.03, 0, 0), v3(motorX + 0.04, 0, 0), B.shaftR, 14), mats.steel));
  const blades: THREE.BufferGeometry[] = [];
  for (let i = 0; i < B.blades; i++) {
    const a = (i / B.blades) * TAU;
    // each blade is set at an angle, then turned around the shaft
    const blade = new THREE.BoxGeometry(0.012, 0.17, 0.05);
    blade.rotateX(0.42);
    blade.translate(0, 0.19, 0);
    blade.rotateX(a);
    blade.translate(portX + 0.01, 0, 0);
    blades.push(blade);
  }
  rotor.add(mesh(joined(blades), mats.fins));
  rotor.add(mesh(stick(v3(portX + 0.004, 0, 0), v3(portX + 0.017, 0, 0), 0.075, 14), mats.steel));
  rotor.add(
    mesh(
      stick(v3(couplingX - B.couplingW / 2, 0, 0), v3(couplingX + B.couplingW / 2, 0, 0), B.couplingR, 20),
      mats.paintGrey,
    ),
  );
  // the flexible element between the two halves: a dark band
  rotor.add(
    mesh(stick(v3(couplingX - 0.018, 0, 0), v3(couplingX + 0.018, 0, 0), B.couplingR + 0.008, 20), mats.rubber),
  );
  // bolt heads and a white mark, so the eye reads its turning
  const marks: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const y = Math.cos(a) * (B.couplingR - 0.022);
    const z = Math.sin(a) * (B.couplingR - 0.022);
    marks.push(stick(v3(couplingX - B.couplingW / 2 - 0.01, y, z), v3(couplingX - B.couplingW / 2, y, z), 0.011, 6));
    marks.push(stick(v3(couplingX + B.couplingW / 2, y, z), v3(couplingX + B.couplingW / 2 + 0.01, y, z), 0.011, 6));
  }
  rotor.add(mesh(joined(marks), mats.steel));
  // three yellow bars round the coupling, so that its turning reads from any side (the wheel in its port is behind the motor)
  const bars: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const bar = new THREE.BoxGeometry(B.couplingW * 0.86, 0.012, 0.07);
    bar.translate(couplingX, B.couplingR + 0.002, 0);
    bar.rotateX((i / 3) * TAU);
    bars.push(bar);
  }
  rotor.add(mesh(joined(bars), mats.warning));
  group.add(rotor);

  // the motor: a ribbed body, its end bells, the fan cowl, the feet, a terminal box
  const mx0 = motorX;
  const mx1 = motorX + B.motorL;
  group.add(mesh(stick(v3(mx0, B.axisY, 0), v3(mx1, B.axisY, 0), B.motorR, 28), mats.paintGreen));
  const fins: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU;
    const fin = new THREE.BoxGeometry(B.motorL * 0.86, 0.024, 0.012);
    fin.translate((mx0 + mx1) / 2, B.motorR + 0.008, 0);
    fin.rotateX(a);
    fin.translate(0, B.axisY, 0);
    fins.push(fin);
  }
  group.add(mesh(joined(fins), mats.paintGreen));
  group.add(mesh(stick(v3(mx0 - 0.03, B.axisY, 0), v3(mx0 + 0.015, B.axisY, 0), B.motorR + 0.015, 28), mats.paintGrey));
  group.add(mesh(stick(v3(mx1 - 0.015, B.axisY, 0), v3(mx1 + 0.14, B.axisY, 0), B.motorR * 0.94, 28), mats.steel));
  const terminal = v3(mx0 + B.motorL * 0.45, B.axisY + B.motorR + 0.09, 0);
  group.add(mesh(box(terminal.x, terminal.y - 0.03, 0, 0.2, 0.13, 0.2), mats.paintGreen));

  // the base: two rails on the floor, a pedestal under the scroll and one under the motor
  const baseX0 = -B.width / 2 - 0.1;
  const baseX1 = mx1 + 0.2;
  const rails: THREE.BufferGeometry[] = [];
  for (const z of [-0.42, 0.42]) rails.push(box((baseX0 + baseX1) / 2, B.baseH / 2, z, baseX1 - baseX0, B.baseH, 0.12));
  rails.push(box(baseX0 + 0.05, B.baseH / 2, 0, 0.1, B.baseH, 0.84));
  rails.push(box(baseX1 - 0.05, B.baseH / 2, 0, 0.1, B.baseH, 0.84));
  // two walls from the rails up into the scroll (they end inside it, whichever way it is turned)
  const scrollFoot = B.axisY - 0.6;
  rails.push(box(0, (B.baseH + scrollFoot) / 2, -0.36, B.width + 0.1, scrollFoot - B.baseH, 0.05));
  rails.push(box(0, (B.baseH + scrollFoot) / 2, 0.36, B.width + 0.1, scrollFoot - B.baseH, 0.05));
  rails.push(box(0, B.baseH + 0.02, 0, B.width + 0.1, 0.04, 0.76));
  // the motor's stool: reaches the feet
  const footY = B.axisY - B.motorR - 0.02;
  rails.push(box((mx0 + mx1) / 2, (B.baseH + footY) / 2, 0, B.motorL * 0.72, footY - B.baseH, 0.46));
  rails.push(box((mx0 + mx1) / 2, footY + 0.01, 0, B.motorL * 0.86, 0.04, 0.5));
  group.add(mesh(joined(rails), mats.steel));

  const outletY = flip ? B.axisY - (rMax - outletH / 2) : B.axisY + (rMax - outletH / 2);
  return {
    group,
    rotor,
    shaftFrom: v3(couplingX - B.couplingW / 2, B.axisY, 0),
    shaftTo: v3(motorX + 0.04, B.axisY, 0),
    outlet: v3(0, outletY, flip ? -B.neck : B.neck),
    inlet: v3(-B.width / 2 - B.inletL - 0.024, B.axisY, 0),
    terminal,
  };
}

// ------------------------------------------------------------------------------------------------ a damper

interface Damper {
  group: THREE.Group;
  /** Turns from closed (rotation 90°) to open (0): the blade and the pointer on the same shaft. */
  shaft: THREE.Group;
}

/** A damper box on a duct running along Z, centred at the origin; the actuator sits directly on its shaft. */
function buildDamper(mats: PlantMaterials): Damper {
  const { w, h, l } = PLANT.damper;
  const group = new THREE.Group();
  const shell: THREE.BufferGeometry[] = [
    box(0, h / 2 - 0.012, 0, w, 0.024, l),
    box(0, -h / 2 + 0.012, 0, w, 0.024, l),
    box(w / 2 - 0.012, 0, 0, 0.024, h, l),
    box(-w / 2 + 0.012, 0, 0, 0.024, h, l),
  ];
  // flanges on both faces
  for (const z of [-l / 2, l / 2]) {
    shell.push(box(0, h / 2 + 0.018, z, w + 0.1, 0.036, 0.02));
    shell.push(box(0, -h / 2 - 0.018, z, w + 0.1, 0.036, 0.02));
    shell.push(box(w / 2 + 0.018, 0, z, 0.036, h + 0.08, 0.02));
    shell.push(box(-w / 2 - 0.018, 0, z, 0.036, h + 0.08, 0.02));
  }
  group.add(mesh(joined(shell), mats.paintGrey));
  // the blade, its spindle and the pointer outside, one mesh in one material: the spindle turns them together
  const shaft = new THREE.Group();
  shaft.name = 'damper-shaft';
  const spin = (parts: THREE.BufferGeometry[], hex: number): THREE.BufferGeometry => {
    const g = joined(parts);
    const col = new THREE.Color(hex);
    const n = g.attributes.position.count;
    const c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) c.set([col.r, col.g, col.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return g;
  };
  const bladeGeo = spin(
    [box(0, 0, 0, w - 0.05, h - 0.05, 0.012), stick(v3(-w / 2 - 0.02, 0, 0), v3(w / 2 + 0.05, 0, 0), 0.012, 8)],
    0x62676c,
  );
  const pointerGeo = spin([box(w / 2 + 0.058, 0.07, 0, 0.012, 0.17, 0.028)], 0xf2c014);
  const spindle = new THREE.Mesh(mergeGeometries([bladeGeo, pointerGeo], false), mats.damperBlade);
  spindle.castShadow = true;
  spindle.receiveShadow = true;
  shaft.add(spindle);
  group.add(shaft);
  // the actuator: a small box on the side, and a quadrant that the pointer sweeps
  group.add(mesh(box(w / 2 + 0.034, 0, -0.03, 0.05, 0.13, 0.18), mats.dark));
  const q = new THREE.CylinderGeometry(0.17, 0.17, 0.004, 16, 1, false, 0, Math.PI / 2);
  q.rotateZ(Math.PI / 2);
  q.translate(w / 2 + 0.05, 0, 0);
  group.add(mesh(q, mats.white));
  return { group, shaft };
}

// ------------------------------------------------------------------------------------------------ the equipment

/** The machines whose pipes, trays and cables run across the room: these belong to the machine on screen (they hide with it), but are no part of its box or of its outline. */
export const SERVICE_PARTS = ['blower-drive', 'dh-pump', 'heat-meter', 'control-cabinet'] as const;
export type ServicePart = (typeof SERVICE_PARTS)[number];

export interface EquipmentPieces {
  roots: Record<PlantId, THREE.Group>;
  /**
   * The long runs of a machine: its pipes across the room, its trays, its cables. A heat meter is a meter on a pipe, not 5.5 m of pipe, and framing or outlining the run would lose the machine
   * (review D5). They stand still in the exploded view, and they show as long as their machine does.
   */
  services: Record<ServicePart, THREE.Group>;
  chargeBlower: BlowerPieces;
  dischargeBlower: BlowerPieces;
  /** Dampers by zone (core, middle, outer): two per zone and per loop. */
  chargeDampers: THREE.Group[][];
  dischargeDampers: THREE.Group[][];
  /** The pump's rotor, about local X. */
  pumpRotor: THREE.Group;
  pumpShaft: { from: THREE.Vector3; to: THREE.Vector3 };
  /** The false-colour glow of the elements, and the hatch that shows them. */
  elements: THREE.MeshStandardMaterial;
  /** Lamps: on while the heater runs; on while a blower runs; the screens. */
  lamps: {
    heater: THREE.MeshStandardMaterial;
    driveCharge: THREE.MeshStandardMaterial;
    driveDischarge: THREE.MeshStandardMaterial;
    control: THREE.MeshStandardMaterial;
  };
  /** The polylines of the flows. */
  paths: {
    current: THREE.Vector3[];
    /** The hot air of the charge, from the blower through the resistors to the header. */
    chargeHot: THREE.Vector3[];
    /** The return of the charge, from the header back to the blower. */
    chargeBack: THREE.Vector3[];
    /** From the hot header down the feeding duct of each zone, and up the returning duct to the return header. */
    chargeDown: THREE.Vector3[][];
    chargeUp: THREE.Vector3[][];
    /** The discharge: from the top of each zone's returning duct to the exchanger, through it and the blower to the cold header, down each zone. */
    dischargeUp: THREE.Vector3[][];
    dischargeHot: THREE.Vector3[];
    dischargeCold: THREE.Vector3[];
    dischargeDown: THREE.Vector3[][];
    waterIn: THREE.Vector3[];
    waterOut: THREE.Vector3[];
  };
  /** What must touch what (tests): pairs of points that lie on both pieces. */
  joints: { name: string; a: THREE.Vector3; b: THREE.Vector3 }[];
}

const POWER_CABLE = 0.028;

export function buildEquipment(mats: PlantMaterials): EquipmentPieces {
  const roots = {} as Record<PlantId, THREE.Group>;
  for (const id of PLANT_PARTS) {
    const g = new THREE.Group();
    g.name = id;
    roots[id] = g;
  }
  const services = {} as Record<ServicePart, THREE.Group>;
  for (const id of SERVICE_PARTS) {
    const g = new THREE.Group();
    g.name = `${id}-services`;
    services[id] = g;
  }
  const H = PLANT.header;
  const zoneDuctR = PLANT.riserR + PLANT.jacket;
  const joints: EquipmentPieces['joints'] = [];

  // ================================================================== the zones' ducts, the four headers, the twelve dampers
  const chargeDampers: THREE.Group[][] = [[], [], []];
  const dischargeDampers: THREE.Group[][] = [[], [], []];
  const hot = roots['hot-air-duct'];
  const cold = roots['cold-air-duct'];
  const chargeDown: THREE.Vector3[][] = [];
  const chargeUp: THREE.Vector3[][] = [];
  const dischargeUp: THREE.Vector3[][] = [];
  const dischargeDown: THREE.Vector3[][] = [];
  PLANT.zoneX.forEach((zx, zone) => {
    const xF = zx - PLANT.pairHalf;
    const xB = zx + PLANT.pairHalf;
    const hotFront = H.hot.z + PLANT.mainR - 0.02;
    const backFront = H.back.z + PLANT.mainR - 0.02;
    // the feeding duct: up through the deck to the hot header (a damper in the branch)
    duct(
      hot,
      mats,
      [P(xF, 0, 0), P(xF, PLANT.branch.feedHigh, 0), P(xF, PLANT.branch.feedHigh, hotFront)],
      zoneDuctR,
      0.2,
      false,
    );
    // its low branch: under the return header to the cold header
    duct(
      cold,
      mats,
      [
        P(xF, PLANT.branch.feedLow, -0.1),
        P(xF, PLANT.branch.feedLow, H.cold.z),
        P(xF, H.cold.y - PLANT.mainR + 0.02, H.cold.z),
      ],
      zoneDuctR,
      0.2,
      false,
    );
    // the returning duct: to the return header, then on up and over to the discharge's hot header
    duct(
      cold,
      mats,
      [P(xB, PLANT.branch.backLow, -0.1), P(xB, PLANT.branch.backLow, backFront)],
      zoneDuctR,
      0.2,
      false,
    );
    duct(
      hot,
      mats,
      [
        P(xB, 0, 0),
        P(xB, PLANT.branch.backHigh, 0),
        P(xB, PLANT.branch.backHigh, H.out.z),
        P(xB, H.out.y + PLANT.mainR - 0.02, H.out.z),
      ],
      zoneDuctR,
      0.2,
      false,
    );
    // collars on the deck
    for (const x of [xF, xB]) {
      flange(hot, mats.band, P(x, 0.03, 0), v3(0, 1, 0), zoneDuctR + 0.05);
    }
    const damperAt = (id: 'charge-damper' | 'discharge-damper', x: number, y: number, z: number) => {
      const d = buildDamper(mats);
      d.group.position.copy(P(x, y, z));
      roots[id].add(d.group);
      return d.shaft;
    };
    chargeDampers[zone].push(damperAt('charge-damper', xF, PLANT.branch.feedHigh, PLANT.damper.nearZ));
    chargeDampers[zone].push(damperAt('charge-damper', xB, PLANT.branch.backLow, PLANT.damper.nearZ));
    dischargeDampers[zone].push(damperAt('discharge-damper', xF, PLANT.branch.feedLow, PLANT.damper.farZ));
    dischargeDampers[zone].push(damperAt('discharge-damper', xB, PLANT.branch.backHigh, PLANT.damper.farZ));
    joints.push({
      name: `damper feed ${zone}`,
      a: P(xF, PLANT.branch.feedHigh, PLANT.damper.nearZ),
      b: P(xF, PLANT.branch.feedHigh, 0),
    });

    chargeDown.push([
      P(xF, H.hot.y, H.hot.z),
      P(xF, PLANT.branch.feedHigh, -0.2),
      P(xF, PLANT.branch.feedHigh, 0),
      P(xF, -0.2, 0),
    ]);
    chargeUp.push([P(xB, -0.2, 0), P(xB, PLANT.branch.backLow, 0), P(xB, H.back.y, H.back.z)]);
    dischargeUp.push([
      P(xB, -0.2, 0),
      P(xB, PLANT.branch.backHigh, 0),
      P(xB, PLANT.branch.backHigh, H.out.z),
      P(xB, H.out.y, H.out.z),
    ]);
    dischargeDown.push([
      P(xF, H.cold.y, H.cold.z),
      P(xF, PLANT.branch.feedLow, H.cold.z),
      P(xF, PLANT.branch.feedLow, 0),
      P(xF, -0.2, 0),
    ]);
  });

  // the charge's hot header: from the resistors' hood along to the feeding ducts
  const bk = PLANT.bank;
  const CB = PLANT.chargeBlower;
  const bankOut = P(bk.x, bk.y, bk.z1 + bk.hood);
  const hotPts = [bankOut, P(bk.x, bk.y, bk.z1 + bk.hood + 0.12), P(bk.x, H.hot.y, H.hot.z), P(H.x1, H.hot.y, H.hot.z)];
  duct(hot, mats, hotPts, PLANT.mainR, 0.3);
  // the discharge's hot header: along to the exchanger's hood
  const ex = PLANT.exchanger;
  const exIn = P(ex.x0 - ex.hood, ex.y, ex.z);
  duct(hot, mats, [P(H.x0, H.out.y, H.out.z), P(ex.x0 - ex.hood - 0.28, H.out.y, H.out.z), exIn], PLANT.mainR, 0.25);
  // the return of the charge: from the feeding side, along the left, to the blower's inlet (the model's order: the blower sits before the resistors)
  const chargeInlet = P(CB.x - PLANT.blower.width / 2 - PLANT.blower.inletL - 0.024, PLANT.blower.axisY, CB.z);
  const backX = CB.x - 1.15;
  const backPts = [
    P(H.x1, H.back.y, H.back.z),
    P(backX, H.back.y, H.back.z),
    P(backX, H.back.y, CB.z + 0.4),
    P(backX, PLANT.blower.axisY, CB.z),
    chargeInlet,
  ];
  duct(cold, mats, backPts, PLANT.mainR, 0.34);
  // the cold header of the discharge, under the exchanger to the blower
  const DB = PLANT.dischargeBlower;
  const coldEnd = P(
    DB.x,
    PLANT.blower.axisY - (PLANT.blower.voluteR + PLANT.blower.voluteGrow - 0.22),
    DB.z + PLANT.blower.neck,
  );
  const coldPts = [
    P(H.x0, H.cold.y, H.cold.z),
    P(2.4, H.cold.y, H.cold.z),
    P(3.05, coldEnd.y - Y, H.cold.z),
    P(DB.x, coldEnd.y - Y, H.cold.z),
    coldEnd,
  ];
  duct(cold, mats, coldPts, PLANT.mainR, 0.3);
  // end caps of the headers
  flange(hot, mats.band, P(H.x1, H.hot.y, H.hot.z), v3(1, 0, 0), PLANT.mainR + 0.02);
  flange(hot, mats.band, P(H.x0, H.out.y, H.out.z), v3(1, 0, 0), PLANT.mainR + 0.02);
  flange(cold, mats.band, P(H.x1, H.back.y, H.back.z), v3(1, 0, 0), PLANT.mainR + 0.02);
  flange(cold, mats.band, P(H.x0, H.cold.y, H.cold.z), v3(1, 0, 0), PLANT.mainR + 0.02);
  // supports: stands under the low headers, rods from the ceiling for the high ones
  for (const x of [-1.2, 1.2]) legTo(cold, mats, x, H.back.z, H.back.y - PLANT.mainR + 0.01);
  for (const x of [-1.2, 1.2]) legTo(cold, mats, x, H.cold.z, H.cold.y - PLANT.mainR + 0.01);
  legTo(cold, mats, backX, -2.8, H.back.y - PLANT.mainR + 0.01);
  legTo(cold, mats, 3.2, H.cold.z + 0.5, coldEnd.y - Y - PLANT.mainR + 0.01);
  for (const x of [-2.6, -0.55, 0.55]) hanger(hot, mats, x, H.hot.z, H.hot.y + PLANT.mainR - 0.01);
  for (const x of [-0.75, 0.75, 1.1]) hanger(hot, mats, x, H.out.z, H.out.y + PLANT.mainR - 0.01);

  // ================================================================== the charge blower, on the return side, before the resistors
  const chargeBlower = buildBlower(mats, false);
  chargeBlower.group.position.set(CB.x, Y, CB.z);
  roots['charge-blower'].add(chargeBlower.group);
  flange(roots['charge-blower'], mats.steel, chargeInlet, v3(1, 0, 0), PLANT.mainR + 0.06);
  // a soft collar between the duct and the inlet: the canvas that stops the vibration
  // it joins the outlet to the hood
  const outletWorld = chargeBlower.outlet.clone().add(v3(CB.x, Y, CB.z));

  // ================================================================== the resistor bank, the star: electricity becomes hot air, nearly all of it
  const bank = roots['resistor-bank'];
  const zm = (bk.z0 + bk.z1) / 2;
  const L = bk.z1 - bk.z0;
  const by = Y + bk.y;
  const body: THREE.BufferGeometry[] = [];
  const t = 0.05;
  // the top is open on the elements, under a hatch hinged on the wall side: the false colour shows from above
  const hatchZ0 = zm - 0.55;
  const hatchZ1 = bk.z1 - 0.2;
  const hatchW = bk.w - 0.2;
  const by0 = by + bk.h / 2 - t / 2;
  body.push(box(bk.x, by0, (bk.z0 + hatchZ0) / 2, bk.w, t, hatchZ0 - bk.z0));
  body.push(box(bk.x, by0, (hatchZ1 + bk.z1) / 2, bk.w, t, bk.z1 - hatchZ1));
  body.push(box(bk.x - bk.w / 2 + 0.05, by0, (hatchZ0 + hatchZ1) / 2, 0.1, t, hatchZ1 - hatchZ0));
  body.push(box(bk.x + bk.w / 2 - 0.05, by0, (hatchZ0 + hatchZ1) / 2, 0.1, t, hatchZ1 - hatchZ0));
  body.push(box(bk.x, by - bk.h / 2 + t / 2, zm, bk.w, t, L));
  body.push(box(bk.x - bk.w / 2 + t / 2, by, zm, t, bk.h, L));
  body.push(box(bk.x + bk.w / 2 - t / 2, by, zm, t, bk.h, L));
  // stiffeners
  for (const z of [bk.z0 + 0.04, bk.z1 - 0.04])
    for (const dy of [bk.h / 2 + 0.015, -bk.h / 2 - 0.015]) body.push(box(bk.x, by + dy, z, bk.w + 0.1, 0.03, 0.08));
  bank.add(mesh(joined(body), mats.paintGrey));
  // the lining: dark, so that the false colour reads
  bank.add(mesh(box(bk.x - bk.w / 2 + t + 0.01, by, zm, 0.02, bk.h - 2 * t, L), mats.dark));
  bank.add(mesh(box(bk.x + bk.w / 2 - t - 0.01, by, zm, 0.02, bk.h - 2 * t, L), mats.dark));
  bank.add(mesh(box(bk.x, by - bk.h / 2 + t + 0.01, zm, bk.w - 2 * t, 0.02, L), mats.dark));
  // the elements in stages: hairpins across the air, carried by plates on the far wall. Their glow is a false colour: real elements at this temperature barely show.
  const elements = new THREE.MeshStandardMaterial({
    color: 0x7a7f83,
    roughness: 0.45,
    metalness: 0.55,
    emissive: new THREE.Color(0xff5a1f),
    emissiveIntensity: 0,
  });
  elements.userData.noShare = true;
  const hair: THREE.BufferGeometry[] = [];
  const plates: THREE.BufferGeometry[] = [];
  const rackZ0 = bk.z0 + 0.25;
  const stageGap = (bk.z1 - 0.25 - rackZ0) / bk.stages;
  for (let s = 0; s < bk.stages; s++) {
    const z = rackZ0 + stageGap * (s + 0.5);
    const xa = bk.x - bk.w / 2 + t + 0.02;
    const xb = bk.x + bk.w / 2 - t - 0.06;
    plates.push(box(xa + 0.012, by, z, 0.024, bk.h - 2 * t - 0.04, stageGap * 0.72));
    for (let k = 0; k < bk.elementsPerStage; k++) {
      const y = by - bk.h / 2 + 0.16 + (k * (bk.h - 0.32)) / (bk.elementsPerStage - 1);
      const zOff = (k % 2 === 0 ? -1 : 1) * 0.08;
      for (const dz of [-0.035, 0.035])
        hair.push(stick(v3(xa, y, z + zOff + dz), v3(xb, y, z + zOff + dz), bk.elementR, 7, false));
      hair.push(stick(v3(xb, y, z + zOff - 0.035), v3(xb, y, z + zOff + 0.035), bk.elementR, 7, false));
    }
  }
  bank.add(mesh(joined(hair), elements));
  bank.add(mesh(joined(plates), mats.steel));
  // the hatch: hinged on the side towards the wall, propped open
  const hatch = new THREE.Group();
  const hinge = 2.45;
  hatch.position.set(bk.x - bk.w / 2 + 0.1, by + bk.h / 2, (hatchZ0 + hatchZ1) / 2);
  hatch.rotation.z = hinge;
  // closed it would lie along +X from the hinge
  hatch.add(mesh(box(hatchW / 2, 0.015, 0, hatchW, 0.03, hatchZ1 - hatchZ0 + 0.04), mats.paintGrey));
  bank.add(hatch);
  // the strut that holds it, from the casing's other rail to its free edge
  const hx = bk.x - bk.w / 2 + 0.1;
  const tipX = hx + hatchW * Math.cos(hinge) * 0.62;
  const tipY = by + bk.h / 2 + hatchW * Math.sin(hinge) * 0.62;
  for (const z of [hatchZ0 + 0.1, hatchZ1 - 0.1])
    bank.add(mesh(stick(v3(hx + 0.5, by + bk.h / 2, z), v3(tipX, tipY, z), 0.008, 5), mats.steel));
  // the hoods at both ends
  bank.add(
    mesh(
      hoodZ(bk.z1, bk.x, by, bk.w, bk.h, bk.z1 + bk.hood, bk.x, by, 2 * PLANT.mainR, 2 * PLANT.mainR),
      mats.paintGrey,
    ),
  );
  const B = PLANT.blower;
  const outletH = 0.44;
  // the back hood takes the blower's rectangular outlet
  bank.add(
    mesh(
      hoodZ(outletWorld.z, CB.x, outletWorld.y, B.width + 0.14, outletH + 0.14, bk.z0, bk.x, by, bk.w, bk.h),
      mats.paintGrey,
    ),
  );
  // the stand: four legs and two cross bars, from the floor up to the casing
  const legY = bk.y - bk.h / 2;
  for (const z of [bk.z0 + 0.15, bk.z1 - 0.15])
    for (const x of [bk.x - bk.w / 2 + 0.08, bk.x + bk.w / 2 - 0.08]) legTo(bank, mats, x, z, legY + 0.01, 0.04);
  bank.add(mesh(box(bk.x, Y + legY - 0.25, bk.z0 + 0.15, bk.w - 0.1, 0.05, 0.05), mats.steel));
  bank.add(mesh(box(bk.x, Y + legY - 0.25, bk.z1 - 0.15, bk.w - 0.1, 0.05, 0.05), mats.steel));
  bank.add(mesh(box(bk.x - bk.w / 2 + 0.08, Y + legY - 0.25, zm, 0.05, 0.05, L - 0.3), mats.steel));
  bank.add(mesh(box(bk.x + bk.w / 2 - 0.08, Y + legY - 0.25, zm, 0.05, 0.05, L - 0.3), mats.steel));
  // the terminal box on the top: the cables come to it
  const termBox = v3(bk.x, by + bk.h / 2 + 0.11, bk.z0 + 0.55);
  bank.add(mesh(box(termBox.x, termBox.y, termBox.z, 0.7, 0.22, 0.9), mats.paintGrey));
  bank.add(mesh(box(termBox.x, termBox.y + 0.115, termBox.z, 0.74, 0.012, 0.94), mats.steel));

  // ================================================================== the current: cable riser → switchboard → controller → resistors
  const sw = PLANT.switchboard;
  const swCab = cabinet(mats, sw.w, sw.d, sw.h, sw.bays);
  swCab.group.position.set(sw.x, Y, sw.z);
  swCab.group.rotation.y = sw.face;
  const swFront = (u: number, y: number, out = 0): THREE.Vector3 => v3(sw.x + sw.d + out, Y + y, sw.z + u);
  roots['lv-switchboard'].add(swCab.group);
  // the main breaker in the second bay: a black frame with its handle; meters without any text; a line of lamps
  const swBits: THREE.BufferGeometry[] = [];
  const swDark: THREE.BufferGeometry[] = [];
  const u0 = -sw.w / 2 + (sw.w / sw.bays) * 1.5;
  swDark.push(box(sw.x + sw.d + 0.03, Y + 1.25, sw.z + u0, 0.05, 0.5, 0.36));
  swDark.push(box(sw.x + sw.d + 0.08, Y + 1.32, sw.z + u0, 0.05, 0.08, 0.18));
  for (let i = 0; i < 3; i++)
    swBits.push(
      stick(swFront(u0 + 0.25 + i * 0.12, 1.78, 0.012), swFront(u0 + 0.25 + i * 0.12, 1.78, 0.02), 0.044, 16),
    );
  for (let bay = 0; bay < sw.bays; bay++) {
    const u = -sw.w / 2 + (sw.w / sw.bays) * (bay + 0.5);
    for (let k = 0; k < 2; k++) swDark.push(box(sw.x + sw.d + 0.014, Y + 1.0 - k * 0.2, sw.z + u, 0.016, 0.1, 0.34));
  }
  roots['lv-switchboard'].add(mesh(joined(swDark), mats.dark));
  roots['lv-switchboard'].add(mesh(joined(swBits), mats.steel));
  const lampOn = emissive(0x47d76a, 1.4);
  lampOn.userData.noShare = true;
  const heaterLamp = emissive(0xff8a3d, 0);
  heaterLamp.userData.noShare = true;
  for (let i = 0; i < 3; i++) {
    roots['lv-switchboard'].add(
      mesh(
        stick(swFront(u0 + 0.25 + i * 0.12, 1.55, 0.008), swFront(u0 + 0.25 + i * 0.12, 1.55, 0.018), 0.018, 12),
        i === 0 ? lampOn : heaterLamp,
      ),
    );
  }

  // from the wall (the top of the cable riser) along a tray to the board
  const cablePts = wallPoint(AZIMUTH.cable, WALL.roomIn + 0.03, Y + 2.75);
  const wallIn = v3(cablePts[0], cablePts[1], cablePts[2]);
  const swTop = v3(sw.x + sw.d / 2, Y + sw.h + 0.02, sw.z - sw.w / 2 + 0.35);
  roots['lv-switchboard'].add(mesh(box(wallIn.x, wallIn.y, wallIn.z, 0.1, 0.4, 0.5), mats.tray));
  for (const dz of [-0.08, 0, 0.08])
    cableRun(
      roots['lv-switchboard'],
      mats.cable,
      [
        v3(wallIn.x, wallIn.y, wallIn.z + dz),
        v3(swTop.x, wallIn.y + 0.04, swTop.z + dz),
        v3(swTop.x, swTop.y, swTop.z + dz),
      ],
      POWER_CABLE,
    );
  trayRun(
    roots['lv-switchboard'],
    mats,
    v3(wallIn.x, wallIn.y - 0.05, wallIn.z),
    v3(swTop.x, wallIn.y - 0.05, swTop.z),
  );

  // the heater controller
  const ct = PLANT.controller;
  const ctCab = cabinet(mats, ct.w, ct.d, ct.h, 2, mats.cabinet);
  ctCab.group.position.set(ct.x, Y, ct.z);
  ctCab.group.rotation.y = ct.face;
  roots['heater-controller'].add(ctCab.group);
  // the heat sinks on its top, fins that say power electronics; a lamp while it conducts
  const sinks: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 10; i++)
    sinks.push(
      box(ct.x + ct.d / 2, Y + ct.h + 0.11, ct.z - ct.w / 2 + 0.12 + (i * (ct.w - 0.24)) / 9, ct.d * 0.74, 0.18, 0.012),
    );
  roots['heater-controller'].add(mesh(joined(sinks), mats.fins));
  roots['heater-controller'].add(mesh(box(ct.x + ct.d + 0.01, Y + 1.55, ct.z + 0.24, 0.012, 0.22, 0.28), mats.dark));
  const heaterDisplay = emissive(0xff8a3d, 0);
  heaterDisplay.userData.noShare = true;
  roots['heater-controller'].add(
    mesh(box(ct.x + ct.d + 0.018, Y + 1.55, ct.z + 0.24, 0.006, 0.17, 0.23), heaterDisplay),
  );
  // board to controller, on a tray; controller to the resistors' terminal box
  const swOut = v3(sw.x + sw.d / 2, Y + sw.h + 0.02, sw.z - sw.w / 2 + 0.75);
  const ctIn = v3(ct.x + ct.d * 0.16, Y + ct.h + 0.02, ct.z + 0.12);
  const ctOut = v3(ct.x + ct.d * 0.86, Y + ct.h + 0.02, ct.z - ct.w / 2 + 0.2);
  const hi = Y + 2.75;
  for (const dz of [-0.06, 0.06]) {
    cableRun(
      roots['heater-controller'],
      mats.cable,
      [
        v3(swOut.x, swOut.y, swOut.z + dz),
        v3(swOut.x, hi, swOut.z + dz),
        v3(ctIn.x, hi, ctIn.z + dz),
        v3(ctIn.x, ctIn.y, ctIn.z + dz),
      ],
      POWER_CABLE,
    );
    cableRun(
      roots['heater-controller'],
      mats.cable,
      [
        v3(ctOut.x, ctOut.y, ctOut.z + dz),
        v3(ctOut.x + 0.1, hi + 0.05, ctOut.z + dz),
        v3(termBox.x - 0.2, hi + 0.05, ctOut.z + dz),
        v3(termBox.x - 0.2, hi + 0.05, termBox.z + dz),
        v3(termBox.x - 0.2, termBox.y + 0.11, termBox.z + dz),
      ],
      POWER_CABLE,
    );
  }
  trayRun(roots['heater-controller'], mats, v3(swOut.x, hi - 0.05, swOut.z), v3(ctIn.x, hi - 0.05, ctIn.z));
  trayRun(
    roots['heater-controller'],
    mats,
    v3(ctOut.x + 0.1, hi - 0.0, ctOut.z),
    v3(termBox.x - 0.2, hi - 0.0, ctOut.z),
  );

  // ================================================================== the variable-speed drive: one cabinet, two units, a cable to each motor
  const dv = PLANT.drive;
  const dvCab = cabinet(mats, dv.w, dv.d, dv.h, 2);
  dvCab.group.position.set(dv.x, Y, dv.z);
  roots['blower-drive'].add(dvCab.group);
  const dvFront = dv.z + dv.d;
  const driveLamps: THREE.MeshStandardMaterial[] = [];
  for (const dx of [-dv.w / 4, dv.w / 4]) {
    roots['blower-drive'].add(mesh(box(dv.x + dx, Y + 1.5, dvFront + 0.012, 0.3, 0.36, 0.014), mats.dark));
    const lit = emissive(0x4fd2ff, 0);
    lit.userData.noShare = true;
    driveLamps.push(lit);
    roots['blower-drive'].add(mesh(box(dv.x + dx, Y + 1.56, dvFront + 0.021, 0.24, 0.14, 0.004), lit));
  }
  const motorTop = chargeBlower.terminal.clone().add(v3(CB.x, Y, CB.z));
  cableRun(
    services['blower-drive'],
    mats.cable,
    [
      v3(dv.x - dv.w / 4, Y + dv.h + 0.02, dv.z + dv.d / 2),
      v3(dv.x - dv.w / 4, Y + 2.6, dv.z + dv.d / 2 + 0.1),
      v3(motorTop.x, Y + 2.6, motorTop.z),
      v3(motorTop.x, motorTop.y + 0.02, motorTop.z),
    ],
    0.022,
  );
  // the discharge blower is built below: its motor's cable is added then

  // ================================================================== the control cabinet: reads prices, decides the hours
  const cc = PLANT.control;
  const ccCab = cabinet(mats, cc.w, cc.d, cc.h, 1);
  ccCab.group.position.set(cc.x, Y, cc.z);
  roots['control-cabinet'].add(ccCab.group);
  const ccFront = cc.z + cc.d;
  roots['control-cabinet'].add(mesh(box(cc.x, Y + 1.45, ccFront + 0.012, 0.5, 0.38, 0.014), mats.dark));
  const screen = emissive(0x8fd0ff, 0.8);
  screen.userData.noShare = true;
  roots['control-cabinet'].add(mesh(box(cc.x, Y + 1.45, ccFront + 0.021, 0.44, 0.32, 0.004), screen));
  // a signal conduit from its top to a box over the dampers
  const jBox = P(cc.x, 3.14, -1.62);
  services['control-cabinet'].add(mesh(box(jBox.x, jBox.y, jBox.z, 0.3, 0.14, 0.2), mats.steel));
  cableRun(
    services['control-cabinet'],
    mats.steel,
    [v3(cc.x, Y + cc.h + 0.02, cc.z + cc.d / 2), v3(cc.x, Y + 3.14, cc.z + cc.d / 2), jBox.clone()],
    0.016,
  );
  // its supply: a thin cable to the drive's cabinet next to it
  cableRun(
    services['control-cabinet'],
    mats.cable,
    [
      v3(cc.x - cc.w / 2 + 0.1, Y + cc.h + 0.02, cc.z + 0.2),
      v3(cc.x - cc.w / 2 + 0.05, Y + cc.h + 0.15, cc.z + 0.2),
      v3(dv.x + dv.w / 2 - 0.1, Y + dv.h + 0.15, dv.z + 0.2),
      v3(dv.x + dv.w / 2 - 0.1, Y + dv.h + 0.02, dv.z + 0.2),
    ],
    0.012,
  );

  // ================================================================== the exchanger, the star of the other half: 1 MW from air to water
  const xc = roots['air-water-exchanger'];
  const xm = (ex.x0 + ex.x1) / 2;
  const xL = ex.x1 - ex.x0;
  const ey = Y + ex.y;
  const frame: THREE.BufferGeometry[] = [];
  const fr = 0.05;
  // the frame: its top and bottom plates, the back, four corner posts; the front is open on the fins
  frame.push(box(xm, ey + ex.h / 2 - fr / 2, ex.z, xL, fr, ex.depth));
  frame.push(box(xm, ey - ex.h / 2 + fr / 2, ex.z, xL, fr, ex.depth));
  frame.push(box(xm, ey, ex.z - ex.depth / 2 + fr / 2, xL, ex.h, fr));
  const zF = ex.z + ex.depth / 2;
  for (const x of [ex.x0 + fr / 2, ex.x1 - fr / 2]) frame.push(box(x, ey, zF - fr / 2, fr, ex.h, fr));
  xc.add(mesh(joined(frame), mats.paintGrey));
  // the fins, a stack of thin plates across the front
  const finGeo: THREE.BufferGeometry[] = [];
  const nFins = 44;
  for (let i = 0; i < nFins; i++) {
    const x = ex.x0 + 0.1 + (i * (xL - 0.2)) / (nFins - 1);
    finGeo.push(box(x, ey, zF - 0.28, 0.008, ex.h - 2 * fr, 0.5));
  }
  xc.add(mesh(joined(finGeo), mats.fins));
  // the copper: return bends on the front, two collectors, the two nozzles
  const bends: THREE.BufferGeometry[] = [];
  const rows = ex.bendsRows;
  const cols = ex.bendsCols;
  const dy = (ex.h - 0.4) / (rows - 1);
  const dx = (xL - 0.5) / cols;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const y = ey - ex.h / 2 + 0.2 + r * dy;
      const x = ex.x0 + 0.25 + c * dx + (r % 2 ? dx * 0.5 : 0);
      const tor = new THREE.TorusGeometry(dx * 0.32, 0.012, 6, 12, Math.PI);
      tor.rotateX(Math.PI / 2);
      tor.translate(x, y, zF - 0.04);
      bends.push(tor);
      bends.push(stick(v3(x - dx * 0.32, y, zF - 0.28), v3(x - dx * 0.32, y, zF - 0.04), 0.012, 6, false));
      bends.push(stick(v3(x + dx * 0.32, y, zF - 0.28), v3(x + dx * 0.32, y, zF - 0.04), 0.012, 6, false));
    }
  xc.add(mesh(joined(bends), mats.copper));
  const colLeft = ex.x0 + 0.1;
  const colRight = ex.x1 - 0.1;
  const coll: THREE.BufferGeometry[] = [
    stick(v3(colLeft, ey - ex.h / 2 + 0.12, zF + 0.05), v3(colLeft, ey + ex.h / 2 - 0.12, zF + 0.05), 0.05, 14),
    stick(v3(colRight, ey - ex.h / 2 + 0.12, zF + 0.05), v3(colRight, ey + ex.h / 2 - 0.12, zF + 0.05), 0.05, 14),
  ];
  for (let r = 0; r < rows; r++) {
    const y = ey - ex.h / 2 + 0.2 + r * dy;
    coll.push(stick(v3(colLeft, y, zF - 0.1), v3(colLeft, y, zF + 0.05), 0.014, 6, false));
    coll.push(stick(v3(colRight, y, zF - 0.1), v3(colRight, y, zF + 0.05), 0.014, 6, false));
  }
  xc.add(mesh(joined(coll), mats.copper));
  // hoods at both ends, on the ducts
  xc.add(
    mesh(
      hoodX(ex.x0 - ex.hood, ey, ex.z, 2 * PLANT.mainR, 2 * PLANT.mainR, ex.x0, ey, ex.z, ex.h, ex.depth),
      mats.paintGrey,
    ),
  );
  xc.add(
    mesh(
      hoodX(ex.x1, ey, ex.z, ex.h, ex.depth, ex.x1 + ex.hood, ey, ex.z, 2 * PLANT.mainR, 2 * PLANT.mainR),
      mats.paintGrey,
    ),
  );
  // the stand
  const exLeg = ex.y - ex.h / 2 + 0.01;
  for (const x of [ex.x0 + 0.1, ex.x1 - 0.1])
    for (const z of [ex.z - ex.depth / 2 + 0.08, ex.z + ex.depth / 2 - 0.08]) legTo(xc, mats, x, z, exLeg, 0.04);

  // ================================================================== the discharge blower: pulls the air through the exchanger, sends it back to the stone
  const dischargeBlower = buildBlower(mats, true);
  dischargeBlower.group.position.set(DB.x, Y, DB.z);
  dischargeBlower.group.rotation.y = Math.PI;
  roots['discharge-blower'].add(dischargeBlower.group);
  const dischargeInlet = P(DB.x + PLANT.blower.width / 2 + PLANT.blower.inletL + 0.024, PLANT.blower.axisY, DB.z);
  flange(roots['discharge-blower'], mats.steel, dischargeInlet, v3(1, 0, 0), PLANT.mainR + 0.06);
  const exOut = P(ex.x1 + ex.hood, ex.y, ex.z);
  duct(
    cold,
    mats,
    [
      exOut,
      P(dischargeInlet.x + 0.55, ex.y, ex.z),
      P(dischargeInlet.x + 0.55, PLANT.blower.axisY, DB.z + 0.4),
      P(dischargeInlet.x + 0.55, PLANT.blower.axisY, DB.z),
      dischargeInlet,
    ],
    PLANT.mainR,
    0.3,
  );
  // the outlet's flange on the duct under the exchanger
  flange(cold, mats.band, coldEnd, v3(0, 0, 1), PLANT.mainR + 0.04);
  legTo(cold, mats, dischargeInlet.x + 0.55, DB.z + 1.0, PLANT.blower.axisY - PLANT.mainR + 0.25);
  // the discharge motor's cable, from the drive along a tray; the feed of the drive from the switchboard
  const dMotorTop = v3(DB.x - chargeBlower.terminal.x, Y + chargeBlower.terminal.y, DB.z);
  const trayY = Y + PLANT.trayY;
  const trayA = v3(dv.x + dv.w / 4, trayY, dv.z + dv.d / 2 + 0.2);
  const trayB = v3(dMotorTop.x, trayY, dMotorTop.z - 0.1);
  cableRun(
    services['blower-drive'],
    mats.cable,
    [
      v3(dv.x + dv.w / 4, Y + dv.h + 0.02, dv.z + dv.d / 2),
      v3(trayA.x, trayY + 0.03, trayA.z),
      v3(trayB.x, trayY + 0.03, trayB.z),
      v3(dMotorTop.x, dMotorTop.y + 0.02, dMotorTop.z),
    ],
    0.022,
  );
  trayRun(services['blower-drive'], mats, trayA, trayB);
  // feed of the drive: from the board's far end along the back, on a tray
  const feedA = v3(swOut.x + 0.1, trayY, swOut.z - 0.2);
  const feedB = v3(dv.x - dv.w / 4, trayY, dv.z + dv.d / 2 + 0.35);
  trayRun(services['blower-drive'], mats, feedA, feedB);
  cableRun(
    services['blower-drive'],
    mats.cable,
    [
      v3(swOut.x, Y + sw.h + 0.02, swOut.z - 0.2),
      v3(feedA.x, trayY + 0.03, feedA.z),
      v3(feedB.x, trayY + 0.03, feedB.z),
      v3(dv.x, Y + dv.h + 0.02, dv.z + dv.d / 2),
    ],
    0.024,
  );

  // ================================================================== the water: from the wall, through the pump, the exchanger, the meter, back to the wall
  const W = PLANT.water;
  const PU = PLANT.pump;
  const rWater = RISERS.pipeR + 0.04;
  const wallRet = wallPoint(AZIMUTH.water - AZIMUTH.waterSpread, WALL.roomIn + 0.02, RISERS.topY);
  const wallSup = wallPoint(AZIMUTH.water + AZIMUTH.waterSpread, WALL.roomIn + 0.02, RISERS.topY);
  const waterMat = mats.jacket;
  const pumpSuction = P(PU.x + PU.width + 0.12, PU.axisY, PU.z);
  const pumpOut = P(PU.x, PU.axisY + PU.voluteR + 0.12, PU.z);
  const retDown = P(wallRet[0] - 0.25, PU.axisY, wallRet[2] + 0.45);
  const retInner = [
    v3(wallRet[0], wallRet[1], wallRet[2]),
    P(wallRet[0] - 0.25, RISERS.topY - Y, wallRet[2] + 0.45),
    retDown,
    P(pumpSuction.x + 0.2, PU.axisY, PU.z),
    pumpSuction,
  ];
  waterPipe(services['dh-pump'], waterMat, retInner, rWater);
  const toExchanger = [
    pumpOut,
    P(PU.x, W.highY, PU.z),
    P(W.returnX, W.highY, PU.z + 0.3),
    P(W.returnX, W.highY, zF + 0.2),
    P(W.returnX, ex.y - 0.2, zF + 0.2),
    v3(colLeft, Y + ex.y - 0.2, zF + 0.05),
  ];
  waterPipe(services['dh-pump'], waterMat, toExchanger, rWater);
  const supply = [
    v3(colRight, Y + ex.y + 0.45, zF + 0.05),
    P(W.supplyX + 0.28, ex.y + 0.45, zF + 0.2),
    P(W.supplyX + 0.28, W.highY, zF + 0.2),
    P(W.supplyX, W.highY, ex.z - 0.2),
    P(W.supplyX, W.highY, wallSup[2] + 0.65),
    v3(wallSup[0], wallSup[1], wallSup[2]),
  ];
  waterPipe(services['heat-meter'], waterMat, supply, rWater);
  // supports: rods from the ceiling on the high runs, a stand for the pump's riser
  for (const z of [-4.8, -3.2, -1.7]) hanger(services['dh-pump'], mats, W.returnX, z, W.highY + rWater - 0.01);
  for (const z of [-4.2, -2.8, -1.4])
    hanger(services['heat-meter'], mats, W.supplyX + (z > -1.6 ? 0.2 : 0), z, W.highY + rWater - 0.01);

  // the pump: a base, the scroll, the bearing, a coupling, a motor; the discharge goes up, the suction comes from the side
  const pump = roots['dh-pump'];
  const pumpBase = new THREE.Group();
  pumpBase.position.set(PU.x, Y, PU.z);
  pump.add(pumpBase);
  const motorStart = -PU.width - 0.26;
  pumpBase.add(mesh(box(-0.3, PU.baseH / 2, 0, 1.2, PU.baseH, 0.42), mats.steel));
  pumpBase.add(
    mesh(
      box(0, (PU.baseH + PU.axisY - PU.voluteR + 0.02) / 2, 0, 0.28, PU.axisY - PU.voluteR + 0.02 - PU.baseH, 0.28),
      mats.steel,
    ),
  );
  // the scroll across the shaft, the suction on its end, the discharge up
  pumpBase.add(mesh(stick(v3(-PU.width, PU.axisY, 0), v3(PU.width, PU.axisY, 0), PU.voluteR, 28), mats.paintBlue));
  pumpBase.add(
    mesh(
      stick(v3(0, PU.axisY + PU.voluteR - 0.02, 0), v3(0, PU.axisY + PU.voluteR + 0.12, 0), PU.nozzleR, 16),
      mats.paintBlue,
    ),
  );
  pumpBase.add(
    mesh(stick(v3(PU.width - 0.02, PU.axisY, 0), v3(PU.width + 0.12, PU.axisY, 0), PU.nozzleR, 16), mats.paintBlue),
  );
  const pumpRotor = new THREE.Group();
  pumpRotor.name = 'pump-rotor';
  pumpRotor.position.set(0, PU.axisY, 0);
  // shaft along X, out of the scroll on the motor's side, through the coupling
  const shaftEnd = motorStart - 0.02;
  pumpRotor.add(mesh(stick(v3(-PU.width, 0, 0), v3(shaftEnd, 0, 0), 0.022, 12), mats.steel));
  pumpRotor.add(mesh(stick(v3(motorStart + 0.1, 0, 0), v3(motorStart + 0.03, 0, 0), PU.couplingR, 16), mats.paintGrey));
  pumpRotor.add(mesh(box(motorStart + 0.065, PU.couplingR + 0.001, 0, 0.06, 0.006, 0.03), mats.warning));
  pumpBase.add(pumpRotor);
  // the motor, on a stool
  pumpBase.add(
    mesh(stick(v3(motorStart, PU.axisY, 0), v3(motorStart - PU.motorL, PU.axisY, 0), PU.motorR, 24), mats.paintGreen),
  );
  pumpBase.add(
    mesh(
      stick(
        v3(motorStart - PU.motorL, PU.axisY, 0),
        v3(motorStart - PU.motorL - 0.08, PU.axisY, 0),
        PU.motorR * 0.9,
        24,
      ),
      mats.steel,
    ),
  );
  pumpBase.add(
    mesh(
      box(
        motorStart - PU.motorL / 2,
        (PU.baseH + PU.axisY - PU.motorR + 0.01) / 2,
        0,
        PU.motorL * 0.7,
        PU.axisY - PU.motorR + 0.01 - PU.baseH,
        0.24,
      ),
      mats.steel,
    ),
  );
  pumpBase.add(
    mesh(box(motorStart - PU.motorL / 2, PU.axisY + PU.motorR + 0.04, 0, 0.14, 0.09, 0.14), mats.paintGreen),
  );
  // its supply: a cable to the drive's cabinet, along the floor and up
  const pumpTerm = P(PU.x + motorStart - PU.motorL / 2, PU.axisY + PU.motorR + 0.085, PU.z);
  cableRun(
    services['dh-pump'],
    mats.cable,
    [
      pumpTerm,
      P(pumpTerm.x + 0.05, PU.axisY + PU.motorR + 0.5, PU.z - 0.1),
      P(dv.x + dv.w / 2 + 0.12, 2.2, dv.z + dv.d / 2),
      P(dv.x + dv.w / 2 - 0.05, 1.85, dv.z + dv.d / 2),
    ],
    0.014,
  );

  // the meter on the supply: a flow section with its flanges, a calculator box on a bracket, the sensors and their wire
  const M = PLANT.meter;
  const mz = M.z;
  const meter = roots['heat-meter'];
  const my = Y + W.highY;
  const mx = W.supplyX;
  meter.add(mesh(stick(v3(mx, my, mz - M.bodyL / 2), v3(mx, my, mz + M.bodyL / 2), rWater + 0.02, 18), mats.paintBlue));
  meter.add(
    mesh(
      stick(v3(mx, my, mz - M.bodyL / 2 - 0.02), v3(mx, my, mz - M.bodyL / 2 + 0.02), rWater + 0.06, 18),
      mats.steel,
    ),
  );
  meter.add(
    mesh(
      stick(v3(mx, my, mz + M.bodyL / 2 - 0.02), v3(mx, my, mz + M.bodyL / 2 + 0.02), rWater + 0.06, 18),
      mats.steel,
    ),
  );
  const boxBelow = v3(mx, my - rWater - 0.3, mz);
  meter.add(mesh(stick(v3(mx, my - rWater - 0.02, mz), boxBelow.clone(), 0.016, 8), mats.steel));
  meter.add(mesh(box(boxBelow.x, boxBelow.y - 0.07, boxBelow.z, M.boxW, 0.18, 0.1), mats.white));
  const meterScreen = emissive(0x9fd8ff, 0.5);
  meterScreen.userData.noShare = true;
  meter.add(mesh(box(boxBelow.x, boxBelow.y - 0.05, boxBelow.z + 0.054, M.boxW * 0.7, 0.08, 0.006), meterScreen));
  // the sensor on the return, a thin wire over to it
  services['heat-meter'].add(
    mesh(stick(v3(W.returnX, my - rWater - 0.04, mz), v3(W.returnX, my - rWater + 0.04, mz), 0.024, 8), mats.steel),
  );
  cableRun(
    services['heat-meter'],
    mats.cable,
    [
      v3(boxBelow.x - M.boxW / 2, boxBelow.y - 0.07, boxBelow.z),
      v3(boxBelow.x - 0.3, boxBelow.y - 0.1, boxBelow.z),
      v3(W.returnX + 0.3, my - rWater - 0.12, mz),
      v3(W.returnX, my - rWater - 0.04, mz),
    ],
    0.006,
  );

  // the expansion vessel: a red tank on feet, a thin pipe to the return
  const V = PLANT.vessel;
  const vessel = roots['expansion-vessel'];
  vessel.add(mesh(stick(P(V.x, 0.16, V.z), P(V.x, V.h - V.r * 0.4, V.z), V.r, 28), mats.paintRed));
  const dome = new THREE.SphereGeometry(V.r, 24, 10, 0, TAU, 0, Math.PI / 2);
  dome.scale(1, 0.5, 1);
  dome.translate(V.x, Y + V.h - V.r * 0.4, V.z);
  vessel.add(mesh(dome, mats.paintRed));
  const domeB = new THREE.SphereGeometry(V.r, 24, 10, 0, TAU, Math.PI / 2, Math.PI / 2);
  domeB.scale(1, 0.4, 1);
  domeB.translate(V.x, Y + 0.16, V.z);
  vessel.add(mesh(domeB, mats.paintRed));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.5;
    const fx = V.x + Math.cos(a) * V.r * 0.8;
    const fz = V.z + Math.sin(a) * V.r * 0.8;
    vessel.add(mesh(stick(P(fx, 0, fz), P(fx, 0.2, fz), 0.024, 8), mats.steel));
    vessel.add(mesh(box(fx, Y + 0.006, fz, 0.1, 0.012, 0.1), mats.steel));
  }
  // the tie to the return, just before the pump: along the floor in front of it, a gauge on the way
  const tieA = P(V.x + V.r - 0.02, 0.32, V.z);
  const tieB = P(PU.x + PU.width + 0.32, PU.axisY, PU.z);
  waterPipe(vessel, mats.steel, [tieA, P(PU.x + PU.width + 0.32, 0.32, V.z), tieB], 0.026);
  const gaugeX = V.x + V.r + 0.25;
  vessel.add(mesh(stick(P(gaugeX, 0.32, V.z), P(gaugeX, 0.52, V.z), 0.012, 8), mats.brass));
  vessel.add(mesh(stick(P(gaugeX, 0.58, V.z - 0.022), P(gaugeX, 0.58, V.z + 0.022), 0.05, 16), mats.white));

  // ================================================================== the flows
  const blowerToBank = outletWorld.clone();
  const paths: EquipmentPieces['paths'] = {
    current: [
      wallIn.clone(),
      v3(swTop.x, wallIn.y + 0.04, swTop.z),
      swTop.clone(),
      swOut.clone(),
      v3(swOut.x, hi, swOut.z),
      v3(ctIn.x, hi, ctIn.z),
      ctIn.clone(),
      ctOut.clone(),
      v3(ctOut.x + 0.1, hi + 0.05, ctOut.z),
      v3(termBox.x - 0.2, hi + 0.05, ctOut.z),
      v3(termBox.x - 0.2, hi + 0.05, termBox.z),
      v3(termBox.x - 0.2, termBox.y + 0.11, termBox.z),
    ],
    chargeHot: [
      v3(CB.x, Y + PLANT.blower.axisY, CB.z),
      blowerToBank,
      P(bk.x, bk.y, bk.z0),
      P(bk.x, bk.y, bk.z1),
      bankOut,
      P(bk.x, H.hot.y, H.hot.z),
      P(H.x1, H.hot.y, H.hot.z),
    ],
    chargeBack: [...backPts.map((p) => p.clone()), v3(CB.x, Y + PLANT.blower.axisY, CB.z)],
    chargeDown,
    chargeUp,
    dischargeUp,
    dischargeHot: [
      P(H.x0, H.out.y, H.out.z),
      P(ex.x0 - ex.hood - 0.28, H.out.y, H.out.z),
      exIn.clone(),
      P(ex.x1, ex.y, ex.z),
      exOut.clone(),
      P(dischargeInlet.x + 0.55, ex.y, ex.z),
      P(dischargeInlet.x + 0.55, PLANT.blower.axisY, DB.z),
      dischargeInlet.clone(),
      v3(DB.x, Y + PLANT.blower.axisY, DB.z),
    ],
    dischargeCold: [
      v3(DB.x, Y + PLANT.blower.axisY, DB.z),
      coldEnd.clone(),
      ...coldPts
        .slice(0, -1)
        .reverse()
        .map((p) => p.clone()),
    ],
    dischargeDown,
    waterIn: retInner.concat(toExchanger).map((p) => p.clone()),
    waterOut: supply.map((p) => p.clone()),
  };

  joints.push(
    { name: 'blower outlet on the resistors hood', a: outletWorld.clone(), b: P(bk.x, bk.y, bk.z0) },
    { name: 'return duct on the charge blower inlet', a: chargeInlet.clone(), b: backPts[backPts.length - 1].clone() },
  );
  return {
    roots,
    services,
    chargeBlower,
    dischargeBlower,
    chargeDampers,
    dischargeDampers,
    pumpRotor,
    pumpShaft: { from: v3(PU.x - PU.width, Y + PU.axisY, PU.z), to: v3(PU.x + motorStart - 0.02, Y + PU.axisY, PU.z) },
    elements,
    lamps: { heater: heaterDisplay, driveCharge: driveLamps[0], driveDischarge: driveLamps[1], control: screen },
    paths,
    joints,
  };
}

// ------------------------------------------------------------------------------------------------ the state of the machines

/** What moves on the equipment, from the simulation's state. Everything is in the model, nothing is decoration. */
export interface EquipmentState {
  chargeBlowerAngle: number;
  dischargeBlowerAngle: number;
  pumpAngle: number;
  chargeBlower: number;
  dischargeBlower: number;
  heaterGlow: number;
  heater: number;
  zones: readonly { chargeDamper: number; dischargeDamper: number }[];
}

/** The state on the pieces: the wheels turn the way the air leaves, each damper's blade and pointer follow its zone, the elements glow in false colour. */
export function driveEquipment(
  p: EquipmentPieces,
  s: EquipmentState,
  dt: number,
  damperDrawn: { charge: number[]; discharge: number[] },
): void {
  p.chargeBlower.rotor.rotation.x = s.chargeBlowerAngle;
  p.dischargeBlower.rotor.rotation.x = s.dischargeBlowerAngle;
  p.pumpRotor.rotation.x = s.pumpAngle;
  // a damper takes a couple of seconds to travel (the actuators' speed, an estimate); the state gives where it goes
  const k = 1 - Math.exp(-dt * 2);
  s.zones.forEach((z, i) => {
    damperDrawn.charge[i] += (z.chargeDamper - damperDrawn.charge[i]) * k;
    damperDrawn.discharge[i] += (z.dischargeDamper - damperDrawn.discharge[i]) * k;
    for (const g of p.chargeDampers[i]) g.rotation.x = (1 - damperDrawn.charge[i]) * (Math.PI / 2);
    for (const g of p.dischargeDampers[i]) g.rotation.x = (1 - damperDrawn.discharge[i]) * (Math.PI / 2);
  });
  p.elements.emissiveIntensity = s.heaterGlow * 3.2;
  p.lamps.heater.emissiveIntensity = s.heater > 1 ? 1.6 : 0;
  p.lamps.driveCharge.emissiveIntensity = s.chargeBlower > 0.01 ? 1.2 : 0;
  p.lamps.driveDischarge.emissiveIntensity = s.dischargeBlower > 0.01 ? 1.2 : 0;
}
