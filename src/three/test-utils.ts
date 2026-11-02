import * as THREE from 'three';
import type { PartRegistry, SceneModule, ViewOpts } from '@onigam/lab-kit/three';
import { SandSim } from '../sim/engine';
import type { SandParams, SandState } from '../sim/types';

// Helpers of the 3D tests: view options, simulation states, the real box of a part, draw statistics.

export const view = (patch: Partial<ViewOpts> = {}): ViewOpts => ({
  slowMo: 1,
  cutaway: false,
  schematic: false,
  time: 1,
  ...patch,
});

/** A state of the simulation after a little running; `params` edits the simulation first, `over` overrides fields of the state. */
export function stateWith(over: Partial<SandState> = {}, params: Partial<SandParams> = {}, seconds = 0.5): SandState {
  const sim = new SandSim();
  sim.set(params);
  for (let i = 0; i < 60 * seconds; i++) sim.step(1 / 60);
  return { ...sim.state, ...over };
}

/** Every mesh under `root` flagged to be left out by `skip`. */
export function meshBox(root: THREE.Object3D, skip: (m: THREE.Mesh) => boolean = () => false): THREE.Box3 {
  root.updateWorldMatrix(true, true);
  const box = new THREE.Box3();
  const tmp = new THREE.Box3();
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || skip(m) || m.userData.cap) return;
    let visible = true;
    for (let p: THREE.Object3D | null = m; p; p = p.parent) if (!p.visible) visible = false;
    if (!visible) return;
    tmp.setFromObject(m, true);
    box.union(tmp);
  });
  return box;
}

export const sceneBoxes = (mod: SceneModule<SandState>): Map<string, THREE.Box3> => {
  mod.scene.updateMatrixWorld(true);
  const out = new Map<string, THREE.Box3>();
  for (const id of mod.registry.ids()) out.set(id, meshBox(mod.registry.get(id)!.object));
  return out;
};

export const touches = (a: THREE.Box3, b: THREE.Box3, tol: number): boolean =>
  a.clone().expandByScalar(tol).intersectsBox(b);

/** Parts whose box touches no other part's box (nor any extra support box) within `tol`. */
export function floating(boxes: Map<string, THREE.Box3>, tol: number, supports: THREE.Box3[] = []): string[] {
  const bad: string[] = [];
  for (const [id, box] of boxes) {
    const other = [...boxes].some(([oid, ob]) => oid !== id && touches(box, ob, tol));
    if (!other && !supports.some((s) => touches(box, s, tol))) bad.push(id);
  }
  return bad;
}

/** True when every object of the tree has finite transforms and finite vertices. */
export function finiteTree(root: THREE.Object3D): boolean {
  let ok = true;
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    const v = [
      o.position.x,
      o.position.y,
      o.position.z,
      o.rotation.x,
      o.rotation.y,
      o.rotation.z,
      o.scale.x,
      o.scale.y,
      o.scale.z,
    ];
    if (!v.every(Number.isFinite)) ok = false;
    const m = (o as THREE.Mesh).geometry?.attributes?.position;
    if (m) for (let i = 0; i < m.array.length; i++) if (!Number.isFinite(m.array[i])) ok = false;
  });
  return ok;
}

export function isolateOne(reg: PartRegistry, id: string, mode: 'hidden' | 'ghost'): void {
  for (const other of reg.ids()) reg.setDisplay(other, other === id ? 'solid' : mode);
}

/** Draw calls (visible meshes, each instanced mesh once) and triangles (instances counted) of a scene, as the colour pass would issue them. */
export function drawStats(root: THREE.Object3D): { calls: number; triangles: number } {
  let calls = 0;
  let triangles = 0;
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh && !(o as THREE.Points).isPoints) return;
    let visible = true;
    for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) visible = false;
    if (!visible) return;
    const g = m.geometry;
    const n =
      (g.drawRange.count === Infinity ? (g.index ? g.index.count : g.attributes.position.count) : g.drawRange.count) /
      3;
    const inst = (m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1;
    calls++;
    if (m.isMesh) triangles += n * inst;
  });
  return { calls, triangles };
}
