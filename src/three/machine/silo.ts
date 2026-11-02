import * as THREE from 'three';
import { mesh } from '@onigam/lab-kit/three';
import { TAU, box, discY, joined, ringY, stick, v3 } from '../common';
import { AZIMUTH, CABLE_RISER, DEG, LADDER, LANCES, LEVEL, RISERS, SILO, VENT, WALL, wallPoint } from '../dims';
import type { Poly } from '../cut';
import { clayBlockMap, concreteMap, tiled, treadMap, woolMap } from '../textures';

// The silo itself, one function: slab, base insulation, shell, wall insulation, cladding, bed, top insulation, deck, roof, the two openings, the ladder, the lances; and the two
// water pipes and the cable riser on its wall. The `silo` and `plant-room` worlds build it in place; the `site` world builds the outside of the same function and moves it
// (a test compares them part by part to within 3 mm). Each piece also says its section (`sections`), the polygons of the caps, in (radius, y).

export const SILO_PARTS = [
  'foundation-slab',
  'base-insulation',
  'inner-shell',
  'wall-insulation',
  'outer-cladding',
  'storage-bed',
  'pipe-field',
  'top-insulation',
  'equipment-floor',
  'conical-roof',
  'upper-vent',
  'access-ladder',
  'thermocouple-lance',
  'duct-penetration',
] as const;
export type SiloPartId = (typeof SILO_PARTS)[number];

/** The pieces of the body drawn by `buildBody`: everything but the bed, the pipes, the penetrations and the equipment, which have their own builders. */
export type BodyId = Exclude<SiloPartId, 'storage-bed' | 'pipe-field' | 'duct-penetration'>;

/** A group turned to an azimuth of the wall: its local +X is the radial direction outward, +Z the direction of rising azimuth. */
export function atAzimuth(azDeg: number): THREE.Group {
  const g = new THREE.Group();
  g.rotation.y = -azDeg * DEG;
  return g;
}

export interface BodyMaterials {
  concrete: THREE.MeshStandardMaterial;
  clayBlock: THREE.MeshStandardMaterial;
  wool: THREE.MeshStandardMaterial;
  shell: THREE.MeshStandardMaterial;
  cladding: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  rafter: THREE.MeshStandardMaterial;
  deck: THREE.MeshStandardMaterial;
  liner: THREE.MeshStandardMaterial;
  galvanised: THREE.MeshStandardMaterial;
  ladder: THREE.MeshStandardMaterial;
  louvre: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  jacket: THREE.MeshStandardMaterial;
  bandHot: THREE.MeshStandardMaterial;
  bandCold: THREE.MeshStandardMaterial;
  door: THREE.MeshStandardMaterial;
  lance: THREE.MeshStandardMaterial;
  cableDuct: THREE.MeshStandardMaterial;
}

/** New materials per call: a world that cuts its materials must not cut another's. */
export function bodyMaterials(): BodyMaterials {
  const std = (color: number, roughness: number, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  return {
    concrete: std(0xffffff, 0.95, 0, { map: tiled(concreteMap(), 0.45) }),
    clayBlock: std(0xffffff, 0.98, 0, { map: tiled(clayBlockMap(), 0.5) }),
    wool: std(0xffffff, 0.98, 0, { map: tiled(woolMap(), 1.6) }),
    shell: std(0x6d7379, 0.5, 0.75),
    // ribbed dark cladding (S14); warm enough to take the light, not black
    cladding: std(0x45484b, 0.56, 0.45),
    roof: std(0x4b4d4f, 0.62, 0.35),
    rafter: std(0x6a6d70, 0.6, 0.5),
    deck: std(0xffffff, 0.6, 0.5, { map: tiled(treadMap(), 16) }),
    liner: std(0x8d8f88, 0.9),
    galvanised: std(0x9aa0a5, 0.48, 0.8),
    ladder: std(0xb4babf, 0.42, 0.82),
    louvre: std(0x64686c, 0.5, 0.6),
    dark: std(0x1f2224, 0.8, 0.2),
    jacket: std(0xb0b5b9, 0.42, 0.7),
    bandHot: std(0xb5362b, 0.5, 0.1),
    bandCold: std(0x2d62a8, 0.5, 0.1),
    door: std(0x5a6066, 0.55, 0.45),
    lance: std(0xd7dade, 0.25, 1),
    cableDuct: std(0x83898e, 0.5, 0.75),
  };
}

// ------------------------------------------------------------------------------------------------ cladding and roof geometry

/** The ribbed wall: pans and ribs around the circle, flat-shaded quads. One sheet, its section in the cap. */
export function ribbedWall(rOut: number, depth: number, y0: number, y1: number, ribs: number): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const rIn = rOut - depth;
  // a rib and its pan as fractions of the pitch: pan, up, top, down
  const stops: [number, number][] = [
    [0, rIn],
    [0.74, rIn],
    [0.8, rOut],
    [0.94, rOut],
    [1, rIn],
  ];
  const p = (a: number, r: number, y: number) => [Math.cos(a) * r, y, Math.sin(a) * r];
  for (let i = 0; i < ribs; i++) {
    for (let k = 0; k < stops.length - 1; k++) {
      const a0 = ((i + stops[k][0]) / ribs) * TAU;
      const a1 = ((i + stops[k + 1][0]) / ribs) * TAU;
      const r0 = stops[k][1];
      const r1 = stops[k + 1][1];
      const A = p(a0, r0, y0);
      const B = p(a1, r1, y0);
      const C = p(a1, r1, y1);
      const D = p(a0, r0, y1);
      const e1 = v3(B[0] - A[0], 0, B[2] - A[2]);
      const n = v3(0, 1, 0).cross(e1).normalize();
      if (n.x * A[0] + n.z * A[2] < 0) n.negate();
      // outward: A, C, B and A, D, C
      for (const q of [A, D, C, A, C, B]) {
        pos.push(q[0], q[1], q[2]);
        nor.push(n.x, n.y, n.z);
        uv.push(0, 0);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

/** Height of the cone of the roof at a radius. */
export function roofHeight(r: number): number {
  const { eaveR, hubR, hubH } = SILO.roof;
  const t = (eaveR - r) / (eaveR - hubR);
  return LEVEL.eaves + t * (SILO.totalHeight - hubH - LEVEL.eaves);
}

// ------------------------------------------------------------------------------------------------ the body

export interface BodyPieces {
  groups: Record<BodyId, THREE.Group>;
  /** Polygons of each piece's section, (radius, y), with the material of each set. */
  sections: Partial<Record<BodyId, { polys: Poly[]; material: THREE.Material }[]>>;
  /** Thin strips on the section planes: the lances. */
  lanceStrips: { onX: [number, number][]; onZ: [number, number][] };
  /** Where the lances' feet are: their bottom end (test). */
  lanceTips: THREE.Vector3[];
  /** Foot of the ladder and of its landing. */
  ladderFootY: number;
  /** What the door of the landing and the ladder touch (tests). */
  ladderTopY: number;
}

export interface BodyOptions {
  /** Draw the inside (shell, insulation, deck, lances)? The `site` world draws the outside only; what it draws is the same. */
  inside: boolean;
}

export function buildBody(mats: BodyMaterials, opts: BodyOptions = { inside: true }): BodyPieces {
  const groups = {} as Record<BodyId, THREE.Group>;
  for (const id of SILO_PARTS) {
    if (id === 'storage-bed' || id === 'pipe-field' || id === 'duct-penetration') continue;
    const g = new THREE.Group();
    g.name = id;
    groups[id] = g;
  }
  const sections: BodyPieces['sections'] = {};

  // ---- the slab: 16 m across, on the ground (a low bevel on its edge)
  const slab = groups['foundation-slab'];
  slab.add(mesh(discY(SILO.slabR, LEVEL.ground, LEVEL.slabTop, 96), mats.concrete));
  sections['foundation-slab'] = [
    {
      polys: [
        [
          [0, LEVEL.ground],
          [SILO.slabR, LEVEL.ground],
          [SILO.slabR, LEVEL.slabTop],
          [0, LEVEL.slabTop],
        ],
      ],
      material: mats.concrete,
    },
  ];

  if (opts.inside) {
    // ---- base insulation: a layer of light blocks on the slab, under the stone and the wall insulation
    const base = groups['base-insulation'];
    base.add(mesh(discY(WALL.insulationOut, LEVEL.slabTop, LEVEL.bedBottom, 96), mats.clayBlock));
    sections['base-insulation'] = [
      {
        polys: [
          [
            [0, LEVEL.slabTop],
            [WALL.insulationOut, LEVEL.slabTop],
            [WALL.insulationOut, LEVEL.bedBottom],
            [0, LEVEL.bedBottom],
          ],
        ],
        material: mats.clayBlock,
      },
    ];

    // ---- the shell: a thin steel wall from the base insulation to the deck, with stiffener rings
    const shell = groups['inner-shell'];
    const shellParts = [ringY(WALL.shellIn, WALL.shellOut, LEVEL.bedBottom, LEVEL.deckBottom, 96)];
    for (const y of [2.4, 3.9, 5.4, 6.9]) shellParts.push(ringY(WALL.shellOut, WALL.shellOut + 0.03, y, y + 0.08, 96));
    shell.add(mesh(joined(shellParts), mats.shell));
    sections['inner-shell'] = [
      {
        polys: [
          [
            [WALL.shellIn, LEVEL.bedBottom],
            [WALL.shellOut, LEVEL.bedBottom],
            [WALL.shellOut, LEVEL.deckBottom],
            [WALL.shellIn, LEVEL.deckBottom],
          ],
        ],
        material: mats.shell,
      },
    ];

    // ---- wall insulation: between the shell and the cladding, up to the deck
    const wool = groups['wall-insulation'];
    wool.add(mesh(ringY(WALL.shellOut, WALL.insulationOut, LEVEL.bedBottom, LEVEL.deckBottom, 96), mats.wool));
    sections['wall-insulation'] = [
      {
        polys: [
          [
            [WALL.shellOut, LEVEL.bedBottom],
            [WALL.insulationOut, LEVEL.bedBottom],
            [WALL.insulationOut, LEVEL.deckBottom],
            [WALL.shellOut, LEVEL.deckBottom],
          ],
        ],
        material: mats.wool,
      },
    ];

    // ---- top insulation: on the stone, inside the shell, under the deck
    const top = groups['top-insulation'];
    top.add(mesh(discY(WALL.shellIn, LEVEL.bedTop, LEVEL.deckBottom, 96), mats.wool));
    sections['top-insulation'] = [
      {
        polys: [
          [
            [0, LEVEL.bedTop],
            [WALL.shellIn, LEVEL.bedTop],
            [WALL.shellIn, LEVEL.deckBottom],
            [0, LEVEL.deckBottom],
          ],
        ],
        material: mats.wool,
      },
    ];

    // ---- the deck, the wall of the room, its ceiling: the equipment floor (the equipment is added by its own builder)
    const floor = groups['equipment-floor'];
    floor.add(mesh(discY(WALL.insulationOut, LEVEL.deckBottom, LEVEL.floor, 96), mats.deck));
    floor.add(mesh(ringY(WALL.roomIn, WALL.roomIn + SILO.roomWallT, LEVEL.floor, LEVEL.ceiling, 96), mats.liner));
    floor.add(mesh(discY(WALL.roomIn + SILO.roomWallT, LEVEL.ceiling, LEVEL.ceiling + 0.04, 96), mats.liner));
    sections['equipment-floor'] = [
      {
        polys: [
          [
            [0, LEVEL.deckBottom],
            [WALL.insulationOut, LEVEL.deckBottom],
            [WALL.insulationOut, LEVEL.floor],
            [0, LEVEL.floor],
          ],
        ],
        material: mats.galvanised,
      },
      {
        polys: [
          [
            [WALL.roomIn, LEVEL.floor],
            [WALL.roomIn + SILO.roomWallT, LEVEL.floor],
            [WALL.roomIn + SILO.roomWallT, LEVEL.ceiling + 0.04],
            [0, LEVEL.ceiling + 0.04],
            [0, LEVEL.ceiling],
            [WALL.roomIn, LEVEL.ceiling],
          ],
        ],
        material: mats.liner,
      },
    ];

    // ---- the lances: from their head on the deck, through the deck and the insulation, into the stone
    const lances = groups['thermocouple-lance'];
    const parts: THREE.BufferGeometry[] = [];
    const conduit: THREE.BufferGeometry[] = [];
    const add = (x: number, z: number, depth: number) => {
      const tip = LEVEL.bedTop - depth;
      parts.push(stick(v3(x, tip, z), v3(x, LEVEL.floor + 0.18, z), LANCES.r, 8));
      // the head: a small terminal on a flange that bolts to the deck
      parts.push(discY(LANCES.headR * 1.6, LEVEL.floor, LEVEL.floor + 0.012, 14).translate(x, 0, z));
      parts.push(discY(LANCES.headR, LEVEL.floor + 0.18, LEVEL.floor + 0.27, 12).translate(x, 0, z));
      conduit.push(stick(v3(x, LEVEL.floor + 0.27, z), v3(x, LEVEL.floor + 0.34, z), 0.014, 6));
    };
    for (const [r, d] of LANCES.onX) add(r, 0, d);
    for (const [r, d] of LANCES.onZ) add(0, r, d);
    lances.add(mesh(joined(parts), mats.lance));
    lances.add(mesh(joined(conduit), mats.dark));
  } else {
    // the site has no interior: its deck is out of sight
    for (const id of ['base-insulation', 'inner-shell', 'wall-insulation', 'top-insulation'] as const)
      groups[id].clear();
  }

  // ---- the cladding: ribbed sheets, a flashing at the foot and a band of sheet joints
  const cladding = groups['outer-cladding'];
  cladding.add(mesh(ribbedWall(SILO.outerR, SILO.ribDepth, LEVEL.slabTop, LEVEL.eaves, SILO.ribs), mats.cladding));
  const flashing = new THREE.LatheGeometry(
    [
      [SILO.outerR + 0.1, LEVEL.slabTop],
      [SILO.outerR + 0.1, LEVEL.slabTop + 0.05],
      [SILO.outerR + 0.015, LEVEL.slabTop + 0.3],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    96,
  );
  cladding.add(mesh(flashing, mats.louvre));
  cladding.add(mesh(ringY(SILO.outerR - 0.002, SILO.outerR + 0.02, LEVEL.eaves - 0.2, LEVEL.eaves, 96), mats.louvre));
  sections['outer-cladding'] = [
    {
      polys: [
        [
          [SILO.outerR - SILO.claddingT, LEVEL.slabTop],
          [SILO.outerR, LEVEL.slabTop],
          [SILO.outerR, LEVEL.eaves],
          [SILO.outerR - SILO.claddingT, LEVEL.eaves],
        ],
      ],
      material: mats.cladding,
    },
  ];

  // ---- the roof: a low cone, standing seams, rafters under it, a ring at the eaves, a hub in the middle with its cowl
  const roof = groups['conical-roof'];
  const { eaveR, hubR, hubH, seams, thick } = SILO.roof;
  const hubFoot = roofHeight(hubR);
  const skin = new THREE.LatheGeometry(
    [
      [eaveR, LEVEL.eaves - 0.04],
      [eaveR, LEVEL.eaves],
      [hubR, hubFoot],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    96,
  );
  // LatheGeometry's normals on the top of the cone face up when the points run outside to in
  roof.add(mesh(skin, mats.roof));
  const under = new THREE.LatheGeometry(
    [
      [hubR, hubFoot - thick],
      [eaveR - 0.1, LEVEL.eaves - 0.04],
      [eaveR, LEVEL.eaves - 0.04],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    96,
  );
  roof.add(mesh(under, mats.rafter));
  const seamGeos: THREE.BufferGeometry[] = [];
  const seamLen = Math.hypot(eaveR - hubR, hubFoot - LEVEL.eaves);
  const slope = Math.atan2(hubFoot - LEVEL.eaves, eaveR - hubR);
  for (let i = 0; i < seams; i++) {
    const a = (i / seams) * TAU;
    const s = new THREE.BoxGeometry(seamLen, 0.05, 0.03);
    s.rotateZ(-slope + Math.PI);
    s.translate((eaveR + hubR) / 2, (LEVEL.eaves + hubFoot) / 2 + 0.02, 0);
    s.rotateY(a);
    seamGeos.push(s);
  }
  roof.add(mesh(joined(seamGeos), mats.roof));
  // the hub: a low drum and a cap
  roof.add(mesh(discY(hubR, hubFoot - 0.02, SILO.totalHeight - 0.03, 40), mats.roof));
  roof.add(mesh(discY(hubR + 0.04, SILO.totalHeight - 0.03, SILO.totalHeight, 40), mats.louvre));
  if (opts.inside) {
    // the rafters: from the wall of the room to the hub, and the ring beam that carries them
    const rafters: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      const r0 = SILO.outerR - 0.1;
      const r1 = hubR;
      const A = v3(Math.cos(a) * r0, roofHeight(r0) - 0.08, Math.sin(a) * r0);
      const B = v3(Math.cos(a) * r1, roofHeight(r1) - 0.08, Math.sin(a) * r1);
      rafters.push(stick(A, B, 0.05, 6));
    }
    // the ring beam, on the wall and above the ceiling: nothing shows through into the room
    rafters.push(ringY(SILO.outerR - 0.18, SILO.outerR - 0.05, LEVEL.ceiling + 0.04, LEVEL.eaves + 0.02, 96));
    roof.add(mesh(joined(rafters), mats.rafter));
  }
  sections['conical-roof'] = [
    {
      polys: [
        [
          [eaveR, LEVEL.eaves - 0.04],
          [eaveR, LEVEL.eaves],
          [hubR, hubFoot],
          [hubR, SILO.totalHeight - hubH + 0.17],
          [hubR + 0.04, SILO.totalHeight - 0.03],
          [hubR + 0.04, SILO.totalHeight],
          [0, SILO.totalHeight],
          [0, SILO.totalHeight - 0.1],
          [hubR - 0.1, SILO.totalHeight - 0.1],
          [hubR - 0.1, hubFoot - thick],
          [eaveR - 0.1, LEVEL.eaves - 0.04],
        ],
      ],
      material: mats.rafter,
    },
  ];

  // ---- the high openings: a louvre with its frame, flush with the ribs; dark behind the slats
  const vent = groups['upper-vent'];
  for (const az of AZIMUTH.vents) {
    const g = atAzimuth(az);
    const R = SILO.outerR;
    const parts: THREE.BufferGeometry[] = [];
    const W = VENT.width;
    const H = VENT.height;
    const D = VENT.depth;
    // frame (reaches back into the ribs: it stands on the cladding)
    parts.push(box(R + D / 2 - 0.05, VENT.y + H / 2 + 0.03, 0, D, 0.06, W + 0.06));
    parts.push(box(R + D / 2 - 0.05, VENT.y - H / 2 - 0.03, 0, D, 0.06, W + 0.06));
    parts.push(box(R + D / 2 - 0.05, VENT.y, W / 2 + 0.03, D, H, 0.06));
    parts.push(box(R + D / 2 - 0.05, VENT.y, -W / 2 - 0.03, D, H, 0.06));
    // slats, tilted
    const slats: THREE.BufferGeometry[] = [];
    for (let i = 0; i < VENT.slats; i++) {
      const y = VENT.y - H / 2 + (i + 0.5) * (H / VENT.slats);
      const s = new THREE.BoxGeometry(D * 0.9, 0.012, W);
      s.rotateZ(-0.62);
      s.translate(R + D / 2 - 0.04, y, 0);
      slats.push(s);
    }
    g.add(mesh(joined(parts), mats.louvre));
    g.add(mesh(joined(slats), mats.galvanised));
    g.add(mesh(box(R - 0.012, VENT.y, 0, 0.02, H, W), mats.dark));
    vent.add(g);
  }

  // ---- the caged ladder and the landing at the door
  const ladder = groups['access-ladder'];
  const lg = atAzimuth(AZIMUTH.ladder);
  const footY = LEVEL.slabTop;
  const topRail = LADDER.landingY + LADDER.railH;
  const rx = SILO.outerR + LADDER.standoff;
  const w = LADDER.width / 2;
  const steel: THREE.BufferGeometry[] = [];
  // rails from the ledge of the slab
  for (const z of [-w, w]) steel.push(stick(v3(rx, footY, z), v3(rx, topRail, z), 0.022, 8));
  // rungs
  for (let y = footY + LADDER.rungEvery; y < LADDER.landingY + 0.2; y += LADDER.rungEvery)
    steel.push(stick(v3(rx, y, -w), v3(rx, y, w), 0.012, 6));
  // brackets to the wall, at the foot and every 2 m: they reach the ribs
  for (let y = footY + 1; y < LADDER.landingY; y += 2)
    for (const z of [-w, w]) steel.push(box((SILO.outerR + rx) / 2 - 0.01, y, z, LADDER.standoff + 0.04, 0.05, 0.03));
  // feet on the ledge
  for (const z of [-w, w]) steel.push(box(rx, footY + 0.006, z, 0.14, 0.012, 0.1));
  // the hoops of the cage, and five bars along them
  const hoopR = LADDER.hoopR;
  const hoops: THREE.BufferGeometry[] = [];
  const hoopTop = LADDER.landingY - 0.15;
  for (let y = LADDER.hoopFromY; y < hoopTop; y += LADDER.hoopEvery) {
    const t = new THREE.TorusGeometry(hoopR, 0.012, 6, 20, Math.PI);
    t.rotateX(Math.PI / 2);
    t.rotateY(Math.PI / 2);
    t.translate(rx + 0.02, y, 0);
    hoops.push(t);
    // the hoop's ends to the rails
    for (const z of [-w, w]) hoops.push(stick(v3(rx, y, z), v3(rx + 0.02, y, Math.sign(z) * hoopR), 0.012, 6));
  }
  for (let k = 0; k < 5; k++) {
    const a = ((k + 0.5) / 5) * Math.PI;
    const x = rx + 0.02 + Math.sin(a) * hoopR;
    const z = Math.cos(a) * hoopR;
    hoops.push(
      stick(
        v3(x, LADDER.hoopFromY, z),
        v3(x, hoopTop - ((hoopTop - LADDER.hoopFromY) % LADDER.hoopEvery), z),
        0.009,
        5,
      ),
    );
  }
  // the landing beside the ladder, at the door: a grating on brackets from the wall
  const lz0 = w + 0.04;
  const lz1 = lz0 + LADDER.landingW;
  const lr0 = SILO.outerR - 0.02;
  const lr1 = SILO.outerR + LADDER.landingD;
  const plat: THREE.BufferGeometry[] = [];
  plat.push(box((lr0 + lr1) / 2, LADDER.landingY - 0.03, (lz0 + lz1) / 2, lr1 - lr0, 0.06, lz1 - lz0));
  const gratingMat = mats.galvanised;
  // brackets under the landing: a strut from the wall to the outer edge
  for (const z of [lz0 + 0.15, lz1 - 0.15]) {
    plat.push(
      stick(v3(SILO.outerR - 0.01, LADDER.landingY - 1.05, z), v3(lr1 - 0.08, LADDER.landingY - 0.06, z), 0.03, 6),
    );
    plat.push(box((lr0 + lr1) / 2, LADDER.landingY - 0.09, z, lr1 - lr0, 0.06, 0.05));
  }
  // rails: posts and two runs around the landing, open towards the ladder and the door
  const rail: THREE.BufferGeometry[] = [];
  const pts: [number, number][] = [
    [lr1, lz0],
    [lr1, lz1],
    [lr0 + 0.02, lz1],
  ];
  for (const [r, z] of pts) rail.push(stick(v3(r, LADDER.landingY, z), v3(r, topRail, z), 0.02, 6));
  rail.push(stick(v3(lr1, LADDER.landingY, (lz0 + lz1) / 2), v3(lr1, topRail, (lz0 + lz1) / 2), 0.02, 6));
  for (const h of [topRail, LADDER.landingY + LADDER.railH / 2]) {
    rail.push(stick(v3(lr1, h, lz0 - 0.04), v3(lr1, h, lz1), 0.018, 6));
    rail.push(stick(v3(lr1, h, lz1), v3(lr0 + 0.02, h, lz1), 0.018, 6));
    // tied back to the top of the ladder's near rail
    if (h === topRail) rail.push(stick(v3(lr1, h, lz0 - 0.04), v3(rx, h, w), 0.018, 6));
  }
  // the door in the wall, on the landing
  const doorZ = (lz0 + lz1) / 2;
  const doorR = SILO.outerR - 0.035;
  const door: THREE.BufferGeometry[] = [
    box(doorR + 0.03, LADDER.landingY + LADDER.doorH / 2, doorZ, 0.08, LADDER.doorH, LADDER.doorW),
  ];
  const frame: THREE.BufferGeometry[] = [
    box(doorR + 0.04, LADDER.landingY + LADDER.doorH + 0.05, doorZ, 0.1, 0.1, LADDER.doorW + 0.2),
    box(doorR + 0.04, LADDER.landingY + LADDER.doorH / 2, doorZ - LADDER.doorW / 2 - 0.05, 0.1, LADDER.doorH, 0.1),
    box(doorR + 0.04, LADDER.landingY + LADDER.doorH / 2, doorZ + LADDER.doorW / 2 + 0.05, 0.1, LADDER.doorH, 0.1),
  ];
  lg.add(mesh(joined(steel), mats.ladder));
  lg.add(mesh(joined(hoops), mats.ladder));
  lg.add(mesh(joined(plat), gratingMat));
  lg.add(mesh(joined(rail), mats.ladder));
  lg.add(mesh(joined(door), mats.door));
  lg.add(mesh(joined(frame), mats.louvre));
  lg.add(
    mesh(
      stick(
        v3(doorR + 0.09, LADDER.landingY + 1.05, doorZ + 0.34),
        v3(doorR + 0.09, LADDER.landingY + 1.2, doorZ + 0.34),
        0.012,
        6,
      ),
      mats.lance,
    ),
  );
  ladder.add(lg);

  return {
    groups,
    sections,
    lanceStrips: {
      onX: LANCES.onX.map(([r, d]) => [r, d]),
      onZ: LANCES.onZ.map(([r, d]) => [r, d]),
    },
    lanceTips: [
      ...LANCES.onX.map(([r, d]) => v3(r, LEVEL.bedTop - d, 0)),
      ...LANCES.onZ.map(([r, d]) => v3(0, LEVEL.bedTop - d, r)),
    ],
    ladderFootY: footY,
    ladderTopY: topRail,
  };
}

// ------------------------------------------------------------------------------------------------ what comes down the wall

export interface WallRisers {
  /** The two clad pipes: supply first. */
  water: THREE.Group;
  cable: THREE.Group;
  /** Centre of the wall penetrations, in the silo frame. */
  waterTop: { supply: THREE.Vector3; ret: THREE.Vector3 };
  /** Where the pipes end at the bottom, below the ground, in the silo frame. */
  waterFoot: { supply: THREE.Vector3; ret: THREE.Vector3 };
  /** The polyline of each pipe from the wall to the foot, for the flows. */
  waterPath: { supply: THREE.Vector3[]; ret: THREE.Vector3[] };
  /** The end of the cable's stub at the slab's edge, the top where it goes through the wall. */
  cableFoot: THREE.Vector3;
  cableTop: THREE.Vector3;
  cablePath: THREE.Vector3[];
}

/** The water pipes and the cable riser on the wall, the same function in every world. */
export function buildWallRisers(mats: BodyMaterials): WallRisers {
  const water = new THREE.Group();
  water.name = 'dh-riser';
  const paths = { supply: [] as THREE.Vector3[], ret: [] as THREE.Vector3[] };
  const tops = {} as WallRisers['waterTop'];
  const feet = {} as WallRisers['waterFoot'];
  const jacket: THREE.BufferGeometry[] = [];
  const clamps: THREE.BufferGeometry[] = [];
  const bands: { hot: THREE.BufferGeometry[]; cold: THREE.BufferGeometry[] } = { hot: [], cold: [] };
  const sides: ['supply' | 'ret', number][] = [
    ['supply', AZIMUTH.water + AZIMUTH.waterSpread],
    ['ret', AZIMUTH.water - AZIMUTH.waterSpread],
  ];
  for (const [side, az] of sides) {
    const P = (r: number, y: number) => v3(...wallPoint(az, r, y));
    const pts = [
      P(WALL.roomIn + 0.02, RISERS.topY),
      P(RISERS.axisR, RISERS.topY),
      P(RISERS.axisR, RISERS.elbowY + 0.4),
      P(RISERS.outR, RISERS.elbowY - 0.15),
      P(RISERS.outR, RISERS.bottomY),
    ];
    const curve = new THREE.CurvePath<THREE.Vector3>();
    // straight runs and tight elbows
    const bend = 0.28;
    const seg = (a: THREE.Vector3, b: THREE.Vector3) => curve.add(new THREE.LineCurve3(a, b));
    let start = pts[0].clone();
    for (let i = 1; i < pts.length - 1; i++) {
      const dIn = pts[i].clone().sub(pts[i - 1]);
      const dOut = pts[i + 1].clone().sub(pts[i]);
      const r = Math.min(bend, dIn.length() / 2, dOut.length() / 2);
      const a = pts[i].clone().addScaledVector(dIn.normalize(), -r);
      const b = pts[i].clone().addScaledVector(dOut.normalize(), r);
      seg(start, a);
      curve.add(new THREE.QuadraticBezierCurve3(a, pts[i].clone(), b));
      start = b;
    }
    seg(start, pts[pts.length - 1]);
    jacket.push(new THREE.TubeGeometry(curve, 80, RISERS.jacketR, 16, false));
    paths[side] = curve.getPoints(14).map((p) => p.clone());
    tops[side] = pts[0].clone();
    feet[side] = pts[pts.length - 1].clone();
    // the wall sleeve where it comes through the cladding
    const sleeve = stick(
      P(SILO.outerR - 0.01, RISERS.topY),
      P(SILO.outerR + 0.06, RISERS.topY),
      RISERS.jacketR + 0.035,
      16,
    );
    clamps.push(sleeve);
    // clamps on the wall every 2.4 m (they reach the ribs), a coloured band on each pipe
    for (let y = RISERS.elbowY + 1.2; y < RISERS.topY - 0.5; y += RISERS.bracketEvery) {
      clamps.push(stick(P(RISERS.axisR, y - 0.03), P(RISERS.axisR, y + 0.03), RISERS.jacketR + 0.012, 16));
      clamps.push(stick(P(SILO.outerR - 0.012, y), P(RISERS.axisR, y), 0.024, 8));
      const b = stick(P(RISERS.axisR, y + 0.35), P(RISERS.axisR, y + 0.47), RISERS.jacketR + 0.004, 16);
      (side === 'supply' ? bands.hot : bands.cold).push(b);
    }
    // the sleeve where it goes into the ground
    clamps.push(stick(P(RISERS.outR, -0.06), P(RISERS.outR, 0.08), RISERS.jacketR + 0.05, 16));
  }
  water.add(mesh(joined(jacket), mats.jacket));
  water.add(mesh(joined(clamps), mats.galvanised));
  water.add(mesh(joined(bands.hot), mats.bandHot));
  water.add(mesh(joined(bands.cold), mats.bandCold));

  // ---- the cable riser: a closed steel duct on the wall, from a box on the ledge to the wall's top gland; a stub from the box to the slab's edge
  const cable = new THREE.Group();
  cable.name = 'cable-riser';
  const g = atAzimuth(AZIMUTH.cable);
  const R = SILO.outerR + CABLE_RISER.standoff + CABLE_RISER.depth / 2;
  const footY = LEVEL.slabTop + CABLE_RISER.boxH;
  const parts: THREE.BufferGeometry[] = [];
  parts.push(box(R, (footY + CABLE_RISER.topY) / 2, 0, CABLE_RISER.depth, CABLE_RISER.topY - footY, CABLE_RISER.width));
  // the top: it turns into the wall
  parts.push(box(R - 0.06, CABLE_RISER.topY, 0, 0.26, 0.24, CABLE_RISER.width + 0.06));
  // the box on the ledge: it stands on the slab
  parts.push(
    box(
      SILO.outerR + 0.02 + 0.13,
      LEVEL.slabTop + CABLE_RISER.boxH / 2,
      0,
      0.26,
      CABLE_RISER.boxH,
      CABLE_RISER.width + 0.14,
    ),
  );
  // the stub to the slab's edge
  parts.push(
    box((SILO.outerR + 0.28 + SILO.slabR) / 2, LEVEL.slabTop + 0.14, 0, SILO.slabR - SILO.outerR - 0.28, 0.2, 0.28),
  );
  // straps every 2.2 m, they touch the ribs
  const straps: THREE.BufferGeometry[] = [];
  for (let y = footY + 1; y < CABLE_RISER.topY - 0.6; y += CABLE_RISER.bracketEvery) {
    straps.push(box(R + CABLE_RISER.depth / 2 + 0.006, y, 0, 0.012, 0.05, CABLE_RISER.width + 0.08));
    straps.push(
      box((SILO.outerR + R) / 2 + 0.03, y, CABLE_RISER.width / 2 + 0.04, R - SILO.outerR + 0.14, 0.05, 0.012),
    );
    straps.push(
      box((SILO.outerR + R) / 2 + 0.03, y, -CABLE_RISER.width / 2 - 0.04, R - SILO.outerR + 0.14, 0.05, 0.012),
    );
  }
  g.add(mesh(joined(parts), mats.cableDuct));
  g.add(mesh(joined(straps), mats.galvanised));
  cable.add(g);
  const P = (r: number, y: number) => v3(...wallPoint(AZIMUTH.cable, r, y));
  const cableFoot = P(SILO.slabR, LEVEL.slabTop + 0.14);
  const cableTop = P(R - 0.19, CABLE_RISER.topY);
  return {
    water,
    cable,
    waterTop: tops,
    waterFoot: feet,
    waterPath: paths,
    cableFoot,
    cableTop,
    cablePath: [cableFoot.clone(), P(R, LEVEL.slabTop + 0.14), P(R, CABLE_RISER.topY), cableTop.clone()],
  };
}
