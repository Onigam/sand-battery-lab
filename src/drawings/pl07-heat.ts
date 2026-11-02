import { Drawing, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, tr } from '@onigam/lab-kit/i18n';
import { COOL, FILL, grid, heading, HOT, marksLegend, modelTag, note, PAPER, WATER } from './draw';
import { cat, fig, lab, PC } from './geom';
import { exchanger, meter, pipe, pumpSym, tag } from './symbols';

// PL-07: the heat side, from the exchanger on the equipment floor to a house: exchanger, pump, meter, vessel, the two pipes down the wall, the boiler in parallel, the trench, the school, a house. Supply 85 °C from a
// sister plant, return an estimate; the network itself is not in the model, which stops at the meter.

const NUMBER = 'PL-07';
export const ITEMS = ['air-water-exchanger', 'dh-pump', 'heat-meter', 'expansion-vessel'];

function draw(d: Drawing): void {
  const p = d.paper();
  const hot = '#c0392b';
  const cold = COOL;
  const ySup = 62;
  const yRet = 92;

  // ---- the equipment floor, a dashed room
  p.rect([18, 28], [188, 118], { w: W.thin, color: INK_2, dash: 'hidden' });
  tag(p, 22, 32, l('ÉTAGE TECHNIQUE (notre lecture)', 'EQUIPMENT FLOOR (our reading)'), {
    anchor: 'start',
    bold: true,
    color: INK_2,
    size: 1.9,
  });

  // the air side of the exchanger
  const ex0 = 56;
  const ex1 = 84;
  pipe(
    p,
    [
      [26, ySup - 4],
      [ex0, ySup - 4],
    ],
    HOT,
    W.thick,
    true,
  );
  tag(p, 26, ySup - 8.5, l('air chaud, de la pierre', 'hot air, from the stone'), {
    anchor: 'start',
    size: 1.8,
    color: HOT,
  });
  pipe(
    p,
    [
      [ex0, yRet + 4],
      [26, yRet + 4],
    ],
    cold,
    W.thick,
    true,
  );
  tag(p, 26, yRet + 8.5, cat(l('air refroidi, ', 'cooled air, '), fig('airOut', 'E', ' °C')), {
    anchor: 'start',
    size: 1.8,
    color: cold,
  });
  exchanger(p, ex0, ySup - 8, ex1, yRet + 8, WATER);
  tag(p, (ex0 + ex1) / 2, ySup + 15, l('échangeur', 'exchanger'), { bold: true, size: 1.9 });
  tag(p, (ex0 + ex1) / 2, ySup + 19, l('à contre-courant', 'counterflow'), { size: 1.7 });
  tag(p, (ex0 + ex1) / 2, ySup + 23.5, fig('exchangerUA', 'M', ' kW/K'), { size: 1.8 });

  // the water: supply on top, return below
  pipe(
    p,
    [
      [ex1, ySup],
      [395, ySup],
    ],
    hot,
    1.1,
  );
  pipe(
    p,
    [
      [395, yRet],
      [ex1, yRet],
    ],
    cold,
    1.1,
  );
  // meter on the supply, pump on the return, vessel on the return
  meter(p, 112, ySup, 5.2, 'Q', hot);
  tag(p, 112, ySup - 8, l('compteur de chaleur', 'heat meter'), { bold: true, size: 1.9 });
  pumpSym(p, 112, yRet, 5.2, cold);
  tag(p, 112, yRet + 8, l('pompe du réseau', 'network pump'), { bold: true, size: 1.9 });
  tag(p, 112, yRet + 12, cat(fig('waterKgS', 'D', ' kg/s'), ', ', fig('pumpKpa', 'E', ' kPa')), { size: 1.8 });
  const vx = 150;
  pipe(
    p,
    [
      [vx, yRet],
      [vx, yRet + 6],
    ],
    cold,
    W.medium,
  );
  p.circle([vx, yRet + 11], 5, { w: W.medium, fill: PAPER });
  p.line([vx - 5, yRet + 11], [vx + 5, yRet + 11], { w: W.thin });
  tag(p, vx + 7, yRet + 11, l('vase d’expansion', 'expansion vessel'), { anchor: 'start', bold: true, size: 1.9 });

  // labels on the two lines
  tag(p, 150, ySup - 3.5, cat(lab(85, 0, 'R', ' °C'), l(' : départ', ': supply')), { size: 2, color: hot, bold: true });
  tag(p, 142, yRet - 3.5, cat(fig('returnT', 'E', ' °C'), l(' : retour', ': return')), {
    size: 2,
    color: cold,
    bold: true,
  });

  // ---- the risers: leave the room, go down the wall
  p.line([188, ySup - 8], [188, ySup + 8], { w: W.thin });
  tag(p, 203, ySup - 11, l('colonnes du réseau', 'network risers'), { size: 1.9, bold: true });
  tag(p, 203, ySup - 7, l('le long du mur', 'down the wall'), { size: 1.7 });
  // ---- the boiler in parallel
  const bx = 244;
  pipe(
    p,
    [
      [bx, ySup],
      [bx, 36],
    ],
    hot,
    W.medium,
  );
  pipe(
    p,
    [
      [bx + 24, 36],
      [bx + 24, yRet],
    ],
    cold,
    W.medium,
  );
  p.rect([bx - 6, 22], [bx + 30, 36], { w: W.medium, fill: FILL.gravel });
  tag(p, bx + 12, 27, l('chaufferie à plaquettes', 'wood-chip boiler plant'), { bold: true, size: 1.9 });
  tag(p, bx + 12, 31.5, cat(l('en parallèle · ', 'in parallel · '), fig('boilerPrice', 'E', ' €/MWh')), { size: 1.7 });
  // ---- the trench
  p.rect([282, ySup - 5], [314, yRet + 5], { w: W.thin, color: INK_2, dash: 'hidden' });
  tag(p, 298, yRet + 8.5, l('tranchée', 'trench'), { bold: true, size: 1.9 });
  // ---- the school and the house, each a plate exchanger
  const load = (x: number, y: number, name: ReturnType<typeof l>) => {
    pipe(
      p,
      [
        [x, ySup],
        [x, y],
      ],
      hot,
      W.medium,
    );
    pipe(
      p,
      [
        [x + 12, y + 16],
        [x + 12, yRet],
      ],
      cold,
      W.medium,
    );
    exchanger(p, x - 4, y, x + 16, y + 16, WATER);
    tag(p, x + 6, y - 3, name, { bold: true, size: 1.9 });
  };
  load(330, 104, l('l’école', 'the school'));
  load(368, 104, l('une maison', 'a house'));
  // the school's and the house's loops
  for (const x of [330, 368]) {
    p.rect([x - 1, 128], [x + 13, 136], { w: W.thin, fill: PAPER });
    tag(p, x + 6, 132, l('radiateurs', 'radiators'), { size: 1.6 });
    pipe(
      p,
      [
        [x + 2, 120],
        [x + 2, 128],
      ],
      hot,
      W.thin,
    );
    pipe(
      p,
      [
        [x + 10, 128],
        [x + 10, 120],
      ],
      cold,
      W.thin,
    );
  }
  tag(p, 349, 141, l('aucune flamme, deux eaux jamais mélangées', 'no flame, two waters never mixed'), {
    size: 1.7,
    color: INK_2,
  });

  // ---- what the water says
  heading(d, 18, 128, l('LES DEUX EAUX', 'THE TWO WATERS'));
  grid(
    d,
    18,
    133,
    [
      { label: l('Grandeur', 'Quantity'), w: 84 },
      { label: l('Valeur', 'Value'), w: 60, mono: true },
      { label: l('D’où ça vient', 'Where it comes from'), w: 88 },
    ],
    [
      [
        l('Départ', 'Supply'),
        lab(85, 0, 'R', ' °C'),
        l(
          'une installation sœur, celui du vrai silo n’est pas publié',
          'a sister plant, the real silo’s is not published',
        ),
      ],
      [
        l('Retour', 'Return'),
        fig('returnT', 'E', ' °C'),
        l('d’autres réseaux, pas ce réseau', 'other networks, not this one'),
      ],
      [l('Débit à 1 MW', 'Flow at 1 MW'), fig('waterKgS', 'D', ' kg/s'), l('1 MW sur 40 K', '1 MW over 40 K')],
      [
        l('Demande d’hiver', 'Winter demand'),
        fig('winterKw', 'D', ' kW'),
        l('100 MWh en une semaine, selon le constructeur', '100 MWh in a week, says the maker'),
      ],
      [
        l('Demande d’été', 'Summer demand'),
        fig('summerKw', 'D', ' kW'),
        l('100 MWh en un mois, selon le constructeur', '100 MWh in a month, says the maker'),
      ],
      [
        l('Sur un an', 'Over a year'),
        fig('yearGWh', 'D', ' GWh'),
        l('moitié de l’année à chacune', 'half the year at each'),
      ],
    ],
    { size: 1.8, pad: 0.55 },
  );
  modelTag(d, 262, 150, 80);
  grid(
    d,
    262,
    156.5,
    [
      { label: l('Le même plein', 'The same full charge'), w: 50 },
      { label: '', w: 30, align: 'end', mono: true },
    ],
    [
      [l('à la demande d’hiver', 'at winter demand'), fig('daysWinter', 'M', l(' jours', ' days'))],
      [l('à la demande d’été', 'at summer demand'), fig('daysSummer', 'M', l(' jours', ' days'))],
      [l('part de la pierre sur un an, de', 'share of the stone over a year, from'), fig('coverageLow', 'M', PC)],
      [l('à', 'to'), fig('coverageHigh', 'M', PC)],
    ],
    { size: 1.75, pad: 0.5 },
  );
  note(
    d,
    18,
    170,
    230,
    l(
      'C’est le retour qui fait le travail : plus l’eau revient froide, plus l’air se refroidit dans l’échangeur, et plus on peut aller chercher de chaleur dans la pierre. Chaque maison compte donc, jusqu’au silo : un radiateur mal réglé se paie dans le lit. Le réseau lui-même n’est pas dans le modèle, qui s’arrête au compteur : ni ses pertes, ni ses longueurs ne sont calculées. La chaufferie gardée en secours reprend quand la pierre ne suffit plus.',
      'It is the return that does the work: the colder the water comes back, the more the air cools in the exchanger, and the more heat can be fetched from the stone. So every house counts, all the way to the silo: a poorly set radiator is paid for in the bed. The network itself is not in the model, which stops at the meter: neither its losses nor its lengths are computed. The boiler plant kept as a backup takes over when the stone no longer suffices.',
    ),
    { size: 1.9 },
  );
  marksLegend(d, 18, 196, 100);
}

export const heatSide: DrawingSheet = {
  id: 'heat-side',
  number: NUMBER,
  group: 'plant-room',
  title: l('Le côté de la chaleur', 'The heat side'),
  description: l(
    'De l’échangeur de l’étage technique jusqu’aux radiateurs d’une maison : la pompe, le compteur, le vase d’expansion, les deux colonnes le long du mur, la chaudière en parallèle, la tranchée. Rouge pour le départ, bleu pour le retour. Le modèle s’arrête au compteur : au-delà, c’est le réseau tel qu’il existe déjà.',
    'From the exchanger on the equipment floor to the radiators of a house: the pump, the meter, the expansion vessel, the two risers down the wall, the boiler in parallel, the trench. Red for the supply, blue for the return. The model stops at the meter: beyond it is the network as it already exists.',
  ),
  scene: 'plant-room',
  parts: ITEMS,
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le côté de la chaleur', 'The heat side'),
      subtitle: l('De l’échangeur à une maison', 'From the exchanger to a house'),
      number: NUMBER,
      scale: tr(l('schéma', 'diagram')),
    });
    draw(d);
    return d;
  },
};
