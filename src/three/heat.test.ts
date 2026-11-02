import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { HEAT_MAX, HEAT_MIN, HEAT_STOPS, HeatField, heatColor, heatRampGlsl, StoneReveal } from './heat';

// The false colour must read in both light modes of the kit: ACES at 1 (the `site` world, the kit's default) and Neutral at 1.2 (the paper studio) and at the exposures the worlds use. A
// visitor must tell the steps apart; the ramp runs from cool to hot and it never saturates into one flat colour. Tone curves as in three.js.

const acesInput = [
  [0.59719, 0.35458, 0.04823],
  [0.076, 0.90834, 0.01566],
  [0.0284, 0.13383, 0.83777],
];
const acesOutput = [
  [1.60475, -0.53108, -0.07367],
  [-0.10208, 1.10813, -0.00605],
  [-0.00327, -0.07276, 1.07602],
];
const mul = (m: number[][], v: number[]) => m.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
const rrt = (v: number) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081);
function aces(c: number[], exposure: number): number[] {
  const x = c.map((v) => (v * exposure) / 0.6);
  const a = mul(acesInput, x).map(rrt);
  return mul(acesOutput, a).map((v) => Math.min(1, Math.max(0, v)));
}
function neutral(c: number[], exposure: number): number[] {
  const StartCompression = 0.8 - 0.04;
  const Desaturation = 0.15;
  let x = c.map((v) => v * exposure);
  const m = Math.min(...x);
  const offset = m < 0.08 ? m - 6.25 * m * m : 0.04;
  x = x.map((v) => v - offset);
  const peak = Math.max(...x);
  if (peak < StartCompression) return x.map((v) => Math.min(1, Math.max(0, v)));
  const d = 1 - StartCompression;
  const newPeak = 1 - (d * d) / (peak + d - StartCompression);
  x = x.map((v) => (v * newPeak) / peak);
  const g = 1 - 1 / (Desaturation * (peak - newPeak) + 1);
  return x.map((v) => Math.min(1, Math.max(0, v * (1 - g) + newPeak * g)));
}
const srgb = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const dist = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => srgb(v) - srgb(b[i])));

describe('the sand switch', () => {
  it('shows the new stone when the medium changes, and only then, and the false colour comes back', () => {
    const r = new StoneReveal();
    r.update('soapstone', 0.016);
    expect(r.uniform.value).toBe(0);
    r.update('soapstone', 0.016);
    expect(r.uniform.value).toBe(0);
    r.update('sand', 0.016);
    expect(r.uniform.value).toBe(1);
    r.update('sand', StoneReveal.HOLD * 0.9);
    expect(r.uniform.value).toBe(1);
    r.update('sand', StoneReveal.HOLD * 0.1 + StoneReveal.FADE * 0.5);
    expect(r.uniform.value).toBeGreaterThan(0.1);
    expect(r.uniform.value).toBeLessThan(0.9);
    r.update('sand', StoneReveal.FADE);
    expect(r.uniform.value).toBe(0);
  });
});

describe('the false colour', () => {
  it('is fixed from 0 to 600 °C, with the same stops in JS and in the shader', () => {
    expect(HEAT_MIN).toBe(0);
    expect(HEAT_MAX).toBe(600);
    const glsl = heatRampGlsl();
    for (const [t] of HEAT_STOPS.slice(1)) expect(glsl).toContain(`T <= ${t.toFixed(1)}`);
    const c = new THREE.Color();
    for (const [t, hex] of HEAT_STOPS) expect(heatColor(t, c).getHex()).toBe(new THREE.Color(hex).getHex());
  });

  it('runs from cool to hot', () => {
    const c0 = heatColor(0);
    const c6 = heatColor(600);
    expect(c0.b).toBeGreaterThan(c0.r);
    expect(c6.r).toBeGreaterThan(c6.b);
    // blue falls and red rises across the swing of the plant
    expect(heatColor(100).b).toBeGreaterThan(heatColor(400).b);
    expect(heatColor(500).r).toBeGreaterThan(heatColor(200).r);
  });

  for (const [name, curve, exposures] of [
    ['ACES', aces, [1, 1.18]],
    ['Neutral', neutral, [1.05, 1.1, 1.2]],
  ] as const) {
    it(`keeps its steps apart through ${name}`, () => {
      for (const e of exposures)
        for (const lit of [0.92, 0.5]) {
          // what the material adds up to: a lit diffuse part and an emissive part, in a shade too
          const shade = (T: number) => {
            const c = heatColor(T);
            return curve(
              [c.r, c.g, c.b].map((v) => v * (0.72 * lit + 0.2)),
              e,
            );
          };
          // every 100 K step reads apart in display colour, and so does a 25 K step in the plant's swing
          for (let T = 0; T < HEAT_MAX; T += 100)
            expect(dist(shade(T), shade(T + 100)), `${name} ${e} ${lit} ${T}`).toBeGreaterThan(0.12);
          for (let T = 150; T < 550; T += 25)
            expect(dist(shade(T), shade(T + 25)), `${name} ${e} ${lit} ${T}`).toBeGreaterThan(0.025);
          // no step clips to white or falls to black
          for (let T = 0; T <= HEAT_MAX; T += 50) {
            const s = shade(T);
            expect(Math.max(...s), `${name} ${e} ${T} not black`).toBeGreaterThan(0.03);
            expect(Math.min(...s), `${name} ${e} ${T} not white`).toBeLessThan(0.75);
          }
        }
    });
  }
});

describe('the field', () => {
  const state = (T: number[], onDrawnSilo = true) => ({
    bedT: Float64Array.from(T),
    rings: 10,
    layers: 6,
    onDrawnSilo,
  });

  it("writes the model's temperatures cell by cell, ring + rings × layer", () => {
    const f = new HeatField();
    const T = Array.from({ length: 60 }, (_, i) => 100 + i * 5);
    f.update(state(T), 1, true);
    expect(f.read(0, 0)).toBeCloseTo(100, 0);
    expect(f.read(3, 2)).toBeCloseTo(100 + 23 * 5, 0);
    expect(f.read(9, 5)).toBeCloseTo(100 + 59 * 5, 0);
    expect(f.uniforms.uHeatOn.value).toBe(1);
  });

  it('updates a few times a second, no more', () => {
    const f = new HeatField();
    const T = Array.from({ length: 60 }, () => 200);
    f.update(state(T), 1);
    const n = f.writes;
    for (let i = 0; i < 5; i++) f.update(state(T), 0.016);
    expect(f.writes).toBe(n);
    f.update(state(T), 0.2);
    expect(f.writes).toBe(n + 1);
  });

  it('leaves the section as plain stone for the silos that are not drawn', () => {
    const f = new HeatField();
    f.update(
      state(
        Array.from({ length: 60 }, () => 300),
        false,
      ),
      1,
      true,
    );
    expect(f.uniforms.uHeatOn.value).toBe(0);
  });
});
