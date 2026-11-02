import { COLORS, Drawing, INK, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, tr } from '@onigam/lab-kit/i18n';
import { CURRENT, grid, heading, HOT, marksLegend, modelTag, note, PAPER, WATER } from './draw';
import { cat, fig, lab, PC } from './geom';
import { breaker, heater, meter, pipe, tag, transformer } from './symbols';

// PL-06: from the medium-voltage line to the resistors, a single-line diagram. 1,443 A at 400 V for 1 MW is arithmetic; the voltages and the sizes are assumptions and estimates, generic: no source gives the plant's
// electrical installation. The flow switch, the one safety that decides, is drawn apart.

const NUMBER = 'PL-06';
export const ITEMS = [
  'lv-switchboard',
  'heater-controller',
  'resistor-bank',
  'charge-blower',
  'discharge-blower',
  'blower-drive',
  'dh-pump',
  'control-cabinet',
];

function draw(d: Drawing): void {
  const p = d.paper();
  const X = 54;
  const C = CURRENT;
  // ---- the line, the annex, the transformer, the riser
  tag(p, X, 21, l('LIGNE MOYENNE TENSION', 'MEDIUM-VOLTAGE LINE'), { bold: true, size: 2.1 });
  tag(p, X, 25.5, fig('mediumV', 'E', ' kV'), { size: 2 });
  pipe(
    p,
    [
      [X, 28],
      [X, 40],
    ],
    C,
    W.thick,
  );
  p.rect([X - 22, 34], [X + 22, 50], { w: W.thin, color: INK_2, dash: 'hidden' });
  tag(p, X - 21, 37, l('local électrique', 'electrical annex'), { anchor: 'start', size: 1.7, color: INK_2 });
  breaker(p, X, 40, 46, C);
  pipe(
    p,
    [
      [X, 46],
      [X, 57],
    ],
    C,
    W.thick,
  );
  transformer(p, X, 63, 6, C);
  tag(p, X + 10, 60, l('transformateur', 'transformer'), { anchor: 'start', bold: true });
  tag(p, X + 10, 64.5, cat(l('environ ', 'about '), fig('transformerKva', 'E', ' kVA')), { anchor: 'start' });
  tag(p, X + 10, 69, cat(fig('transformerEta', 'E', PC), l(' de rendement', ' efficiency')), { anchor: 'start' });
  pipe(
    p,
    [
      [X, 70],
      [X, 96],
    ],
    C,
    W.thick,
  );
  p.line([X, 96], [X, 96.01], { w: W.thick, color: C });
  tag(p, X + 3, 78, l('colonne des câbles', 'cable riser'), { anchor: 'start', bold: true });
  tag(p, X + 3, 82.5, cat(fig('riserMm2', 'E', ' mm²'), l(' par phase', ' per phase')), { anchor: 'start' });
  tag(p, X + 3, 87, cat(fig('riserLength', 'E', ' m'), ', ', fig('riserLossKw', 'E', ' kW'), l(' perdus', ' lost')), {
    anchor: 'start',
  });

  // ---- the board and its bus
  const busY = 104;
  const xs = [78, 142, 206, 270, 334];
  p.rect([18, 96], [392, 112], { w: W.medium, fill: '#f6efe2' });
  tag(p, 24, 100, l('TABLEAU BASSE TENSION', 'LOW-VOLTAGE SWITCHBOARD'), { anchor: 'start', bold: true, size: 2 });
  tag(
    p,
    24,
    106.5,
    cat(
      fig('volts', 'E', ' V'),
      l(' triphasé · ', ' three-phase · '),
      fig('amps', 'D', ' A'),
      l(' à 1 MW', ' at 1 MW'),
    ),
    { anchor: 'start', color: COLORS.red, size: 2 },
  );
  p.line([78, busY + 3], [362, busY + 3], { w: 1.1, color: C });

  const drop = (x: number, y1: number) => {
    pipe(
      p,
      [
        [x, busY + 3],
        [x, busY + 9],
      ],
      C,
      W.medium,
    );
    breaker(p, x, busY + 9, busY + 14, C);
    pipe(
      p,
      [
        [x, busY + 14],
        [x, y1],
      ],
      C,
      W.medium,
    );
  };
  // ---- the resistors, through the controller
  const x0 = xs[0]!;
  drop(x0, 136);
  p.rect([x0 - 20, 136], [x0 + 20, 150], { w: W.medium, fill: PAPER });
  tag(p, x0, 141, l('gradateur de résistances', 'heater controller'), { bold: true });
  tag(p, x0, 146, l('par paliers', 'in steps'));
  pipe(
    p,
    [
      [x0, 150],
      [x0, 164],
    ],
    C,
    W.medium,
  );
  heater(p, x0 - 20, 164, x0 + 20, 178, HOT);
  tag(p, x0, 182, l('batterie de résistances', 'resistor bank'), { bold: true });
  tag(
    p,
    x0,
    186.5,
    cat(fig('chargeMw', 'E', ' MW'), ', ', lab(500, 0, 'R', ' °C'), l(' d’air, à vérifier', ' of air, to be checked')),
  );
  // ---- the two blowers, through their drives
  const blowerCol = (x: number, name: ReturnType<typeof l>) => {
    drop(x, 136);
    p.rect([x - 16, 136], [x + 16, 150], { w: W.medium, fill: PAPER });
    tag(p, x, 141, l('variateur', 'drive'), { bold: true });
    tag(p, x, 146, cat(fig('blowerRunSeconds', 'E', ' s'), l(' de montée', ' to run up')));
    pipe(
      p,
      [
        [x, 150],
        [x, 164],
      ],
      C,
      W.medium,
    );
    meter(p, x, 171, 7, 'M', INK);
    tag(p, x, 182, name, { bold: true });
  };
  blowerCol(xs[1]!, l('soufflante de charge', 'charge blower'));
  blowerCol(xs[2]!, l('soufflante de décharge', 'discharge blower'));
  // ---- the pump
  const xP = xs[3]!;
  drop(xP, 164);
  meter(p, xP, 171, 7, 'M', WATER);
  tag(p, xP, 182, l('pompe du réseau', 'network pump'), { bold: true });
  tag(p, xP, 186.5, cat(fig('pumpKpa', 'E', ' kPa'), ', ', fig('waterKgS', 'D', ' kg/s')));
  // ---- the controls
  const xC = xs[4]!;
  drop(xC, 136);
  p.rect([xC - 20, 136], [xC + 20, 150], { w: W.medium, fill: PAPER });
  tag(p, xC, 141, l('armoire d’automatisme', 'control cabinet'), { bold: true });
  tag(p, xC, 146, cat(fig('auxKw', 'E', ' kW'), l(' par MW, avec la ventilation', ' per MW, with the ventilation')), {
    size: 1.7,
  });

  // ---- the safety that decides: drawn apart, dashed
  const yF = 156;
  p.polyline(
    [
      [xs[1]! + 10, 164],
      [xs[1]! + 10, yF],
      [x0 + 26, yF],
      [x0 + 26, 143],
      [x0 + 20, 143],
    ],
    { w: W.medium, color: COLORS.red, dash: 'hidden' },
  );
  tag(p, x0 + 28, yF + 3, cat(l('pressostat, sous ', 'pressure switch, under '), fig('flowSwitch', 'E', PC)), {
    size: 1.7,
    color: COLORS.red,
    anchor: 'start',
  });
  // the orders of the cabinet, thin and dashed
  p.polyline(
    [
      [xC - 20, 143],
      [xs[2]! + 16, 143],
    ],
    { w: W.thin, color: INK_2, dash: 'hidden' },
  );
  p.polyline(
    [
      [xC, 150],
      [xC, 158],
      [xs[1]! + 16, 158],
      [xs[1]! + 16, 150],
    ],
    { w: W.thin, color: INK_2, dash: 'hidden' },
  );
  tag(p, (xs[3]! + xC - 20) / 2, 139.5, l('consignes', 'orders'), { size: 1.7, color: INK_2 });

  // ---- what it means
  heading(d, 18, 196, l('À QUOI TIENT CE COURANT', 'WHAT THIS CURRENT COMES DOWN TO'));
  note(
    d,
    18,
    201,
    210,
    l(
      'À cette tension, 1 MW représente 1 443 A : I = P / (√3 · U), de l’arithmétique, dans l’hypothèse des 400 V. C’est pourquoi le courant arrive en moyenne tension jusqu’au pied du silo. Presque tout cela va aux résistances, et presque rien n’en est perdu : leur chaleur n’a nulle part ailleurs où aller. L’installation électrique du vrai silo n’est décrite nulle part : ce schéma est générique, et son seul fait, c’est le mégawatt.',
      'At this voltage, 1 MW means 1,443 A: I = P / (√3 · U), plain arithmetic, on the assumption of 400 V. That is why the current comes at medium voltage to the foot of the silo. Nearly all of it goes to the resistors, and hardly any of it is lost: their heat has nowhere else to go. The real silo’s electrical installation is described nowhere: this diagram is generic, and its one fact is the megawatt.',
    ),
    { size: 1.9 },
  );
  modelTag(d, 238, 196, 88);
  grid(
    d,
    238,
    202.5,
    [
      { label: l('Électricité d’une soufflante, à 1 MW', 'Electricity of a blower, at 1 MW'), w: 66 },
      { label: '', w: 22, align: 'end', mono: true },
    ],
    [
      [l('au plus bas', 'lowest'), fig('blowerKwLow', 'M', ' kW')],
      [l('au plus haut', 'highest'), fig('blowerKwHigh', 'M', ' kW')],
      [l('circulation et charge, sur un an', 'circulation and charging, over a year'), fig('circYear', 'M', PC)],
    ],
    { size: 1.75, pad: 0.5 },
  );
  marksLegend(d, 18, 226, 100);
}

export const singleLine: DrawingSheet = {
  id: 'single-line',
  number: NUMBER,
  group: 'plant-room',
  title: l('Le schéma électrique', 'The single-line diagram'),
  description: l(
    'De la ligne moyenne tension jusqu’aux résistances, aux soufflantes, à la pompe et à l’armoire : là où passent les 1 443 A d’un mégawatt à 400 V. Le trait rouge tireté est la sécurité qui décide de tout : sans débit d’air, le pressostat coupe les résistances. Ce schéma est générique, tout y est estimé sauf le mégawatt.',
    'From the medium-voltage line to the resistors, the blowers, the pump and the cabinet: where the 1,443 A of a megawatt at 400 V pass. The dashed red line is the safety on which everything turns: with no air flow, the pressure switch cuts the resistors. This diagram is generic, everything in it is estimated except the megawatt.',
  ),
  scene: 'plant-room',
  parts: ITEMS,
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le schéma électrique', 'The single-line diagram'),
      subtitle: l('De la ligne aux résistances', 'From the line to the resistors'),
      number: NUMBER,
      scale: tr(l('schéma', 'diagram')),
    });
    draw(d);
    return d;
  },
};
