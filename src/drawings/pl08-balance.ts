import { Drawing, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, tr, type L } from '@onigam/lab-kit/i18n';
import { MODEL } from '../data/figures';
import { grid, heading, HOT, modelTag, note, PAPER, RED, WATER } from './draw';
import { cat, fig, lab, PC } from './geom';
import { powerCurve } from './model';

// PL-08: where the energy goes, model output: the 217 MWh of a full charge as a Sankey (69 at 1 MW, 105 at falling power, 43 stay in the stone), a year's electricity (heat, walls, circulation), and the heart of the lab: a
// capacity against the power. Nothing here is a measurement; the reported figures stand beside them, told apart.

const NUMBER = 'PL-08';
const Y_SCALE = 0.4; // paper mm per MWh in the first Sankey

/** A band of a Sankey, from a vertical span on the left to one on the right, in paper space. */
function band(d: Drawing, x0: number, y0: number, x1: number, y1: number, h: number, fill: string): void {
  const p = d.paper();
  const mx = (x0 + x1) / 2;
  p.pathPaper(
    `M ${x0} ${y0} C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1} L ${x1} ${y1 + h} C ${mx} ${y1 + h}, ${mx} ${y0 + h}, ${x0} ${y0 + h} Z`,
    { w: W.thin, color: fill, fill, opacity: 0.75 },
  );
}

function draw(d: Drawing): void {
  const p = d.paper();

  // ---- a full charge
  heading(
    d,
    18,
    20,
    l('UN PLEIN : OÙ VONT LES 217 MWh AU-DESSUS DE L’AMBIANTE', 'ONE FULL CHARGE: WHERE THE 217 MWh ABOVE AMBIENT GO'),
  );
  modelTag(d, 18, 26, 88);
  const x0 = 26;
  const x1 = 160;
  let y = 44;
  const total = MODEL.usable + MODEL.tail + MODEL.stays;
  p.rect([x0 - 8, y], [x0, y + total * Y_SCALE], { w: W.medium, fill: HOT });
  p.text([x0 - 4, y - 2], fig('heatFull', 'D', ' MWh'), { size: 2.2, anchor: 'middle', weight: 'bold' });
  const parts: [number, string, L, number][] = [
    [MODEL.usable, '#c8501e', l('rendus à 1 MW', 'given at 1 MW'), MODEL.shareUsable],
    [
      MODEL.tail,
      '#e6a34a',
      l('rendus ensuite, à puissance décroissante', 'given afterwards, at falling power'),
      MODEL.shareTail,
    ],
    [
      MODEL.stays,
      '#b5ae9f',
      l('restent dans la pierre, sous l’eau de départ', 'stay in the stone, below the supply water'),
      MODEL.shareStays,
    ],
  ];
  let yr = y - 2;
  for (const [mwh, color, name, share] of parts) {
    const h = mwh * Y_SCALE;
    band(d, x0, y, x1, yr, h, color);
    p.text([x1 + 3, yr + h / 2 - 1.7], cat(lab(mwh, 0, 'M', ' MWh'), `, `, lab(share, 0, 'M', PC)), {
      size: 2.5,
      weight: 'bold',
      baseline: 'middle',
      color: RED,
    });
    p.text([x1 + 3, yr + h / 2 + 1.9], name, { size: 1.9, baseline: 'middle' });
    y += h;
    yr += h + 5;
  }

  // ---- a year's electricity
  heading(
    d,
    18,
    148,
    l('UNE ANNÉE : L’ÉLECTRICITÉ, SOUS UNE RÈGLE À 40 €/MWh', 'A YEAR: THE ELECTRICITY, UNDER A 40 €/MWh RULE'),
  );
  const S2 = 0.5;
  const y2 = 158;
  p.rect([x0 - 8, y2], [x0, y2 + 100 * S2], { w: W.medium, fill: '#3a6ea5' });
  p.text([x0 - 4, y2 - 2], lab(100, 0, 'M', PC), { size: 2.2, anchor: 'middle', weight: 'bold' });
  const heatPct = MODEL.etaYear;
  const walls = MODEL.wallsYear;
  const circ = MODEL.circYear;
  band(d, x0, y2, x1, y2 - 1, heatPct * S2, WATER);
  p.text([x1 + 3, y2 + (heatPct * S2) / 2 - 1.7], lab(heatPct, 0, 'M', PC), {
    size: 2.5,
    weight: 'bold',
    baseline: 'middle',
    color: RED,
  });
  p.text(
    [x1 + 3, y2 + (heatPct * S2) / 2 + 1.9],
    l('de chaleur vendue, à lire comme un plafond', 'of heat sold, to be read as a ceiling'),
    { size: 1.9, baseline: 'middle' },
  );
  const ya = y2 + heatPct * S2 + 3;
  band(d, x0, y2 + heatPct * S2, x1, ya, walls * S2, '#b5ae9f');
  p.text([x1 + 3, ya + 1], cat(fig('wallsYear', 'M', PC), l(' par les parois', ' through the walls')), {
    size: 1.9,
    baseline: 'middle',
    color: RED,
  });
  const yb = ya + walls * S2 + 3;
  band(d, x0, y2 + (heatPct + walls) * S2, x1, yb, circ * S2, '#8d8273');
  p.text(
    [x1 + 3, yb + 1],
    cat(fig('circYear', 'M', PC), l(' de circulation et de charge', ' for circulation and charging')),
    { size: 1.9, baseline: 'middle', color: RED },
  );

  // ---- a capacity against the power
  heading(d, 248, 20, l('UNE CAPACITÉ N’A DE SENS QU’À UNE PUISSANCE', 'A CAPACITY ONLY MEANS SOMETHING AT A POWER'));
  modelTag(d, 248, 26, 88);
  const curve = powerCurve();
  const cx0 = 262;
  const cy1 = 118;
  const cw = 140;
  const ch = 80;
  const X = (kw: number) => cx0 + (kw / 1100) * cw;
  const Y = (mwh: number) => cy1 - (mwh / 180) * ch;
  p.rect([cx0, cy1 - ch], [cx0 + cw, cy1], { w: W.thin, fill: PAPER });
  for (const v of [50, 100, 150]) {
    p.line([cx0, Y(v)], [cx0 + cw, Y(v)], { w: W.thin, color: '#d9d2c4' });
    p.text([cx0 - 1.2, Y(v)], lab(v, 0, 'R', ''), { size: 1.8, anchor: 'end', baseline: 'middle', mono: true });
  }
  for (const v of [250, 500, 750, 1000]) {
    p.line([X(v), cy1], [X(v), cy1 + 1], { w: W.thin });
    p.text([X(v), cy1 + 3.4], lab(v, 0, 'R', ''), { size: 1.8, anchor: 'middle', mono: true });
  }
  p.text([cx0 + cw, cy1 + 7], l('puissance demandée, kW', 'power asked, kW'), { size: 1.9, anchor: 'end' });
  p.text([cx0, cy1 - ch - 1.5], l('MWh rendus', 'MWh given'), { size: 1.9 });
  const sorted = [...curve].sort((a, b) => a.power - b.power);
  p.polyline(
    sorted.map((c): [number, number] => [X(c.power), Y(c.usable)]),
    { w: W.medium, color: RED },
  );
  for (const c of sorted) {
    p.circle([X(c.power), Y(c.usable)], 1.1, { w: W.thin, color: RED, fill: PAPER });
    const below = Math.abs(c.usable - 100) < 12;
    p.text([X(c.power) + (below ? -2 : 2), Y(c.usable) + (below ? 4 : -2.2)], cat(lab(c.usable, 0, 'M', ' MWh')), {
      size: 2,
      color: RED,
      weight: 'bold',
      anchor: below ? 'end' : 'start',
    });
  }
  // what the maker quotes, at a power it does not state: a band, never a point of the model
  p.line([cx0, Y(100)], [cx0 + cw, Y(100)], { w: W.medium, dash: 'hidden', color: INK_2 });
  p.text(
    [cx0 + 2, Y(100) - 1.6],
    l('jusqu’à 100 MWh annoncés, puissance non dite', 'up to 100 MWh quoted, power unsaid'),
    { size: 1.9, color: INK_2 },
  );

  grid(
    d,
    248,
    132,
    [
      { label: l('Puissance', 'Power'), w: 40 },
      { label: 'MWh', w: 24, align: 'end', mono: true },
      { label: l('Part', 'Share'), w: 24, align: 'end', mono: true },
      { label: l('Durée', 'Lasts'), w: 30, align: 'end', mono: true },
      { label: l('Annoncé', 'Quoted'), w: 36 },
    ],
    [
      row(l('1 MW, nominal', '1 MW, rated'), 0, l('—', '—')),
      row(l('800 kW', '800 kW'), 1, l('—', '—')),
      row(cat(fig('winterKw', 'D', ' kW'), l(', hiver', ', winter')), 2, l('une semaine', 'a week')),
      row(cat(fig('summerKw', 'D', ' kW'), l(', été', ', summer')), 3, l('presque un mois', 'almost a month')),
    ],
    { size: 1.85, pad: 0.6 },
  );
  note(
    d,
    248,
    162,
    154,
    cat(
      l('Les 100 MWh annoncés représentent ', 'The 100 MWh quoted are '),
      fig('share100', 'D', PC),
      l(
        ' de la chaleur, sans que la puissance soit dite. Le modèle les rejoindrait vers ',
        ' of the heat, with the power left unsaid. The model would reach them near ',
      ),
      fig('powerFor46', 'M', ' kW'),
      l(', ou à 1 MW avec des soufflantes ', ', or at 1 MW with blowers '),
      fig('blowerTimes', 'M'),
      l(
        ' fois plus grosses, dont la taille n’est publiée nulle part. Il ne peut pas dire laquelle. Selon les estimations, il rend de ',
        ' times larger, whose size is published nowhere. It cannot say which. Across the estimates it gives ',
      ),
      fig('rangeLow', 'M'),
      l(' à ', ' to '),
      fig('rangeHigh', 'M', ' MWh'),
      l(
        ' à 1 MW. Le rendement de l’année, de son côté, est le chiffre le plus sûr du modèle, mais il lui manque les fuites d’air, les vrais ponts thermiques et les réglages d’une première année.',
        ' at 1 MW. The year’s efficiency, for its part, is the model’s safest figure, but it lacks air leaks, real thermal bridges and a first year’s ramp-ups.',
      ),
    ),
    { size: 1.9 },
  );
}

function row(label: L, i: number, quoted: L): (L | string)[] {
  const c = powerCurve()[i]!;
  return [
    label,
    lab(c.usable, 0, 'M', ''),
    lab(c.share, 0, 'M', PC),
    c.days < 3.5 ? lab(c.days * 24, 0, 'M', ' h') : lab(c.days, c.days < 20 ? 1 : 0, 'M', l(' j', ' d')),
    quoted,
  ];
}

export const energyBalance: DrawingSheet = {
  id: 'energy-balance',
  number: NUMBER,
  group: 'model',
  title: l('Où va l’énergie', 'Where the energy goes'),
  description: l(
    'Trois lectures du même modèle : ce que devient un plein, ce que devient l’électricité d’une année, et ce qu’un même silo rend selon la puissance demandée. Tout ce qui est en rouge sort de la simulation, rien n’est mesuré. Le trait tireté est le chiffre du constructeur, qui ne dit pas à quelle puissance.',
    'Three readings of the same model: what becomes of a full charge, what becomes of a year’s electricity, and what one silo gives against the power asked. All that is red comes from the simulation, nothing is measured. The dashed line is the maker’s figure, which does not say at what power.',
  ),
  scene: 'silo',
  parts: ['storage-bed'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Où va l’énergie', 'Where the energy goes'),
      subtitle: l('Résultats du modèle, pas des mesures', 'Model results, not measurements'),
      number: NUMBER,
      scale: tr(l('schéma', 'diagram')),
    });
    draw(d);
    return d;
  },
};
