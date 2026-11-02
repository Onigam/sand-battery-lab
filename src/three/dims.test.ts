import { describe, expect, it } from 'vitest';
import { PORNAINEN, legsOf, siloSpec } from '../sim/silo';
import {
  AZIMUTH,
  CELL,
  CELL_HALF,
  GRID,
  LEVEL,
  MAIN_DUCT_INNER_R,
  PIPE,
  PIPE_GROWTH,
  PLANT,
  RISERS,
  SILO,
  SITE,
  WALL,
  ZONE_R,
  siteFromSilo,
  wallPoint,
} from './dims';
import { pipeLattice, legsOf as drawnLegs } from './machine/pipes';

// The one source of dimensions: what it takes from the simulation, what it derives, that the stack closes and that the room fits inside the wall.

describe('dims', () => {
  it('takes the reported figures from the simulation, never retyped', () => {
    expect(SILO.outerR).toBe(PORNAINEN.outerDiameter / 2);
    expect(SILO.totalHeight).toBe(PORNAINEN.totalHeight);
    expect(SILO.bedR).toBe(PORNAINEN.bedDiameter / 2);
    expect(SILO.bedHeight).toBe(PORNAINEN.bedHeight);
    expect(PIPE.r).toBe(PORNAINEN.pipeOuterRadius);
    expect(PIPE.pitch).toBe(PORNAINEN.pitch);
    expect(SILO.wallInsulation).toBe(PORNAINEN.wallInsulation);
  });

  it('closes the stack on the reported 13 m, the bed being the reported 6 m', () => {
    expect(LEVEL.bedTop - LEVEL.bedBottom).toBe(PORNAINEN.bedHeight);
    expect(LEVEL.apex).toBe(13);
    expect(LEVEL.slabTop).toBeCloseTo(SILO.slabH, 9);
    expect(LEVEL.bedBottom - LEVEL.slabTop).toBeCloseTo(SILO.baseInsulation, 9);
    expect(LEVEL.deckBottom - LEVEL.bedTop).toBe(PORNAINEN.stack.topInsulation);
    expect(LEVEL.eaves - LEVEL.deckBottom).toBe(PORNAINEN.stack.equipmentFloor);
    expect(LEVEL.apex - LEVEL.eaves).toBe(PORNAINEN.stack.roof);
    expect(LEVEL.ceiling).toBeLessThan(LEVEL.eaves);
    expect(LEVEL.floor).toBeGreaterThan(LEVEL.deckBottom);
  });

  it('fits the wall in the reported half metre', () => {
    expect(WALL.shellIn).toBe(SILO.bedR);
    expect(WALL.claddingOut).toBe(SILO.outerR);
    expect(WALL.claddingOut - WALL.shellIn).toBeCloseTo(PORNAINEN.wallBuildUp, 9);
    expect(SILO.claddingT).toBeGreaterThan(SILO.ribDepth);
    expect(WALL.insulationOut).toBeCloseTo(SILO.outerR - SILO.claddingT, 9);
  });

  it('sizes the main duct from the blower and the duct speed of the model (research: about 0.63 m inside)', () => {
    expect(2 * MAIN_DUCT_INNER_R).toBeGreaterThan(0.6);
    expect(2 * MAIN_DUCT_INNER_R).toBeLessThan(0.67);
  });

  it("draws about the model's number of legs on the reported bed", () => {
    const legs = drawnLegs(pipeLattice()).length;
    const model = legsOf(siloSpec('pornainen'));
    expect(legs % 2).toBe(0);
    expect(Math.abs(legs - model) / model).toBeLessThan(0.1);
    expect(PIPE_GROWTH).toBeGreaterThan(0.045);
    expect(PIPE_GROWTH).toBeLessThan(0.055);
  });

  it('puts the U-bend inside the bed', () => {
    expect(PIPE.legBottom - PIPE.bendR - PIPE.r).toBeCloseTo(LEVEL.bedBottom + PIPE.bendClearance, 9);
    expect(PIPE.legTop).toBe(LEVEL.bedTop);
    expect(PIPE.headerY + PIPE.headerR).toBeLessThan(LEVEL.deckBottom);
    for (const y of PIPE.ringY) expect(y).toBeLessThan(LEVEL.deckBottom);
    for (const y of PIPE.spacerYs) {
      expect(y).toBeGreaterThan(PIPE.legBottom);
      expect(y).toBeLessThan(PIPE.legTop);
    }
  });

  it("has the same grid as the simulation's section and zones on its radius", () => {
    expect(GRID.rings).toBe(10);
    expect(GRID.layers).toBe(6);
    expect(ZONE_R[2]).toBe(SILO.bedR);
    expect(ZONE_R[0]).toBeLessThan(ZONE_R[1]);
  });

  it('keeps every machine of the room inside its wall and on the back half of the deck', () => {
    const inside = (x: number, z: number, m = 0) => Math.hypot(x, z) + m <= WALL.roomIn;
    const { bank, chargeBlower, dischargeBlower, exchanger, switchboard, controller, drive, control, pump, vessel } =
      PLANT;
    expect(inside(bank.x - bank.w / 2, bank.z0)).toBe(true);
    expect(inside(chargeBlower.x, chargeBlower.z, PLANT.blower.voluteR + PLANT.blower.voluteGrow)).toBe(true);
    expect(inside(dischargeBlower.x, dischargeBlower.z, PLANT.blower.voluteR + PLANT.blower.voluteGrow)).toBe(true);
    expect(inside(exchanger.x1, exchanger.z - exchanger.depth / 2)).toBe(true);
    expect(inside(switchboard.x, switchboard.z - switchboard.w / 2)).toBe(true);
    expect(inside(controller.x, controller.z - controller.w / 2)).toBe(true);
    expect(inside(drive.x - drive.w / 2, drive.z)).toBe(true);
    expect(inside(control.x + control.w / 2, control.z)).toBe(true);
    expect(inside(pump.x, pump.z, 0.5)).toBe(true);
    expect(inside(vessel.x, vessel.z, vessel.r)).toBe(true);
    for (const z of [bank.z0, bank.z1, chargeBlower.z, dischargeBlower.z, exchanger.z, switchboard.z, pump.z, vessel.z])
      expect(z).toBeLessThan(0);
  });

  it('turns the silo so that its pipes and its cable come down on the side of the road (the wedge of the section keeps them)', () => {
    const [, , zw] = siteFromSilo(...wallPoint(AZIMUTH.water, SILO.outerR, 5));
    const [, , zc] = siteFromSilo(...wallPoint(AZIMUTH.cable, SILO.outerR, 5));
    expect(zw).toBeGreaterThan(0);
    expect(zc).toBeGreaterThan(0);
    expect(wallPoint(AZIMUTH.water, 1, 0)[2]).toBeLessThan(0);
    expect(wallPoint(AZIMUTH.cable, 1, 0)[2]).toBeLessThan(0);
  });

  it('stands the yard around the silo: reported plot of about 20 × 30 m', () => {
    expect(SITE.yard.x1 - SITE.yard.x0).toBe(20);
    expect(SITE.yard.z1 - SITE.yard.z0).toBe(30);
    expect(SITE.yard.x1).toBeGreaterThan(SILO.slabR);
    expect(SITE.yard.z0).toBeLessThan(-SILO.slabR);
  });

  it('has a pipe cell as wide as four pitches', () => {
    expect(CELL_HALF * 2).toBe(CELL.n * PIPE.pitch);
    expect(RISERS.outR).toBeGreaterThan(SILO.slabR);
  });
});
