import * as THREE from 'three';
import { PAPER_STUDIO, PartRegistry, mesh } from '@onigam/lab-kit/three';
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
  buildEquipment,
  driveEquipment,
  plantMaterials,
  type EquipmentPieces,
  type PlantId,
} from '../machine/equipment';
import { buildRoomDressing, type RoomDressing } from '../machine/room';
import { bodyMaterials, buildBody, buildWallRisers, type BodyPieces, type WallRisers } from '../machine/silo';
import { mergeStatic } from '../merge';
import { anchor, hotspots, workshopScene, type HotspotDef } from '../world';

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
  'charge-damper': [0, 1.3, 1.5],
  'discharge-damper': [0, 2.3, 2],
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

export interface PlantRoomScene extends SceneModule<SandState> {
  equipment: EquipmentPieces;
  dressing: RoomDressing;
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
            bool facing = dot( normalize( vDollW.xz ), normalize( cameraPosition.xz ) ) > 0.62;
            if ( front || facing || vDollW.y > ${(LEVEL.ceiling - 0.02).toFixed(2)} ) discard;
          }
        }`,
      );
  };
  const key = mat.customProgramCacheKey.bind(mat);
  mat.customProgramCacheKey = () => `${key()}|doll`;
  return mat;
}

export function createPlantRoomScene(opts: PlantRoomOptions = {}): PlantRoomScene {
  const scene = workshopScene({
    name: 'plant-room',
    fog: [52, 59],
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

  const registry = new PartRegistry();
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
  const dressing = buildRoomDressing(pmats);
  scene.add(dressing.group);
  mergeStatic(dressing.group, { name: 'dressing', scope: 'plant-room' });

  // a warm light in the room, under the ceiling
  const roomLight = new THREE.PointLight(0xffe2bd, 34, 14, 1.6);
  roomLight.position.set(0, LEVEL.ceiling - 0.6, -2.8);
  scene.add(roomLight);

  // ---- anchors of the labels: over each machine
  const anchors: Record<string, THREE.Object3D> = {};
  const at = (id: PlantId, x: number, y: number, z: number) => {
    anchors[id] = anchor(equipment.roots[id], x, LEVEL.floor + y, z, `${id}-label`);
  };
  const sw = PLANT.switchboard;
  const ct = PLANT.controller;
  at('lv-switchboard', sw.x + sw.d + 0.05, 1.3, sw.z + 0.4);
  at('heater-controller', ct.x + ct.d + 0.05, 2.3, ct.z);
  at('resistor-bank', PLANT.bank.x + 0.6, PLANT.bank.y + 0.2, (PLANT.bank.z0 + PLANT.bank.z1) / 2);
  at('charge-blower', PLANT.chargeBlower.x + 0.3, 2.9, PLANT.chargeBlower.z);
  at('discharge-blower', PLANT.dischargeBlower.x - 0.1, 2.2, PLANT.dischargeBlower.z);
  at('blower-drive', PLANT.drive.x, 2.05, PLANT.drive.z + PLANT.drive.d);
  at('control-cabinet', PLANT.control.x, 2.05, PLANT.control.z + PLANT.control.d);
  at('charge-damper', PLANT.zoneX[1] - PLANT.pairHalf, PLANT.branch.feedHigh + 0.27, PLANT.damper.nearZ);
  at('discharge-damper', PLANT.zoneX[2] + PLANT.pairHalf, PLANT.branch.backHigh + 0.27, PLANT.damper.farZ);
  at('hot-air-duct', 0.8, PLANT.header.hot.y + 0.1, PLANT.header.hot.z + 0.25);
  at('cold-air-duct', -1.2, PLANT.header.back.y, PLANT.header.back.z + 0.38);
  at('air-water-exchanger', 3.2, PLANT.exchanger.y + 0.75, PLANT.exchanger.z);
  at('dh-pump', PLANT.pump.x + 0.2, 3.1, PLANT.pump.z);
  at('heat-meter', PLANT.water.supplyX, PLANT.water.highY - 0.3, PLANT.meter.z);
  at('expansion-vessel', PLANT.vessel.x, PLANT.vessel.h + 0.1, PLANT.vessel.z);

  for (const id of PLANT_PARTS) registry.add(id, equipment.roots[id], V(...EXPLODE[id]));

  // ---- « Flux »: the current, the air and the water, each in the colour of the model's temperature; the current in orange
  const dots = (color: number, size: number, n: number): FlowDots => {
    const f = new FlowDots(n, { color, size, pixels: true, throughWalls: true, opacity: 0.95 });
    scene.add(f.object);
    return f;
  };
  const P = equipment.paths;
  const current = dots(0xffb24d, 5, 60);
  const iCurrent = current.addPath(P.current, 48);
  const chargeHot = dots(0xff6a2a, 7, 90);
  const iChargeHot = chargeHot.addPath(P.chargeHot, 40);
  const iChargeDown = P.chargeDown.map((p) => chargeHot.addPath(p, 14));
  const chargeBack = dots(0xffb24d, 7, 90);
  const iChargeBack = chargeBack.addPath(P.chargeBack, 40);
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
    body,
    risers,
    field,
    cut,
    flows: all,
    scenery: () => [shell, dressing.group],
    home: { position: V(2.5, 20.5, 16), target: V(0, 9.1, -2.6) },
    minDistance: 1.6,
    maxDistance: 50,
    homePadding: 0.92,
    update(s, dt, view) {
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
