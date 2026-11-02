import { Drawing, INK_2, W, type DrawingSheet, type View } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { nEn, nFr } from '../data/units';
import { SILO, ZONE_R } from '../three/dims';
import { HEAT_MAX, HEAT_MIN, HEAT_STOPS } from '../three/heat';
import { caption, grid, modelTag, note, PAPER } from './draw';
import { cat, lab, perMetre } from './geom';
import { chargeCurve, temperatureMaps } from './model';

// PL-03: the section at 0, 25, 50 and 100 % of a first charge, as the model finds it: a half-section (r, z) of the grid of src/sim, coloured with the same ramp as the 3D (src/three/heat.ts, in °C). Model
// output, in a red box. False colour: stone at 400 °C does not glow.

const NUMBER = 'PL-03';
export const LAYOUT = { scale: 80, y: 112, xs: [24, 122, 220, 318] } as const;

/** The ramp of the 3D as a colour string. */
export function rampColor(T: number): string {
  const t = Math.min(HEAT_MAX, Math.max(HEAT_MIN, T));
  for (let i = 0; i < HEAT_STOPS.length - 1; i++) {
    const [t0, c0] = HEAT_STOPS[i]!;
    const [t1, c1] = HEAT_STOPS[i + 1]!;
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0);
      const ch = (s: number) => {
        const a = (c0 >> s) & 255;
        const b = (c1 >> s) & 255;
        return Math.round(a + (b - a) * k);
      };
      return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
    }
  }
  return '#a61a3c';
}

function section(d: Drawing, v: View, level: number, i: number): void {
  const maps = temperatureMaps();
  const m = maps[i]!;
  const R = SILO.bedR;
  const H = SILO.bedHeight;
  const dr = R / m.rings;
  const dz = H / m.layers;
  // the cells of the model's grid, without smoothing: what the grid holds, not more
  for (let k = 0; k < m.layers; k++)
    for (let j = 0; j < m.rings; j++) {
      const T = m.field[j + m.rings * k]!;
      v.rect([j * dr, k * dz], [(j + 1) * dr, (k + 1) * dz], { w: 0.05, color: '#ffffff66', fill: rampColor(T) });
    }
  v.rect([0, 0], [R, H], { w: W.medium });
  v.center([0, -0.3], [0, H + 0.3], 0);
  for (const zr of ZONE_R.slice(0, 2)) v.line([zr, 0], [zr, H], { w: W.thin, dash: 'center', color: PAPER });
  const [x, y] = v.map([0, 0]);
  const p = d.paper();
  const k = perMetre(LAYOUT.scale);
  p.text(
    [x + (R * k) / 2, y - k * H - 2.5],
    l(`${Math.round(level * 100)} % de la charge`, `${Math.round(level * 100)}% of the charge`),
    {
      size: 2.8,
      weight: 'bold',
      anchor: 'middle',
    },
  );
  p.text([x, y + 3], l('axe', 'axis'), { size: 1.7, anchor: 'middle', color: INK_2 });
  p.text([x + R * k, y + 3], l('paroi', 'wall'), { size: 1.7, anchor: 'middle', color: INK_2 });
}

/** Core, mean and edge against the hours of the first charge, in paper space. */
function chart(d: Drawing, x: number, y: number, w: number, h: number): void {
  const c = chargeCurve();
  const p = d.paper();
  const tMax = c.hours[c.hours.length - 1]!;
  const X = (t: number) => x + (t / tMax) * w;
  const Y = (T: number) => y + h - (T / 500) * h;
  p.rect([x, y], [x + w, y + h], { w: W.thin, fill: PAPER });
  for (const T of [100, 200, 300, 400, 500]) {
    p.line([x, Y(T)], [x + w, Y(T)], { w: W.thin, color: '#d9d2c4' });
    p.text([x - 1.2, Y(T)], lab(T, 0, 'M', ''), { size: 1.7, anchor: 'end', baseline: 'middle', mono: true });
  }
  const line = (ys: number[], color: string) =>
    p.polyline(
      c.hours.map((t, i): [number, number] => [X(t), Y(ys[i]!)]),
      { w: W.medium, color },
    );
  line(c.core, '#c8501e');
  line(c.mean, '#1d2b3a');
  line(c.edge, '#5a7fa8');
  p.text([x + w + 2, Y(c.core[c.core.length - 1]!) - 2], l('cœur', 'core'), {
    size: 1.9,
    color: '#c8501e',
    baseline: 'middle',
  });
  p.text([x + w + 2, Y(c.mean[c.mean.length - 1]!)], l('moyenne', 'mean'), { size: 1.9, baseline: 'middle' });
  p.text([x + w + 2, Y(c.edge[c.edge.length - 1]!) + 2], l('bord', 'edge'), {
    size: 1.9,
    color: '#5a7fa8',
    baseline: 'middle',
  });
  p.text(
    [x, y - 2],
    l('Température, °C, contre les heures de charge', 'Temperature, °C, against the hours of charge'),
    { size: 2, weight: 'bold' },
  );
  p.text([x + w, y + h + 3.2], lab(tMax, 0, 'M', ' h'), { size: 1.8, anchor: 'end', mono: true });
}

function draw(d: Drawing): void {
  const maps = temperatureMaps();
  const k = perMetre(LAYOUT.scale);
  LAYOUT.xs.forEach((x, i) => section(d, d.view(x, LAYOUT.y, k), maps[i]!.level, i));
  caption(
    d,
    200,
    19,
    l(
      'LA PIERRE EN COUPE, DE L’AXE À LA PAROI, PENDANT UNE PREMIÈRE CHARGE',
      'THE STONE IN SECTION, FROM AXIS TO WALL, DURING A FIRST CHARGE',
    ),
    `1:${LAYOUT.scale}`,
  );

  // ---- the ramp
  const p = d.paper();
  const x0 = 24;
  const y0 = 122;
  const w = 290;
  for (let i = 0; i < 120; i++) {
    const T = HEAT_MIN + ((HEAT_MAX - HEAT_MIN) * (i + 0.5)) / 120;
    p.rect([x0 + (i * w) / 120, y0], [x0 + ((i + 1) * w) / 120, y0 + 5], {
      w: 0,
      color: rampColor(T),
      fill: rampColor(T),
    });
  }
  p.rect([x0, y0], [x0 + w, y0 + 5], { w: W.thin });
  for (const [T] of HEAT_STOPS) {
    const x = x0 + ((T - HEAT_MIN) / (HEAT_MAX - HEAT_MIN)) * w;
    p.line([x, y0 + 5], [x, y0 + 6.5], { w: W.thin });
    p.text([x, y0 + 9], lab(T, 0, 'M', ' °C'), { size: 1.9, anchor: 'middle', mono: true });
  }
  p.text([x0 + w + 4, y0 + 2.5], l('fausse couleur', 'false colour'), { size: 2, baseline: 'middle', italic: true });

  // ---- the table
  modelTag(d, 24, 138, 88);
  const fmt = (v: number, u: string) => lab(v, 0, 'M', u);
  grid(
    d,
    24,
    145,
    [
      { label: l('Charge', 'Charge'), w: 26, mono: true },
      { label: l('Heures à 1 MW offert', 'Hours at 1 MW on offer'), w: 40, align: 'end', mono: true },
      { label: l('Moyenne', 'Mean'), w: 28, align: 'end', mono: true },
      { label: l('Cœur', 'Core'), w: 28, align: 'end', mono: true },
      { label: l('Bord', 'Edge'), w: 28, align: 'end', mono: true },
    ],
    maps.map((m) => [
      l(`${nFr(m.level * 100, 0)} %`, `${nEn(m.level * 100, 0)}%`),
      fmt(m.hours, ' h'),
      fmt(m.meanT, ' °C'),
      fmt(m.coreT, ' °C'),
      fmt(m.edgeT, ' °C'),
    ]),
    { size: 2, pad: 0.8 },
  );
  note(
    d,
    190,
    140,
    215,
    cat(
      l(
        'Ce que montre le modèle, et que la vue d’ensemble du silo montre en direct : le cœur prend de l’avance au début, car on charge par lui, puis le bord le rattrape. Une moyenne de 400 °C sous 500 °C d’air laisse peu de place à un cœur chaud : le champ final est bien plus plat que l’image publiée par le constructeur, dont l’échelle va de 0 à 650 °C. Il n’y a pas de convection dans le lit : ce gradient tient à la lenteur de la conduction et à l’ordre de la charge. Les lignes tiretées marquent les zones, estimées.',
        'What the model shows, and the overview of the silo shows live: the core pulls ahead at first, as the charge goes through it, then the edge catches up. A mean of 400 °C under 500 °C of air leaves little room for a hot core: the final field is far flatter than the picture the maker publishes, whose scale runs from 0 to 650 °C. There is no convection in the bed: this gradient comes from slow conduction and the order of charge. The dashed lines mark the zones, which are estimated.',
      ),
    ),
    { size: 2 },
  );
  note(
    d,
    190,
    168,
    215,
    l(
      'Chaque rectangle est une cellule de la grille du modèle, dix anneaux sur six couches, à sa température moyenne. La vraie pierre n’a pas ces marches, et près d’un tube elle est plus chaude que la moyenne de sa cellule. Les couleurs sont celles de la coupe du monde 3D : à 400 °C, une pierre ne rougeoie pas, elle a l’air froide.',
      'Each rectangle is one cell of the model’s grid, ten rings by six layers, at its mean temperature. The real stone has no such steps, and near a pipe it is hotter than its cell’s mean. The colours are those of the 3D section: at 400 °C, stone does not glow, it looks cold.',
    ),
    { size: 2 },
  );
  // ---- the same charge as curves
  chart(d, 24, 186, 150, 54);
}

export const temperatureMapsSheet: DrawingSheet = {
  id: 'temperature-maps',
  number: NUMBER,
  group: 'model',
  title: l('Le champ de températures', 'The temperature field'),
  description: l(
    'La pierre en coupe à quatre moments d’une première charge, telle que le modèle la calcule, avec la même échelle de couleurs que la 3D. Ce sont des résultats du modèle, jamais une mesure. Comparez le cœur et le bord d’une image à l’autre.',
    'The stone in section at four moments of a first charge, as the model computes it, with the same colour scale as the 3D. These are model results, never a measurement. Compare the core and the edge from one picture to the next.',
  ),
  scene: 'silo',
  parts: ['storage-bed', 'pipe-field'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le champ de températures', 'The temperature field'),
      subtitle: l('Résultat du modèle, en fausse couleur', 'Model result, in false colour'),
      number: NUMBER,
      scale: `1:${LAYOUT.scale}`,
    });
    draw(d);
    return d;
  },
};
