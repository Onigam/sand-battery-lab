// Symbols in paper space for the three diagrams (PL-05 air loop, PL-06 single line, PL-07 heat side): a blower, a damper, a heater, an exchanger, a pump, a meter, a vessel, a transformer, a motor, a breaker.
// Each is drawn at a paper position through a kit `View` in paper space; sizes are paper millimetres.
import { W, type Pt, type Text, type View } from '@onigam/lab-kit/drawings';
import { arrow, PAPER } from './draw';

/** A straight pipe or wire, with an optional arrow in its middle. */
export function pipe(p: View, pts: Pt[], color: string, w: number = W.medium, flow = false): void {
  p.polyline(pts, { w, color });
  if (flow && pts.length >= 2) {
    const a = pts[Math.floor((pts.length - 1) / 2)]!;
    const b = pts[Math.floor((pts.length - 1) / 2) + 1]!;
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const n = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    arrow(
      p,
      [mx - ((b[0] - a[0]) / n) * 1.5, my - ((b[1] - a[1]) / n) * 1.5],
      [mx + ((b[0] - a[0]) / n) * 1.5, my + ((b[1] - a[1]) / n) * 1.5],
      color,
      W.medium,
    );
  }
}

/** A label beside a symbol. */
export function tag(
  p: View,
  x: number,
  y: number,
  t: Text,
  o: { anchor?: 'start' | 'middle' | 'end'; bold?: boolean; color?: string; size?: number } = {},
): void {
  p.text([x, y], t, {
    size: o.size ?? 1.9,
    anchor: o.anchor ?? 'middle',
    weight: o.bold ? 'bold' : 'normal',
    color: o.color,
    baseline: 'middle',
    halo: true,
  });
}

/** A blower: a circle with a triangle pointing the way the air goes. */
export function blower(p: View, x: number, y: number, r: number, dir: 1 | -1 = 1, color?: string): void {
  p.circle([x, y], r, { w: W.medium, fill: PAPER, color });
  p.polyline(
    [
      [x - dir * r * 0.55, y - r * 0.7],
      [x + dir * r, y],
      [x - dir * r * 0.55, y + r * 0.7],
    ],
    { w: W.medium, closed: true, color },
  );
}

/** A damper on a horizontal or vertical run: a butterfly, drawn open or shut. */
export function damper(
  p: View,
  x: number,
  y: number,
  s: number,
  open: boolean,
  vertical = false,
  color?: string,
): void {
  p.circle([x, y], 0.45, { w: W.thin, fill: color ?? '#1d2b3a', color });
  const a = open ? (vertical ? [0, s] : [s, 0]) : vertical ? [s, 0] : [0, s];
  p.line([x - a[0]!, y - a[1]!], [x + a[0]!, y + a[1]!], { w: W.thick, color });
}

/** The resistors: a box with a zigzag. */
export function heater(p: View, x0: number, y0: number, x1: number, y1: number, color: string): void {
  p.rect([x0, y0], [x1, y1], { w: W.medium, fill: PAPER });
  const n = 6;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++)
    pts.push([x0 + 1 + ((x1 - x0 - 2) * i) / n, (y0 + y1) / 2 + (i % 2 ? -1 : 1) * (y1 - y0) * 0.28]);
  p.polyline(pts, { w: W.medium, color });
}

/** An exchanger: a box with a diagonal, the two fluids across it. */
export function exchanger(p: View, x0: number, y0: number, x1: number, y1: number, color: string): void {
  p.rect([x0, y0], [x1, y1], { w: W.medium, fill: PAPER });
  p.line([x0, y1], [x1, y0], { w: W.medium, color });
}

/** A pump: a circle with the arrow of the kit's style. */
export function pumpSym(p: View, x: number, y: number, r: number, color?: string): void {
  p.circle([x, y], r, { w: W.medium, fill: PAPER, color });
  p.polyline(
    [
      [x - r * 0.7, y - r * 0.55],
      [x + r * 0.8, y],
      [x - r * 0.7, y + r * 0.55],
    ],
    { w: W.thin, closed: true, color },
  );
}

/** A meter: a circle with a letter. */
export function meter(p: View, x: number, y: number, r: number, letter: string, color?: string): void {
  p.circle([x, y], r, { w: W.medium, fill: PAPER, color });
  p.text([x, y], letter, { size: r * 0.62, anchor: 'middle', baseline: 'middle', weight: 'bold', color });
}

/** A transformer on a vertical line: two rings. */
export function transformer(p: View, x: number, y: number, r: number, color?: string): void {
  p.circle([x, y - r * 0.6], r, { w: W.medium, color });
  p.circle([x, y + r * 0.6], r, { w: W.medium, color });
}

/** A breaker on a vertical line: the blade, open a little. */
export function breaker(p: View, x: number, y0: number, y1: number, color?: string): void {
  p.line([x, y0], [x + 1.8, y1 - 0.5], { w: W.medium, color });
  p.line([x - 1, y1], [x + 1, y1], { w: W.thin, color });
}
