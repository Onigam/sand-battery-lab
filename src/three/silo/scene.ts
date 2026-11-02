import * as THREE from 'three';
import { PAPER_STUDIO, mesh } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule } from '@onigam/lab-kit/three';
import type { MediumId } from '../../sim/silo';
import type { SandState } from '../../sim/types';
import { FlowDots, discY, joined, paperFloor, stick, v3 } from '../common';
import { type CutMode, type Poly, WedgeCut, rectPoly } from '../cut';
import { applyWear, contactRing } from '../detail';
import { LANCES, LEVEL, PENETRATION, PIPE, PLANT, SILO } from '../dims';
import { HeatField, StoneReveal, type StoneKind, heatColor, heatMaterial } from '../heat';
import {
  driveEquipment,
  buildEquipment,
  plantMaterials,
  PLANT_PARTS,
  SERVICE_PARTS,
  type EquipmentPieces,
  type PlantId,
} from '../machine/equipment';
import { bendStrips, buildPipeField, legStrips, type PipeField } from '../machine/pipes';
import { buildRoomDressing } from '../machine/room';
import {
  SILO_PARTS,
  bodyMaterials,
  buildBody,
  buildWallRisers,
  type BodyPieces,
  type SiloPartId,
  type WallRisers,
} from '../machine/silo';
import { mergeStatic } from '../merge';
import { buildHeatScale, type HeatScale } from '../scale';
import { FramedRegistry, anchor, hotspots, workshopScene, type HotspotDef } from '../world';

// The `silo` world: the machine in section, the roadmap's « aha ». On arrival a quarter of the silo is taken away, and the stone is coloured live by the model (`bedT`): the hot core
// spreading during a charge, the cool edge staying cool. The section tool takes away the whole front half instead. The false colour is fixed in °C and it has its scale beside the
// silo, a bar on a stand with the kit's labels; it says once, in the overview, that stone at 400 °C does not glow. The same functions as in the other worlds build everything.

const HOTSPOTS: HotspotDef[] = [
  { id: 'storage-bed', fr: 'Le lit de pierre', en: 'The storage bed' },
  { id: 'pipe-field', fr: 'Le champ de tubes', en: 'The pipe field', goto: 'pipe-cell' },
  { id: 'equipment-floor', fr: 'L’étage technique', en: 'The equipment floor', goto: 'plant-room' },
  { id: 'foundation-slab', fr: 'Radier', en: 'Foundation slab', minor: true },
  { id: 'base-insulation', fr: 'Isolation sous le lit', en: 'Base insulation', minor: true },
  { id: 'inner-shell', fr: 'Virole intérieure', en: 'Inner steel shell', minor: true },
  { id: 'wall-insulation', fr: 'Isolation des parois', en: 'Wall insulation', minor: true },
  { id: 'outer-cladding', fr: 'Bardage extérieur', en: 'Outer steel cladding', minor: true },
  { id: 'top-insulation', fr: 'Isolation du dessus', en: 'Top insulation', minor: true },
  { id: 'conical-roof', fr: 'Toit conique', en: 'Conical roof', minor: true },
  { id: 'upper-vent', fr: 'Ouverture haute', en: 'Upper opening', minor: true },
  { id: 'access-ladder', fr: 'Échelle à crinoline', en: 'Caged ladder', minor: true },
  { id: 'thermocouple-lance', fr: 'Cannes de température', en: 'Temperature lances', minor: true },
  { id: 'duct-penetration', fr: 'Traversée de l’isolation', en: 'Insulation penetration', minor: true },
  // the scale of the false colour: labels of the bar beside the silo; a click selects the stone
  { id: 'storage-bed#t500', fr: '500 °C', en: '500 °C' },
  { id: 'storage-bed#t300', fr: '300 °C', en: '300 °C' },
  { id: 'storage-bed#t100', fr: '100 °C', en: '100 °C' },
];

/** Explode offsets, silo frame, metres: straight up, in the order a crew lifts them off. */
export const EXPLODE: Record<SiloPartId, [number, number, number]> = {
  'foundation-slab': [0, 0, 0],
  'base-insulation': [0, 0, 0],
  'storage-bed': [0, 0.5, 0],
  'pipe-field': [0, 6.6, 0],
  'thermocouple-lance': [0, 7, 0],
  'inner-shell': [0, 6.8, 0],
  'wall-insulation': [0, 7.6, 0],
  'outer-cladding': [0, 8.2, 0],
  'upper-vent': [0, 8.2, 0],
  'access-ladder': [0, 8.2, 0],
  'top-insulation': [0, 14, 0],
  'duct-penetration': [0, 14.7, 0],
  'equipment-floor': [0, 15.6, 0],
  'conical-roof': [0, 17.8, 0],
};

/**
 * The bar of the scale stands here, on the paper, at the left of the silo in the home view, inside the box the overview frames: its labels read towards the silo. It is wide enough to show beside its
 * labels at the phone's distance, where a metre is about twenty pixels.
 */
export const SCALE = {
  x: -6.9,
  z: 4.9,
  baseY: 0,
  width: 0.6,
  depth: 0.1,
  y0: LEVEL.bedBottom,
  y1: LEVEL.bedTop,
  footR: 0.42,
  yaw: Math.PI / 4,
};

/** Where a layer of the silo reads: its section on the plane z = 0, at the rim. A selected layer is framed here, not by its whole 16 m (`FramedRegistry`). */
const onSection = (x0: number, x1: number, y0: number, y1: number): THREE.Box3 =>
  new THREE.Box3(new THREE.Vector3(x0, y0, -0.8), new THREE.Vector3(x1, y1, 0.8));

const FOCUS: Partial<Record<SiloPartId, THREE.Box3>> = {
  'foundation-slab': onSection(4.5, 8.1, 0, 1.5),
  'base-insulation': onSection(4.5, 8.1, 0, 1.5),
  'inner-shell': onSection(5.5, 8, 0.6, 8),
  'wall-insulation': onSection(5.5, 8, 0.6, 8),
  'outer-cladding': onSection(5.5, 8.3, 0.4, 11.6),
  'storage-bed': new THREE.Box3(new THREE.Vector3(-0.5, LEVEL.bedBottom, -0.5), new THREE.Vector3(7, LEVEL.bedTop, 7)),
  'pipe-field': new THREE.Box3(
    new THREE.Vector3(-0.5, LEVEL.bedBottom, -0.5),
    new THREE.Vector3(7, LEVEL.bedTop + 1, 7),
  ),
  'top-insulation': onSection(3.5, 8, 6.2, 8.6),
  'equipment-floor': new THREE.Box3(
    new THREE.Vector3(-1, LEVEL.floor, -6.5),
    new THREE.Vector3(7.4, LEVEL.floor + 3.3, 0.5),
  ),
  'conical-roof': onSection(2.5, 8, 10.8, 13.2),
};

export interface SiloWorldOptions {
  /** The medium the simulation holds (it is a parameter, the state does not carry it). */
  medium?: () => MediumId;
}

export interface SiloScene extends SceneModule<SandState> {
  cut: WedgeCut;
  field: HeatField;
  body: BodyPieces;
  pipes: PipeField;
  risers: WallRisers;
  scale: HeatScale;
  equipment: EquipmentPieces;
  /** The box of each machine of the room as it was built, before it was merged into the floor. */
  equipmentBoxes: Record<PlantId, THREE.Box3>;
  flows: FlowDots[];
  /** Scenery that carries nothing: the floor; what is on the wall. */
  scenery(): THREE.Object3D[];
  readonly stone: { value: StoneKind };
  readonly drawnCut: () => CutMode;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const meshBox = (o: THREE.Object3D): THREE.Box3 => new THREE.Box3().setFromObject(o, true);

export function createSiloScene(opts: SiloWorldOptions = {}): SiloScene {
  const scene = workshopScene({
    name: 'silo',
    // behind everything the camera can frame from its limit: the paper dissolves by itself
    fog: [100, 145],
    key: [20, 34, 26],
    target: [0, 5, 0],
    shadowHalf: 25,
    shadowFar: 90,
  });
  scene.userData.look = { ...PAPER_STUDIO, exposure: 1.1 };
  for (const c of scene.children) {
    const h = c as THREE.HemisphereLight;
    const d = c as THREE.DirectionalLight;
    if (h.isHemisphereLight) h.intensity = 0.72;
    if (d.isDirectionalLight) d.intensity = d.castShadow ? 1.9 : 0.5;
  }
  scene.add(paperFloor(38, 16, 0, [15, 36]));
  const contact = contactRing(SILO.slabR, 4, 0.42);
  contact.position.y = 0.006;
  scene.add(contact);

  const registry = new FramedRegistry();
  const cut = new WedgeCut(0, 0);
  const mats = bodyMaterials();
  const body = buildBody(mats);
  const field = new HeatField();
  const stone = { value: 'soapstone' as StoneKind };
  const reveal = new StoneReveal(field.uniforms.uStoneShow);

  const roots = {} as Record<SiloPartId, THREE.Group>;
  for (const id of SILO_PARTS) {
    const g = new THREE.Group();
    g.name = id;
    roots[id] = g;
    scene.add(g);
  }
  // the body's pieces into their parts
  for (const id of Object.keys(body.groups) as (keyof typeof body.groups)[]) roots[id].add(body.groups[id]);

  // ---- the stone, coloured by the field
  const bedMat = heatMaterial({ field, stone });
  roots['storage-bed'].add(mesh(discY(SILO.bedR, LEVEL.bedBottom, LEVEL.bedTop, 96), bedMat));
  const capHeat = heatMaterial({ field, stone });
  const bedPoly: Poly = rectPoly(0, LEVEL.bedBottom, SILO.bedR, LEVEL.bedTop);

  // ---- the pipes in the stone
  const pipeSteel = new THREE.MeshStandardMaterial({ color: 0xb5babf, roughness: 0.4, metalness: 0.85 });
  const barSteel = new THREE.MeshStandardMaterial({ color: 0x70757a, roughness: 0.5, metalness: 0.7 });
  const mainSteel = new THREE.MeshStandardMaterial({ color: 0xc2c7cb, roughness: 0.38, metalness: 0.85 });
  const blockConcrete = new THREE.MeshStandardMaterial({ color: 0x9a968c, roughness: 0.92 });
  const pipes = buildPipeField(pipeSteel, barSteel, mainSteel, blockConcrete);
  roots['pipe-field'].add(pipes.group);

  // ---- where the ducts cross the top insulation
  const pen = roots['duct-penetration'];
  const penMat = mats.jacket;
  const penGeos: THREE.BufferGeometry[] = [];
  const collarGeos: THREE.BufferGeometry[] = [];
  const penX: number[] = [];
  const ductR = PLANT.riserR + PLANT.jacket;
  for (const zx of PLANT.zoneX)
    for (const s of [-1, 1]) {
      const x = zx + s * PLANT.pairHalf;
      penX.push(x);
      penGeos.push(stick(v3(x, PENETRATION.bottom, 0), v3(x, LEVEL.floor, 0), ductR, 20));
      // the collars: a thick sleeve under the deck and a flange on the insulation's top
      collarGeos.push(stick(v3(x, LEVEL.deckBottom - 0.26, 0), v3(x, LEVEL.deckBottom, 0), PENETRATION.collarR, 20));
      collarGeos.push(stick(v3(x, LEVEL.floor, 0), v3(x, LEVEL.floor + 0.02, 0), PENETRATION.collarR, 20));
    }
  pen.add(mesh(joined(penGeos), penMat));
  pen.add(mesh(joined(collarGeos), mats.galvanised));

  // ---- the equipment, the very pieces of the plant-room world
  const pmats = plantMaterials();
  const equipment = buildEquipment(pmats);
  for (const id of PLANT_PARTS) roots['equipment-floor'].add(equipment.roots[id]);
  for (const id of SERVICE_PARTS) roots['equipment-floor'].add(equipment.services[id]);
  const dressing = buildRoomDressing(pmats);
  roots['equipment-floor'].add(dressing.group);
  // their boxes before they are merged into one part: the test of the same machine across the worlds reads them
  scene.updateMatrixWorld(true);
  const equipmentBoxes = {} as Record<PlantId, THREE.Box3>;
  for (const id of PLANT_PARTS) equipmentBoxes[id] = meshBox(equipment.roots[id]);

  // ---- what comes down the wall: scenery here, the parts of the site world
  const risers = buildWallRisers(mats);
  scene.add(risers.water, risers.cable);

  // ---- the legend
  const scale: HeatScale = buildHeatScale(SCALE);
  scene.add(scale.group);

  // ---- merge, wear, clip, in this order: a merged mesh is what is clipped and worn
  const scope = 'silo';
  for (const id of SILO_PARTS) {
    if (id === 'storage-bed' || id === 'pipe-field') continue;
    if (id === 'equipment-floor') mergeMachine(roots[id], scope);
    else mergeStatic(roots[id], { name: id, scope });
  }
  mergeStatic(risers.water, { name: 'dh-riser', scope });
  mergeStatic(risers.cable, { name: 'cable-riser', scope });
  mergeStatic(scale.group, { name: 'heat-scale', scope, colours: false });
  for (const id of SILO_PARTS) {
    applyWear(roots[id], 3, (m) => !!(m.material as THREE.Material).userData.worn);
  }

  // ---- the caps, then the cut: the caps use their own, unclipped materials
  const sections = body.sections;
  for (const id of Object.keys(sections) as (keyof typeof sections)[]) {
    for (const s of sections[id] ?? []) cut.capRevolved(id, roots[id], s.polys, cut.capMaterial(s.material));
  }
  cut.capRevolved('storage-bed', roots['storage-bed'], [bedPoly], capHeat);
  addPipeStrips(cut, roots['pipe-field'], pipes);
  addPenetrationStrips(cut, pen, penX, ductR);
  addLanceStrips(cut, roots['thermocouple-lance']);
  for (const id of SILO_PARTS) cut.clip(roots[id]);
  cut.clip(risers.water);
  cut.clip(risers.cable);
  cut.clipMaterial(bedMat);

  // ---- what has no part of its own in this world goes with what it belongs to, so that isolate and explode leave nothing standing in the void: the pipes and the cable are fixed to the
  // cladding, the scale explains the stone. They are clipped already, or not at all: the scale stands whole beside the section.
  roots['outer-cladding'].add(risers.water, risers.cable);
  roots['storage-bed'].add(scale.group);

  // ---- anchors of the labels
  const anchors: Record<string, THREE.Object3D> = {};
  const at = (id: SiloPartId, x: number, y: number, z: number) => {
    anchors[id] = anchor(roots[id], x, y, z, `${id}-label`);
  };
  // each on its part, placed so that « all labels » keep apart at 1280 (a search over the part's own surface, `docs/3d.md`). The layers sit on their section on +X, where a selected layer is framed.
  at('storage-bed', 2.6, 2.5, 0);
  at('pipe-field', 1, 4.5, 0);
  at('equipment-floor', -3.5, 9.92, -2.8);
  at('foundation-slab', 7.9, 0.1, 0);
  at('base-insulation', 4.5, 0.86, 0);
  at('inner-shell', 7.01, 4.94, 0);
  at('wall-insulation', 7.24, 2.88, 0);
  at('outer-cladding', 7.57, 9.75, 0);
  at('top-insulation', 3, 7.2, 0);
  at('conical-roof', 3, 12.6, 0);
  at('upper-vent', -1.3, 10.6, 7.5);
  at('access-ladder', -5.15, 8.12, 6.89);
  at('thermocouple-lance', 0, 5.8, 1.25);
  at('duct-penetration', 0.35, 7.7, 0);
  anchors['storage-bed#t500'] = scale.anchorAt(500);
  anchors['storage-bed#t300'] = scale.anchorAt(300);
  anchors['storage-bed#t100'] = scale.anchorAt(100);

  for (const id of SILO_PARTS) {
    // the stone rises a little in the exploded view; its scale stays on the paper
    const stay = id === 'storage-bed' ? (f: number) => void (scale.group.position.y = -EXPLODE[id][1] * f) : undefined;
    registry.add(id, roots[id], V(...EXPLODE[id]), stay);
  }
  for (const [id, b] of Object.entries(FOCUS)) registry.setFocus(id, b);

  // ---- the air: dots down the leg of each zone on the section plane, hot in, back up. The colour of each is the model's temperature, on the same ramp.
  const colourFlows = (): FlowDots =>
    new FlowDots(90, { color: 0xffffff, size: 7, pixels: true, throughWalls: true, opacity: 0.95 });
  const chargeIn = colourFlows();
  const chargeOut = colourFlows();
  const dischargeIn = colourFlows();
  const dischargeOut = colourFlows();
  const flows = [chargeIn, chargeOut, dischargeIn, dischargeOut];
  flows.forEach((f) => scene.add(f.object));
  const zoneLegX = [2.5, 4.5, 6];
  PLANT.zoneX.forEach((zx, i) => {
    const xF = zx - PLANT.pairHalf;
    const xB = zx + PLANT.pairHalf;
    const xL = zoneLegX[i];
    // down the feeding duct, along the header, down a leg, round the bend, up its neighbour, back along the other header, up the returning duct
    const down = [
      V(xF, LEVEL.floor + 0.4, 0),
      V(xF, PIPE.ringY[0], 0),
      V(xL, PIPE.ringY[0], 0),
      V(xL, PIPE.legTop, 0),
      V(xL, PIPE.legBottom, 0),
    ];
    const up = [
      V(xL + PIPE.pitch, PIPE.legBottom, 0),
      V(xL + PIPE.pitch, PIPE.legTop, 0),
      V(xL + PIPE.pitch, PIPE.ringY[1], 0),
      V(xB, PIPE.ringY[1], 0),
      V(xB, LEVEL.floor + 0.4, 0),
    ];
    chargeIn.addPath(down, 22);
    chargeOut.addPath(up, 22);
    dischargeIn.addPath(down, 22);
    dischargeOut.addPath(up, 22);
  });
  const dot = new THREE.Color();
  const damperDrawn = { charge: [0, 0, 0], discharge: [0, 0, 0] };
  let drawnMode: CutMode = 'wedge';

  const scenery = () => [risers.water, risers.cable, scale.group];
  const mod: SiloScene = {
    id: 'silo',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors) as Hotspot[],
    cut,
    field,
    body,
    pipes,
    risers,
    scale,
    equipment,
    equipmentBoxes,
    flows,
    scenery,
    stone,
    drawnCut: () => drawnMode,
    // from the side of the wedge, a little above: both faces of the section read
    home: { position: V(23, 15, 25), target: V(0, 5.5, 0) },
    minDistance: 3,
    // on a phone the overview's fit asks for more than this and the silo would shrink: here its width just fits the screen's (D4)
    maxDistance: 60,
    homePadding: 0.9,
    update(s, dt, view) {
      stone.value = opts.medium?.() ?? 'soapstone';
      reveal.update(stone.value, dt);
      field.update(s, dt);
      drawnMode = view.cutaway ? 'half' : 'wedge';
      cut.update(drawnMode, registry);
      driveEquipment(equipment, s, dt, damperDrawn);
      const show = view.schematic;
      for (const f of flows) f.object.visible = show;
      if (show) {
        s.zones.forEach((z, i) => {
          const c = z.mode === 'charge';
          const d = z.mode === 'discharge';
          const speedC = c ? 0.9 + 0.3 * s.chargeBlower : 0;
          const speedD = d ? 0.9 + 0.3 * s.dischargeBlower : 0;
          chargeIn.advance(i, speedC, dt);
          chargeOut.advance(i, speedC, dt);
          dischargeIn.advance(i, speedD, dt);
          dischargeOut.advance(i, speedD, dt);
        });
        const anyC = s.zones.some((z) => z.mode === 'charge');
        const anyD = s.zones.some((z) => z.mode === 'discharge');
        chargeIn.object.visible = chargeOut.object.visible = anyC;
        dischargeIn.object.visible = dischargeOut.object.visible = anyD;
        chargeIn.material.color.copy(heatColor(s.airHot, dot));
        chargeOut.material.color.copy(heatColor(s.chargeReturnT, dot));
        dischargeOut.material.color.copy(heatColor(s.exchangerAirIn, dot));
        dischargeIn.material.color.copy(heatColor(s.exchangerAirOut, dot));
        for (const f of flows) f.place();
      }
    },
  };
  return mod;
}

/** The room as one part: static pieces merged, the groups that turn left alone (their own meshes merge inside them). */
function mergeMachine(root: THREE.Object3D, scope: string): void {
  root.traverse((o) => {
    if (o.name === 'rotor' || o.name === 'damper-shaft' || o.name === 'pump-rotor') {
      // merged in its own frame, so it turns as one; the root's merge leaves it alone
      mergeStatic(o, { name: o.name, scope });
      o.userData.dynamic = true;
    }
  });
  mergeStatic(root, { name: root.name, scope });
}

/** The legs and the bends on the section planes: thin strips over the coloured stone. */
function addPipeStrips(cut: WedgeCut, root: THREE.Object3D, p: PipeField): void {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xd9dcde,
    roughness: 0.45,
    metalness: 0.2,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const onPlaneZ = (xs: number[]) => legStrips(xs);
  const right = p.stripsZ0.filter((x) => x > 0);
  const left = p.stripsZ0.filter((x) => x <= 0);
  const a = onPlaneZ(right);
  const b = onPlaneZ(left);
  if (a) cut.capGeometry('pipe-field', root, a, mat, 'a');
  if (b) cut.capGeometry('pipe-field', root, b, mat, 'b');
  const bendA = bendStrips(p.bendsZ0.filter((u) => u.x0 >= 0));
  const bendB = bendStrips(p.bendsZ0.filter((u) => u.x0 < 0));
  if (bendA) cut.capGeometry('pipe-field', root, bendA, mat, 'a');
  if (bendB) cut.capGeometry('pipe-field', root, bendB, mat, 'b');
  const c = legStrips(p.stripsX0.filter((z) => z > 0));
  if (c) {
    c.rotateY(-Math.PI / 2);
    cut.capGeometry('pipe-field', root, c, mat, 'c');
  }
}

/** Where the ducts cross the top insulation: a jacket, the air inside. */
function addPenetrationStrips(cut: WedgeCut, root: THREE.Object3D, xs: number[], r: number): void {
  const jacket = new THREE.MeshStandardMaterial({
    color: 0xcfd3d6,
    roughness: 0.4,
    metalness: 0.4,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const air = new THREE.MeshStandardMaterial({
    color: 0x55606a,
    roughness: 0.8,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  const inner = PLANT.riserR;
  const strip = (x: number, half: number, y0: number, y1: number) => {
    const g = new THREE.PlaneGeometry(2 * half, y1 - y0);
    g.translate(x, (y0 + y1) / 2, 0);
    return g;
  };
  for (const side of ['a', 'b'] as const) {
    const list = xs.filter((x) => (side === 'a' ? x > 0 : x <= 0));
    if (!list.length) continue;
    cut.capGeometry(
      'duct-penetration',
      root,
      joined(list.map((x) => strip(x, r, PENETRATION.bottom, LEVEL.floor))),
      jacket,
      side,
    );
    cut.capGeometry(
      'duct-penetration',
      root,
      joined(list.map((x) => strip(x, inner, PENETRATION.bottom, LEVEL.floor))),
      air,
      side,
    );
  }
}

function addLanceStrips(cut: WedgeCut, root: THREE.Object3D): void {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x20252a,
    roughness: 0.4,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  const strip = (x: number, depth: number) => {
    const y0 = LEVEL.bedTop - depth;
    const g = new THREE.PlaneGeometry(0.05, LEVEL.floor - y0);
    g.translate(x, (LEVEL.floor + y0) / 2, 0);
    return g;
  };
  cut.capGeometry('thermocouple-lance', root, joined(LANCES.onX.map(([r, d]) => strip(r, d))), mat, 'a');
  const c = joined(LANCES.onZ.map(([r, d]) => strip(r, d)));
  c.rotateY(-Math.PI / 2);
  cut.capGeometry('thermocouple-lance', root, c, mat, 'c');
}
