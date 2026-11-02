import { Drawing, INK_2, W, type DrawingSheet, type View } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { MWH } from '../sim/runs';
import { siloSpec } from '../sim/silo';
import { LEVEL, SILO } from '../three/dims';
import { FILL, grid, modelTag, note, PAPER } from './draw';
import { cat, fig, lab, perMetre, PC } from './geom';
import { scaleRows } from './model';

// PL-10: the same physics at four sizes, side by side at one scale: the first silo, this one, the 250 MWh silo, the 2 MW product, and two drums of sand. What each source quotes, against what the model gives on one rule.
// The outside sizes are reported, the two drums are derived; a human for scale is not a dimension.

const NUMBER = 'PL-10';
export const LAYOUT = { scale: 200, y: 118 } as const;

/** Reported by the maker (docs/research.md K21 to K24), in metres: height and width of the silo, as quoted. Plain data, not dimensions of the 3D. */
const REPORTED = {
  first: { h: 7, w: 4, power: '200 kW', cap: 8, mass: 100 },
  lab: { h: SILO.totalHeight, w: 2 * SILO.outerR, power: '1 MW', cap: 100, mass: 2000 },
  next: { h: 14, w: 15, power: '2 MW', cap: 250, mass: 2400 },
  product: { h: 15, w: 16, power: '2 MW', mass: 2400 },
} as const;

/** A silo in elevation: a body and a low roof; the height is the height of the whole. */
function silo(v: View, x: number, w: number, h: number, name: L): void {
  const roof = Math.min(1.5, h * 0.12);
  v.rect([x - w / 2, 0], [x + w / 2, h - roof], { w: W.medium, fill: '#d4cec3' });
  v.polyline(
    [
      [x - w / 2, h - roof],
      [x, h],
      [x + w / 2, h - roof],
    ],
    { w: W.medium, closed: true, fill: FILL.roof },
  );
  v.dim([x - w / 2, 0], [x + w / 2, 0], 4, { dir: 'h', label: lab(w, 0, 'R'), size: 2 });
  v.text([x, h + 1.6], name, { size: 2.5, weight: 'bold', anchor: 'middle' });
  v.dim([x + w / 2, 0], [x + w / 2, h], 4, { dir: 'v', label: lab(h, 0, 'R'), size: 2 });
}

/** A person for scale, in elevation. */
function person(v: View, x: number): void {
  v.circle([x, 1.62], 0.12, { w: W.thin, fill: INK_2 });
  v.polyline(
    [
      [x, 1.5],
      [x, 0.85],
      [x - 0.15, 0],
      [x, 0.85],
      [x + 0.15, 0],
    ],
    { w: W.thin },
  );
  v.line([x - 0.25, 1.2], [x + 0.25, 1.2], { w: W.thin });
}

function draw(d: Drawing): void {
  const k = perMetre(LAYOUT.scale);
  const v = d.view(16, LAYOUT.y, k);
  const r = REPORTED;
  const xs = { drums: 3, first: 10.5, lab: 27, next: 47, product: 67.5 };
  v.line([-1, 0], [78, 0], { w: W.medium });
  // ---- two drums: the same volume and the same surface per volume as a cylinder, as the simulation has it
  const drums = siloSpec('two-drums');
  v.rect([xs.drums - drums.bedRadius, 0], [xs.drums + drums.bedRadius, drums.bedHeight], { w: W.medium, fill: PAPER });
  v.text([xs.drums, drums.bedHeight + 1.6], l('deux fûts', 'two drums'), {
    size: 2.5,
    weight: 'bold',
    anchor: 'middle',
  });
  person(v, xs.drums + 1.3);
  silo(v, xs.first, r.first.w, r.first.h, l('8 MWh', '8 MWh'));
  silo(v, xs.lab, r.lab.w, r.lab.h, l('100 MWh, ici', '100 MWh, here'));
  silo(v, xs.next, r.next.w, r.next.h, l('250 MWh, en 2027', '250 MWh, in 2027'));
  silo(v, xs.product, r.product.w, r.product.h, l('produit de 2 MW', '2 MW product'));
  // ---- the bed inside this silo, dashed: 6 m of 13 m
  v.rect([xs.lab - SILO.bedR, LEVEL.bedBottom], [xs.lab + SILO.bedR, LEVEL.bedTop], {
    w: W.thin,
    dash: 'hidden',
    fill: FILL.stone,
  });
  v.text([xs.lab, LEVEL.bedBottom + 3], l('pierre', 'stone'), { size: 2, anchor: 'middle', halo: true });

  // ---- the table
  const rows = scaleRows();
  const row = (id: string) => rows.find((x) => x.id === id)!;
  const fmtMWh = (j: number, digits = 0) => lab(j / MWH, digits, 'M', ' MWh');
  const days = (d0: number, digits = 0) => lab(d0, digits, 'M', l(' j', ' d'));
  const pct = (x: number) => lab(x * 100, 0, 'M', PC);
  const avOf = (id: string) => lab(row(id).surfacePerVolume, 2, 'D', ' m⁻¹');
  const k1 = row('kankaanpaa');
  const k2 = row('pornainen');
  const k3 = row('vaaksy');
  const k4 = row('two-drums');
  grid(
    d,
    16,
    142,
    [
      { label: '', w: 56 },
      { label: l('Deux fûts', 'Two drums'), w: 60, mono: true },
      { label: l('8 MWh, 2022', '8 MWh, 2022'), w: 66, mono: true },
      { label: l('100 MWh, ici', '100 MWh, here'), w: 66, mono: true },
      { label: l('250 MWh, 2027', '250 MWh, 2027'), w: 66, mono: true },
      { label: l('Produit de 2 MW', '2 MW product'), w: 66, mono: true },
    ],
    [
      [
        l('Puissance annoncée', 'Quoted power'),
        l('aucune : 5 kW*', 'none: 5 kW*'),
        r.first.power,
        r.lab.power,
        r.next.power,
        cat(r.product.power, l(', 3 MW de charge', ', 3 MW of charge')),
      ],
      [
        l('Capacité annoncée', 'Quoted capacity'),
        l('aucune', 'none'),
        lab(r.first.cap, 0, 'R', ' MWh'),
        l('jusqu’à 100 MWh', 'up to 100 MWh'),
        lab(r.next.cap, 0, 'R', ' MWh'),
        l('non dite', 'not stated'),
      ],
      [
        l('Masse et matériau', 'Mass and medium'),
        cat(fig('drumsMass', 'D', ' kg'), l(' de sable', ' of sand')),
        cat(l('environ ', 'about '), lab(r.first.mass, 0, 'R', ' t'), l(', sable', ', sand')),
        cat(l('environ ', 'about '), lab(r.lab.mass, 0, 'R', ' t'), l(', pierre', ', stone')),
        cat(l('environ ', 'about '), lab(r.next.mass, 0, 'R', ' t'), l(', sable', ', sand')),
        lab(r.product.mass, 0, 'R', ' t'),
      ],
      [
        l('Surface sur volume', 'Surface per volume'),
        avOf('two-drums'),
        avOf('kankaanpaa'),
        avOf('pornainen'),
        avOf('vaaksy'),
        '—',
      ],
      [
        cat(l('Modèle, à sa puissance', 'Model, at its power')),
        lab(k4.usable / 3.6e6, 1, 'M', ' kWh'),
        fmtMWh(k1.usable, 1),
        fmtMWh(k2.usable),
        fmtMWh(k3.usable),
        '—',
      ],
      [
        l('Modèle, demi-vie', 'Model, half-life'),
        days(k4.halfLife, 1),
        days(k1.halfLife),
        days(k2.halfLife),
        days(k3.halfLife),
        '—',
      ],
      [
        l('Modèle, un cycle', 'Model, a cycle'),
        pct(k4.efficiency),
        pct(k1.efficiency),
        pct(k2.efficiency),
        pct(k3.efficiency),
        '—',
      ],
    ],
    { size: 1.85, pad: 0.65, fills: [undefined, undefined, undefined, undefined, '#fbeee7', '#fbeee7', '#fbeee7'] },
  );
  modelTag(d, 16, 186, 88);
  note(
    d,
    110,
    186,
    112,
    cat(
      l(
        'À gauche, deux fûts, à côté d’une personne : sur 300 K, environ ',
        'On the left, two drums, beside a person: over 300 K, about ',
      ),
      fig('drumsKwh', 'D', ' kWh'),
      l(
        ' avant toute perte. Le modèle applique à chaque silo la même règle de tubes et de soufflantes. Il retrouve la direction : plus c’est grand, mieux ça garde. Il ne retrouve ni le 8 ni le 250, et il le dit.',
        ' before any loss. The model gives each silo the same rule for its pipes and blowers. It finds the direction: the bigger, the better it keeps. It finds neither the 8 nor the 250, and says so.',
      ),
    ),
    { size: 1.85 },
  );
  note(
    d,
    16,
    194,
    88,
    l(
      'Hauteur et largeur, en mètres, comme le constructeur les donne pour le silo entier ; le sens du 16 × 15 du produit n’est pas précisé. Le pilote de 3 MWh est absent : sa taille n’est pas publiée.',
      'Height and width, in metres, as the maker gives them for the whole silo; which way round the product’s 16 × 15 goes is not stated. The 3 MWh pilot is left out: its size is not published.',
    ),
    { size: 1.8 },
  );
}

export const scaleComparison: DrawingSheet = {
  id: 'scale-comparison',
  number: NUMBER,
  group: 'model',
  title: l('La même physique, à quatre tailles', 'The same physics, at four sizes'),
  description: l(
    'Deux fûts, le silo de 8 MWh, celui de 100 MWh, celui de 250 MWh et le produit de 2 MW, côte à côte à la même échelle. Le tableau oppose ce qui est annoncé à ce que le modèle trouve avec une seule règle pour tous : en rouge pâle, les résultats du modèle. C’est la loi d’échelle : la surface croît moins vite que le volume.',
    'Two drums, the 8 MWh silo, the 100 MWh one, the 250 MWh one and the 2 MW product, side by side at one scale. The table sets what is quoted against what the model finds with one rule for all: in pale red, the model results. That is the law of scale: surface grows more slowly than volume.',
  ),
  scene: 'site',
  parts: ['silo-exterior'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La même physique, à quatre tailles', 'The same physics, at four sizes'),
      subtitle: l('Élévations à la même échelle', 'Elevations at one scale'),
      number: NUMBER,
      scale: `1:${LAYOUT.scale}`,
    });
    draw(d);
    return d;
  },
};
