import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { LEVEL, RISERS, SILO, SITE, siteFromSilo } from '../dims';
import { meshBox, stateWith, view } from '../test-utils';
import { createSiteScene } from './scene';
import { HELD_HOUR, sunDirection } from './sky';
import { LEAVES, SNOW, leavesOf, snowOf } from './snow';
import { HOUSES, PADS, TRENCH_SEGMENTS, polyDistance, terrainHeight } from './terrain';
import { forestMask, planVegetation, spotOk } from './vegetation';

// The village, by script: every body rests on the land to within a few millimetres, the line reaches its insulators and the transformer, the trench starts at the foot of the pipes and ends in the
// cellar's wall, the trees stand on the land and keep off the works, the snow follows `winter`, the sun holds its hour at a fast clock, and the proof that the land has its holes where the trench is.

describe('the site', () => {
  const mod = createSiteScene();
  const s0 = stateWith();
  mod.update(s0, 1 / 60, view());
  mod.scene.updateMatrixWorld(true);
  const reg = mod.registry;
  const box = (id: string) => meshBox(reg.get(id)!.object);

  describe('the land', () => {
    it('is flat to the millimetre under the plot, the buildings and their pads', () => {
      for (const p of PADS) {
        for (const [x, z] of [
          [p.x0, p.z0],
          [p.x1, p.z0],
          [p.x0, p.z1],
          [p.x1, p.z1],
          [(p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2],
        ]) {
          expect(Math.abs(terrainHeight(x, z) - p.y), `${x},${z}`).toBeLessThan(0.005);
        }
      }
    });
    it('rises to a ridge at the far north, for the wind farm', () => {
      expect(terrainHeight(100, -1100)).toBeGreaterThan(terrainHeight(100, -200) + 20);
    });
  });

  describe('every body rests on the land (5 mm)', () => {
    it('the slab of the silo, at y = 0, on flat land', () => {
      const b = meshBox(reg.get('silo-exterior')!.object);
      expect(b.min.y).toBeCloseTo(0, 3);
      expect(terrainHeight(SITE.silo.x, SITE.silo.z)).toBeCloseTo(0, 3);
      expect(b.max.y).toBeCloseTo(SILO.totalHeight, 3);
    });
    it('the annex, the transformer, the school, the boiler plant and its stack', () => {
      for (const id of ['electrical-annex', 'pad-transformer', 'village-school', 'chip-boiler-plant', 'boiler-stack']) {
        const b = box(id);
        const x = (b.min.x + b.max.x) / 2;
        const z = (b.min.z + b.max.z) / 2;
        expect(Math.abs(b.min.y - terrainHeight(x, z)), id).toBeLessThan(0.08);
        expect(b.min.y, id).toBeLessThanOrEqual(0.005);
      }
    });
    it('the houses of the village', () => {
      const houses = mod.scenery()[2];
      const b = meshBox(houses);
      expect(b.min.y).toBeLessThanOrEqual(0.01);
      for (const h of HOUSES) expect(Math.abs(terrainHeight(h.x, h.z)), `${h.x},${h.z}`).toBeLessThan(0.02);
    });
    it('the wind turbines stand on the ridge', () => {
      for (const f of mod.wind.feet) expect(Math.abs(f.y - terrainHeight(f.x, f.z))).toBeLessThan(1e-6);
    });
    it('the solar field, its posts in the ground', () => {
      const b = box('solar-field');
      expect(b.min.y).toBeLessThan(0);
      expect(b.max.y).toBeLessThan(3.5);
    });
  });

  describe('the line', () => {
    const line = mod.line;
    it('runs on its poles, every wire on an insulator of each pole', () => {
      expect(line.insulators.length).toBe(SITE.line.poles.length);
      for (const ph of line.phases) expect(ph.length).toBeGreaterThan(20);
      line.insulators.forEach((tips, i) => {
        for (let p = 0; p < 3; p++) {
          const near = line.phases[p].reduce((best, q) => Math.min(best, q.distanceTo(tips[p])), 99);
          expect(near, `pole ${i} phase ${p}`).toBeLessThan(0.003);
        }
      });
    });
    it('sags between its poles, and stays over the ground', () => {
      const ph = line.phases[1];
      for (const q of ph) expect(q.y).toBeGreaterThan(terrainHeight(q.x, q.z) + 5);
    });
    it("drops from the first pole on to the transformer's three bushings", () => {
      const t = box('pad-transformer');
      expect(line.drops.length).toBe(3);
      for (const d of line.drops) {
        expect(d.to.y).toBeGreaterThan(t.max.y - 0.3);
        expect(d.to.x).toBeGreaterThan(t.min.x);
        expect(d.to.x).toBeLessThan(t.max.x);
        expect(d.from.y).toBeGreaterThan(SITE.line.poleH - 1);
      }
    });
  });

  describe("the plant's connections", () => {
    it("the stub of the cable riser reaches the annex's wall, at the slab's edge (3 mm)", () => {
      const foot = siteFromSilo(mod.risers.cableFoot.x, mod.risers.cableFoot.y, mod.risers.cableFoot.z);
      const bx = box('electrical-annex');
      // the point lies on the annex's box
      expect(foot[0]).toBeGreaterThan(bx.min.x - 0.01);
      expect(foot[0]).toBeLessThan(bx.max.x + 0.01);
      expect(foot[2]).toBeGreaterThan(bx.min.z - 0.01);
      expect(foot[2]).toBeLessThan(bx.max.z + 0.01);
    });
    it("the trench's pipes start on the feet of the riser (3 mm)", () => {
      const f = mod.risers.waterFoot;
      const sup = siteFromSilo(f.supply.x, f.supply.y, f.supply.z);
      const ret = siteFromSilo(f.ret.x, f.ret.y, f.ret.z);
      expect(mod.trench.start.supply.distanceTo(new THREE.Vector3(...sup))).toBeLessThan(0.003);
      expect(mod.trench.start.ret.distanceTo(new THREE.Vector3(...ret))).toBeLessThan(0.003);
      expect(Math.abs(f.supply.y - mod.trench.pipeY)).toBeLessThan(0.003);
    });
    it("the trench is open at the riser's feet: its segment passes through them", () => {
      const f = mod.trench.start.supply;
      expect(polyDistance(f.x, f.z, SITE.trench.path)).toBeLessThan(SITE.trench.width / 2);
    });
    it("the trench ends in the cellar's wall", () => {
      const end = mod.trench.end.supply;
      expect(end.x).toBeGreaterThan(SITE.cellar.x0);
      expect(end.x).toBeLessThanOrEqual(SITE.cellar.x1 + 0.7);
      expect(end.z).toBeGreaterThan(SITE.cellar.z0);
      expect(end.z).toBeLessThan(SITE.cellar.z1);
    });
    it('its floor is under the ground, the pipes on the sand', () => {
      expect(mod.trench.floorY).toBe(-SITE.trench.depth);
      expect(mod.trench.pipeY - SITE.trench.pipeR).toBeCloseTo(mod.trench.floorY + SITE.trench.sand, 6);
      expect(RISERS.bottomY).toBeCloseTo(mod.trench.pipeY, 6);
    });
    it('the two spurs end on the walls they feed (3 mm)', () => {
      const school = SITE.school;
      expect(Math.abs(SITE.trench.schoolSpur[1][1] - (school.z + school.width / 2))).toBeLessThan(0.003);
      expect(Math.abs(SITE.trench.schoolSpur[1][0] - school.x)).toBeLessThan(school.length / 2);
      const b = SITE.boiler;
      expect(Math.abs(SITE.trench.boilerSpur[1][1] - (b.z + b.width / 2))).toBeLessThan(0.003);
      expect(Math.abs(SITE.trench.boilerSpur[1][0] - b.x)).toBeLessThan(b.length / 2);
    });
    it('the hole in the land follows the same lines', () => {
      expect(TRENCH_SEGMENTS.length).toBe(SITE.trench.path.length - 1 + 2);
      expect(TRENCH_SEGMENTS[0].x).toBe(SITE.trench.path[0][0]);
    });
    it('the flue reaches the hall and the stack', () => {
      const b = box('boiler-stack');
      expect(b.min.y).toBeLessThanOrEqual(0.005);
      expect(b.max.y).toBeGreaterThan(SITE.boiler.stackH - 0.1);
    });
  });

  describe('the trees', () => {
    const plan = planVegetation();
    it('stand on the land, off the works', () => {
      for (const t of [...plan.spruces, ...plan.birches, ...plan.shrubs]) {
        expect(Math.abs(t.y - terrainHeight(t.x, t.z)), `${t.x},${t.z}`).toBeLessThan(1e-6);
        expect(spotOk(t.x, t.z, 1), `${t.x},${t.z}`).toBe(true);
      }
    });
    it('make a forest at the back, a clearing at the village', () => {
      expect(forestMask(0, -140)).toBeGreaterThan(0.5);
      expect(forestMask(-20, 8)).toBe(0);
      expect(plan.spruces.length).toBeGreaterThan(300);
      expect(plan.forest.length).toBeGreaterThan(1500);
      expect(plan.birches.length).toBeGreaterThan(60);
    });
    it('are deterministic', () => {
      expect(planVegetation().spruces[17]).toEqual(plan.spruces[17]);
    });
  });

  describe('the season and the sky', () => {
    it('snows with `winter`: none in summer, all of it in the depth of winter', () => {
      mod.update({ ...s0, winter: 0.2 }, 1 / 60, view());
      expect(SNOW.value).toBe(0);
      expect(LEAVES.value).toBe(1);
      mod.update({ ...s0, winter: 0.95 }, 1 / 60, view());
      expect(SNOW.value).toBe(1);
      expect(LEAVES.value).toBe(0);
      expect(snowOf(0.74)).toBeGreaterThan(0.3);
      expect(leavesOf(0.6)).toBeGreaterThan(0.1);
      mod.update(s0, 1 / 60, view());
    });
    it("hides the birches' crowns once they are bare", () => {
      mod.update({ ...s0, winter: 0.95 }, 1 / 60, view());
      expect(mod.vegetation.meshes.find((m) => m.name === 'birch-leaves')!.visible).toBe(false);
      mod.update({ ...s0, winter: 0.1 }, 1 / 60, view());
      expect(mod.vegetation.meshes.find((m) => m.name === 'birch-leaves')!.visible).toBe(true);
      mod.update(s0, 1 / 60, view());
    });
    it('holds the sun at a fast clock: a day does not strobe past', () => {
      const m = createSiteScene();
      let t = 0;
      const a: number[] = [];
      for (let i = 0; i < 240; i++) {
        t += 3600 / 60;
        m.update({ ...s0, simTime: t, hour: (t / 3600) % 24 }, 1 / 60, view());
        a.push(m.sun.intensity);
      }
      expect(m.drawn.held).toBe(true);
      expect(Math.max(...a) - Math.min(...a)).toBeLessThan(0.3);
      expect(Math.abs(m.drawn.sunHour - HELD_HOUR)).toBeLessThan(0.01);
    });
    it('follows the daylight at a slow clock, never the night', () => {
      const m = createSiteScene();
      let t = 0;
      for (let i = 0; i < 300; i++) {
        t += 1 / 60;
        m.update({ ...s0, simTime: t, hour: 3 }, 1 / 60, view());
      }
      expect(m.drawn.held).toBe(false);
      expect(m.drawn.sunHour).toBeGreaterThan(9);
      expect(m.sun.intensity).toBeGreaterThan(1);
    });
    it('takes the sun from the south at noon, low in winter at this latitude', () => {
      const noon = sunDirection(13.3, 355);
      expect(noon.z).toBeGreaterThan(0.9);
      expect(noon.y).toBeLessThan(0.15);
      expect(sunDirection(13.3, 172).y).toBeGreaterThan(0.75);
    });
  });

  describe('the flows and the rest of what moves', () => {
    it('sends the water and the current only when the model does', () => {
      mod.update({ ...s0, heater: 0, waterFlow: 0 }, 1 / 60, view({ schematic: true }));
      expect(mod.flows.current.object.visible).toBe(false);
      expect(mod.flows.hot.object.visible).toBe(false);
      mod.update({ ...s0, heater: 5e5, waterFlow: 3 }, 1 / 60, view({ schematic: true }));
      expect(mod.flows.current.object.visible).toBe(true);
      expect(mod.flows.hot.object.visible).toBe(true);
      mod.update(s0, 1 / 60, view());
    });
    it('smokes from the stack only while the boiler burns', () => {
      mod.update({ ...s0, boiler: 0 }, 1 / 60, view());
      expect(mod.smoke.visible).toBe(false);
      mod.update({ ...s0, boiler: 3e5 }, 1 / 60, view());
      expect(mod.smoke.visible).toBe(true);
      mod.update(s0, 1 / 60, view());
    });
    it('turns its rotors, slowly enough to read', () => {
      const r = mod.wind.rotors[0];
      const a = r.rotation.z;
      mod.update({ ...s0, price: 10 }, 0.1, view());
      const da = Math.abs(r.rotation.z - a) / 0.1;
      expect(da).toBeGreaterThan(0.1);
      expect(da).toBeLessThan(1);
    });
  });

  it('the yard holds the silo, the annex and the transformer', () => {
    const Y = SITE.yard;
    const s = box('silo-exterior');
    expect(s.min.x).toBeGreaterThan(Y.x0 - 0.1);
    expect(s.max.x).toBeLessThan(Y.x1 + 0.1);
    expect(LEVEL.apex).toBe(13);
    const t = box('pad-transformer');
    expect(t.max.x).toBeLessThan(Y.x1);
  });
});
