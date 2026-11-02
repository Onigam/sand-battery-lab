import * as THREE from 'three';
import { GRID, LEVEL, SILO } from './dims';

// The false colour of the lab: the temperature of the model drawn on the stone. One ramp, fixed in °C so that a colour means the same thing in every world and at every
// moment (0 to 600 °C). Blue is cool and red is hot, the eye's own convention, with a lightness that rises then falls, so that it stays readable through both tone curves
// of the kit (ACES at 1 in the `site` world, Neutral at 1.2 in the paper studio): `heat.test.ts` checks that every step of the ramp stays distinct under both. Stone at
// 400 °C does not glow: the overview of the world says so, once.

/** The stops of the ramp, °C and sRGB. */
export const HEAT_STOPS: readonly (readonly [number, number])[] = [
  [0, 0x27316f],
  [100, 0x2f6fb4],
  [200, 0x23a39b],
  [300, 0x9cc13b],
  [400, 0xf4b83a],
  [500, 0xe85f2a],
  [600, 0xa61a3c],
];
export const HEAT_MIN = HEAT_STOPS[0][0];
export const HEAT_MAX = HEAT_STOPS[HEAT_STOPS.length - 1][0];

const linear = (hex: number): THREE.Color => new THREE.Color(hex);

/** The colour of a temperature, linear RGB (the same as the shader's). */
export function heatColor(T: number, out = new THREE.Color()): THREE.Color {
  const t = Math.min(HEAT_MAX, Math.max(HEAT_MIN, T));
  for (let i = 0; i < HEAT_STOPS.length - 1; i++) {
    const [t0, c0] = HEAT_STOPS[i];
    const [t1, c1] = HEAT_STOPS[i + 1];
    if (t <= t1) return out.copy(linear(c0)).lerp(linear(c1), (t - t0) / (t1 - t0));
  }
  return out.copy(linear(HEAT_STOPS[HEAT_STOPS.length - 1][1]));
}

/** GLSL of the ramp: `vec3 heatRamp( float T )`, linear RGB. */
export function heatRampGlsl(): string {
  const v = (hex: number) => {
    const c = linear(hex);
    return `vec3( ${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)} )`;
  };
  let body = '';
  for (let i = 0; i < HEAT_STOPS.length - 1; i++) {
    const [t0, c0] = HEAT_STOPS[i];
    const [t1, c1] = HEAT_STOPS[i + 1];
    body += `if ( T <= ${t1.toFixed(1)} ) return mix( ${v(c0)}, ${v(c1)}, ( T - ${t0.toFixed(1)} ) / ${(t1 - t0).toFixed(1)} );\n`;
  }
  return `vec3 heatRamp( float T ) {\n T = clamp( T, ${HEAT_MIN.toFixed(1)}, ${HEAT_MAX.toFixed(1)} );\n${body} return ${v(HEAT_STOPS[HEAT_STOPS.length - 1][1])};\n}\n`;
}

export interface HeatFieldLike {
  bedT: ArrayLike<number>;
  rings: number;
  layers: number;
  onDrawnSilo: boolean;
}

/**
 * The field as a small texture of the model's grid, read with the hardware's linear filter. Values in °C, half-float, so the isotherms stay smooth. Updated at a low rate
 * (a few times a second is all a field that moves over hours needs).
 */
export class HeatField {
  readonly texture: THREE.DataTexture;
  private readonly data: Uint16Array;
  readonly uniforms = {
    uHeat: { value: null as unknown as THREE.Texture },
    uHeatOn: { value: 1 },
    /** 1 shows the plain stone instead of the false colour (`StoneReveal`). */
    uStoneShow: { value: 0 },
  };
  private since = Infinity;
  /** Cells written so far (tests). */
  writes = 0;

  constructor(
    readonly rings = GRID.rings,
    readonly layers = GRID.layers,
  ) {
    this.data = new Uint16Array(rings * layers);
    this.texture = new THREE.DataTexture(this.data, rings, layers, THREE.RedFormat, THREE.HalfFloatType);
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.wrapS = this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texture.generateMipmaps = false;
    this.texture.needsUpdate = true;
    this.uniforms.uHeat.value = this.texture;
  }

  /** `dt` in real seconds. The other silos of the charts leave the drawn section as plain stone (`onDrawnSilo`). */
  update(state: HeatFieldLike, dt: number, force = false): void {
    this.since += dt;
    const on = state.onDrawnSilo ? 1 : 0;
    this.uniforms.uHeatOn.value = on;
    if (!force && this.since < 0.12) return;
    this.since = 0;
    if (!on || state.rings !== this.rings || state.layers !== this.layers) return;
    for (let i = 0; i < this.data.length; i++) this.data[i] = THREE.DataUtils.toHalfFloat(state.bedT[i]);
    this.texture.needsUpdate = true;
    this.writes++;
  }

  /** The temperature written for a cell, °C (tests). */
  read(ring: number, layer: number): number {
    return THREE.DataUtils.fromHalfFloat(this.data[ring + this.rings * layer]);
  }
}

/** The two looks of the stone, when no field is drawn and under the false colour. Soapstone is grey-green, quartz sand is pale. */
export const STONE_LOOK = {
  soapstone: { color: 0x7f8a80, grain: 0.3, cell: 28 },
  sand: { color: 0xc8b48e, grain: 0.14, cell: 70 },
} as const;
export type StoneKind = keyof typeof STONE_LOOK;

/**
 * Under the false colour soapstone and sand look alike, and the temperatures do not move when the medium changes, so the sand switch would show nothing. When it changes, the section
 * shows the new stone in its own colour for a moment, then the false colour comes back. `uniform` goes to the materials.
 */
export class StoneReveal {
  /** Real seconds: how long the plain stone holds, then how long it fades. */
  static readonly HOLD = 1.6;
  static readonly FADE = 1.4;
  private kind: StoneKind | null = null;
  private t = Infinity;
  constructor(readonly uniform: { value: number } = { value: 0 }) {}

  update(kind: StoneKind, dt: number): void {
    if (this.kind !== null && kind !== this.kind) this.t = 0;
    else this.t += dt;
    this.kind = kind;
    const x = Math.min(1, Math.max(0, (this.t - StoneReveal.HOLD) / StoneReveal.FADE));
    this.uniform.value = 1 - x * x * (3 - 2 * x);
  }
}

/** GLSL: the crushed look in the object's coordinates: lumps of stone (a Voronoi distance) that fade before they get under a few pixels. */
const STONE_GLSL = /* glsl */ `
  vec2 stHash( vec2 p ) { p = vec2( dot( p, vec2( 127.1, 311.7 ) ), dot( p, vec2( 269.5, 183.3 ) ) ); return fract( sin( p ) * 43758.5453 ); }
  float stVoronoi( vec2 x ) {
    vec2 n = floor( x ), f = fract( x );
    float m = 8.0;
    for ( int j = -1; j <= 1; j++ ) for ( int i = -1; i <= 1; i++ ) {
      vec2 g = vec2( float( i ), float( j ) );
      vec2 o = stHash( n + g );
      vec2 r = g + o - f;
      m = min( m, dot( r, r ) );
    }
    return sqrt( m );
  }
`;

export interface HeatMaterialOptions {
  field: HeatField;
  /** Radius and bottom of the bed in the object's coordinates, its height. */
  radius?: number;
  y0?: number;
  height?: number;
  stone: { value: StoneKind };
  /** How strongly the colour is lit: a part of it stays emissive, so a shadow never hides a temperature. */
  emissive?: number;
}

/**
 * The material of the bed: a plain MeshStandardMaterial that the kit can swap for its ghost in X-ray, whose colour comes from the object-space (r, y) of each fragment: the
 * side of the cylinder, its top and the flat sections are coloured by the same field.
 */
export function heatMaterial(o: HeatMaterialOptions): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0, side: THREE.DoubleSide });
  m.userData.noShare = true;
  m.userData.worn = true;
  const radius = o.radius ?? SILO.bedR;
  const y0 = o.y0 ?? LEVEL.bedBottom;
  const height = o.height ?? SILO.bedHeight;
  const glow = o.emissive ?? 0.2;
  const soap = new THREE.Color(STONE_LOOK.soapstone.color);
  const sand = new THREE.Color(STONE_LOOK.sand.color);
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uHeat = o.field.uniforms.uHeat;
    shader.uniforms.uHeatOn = o.field.uniforms.uHeatOn;
    shader.uniforms.uStoneShow = o.field.uniforms.uStoneShow;
    shader.uniforms.uStoneA = { value: soap };
    shader.uniforms.uStoneB = { value: sand };
    shader.uniforms.uStoneMix = {
      get value() {
        return o.stone.value === 'sand' ? 1 : 0;
      },
    };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vHeatP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHeatP = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        varying vec3 vHeatP;
        uniform sampler2D uHeat;
        uniform float uHeatOn;
        uniform float uStoneShow;
        uniform vec3 uStoneA;
        uniform vec3 uStoneB;
        uniform float uStoneMix;
        ${heatRampGlsl()}
        ${STONE_GLSL}
        vec3 gHeatGlow;`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          vec2 huv = vec2( length( vHeatP.xz ) / ${radius.toFixed(3)}, ( vHeatP.y - ${y0.toFixed(3)} ) / ${height.toFixed(3)} );
          float T = texture2D( uHeat, huv ).r;
          // the lumps of the stone, in the plane the fragment lies in (a side, the top or a section)
          vec2 q = abs( vHeatP.z ) < 1e-3 ? vHeatP.xy : abs( vHeatP.x ) < 1e-3 ? vHeatP.zy : vec2( atan( vHeatP.z, vHeatP.x ) * ${radius.toFixed(3)}, vHeatP.y + vHeatP.x * 0.3 );
          float cell = mix( 7.0, 15.0, uStoneMix );
          float cpp = length( fwidth( q * cell ) );
          float keep = 1.0 - smoothstep( 0.07, 0.2, cpp );
          float lump = stVoronoi( q * cell );
          float grain = 1.0 + keep * ( mix( 0.26, 0.12, uStoneMix ) * ( 0.55 - lump ) );
          vec3 stone = mix( uStoneA, uStoneB, uStoneMix );
          vec3 heat = heatRamp( T );
          // lines every 50 K: the eye reads the shape of the field even when it is nearly flat
          float tw = max( fwidth( T ), 1e-3 );
          float d = abs( fract( T / 50.0 + 0.5 ) - 0.5 ) * 50.0 / tw;
          float iso = ( 1.0 - smoothstep( 0.4, 1.4, d ) ) * ( 1.0 - smoothstep( 4.0, 16.0, tw ) );
          float plain = uHeatOn > 0.5 ? uStoneShow : 1.0;
          vec3 col = mix( heat * ( 1.0 - 0.28 * iso ), stone, plain );
          diffuseColor.rgb = col * grain * mix( 0.72, 1.0, plain );
          gHeatGlow = col * grain * ${glow.toFixed(3)} * ( 1.0 - plain );
        }`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        /* glsl */ `#include <emissivemap_fragment>
        totalEmissiveRadiance += gHeatGlow;`,
      );
  };
  m.customProgramCacheKey = () => `heat-${radius}-${y0}-${height}-${glow}`;
  return m;
}
