import * as THREE from 'three';
import { GHOST, GHOST_WIRE, PAPER_STUDIO, mesh } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule } from '@onigam/lab-kit/three';
import type { MediumId } from '../../sim/silo';
import type { SandState } from '../../sim/types';
import { FlowDots, discY, paperFloor } from '../common';
import { WedgeCut, rectPoly } from '../cut';
import { applyWear, contactRing } from '../detail';
import { LEVEL, PLANT, SILO, WALL } from '../dims';
import { HeatField, StoneReveal, type StoneKind, heatColor, heatMaterial } from '../heat';
import {
  PLANT_PARTS,
  SERVICE_PARTS,
  buildEquipment,
  driveEquipment,
  plantMaterials,
  type EquipmentPieces,
  type PlantId,
} from '../machine/equipment';
import { buildRoomDressing, type RoomDressing } from '../machine/room';
import { bodyMaterials, buildBody, buildWallRisers, type BodyPieces, type WallRisers } from '../machine/silo';
import { mergeStatic } from '../merge';
import { buildHeatScale, type HeatScale } from '../scale';
import { FramedRegistry, anchor, hotspots, workshopScene, type HotspotDef } from '../world';

// The `plant-room` world: where the current and the heat go. The equipment floor under the roof, the stone below, laid out from left to right in the order they flow: switchboard,
// controller, resistors, the blower before them on the return side, the dampers, the ducts down into the bed and back, the exchanger, the pump, the meter, the two pipes through the wall.
// The silo under it is the same machine, cut as in the `silo` world: a quarter is taken away, the stone keeps the model's colours. The half of the wall on the camera's side is
// not drawn while the camera is outside, so the room reads as a stage. No section tool here: it would teach nothing.

const HOTSPOTS: HotspotDef[] = [
  // the main labels are short on purpose: six long names do not fit over one floor on a phone; the sheet has the full name
  { id: 'lv-switchboard', fr: 'Tableau', en: 'Switchboard' },
  { id: 'resistor-bank', fr: 'Résistances', en: 'Resistors' },
  { id: 'charge-blower', fr: 'Soufflante', en: 'Blower' },
  { id: 'air-water-exchanger', fr: 'Échangeur', en: 'Exchanger' },
  { id: 'dh-pump', fr: 'Pompe', en: 'Pump' },
  // the scale of the false colour: the room has no part for the stone, a click goes to the duct that carries the heat
  { id: 'hot-air-duct#scale', fr: '0 à 600 °C', en: '0 to 600 °C' },
  { id: 'heater-controller', fr: 'Gradateur de résistances', en: 'Heater controller', minor: true },
  { id: 'discharge-blower', fr: 'Soufflante de décharge', en: 'Discharge blower', minor: true },
  { id: 'blower-drive', fr: 'Variateur', en: 'Blower drive', minor: true },
  { id: 'charge-damper', fr: 'Registre de charge', en: 'Charge damper', minor: true },
  { id: 'discharge-damper', fr: 'Registre de décharge', en: 'Discharge damper', minor: true },
  { id: 'hot-air-duct', fr: 'Gaine d’air chaud', en: 'Hot-air duct', minor: true },
  { id: 'cold-air-duct', fr: 'Gaine d’air froid', en: 'Cool-air duct', minor: true },
  { id: 'heat-meter', fr: 'Compteur de chaleur', en: 'Heat meter', minor: true },
  { id: 'expansion-vessel', fr: 'Vase d’expansion', en: 'Expansion vessel', minor: true },
  { id: 'control-cabinet', fr: 'Armoire d’automatisme', en: 'Control cabinet', minor: true },
];

/** Explode offsets, metres: straight up for what hangs and is heavy, towards the door for what stands at the wall; each along a line it could really leave by. */
export const EXPLODE: Record<PlantId, [number, number, number]> = {
  'lv-switchboard': [1.6, 0, 0.6],
  'heater-controller': [1.6, 1.4, 0],
  'resistor-bank': [0, 3.2, 0],
  'charge-blower': [0, 2.6, -0.4],
  'discharge-blower': [0.2, 3, 0],
  'blower-drive': [0, 2.4, 1.8],
  // the dampers leave their branches forwards and rise with their ducts: they read beside what they close, not as furniture on the deck
  'charge-damper': [0, 4.7, 1.3],
  'discharge-damper': [0, 4.7, 2.5],
  'hot-air-duct': [0, 5.2, 0],
  'cold-air-duct': [0, 4.2, 0],
  'air-water-exchanger': [0, 3.6, 2.2],
  'dh-pump': [0, 4.4, -0.2],
  'heat-meter': [0, 5.8, 0],
  'expansion-vessel': [1.2, 1.6, 0],
  'control-cabinet': [0, 2.4, 1.8],
};

export interface PlantRoomOptions {
  medium?: () => MediumId;
}

/** The legend stands on the deck, in the free quarter, beside the coloured section: a lectern that leans back towards the camera above. Its label falls on the deck, not on the colours. */
export const SCALE = {
  x: -2.6,
  z: 1.75,
  baseY: LEVEL.floor,
  width: 0.34,
  depth: 0.05,
  y0: LEVEL.floor + 0.42,
  y1: LEVEL.floor + 2.1,
  footR: 0.28,
  yaw: 0.14,
  lean: 0.72,
};

export interface PlantRoomScene extends SceneModule<SandState> {
  equipment: EquipmentPieces;
  dressing: RoomDressing;
  scale: HeatScale;
  body: BodyPieces;
  risers: WallRisers;
  field: HeatField;
  cut: WedgeCut;
  flows: Record<string, FlowDots>;
  scenery(): THREE.Object3D[];
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/**
 * The wall and what is on it, above the deck, are not drawn on the camera's half while the camera is outside the wall, and the ceiling is not drawn from above: the room is open to
 * the eye, without a tool and without a change of material. Below the deck nothing changes.
 */
function dollhouse<T extends THREE.Material>(mat: T): T {
  if (mat.userData.doll) return mat;
  mat.userData.doll = true;
  const floor = LEVEL.floor + 0.015;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    prev.call(mat, shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDollW;')
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvDollW = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDollW;')
      .replace(
        '#include <clipping_planes_fragment>',
        /* glsl */ `#include <clipping_planes_fragment>
        if ( vDollW.y > ${floor.toFixed(3)} ) {
          bool outside = dot( cameraPosition.xz, cameraPosition.xz ) > ${(WALL.roomIn * WALL.roomIn).toFixed(2)} || cameraPosition.y > ${LEVEL.ceiling.toFixed(2)};
          if ( outside ) {
            // the ceiling is not drawn from outside; the wall opens on a fixed plane through the axis, on the side of the door, the rails stay tied to the part that stands.
            // Seen from the side or from behind, the arc that faces the camera opens too.
            bool front = cameraPosition.z > -1.0 ? vDollW.z > 0.0 : vDollW.z < 0.0;
            bool facing = dot( normalize( vDollW.xz ), normalize( cameraPosition.xz ) ) > ${FACING.toFixed(2)};
            if ( front || facing || vDollW.y > ${(LEVEL.ceiling - 0.02).toFixed(2)} ) discard;
          }
        }`,
      );
  };
  const key = mat.customProgramCacheKey.bind(mat);
  mat.customProgramCacheKey = () => `${key()}|doll`;
  return mat;
}

/** The arc of the wall that opens towards a camera outside, the same in the wall's discard and in the rails'. */
const FACING = 0.62;

/**
 * What hangs from wall to wall under the ceiling is drawn only while the wall stands at both its ends: seen from a side where the wall has opened, a rail would stop in mid-air (review D6). The
 * test is on the ends of its line, not on each pixel, so a rail is whole or it is not there. The room seen from inside keeps them all.
 */
function overheadDoll<T extends THREE.Material>(mat: T): T {
  const prev = mat.onBeforeCompile;
  const key = mat.customProgramCacheKey.bind(mat);
  mat.onBeforeCompile = (shader, renderer) => {
    prev.call(mat, shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vOverW;')
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvOverW = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vOverW;')
      .replace(
        '#include <clipping_planes_fragment>',
        /* glsl */ `#include <clipping_planes_fragment>
        if ( dot( cameraPosition.xz, cameraPosition.xz ) > ${(WALL.roomIn * WALL.roomIn).toFixed(2)} || cameraPosition.y > ${LEVEL.ceiling.toFixed(2)} ) {
          float hx = sqrt( max( ${(WALL.roomIn * WALL.roomIn).toFixed(2)} - vOverW.z * vOverW.z, 0.0 ) );
          vec2 endA = vec2( hx, vOverW.z );
          vec2 endB = vec2( -hx, vOverW.z );
          vec2 camDir = normalize( cameraPosition.xz );
          bool frontOpen = cameraPosition.z > -1.0 ? vOverW.z > 0.0 : vOverW.z < 0.0;
          if ( frontOpen || dot( normalize( endA ), camDir ) > ${FACING.toFixed(2)} || dot( normalize( endB ), camDir ) > ${FACING.toFixed(2)} ) discard;
        }`,
      );
  };
  mat.customProgramCacheKey = () => `${key()}|overhead`;
  mat.needsUpdate = true;
  return mat;
}

export function createPlantRoomScene(opts: PlantRoomOptions = {}): PlantRoomScene {
  const scene = workshopScene({
    name: 'plant-room',
    // behind everything the camera can frame from its limit
    fog: [95, 145],
    key: [11, 34, 22],
    target: [0, 8, -1],
    shadowHalf: 18,
    shadowFar: 70,
  });
  // a room, not a drafting table: less light than the studio's, so that the machines keep their values (the paper stays the paper through the fog)
  scene.userData.look = { ...PAPER_STUDIO, exposure: 1.05 };
  for (const c of scene.children) {
    const h = c as THREE.HemisphereLight;
    const d = c as THREE.DirectionalLight;
    if (h.isHemisphereLight) h.intensity = 0.62;
    if (d.isDirectionalLight) d.intensity = d.castShadow ? 1.75 : 0.42;
  }
  scene.add(paperFloor(38, 16, 0, [15, 36]));
  const contact = contactRing(SILO.slabR, 4, 0.42);
  contact.position.y = 0.006;
  scene.add(contact);

  const registry = new FramedRegistry();
  registry.lightGhosts = true;
  const cut = new WedgeCut(0, 0);
  const field = new HeatField();
  const stone = { value: 'soapstone' as StoneKind };
  const reveal = new StoneReveal(field.uniforms.uStoneShow);

  // ---- the silo under the floor: the same function; what stands above the deck opens to the eye
  const mats = bodyMaterials();
  const body = buildBody(mats);
  const shell = new THREE.Group();
  shell.name = 'silo-under';
  scene.add(shell);
  for (const id of Object.keys(body.groups) as (keyof typeof body.groups)[]) {
    // the roof is left out: the room is seen from above
    if (id === 'conical-roof') continue;
    shell.add(body.groups[id]);
  }
  const bedMat = heatMaterial({ field, stone });
  const capHeat = heatMaterial({ field, stone });
  const bed = mesh(discY(SILO.bedR, LEVEL.bedBottom, LEVEL.bedTop, 96), bedMat);
  shell.add(bed);
  const risers = buildWallRisers(mats);
  shell.add(risers.water, risers.cable);
  mergeStatic(shell, { name: 'silo-under', scope: 'plant-room' });
  applyWear(shell, 3, (m) => !!(m.material as THREE.Material).userData.worn);
  // after the merge: the merge makes new materials, a patch on the old ones would be lost
  const patched = new Set<THREE.Material>();
  shell.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
    if (m && m !== bedMat && !patched.has(m)) {
      patched.add(m);
      dollhouse(m);
    }
  });
  const secs = body.sections;
  for (const id of Object.keys(secs) as (keyof typeof secs)[]) {
    if (id === 'conical-roof') continue;
    for (const s of secs[id] ?? []) {
      cut.capRevolved(id, shell, s.polys, dollhouse(cut.capMaterial(s.material)), false);
    }
  }
  cut.capRevolved('storage-bed', shell, [rectPoly(0, LEVEL.bedBottom, SILO.bedR, LEVEL.bedTop)], capHeat, false);
  cut.clip(shell);
  cut.clipMaterial(bedMat);

  // ---- the equipment
  const pmats = plantMaterials();
  const equipment = buildEquipment(pmats);
  for (const id of PLANT_PARTS) scene.add(equipment.roots[id]);
  for (const id of PLANT_PARTS) {
    const root = equipment.roots[id];
    root.traverse((o) => {
      if (o.name === 'rotor' || o.name === 'damper-shaft' || o.name === 'pump-rotor') {
        mergeStatic(o, { name: o.name, scope: 'plant-room' });
        o.userData.dynamic = true;
      }
    });
    mergeStatic(root, { name: id, scope: 'plant-room' });
    applyWear(root, 30, (m) => !!(m.material as THREE.Material).userData.worn);
  }
  // what runs across the room goes with its machine but is not in its box
  const services: { part: PlantId; meshes: THREE.Mesh[]; solid: Map<THREE.Mesh, THREE.Material>; shown: string }[] = [];
  for (const id of SERVICE_PARTS) {
    const g = equipment.services[id];
    scene.add(g);
    mergeStatic(g, { name: g.name, scope: 'plant-room' });
    const meshes: THREE.Mesh[] = [];
    g.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });
    services.push({
      part: id,
      meshes,
      solid: new Map(meshes.map((m) => [m, m.material as THREE.Material])),
      shown: 'solid',
    });
  }
  const dressing = buildRoomDressing(pmats);
  scene.add(dressing.group);
  mergeStatic(dressing.group, { name: 'dressing', scope: 'plant-room' });
  for (const m of dressing.overhead) {
    overheadDoll(m.material as THREE.Material);
    // their lines on the deck would cross the picture a second time
    m.castShadow = false;
    m.userData.noShadow = true;
  }

  // ---- the legend of the colours under the floor
  const scale = buildHeatScale(SCALE);
  scene.add(scale.group);
  mergeStatic(scale.group, { name: 'heat-scale', scope: 'plant-room', colours: false });

  // a warm light in the room, under the ceiling
  const roomLight = new THREE.PointLight(0xffe2bd, 34, 14, 1.6);
  roomLight.position.set(0, LEVEL.ceiling - 0.6, -2.8);
  scene.add(roomLight);

  // ---- anchors of the labels: each on its machine, placed so that « all labels » keep apart at 1280 (a search over the part's own surface, `docs/3d.md`). The silo's frame.
  const anchors: Record<string, THREE.Object3D> = {};
  const at = (id: PlantId, x: number, y: number, z: number) => {
    anchors[id] = anchor(equipment.roots[id], x, y, z, `${id}-label`);
  };
  at('lv-switchboard', -6.19, 8.57, -0.56);
  at('resistor-bank', -3.85, 10.65, -1.83);
  at('charge-blower', -3.77, 9.43, -5.02);
  at('air-water-exchanger', 3.76, 9.37, -1.53);
  at('dh-pump', 1.7, 8.69, -5.73);
  at('heater-controller', -5.9, 10.22, -2.6);
  at('discharge-blower', 4.56, 8.26, -3.92);
  at('blower-drive', -0.82, 9.61, -6.28);
  at('charge-damper', 0.65, 9.08, -0.42);
  at('discharge-damper', -0.57, 8.43, -1.39);
  at('hot-air-duct', 2.15, 8.13, -0.2);
  at('cold-air-duct', -4.35, 8.69, -2.35);
  at('heat-meter', 3.87, 10.88, -4.49);
  at('expansion-vessel', 1.54, 8.12, -5.12);
  at('control-cabinet', 0.05, 10.12, -6.8);
  anchors['hot-air-duct#scale'] = scale.anchorAt(300);

  for (const id of PLANT_PARTS) registry.add(id, equipment.roots[id], V(...EXPLODE[id]));
  // small machines with some of the room around them: a meter does not fill the screen
  const W = PLANT.water;
  const meterY = LEVEL.floor + W.highY;
  registry.setFocus(
    'heat-meter',
    new THREE.Box3(
      V(W.supplyX - 0.9, meterY - 1.1, PLANT.meter.z - 0.8),
      V(W.supplyX + 0.9, meterY + 0.4, PLANT.meter.z + 0.8),
    ),
  );
  const PU = PLANT.pump;
  registry.setFocus(
    'dh-pump',
    new THREE.Box3(V(PU.x - 1.3, LEVEL.floor, PU.z - 0.7), V(PU.x + 0.7, LEVEL.floor + 1, PU.z + 0.7)),
  );
  // the overview holds the coloured section too, which is scenery here, so that it clears the toolbar
  registry.overviewExtra = new THREE.Box3(V(0, 4, 0), V(7, LEVEL.floor, 3.5));

  // ---- « Flux »: the current, the air and the water, each in the colour of the model's temperature; the current in orange
  const dots = (color: number, size: number, n: number): FlowDots => {
    const f = new FlowDots(n, { color, size, pixels: true, throughWalls: true, opacity: 0.95 });
    scene.add(f.object);
    return f;
  };
  const P = equipment.paths;
  const current = dots(0xffb24d, 5, 60);
  const iCurrent = current.addPath(P.current, 48);
  // the air is hot from the resistors on: through the blower and up to the bank it is still the air back from the stone
  const chargeHot = dots(0xff6a2a, 7, 90);
  const iChargeHot = chargeHot.addPath(P.chargeHot.slice(2), 32);
  const iChargeDown = P.chargeDown.map((p) => chargeHot.addPath(p, 14));
  const chargeBack = dots(0xffb24d, 7, 90);
  const iChargeBack = chargeBack.addPath([...P.chargeBack, ...P.chargeHot.slice(1, 3)], 48);
  const iChargeUp = P.chargeUp.map((p) => chargeBack.addPath(p, 14));
  const dischargeHot = dots(0xff8a3d, 7, 90);
  const iDischargeHot = dischargeHot.addPath(P.dischargeHot, 40);
  const iDischargeUp = P.dischargeUp.map((p) => dischargeHot.addPath(p, 14));
  const dischargeCold = dots(0x3f8fd6, 7, 90);
  const iDischargeCold = dischargeCold.addPath(P.dischargeCold, 40);
  const iDischargeDown = P.dischargeDown.map((p) => dischargeCold.addPath(p, 14));
  const waterCold = dots(0x2f8fe8, 6, 70);
  const iWaterIn = waterCold.addPath(P.waterIn, 60);
  const waterHot = dots(0xe8452a, 6, 60);
  const iWaterOut = waterHot.addPath(P.waterOut, 40);
  const all = { current, chargeHot, chargeBack, dischargeHot, dischargeCold, waterCold, waterHot };
  const dot = new THREE.Color();
  const damperDrawn = { charge: [0, 0, 0], discharge: [0, 0, 0] };

  const mod: PlantRoomScene = {
    id: 'plant-room',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors) as Hotspot[],
    equipment,
    dressing,
    scale,
    body,
    risers,
    field,
    cut,
    flows: all,
    scenery: () => [shell, dressing.group, ...SERVICE_PARTS.map((id) => equipment.services[id])],
    // from high up on the side of the door: at this height the machines stop hiding one another and the section still reads
    home: { position: V(1.6, 30, 9.3), target: V(0, 9.1, -2.6) },
    minDistance: 1.6,
    maxDistance: 70,
    // about 24 m at 1280, for a box that now reaches down into the section
    homePadding: 0.85,
    update(s, dt, view) {
      for (const run of services) {
        const d = registry.get(run.part)!.display;
        if (d === run.shown) continue;
        run.shown = d;
        for (const m of run.meshes) {
          m.visible = d !== 'hidden';
          m.material = d === 'ghost' ? GHOST : d === 'wire' ? GHOST_WIRE : run.solid.get(m)!;
          m.castShadow = d === 'solid';
        }
      }
      stone.value = opts.medium?.() ?? 'soapstone';
      reveal.update(stone.value, dt);
      field.update(s, dt);
      cut.update('wedge', null);
      driveEquipment(equipment, s, dt, damperDrawn);
      const show = view.schematic;
      const chargeOn = s.chargeFlow > 1e-3 && s.heater > 1;
      const dischargeOn = s.dischargeFlow > 1e-3;
      current.object.visible = show && s.heater > 1;
      chargeHot.object.visible = chargeBack.object.visible = show && chargeOn;
      dischargeHot.object.visible = dischargeCold.object.visible = show && dischargeOn;
      waterCold.object.visible = waterHot.object.visible = show && s.waterFlow > 1e-3;
      if (!show) return;
      const vCharge = 0.6 + 1.4 * s.chargeBlower;
      const vDischarge = 0.6 + 1.4 * s.dischargeBlower;
      current.advance(iCurrent, 1.2 + (2 * s.heater) / 1e6, dt);
      chargeHot.advance(iChargeHot, vCharge, dt);
      chargeBack.advance(iChargeBack, vCharge, dt);
      dischargeHot.advance(iDischargeHot, vDischarge, dt);
      dischargeCold.advance(iDischargeCold, vDischarge, dt);
      s.zones.forEach((z, i) => {
        const c = z.mode === 'charge' ? vCharge : 0;
        const d = z.mode === 'discharge' ? vDischarge : 0;
        chargeHot.advance(iChargeDown[i], c, dt);
        chargeBack.advance(iChargeUp[i], c, dt);
        dischargeHot.advance(iDischargeUp[i], d, dt);
        dischargeCold.advance(iDischargeDown[i], d, dt);
      });
      const vWater = 0.5 + (0.9 * s.waterFlow) / 6;
      waterCold.advance(iWaterIn, vWater, dt);
      waterHot.advance(iWaterOut, vWater, dt);
      chargeHot.material.color.copy(heatColor(s.airHot, dot));
      chargeBack.material.color.copy(heatColor(s.chargeReturnT, dot));
      dischargeHot.material.color.copy(heatColor(s.exchangerAirIn, dot));
      dischargeCold.material.color.copy(heatColor(s.exchangerAirOut, dot));
      waterHot.material.color.copy(heatColor(s.supplyT, dot));
      waterCold.material.color.copy(heatColor(s.returnT, dot));
      for (const f of Object.values(all)) f.place();
    },
  };
  return mod;
}
