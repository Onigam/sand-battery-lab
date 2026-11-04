import * as THREE from 'three';
import { l } from '@onigam/lab-kit/i18n';
import { PAPER_STUDIO, PartRegistry, type Hotspot, type PartDisplay, type PartEntry } from '@onigam/lab-kit/three';

// What the paper-studio worlds share: the lighting (paper, soft shadows, like the other labs of the series), the camera's depth range, the hotspot declarations, the framing of a part.

/**
 * The depth range of the paper-studio worlds. `Stage.setActive` gives every world but `site` a near plane of 0.01 and a far plane of 60. With 24 bits a depth step is then 1 cm at 40 m: the
 * valleys of the cladding's ribs stand 5 mm off the wool, so the wall flashed yellow from behind (review D1). And 60 m cuts a silo framed from 54 m in two (D4). At 0.1 a step is 1 mm at 40 m, 2 mm
 * at 60 m. The closest any of these worlds lets the camera come is 0.5 m. `docs/kit-requests.md` asks for this in the kit.
 */
export const DEPTH = { near: 0.1, far: 150 } as const;

/** Sets the depth range on the camera just before it is used: the renderer reads the projection after this hook, and nothing here depends on the order of the kit's own calls. */
export function holdDepthRange(scene: THREE.Scene): void {
  scene.onBeforeRender = (_renderer, _scene, camera) => {
    const c = camera as THREE.PerspectiveCamera;
    if (c.near === DEPTH.near && c.far === DEPTH.far) return;
    c.near = DEPTH.near;
    c.far = DEPTH.far;
    c.updateProjectionMatrix();
  };
}

export interface WorkshopOptions {
  name: string;
  /** Fog start and end, metres. It must start behind everything the camera can frame: the paper floor dissolves by itself (`paperFloor`, `fade`), and the fog only closes what is left. */
  fog: [number, number];
  /** Position of the key light and the point it looks at. */
  key: [number, number, number];
  target: [number, number, number];
  /** Half size of the shadow box and its far plane. */
  shadowHalf: number;
  shadowFar: number;
}

export function workshopScene(o: WorkshopOptions): THREE.Scene {
  const scene = new THREE.Scene();
  scene.name = o.name;
  scene.background = new THREE.Color(0xefe6d3);
  scene.fog = new THREE.Fog(0xefe6d3, o.fog[0], o.fog[1]);
  // the stage fills scene.environment from a shared PMREM environment
  scene.userData.wantsEnv = true;
  // the paper studio of kit 0.5: Neutral tone mapping keeps the paper the paper, the warm studio lights the metal
  scene.userData.look = { ...PAPER_STUDIO };
  holdDepthRange(scene);
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0xb6a68c, 1.0));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.3);
  key.position.set(...o.key);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera;
  sc.left = -o.shadowHalf;
  sc.right = o.shadowHalf;
  sc.top = o.shadowHalf;
  sc.bottom = -o.shadowHalf;
  sc.near = 0.1;
  sc.far = o.shadowFar;
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = o.shadowHalf * 0.0035;
  key.target.position.set(...o.target);
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xdfe9ff, 0.7);
  fill.position.set(-o.key[0], o.key[1] * 0.6, o.key[2] * 0.4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.8);
  rim.position.set(o.key[0] * 0.2, o.key[1], -o.key[2]);
  scene.add(rim);
  return scene;
}

/**
 * A direction to look from: its elevation above the ground and its bearing from +z towards +x, degrees. What `viewDir` is made of: a part with no direction of its own keeps the camera's, so turn
 * the camera, click a part, and you see whatever stands between them (review N2). Every part of the three worlds with a wall around it therefore says where it reads from.
 */
export function viewFrom(elevation: number, bearing: number): THREE.Vector3 {
  const e = (elevation * Math.PI) / 180;
  const b = (bearing * Math.PI) / 180;
  return new THREE.Vector3(Math.sin(b) * Math.cos(e), Math.sin(e), Math.cos(b) * Math.cos(e));
}

export interface HotspotDef {
  /** The part; a suffix `#name` lets a part have several labels. */
  id: string;
  fr: string;
  en: string;
  minor?: boolean;
  /** World to open when the label is clicked. */
  goto?: string;
}

/** An empty marker at a position of `parent`: the label follows it, also during the explode. */
export function anchor(parent: THREE.Object3D, x: number, y: number, z: number, name = 'anchor'): THREE.Object3D {
  const o = new THREE.Object3D();
  o.name = name;
  o.position.set(x, y, z);
  o.userData.keep = true;
  parent.add(o);
  return o;
}

export function hotspots(defs: HotspotDef[], anchors: Record<string, THREE.Object3D>): Hotspot[] {
  return defs.map((d) => ({
    partId: d.id.replace(/#.*$/, ''),
    anchor: anchors[d.id],
    label: l(d.fr, d.en),
    minor: d.minor,
    goto: d.goto,
  }));
}

/** The moving things are attached to this: the real bounding box of the meshes under an object. */
export const worldBox = (o: THREE.Object3D): THREE.Box3 => new THREE.Box3().setFromObject(o, true);

/** A part's map: it knows when somebody walks through all of them, which is how the kit takes the box of a whole view. */
class WalkedParts extends Map<string, PartEntry> {
  walks = 0;
  override values(): MapIterator<PartEntry> {
    const all = super.values();
    const counted = function* (self: WalkedParts): Generator<PartEntry, undefined, undefined> {
      self.walks++;
      try {
        yield* all;
      } finally {
        self.walks--;
      }
      return undefined;
    };
    return counted(this) as unknown as MapIterator<PartEntry>;
  }
}

/**
 * A registry that knows what to frame. The kit frames a part by the box of everything in it and keeps the direction of the camera, so a line 209 m long, a wind farm 1.3 km wide or the 46 cm of
 * wool around a silo take the camera away (review D3). A part may name a smaller box, the place where it can be read; it moves with the part's explode.
 *
 * - `bounds(id)` answers that box when the part is framed among the others.
 * - When some other part is hidden or drawn in wire (isolate, a step of a guide), it answers the whole part: what stands alone is shown whole.
 * - While the kit walks through all the parts (the overview, the reach of the occlusion) it answers the real boxes, and the first of them also carries `overviewExtra`: what the overview must hold
 *   that is no part (`docs/kit-requests.md` asks the kit for a frame box per part).
 */
export class FramedRegistry extends PartRegistry {
  private readonly focusBoxes = new Map<string, THREE.Box3>();
  /** The overview also holds this box, in the world's frame: the stone under the room, which is scenery there. */
  overviewExtra: THREE.Box3 | null = null;
  /**
   * A ghost shows the mass of a part, not each of its pieces: only its largest mesh. A room seen from above puts fifteen machines over one floor, and at the kit's opacity their layers of bolts,
   * trays and fins add up to dark blotches on it (review D36).
   */
  lightGhosts = false;

  constructor() {
    super();
    (this as unknown as { parts: Map<string, PartEntry> }).parts = new WalkedParts();
  }

  /** Where this part is framed when it is selected, as assembled. Call it once the part is registered. */
  setFocus(id: string, box: THREE.Box3): void {
    this.focusBoxes.set(id, box.clone());
  }

  focusOf(id: string): THREE.Box3 | undefined {
    return this.focusBoxes.get(id);
  }

  /** The box of everything in the part, whatever is framed. */
  wholeBounds(id: string): THREE.Box3 {
    return super.bounds(id);
  }

  override setDisplay(id: string, display: PartDisplay): void {
    super.setDisplay(id, display);
    const p = this.get(id);
    if (!this.lightGhosts || display !== 'ghost' || !p || p.meshes.length < 2) return;
    const size = new THREE.Vector3();
    const volume = (m: THREE.Mesh): number => {
      m.geometry.computeBoundingBox();
      m.geometry.boundingBox!.getSize(size);
      return Math.max(size.x, 0.01) * Math.max(size.y, 0.01) * Math.max(size.z, 0.01);
    };
    const largest = p.meshes.reduce((a, b) => (volume(b) > volume(a) ? b : a));
    for (const m of p.meshes) m.visible = m === largest;
  }

  override bounds(id: string): THREE.Box3 {
    const whole = super.bounds(id);
    const walked = this.parts as WalkedParts;
    if (walked.walks > 0) {
      if (this.overviewExtra && id === walked.keys().next().value) whole.union(this.overviewExtra);
      return whole;
    }
    const focus = this.focusBoxes.get(id);
    const part = this.get(id);
    if (!focus || !part) return whole;
    for (const p of [...walked.keys()].map((k) => this.get(k)!)) {
      if (p.id !== id && (p.display === 'hidden' || p.display === 'wire')) return whole;
    }
    return focus.clone().translate(part.object.position.clone().sub(part.base));
  }
}
