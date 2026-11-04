import * as THREE from 'three';
import { MAT, PAPER_STUDIO, mesh, rng } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule } from '@onigam/lab-kit/three';
import type { MediumId } from '../../sim/silo';
import type { SandState } from '../../sim/types';
import { FlowDots, box, joined, paperFloor } from '../common';
import { WedgeCut } from '../cut';
import { applyWear, contactShadow } from '../detail';
import { CELL, CELL_HALF, GRID, LEVEL, PIPE, SILO, ZONE_R } from '../dims';
import { STONE_LOOK, StoneReveal, heatColor, heatRampGlsl } from '../heat';
import {
  CELL_QUALITY,
  bendBlockGeometry,
  bendGeometry,
  headerGeometry,
  headerRuns,
  legGeometry,
  legsOf,
  loopGeometry,
  spacerGeometry,
  type UPipe,
} from '../machine/pipes';
import { mergeStatic } from '../merge';
import { buildHeatScale, type HeatScale } from '../scale';
import { FramedRegistry, anchor, hotspots, workshopScene, type HotspotDef } from '../world';

// The `pipe-cell` world: one block of the bed around a few pipes, then the grains. Two blocks about 2 m wide stand side by side, one from the core and one from the outer zone, on the
// base they stand on in the silo. A quarter of each is taken away, the section shows the U-pipes in the stone. The stone's colour is the fine profile the model gives around a
// pipe (`getPipeProfile`, the lines are every 20 K: you see the rings of heat around each pipe while it charges). The pipes are the silo's, from the same functions. On the table, two
// trays of grains, magnified: quartz sand and crushed soapstone.

export const CELL_PARTS = [
  'heat-pipe',
  'return-bend',
  'pipe-spacer',
  'branch-header',
  'expansion-loop',
  'core-zone',
  'outer-zone',
  'quartz-sand',
  'crushed-soapstone',
] as const;
export type CellPartId = (typeof CELL_PARTS)[number];

const HOTSPOTS: HotspotDef[] = [
  { id: 'core-zone', fr: 'Zone de cœur', en: 'Core zone' },
  { id: 'outer-zone', fr: 'Périphérie', en: 'Outer zone' },
  { id: 'heat-pipe', fr: 'Tube d’échange', en: 'Heat-transfer pipe' },
  { id: 'quartz-sand', fr: 'Sable de quartz', en: 'Quartz sand' },
  { id: 'crushed-soapstone', fr: 'Pierre ollaire', en: 'Soapstone' },
  // the scale of the false colour; a click selects the block
  { id: 'core-zone#scale', fr: '0 à 600 °C', en: '0 to 600 °C' },
  { id: 'expansion-loop', fr: 'Lyre de dilatation', en: 'Expansion loop', minor: true },
  { id: 'return-bend', fr: 'Coude de retour', en: 'Return bend', minor: true },
  { id: 'pipe-spacer', fr: 'Entretoise de tubes', en: 'Pipe spacer', minor: true },
  { id: 'branch-header', fr: 'Collecteur de branche', en: 'Branch header', minor: true },
];

/** Explode offsets: the pipes come out upwards, as they went in; the frames stay on their pipes; the blocks spread apart; the trays come forward. */
export const EXPLODE: Record<CellPartId, [number, number, number]> = {
  'heat-pipe': [0, 6.8, 0],
  'return-bend': [0, 6.5, 0],
  'pipe-spacer': [0, 6.9, 0.7],
  'branch-header': [0, 8.2, 0],
  'expansion-loop': [0, 7.6, 0],
  'core-zone': [-1.4, 0, 0],
  'outer-zone': [1.4, 0, 0],
  'quartz-sand': [-0.9, 0, 0.8],
  'crushed-soapstone': [0.9, 0, 0.8],
};

/** The legend stands on the paper, in line with the gap between the two blocks as the overview sees them: a short bar beside both their colours, in front of neither open quarter. */
export const SCALE = {
  x: 0.55,
  z: 2.15,
  baseY: 0,
  width: 0.26,
  depth: 0.05,
  y0: 0.32,
  y1: 2.1,
  footR: 0.24,
  yaw: 0.42,
};

export interface PipeCellOptions {
  /** The model's profile around a pipe: `SandSim.getPipeProfile`. */
  profile?: (ring: number, layer: number, points?: number) => { rho: number[]; T: number[]; wallT: number };
  medium?: () => MediumId;
}

export interface PipeCellScene extends SceneModule<SandState> {
  scale: HeatScale;
  cuts: { core: WedgeCut; outer: WedgeCut };
  /** The legs, bends and loops of the two blocks, as instance data (the tests read them). */
  layout: { core: UPipe[]; outer: UPipe[] };
  /** The fields around the pipes as they were last written: T(rho, layer) °C for each block. */
  profiles: { core: ProfileField; outer: ProfileField };
  scenery(): THREE.Object3D[];
  dots: FlowDots;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** The rings of the model where these blocks stand: mid-radius of the core zone and of the outer zone. */
export const RING_OF = {
  core: Math.floor((ZONE_R[0] * 0.5 * GRID.rings) / SILO.bedR),
  outer: Math.min(GRID.rings - 1, Math.floor((((ZONE_R[1] + ZONE_R[2]) / 2) * GRID.rings) / SILO.bedR)),
} as const;

const PROFILE_POINTS = 16;

/** The field around a pipe in a block: a little texture, rho across, layers up, values in °C. */
export class ProfileField {
  readonly data = new Uint16Array(PROFILE_POINTS * GRID.layers);
  readonly texture: THREE.DataTexture;
  rhoMax = 0.5;
  rhoMin: number = PIPE.r;
  writes = 0;

  constructor() {
    this.texture = new THREE.DataTexture(this.data, PROFILE_POINTS, GRID.layers, THREE.RedFormat, THREE.HalfFloatType);
    this.texture.magFilter = this.texture.minFilter = THREE.LinearFilter;
    this.texture.wrapS = this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texture.generateMipmaps = false;
    this.texture.needsUpdate = true;
  }

  write(layer: number, rho: number[], T: number[]): void {
    this.rhoMin = rho[0];
    this.rhoMax = rho[rho.length - 1];
    for (let i = 0; i < PROFILE_POINTS; i++)
      this.data[i + PROFILE_POINTS * layer] = THREE.DataUtils.toHalfFloat(T[Math.min(i, T.length - 1)]);
    this.writes++;
  }

  read(i: number, layer: number): number {
    return THREE.DataUtils.fromHalfFloat(this.data[i + PROFILE_POINTS * layer]);
  }
}

/**
 * The stone of a block: colour from the distance to the nearest pipe of the lattice and the height, so a section shows the rings of heat around the legs. The look of the stone under
 * it is the crushed look of the silo.
 */
function cellStoneMaterial(
  field: ProfileField,
  stone: { value: 'soapstone' | 'sand' },
  show: { value: number },
): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, side: THREE.DoubleSide });
  m.userData.noShare = true;
  m.userData.worn = true;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uProfile = { value: field.texture };
    shader.uniforms.uRho = { value: new THREE.Vector2(field.rhoMin, field.rhoMax) };
    shader.uniforms.uStoneMix = {
      get value() {
        return stone.value === 'sand' ? 1 : 0;
      },
    };
    shader.uniforms.uStoneShow = show;
    shader.uniforms.uStoneA = { value: new THREE.Color(STONE_LOOK.soapstone.color) };
    shader.uniforms.uStoneB = { value: new THREE.Color(STONE_LOOK.sand.color) };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCellW;\nvarying vec3 vCellO;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCellO = position;');
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      '#include <project_vertex>\nvCellW = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;',
    );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        varying vec3 vCellW;
        varying vec3 vCellO;
        uniform sampler2D uProfile;
        uniform vec2 uRho;
        uniform float uStoneMix;
        uniform float uStoneShow;
        uniform vec3 uStoneA;
        uniform vec3 uStoneB;
        ${heatRampGlsl()}
        vec2 clHash( vec2 p ) { p = vec2( dot( p, vec2( 127.1, 311.7 ) ), dot( p, vec2( 269.5, 183.3 ) ) ); return fract( sin( p ) * 43758.5453 ); }
        float clVor( vec2 x ) { vec2 n = floor( x ), f = fract( x ); float m = 8.0; for ( int j = -1; j <= 1; j++ ) for ( int i = -1; i <= 1; i++ ) { vec2 g = vec2( float( i ), float( j ) ); vec2 r = g + clHash( n + g ) - f; m = min( m, dot( r, r ) ); } return sqrt( m ); }
        vec3 gCellGlow;`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          // the nearest pipe of the lattice: the object's x and z in pitches
          vec2 q = vCellO.xz / ${PIPE.pitch.toFixed(4)} - vec2( 0.5, 0.0 );
          vec2 d = ( q - floor( q + 0.5 ) ) * ${PIPE.pitch.toFixed(4)};
          float rho = length( d );
          float u = clamp( ( rho - uRho.x ) / max( uRho.y - uRho.x, 1e-3 ), 0.0, 1.0 );
          float v = clamp( ( vCellO.y - ${LEVEL.bedBottom.toFixed(3)} ) / ${SILO.bedHeight.toFixed(3)}, 0.0, 1.0 );
          float T = texture2D( uProfile, vec2( u * ${((PROFILE_POINTS - 1) / PROFILE_POINTS).toFixed(5)} + ${(0.5 / PROFILE_POINTS).toFixed(5)}, v ) ).r;
          float tw = max( fwidth( T ), 1e-3 );
          float dd = abs( fract( T / 20.0 + 0.5 ) - 0.5 ) * 20.0 / tw;
          float iso = ( 1.0 - smoothstep( 0.4, 1.4, dd ) ) * ( 1.0 - smoothstep( 1.2, 3.2, tw ) );
          vec2 s = abs( vCellW.z ) < 1e-3 ? vCellO.xy : vCellO.zy;
          float cell = mix( 22.0, 55.0, uStoneMix );
          float cpp = length( fwidth( s * cell ) );
          float keep = 1.0 - smoothstep( 0.07, 0.2, cpp );
          float lump = clVor( s * cell );
          float grain = 1.0 + keep * ( mix( 0.34, 0.16, uStoneMix ) * ( 0.55 - lump ) );
          vec3 col = mix( heatRamp( T ) * ( 1.0 - 0.22 * iso ), mix( uStoneA, uStoneB, uStoneMix ), uStoneShow );
          diffuseColor.rgb = col * grain * mix( 0.72, 1.0, uStoneShow );
          gCellGlow = col * grain * 0.2 * ( 1.0 - uStoneShow );
        }`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += gCellGlow;`,
      );
  };
  m.customProgramCacheKey = () => 'cell-stone';
  return m;
}

/**
 * The U-pipes of a block: pairs along x, as in the field, three rows. The middle row lies on the plane z = 0 of the section: its legs stand half out of the coloured stone, with the
 * rings of heat around them.
 */
function blockPipes(): UPipe[] {
  const out: UPipe[] = [];
  const p = PIPE.pitch;
  for (const z of [-p, 0, p]) for (const x0 of [-1.5 * p, 0.5 * p]) out.push({ z, x0, x1: x0 + p, zone: 0 });
  return out;
}

/** Grains: a heap on a tray, instanced lumps, deterministic. */
function grains(
  count: number,
  size: number,
  angular: boolean,
  colours: number[],
  seed: number,
  mat: THREE.MeshStandardMaterial,
): THREE.InstancedMesh {
  const g = new THREE.IcosahedronGeometry(1, angular ? 0 : 1);
  const r = rng(seed);
  const im = new THREE.InstancedMesh(g, mat, count);
  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const P = new THREE.Vector3();
  const S = new THREE.Vector3();
  const E = new THREE.Euler();
  const C = new THREE.Color();
  const w = CELL.tray.w / 2 - size;
  for (let i = 0; i < count; i++) {
    // a low dome: more grains in the middle
    const a = r() * Math.PI * 2;
    const rho = Math.sqrt(r()) * w * 1.15;
    const x = Math.max(-w, Math.min(w, Math.cos(a) * rho));
    const z = Math.max(-w, Math.min(w, Math.sin(a) * rho));
    const top = 0.17 * (1 - (x * x + z * z) / (2 * w * w)) ** 1.1;
    const y = size * 0.5 + r() * top;
    E.set(r() * 6.3, r() * 6.3, r() * 6.3);
    Q.setFromEuler(E);
    const k = size * (0.65 + 0.7 * r());
    S.set(k * (0.8 + 0.5 * r()), k * (angular ? 0.45 + 0.5 * r() : 0.75 + 0.3 * r()), k * (0.8 + 0.5 * r()));
    M.compose(P.set(x, y, z), Q, S);
    im.setMatrixAt(i, M);
    C.set(colours[Math.floor(r() * colours.length)]).multiplyScalar(0.82 + 0.3 * r());
    im.setColorAt(i, C);
  }
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.castShadow = true;
  im.receiveShadow = true;
  im.computeBoundingBox();
  im.computeBoundingSphere();
  return im;
}

export function createPipeCellScene(opts: PipeCellOptions = {}): PipeCellScene {
  const scene = workshopScene({
    name: 'pipe-cell',
    fog: [40, 58],
    key: [7.5, 15, 11],
    target: [0, 3.2, 0],
    shadowHalf: 11,
    shadowFar: 42,
  });
  scene.userData.look = { ...PAPER_STUDIO, exposure: 1.1 };
  for (const c of scene.children) {
    const h = c as THREE.HemisphereLight;
    const d = c as THREE.DirectionalLight;
    if (h.isHemisphereLight) h.intensity = 0.72;
    if (d.isDirectionalLight) d.intensity = d.castShadow ? 1.9 : 0.5;
  }
  scene.add(paperFloor(26, 8, 0, [7, 24]));

  const registry = new FramedRegistry();
  const stoneKind = { value: 'soapstone' as 'soapstone' | 'sand' };
  const reveal = new StoneReveal();
  const roots = {} as Record<CellPartId, THREE.Group>;
  for (const id of CELL_PARTS) {
    const g = new THREE.Group();
    g.name = id;
    roots[id] = g;
    scene.add(g);
  }

  const profiles = { core: new ProfileField(), outer: new ProfileField() };
  const cuts = { core: new WedgeCut(CELL.coreX, 0), outer: new WedgeCut(CELL.outerX, 0) };
  const us = blockPipes();
  const q = CELL_QUALITY;

  // the plinth: the base under the stone (slab and base insulation of the silo), one per block
  const plinths = new THREE.Group();
  plinths.name = 'plinths';
  scene.add(plinths);
  const conc = MAT.concrete();
  for (const x of [CELL.coreX, CELL.outerX]) {
    const w = 2 * CELL_HALF + 2 * CELL.plinthPad;
    plinths.add(mesh(box(x, CELL.plinthH / 2, 0, w, CELL.plinthH, w), conc));
    const shadow = contactShadow(w, w, 0.6, 0.42);
    shadow.position.set(x, 0.005, 0);
    scene.add(shadow);
  }

  // ---- one block: stone, then its pipes, in the world (x = block's centre, the lattice's z is the world's)
  const steelMat = () => new THREE.MeshStandardMaterial({ color: 0xbcc1c6, roughness: 0.34, metalness: 0.9 });
  const barMat = new THREE.MeshStandardMaterial({ color: 0x6d7277, roughness: 0.5, metalness: 0.7 });
  const headerMat = new THREE.MeshStandardMaterial({ color: 0xc9cdd1, roughness: 0.34, metalness: 0.9 });
  const legMat = steelMat();
  const bendMat = steelMat();
  const loopMat = steelMat();

  const buildBlock = (id: 'core-zone' | 'outer-zone', cx: number, cut: WedgeCut, field: ProfileField) => {
    // the stone: a box of the height of the bed; a quarter removed by its own cut, its colour from the fine profile
    const stone = cellStoneMaterial(field, stoneKind, reveal.uniform);
    const capMat = cellStoneMaterial(field, stoneKind, reveal.uniform);
    const g = new THREE.BoxGeometry(2 * CELL_HALF, SILO.bedHeight, 2 * CELL_HALF);
    g.translate(0, (LEVEL.bedBottom + LEVEL.bedTop) / 2, 0);
    const root = roots[id];
    const holder = new THREE.Group();
    holder.position.x = cx;
    root.add(holder);
    const m = mesh(g, stone);
    holder.add(m);
    cut.clipMaterial(stone);
    // the caps: the two faces of the quarter, and a third for the half cut
    const a = new THREE.PlaneGeometry(CELL_HALF, SILO.bedHeight);
    a.translate(CELL_HALF / 2, (LEVEL.bedBottom + LEVEL.bedTop) / 2, 0);
    const b = new THREE.PlaneGeometry(CELL_HALF, SILO.bedHeight);
    b.translate(-CELL_HALF / 2, (LEVEL.bedBottom + LEVEL.bedTop) / 2, 0);
    const c = new THREE.PlaneGeometry(CELL_HALF, SILO.bedHeight);
    c.rotateY(-Math.PI / 2);
    c.translate(0, (LEVEL.bedBottom + LEVEL.bedTop) / 2, CELL_HALF / 2);
    cut.capGeometry(id, holder, a, capMat, 'a', true);
    cut.capGeometry(id, holder, b, capMat, 'b', true);
    cut.capGeometry(id, holder, c, capMat, 'c', true);

    // the pipes of this block
    const place = (o: THREE.Object3D, x: number, y: number, z: number) => o.position.set(cx + x, y, z);
    const legs = legsOf(us);
    const legGeo = legGeometry(q);
    const legRoot = new THREE.Group();
    legRoot.name = `${id}-legs`;
    for (const l of legs) {
      const seg = new THREE.Mesh(legGeo, legMat);
      seg.castShadow = true;
      seg.receiveShadow = true;
      place(seg, l.x, PIPE.legBottom, l.z);
      legRoot.add(seg);
    }
    roots['heat-pipe'].add(legRoot);
    const bendGeo = bendGeometry(q);
    const bendRoot = new THREE.Group();
    for (const u of us) {
      const seg = new THREE.Mesh(bendGeo, bendMat);
      seg.castShadow = true;
      place(seg, u.x0, PIPE.legBottom, u.z);
      bendRoot.add(seg);
    }
    // each U rests on its block, under the bend: the pipes stand free where the stone is taken away
    const blockGeo = bendBlockGeometry();
    for (const u of us) {
      const seg = new THREE.Mesh(blockGeo, conc);
      seg.castShadow = true;
      seg.receiveShadow = true;
      place(seg, u.x0, PIPE.legBottom, u.z);
      bendRoot.add(seg);
    }
    roots['return-bend'].add(bendRoot);
    const loopFeed = loopGeometry(q, -PIPE.headerOffset);
    const loopBack = loopGeometry(q, PIPE.headerOffset);
    const loopRoot = new THREE.Group();
    for (const l of legs) {
      const seg = new THREE.Mesh(l.side === 0 ? loopFeed : loopBack, loopMat);
      seg.castShadow = true;
      place(seg, l.x, PIPE.legTop, l.z);
      loopRoot.add(seg);
    }
    roots['expansion-loop'].add(loopRoot);
    const hg = headerGeometry(20);
    const runs = headerRuns(us);
    const headerRoot = new THREE.Group();
    // a header reaches beyond the block, a flange shows it goes on
    for (const r of runs) {
      const seg = new THREE.Mesh(hg, headerMat);
      seg.castShadow = true;
      const x0 = -CELL_HALF - 0.04;
      const x1 = CELL_HALF + 0.04;
      seg.scale.x = x1 - x0;
      place(seg, (x0 + x1) / 2, PIPE.headerY, r.z);
      headerRoot.add(seg);
      for (const x of [x0, x1]) {
        const fl = new THREE.Mesh(
          new THREE.CylinderGeometry(PIPE.headerR + 0.03, PIPE.headerR + 0.03, 0.02, 20).rotateZ(Math.PI / 2),
          headerMat,
        );
        place(fl, x, PIPE.headerY, r.z);
        headerRoot.add(fl);
      }
    }
    roots['branch-header'].add(headerRoot);
    const sp = spacerGeometry(us);
    const barMesh = new THREE.Mesh(sp.bars, barMat);
    const collarMesh = new THREE.Mesh(sp.collars, barMat);
    place(barMesh, 0, 0, 0);
    place(collarMesh, 0, 0, 0);
    barMesh.castShadow = collarMesh.castShadow = true;
    roots['pipe-spacer'].add(barMesh, collarMesh);
    return { stone, capMat };
  };

  buildBlock('core-zone', CELL.coreX, cuts.core, profiles.core);
  buildBlock('outer-zone', CELL.outerX, cuts.outer, profiles.outer);
  // the pipes are not cut: where the stone is taken away, they stand free, as a crew sets them before the stone comes.

  // ---- the two trays of grains, on stools
  const trayMat = MAT.steel();
  // a stand for each sample: a steel frame, tall enough that the grains are read beside the blocks
  const stoolMat = MAT.steel();
  const grainMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72 });
  const grainMat2 = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, flatShading: true });
  const tray = (id: 'quartz-sand' | 'crushed-soapstone', x: number, g: THREE.InstancedMesh) => {
    const root = roots[id];
    const T = CELL.tray;
    const h = T.standH;
    const stool: THREE.BufferGeometry[] = [
      box(x, h - 0.02, T.z, T.w + 0.04, 0.04, T.d + 0.04),
      box(x, 0.012, T.z, T.w + 0.1, 0.024, T.d + 0.1),
    ];
    for (const dx of [-T.w / 2 + 0.03, T.w / 2 - 0.03])
      for (const dz of [-T.d / 2 + 0.03, T.d / 2 - 0.03])
        stool.push(box(x + dx, (h - 0.04) / 2, T.z + dz, 0.035, h - 0.04, 0.035));
    // a shelf halfway: a stand, not a table
    stool.push(box(x, h * 0.42, T.z, T.w, 0.02, T.d));
    root.add(mesh(joined(stool), stoolMat));
    const parts: THREE.BufferGeometry[] = [
      box(x, h + 0.004, T.z, T.w, 0.008, T.d),
      box(x, h + T.h / 2, T.z - T.d / 2, T.w, T.h, 0.006),
      box(x, h + T.h / 2, T.z + T.d / 2, T.w, T.h, 0.006),
      box(x - T.w / 2, h + T.h / 2, T.z, 0.006, T.h, T.d),
      box(x + T.w / 2, h + T.h / 2, T.z, 0.006, T.h, T.d),
    ];
    root.add(mesh(joined(parts), trayMat));
    g.position.set(x, h + 0.008, T.z);
    root.add(g);
    const shadow = contactShadow(T.w, T.d, 0.35, 0.3);
    shadow.position.set(x, 0.005, T.z);
    scene.add(shadow);
  };
  tray(
    'quartz-sand',
    CELL.tray.sandX,
    grains(
      CELL.tray.grainsSand,
      CELL.magnified.sand,
      false,
      [0xe7dcc1, 0xd8c79e, 0xf0e6cf, 0xc9b58a, 0xb99f73],
      11,
      grainMat,
    ),
  );
  tray(
    'crushed-soapstone',
    CELL.tray.soapX,
    grains(
      CELL.tray.grainsSoap,
      CELL.magnified.soap,
      true,
      [0x7f8a80, 0x6d776f, 0x98a196, 0x8b9184, 0x5f6961],
      23,
      grainMat2,
    ),
  );

  // the legend
  const scale = buildHeatScale(SCALE);
  scene.add(scale.group);
  mergeStatic(scale.group, { name: 'heat-scale', scope: 'pipe-cell', colours: false });

  // merge the small static pieces
  mergeStatic(plinths, { name: 'plinths', scope: 'pipe-cell' });
  for (const id of ['heat-pipe', 'return-bend', 'expansion-loop', 'branch-header', 'pipe-spacer'] as const) {
    mergeStatic(roots[id], { name: id, scope: 'pipe-cell' });
  }
  applyWear(roots['pipe-spacer'], 30);
  applyWear(plinths, 4);

  // ---- anchors
  const anchors: Record<string, THREE.Object3D> = {};
  const at = (id: CellPartId, x: number, y: number, z: number) => {
    anchors[id] = anchor(roots[id], x, y, z, `${id}-label`);
  };
  at('core-zone', CELL.coreX - CELL_HALF * 0.55, LEVEL.bedBottom + 1.7, CELL_HALF);
  at('outer-zone', CELL.outerX - CELL_HALF * 0.82, LEVEL.bedTop - 0.5, 0.02);
  at('heat-pipe', CELL.coreX + 0.75, LEVEL.bedBottom + 3.3, 0.05);
  // on what is framed when they are selected, the open quarter of the core block
  at('return-bend', CELL.coreX + 0.5, PIPE.legBottom - PIPE.bendR, 0.5);
  at('pipe-spacer', CELL.coreX + 0.75, PIPE.spacerYs[1], 0.5);
  at('expansion-loop', CELL.coreX + 0.75, PIPE.legTop + 0.03, 0.5);
  at('branch-header', -0.51, 7.56, -0.59);
  at('quartz-sand', CELL.tray.sandX - 0.2, CELL.tray.standH + 0.34, CELL.tray.z);
  at('crushed-soapstone', CELL.tray.soapX - 1.45, CELL.tray.standH + 0.34, CELL.tray.z + 0.2);
  anchors['core-zone#scale'] = scale.anchorAt(100);

  for (const id of CELL_PARTS) registry.add(id, roots[id], V(...EXPLODE[id]));
  // what stands inside the blocks is framed where a block is open, the quarter of the core block
  const opening = (y0: number, y1: number) =>
    new THREE.Box3(V(CELL.coreX - 0.1, y0, -0.1), V(CELL.coreX + CELL_HALF + 0.05, y1, CELL_HALF + 0.05));
  registry.setFocus('heat-pipe', opening(LEVEL.bedBottom, LEVEL.bedTop));
  registry.setFocus('pipe-spacer', opening(PIPE.spacerYs[1] - 0.7, PIPE.spacerYs[1] + 0.7));
  registry.setFocus('return-bend', opening(LEVEL.bedBottom - 0.1, PIPE.legBottom + 1));

  // ---- the air in one pipe: dots down the leg and up its neighbour
  const dots = new FlowDots(80, { color: 0xffffff, size: 7, pixels: true, throughWalls: true, opacity: 0.95 });
  scene.add(dots.object);
  const pathOf = (cx: number) => [
    V(cx + 0.25, PIPE.headerY, -PIPE.headerOffset),
    V(cx + 0.25, PIPE.legTop, 0),
    V(cx + 0.25, PIPE.legBottom, 0),
    V(cx + 0.5, PIPE.legBottom - PIPE.bendR, 0),
    V(cx + 0.75, PIPE.legBottom, 0),
    V(cx + 0.75, PIPE.legTop, 0),
    V(cx + 0.75, PIPE.headerY, PIPE.headerOffset),
  ];
  const pCore = dots.addPath(pathOf(CELL.coreX), 36);
  const pOuter = dots.addPath(pathOf(CELL.outerX), 36);
  const dot = new THREE.Color();

  let since = Infinity;
  const refresh = () => {
    if (!opts.profile) return;
    for (let layer = 0; layer < GRID.layers; layer++) {
      const a = opts.profile(RING_OF.core, layer, PROFILE_POINTS);
      profiles.core.write(layer, a.rho, a.T);
      const b = opts.profile(RING_OF.outer, layer, PROFILE_POINTS);
      profiles.outer.write(layer, b.rho, b.T);
    }
    profiles.core.texture.needsUpdate = true;
    profiles.outer.texture.needsUpdate = true;
  };

  const mod: PipeCellScene = {
    id: 'pipe-cell',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors) as Hotspot[],
    scale,
    cuts,
    layout: { core: us, outer: us },
    profiles,
    scenery: () => [plinths, scale.group],
    dots,
    home: { position: V(5.4, 7.4, 12.2), target: V(0, 3.4, 0.2) },
    minDistance: 0.5,
    maxDistance: 34,
    homePadding: 1.0,
    declutter: true,
    update(s, dt, view) {
      stoneKind.value = opts.medium?.() ?? 'soapstone';
      reveal.update(stoneKind.value, dt);
      since += dt;
      if (since > 0.2) {
        since = 0;
        refresh();
      }
      const mode = view.cutaway ? 'half' : 'wedge';
      cuts.core.update(mode, registry);
      cuts.outer.update(mode, registry);
      const core = s.zones[0];
      const outer = s.zones[2];
      dots.object.visible = view.schematic && (core.mode !== 'idle' || outer.mode !== 'idle');
      if (view.schematic) {
        dots.advance(pCore, core.mode === 'idle' ? 0 : 1.2, dt);
        dots.advance(pOuter, outer.mode === 'idle' ? 0 : 1.2, dt);
        dots.material.color.copy(heatColor(s.chargeFlow > 0 ? s.airHot : s.exchangerAirIn, dot));
        dots.place();
      }
    },
  };
  return mod;
}
