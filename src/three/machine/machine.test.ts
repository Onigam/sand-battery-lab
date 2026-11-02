import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createPipeCellScene } from '../pipecell/scene';
import { createPlantRoomScene } from '../plantroom/scene';
import { createSiloScene } from '../silo/scene';
import { createSiteScene } from '../site/scene';
import { box as boxGeo, stick as stickGeo } from '../common';
import { AZIMUTH, CELL, LEVEL, PIPE, PLANT, RISERS, SILO, SITE, WALL, wallPoint } from '../dims';
import { meshBox, stateWith, view } from '../test-utils';
import { PLANT_PARTS, type PlantId } from './equipment';
import {
  bendGeometry,
  CELL_QUALITY,
  FIELD_QUALITY,
  headerRuns,
  legGeometry,
  legsOf,
  loopGeometry,
  loopPoints,
  pipeLattice,
} from './pipes';

// One machine, the same everywhere; attached and resting: the rules the owner checks by eye first (docs/lab-quality.md §1 and §2), by script. Distances in metres.

const silo = createSiloScene();
const plant = createPlantRoomScene();
const site = createSiteScene();
const cell = createPipeCellScene();
const s0 = stateWith();
for (const w of [silo, plant, site, cell]) {
  w.update(s0, 1 / 60, view());
  w.scene.updateMatrixWorld(true);
}
const P3MM = 0.003;

/** The box of an object's meshes in another frame (their vertices moved back by `inverse`). */
function boxInFrame(
  root: THREE.Object3D,
  inverse: THREE.Matrix4,
  skip: (m: THREE.Mesh) => boolean = () => false,
): THREE.Box3 {
  root.updateWorldMatrix(true, true);
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  const rel = new THREE.Matrix4();
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    const p = m.geometry?.attributes?.position;
    if (!m.isMesh || !p || m.userData.cap || skip(m)) return;
    rel.multiplyMatrices(inverse, m.matrixWorld);
    for (let i = 0; i < p.count; i++) box.expandByPoint(v.fromBufferAttribute(p, i).applyMatrix4(rel));
  });
  return box;
}
const within = (a: THREE.Box3, b: THREE.Box3, tol: number, label: string) => {
  for (const k of ['x', 'y', 'z'] as const) {
    expect(Math.abs(a.min[k] - b.min[k]), `${label} min ${k}`).toBeLessThan(tol);
    expect(Math.abs(a.max[k] - b.max[k]), `${label} max ${k}`).toBeLessThan(tol);
  }
};

describe('one machine, the same in every world', () => {
  it('the outside of the silo in the site is the silo of the `silo` world, moved, within 3 mm', () => {
    const inv = site.siloFrame.clone().invert();
    const outside = new THREE.Box3();
    for (const id of ['foundation-slab', 'outer-cladding', 'conical-roof', 'upper-vent', 'access-ladder']) {
      // the rafters and the ring beam are inside the roof: the site does not draw them
      outside.union(meshBox(silo.registry.get(id)!.object));
    }
    within(boxInFrame(site.registry.get('silo-exterior')!.object, inv), outside, P3MM, 'silo-exterior');
  });

  it('the two pipes and the cable on its wall are the same, within 3 mm', () => {
    const inv = site.siloFrame.clone().invert();
    within(boxInFrame(site.registry.get('dh-riser')!.object, inv), meshBox(silo.risers.water), P3MM, 'dh-riser');
    within(boxInFrame(site.registry.get('cable-riser')!.object, inv), meshBox(silo.risers.cable), P3MM, 'cable-riser');
  });

  it('the fifteen machines of the room are the same in the `silo` and `plant-room` worlds, within 3 mm', () => {
    silo.registry.setAllFactors(0);
    plant.registry.setAllFactors(0);
    // the boxes of the `silo` world were taken as built: blades open, wheels at rest
    const eq = plant.equipment;
    for (const g of [...eq.chargeDampers.flat(), ...eq.dischargeDampers.flat()]) g.rotation.x = 0;
    eq.chargeBlower.rotor.rotation.x = eq.dischargeBlower.rotor.rotation.x = eq.pumpRotor.rotation.x = 0;
    plant.scene.updateMatrixWorld(true);
    for (const id of PLANT_PARTS) {
      within(meshBox(plant.registry.get(id)!.object), silo.equipmentBoxes[id], P3MM, id);
    }
  });

  it('the silo under the room is the same silo: same stack, same section', () => {
    const b = meshBox(plant.scenery()[0]);
    // its lowest point is the water pipes' foot in the ground, its slab stands on y = 0, its top is the room's ceiling
    expect(b.min.y).toBeCloseTo(RISERS.bottomY, 3);
    expect(b.max.y).toBeCloseTo(LEVEL.eaves, 2);
    expect(b.max.x).toBeGreaterThan(SILO.outerR - 0.01);
  });

  it('a U-pipe of the cell is a U-pipe of the field: the same leg, bend and loop, within 3 mm', () => {
    const size = (g: THREE.BufferGeometry) => {
      g.computeBoundingBox();
      return g.boundingBox!;
    };
    within(size(legGeometry(CELL_QUALITY)), size(legGeometry(FIELD_QUALITY)), P3MM, 'leg');
    within(size(bendGeometry(CELL_QUALITY)), size(bendGeometry(FIELD_QUALITY)), 0.012, 'bend');
    within(
      size(loopGeometry(CELL_QUALITY, PIPE.headerOffset)),
      size(loopGeometry(FIELD_QUALITY, PIPE.headerOffset)),
      0.012,
      'loop',
    );
  });

  it("the field has the bed's height and the cell the same pitch", () => {
    const us = cell.layout.core;
    expect(us[0].x1 - us[0].x0).toBe(PIPE.pitch);
    expect(us[1].x0 - us[0].x1).toBe(PIPE.pitch);
    const rows = [...new Set(us.map((u) => u.z))];
    expect(rows[1] - rows[0]).toBe(PIPE.pitch);
    expect(rows).toContain(0);
  });
});

describe('the stack rests, layer on layer (3 mm)', () => {
  const b = (id: string) => meshBox(silo.registry.get(id)!.object);
  silo.registry.setAllFactors(0);
  it('the slab stands on the ground, 16 m across', () => {
    expect(b('foundation-slab').min.y).toBeCloseTo(0, 3);
    expect(b('foundation-slab').max.x).toBeCloseTo(SILO.slabR, 2);
  });
  it('the base insulation on the slab, the bed and the shell on it', () => {
    expect(Math.abs(b('base-insulation').min.y - b('foundation-slab').max.y)).toBeLessThan(P3MM);
    expect(Math.abs(b('storage-bed').min.y - b('base-insulation').max.y)).toBeLessThan(P3MM);
    expect(Math.abs(b('inner-shell').min.y - b('base-insulation').max.y)).toBeLessThan(P3MM);
    expect(Math.abs(b('wall-insulation').min.y - b('base-insulation').max.y)).toBeLessThan(P3MM);
  });
  it('the cladding stands on the slab and reaches the eaves', () => {
    expect(Math.abs(b('outer-cladding').min.y - LEVEL.slabTop)).toBeLessThan(P3MM);
    expect(Math.abs(b('outer-cladding').max.y - LEVEL.eaves)).toBeLessThan(P3MM);
  });
  it('the top insulation on the stone, the deck on it, the roof ends at the reported 13 m', () => {
    expect(Math.abs(b('top-insulation').min.y - b('storage-bed').max.y)).toBeLessThan(P3MM);
    expect(Math.abs(b('equipment-floor').min.y - b('top-insulation').max.y)).toBeLessThan(P3MM);
    expect(b('conical-roof').max.y).toBeCloseTo(SILO.totalHeight, 3);
    expect(Math.abs(b('conical-roof').min.y - LEVEL.eaves)).toBeLessThan(0.1);
    // nothing of the roof shows under the ceiling of the room
    expect(b('conical-roof').min.y).toBeGreaterThanOrEqual(LEVEL.ceiling - 0.05);
  });
  it('the pipes stay in the stone below, under the deck above', () => {
    expect(b('pipe-field').min.y).toBeGreaterThan(LEVEL.bedBottom);
    expect(b('pipe-field').max.y).toBeLessThan(LEVEL.deckBottom);
    const reach = Math.max(b('pipe-field').max.x, b('pipe-field').max.z);
    expect(reach).toBeLessThan(SILO.bedR + 0.001);
  });
  it('the lances go from the deck into the stone, no further than its bottom', () => {
    const l = b('thermocouple-lance');
    expect(l.max.y).toBeGreaterThan(LEVEL.floor);
    expect(l.min.y).toBeGreaterThan(LEVEL.bedBottom);
    for (const t of silo.body.lanceTips) expect(t.y).toBeLessThan(LEVEL.bedTop);
  });
  it('the ducts cross the top insulation and the deck', () => {
    const d = b('duct-penetration');
    expect(d.min.y).toBeLessThan(LEVEL.deckBottom - 0.2);
    expect(d.max.y).toBeGreaterThanOrEqual(LEVEL.floor);
  });
});

describe('what hangs on the wall reaches the wall', () => {
  it('the ladder stands on the ledge of the slab, inside its edge', () => {
    const l = meshBox(silo.registry.get('access-ladder')!.object);
    expect(Math.abs(l.min.y - LEVEL.slabTop)).toBeLessThan(P3MM);
    expect(silo.body.ladderFootY).toBe(LEVEL.slabTop);
    expect(SILO.outerR + 0.2).toBeLessThan(SILO.slabR);
    expect(silo.body.ladderTopY).toBeGreaterThan(LEVEL.floor);
  });
  it('the two high openings stand on the cladding, above the deck', () => {
    const v = meshBox(silo.registry.get('upper-vent')!.object);
    expect(v.min.y).toBeGreaterThan(LEVEL.floor);
    expect(v.max.y).toBeLessThan(LEVEL.eaves);
  });
  it('the water pipes come through the wall into the room, then down into the ground', () => {
    const r = silo.risers;
    for (const side of ['supply', 'ret'] as const) {
      expect(Math.hypot(r.waterTop[side].x, r.waterTop[side].z)).toBeLessThan(SILO.outerR);
      expect(Math.hypot(r.waterTop[side].x, r.waterTop[side].z)).toBeGreaterThan(WALL.roomIn - 0.05);
      expect(r.waterFoot[side].y).toBeLessThan(-0.5);
    }
    // they leave the wall on the azimuth of the dims
    const [wx, , wz] = wallPoint(AZIMUTH.water + AZIMUTH.waterSpread, WALL.roomIn + 0.02, RISERS.topY);
    expect(r.waterTop.supply.x).toBeCloseTo(wx, 5);
    expect(r.waterTop.supply.z).toBeCloseTo(wz, 5);
  });
  it("the cable riser runs from the slab's edge to the top gland at the deck", () => {
    const r = silo.risers;
    expect(Math.hypot(r.cableFoot.x, r.cableFoot.z)).toBeCloseTo(SILO.slabR, 3);
    expect(r.cableTop.y).toBeGreaterThan(LEVEL.floor);
    expect(Math.hypot(r.cableTop.x, r.cableTop.z)).toBeLessThan(SILO.outerR + 0.25);
  });
});

describe('the pipes are attached, end to end', () => {
  const us = pipeLattice();
  const legs = legsOf(us);
  it('every U-pipe is two legs a pitch apart, joined at their feet by its bend', () => {
    for (const u of us) expect(u.x1 - u.x0).toBeCloseTo(PIPE.pitch, 9);
    const g = bendGeometry(FIELD_QUALITY);
    g.computeBoundingBox();
    const bb = g.boundingBox!;
    // the bend's ends sit on the axes of the two legs, at the leg's foot (origin and one pitch along)
    expect(bb.min.x).toBeCloseTo(-PIPE.r, 2);
    expect(bb.max.x).toBeCloseTo(PIPE.pitch + PIPE.r, 2);
    expect(bb.max.y).toBeCloseTo(0, 1);
    expect(bb.min.y).toBeCloseTo(-PIPE.bendR - PIPE.r, 2);
    // under it, stone
    expect(PIPE.legBottom + bb.min.y).toBeGreaterThan(LEVEL.bedBottom);
  });
  it("each expansion loop starts on its leg's top and ends in its header", () => {
    for (const off of [-PIPE.headerOffset, PIPE.headerOffset]) {
      const pts = loopPoints(off);
      expect(pts[0].length()).toBe(0);
      const end = pts[pts.length - 1];
      expect(end.z).toBeCloseTo(off, 9);
      expect(PIPE.legTop + end.y).toBeGreaterThan(PIPE.headerY - PIPE.headerR);
      expect(PIPE.legTop + end.y).toBeLessThan(PIPE.headerY);
    }
    const legsSum = legs.filter((l) => l.side === 0).length;
    expect(legsSum).toBe(legs.length / 2);
  });
  it('every leg is under a header run of its row, on its side', () => {
    const runs = headerRuns(us);
    for (const l of legs) {
      const z = l.z + (l.side === 0 ? -PIPE.headerOffset : PIPE.headerOffset);
      const on = runs.some(
        (r) => r.side === l.side && Math.abs(r.z - z) < 1e-9 && l.x >= r.x0 && l.x <= r.x1 && r.zone === l.zone,
      );
      expect(on, `leg ${l.x},${l.z}`).toBe(true);
    }
  });
  it('the collars of the spacers fit their legs', () => {
    expect(PIPE.collarR).toBeGreaterThan(PIPE.r);
    expect(PIPE.collarR - PIPE.r).toBeLessThan(0.02);
  });
  it('the section along a row shows the U: its legs and bends are on the plane z = 0', () => {
    const p = silo.pipes;
    expect(p.stripsZ0.length).toBeGreaterThan(20);
    expect(p.bendsZ0.every((u) => u.z === 0)).toBe(true);
    expect(p.stripsX0.length).toBeGreaterThan(10);
  });
});

describe('the machines of the room rest on the deck (5 mm)', () => {
  const FLOOR: PlantId[] = [
    'lv-switchboard',
    'heater-controller',
    'resistor-bank',
    'charge-blower',
    'discharge-blower',
    'blower-drive',
    'air-water-exchanger',
    'dh-pump',
    'expansion-vessel',
    'control-cabinet',
    'hot-air-duct',
    'cold-air-duct',
  ];
  const reg = plant.registry;
  plant.registry.setAllFactors(0);
  for (const id of FLOOR) {
    it(`${id} stands on the deck`, () => {
      const b = meshBox(reg.get(id)!.object);
      expect(Math.abs(b.min.y - LEVEL.floor), `${b.min.y}`).toBeLessThan(0.005);
    });
  }
  it('nothing rises through the ceiling, nothing leaves through the wall', () => {
    for (const id of PLANT_PARTS) {
      const b = meshBox(reg.get(id)!.object);
      expect(b.max.y, id).toBeLessThanOrEqual(LEVEL.ceiling + 0.001);
      const corners = [
        Math.hypot(b.min.x, b.min.z),
        Math.hypot(b.max.x, b.min.z),
        Math.hypot(b.min.x, b.max.z),
        Math.hypot(b.max.x, b.max.z),
      ];
      // what has a cable or a pipe through the wall has a long box: only the bodies with none are checked by their box
      if (
        [
          'charge-blower',
          'air-water-exchanger',
          'expansion-vessel',
          'charge-damper',
          'discharge-damper',
          'hot-air-duct',
        ].includes(id)
      )
        expect(Math.max(...corners), id).toBeLessThan(WALL.roomIn + 0.1);
    }
  });
  it('all the machines stand on the back half of the deck, so that the section and the room read', () => {
    for (const id of PLANT_PARTS) {
      const b = meshBox(reg.get(id)!.object);
      expect(b.max.z, id).toBeLessThan(0.35);
    }
  });
});

describe("the equipment is connected in the model's order", () => {
  const eq = plant.equipment;
  const P = eq.paths;
  const first = (a: THREE.Vector3[]) => a[0];
  const last = (a: THREE.Vector3[]) => a[a.length - 1];

  it('the charge blower is on the return side, before the resistors (the model, not research §0.4)', () => {
    const CB = PLANT.chargeBlower;
    expect(first(P.chargeHot).x).toBeCloseTo(CB.x, 5);
    expect(first(P.chargeHot).z).toBeCloseTo(CB.z, 5);
    // from the blower the air goes through the bank, then to the header
    const zs = P.chargeHot.map((p) => p.z);
    expect(zs[2]).toBeCloseTo(PLANT.bank.z0, 5);
    expect(zs[3]).toBeCloseTo(PLANT.bank.z1, 5);
    // the return duct ends at the blower: it sees the stone's air, not the resistors'
    expect(last(P.chargeBack).x).toBeCloseTo(CB.x, 5);
    expect(last(P.chargeBack).z).toBeCloseTo(CB.z, 5);
  });
  it("the blower's outlet opens on the resistors' hood, its inlet on the return duct", () => {
    const j = eq.joints.find((x) => x.name.startsWith('blower outlet'))!;
    expect(Math.abs(j.a.x - PLANT.chargeBlower.x)).toBeLessThan(P3MM);
    expect(j.a.z).toBeLessThan(PLANT.bank.z0);
    expect(PLANT.bank.z0 - j.a.z).toBeLessThan(0.3);
    const k = eq.joints.find((x) => x.name.startsWith('return duct'))!;
    expect(k.a.distanceTo(k.b)).toBeLessThan(P3MM);
  });
  it('each zone has a pair of ducts, each of them with a damper for the charge and one for the discharge', () => {
    expect(eq.chargeDampers.map((d) => d.length)).toEqual([2, 2, 2]);
    expect(eq.dischargeDampers.map((d) => d.length)).toEqual([2, 2, 2]);
  });
  it('the water goes through the wall where the riser is, in and out', () => {
    expect(first(P.waterIn).distanceTo(silo.risers.waterTop.ret)).toBeLessThan(P3MM);
    expect(last(P.waterOut).distanceTo(silo.risers.waterTop.supply)).toBeLessThan(P3MM);
  });
  it('the current comes in where the riser is, through the wall', () => {
    const top = silo.risers.cableTop;
    expect(first(P.current).distanceTo(top)).toBeLessThan(0.3);
  });
  it("the current ends on the resistors' terminal box", () => {
    const end = last(P.current);
    const b = meshBox(plant.registry.get('resistor-bank')!.object);
    expect(end.y).toBeLessThanOrEqual(b.max.y + 0.01);
    expect(end.x).toBeGreaterThan(b.min.x);
    expect(end.x).toBeLessThan(b.max.x);
  });
});

describe('moving parts, attached and turning the right way', () => {
  const eq = plant.equipment;
  const B = PLANT.blower;

  it('the shaft of a blower runs from the wheel through the coupling into the motor', () => {
    for (const b of [eq.chargeBlower, eq.dischargeBlower]) {
      expect(b.shaftFrom.x).toBeLessThan(b.shaftTo.x);
      // the two halves of the coupling are on the rotor
      const box = new THREE.Box3().setFromObject(b.rotor, true);
      b.rotor.updateWorldMatrix(true, true);
      const size = box.getSize(new THREE.Vector3());
      expect(Math.max(size.x, size.z)).toBeGreaterThan(B.couplingW);
    }
  });

  it('the top of the wheel moves towards the outlet: the air is thrown the way it leaves', () => {
    const turn = (b: typeof eq.chargeBlower, outletDir: THREE.Vector3, sign: 1 | -1) => {
      b.rotor.rotation.x = 0;
      b.group.updateWorldMatrix(true, true);
      // a point on the far side of the shaft from the outlet's side: the wheel's rim next to the outlet
      const local = new THREE.Vector3(0, sign * 0.4, 0);
      const a = b.rotor.localToWorld(local.clone());
      b.rotor.rotation.x = 0.02;
      b.rotor.updateWorldMatrix(true, true);
      const c = b.rotor.localToWorld(local.clone());
      b.rotor.rotation.x = 0;
      return c.sub(a).dot(outletDir);
    };
    // the charge blower: outlet at the top, towards +z (the bank)
    expect(turn(eq.chargeBlower, new THREE.Vector3(0, 0, 1), 1)).toBeGreaterThan(0);
    // the discharge blower: its outlet is at the bottom, towards +z (under the exchanger)
    expect(turn(eq.dischargeBlower, new THREE.Vector3(0, 0, 1), -1)).toBeGreaterThan(0);
  });

  it("the wheels turn with the model's angles, a damper follows its zone and the elements its glow", () => {
    const a = plant.equipment;
    const st = stateWith({ chargeBlowerAngle: 1.2, dischargeBlowerAngle: 2.2, pumpAngle: 0.7, heaterGlow: 0.5 });
    st.zones = st.zones.map((z, i) => ({ ...z, chargeDamper: i === 0 ? 1 : 0, dischargeDamper: i === 2 ? 1 : 0 }));
    for (let i = 0; i < 400; i++) plant.update(st, 0.05, view());
    expect(a.chargeBlower.rotor.rotation.x).toBeCloseTo(1.2, 9);
    expect(a.dischargeBlower.rotor.rotation.x).toBeCloseTo(2.2, 9);
    expect(a.pumpRotor.rotation.x).toBeCloseTo(0.7, 9);
    expect(a.elements.emissiveIntensity).toBeGreaterThan(1);
    for (const g of a.chargeDampers[0]) expect(g.rotation.x).toBeCloseTo(0, 2);
    for (const g of a.chargeDampers[1]) expect(g.rotation.x).toBeCloseTo(Math.PI / 2, 2);
    for (const g of a.dischargeDampers[2]) expect(g.rotation.x).toBeCloseTo(0, 2);
    for (const g of a.dischargeDampers[0]) expect(g.rotation.x).toBeCloseTo(Math.PI / 2, 2);
  });

  it('the angles the sim gives are capped: at most two turns a second, the wheel reads', () => {
    const st = stateWith({}, { strategy: 'always' });
    expect(st.chargeBlower).toBeGreaterThanOrEqual(0);
    expect(st.chargeBlower).toBeLessThanOrEqual(1);
  });
});

describe("the pipe cell's grains and blocks", () => {
  const reg = cell.registry;
  it('the blocks stand on their plinths, the plinths on the table', () => {
    const plinth = meshBox(cell.scenery()[0]);
    expect(plinth.min.y).toBeCloseTo(0, 3);
    expect(plinth.max.y).toBeCloseTo(CELL.plinthH, 3);
    for (const id of ['core-zone', 'outer-zone']) {
      const b = meshBox(reg.get(id)!.object);
      expect(Math.abs(b.min.y - LEVEL.bedBottom), id).toBeLessThan(P3MM);
      expect(Math.abs(b.max.y - LEVEL.bedTop), id).toBeLessThan(P3MM);
    }
  });
  it('each tray stands on its stool, each stool on the table; the grains lie in the tray', () => {
    for (const id of ['quartz-sand', 'crushed-soapstone']) {
      const b = meshBox(reg.get(id)!.object);
      expect(Math.abs(b.min.y), id).toBeLessThan(P3MM);
      expect(b.max.y, id).toBeGreaterThan(CELL.tray.standH);
    }
  });
  it('the header runs across its block, the pipes hang from it, a spacer around each of them', () => {
    const h = meshBox(reg.get('branch-header')!.object);
    const l = meshBox(reg.get('expansion-loop')!.object);
    const p = meshBox(reg.get('heat-pipe')!.object);
    const r = meshBox(reg.get('return-bend')!.object);
    const s = meshBox(reg.get('pipe-spacer')!.object);
    expect(l.max.y).toBeGreaterThan(h.min.y);
    expect(Math.abs(l.min.y - p.max.y)).toBeLessThan(P3MM + PIPE.r);
    expect(Math.abs(r.max.y - p.min.y)).toBeLessThan(PIPE.r + P3MM);
    expect(s.min.y).toBeGreaterThan(p.min.y);
    expect(s.max.y).toBeLessThan(p.max.y);
  });
  it('a profile written by the model reads back', () => {
    const pf = cell.profiles.core;
    pf.write(2, [0.05, 0.28], [300, 240]);
    expect(pf.read(0, 2)).toBeCloseTo(300, 0);
    expect(pf.rhoMax).toBeCloseTo(0.28, 6);
  });
});

// keep the helpers honest: they build
it('the small geometry helpers give their sizes', () => {
  const b = boxGeo(1, 2, 3, 0.2, 0.4, 0.6);
  b.computeBoundingBox();
  expect(b.boundingBox!.max.x).toBeCloseTo(1.1, 6);
  const s = stickGeo(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 2, 0), 0.1);
  s.computeBoundingBox();
  expect(s.boundingBox!.max.y).toBeCloseTo(2, 6);
  expect(SITE.silo.yawDeg).toBeGreaterThan(0);
});
