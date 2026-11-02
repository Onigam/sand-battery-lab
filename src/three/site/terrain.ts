import * as THREE from 'three';
import { smoothstep } from '../common';
import { SITE } from '../dims';
import { fbm, gravelMap, grassMap, asphaltMap } from '../textures';
import { SNOW } from './snow';

// The land of the village, generic: a flat clearing at the forest's edge where the village stands, low rolling land around it, a far ridge with its wind farm, a road. One mesh on a graded grid
// (fine near the plant, coarse to the horizon). Every building stands on a pad of the land (`PADS`), flat to the millimetre; `terrainHeight` is what the plants and the poles stand on.
// The surfaces are computed per pixel from the same analytic shapes as here: grass, a gravel yard, a road, and the holes of the open trench and of the cellar, which are discarded exactly.

export interface Pad {
  /** A rectangle in the site frame, at height y, with a margin that blends into the land. */
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  y: number;
  margin: number;
}

/** The centre line of the road, a long gentle curve. */
export const roadZ = (x: number): number => SITE.road.z + 5 * Math.sin(x * 0.006 + 0.4) - 5 * Math.sin(0.4);

const Y = SITE.yard;

/** The pads of the buildings and the yard. Added to by the buildings' plan. */
export const PADS: Pad[] = [
  { x0: Y.x0 - 2, x1: Y.x1 + 4, z0: Y.z0 - 2, z1: Y.z1 + 2, y: 0, margin: 8 },
  {
    x0: SITE.school.x - SITE.school.length / 2 - 2,
    x1: SITE.school.x + SITE.school.length / 2 + 2,
    z0: SITE.school.z - SITE.school.width / 2 - 2,
    z1: SITE.school.z + SITE.school.width / 2 + 2,
    y: 0,
    margin: 8,
  },
  {
    x0: SITE.boiler.x - SITE.boiler.length / 2 - 3,
    x1: SITE.boiler.x + SITE.boiler.length / 2 + 10,
    z0: SITE.boiler.z - SITE.boiler.width / 2 - 3,
    z1: SITE.boiler.z + SITE.boiler.width / 2 + 3,
    y: 0,
    margin: 8,
  },
  {
    x0: SITE.substationHouse.x - SITE.substationHouse.length / 2 - 1.5,
    x1: SITE.cellar.x1 + 1.5,
    z0: Math.min(SITE.substationHouse.z - SITE.substationHouse.width / 2, SITE.cellar.z0) - 1.5,
    z1: Math.max(SITE.substationHouse.z + SITE.substationHouse.width / 2, SITE.cellar.z1) + 1.5,
    y: 0,
    margin: 6,
  },
];

/** A house of the village: its centre, long side along x or z, colour index. */
export interface HousePlan {
  x: number;
  z: number;
  /** Radians. */
  yaw: number;
  length: number;
  width: number;
  colour: number;
  floors: number;
}

export const HOUSES: HousePlan[] = [
  { x: -36, z: 42, yaw: 0.05, length: 10, width: 7, colour: 0, floors: 1 },
  { x: -52, z: 44, yaw: -0.08, length: 9, width: 7, colour: 1, floors: 2 },
  { x: -68, z: 45, yaw: 0.12, length: 11, width: 7.5, colour: 2, floors: 1 },
  { x: -86, z: 44, yaw: -0.04, length: 10, width: 7, colour: 0, floors: 1 },
  { x: -104, z: 47, yaw: 0.1, length: 12, width: 8, colour: 3, floors: 2 },
  { x: -20, z: 44, yaw: 0, length: 8, width: 6.5, colour: 3, floors: 1 },
  { x: -92, z: 14, yaw: 1.5, length: 10, width: 7, colour: 1, floors: 1 },
  { x: -108, z: 22, yaw: 1.48, length: 9, width: 7, colour: 0, floors: 2 },
  { x: -90, z: -6, yaw: 1.6, length: 11, width: 7.5, colour: 2, floors: 1 },
  { x: -112, z: -2, yaw: 1.57, length: 10, width: 7, colour: 3, floors: 1 },
  { x: 24, z: 44, yaw: -0.1, length: 10, width: 7, colour: 1, floors: 1 },
  { x: 44, z: 47, yaw: 0.08, length: 9, width: 7, colour: 0, floors: 2 },
  { x: 62, z: 46, yaw: -0.05, length: 11, width: 7.5, colour: 2, floors: 1 },
];
for (const h of HOUSES) {
  const rx = (Math.abs(Math.cos(h.yaw)) * h.length + Math.abs(Math.sin(h.yaw)) * h.width) / 2 + 1;
  const rz = (Math.abs(Math.sin(h.yaw)) * h.length + Math.abs(Math.cos(h.yaw)) * h.width) / 2 + 1;
  PADS.push({ x0: h.x - rx, x1: h.x + rx, z0: h.z - rz, z1: h.z + rz, y: 0, margin: 5 });
}

/** The solar field stands on a shallow clearing. */
const S = SITE.solar;
const solarW = S.panels * S.panelW + 4;
const solarD = S.rows * S.rowEvery + 2;
PADS.push({ x0: S.x0 - 2, x1: S.x0 + solarW, z0: S.z0 - 2, z1: S.z0 + solarD, y: 0, margin: 10 });

/** Distance from a point to a polyline, m. */
export function polyDistance(x: number, z: number, pts: readonly (readonly [number, number])[]): number {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, z - az - t * dz));
  }
  return best;
}

const rectDist = (x: number, z: number, x0: number, x1: number, z0: number, z1: number): number =>
  Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1));

/** The land before anything flattens it. */
function rawLand(x: number, z: number): number {
  const d = Math.hypot(x + 20, z - 8);
  const flat = 1 - smoothstep(90, 330, d);
  const roll = (fbm(x * 0.0026 + 4, z * 0.0026 - 7, 4) - 0.5) * 46 + (fbm(x * 0.011 + 5, z * 0.011, 3) - 0.5) * 6;
  // the ridge to the north, where the wind farm stands
  const ridge = smoothstep(-340, -1050, z) * 62 * (0.85 + 0.3 * fbm(x * 0.0016, 3.3, 2));
  // a low rise on the south, so that the sky does not start at the road
  const south = smoothstep(180, 620, z) * 10;
  const near = (fbm(x * 0.022, z * 0.022, 2) - 0.5) * 1.1;
  return (1 - flat) * (roll + ridge + south) + flat * near;
}

/** The height of the land at a point, m: the raw land, flattened to the pads, to the road and along the trench. */
export function terrainHeight(x: number, z: number): number {
  let h = rawLand(x, z);
  // the road: its own gentle level
  const rz = roadZ(x);
  const dr = Math.abs(z - rz);
  const roadW = 1 - smoothstep(SITE.road.width / 2 + 0.6, SITE.road.width / 2 + 14, dr);
  if (roadW > 0) {
    const roadLevel = rawLand(x, rz) * smoothstep(120, 360, Math.abs(x + 20));
    h += (roadLevel - h) * roadW;
  }
  for (const p of PADS) {
    if (x < p.x0 - p.margin || x > p.x1 + p.margin || z < p.z0 - p.margin || z > p.z1 + p.margin) continue;
    const d = rectDist(x, z, p.x0, p.x1, p.z0, p.z1);
    if (d < p.margin) {
      const w = 1 - smoothstep(0, p.margin, d);
      h += (p.y - h) * w;
    }
  }
  // the trench and its spurs run on level ground, so do the drive and the cellar (nothing of it is far from the plot)
  if (x < -90 || x > 20 || z < -30 || z > 45) return h;
  const dt = Math.min(
    polyDistance(x, z, SITE.trench.path),
    polyDistance(x, z, SITE.trench.schoolSpur),
    polyDistance(x, z, SITE.trench.boilerSpur),
    Math.abs(x - SITE.yard.gateX) < SITE.road.driveW && z > SITE.yard.z1 - 1 && z < rz ? 0 : 99,
  );
  if (dt < 6) h += (0 - h) * (1 - smoothstep(1.2, 6, dt));
  return h;
}

/** The land in front of a far machine: where the turbines stand. */
export const landAt = terrainHeight;

// ------------------------------------------------------------------------------------------------ the mesh

const GRID_N = 170;
const R = 3400;
const A = 0.042;
/** The grid: fine in the middle (about 1.7 m), coarse at the horizon. */
export const gridCoord = (u: number): number => R * (A * u + (1 - A) * Math.sign(u) * Math.abs(u) ** 5);

export interface Terrain {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  vertices: number;
}

const segmentUniforms = (): THREE.Vector4[] => {
  const out: THREE.Vector4[] = [];
  for (const path of [SITE.trench.path, SITE.trench.schoolSpur, SITE.trench.boilerSpur])
    for (let i = 0; i < path.length - 1; i++)
      out.push(new THREE.Vector4(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]));
  return out;
};

export const TRENCH_SEGMENTS = segmentUniforms();

export function buildTerrain(canopy: (x: number, z: number) => number = () => 0): Terrain {
  const N = GRID_N;
  const pos = new Float32Array((N + 1) * (N + 1) * 3);
  const forest = new Float32Array((N + 1) * (N + 1));
  const idx: number[] = [];
  const offX = -20;
  const offZ = 8;
  for (let j = 0; j <= N; j++) {
    const v = (j / N) * 2 - 1;
    const z = gridCoord(v) + offZ;
    for (let i = 0; i <= N; i++) {
      const u = (i / N) * 2 - 1;
      const x = gridCoord(u) + offX;
      const k = (j * (N + 1) + i) * 3;
      pos[k] = x;
      pos[k + 1] = terrainHeight(x, z);
      pos[k + 2] = z;
      forest[j * (N + 1) + i] = canopy(x, z);
    }
  }
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const a = j * (N + 1) + i;
      const b = a + 1;
      const c = a + N + 1;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aForest', new THREE.BufferAttribute(forest, 1));
  g.setIndex(idx);
  g.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
  const grass = grassMap();
  const gravel = gravelMap();
  const asphalt = asphaltMap();
  const segs = TRENCH_SEGMENTS;
  const yard = new THREE.Vector4(SITE.yard.x0, SITE.yard.z0, SITE.yard.x1, SITE.yard.z1);
  const cellar = new THREE.Vector4(SITE.cellar.x0, SITE.cellar.z0, SITE.cellar.x1, SITE.cellar.z1);
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uGrass = { value: grass };
    shader.uniforms.uGravel = { value: gravel };
    shader.uniforms.uAsphalt = { value: asphalt };
    shader.uniforms.uSegs = { value: segs };
    shader.uniforms.uYard = { value: yard };
    shader.uniforms.uCellar = { value: cellar };
    shader.uniforms.uSnow = SNOW;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute float aForest;\nvarying vec3 vLandP;\nvarying vec3 vLandN;\nvarying float vLandF;',
      )
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvLandN = objectNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLandP = position;\nvLandF = aForest;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        varying vec3 vLandP;
        varying vec3 vLandN;
        varying float vLandF;
        uniform sampler2D uGrass;
        uniform sampler2D uGravel;
        uniform sampler2D uAsphalt;
        uniform vec4 uSegs[${segs.length}];
        uniform vec4 uYard;
        uniform vec4 uCellar;
        uniform float uSnow;
        float ldHash( vec2 p ) { p = fract( p * vec2( 123.34, 456.21 ) ); p += dot( p, p + 45.32 ); return fract( p.x * p.y ); }
        float ldNoise( vec2 p ) { vec2 i = floor( p ); vec2 f = fract( p ); vec2 u = f * f * ( 3.0 - 2.0 * f ); return mix( mix( ldHash( i ), ldHash( i + vec2( 1.0, 0.0 ) ), u.x ), mix( ldHash( i + vec2( 0.0, 1.0 ) ), ldHash( i + vec2( 1.0, 1.0 ) ), u.x ), u.y ); }
        float ldFbm( vec2 p ) { return 0.55 * ldNoise( p ) + 0.3 * ldNoise( p * 2.3 + 7.1 ) + 0.15 * ldNoise( p * 5.1 + 2.7 ); }
        float ldSeg( vec2 p, vec4 s ) { vec2 pa = p - s.xy; vec2 ba = s.zw - s.xy; float h = clamp( dot( pa, ba ) / dot( ba, ba ), 0.0, 1.0 ); return length( pa - ba * h ); }
        float ldRect( vec2 p, vec4 r ) { vec2 d = max( max( r.xy - p, p - r.zw ), vec2( 0.0 ) ); return length( d ); }
        float gLandSnow;`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        /* glsl */ `#include <clipping_planes_fragment>
        {
          // the open trench and the cellar: exact holes, their walls are built from the same shapes
          float dTrench = 1e9;
          for ( int i = 0; i < ${segs.length}; i++ ) dTrench = min( dTrench, ldSeg( vLandP.xz, uSegs[ i ] ) );
          if ( dTrench < ${(SITE.trench.width / 2).toFixed(3)} ) discard;
          if ( ldRect( vLandP.xz, uCellar ) <= 0.0 ) discard;
        }`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          vec2 p = vLandP.xz;
          // grass, the broad variation far off, the grain near
          float broad = ldFbm( p * 0.016 );
          float mid = mix( 0.5, ldFbm( p * 0.09 + 11.0 ), 1.0 - smoothstep( 200.0, 500.0, length( cameraPosition - vLandP ) ) );
          vec3 meadow = mix( vec3( 0.205, 0.255, 0.11 ), vec3( 0.335, 0.365, 0.15 ), broad );
          meadow = mix( meadow, vec3( 0.42, 0.38, 0.18 ), smoothstep( 0.55, 0.8, mid ) * 0.45 );
          float gr = texture2D( uGrass, p * 0.33 ).r;
          float dist = length( cameraPosition - vLandP );
          meadow *= 0.72 + 0.56 * mix( gr, 0.5, smoothstep( 40.0, 170.0, dist ) );
          // the floor of the forest: needles and shade
          meadow = mix( meadow, vec3( 0.055, 0.07, 0.05 ), vLandF * 0.92 );
          // the road and the yard
          float roadC = ${SITE.road.z.toFixed(2)} + 5.0 * sin( p.x * 0.006 + 0.4 ) - ${(5 * Math.sin(0.4)).toFixed(4)};
          float dRoad = abs( p.y - roadC );
          float road = 1.0 - smoothstep( ${(SITE.road.width / 2 - 0.15).toFixed(3)}, ${(SITE.road.width / 2 + 0.15).toFixed(3)}, dRoad );
          float nearFade = 1.0 - smoothstep( 30.0, 110.0, dist );
          float shoulder = 1.0 - smoothstep( ${(SITE.road.width / 2 + 0.15).toFixed(3)}, ${(SITE.road.width / 2 + 1.1).toFixed(3)}, dRoad + 0.2 + 0.4 * ( ldNoise( p * 0.7 ) - 0.5 ) * nearFade );
          float dYard = ldRect( p, uYard );
          float yardM = 1.0 - smoothstep( 0.2, 1.4 + 0.8 * ( ldNoise( p * 0.6 ) - 0.5 ) * nearFade, dYard );
          // the drive from the gate to the road
          float dDrive = ldRect( p, vec4( ${(SITE.yard.gateX - SITE.road.driveW / 2).toFixed(2)}, ${(SITE.yard.z1 - 0.5).toFixed(2)}, ${(SITE.yard.gateX + SITE.road.driveW / 2).toFixed(2)}, roadC ) );
          float drive = 1.0 - smoothstep( 0.05, 0.9, dDrive );
          // the worn ground along the trench: dug earth
          float dTr = 1e9;
          for ( int i = 0; i < ${segs.length}; i++ ) dTr = min( dTr, ldSeg( p, uSegs[ i ] ) );
          float dug = 1.0 - smoothstep( ${(SITE.trench.width / 2 + 0.3).toFixed(3)}, ${(SITE.trench.width / 2 + 1.6).toFixed(3)}, dTr + 0.3 + 0.6 * ( ldNoise( p * 1.3 ) - 0.5 ) * nearFade );
          vec3 gravel = texture2D( uGravel, p * 0.28 ).rgb * vec3( 0.66, 0.63, 0.59 );
          gravel = mix( gravel, vec3( 0.34, 0.33, 0.31 ), smoothstep( 40.0, 160.0, dist ) );
          vec3 tar = texture2D( uAsphalt, p * 0.5 ).rgb * 1.5;
          vec3 c = meadow;
          c = mix( c, vec3( 0.2, 0.17, 0.12 ), dug );
          c = mix( c, gravel * 0.82, max( shoulder * 0.8, 0.0 ) );
          c = mix( c, gravel, max( yardM, drive ) );
          c = mix( c, tar, road );
          // the snow: thin on what is ploughed, none on dug earth under the fresh edge
          float slope = smoothstep( 0.55, 0.92, normalize( vLandN ).y );
          float cover = uSnow * slope * ( 0.95 + 0.05 * nearFade * ldNoise( p * 0.35 ) ) * ( 1.0 - mix( 0.55, 0.94, smoothstep( 110.0, 380.0, dist ) ) * vLandF );
          // the road is packed and grey, with two darker wheel tracks; the yard is ploughed
          float wheel = smoothstep( 0.55, 0.0, abs( abs( dRoad ) - 1.6 ) );
          float plough = max( road * ( 0.42 + 0.42 * wheel ), max( yardM, drive ) * 0.6 );
          gLandSnow = cover * ( 1.0 - plough ) * ( 1.0 - 0.75 * dug );
          vec3 snow = mix( vec3( 0.86, 0.875, 0.9 ), vec3( 0.95, 0.955, 0.965 ), ldFbm( p * 0.1 ) );
          // the wind's ripples, near only
          snow *= 0.96 + 0.05 * ldNoise( vec2( p.x * 0.9 + 0.5 * p.y, p.y * 3.1 ) ) * ( 1.0 - smoothstep( 30.0, 120.0, dist ) );
          c = mix( c, snow, gLandSnow );
          diffuseColor.rgb = c;
        }`,
      );
  };
  mat.customProgramCacheKey = () => 'sand-land';
  const mesh = new THREE.Mesh(g, mat);
  mesh.name = 'land';
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.frustumCulled = false;
  return { mesh, material: mat, vertices: pos.length / 3 };
}
