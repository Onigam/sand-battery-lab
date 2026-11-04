import * as THREE from 'three';
import { clamp, damp, mesh } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule } from '@onigam/lab-kit/three';
import type { SandState } from '../../sim/types';
import { FlowDots, softDotTexture, v3 } from '../common';
import { applyWear } from '../detail';
import { AZIMUTH, DEG, LEVEL, RISERS, SITE, siteFromSilo, wallPoint } from '../dims';
import { bodyMaterials, buildBody, buildWallRisers, type BodyPieces, type WallRisers } from '../machine/silo';
import { mergeStatic } from '../merge';
import { FramedRegistry, anchor, hotspots, type HotspotDef } from '../world';
import {
  buildBoiler,
  buildSchool,
  buildVillageHouses,
  buildHouse,
  buildingMaterials,
  newHouseParts,
  partsToGroup,
} from './buildings';
import {
  buildAnnex,
  buildCellar,
  buildFence,
  buildHoleFloor,
  buildLine,
  buildSolar,
  buildTransformer,
  buildTrench,
  buildWind,
  type LineBuild,
  type TrenchBuild,
  type WindBuild,
} from './props';
import { HELD_HOUR, createSky } from './sky';
import { LEAVES, SNOW, leavesOf, patchSnow, snowOf } from './snow';
import { HOUSES, buildTerrain } from './terrain';
import { HOME, buildVegetation, forestMask, planVegetation, type Vegetation } from './vegetation';

// The `site` world: a generic Nordic village at the forest's edge, never the real plot. One line of the story, read from right to left along the road: the line brings cheap current to the
// transformer and the annex at the silo's foot, the two pipes come down its wall into the open trench, and hot water goes on to the school and a house whose cellar is drawn open. The old
// wood-chip boiler is kept beside it, a wind farm stands on the far ridge and a solar field behind the plot. The silo is the same machine as in the other worlds, moved into place. Snow comes with
// `winter`, the stack smokes when the boiler runs, the flows go at the model's speeds. No section here, the trench is drawn open.

export type SiteOptions = Record<string, never>;

export const SITE_PARTS = [
  'silo-exterior',
  'dh-riser',
  'cable-riser',
  'electrical-annex',
  'pad-transformer',
  'power-line',
  'solar-field',
  'wind-farm',
  'chip-boiler-plant',
  'boiler-stack',
  'dh-trench',
  'village-school',
  'house-substation',
] as const;
export type SitePartId = (typeof SITE_PARTS)[number];

const HOTSPOTS: HotspotDef[] = [
  { id: 'silo-exterior', fr: 'Le silo', en: 'The silo', goto: 'silo' },
  { id: 'village-school', fr: 'L’école', en: 'The school' },
  { id: 'dh-trench', fr: 'Tranchée', en: 'Trench' },
  { id: 'chip-boiler-plant', fr: 'Chaufferie', en: 'Boiler plant' },
  { id: 'wind-farm', fr: 'Parc éolien au loin', en: 'Distant wind farm', minor: true },
  { id: 'power-line', fr: 'Ligne moyenne tension', en: 'Medium-voltage line', minor: true },
  { id: 'dh-riser', fr: 'Colonnes du réseau', en: 'Network risers', minor: true },
  { id: 'cable-riser', fr: 'Colonne des câbles', en: 'Cable riser', minor: true },
  { id: 'electrical-annex', fr: 'Local électrique', en: 'Electrical annex', minor: true },
  { id: 'pad-transformer', fr: 'Transformateur', en: 'Transformer', minor: true },
  { id: 'solar-field', fr: 'Champ solaire', en: 'Solar field', minor: true },
  // a label's name runs to the right of its dot and a selected part stands in the middle of the view: on a phone a long name on a thin part has nowhere to go. The sheet has the full name.
  { id: 'boiler-stack', fr: 'Cheminée', en: 'Boiler stack', minor: true },
  { id: 'house-substation', fr: 'Sous-station', en: 'House substation', minor: true },
];

/**
 * Explode offsets: none. A village does not come apart: the school hung 9 m up and the trench rose as a frame (review D7), and it taught nothing. The world says `explode: false` (`WORLD.site`), so the tool is not on its toolbar.
 */
export const EXPLODE: Record<SitePartId, [number, number, number]> = {
  'silo-exterior': [0, 0, 0],
  'dh-riser': [0, 0, 0],
  'cable-riser': [0, 0, 0],
  'electrical-annex': [0, 0, 0],
  'pad-transformer': [0, 0, 0],
  'power-line': [0, 0, 0],
  'solar-field': [0, 0, 0],
  'wind-farm': [0, 0, 0],
  'chip-boiler-plant': [0, 0, 0],
  'boiler-stack': [0, 0, 0],
  'dh-trench': [0, 0, 0],
  'village-school': [0, 0, 0],
  'house-substation': [0, 0, 0],
};

export interface SiteScene extends SceneModule<SandState> {
  body: BodyPieces;
  risers: WallRisers;
  line: LineBuild;
  trench: TrenchBuild;
  wind: WindBuild;
  vegetation: Vegetation;
  flows: Record<string, FlowDots>;
  smoke: THREE.Points;
  sun: THREE.DirectionalLight;
  /** What carries the plot and the village, not a part: the supports of the "no floating part" test. */
  scenery(): THREE.Object3D[];
  drawn: { snow: number; leaves: number; held: boolean; sunHour: number };
  /** The silo as drawn here, in its own frame (the tests move it back). */
  siloFrame: THREE.Matrix4;
  landTriangles: number;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Simulated seconds per real second above which the sun stops following the clock. */
const CLOCK_FAST = 600;
/** The hours of daylight the sun keeps to at a slow clock. */
const DAY_FROM = 9.8;
const DAY_TO = 16.6;

export function createSiteScene(_opts: SiteOptions = {}): SiteScene {
  const scene = new THREE.Scene();
  scene.name = 'site';
  // a little brighter than the kit's default: snow under a low sun must read white, not grey
  scene.userData.look = { exposure: 1.18 };
  const registry = new FramedRegistry();
  const sky = createSky(scene);
  sky.focusShadow(V(-14, 0, 8), 78);

  const roots = {} as Record<SitePartId, THREE.Group>;
  for (const id of SITE_PARTS) {
    const g = new THREE.Group();
    g.name = id;
    roots[id] = g;
    scene.add(g);
  }

  // ---- the land and the plants
  const terrain = buildTerrain(forestMask);
  scene.add(terrain.mesh);
  // the land's holes have their own bottom: a part that is hidden leaves earth, not the sky
  const holes = buildHoleFloor();
  scene.add(holes);
  const plan = planVegetation();
  const vegetation = buildVegetation(plan);
  scene.add(vegetation.group);

  // ---- the silo, the very function of the `silo` world, moved into place: its outside only; the same dims.
  const yaw = SITE.silo.yawDeg * DEG;
  const mats = bodyMaterials();
  // the roof and the ledge of the slab take the snow; the cladding stays cold, so what falls on its roof stays
  patchSnow(mats.roof, { lo: 0.3, hi: 0.5 });
  patchSnow(mats.concrete, { lo: 0.6, hi: 0.9 });
  patchSnow(mats.galvanised, { lo: 0.7, hi: 0.95 });
  const body = buildBody(mats, { inside: false });
  const silo = roots['silo-exterior'];
  silo.position.set(SITE.silo.x, 0, SITE.silo.z);
  silo.rotation.y = yaw;
  for (const id of ['foundation-slab', 'outer-cladding', 'conical-roof', 'upper-vent', 'access-ladder'] as const)
    silo.add(body.groups[id]);
  mergeStatic(silo, { name: 'silo-exterior', scope: 'site', colours: false });
  applyWear(silo, 1.2, (m) => !!(m.material as THREE.Material).userData.worn);

  const risers = buildWallRisers(mats);
  const mountSilo = (root: THREE.Group, child: THREE.Object3D) => {
    root.position.set(SITE.silo.x, 0, SITE.silo.z);
    root.rotation.y = yaw;
    root.add(child);
  };
  mountSilo(roots['dh-riser'], risers.water);
  mountSilo(roots['cable-riser'], risers.cable);
  mergeStatic(roots['dh-riser'], { name: 'dh-riser', scope: 'site', colours: false });
  mergeStatic(roots['cable-riser'], { name: 'cable-riser', scope: 'site', colours: false });

  // ---- the annex at its foot, in the silo's frame
  const bm = buildingMaterials();
  const annex = buildAnnex(bm);
  mountSilo(roots['electrical-annex'], annex.group);
  mergeStatic(roots['electrical-annex'], { name: 'annex', scope: 'site', colours: false });

  // ---- the transformer, the line, the duct between transformer and annex
  const transformer = buildTransformer(bm);
  roots['pad-transformer'].add(transformer.group);
  const line = buildLine(bm, transformer.mv);
  roots['power-line'].add(line.group);
  mergeStatic(roots['power-line'], { name: 'line', scope: 'site', colours: false });
  const toSite = (p: THREE.Vector3): THREE.Vector3 => {
    const q = siteFromSilo(p.x, p.y, p.z);
    return V(q[0], q[1], q[2]);
  };
  // the low-voltage cable: a steel duct along the ground from the transformer to the annex (part of the transformer)
  const annexIn = toSite(annex.inlet);
  const ductPts = [
    transformer.lv.clone(),
    V(transformer.lv.x - 0.5, 0.12, transformer.lv.z),
    V(annexIn.x, 0.12, transformer.lv.z),
    V(annexIn.x, 0.12, annexIn.z + 0.5),
    V(annexIn.x, 0.4, annexIn.z),
  ];
  const ductMat = new THREE.MeshStandardMaterial({ color: 0x4b5053, roughness: 0.6, metalness: 0.4 });
  const ductGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(ductPts, false, 'catmullrom', 0.1),
    40,
    0.09,
    8,
    false,
  );
  roots['pad-transformer'].add(mesh(ductGeo, ductMat));
  mergeStatic(roots['pad-transformer'], { name: 'transformer', scope: 'site', colours: false });

  // ---- the fence and the buildings of the village
  const fence = buildFence();
  scene.add(fence);
  mergeStatic(fence, { name: 'fence', scope: 'site', colours: false });

  const houses = buildVillageHouses(bm, HOUSES);
  scene.add(houses);
  const school = buildSchool(bm);
  roots['village-school'].add(school.group);
  mergeStatic(roots['village-school'], { name: 'school', scope: 'site', colours: false });

  // ---- the trench and the cellar with the house above it
  const trench = buildTrench(bm, risers, yaw);
  roots['dh-trench'].add(trench.group);
  mergeStatic(roots['dh-trench'], { name: 'trench', scope: 'site', colours: false });
  const cellar = buildCellar(bm, trench.end);
  roots['house-substation'].add(cellar.group);
  // the house over it: it stands west of the pit; its plinth is part of the substation's picture, not of the part
  const hPlan = SITE.substationHouse;
  const parts = newHouseParts();
  buildHouse(
    bm,
    {
      length: hPlan.length,
      width: hPlan.width,
      wallH: hPlan.wallH,
      roofH: hPlan.roofH,
      colour: 2,
      plinth: hPlan.plinthH,
    },
    parts,
  );
  const substationHouse = partsToGroup(bm, parts, 'house-over-cellar');
  substationHouse.position.set(hPlan.x, 0, hPlan.z);
  // its front turned to the road
  scene.add(substationHouse);

  // ---- the boiler plant and its stack
  const boiler = buildBoiler(bm);
  roots['chip-boiler-plant'].add(boiler.hall);
  roots['boiler-stack'].add(boiler.stack);
  mergeStatic(roots['chip-boiler-plant'], { name: 'boiler', scope: 'site', colours: false });
  mergeStatic(roots['boiler-stack'], { name: 'stack', scope: 'site', colours: false });

  // ---- the solar field and the wind farm
  const solar = buildSolar(bm);
  roots['solar-field'].add(solar.group);
  const wind = buildWind();
  roots['wind-farm'].add(wind.group);

  // ---- anchors of the labels
  const anchors: Record<string, THREE.Object3D> = {};
  const at = (id: SitePartId, x: number, y: number, z: number) => {
    anchors[id] = anchor(roots[id], x, y, z, `${id}-label`);
  };
  // the silo's root turns: its anchor in its own frame, at the top of the wall on the side towards the road
  at('silo-exterior', ...(wallPoint(-110, 4, LEVEL.apex + 1.2) as [number, number, number]));
  at('dh-riser', ...(wallPoint(AZIMUTH.water, RISERS.axisR + 0.5, 6) as [number, number, number]));
  at('cable-riser', -6.53, 10.75, -4.07);
  at('electrical-annex', -8.52, 1.54, -7.29);
  at('pad-transformer', 7.6, 0.2, 15.9);
  at('power-line', 10.91, 7.06, 15.1);
  at('solar-field', 37.05, 0.77, -61.49);
  const [wx, wz] = SITE.wind.turbines[1];
  at('wind-farm', wx, wind.feet[1].y + SITE.wind.hub * 0.75, wz);
  at('chip-boiler-plant', SITE.boiler.x - 3, SITE.boiler.height + 6.5, SITE.boiler.z);
  at('boiler-stack', -31.41, 14.96, -17.29);
  at('dh-trench', -20.89, 0.98, 20.31);
  at(
    'village-school',
    SITE.school.x - 8,
    SITE.school.storeys * SITE.school.storeyH + SITE.school.roofH + 1,
    SITE.school.z,
  );
  at('house-substation', -65, 0.1, 24.1);

  for (const id of SITE_PARTS) registry.add(id, roots[id], V(...EXPLODE[id]));
  // what is too long to frame whole, framed where it reads: the first pole and its span over the transformer, one turbine, the corner of the trench that looks at the road
  const [p0, p1] = SITE.line.poles;
  registry.setFocus(
    'power-line',
    new THREE.Box3(
      V(Math.min(p0[0], SITE.transformer.x) - 1, 0, p1[1] - 1),
      V((p0[0] + p1[0]) / 2, SITE.line.poleH + 1, p0[1] + 1),
    ),
  );
  const turbine = wind.feet[1];
  registry.setFocus(
    'wind-farm',
    new THREE.Box3(
      V(turbine.x - SITE.wind.rotorR, turbine.y, turbine.z - 8),
      V(turbine.x + SITE.wind.rotorR, turbine.y + SITE.wind.hub + SITE.wind.rotorR, turbine.z + 8),
    ),
  );
  const [cx, cz] = SITE.trench.path[2];
  registry.setFocus('dh-trench', new THREE.Box3(V(cx - 5, -SITE.trench.depth, cz - 8), V(cx + 3, 0.6, cz + 2)));

  // ---- « Flux »: the current along the line and up the wall, the hot water out, the cool water back
  const current = new FlowDots(150, { color: 0xffb24d, size: 5, pixels: true, throughWalls: true, opacity: 0.95 });
  const hot = new FlowDots(150, { color: 0xe8452a, size: 6, pixels: true, throughWalls: true, opacity: 0.95 });
  const cool = new FlowDots(150, { color: 0x2f8fe8, size: 6, pixels: true, throughWalls: true, opacity: 0.95 });
  scene.add(current.object, hot.object, cool.object);
  const siteOf = (ps: THREE.Vector3[]) => ps.map(toSite);
  const pLine = current.addPath(line.path, 56);
  const pRiser = current.addPath([transformer.lv.clone(), ...ductPts.slice(1), ...siteOf(risers.cablePath)], 20);
  const pHot = hot.addPath([...siteOf(risers.waterPath.supply), ...trench.supply.slice(1)], 80);
  const pCool = cool.addPath([...trench.ret.slice().reverse(), ...siteOf(risers.waterPath.ret).reverse()], 80);

  // ---- the smoke of the stack, when the boiler runs: dots that rise and spread, a size and an amount from the model's boiler power; the wind is ours
  const SMOKE = 46;
  const smokePos = new Float32Array(SMOKE * 3);
  const smokeGeo = new THREE.BufferGeometry();
  smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
  const smokeMat = new THREE.PointsMaterial({
    color: 0xd4d6d6,
    size: 2.4,
    map: softDotTexture(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const smoke = new THREE.Points(smokeGeo, smokeMat);
  smoke.frustumCulled = false;
  smoke.userData.noShadow = true;
  scene.add(smoke);
  const smokeAges = new Float32Array(SMOKE);
  for (let i = 0; i < SMOKE; i++) smokeAges[i] = i / SMOKE;

  const drawn = { snow: 0, leaves: 1, held: true, sunHour: HELD_HOUR };
  let fast = true;
  let clockReal = 0;
  let clockSim = 0;
  let sunHour = HELD_HOUR;

  const mod: SiteScene = {
    id: 'site',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors) as Hotspot[],
    body,
    risers,
    line,
    trench,
    wind,
    vegetation,
    flows: { current, hot, cool },
    smoke,
    sun: sky.sun,
    scenery: () => [terrain.mesh, fence, houses, substationHouse, holes],
    drawn,
    siloFrame: new THREE.Matrix4().compose(
      V(SITE.silo.x, 0, SITE.silo.z),
      new THREE.Quaternion().setFromAxisAngle(v3(0, 1, 0), yaw),
      V(1, 1, 1),
    ),
    landTriangles: terrain.vertices * 2,
    home: { position: V(...HOME.pos), target: V(...HOME.target) },
    minDistance: 3,
    maxDistance: 480,
    declutter: true,
    update(s, dt, view) {
      // the sun holds its hour when the clock runs fast, or a day would strobe past. How fast the clock runs is judged over a second of real time: the state's clock moves in steps.
      clockReal += dt;
      if (clockReal >= 1) {
        const rate = (s.simTime - clockSim) / clockReal;
        // a world built again, a scenario that restarts: the clock jumps back, the judgement is kept
        if (rate >= 0) fast = rate > CLOCK_FAST;
        clockReal = 0;
        clockSim = s.simTime;
      }
      // at a slow clock the sun follows the hours of daylight, never the night: a view is never dark
      const want = fast ? HELD_HOUR : clamp(s.hour, DAY_FROM, DAY_TO);
      sunHour = damp(sunHour, want, 0.8, Math.min(dt, 0.1));
      drawn.held = fast;
      drawn.sunHour = sunHour;
      sky.update(sunHour, view.time, s.day, true);
      // the season
      drawn.snow = snowOf(s.winter);
      drawn.leaves = leavesOf(s.winter);
      SNOW.value = drawn.snow;
      LEAVES.value = drawn.leaves;
      for (const m of vegetation.meshes) if (m.name.startsWith('birch-leaves')) m.visible = drawn.leaves > 0.02;

      // the turbines: cheap hours are windy hours, by the shape of the drawn week; a visual speed, always readable
      const windy = clamp(1.1 - s.price / 140, 0.15, 1);
      for (const r of wind.rotors) r.rotation.z -= 0.55 * windy * dt * view.slowMo;

      // the stack smokes when the boiler runs: more of it the more it burns
      const burn = clamp(s.boiler / 400000, 0, 1);
      smokeMat.opacity = 0.6 * burn;
      smoke.visible = burn > 0.01;
      if (smoke.visible) {
        for (let i = 0; i < SMOKE; i++) {
          let a = smokeAges[i] + dt * 0.11 * (0.7 + 0.3 * view.slowMo);
          if (a > 1) a -= 1;
          smokeAges[i] = a;
          const h = a * 18;
          smokePos[i * 3] = boiler.stackTop.x + h * 0.9 + Math.sin(i * 12.9 + a * 5) * (0.3 + a * 2.6);
          smokePos[i * 3 + 1] = boiler.stackTop.y + h;
          smokePos[i * 3 + 2] = boiler.stackTop.z + Math.cos(i * 7.3 + a * 4) * (0.3 + a * 2.6);
        }
        (smokeGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      }

      // « Flux »
      const show = view.schematic;
      current.object.visible = show && s.heater > 1;
      hot.object.visible = cool.object.visible = show && s.waterFlow > 1e-3;
      if (show) {
        const vCurrent = 8 + (14 * s.heater) / 1e6;
        current.advance(pLine, vCurrent, dt);
        current.advance(pRiser, vCurrent * 0.25, dt);
        current.place();
        const vWater = 1.5 + (4 * s.waterFlow) / 6;
        hot.advance(pHot, vWater, dt);
        cool.advance(pCool, vWater, dt);
        hot.place();
        cool.place();
      }
    },
  };
  return mod;
}
