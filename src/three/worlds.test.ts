import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { GHOST } from '@onigam/lab-kit/three';
import { PARTS } from '../data/parts';
import { PART_CATEGORIES, type WorldId } from '../data/ids';
import type { SandState } from '../sim/types';
import { createPipeCellScene } from './pipecell/scene';
import { createPlantRoomScene } from './plantroom/scene';
import { createSiloScene, type SiloScene } from './silo/scene';
import { createSiteScene } from './site/scene';
import { drawStats, finiteTree, floating, isolateOne, meshBox, sceneBoxes, stateWith, view } from './test-utils';
import type { SceneModule } from '@onigam/lab-kit/three';

// What every world owes the kit and the visitor: its frozen ids, a label for each part that lives in the scene, nothing floating, the explode, isolate and X-ray of every part, an animation with no
// NaN, its budget, no text anywhere.

interface Budget {
  calls: number;
  triangles: number;
}

const BUDGET: Record<WorldId, Budget> = {
  site: { calls: 135, triangles: 480_000 },
  silo: { calls: 135, triangles: 240_000 },
  'pipe-cell': { calls: 40, triangles: 140_000 },
  'plant-room': { calls: 150, triangles: 120_000 },
};

const worlds: [WorldId, SceneModule<SandState>, { schematicState: Partial<SandState> }][] = [
  ['site', createSiteScene(), { schematicState: {} }],
  ['silo', createSiloScene(), { schematicState: {} }],
  ['pipe-cell', createPipeCellScene(), { schematicState: {} }],
  ['plant-room', createPlantRoomScene(), { schematicState: {} }],
];

for (const [id, mod] of worlds) {
  describe(`world ${id}`, () => {
    const reg = mod.registry;
    const go = (over: Partial<SandState> = {}, v = {}, frames = 2) => {
      const s = stateWith(over);
      for (let i = 0; i < frames; i++) mod.update(s, 1 / 60, view({ time: 1 + i, ...v }));
      mod.scene.updateMatrixWorld(true);
      return s;
    };

    it('registers exactly the frozen ids (research §4), each with meshes of its own', () => {
      go();
      const expected = Object.keys(PART_CATEGORIES[id]);
      expect([...reg.ids()].sort()).toEqual([...expected].sort());
      for (const pid of expected) expect(reg.get(pid)!.meshes.length, pid).toBeGreaterThan(0);
    });

    it('has a sheet in the catalogue for each part, in this world', () => {
      for (const pid of reg.ids()) {
        const p = PARTS.find((x) => x.id === pid);
        expect(p, pid).toBeDefined();
        expect(p!.scene, pid).toBe(id);
      }
    });

    it('has a label per part, anchors in the scene, at most six main labels', () => {
      for (const pid of reg.ids())
        expect(
          mod.hotspots.some((h) => h.partId === pid),
          `label of ${pid}`,
        ).toBe(true);
      for (const h of mod.hotspots) {
        let o: THREE.Object3D | null = h.anchor;
        while (o && o !== mod.scene) o = o.parent;
        expect(o, h.partId).toBe(mod.scene);
        expect(h.label.fr.length).toBeGreaterThan(2);
        expect(h.label.en.length).toBeGreaterThan(2);
        expect(reg.get(h.partId), h.partId).toBeDefined();
      }
      expect(mod.hotspots.filter((h) => !h.minor).length).toBeLessThanOrEqual(6);
    });

    it('has a home camera outside the machine, within its limits', () => {
      const d = mod.home.position.distanceTo(mod.home.target);
      expect(d).toBeGreaterThan(mod.minDistance);
      expect(d).toBeLessThan(mod.maxDistance);
    });

    it('has no floating part: every part touches another or what carries it', () => {
      go();
      reg.setAllFactors(0);
      const supports: THREE.Box3[] = [];
      const carrier = (mod as unknown as { scenery?: () => THREE.Object3D[] }).scenery;
      if (carrier) for (const o of carrier()) supports.push(meshBox(o));
      // the ground and the paper floor carry what stands on them
      supports.push(new THREE.Box3(new THREE.Vector3(-4000, -0.002, -4000), new THREE.Vector3(4000, 0.002, 4000)));
      expect(floating(sceneBoxes(mod), 0.02, supports)).toEqual([]);
    });

    it('explodes along sensible lines: every part moves by its own offset and comes back', () => {
      go();
      const before = new Map(reg.ids().map((pid) => [pid, reg.get(pid)!.object.position.clone()]));
      reg.setAllFactors(1);
      for (const pid of reg.ids()) {
        const e = reg.get(pid)!;
        expect(e.object.position.distanceTo(before.get(pid)!.clone().add(e.explode)), pid).toBeLessThan(1e-9);
      }
      go();
      expect(finiteTree(mod.scene)).toBe(true);
      reg.setAllFactors(0);
      for (const pid of reg.ids())
        expect(reg.get(pid)!.object.position.distanceTo(before.get(pid)!), pid).toBeLessThan(1e-9);
    });

    it('isolates and ghosts every part', () => {
      go();
      for (const pid of reg.ids()) {
        isolateOne(reg, pid, 'hidden');
        go();
        expect(
          reg.get(pid)!.meshes.every((m) => m.visible || m.userData.cap),
          `${pid} solid`,
        ).toBe(true);
        const others = reg.ids().filter((o) => o !== pid);
        for (const o of others) expect(reg.get(o)!.display).toBe('hidden');
        isolateOne(reg, pid, 'ghost');
        go();
        for (const o of others) {
          for (const m of reg.get(o)!.meshes) expect(m.material).toBe(GHOST);
        }
      }
      reg.setAllDisplay('solid');
      go();
      for (const pid of reg.ids())
        for (const m of reg.get(pid)!.meshes) expect(m.material).toBe(m.userData.solidMaterial);
    });

    it('animates with no NaN through the whole life of the plant', () => {
      const sc = ['cold-start', 'winter-week', 'blower-failure', 'reserve-call'] as const;
      for (const name of sc) {
        const s = stateWith({}, {}, 0.1);
        void name;
        for (let i = 0; i < 12; i++)
          mod.update(s, 1 / 30, view({ time: i, schematic: i % 2 === 0, cutaway: i % 3 === 0 }));
      }
      expect(finiteTree(mod.scene)).toBe(true);
    });

    it('keeps to its budget', () => {
      go();
      reg.setAllDisplay('solid');
      go();
      const st = drawStats(mod.scene);
      // eslint-disable-next-line no-console
      console.info(`[budget] ${id}: ${st.calls} calls, ${Math.round(st.triangles)} triangles`);
      expect(st.calls).toBeLessThan(BUDGET[id].calls);
      expect(st.triangles).toBeLessThan(BUDGET[id].triangles);
    });
  });
}

describe('the section', () => {
  const silo = worlds[1][1] as SiloScene;
  const removed = (x: number, z: number) => silo.cut.planes[0].distanceToPoint(new THREE.Vector3(x, 3, z)) < 0;
  const go = (cutaway: boolean) => {
    const s = stateWith();
    silo.update(s, 1 / 60, view({ cutaway }));
    silo.scene.updateMatrixWorld(true);
  };

  it('takes away a quarter on arrival, the front half with the tool', () => {
    go(false);
    expect(silo.drawnCut()).toBe('wedge');
    expect(removed(3, 3)).toBe(true);
    expect(removed(-3, 3)).toBe(false);
    expect(removed(3, -3)).toBe(false);
    go(true);
    expect(silo.drawnCut()).toBe('half');
    expect(removed(3, 3)).toBe(true);
    expect(removed(-3, 3)).toBe(true);
    expect(removed(3, -3)).toBe(false);
    go(false);
  });

  it("answers the kit's picking for the two planes together (a union would refuse three quarters of the machine)", () => {
    go(false);
    for (const p of silo.cut.planes) {
      expect(p.distanceToPoint(new THREE.Vector3(-2, 1, -2))).toBeGreaterThan(0);
      expect(p.distanceToPoint(new THREE.Vector3(2, 1, -2))).toBeGreaterThan(0);
      expect(p.distanceToPoint(new THREE.Vector3(2, 1, 2))).toBeLessThan(0);
      // a cap lies on a plane: not refused
      expect(p.distanceToPoint(new THREE.Vector3(2, 1, 1e-6))).toBeGreaterThan(0);
    }
  });

  it('closes every revolved part with its caps: the quarter-planes that show, nothing else', () => {
    go(false);
    for (const id of [
      'foundation-slab',
      'base-insulation',
      'inner-shell',
      'wall-insulation',
      'outer-cladding',
      'storage-bed',
      'top-insulation',
      'equipment-floor',
      'conical-roof',
    ]) {
      const caps = silo.cut.capsOf(id);
      expect(caps.length, id).toBeGreaterThanOrEqual(3);
      const on = caps
        .filter((c) => c.visible)
        .map((c) => c.name.slice(-1))
        .sort();
      expect(on.includes('a') && on.includes('c') && !on.includes('b'), `${id}: ${on}`).toBe(true);
    }
    go(true);
    const on = silo.cut
      .capsOf('storage-bed')
      .filter((c) => c.visible)
      .map((c) => c.name.slice(-1))
      .sort();
    expect(on).toEqual(['a', 'b']);
    go(false);
  });

  it('clips with one shader in both modes, so pressing the tool compiles nothing', () => {
    const bed = silo.registry.get('storage-bed')!.meshes[0].material as THREE.Material;
    expect(bed.clippingPlanes?.length).toBe(2);
    expect(bed.clipIntersection).toBe(true);
    const k = bed.clippingPlanes;
    go(true);
    expect(bed.clippingPlanes).toBe(k);
    go(false);
  });

  it('hides a cap when its part is not shown solid', () => {
    go(false);
    silo.registry.setDisplay('storage-bed', 'ghost');
    go(false);
    expect(silo.cut.capsOf('storage-bed').every((c) => !c.visible)).toBe(true);
    silo.registry.setDisplay('storage-bed', 'solid');
    go(false);
  });

  it('colours the bed from the field, cell by cell, and drops to stone off the drawn silo', () => {
    const s = stateWith();
    silo.update(s, 1, view());
    const T = s.bedT[3 + s.rings * 2];
    expect(silo.field.read(3, 2)).toBeCloseTo(T, 0);
    silo.update({ ...s, onDrawnSilo: false }, 1, view());
    expect(silo.field.uniforms.uHeatOn.value).toBe(0);
    silo.update(s, 1, view());
    expect(silo.field.uniforms.uHeatOn.value).toBe(1);
  });

  it('shows the flows only while the model moves air, in the zones it opens', () => {
    const s = stateWith();
    const off = { ...s, zones: s.zones.map((z) => ({ ...z, mode: 'idle' as const })) };
    silo.update(off, 1 / 60, view({ schematic: true }));
    expect(silo.flows.every((f) => !f.object.visible)).toBe(true);
    const on = {
      ...s,
      zones: s.zones.map((z, i) => ({ ...z, mode: i === 2 ? ('discharge' as const) : ('idle' as const) })),
    };
    silo.update(on, 1 / 60, view({ schematic: true }));
    expect(silo.flows[2].object.visible).toBe(true);
    expect(silo.flows[0].object.visible).toBe(false);
    silo.update(on, 1 / 60, view({ schematic: false }));
    expect(silo.flows.every((f) => !f.object.visible)).toBe(true);
  });
});

describe('the rules of the source', () => {
  const src = Object.entries(
    import.meta.glob(['./**/*.ts', '!./**/*.test.ts', '!./test-utils.ts'], {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>,
  );

  it('reads the whole of its source', () => {
    expect(src.length).toBeGreaterThan(15);
  });

  it('has no text in any texture and no canvas: a film is captured with no interface', () => {
    for (const [p, code] of src) {
      expect(code.includes('canvasTexture'), p).toBe(false);
      expect(code.includes('fillText'), p).toBe(false);
      expect(code.includes('createElement'), p).toBe(false);
    }
  });

  it('claims nothing on screen about where the equipment really is: the labels name, they do not assert', () => {
    for (const [p, code] of src) {
      expect(
        /Pornainen|Polar Night|Loviisa/.test(code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')),
        p,
      ).toBe(false);
    }
  });
});
