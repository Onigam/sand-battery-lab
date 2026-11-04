import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { SandState } from '../sim/types';
import { LEVEL, PLANT, RISERS, SILO, SITE, WALL } from './dims';
import { FOV, homeCamera, labelBoxes, type LabelBox } from './framing';
import { heatColor, HEAT_MAX } from './heat';
import { WORLD } from './index';
import { EXPLODE as ROOM_EXPLODE, createPlantRoomScene } from './plantroom/scene';
import { createPipeCellScene } from './pipecell/scene';
import { SERVICE_PARTS } from './machine/equipment';
import { createSiloScene } from './silo/scene';
import { EXPLODE as SITE_EXPLODE, createSiteScene } from './site/scene';
import { meshBox, stateWith, view } from './test-utils';
import { gravelMap } from './textures';
import { DEPTH, FramedRegistry } from './world';

// What the independent review of 2 November found (docs/qa.md), held by script: the depth range and the fog (D1, D4), what isolate and explode leave behind (D2), how close a selected part is framed
// (D3, D5), the rails (D6), the village's explode and the holes in its land (D7, D41), the scale in each coloured world (D9), the crown of a birch (D10), the gravel (D11), the glass (D12), the labels
// (D20), the air ahead of the resistors (D26), X-ray (D36), the marks of the coupling (D39), the dampers (D47).

const silo = createSiloScene();
const plant = createPlantRoomScene();
const cell = createPipeCellScene();
const site = createSiteScene();
const s0 = stateWith();
for (const w of [silo, plant, cell, site]) {
  w.update(s0, 1 / 60, view());
  w.scene.updateMatrixWorld(true);
}
const workshops: [string, SceneModule<SandState>][] = [
  ['silo', silo],
  ['pipe-cell', cell],
  ['plant-room', plant],
];
const all: [keyof typeof WORLD, SceneModule<SandState>][] = [
  ['site', site],
  ['silo', silo],
  ['pipe-cell', cell],
  ['plant-room', plant],
];

/** What the renderer calls before it reads the projection. */
const hook = (scene: THREE.Scene, cam: THREE.Camera): void =>
  (scene.onBeforeRender as unknown as (r: unknown, s: THREE.Scene, c: THREE.Camera, t: unknown) => void)(
    null,
    scene,
    cam,
    null,
  );

/** What `Stage.frameParts` does at 1280 (a 3D view of 842 × 678): the distance for a box. */
function frameDistance(mod: SceneModule<SandState>, box: THREE.Box3, padding: number): number {
  const radius = box.getBoundingSphere(new THREE.Sphere()).radius;
  const half = Math.tan((FOV * Math.PI) / 360);
  const fov = 2 * Math.atan(Math.min(half, (half * 842) / 678));
  return Math.min(mod.maxDistance, Math.max(mod.minDistance, (radius * padding) / Math.sin(fov / 2)));
}

describe('the depth range of the paper-studio worlds (D1, D4)', () => {
  for (const [name, mod] of workshops) {
    it(`${name}: the hook sets it before the renderer reads the projection`, () => {
      const cam = new THREE.PerspectiveCamera(40, 1, 0.01, 60);
      const before = cam.projectionMatrix.clone();
      hook(mod.scene, cam);
      expect(cam.near).toBe(DEPTH.near);
      expect(cam.far).toBe(DEPTH.far);
      expect(cam.projectionMatrix.equals(before)).toBe(false);
    });
    it(`${name}: a depth step at the camera's limit stays well under the gap between two layers of the wall`, () => {
      const step = (mod.maxDistance * mod.maxDistance) / (DEPTH.near * 2 ** 24);
      // the valleys of the ribs stand 5 mm off the wool
      expect(step).toBeLessThan(0.005);
      expect(mod.minDistance).toBeGreaterThan(DEPTH.near);
    });
  }
  it('the wool really is that close to the ribs: the reason for all this', () => {
    expect(WALL.claddingOut - WALL.insulationOut).toBeLessThan(0.15);
  });
  for (const [name, mod] of [
    ['silo', silo],
    ['plant-room', plant],
  ] as const) {
    it(`${name}: the fog starts behind everything the camera can frame, and ends inside the far plane`, () => {
      const fog = mod.scene.fog as THREE.Fog;
      expect(fog.near).toBeGreaterThan(mod.maxDistance + SILO.slabR + 16);
      expect(fog.far).toBeLessThan(DEPTH.far);
    });
  }
  it('the site keeps what the kit gives it: its hook is not set', () => {
    const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 4000);
    hook(site.scene, cam);
    expect(cam.far).toBe(4000);
  });
});

describe('what isolate and explode leave behind in the silo (D2)', () => {
  const reg = silo.registry;
  it('every mesh of the world belongs to a part, but the paper and its contact shadow', () => {
    const loose: string[] = [];
    silo.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.name === 'floor' || m.name === 'contact-shadow' || m.name === 'contact-ring') return;
      if (!reg.partOf(m)) loose.push(m.name || m.uuid);
    });
    expect(loose).toEqual([]);
  });
  it('the pipes and the cable go with the cladding, the scale with the stone', () => {
    for (const r of [silo.risers.water, silo.risers.cable]) {
      r.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) expect(reg.partOf(o)).toBe('outer-cladding');
      });
    }
    silo.scale.group.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) expect(reg.partOf(o)).toBe('storage-bed');
    });
  });
  it('hidden with their part: nothing of them shows when another part is isolated', () => {
    for (const id of reg.ids()) reg.setDisplay(id, id === 'foundation-slab' ? 'solid' : 'hidden');
    for (const g of [silo.risers.water, silo.risers.cable, silo.scale.group]) {
      g.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) expect((o as THREE.Mesh).visible).toBe(false);
      });
    }
    reg.setAllDisplay('solid');
  });
  it('exploded, the risers stay on the wall that rises, the scale stays on the paper', () => {
    const wall0 = meshBox(silo.risers.water);
    reg.setAllFactors(1);
    silo.scene.updateMatrixWorld(true);
    const wall1 = meshBox(silo.risers.water);
    expect(wall1.min.y - wall0.min.y).toBeCloseTo(reg.get('outer-cladding')!.explode.y, 3);
    expect(meshBox(silo.scale.group).min.y).toBeCloseTo(0, 2);
    reg.setAllFactors(0);
    silo.scene.updateMatrixWorld(true);
    expect(meshBox(silo.scale.group).min.y).toBeCloseTo(0, 2);
  });
  it('the cut does not take the scale away', () => {
    silo.scale.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) expect((m.material as THREE.Material).clippingPlanes ?? null).toBe(null);
    });
  });
});

describe('selecting a part brings the camera to it (D3, D5)', () => {
  for (const [name, mod] of all) {
    const reg = mod.registry as FramedRegistry;
    const padding = WORLD[name].partPadding;
    const home = homeDistance(mod, homeCamera(mod, { w: 842, h: 678 }));
    for (const id of reg.ids()) {
      // one turbine on a far ridge is 174 m tall: it is framed whole, under the world's limit
      if (id === 'wind-farm') continue;
      it(`${name}: ${id} is framed no farther than the world's overview`, () => {
        const d = frameDistance(mod, reg.bounds(id), padding);
        expect(d, `${d.toFixed(1)} m against ${home.toFixed(1)} m`).toBeLessThanOrEqual(home * 1.02);
      });
    }
    it(`${name}: a focus lies on its part`, () => {
      for (const id of reg.ids()) {
        const f = reg.focusOf(id);
        if (f) expect(reg.wholeBounds(id).clone().expandByScalar(0.6).intersectsBox(f), id).toBe(true);
      }
    });
    it(`${name}: the overview still holds every part whole`, () => {
      const walked = new THREE.Box3();
      for (const p of reg.parts.values()) walked.union(reg.bounds(p.id));
      for (const id of reg.ids()) {
        const whole = reg.wholeBounds(id);
        expect(walked.clone().expandByScalar(1e-3).containsBox(whole), id).toBe(true);
      }
    });
  }
  it('one turbine is framed, under the limit of the world', () => {
    const b = site.registry.bounds('wind-farm');
    expect(b.getSize(new THREE.Vector3()).x).toBeLessThan(2 * SITE.wind.rotorR + 1);
    expect(frameDistance(site, b, WORLD.site.partPadding)).toBeLessThan(site.maxDistance);
  });
  it('a part alone on the screen is framed whole: isolate shows all of it', () => {
    const reg = silo.registry as FramedRegistry;
    const focus = reg.bounds('wall-insulation').getSize(new THREE.Vector3());
    for (const id of reg.ids()) reg.setDisplay(id, id === 'wall-insulation' ? 'solid' : 'hidden');
    const whole = reg.bounds('wall-insulation').getSize(new THREE.Vector3());
    expect(whole.x).toBeGreaterThan(focus.x * 3);
    reg.setAllDisplay('solid');
  });
  it('a focus follows its part in the exploded view', () => {
    const reg = silo.registry as FramedRegistry;
    const before = reg.bounds('wall-insulation').clone();
    reg.setFactor('wall-insulation', 1);
    const after = reg.bounds('wall-insulation');
    expect(after.min.y - before.min.y).toBeCloseTo(reg.get('wall-insulation')!.explode.y, 6);
    reg.setFactor('wall-insulation', 0);
  });
  it("the room's home looks from 60° up: the machines stop hiding one another", () => {
    const d = plant.home.position.clone().sub(plant.home.target).normalize();
    expect((Math.asin(d.y) * 180) / Math.PI).toBeGreaterThan(55);
  });
});

describe('the long runs of a machine are not in its box (D5)', () => {
  const body = (id: string) => meshBox(plant.registry.get(id)!.object).getSize(new THREE.Vector3());
  it('a heat meter is a meter, a pump a pump, a drive and a controller their cabinets', () => {
    expect(Math.max(body('heat-meter').x, body('heat-meter').z)).toBeLessThan(0.7);
    expect(Math.max(body('dh-pump').x, body('dh-pump').z)).toBeLessThan(1.5);
    expect(Math.max(body('blower-drive').x, body('blower-drive').z)).toBeLessThan(PLANT.drive.w + 0.05);
    expect(Math.max(body('control-cabinet').x, body('control-cabinet').z)).toBeLessThan(PLANT.control.w + 0.05);
  });
  it('the meter still sits on its pipe, the pipe still reaches the wall', () => {
    const path = plant.equipment.paths.waterOut;
    const at = new THREE.Vector3(PLANT.water.supplyX, LEVEL.floor + PLANT.water.highY, PLANT.meter.z);
    const nearest = (pts: THREE.Vector3[], p: THREE.Vector3) => {
      let best = Infinity;
      const line = new THREE.Line3();
      const q = new THREE.Vector3();
      for (let i = 0; i < pts.length - 1; i++) {
        line.set(pts[i], pts[i + 1]);
        best = Math.min(best, line.closestPointToPoint(p, true, q).distanceTo(p));
      }
      return best;
    };
    expect(nearest(path, at)).toBeLessThan(0.003);
    expect(Math.hypot(path[path.length - 1].x, path[path.length - 1].z)).toBeCloseTo(WALL.roomIn + 0.02, 3);
    expect(RISERS.topY).toBeGreaterThan(LEVEL.floor);
  });
  it('a run shows while its machine does: hidden with it, ghosted with it, solid with it', () => {
    const reg = plant.registry;
    const meshes = (id: (typeof SERVICE_PARTS)[number]) => {
      const out: THREE.Mesh[] = [];
      plant.equipment.services[id].traverse((o) => {
        if ((o as THREE.Mesh).isMesh) out.push(o as THREE.Mesh);
      });
      return out;
    };
    for (const id of SERVICE_PARTS) expect(meshes(id).length, id).toBeGreaterThan(0);
    reg.setDisplay('dh-pump', 'hidden');
    plant.update(s0, 1 / 60, view());
    expect(meshes('dh-pump').every((m) => !m.visible)).toBe(true);
    expect(meshes('heat-meter').every((m) => m.visible)).toBe(true);
    reg.setDisplay('dh-pump', 'ghost');
    plant.update(s0, 1 / 60, view());
    expect(meshes('dh-pump').every((m) => m.visible)).toBe(true);
    reg.setDisplay('dh-pump', 'solid');
    plant.update(s0, 1 / 60, view());
    expect(meshes('dh-pump').every((m) => m.visible && m.castShadow)).toBe(true);
  });
  it('they stand still in the exploded view: the machine lifts off its pipes', () => {
    const before = meshBox(plant.equipment.services['dh-pump']);
    plant.registry.setAllFactors(1);
    plant.scene.updateMatrixWorld(true);
    const after = meshBox(plant.equipment.services['dh-pump']);
    expect(after.min.distanceTo(before.min)).toBeLessThan(1e-6);
    plant.registry.setAllFactors(0);
    plant.scene.updateMatrixWorld(true);
  });
  it('the `silo` world draws them too, in its equipment floor: the same room', () => {
    const b = meshBox(silo.registry.get('equipment-floor')!.object);
    const run = meshBox(plant.equipment.services['dh-pump']);
    expect(b.containsBox(run.clone().expandByScalar(-0.01))).toBe(true);
  });
});

describe('the ceiling rails (D6)', () => {
  it('each rail reaches the wall at both ends (3 mm)', () => {
    const rails = plant.dressing.overhead[0];
    rails.geometry.computeBoundingBox();
    for (const z of PLANT.railZ) {
      const half = Math.sqrt(WALL.roomIn * WALL.roomIn - z * z);
      const p = rails.geometry.attributes.position;
      let max = -Infinity;
      for (let i = 0; i < p.count; i++) if (Math.abs(p.getZ(i) - z) < PLANT.railW) max = Math.max(max, p.getX(i));
      expect(Math.abs(max - half), `rail at z = ${z}`).toBeLessThan(0.003);
    }
  });
  it('in the room with an open wall their material has the same opening as the wall, and no shadow crosses the deck', () => {
    for (const m of plant.dressing.overhead) {
      expect((m.material as THREE.Material).customProgramCacheKey()).toContain('overhead');
      expect(m.castShadow).toBe(false);
      expect(m.userData.noShadow).toBe(true);
    }
  });
  it('in the `silo` world the wall stands: their material has no such opening', () => {
    silo.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.name === 'ceiling-rails') {
        expect((m.material as THREE.Material).customProgramCacheKey()).not.toContain('overhead');
      }
    });
  });
});

describe('the village does not come apart (D7), and its holes have a bottom (D7, D41)', () => {
  it('no part of the village has an explode offset', () => {
    for (const [id, o] of Object.entries(SITE_EXPLODE)) expect(o, id).toEqual([0, 0, 0]);
    for (const id of site.registry.ids()) expect(site.registry.get(id)!.explode.length(), id).toBe(0);
  });
  const holes = site.scenery().find((o) => o.name === 'hole-floor')!;
  const floor = meshBox(holes);
  it('stands under the trench and the cellar, below what they draw', () => {
    expect(floor.max.y).toBeLessThan(-SITE.trench.depth);
    for (const line of [SITE.trench.path, SITE.trench.schoolSpur, SITE.trench.boilerSpur]) {
      for (const [x, z] of line) {
        expect(floor.min.x, `${x}`).toBeLessThan(x);
        expect(floor.max.x, `${x}`).toBeGreaterThan(x);
        expect(floor.min.z, `${z}`).toBeLessThan(z);
        expect(floor.max.z, `${z}`).toBeGreaterThan(z);
      }
    }
    const c = SITE.cellar;
    expect(floor.min.x).toBeLessThan(c.x0);
    expect(floor.min.y).toBeLessThan(-c.depth);
  });
  it('is scenery: isolating a part leaves it, and earth shows, not the sky', () => {
    expect(site.registry.partOf(holes)).toBeUndefined();
    expect(holes.visible).toBe(true);
  });
  it("around the riser's feet: the round end of the land's hole, beyond the trench's end wall", () => {
    const f = site.trench.start.supply;
    expect(f.x).toBeGreaterThan(floor.min.x);
    expect(f.x).toBeLessThan(floor.max.x);
    expect(f.z).toBeGreaterThan(floor.min.z);
    expect(f.z).toBeLessThan(floor.max.z);
  });
});

describe('a scale in each coloured world (D9)', () => {
  const scales = [
    ['silo', silo, silo.scale, LEVEL.ground],
    ['pipe-cell', cell, cell.scale, 0],
    ['plant-room', plant, plant.scale, LEVEL.floor],
  ] as const;
  for (const [name, mod, scale, ground] of scales) {
    it(`${name}: stands on what is under it (5 mm)`, () => {
      mod.scene.updateMatrixWorld(true);
      expect(Math.abs(meshBox(scale.group).min.y - ground)).toBeLessThan(0.005);
    });
    it(`${name}: its colours are the stone's, cold at the foot and hot at the top`, () => {
      const bar = scale.board.children.find((c) => (c as THREE.Mesh).geometry?.attributes.color) as THREE.Mesh;
      const col = bar.geometry.attributes.color;
      const c = new THREE.Color();
      heatColor(0, c);
      expect(col.getX(0)).toBeCloseTo(c.r, 5);
      heatColor(HEAT_MAX, c);
      expect(col.getX(col.count - 1)).toBeCloseTo(c.r, 5);
    });
    it(`${name}: a main label says the temperatures`, () => {
      expect(mod.hotspots.filter((h) => !h.minor && /°C/.test(h.label.fr)).length).toBeGreaterThan(0);
    });
    it(`${name}: its bar is inside the overview at every size`, () => {
      for (const [w, h, toolbar] of [
        [842, 678, 96],
        [380, 902, 130],
        [390, 632, 92],
      ]) {
        const cam = homeCamera(mod, { w, h }, toolbar);
        const c = scale.board.localToWorld(new THREE.Vector3(0, (scale.options.y1 - scale.options.y0) / 2, 0));
        const q = c.project(cam);
        expect(Math.abs(q.x), `${w}`).toBeLessThan(1);
        expect(Math.abs(q.y), `${w}`).toBeLessThan(1);
      }
    });
  }
});

describe('the crown of a birch (D10)', () => {
  const near = site.vegetation.meshes.find((m) => m.name === 'birch-leaves')!;
  const far = site.vegetation.meshes.find((m) => m.name === 'birch-leaves-far')!;
  const sizeOfCard = (g: THREE.BufferGeometry) => {
    const p = g.attributes.position;
    let max = 0;
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    for (let i = 0; i < p.count; i += 4)
      max = Math.max(max, a.fromBufferAttribute(p, i).distanceTo(b.fromBufferAttribute(p, i + 2)));
    return max;
  };
  it('is many small sprays, not a few lumps', () => {
    expect(near.geometry.index!.count / 3).toBeGreaterThan(800);
    // the diagonal of a card, in tree heights: a lump of the old crown was 0.3 across, and solid
    expect(sizeOfCard(near.geometry)).toBeLessThan(0.17);
    expect(sizeOfCard(far.geometry)).toBeLessThan(0.24);
  });
  it('is cut out of a leaf map: light passes through it', () => {
    const m = near.material as THREE.MeshStandardMaterial;
    expect(m.alphaTest).toBeGreaterThan(0);
    const d = (m.map as THREE.DataTexture).image.data as Uint8Array;
    let holes = 0;
    for (let k = 3; k < d.length; k += 4) if (d[k] === 0) holes++;
    expect(holes / (d.length / 4)).toBeGreaterThan(0.2);
    expect(holes / (d.length / 4)).toBeLessThan(0.75);
  });
  it('leaves the lower trunk bare, an oval narrower than it is tall', () => {
    near.geometry.computeBoundingBox();
    const b = near.geometry.boundingBox!;
    expect(b.min.y).toBeGreaterThan(0.2);
    expect(b.max.y).toBeLessThan(1.1);
    expect(b.max.x - b.min.x).toBeLessThan(b.max.y - b.min.y);
  });
  it('takes no shadow of its own, so that it is lit as one mass', () => {
    expect(near.receiveShadow).toBe(false);
    expect(far.receiveShadow).toBe(false);
  });
  it('both meshes fall with the leaves', () => {
    site.update({ ...s0, winter: 0.95 }, 1 / 60, view());
    expect(near.visible).toBe(false);
    expect(far.visible).toBe(false);
    site.update({ ...s0, winter: 0.1 }, 1 / 60, view());
    expect(near.visible).toBe(true);
    expect(far.visible).toBe(true);
    site.update(s0, 1 / 60, view());
  });
});

describe('the gravel of the yard (D11)', () => {
  const t = gravelMap();
  const size = t.image.width;
  const d = t.image.data as Uint8Array;
  const lum = (i: number, j: number) => d[(((j + size) % size) * size + ((i + size) % size)) * 4 + 1];
  /** The correlation of the map with itself at a shift, in x. */
  const corr = (lag: number): number => {
    let m = 0;
    let n = 0;
    for (let j = 0; j < size; j += 2) for (let i = 0; i < size; i += 2) ((m += lum(i, j)), n++);
    m /= n;
    let a = 0;
    let b = 0;
    for (let j = 0; j < size; j += 2)
      for (let i = 0; i < size; i += 2) {
        a += (lum(i, j) - m) * (lum(i + lag, j) - m);
        b += (lum(i, j) - m) ** 2;
      }
    return a / b;
  };
  it('has no regular lattice of stones: past a stone, the map no longer knows itself', () => {
    for (let lag = 40; lag < size / 2; lag += 7) expect(Math.abs(corr(lag)), `lag ${lag}`).toBeLessThan(0.12);
  });
  it('tiles: its opposite edges look like its inside', () => {
    const step = (i: number): number => {
      let sum = 0;
      for (let j = 0; j < size; j++) sum += Math.abs(lum(i, j) - lum(i + 1, j));
      return sum;
    };
    let most = 0;
    for (let i = 8; i < size - 8; i += 3) most = Math.max(most, step(i));
    expect(step(size - 1)).toBeLessThan(most * 1.1);
  });
  it('has stones packed edge to edge: no pale disc on a dark ground', () => {
    const hist = new Array(8).fill(0);
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) hist[Math.floor(lum(i, j) / 32)]++;
    const dark = hist[0] + hist[1];
    expect(dark / (size * size)).toBeLessThan(0.3);
  });
});

describe('the glass of the solar field (D12)', () => {
  it('keeps no snow: a tilted dark panel sheds it', () => {
    const panels = site.registry.get('solar-field')!.meshes.find((m) => m.name === 'panels')!;
    expect((panels.material as THREE.Material).customProgramCacheKey()).not.toContain('snow');
  });
});

describe('« all labels » (D20)', () => {
  const over = (a: LabelBox, b: LabelBox) => a.x0 < b.x1 + 3 && b.x0 < a.x1 + 3 && a.y0 < b.y1 + 3 && b.y0 < a.y1 + 3;
  const clashes = (mod: SceneModule<SandState>, lang: 'fr' | 'en') => {
    const boxes = labelBoxes(mod, { w: 842, h: 678 }, lang, 96);
    let n = 0;
    boxes.forEach((a, i) => boxes.slice(i + 1).forEach((b) => (n += over(a, b) ? 1 : 0)));
    return n;
  };
  // before the kit folds a name with no room into its dot (`declutter`, N4): the page itself shows none over another
  const limits = [
    ['silo', silo, 0],
    ['pipe-cell', cell, 0],
    ['plant-room', plant, 0],
    ['site', site, 2],
  ] as const;
  for (const [name, mod, limit] of limits) {
    for (const lang of ['fr', 'en'] as const) {
      it(`${name}, ${lang}, at 1280: at most ${limit} over another`, () => {
        expect(clashes(mod, lang)).toBeLessThanOrEqual(limit);
      });
    }
  }
  it('a label stays on the part it names: its dot is on or just off its box', () => {
    for (const [, mod] of all) {
      for (const h of mod.hotspots) {
        if (h.anchor.name.startsWith('scale-')) continue;
        const reg = mod.registry as FramedRegistry;
        // the soapstone's tray is at the edge of a phone's view: its long name starts to its left, on the block's plinth
        const margin = h.partId === 'crushed-soapstone' ? 1.6 : mod === site ? 6 : 0.75;
        const b = reg.wholeBounds(h.partId).clone().expandByScalar(margin);
        const p = h.anchor.getWorldPosition(new THREE.Vector3());
        expect(b.containsPoint(p), `${mod.id} ${h.partId}`).toBe(true);
      }
    }
  });
});

describe('the small things of the room', () => {
  it('the air is hot from the resistors on: ahead of them it is still the return (D26)', () => {
    const P = plant.equipment.paths;
    // the kit's dots take the path from the resistors on; the blower's outlet is on the return's colour
    const hot = (plant.flows.chargeHot as unknown as { paths: { path: { points: THREE.Vector3[] } }[] }).paths[0];
    const back = (plant.flows.chargeBack as unknown as { paths: { path: { points: THREE.Vector3[] } }[] }).paths[0];
    expect(hot.path.points[0].z).toBeCloseTo(PLANT.bank.z0, 3);
    const end = back.path.points[back.path.points.length - 1];
    expect(end.z).toBeCloseTo(PLANT.bank.z0, 3);
    expect(P.chargeHot[0].z).toBeCloseTo(PLANT.chargeBlower.z, 3);
  });
  it('X-ray has something to clear with nothing selected (D36)', () => {
    const shell = WORLD['plant-room'].xrayShell;
    expect(shell('hot-air-duct') && shell('cold-air-duct')).toBe(true);
    expect(shell('air-water-exchanger')).toBe(false);
  });
  it('a ghost is the mass of a part, not each of its pieces: fewer layers over the floor (D36)', () => {
    const reg = plant.registry;
    reg.setDisplay('charge-blower', 'ghost');
    const meshes = reg.get('charge-blower')!.meshes;
    expect(meshes.filter((m) => m.visible).length).toBe(1);
    reg.setDisplay('charge-blower', 'solid');
    expect(meshes.every((m) => m.visible)).toBe(true);
  });
  it('the coupling of a blower reads from any side: marks all round it (D39)', () => {
    const rotor = plant.equipment.chargeBlower.rotor;
    const paint = rotor.children
      .map((c) => c as THREE.Mesh)
      .filter((m) => m.isMesh && (m.material as THREE.MeshStandardMaterial).color?.getHex() !== undefined);
    const marks = paint.map((m) => {
      m.geometry.computeBoundingBox();
      return m.geometry.boundingBox!;
    });
    // something on the rotor stands proud of the coupling above and below its axis
    expect(marks.some((b) => b.max.y > PLANT.blower.couplingR && b.min.y < -PLANT.blower.couplingR * 0.4)).toBe(true);
  });
  it('the dampers rise with their ducts, within a metre, and come forwards (D47)', () => {
    for (const id of ['charge-damper', 'discharge-damper'] as const) {
      expect(Math.abs(ROOM_EXPLODE[id][1] - ROOM_EXPLODE['hot-air-duct'][1])).toBeLessThan(1);
      expect(ROOM_EXPLODE[id][2]).toBeGreaterThan(1);
    }
  });
});

function homeDistance(mod: SceneModule<SandState>, cam: THREE.PerspectiveCamera): number {
  if (mod.id === 'site') return cam.position.distanceTo(mod.home.target);
  const box = new THREE.Box3();
  for (const p of mod.registry.parts.values()) box.union(mod.registry.bounds(p.id));
  return cam.position.distanceTo(box.getCenter(new THREE.Vector3()));
}
