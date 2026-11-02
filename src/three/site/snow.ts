import * as THREE from 'three';

// The snow and the leaves of the site, one small patch on plain MeshStandardMaterials: faces that look up go white with the season. `SNOW.value` comes from the state's `winter` (in
// `update`), so a cold season whitens the whole village at once, the silo's roof included: the outside of the silo stays cold, nothing melts on it (K39). All of it decoration of a size
// set by the simulation, listed in docs/scenery.md.

export const SNOW = { value: 0 };
/** 1 in full leaf, 0 bare: the birches. */
export const LEAVES = { value: 1 };

/** Snow from how cold the season is: nothing above a winterness of 0.62, all of it by 0.86. */
export function snowOf(winter: number): number {
  const t = Math.min(1, Math.max(0, (winter - 0.62) / 0.24));
  return t * t * (3 - 2 * t);
}

/** The leaves fall earlier than the snow. */
export function leavesOf(winter: number): number {
  const t = Math.min(1, Math.max(0, (winter - 0.5) / 0.2));
  return 1 - t * t * (3 - 2 * t);
}

const NOISE = /* glsl */ `
  float snHash( vec2 p ) { p = fract( p * vec2( 123.34, 456.21 ) ); p += dot( p, p + 45.32 ); return fract( p.x * p.y ); }
  float snNoise( vec2 p ) { vec2 i = floor( p ); vec2 f = fract( p ); vec2 u = f * f * ( 3.0 - 2.0 * f ); return mix( mix( snHash( i ), snHash( i + vec2( 1.0, 0.0 ) ), u.x ), mix( snHash( i + vec2( 0.0, 1.0 ) ), snHash( i + vec2( 1.0, 1.0 ) ), u.x ), u.y ); }
`;

export interface SnowOptions {
  /** Below this normal.y no snow, above `hi` all of it. */
  lo?: number;
  hi?: number;
  /** How much of the amount this surface takes. */
  gain?: number;
  /**
   * A tree seen from afar: past `far[0]` m its many small faces blend into one mean colour, lit as one surface, by `far[1]` m. It is the same tree, and it stops crawling: a dark bough and a
   * white one a pixel apart are what shimmers on a forest. `mean` is the colour of the tree without snow, linear.
   */
  far?: [number, number];
  mean?: [number, number, number];
}

/** Faces that look up go white with `SNOW`. Chains with whatever patch the material already has. */
export function patchSnow<T extends THREE.Material>(mat: T, o: SnowOptions = {}): T {
  const lo = o.lo ?? 0.35;
  const hi = o.hi ?? 0.8;
  const gain = o.gain ?? 1;
  const far = o.far;
  const mean = o.mean ?? [0.05, 0.08, 0.055];
  const prev = mat.onBeforeCompile;
  const prevKey = mat.customProgramCacheKey.bind(mat);
  mat.onBeforeCompile = (shader, renderer) => {
    prev.call(mat, shader, renderer);
    shader.uniforms.uSnow = SNOW;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSnowN;\nvarying vec3 vSnowP;')
      .replace(
        '#include <beginnormal_vertex>',
        /* glsl */ `#include <beginnormal_vertex>
        {
          vec3 snN = objectNormal;
          #ifdef USE_INSTANCING
            snN = mat3( instanceMatrix ) * snN;
          #endif
          vSnowN = mat3( modelMatrix ) * snN;
        }`,
      )
      .replace(
        '#include <project_vertex>',
        /* glsl */ `#include <project_vertex>
        {
          vec4 snP = vec4( transformed, 1.0 );
          #ifdef USE_INSTANCING
            snP = instanceMatrix * snP;
          #endif
          vSnowP = ( modelMatrix * snP ).xyz;
        }`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\nvarying vec3 vSnowN;\nvarying vec3 vSnowP;\nuniform float uSnow;\nfloat gSnow;\nfloat gSnowFar;\n${NOISE}`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          float up = smoothstep( ${lo.toFixed(3)}, ${hi.toFixed(3)}, normalize( vSnowN ).y );
          // the patchiness is dropped before its cells get under a few pixels: a pattern of two-pixel cells crawls
          float cells = length( fwidth( vSnowP.xz * 1.7 ) );
          float n = mix( 0.85, 0.7 + 0.3 * snNoise( vSnowP.xz * 1.7 ), 1.0 - smoothstep( 0.12, 0.4, cells ) );
          gSnow = clamp( uSnow * ${gain.toFixed(3)} * up * n * 1.25, 0.0, 1.0 );
          vec3 snowC = vec3( 0.86, 0.885, 0.91 );
          diffuseColor.rgb = mix( diffuseColor.rgb, snowC, gSnow );
          ${
            far
              ? `gSnowFar = smoothstep( ${far[0].toFixed(1)}, ${far[1].toFixed(1)}, length( cameraPosition - vSnowP ) );
          vec3 snMean = mix( vec3( ${mean.map((v) => v.toFixed(3)).join(', ')} ), snowC, clamp( uSnow * ${gain.toFixed(3)} * 0.28, 0.0, 1.0 ) );
          diffuseColor.rgb = mix( diffuseColor.rgb, snMean, gSnowFar * 0.75 );`
              : 'gSnowFar = 0.0;'
          }
        }`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = mix( roughnessFactor, 0.9, gSnow );',
      )
      .replace(
        '#include <metalnessmap_fragment>',
        '#include <metalnessmap_fragment>\nmetalnessFactor = mix( metalnessFactor, 0.0, gSnow );',
      )
      .replace(
        '#include <normal_fragment_begin>',
        `#include <normal_fragment_begin>
        ${far ? 'normal = normalize( mix( normal, normalize( ( viewMatrix * vec4( 0.25, 0.9, 0.3, 0.0 ) ).xyz ), gSnowFar * 0.7 ) );' : ''}`,
      );
  };
  mat.customProgramCacheKey = () => `${prevKey()}|snow-${lo}-${hi}-${gain}-${far?.join('-') ?? ''}-${mean.join('-')}`;
  mat.needsUpdate = true;
  return mat;
}
