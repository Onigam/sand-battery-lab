import * as THREE from 'three';
import { emissive, mesh } from '@onigam/lab-kit/three';
import { TAU, box, discY, joined, stick, v3 } from '../common';
import { DEG, LEVEL, PLANT, WALL } from '../dims';
import type { PlantMaterials } from './equipment';

// What makes the equipment floor a room and not a stage (scenery, nothing here is a part): lamps under the ceiling, a walkway painted on the deck, a guard rail around the ducts where
// they come through the deck, and, in the free quarter by the door, a workbench, a tool trolley, shelves with spare filters, a fire extinguisher. Nothing has any text on it.

const Y = LEVEL.floor;

export interface RoomDressing {
  group: THREE.Group;
  lamp: THREE.MeshStandardMaterial;
  /** Things that stand on the deck, with their feet at Y (tests). */
  standing: THREE.Object3D[];
}

export function buildRoomDressing(mats: PlantMaterials): RoomDressing {
  const group = new THREE.Group();
  group.name = 'room-dressing';
  const standing: THREE.Object3D[] = [];

  // ---- the rails under the ceiling, wall to wall, that carry the rods: seen from above they read as the room's frame, the rods of the ducts end on them
  const rails: THREE.BufferGeometry[] = [];
  for (const z of PLANT.railZ) {
    const half = Math.sqrt(Math.max(0, WALL.roomIn * WALL.roomIn - z * z));
    rails.push(box(0, Y + PLANT.railY, z, 2 * half, 0.05, PLANT.railW));
  }
  group.add(mesh(joined(rails), mats.tray));

  // ---- lamps: battens hung from the rails
  const lamp = emissive(0xfff0d0, 1.1);
  lamp.userData.noShare = true;
  const battens: THREE.BufferGeometry[] = [];
  const hoods: THREE.BufferGeometry[] = [];
  const lampAt: [number, number][] = [
    [-1.2, -3.4],
    [1.4, -4.6],
    [-0.2, -5.8],
  ];
  for (const [x, z] of lampAt.slice(0, PLANT.lamps)) {
    battens.push(box(x, Y + PLANT.railY - 0.24, z, 1.3, 0.05, 0.12));
    hoods.push(box(x, Y + PLANT.railY - 0.19, z, 1.36, 0.06, 0.18));
    for (const dx of [-0.5, 0.5])
      hoods.push(stick(v3(x + dx, Y + PLANT.railY - 0.16, z), v3(x + dx, Y + PLANT.railY - 0.02, z), 0.008, 5));
  }
  const bat = mesh(joined(battens), lamp);
  bat.castShadow = false;
  bat.userData.noShadow = true;
  group.add(bat);
  group.add(mesh(joined(hoods), mats.paintGrey));

  // ---- the walkway on the deck: two yellow lines from the door to the zone's ducts
  const lines: THREE.BufferGeometry[] = [];
  const wz = 0.9;
  lines.push(box(-3.8, Y + 0.006, wz, 6.4, 0.012, 0.07));
  lines.push(box(1.4, Y + 0.006, wz, 4, 0.012, 0.07));
  lines.push(box(-3, Y + 0.006, 2.6, 6, 0.012, 0.07));
  const lineMesh = mesh(joined(lines), mats.warning);
  lineMesh.castShadow = false;
  lineMesh.receiveShadow = true;
  group.add(lineMesh);

  // ---- a guard rail in front of the ducts of the zones: posts on the deck, two rails
  const rail: THREE.BufferGeometry[] = [];
  const railZ = 0.55;
  const postsX = [-2.4, -0.8, 0.8, 2.4];
  for (const x of postsX) {
    rail.push(stick(v3(x, Y, railZ), v3(x, Y + 1.05, railZ), 0.024, 8));
    rail.push(discY(0.06, Y, Y + 0.012, 12).translate(x, 0, railZ));
  }
  for (const y of [1.05, 0.55]) rail.push(stick(v3(postsX[0], Y + y, railZ), v3(postsX[3], Y + y, railZ), 0.02, 8));
  group.add(mesh(joined(rail), mats.warning));

  // ---- the workbench along the wall by the door, azimuth 150 degrees
  const benchAz = 160 * DEG;
  const bench = new THREE.Group();
  bench.name = 'bench';
  bench.position.set(Math.cos(benchAz) * (WALL.roomIn - 0.4), Y, Math.sin(benchAz) * (WALL.roomIn - 0.4));
  bench.rotation.y = -benchAz + Math.PI / 2;
  const legs: THREE.BufferGeometry[] = [];
  for (const dx of [-0.9, 0.9]) for (const dz of [-0.28, 0.28]) legs.push(box(dx, 0.43, dz, 0.05, 0.86, 0.05));
  legs.push(box(0, 0.25, -0.28, 1.8, 0.04, 0.04));
  legs.push(box(0, 0.25, 0.28, 1.8, 0.04, 0.04));
  bench.add(mesh(joined(legs), mats.paintGrey));
  bench.add(mesh(box(0, 0.88, 0, 2, 0.05, 0.7), new THREE.MeshStandardMaterial({ color: 0x8f7a5e, roughness: 0.85 })));
  // a vice, a tool box
  bench.add(mesh(box(0.7, 0.96, 0.22, 0.14, 0.11, 0.2), mats.paintBlue));
  bench.add(mesh(box(-0.5, 0.97, 0, 0.42, 0.13, 0.2), mats.paintRed));
  bench.add(mesh(box(-0.5, 1.05, 0, 0.18, 0.02, 0.05), mats.dark));
  group.add(bench);
  standing.push(bench);

  // ---- the shelves with spare filter frames
  const shelfAz = 137 * DEG;
  const shelf = new THREE.Group();
  shelf.name = 'shelf';
  shelf.position.set(Math.cos(shelfAz) * (WALL.roomIn - 0.3), Y, Math.sin(shelfAz) * (WALL.roomIn - 0.3));
  shelf.rotation.y = -shelfAz + Math.PI / 2;
  const sh: THREE.BufferGeometry[] = [];
  for (const dx of [-0.65, 0.65]) for (const dz of [-0.22, 0.22]) sh.push(box(dx, 0.95, dz, 0.04, 1.9, 0.04));
  for (const y of [0.25, 0.85, 1.45]) sh.push(box(0, y, 0, 1.34, 0.03, 0.48));
  shelf.add(mesh(joined(sh), mats.paintGrey));
  const boxes: THREE.BufferGeometry[] = [];
  for (const [dx, y, s] of [
    [-0.32, 0.25, 0.3],
    [0.3, 0.25, 0.4],
    [-0.28, 0.85, 0.36],
    [0.32, 0.85, 0.26],
    [0, 1.45, 0.32],
  ] as const)
    boxes.push(box(dx, y + 0.015 + s / 2, 0, s * 1.4, s, 0.36));
  shelf.add(mesh(joined(boxes), new THREE.MeshStandardMaterial({ color: 0x9c8460, roughness: 0.92 })));
  group.add(shelf);
  standing.push(shelf);

  // ---- a tool trolley
  const trolley = new THREE.Group();
  trolley.name = 'trolley';
  trolley.position.set(-5.1, Y, 2.1);
  trolley.rotation.y = 0.5;
  const tp: THREE.BufferGeometry[] = [];
  for (const y of [0.3, 0.72]) tp.push(box(0, y, 0, 0.8, 0.03, 0.5));
  for (const dx of [-0.38, 0.38]) for (const dz of [-0.23, 0.23]) tp.push(box(dx, 0.48, dz, 0.03, 0.74, 0.03));
  trolley.add(mesh(joined(tp), mats.paintRed));
  const wh: THREE.BufferGeometry[] = [];
  for (const dx of [-0.38, 0.38])
    for (const dz of [-0.23, 0.23]) wh.push(stick(v3(dx, 0.055, dz - 0.02), v3(dx, 0.055, dz + 0.02), 0.055, 12));
  trolley.add(mesh(joined(wh), mats.rubber));
  trolley.add(mesh(box(0.1, 0.8, 0, 0.42, 0.12, 0.26), mats.paintGrey));
  group.add(trolley);
  standing.push(trolley);

  // ---- the extinguisher on its bracket by the door
  const ext = new THREE.Group();
  ext.name = 'extinguisher';
  const extAz = 111 * DEG;
  const eR = WALL.roomIn - 0.1;
  ext.position.set(Math.cos(extAz) * eR, Y, Math.sin(extAz) * eR);
  ext.add(mesh(stick(v3(0, 0.02, 0), v3(0, 0.62, 0), 0.085, 18), mats.paintRed));
  const dome = new THREE.SphereGeometry(0.085, 16, 6, 0, TAU, 0, Math.PI / 2);
  dome.translate(0, 0.62, 0);
  ext.add(mesh(dome, mats.paintRed));
  ext.add(mesh(box(0, 0.74, 0, 0.1, 0.05, 0.03), mats.dark));
  group.add(ext);
  standing.push(ext);

  return { group, lamp, standing };
}
