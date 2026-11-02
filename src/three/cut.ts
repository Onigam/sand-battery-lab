import * as THREE from 'three';
import type { PartRegistry } from '@onigam/lab-kit/three';

// The section of a machine of revolution. Two cuts, one tool:
//   'wedge'  what a visitor sees on arrival: a quarter removed (x > cx and z > cz), the section is the first thing seen, on two faces;
//   'half'   the tool « Coupe »: the half towards the viewer removed (z > cz), one big flat section through the axis.
// Both are the same two clipping planes with `clipIntersection`, so that nothing recompiles when the tool is pressed. The caps are flat polygons of the section of
// each part, on three quarter-planes: A (z = cz, x > cx) in both cuts, B (z = cz, x < cx) in 'half', C (x = cx, z > cz) in 'wedge'. A vertical explode keeps a section
// valid: the planes contain Y.

/**
 * The kit's picking skips a hit if ANY of the clipping planes says the point is on its negative side (`distanceToPoint < 0`), as with a union of planes. With an
 * intersection that would refuse three quarters of the machine: this plane answers for the two together (docs/kit-requests.md).
 */
class SectionPlane extends THREE.Plane {
  constructor(private readonly removed: (p: THREE.Vector3) => boolean) {
    super();
  }
  override distanceToPoint(point: THREE.Vector3): number {
    return this.removed(point) ? -1 : 1;
  }
}

export type CutMode = 'wedge' | 'half';
type Quarter = 'a' | 'b' | 'c';

/** A polygon of the section: [radius, y] pairs. */
export type Poly = [number, number][];

export const rectPoly = (r0: number, y0: number, r1: number, y1: number): Poly => [
  [r0, y0],
  [r1, y0],
  [r1, y1],
  [r0, y1],
];

interface Cap {
  mesh: THREE.Mesh;
  id: string;
  quarter: Quarter;
}

export class WedgeCut {
  private mode: CutMode = 'wedge';
  private readonly removed = (p: THREE.Vector3): boolean =>
    this.mode === 'wedge' ? p.x > this.cx + 1e-3 && p.z > this.cz + 1e-3 : p.z > this.cz + 1e-3;
  readonly planes: [THREE.Plane, THREE.Plane] = [new SectionPlane(this.removed), new SectionPlane(this.removed)];
  private readonly clipped = new Set<THREE.Material>();
  private readonly caps: Cap[] = [];
  private readonly capMats = new Map<THREE.Material, THREE.Material>();

  constructor(
    readonly cx = 0,
    readonly cz = 0,
  ) {
    this.apply();
  }

  private apply(): void {
    const [a, b] = this.planes;
    // n·p + c < 0 is clipped, and a point is removed when both planes clip it
    b.normal.set(0, 0, -1);
    b.constant = this.cz;
    if (this.mode === 'wedge') {
      a.normal.set(-1, 0, 0);
      a.constant = this.cx;
    } else {
      a.normal.set(0, 0, -1);
      a.constant = this.cz;
    }
  }

  /** The materials under `obj` are cut. Same planes and same shader in both modes: pressing the tool compiles nothing. */
  clip(obj: THREE.Object3D): void {
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!(m.isMesh || (o as THREE.Points).isPoints) || m.userData.cap || m.userData.notClipped) return;
      this.clipMaterial(m.material as THREE.Material);
    });
  }

  clipMaterial(mat: THREE.Material): void {
    if (this.clipped.has(mat)) return;
    this.clipped.add(mat);
    mat.clippingPlanes = this.planes;
    mat.clipIntersection = true;
    mat.clipShadows = true;
    mat.side = THREE.DoubleSide;
    mat.needsUpdate = true;
  }

  clips(mat: THREE.Material): boolean {
    return this.clipped.has(mat);
  }

  /** The material of a cap that stands for `mat`: the same look, not clipped (a face lying on the plane would flicker under its own clipping), seen from both sides. */
  capMaterial(mat: THREE.Material): THREE.Material {
    let c = this.capMats.get(mat);
    if (!c) {
      c = mat.clone();
      c.clippingPlanes = null;
      c.clipIntersection = false;
      c.clipShadows = false;
      c.side = THREE.DoubleSide;
      c.userData.noShare = true;
      c.userData.worn = true;
      this.capMats.set(mat, c);
    }
    return c;
  }

  /**
   * The flat caps of a part, on the three quarter-planes: `polys` in (radius, y). They carry `userData.cap`, belong to the part for the display but are made pickable
   * only if `pick` says so (a section that is clicked selects what it shows).
   */
  capRevolved(id: string, parent: THREE.Object3D, polys: Poly[], material: THREE.Material, pick = true): THREE.Mesh[] {
    const shapes = polys.map((p) => new THREE.Shape(p.map(([r, y]) => new THREE.Vector2(r, y))));
    const out: THREE.Mesh[] = [];
    for (const quarter of ['a', 'b', 'c'] as Quarter[]) {
      const g = new THREE.ShapeGeometry(shapes);
      if (quarter === 'b') {
        g.scale(-1, 1, 1);
        flipWinding(g);
      }
      if (quarter === 'c') g.rotateY(-Math.PI / 2);
      g.translate(this.cx, 0, this.cz);
      out.push(this.capMesh(id, parent, g, material, quarter, pick));
    }
    return out;
  }

  /** A cap on one quarter-plane, from an already built geometry in the world frame of the machine. */
  capGeometry(
    id: string,
    parent: THREE.Object3D,
    g: THREE.BufferGeometry,
    material: THREE.Material,
    quarter: Quarter,
    pick = false,
  ): THREE.Mesh {
    return this.capMesh(id, parent, g, material, quarter, pick);
  }

  private capMesh(
    id: string,
    parent: THREE.Object3D,
    g: THREE.BufferGeometry,
    material: THREE.Material,
    quarter: Quarter,
    pick: boolean,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(g, material);
    mesh.userData.cap = true;
    mesh.userData.noShadow = true;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.visible = false;
    mesh.name = `${id}-cap-${quarter}`;
    if (pick) {
      // a cap that is clicked selects its part, but only while it shows (the kit casts against every mesh of a part, visible or not)
      mesh.raycast = function raycast(rc, hits) {
        if (mesh.visible) THREE.Mesh.prototype.raycast.call(mesh, rc, hits);
      };
    } else {
      mesh.userData.ownerPart = id;
      mesh.raycast = () => {};
    }
    parent.add(mesh);
    this.caps.push({ mesh, id, quarter });
    return mesh;
  }

  get current(): CutMode {
    return this.mode;
  }

  /** The caps of a part (tests). */
  capsOf(id: string): THREE.Mesh[] {
    return this.caps.filter((c) => c.id === id).map((c) => c.mesh);
  }

  /** Every frame: which cut, and the caps follow the display of their part. */
  update(mode: CutMode, registry: PartRegistry | null): void {
    if (mode !== this.mode) {
      this.mode = mode;
      this.apply();
    }
    for (const c of this.caps) {
      const part = registry?.get(c.id);
      const on = c.quarter === 'a' ? true : c.quarter === 'b' ? mode === 'half' : mode === 'wedge';
      c.mesh.visible = on && (!part || part.display === 'solid');
    }
  }
}

function flipWinding(g: THREE.BufferGeometry): void {
  const idx = g.index;
  if (!idx) return;
  for (let i = 0; i < idx.count; i += 3) {
    const b = idx.getX(i + 1);
    idx.setX(i + 1, idx.getX(i + 2));
    idx.setX(i + 2, b);
  }
}
