import { Drawing, INK_2, W, type DrawingSheet, type View } from '@onigam/lab-kit/drawings';
import { l, tr, type L } from '@onigam/lab-kit/i18n';
import { COOL, grid, heading, HOT, marksLegend, modelTag, note, PAPER, RED, WATER } from './draw';
import { blowerCurve } from './model';
import { cat, fig, lab } from './geom';
import { blower, damper, exchanger, heater, pipe, tag } from './symbols';

// PL-05: the air loop as a diagram, in three modes: charge, discharge, and both at once on different zones. The principle is reported (a closed loop, blowers, dampers, charge through the core, discharge from the outside);
// two blowers rather than one is an assumption, and every size is an estimate.

const NUMBER = 'PL-05';
export const ITEMS = [
  'resistor-bank',
  'charge-blower',
  'discharge-blower',
  'charge-damper',
  'discharge-damper',
  'hot-air-duct',
  'cold-air-duct',
  'air-water-exchanger',
];

type ZoneMode = 'charge' | 'discharge' | 'idle';

/** One mode of the loop, in a box of paper space. */
function mode(p: View, x: number, y: number, title: L, zones: [ZoneMode, ZoneMode, ZoneMode]): void {
  const w = 124;
  const h = 96;
  p.rect([x, y], [x + w, y + h], { w: W.thin, color: INK_2, fill: PAPER });
  tag(p, x + w / 2, y + 4, title, { bold: true, size: 2.5 });

  // the bed, three zones, at the bottom: core, middle, outer
  const by = y + 60;
  const zw = 30;
  const bx = x + 17;
  const names = [l('cœur', 'core'), l('milieu', 'middle'), l('extérieur', 'outer')];
  zones.forEach((z, i) => {
    const zx = bx + i * zw;
    const fill = z === 'charge' ? '#f6d9c5' : z === 'discharge' ? '#dfe9f2' : '#efeadf';
    p.rect([zx, by], [zx + zw, by + 24], { w: W.medium, fill });
    tag(p, zx + zw / 2, by + 13, names[i]!, { bold: true });
    tag(
      p,
      zx + zw / 2,
      by + 18,
      z === 'charge'
        ? l('charge', 'charging')
        : z === 'discharge'
          ? l('décharge', 'discharging')
          : l('au repos', 'idle'),
      { size: 1.7 },
    );
  });

  // the charge loop: heater and blower on the left, headers along the top, a damper per zone
  const hotY = y + 16;
  const backY = y + 24;
  const anyCharge = zones.includes('charge');
  const anyDischarge = zones.includes('discharge');
  const cCol = anyCharge ? HOT : '#c9c3b7';
  const cBack = anyCharge ? '#d49a6a' : '#c9c3b7';
  const dCol = anyDischarge ? HOT : '#c9c3b7';
  const dBack = anyDischarge ? COOL : '#c9c3b7';
  const wc = anyCharge ? W.thick : W.thin;
  const wd = anyDischarge ? W.thick : W.thin;
  pipe(
    p,
    [
      [x + 12, backY],
      [x + 6, backY],
      [x + 6, hotY],
      [x + 10, hotY],
    ],
    cBack,
    wc,
  );
  blower(p, x + 6, (hotY + backY) / 2, 2.6, 1, anyCharge ? undefined : '#b5ae9f');
  heater(p, x + 10, hotY - 3, x + 24, hotY + 3, cCol);
  pipe(
    p,
    [
      [x + 24, hotY],
      [x + w - 42, hotY],
    ],
    cCol,
    wc,
    true,
  );
  pipe(
    p,
    [
      [x + w - 42, backY],
      [x + 12, backY],
    ],
    cBack,
    wc,
    true,
  );
  // the discharge loop: blower and exchanger on the right
  const outY = y + 32;
  const coldY = y + 40;
  pipe(
    p,
    [
      [x + 10, outY],
      [x + w - 27, outY],
    ],
    dCol,
    wd,
    true,
  );
  pipe(
    p,
    [
      [x + w - 27, coldY],
      [x + 10, coldY],
    ],
    dBack,
    wd,
    true,
  );
  exchanger(p, x + w - 27, outY - 3, x + w - 15, coldY + 3, WATER);
  blower(p, x + w - 36, coldY, 2.6, -1, anyDischarge ? undefined : '#b5ae9f');
  pipe(
    p,
    [
      [x + w - 15, outY + 1],
      [x + w - 6, outY + 1],
    ],
    anyDischarge ? WATER : '#c9c3b7',
    anyDischarge ? W.medium : W.thin,
  );
  pipe(
    p,
    [
      [x + w - 6, coldY - 1],
      [x + w - 15, coldY - 1],
    ],
    anyDischarge ? COOL : '#c9c3b7',
    anyDischarge ? W.medium : W.thin,
  );
  tag(p, x + w - 2, outY + 1, cat(lab(85, 0, 'R', ' °C')), {
    size: 1.6,
    anchor: 'end',
    color: anyDischarge ? WATER : '#b5ae9f',
  });

  // the zones' risers: each zone joins either loop through its pair of dampers
  zones.forEach((z, i) => {
    const zx = bx + i * zw + zw / 2;
    const toCharge = z === 'charge';
    const toDischarge = z === 'discharge';
    const col = toCharge ? HOT : toDischarge ? HOT : '#c9c3b7';
    const colBack = toCharge ? '#d49a6a' : toDischarge ? COOL : '#c9c3b7';
    const ww = toCharge || toDischarge ? W.medium : W.thin;
    pipe(
      p,
      [
        [zx - 5, hotY],
        [zx - 5, by],
      ],
      toCharge ? col : '#c9c3b7',
      toCharge ? W.medium : W.thin,
    );
    pipe(
      p,
      [
        [zx + 5, backY],
        [zx + 5, by],
      ],
      toCharge ? colBack : '#c9c3b7',
      toCharge ? W.medium : W.thin,
    );
    damper(p, zx - 5, by - 13, 1.7, toCharge, true, toCharge ? HOT : INK_2);
    pipe(
      p,
      [
        [zx - 1.6, outY],
        [zx - 1.6, by],
      ],
      toDischarge ? col : '#c9c3b7',
      toDischarge ? ww : W.thin,
    );
    pipe(
      p,
      [
        [zx + 1.6, coldY],
        [zx + 1.6, by],
      ],
      toDischarge ? colBack : '#c9c3b7',
      toDischarge ? ww : W.thin,
    );
    damper(p, zx - 1.6, by - 5, 1.7, toDischarge, true, toDischarge ? COOL : INK_2);
  });
  tag(
    p,
    x + 4,
    y + 90,
    l('Pierre : aucun air ne la touche, il reste dans les tubes.', 'Stone: no air touches it, it stays in the pipes.'),
    { anchor: 'start', size: 1.65, color: INK_2 },
  );
}

function draw(d: Drawing): void {
  const p = d.paper();
  mode(p, 14, 20, l('1. CHARGE : LE CŒUR D’ABORD', '1. CHARGE: THE CORE FIRST'), ['charge', 'idle', 'idle']);
  mode(p, 148, 20, l('2. DÉCHARGE : PAR L’EXTÉRIEUR', '2. DISCHARGE: FROM THE OUTSIDE'), ['idle', 'idle', 'discharge']);
  mode(p, 282, 20, l('3. LES DEUX, SUR DES ZONES DIFFÉRENTES', '3. BOTH, ON DIFFERENT ZONES'), [
    'charge',
    'idle',
    'discharge',
  ]);

  // ---- what passes
  heading(d, 14, 122, l('CE QUI CIRCULE, À 1 MW', 'WHAT CIRCULATES, AT 1 MW'));
  grid(
    d,
    14,
    127,
    [
      { label: l('Grandeur', 'Quantity'), w: 88 },
      { label: l('Valeur', 'Value'), w: 66, mono: true },
    ],
    [
      [l('Air porté sur 300 K d’écart', 'Air carried across 300 K'), fig('airKgS', 'D', ' kg/s')],
      [
        l('Taille d’une soufflante', 'Size of a blower'),
        cat(fig('blowerRate', 'E'), l(' m³/s par MW', ' m³/s per MW')),
      ],
      [l('Pression maximale', 'Highest pressure'), fig('blowerLimitKpa', 'E', ' kPa')],
      [l('Vitesse de l’air dans les gaines', 'Air speed in the ducts'), fig('airSpeed', 'E', ' m/s')],
      [l('Diamètre intérieur d’une gaine', 'Inside diameter of a duct'), fig('ductDiameter', 'D', ' m')],
      [
        l(
          'Air en sortie de résistances (documentaire, à vérifier)',
          'Air leaving the resistors (documentary, to be checked)',
        ),
        lab(500, 0, 'R', ' °C'),
      ],
      [l('Air en sortie d’échangeur', 'Air leaving the exchanger'), fig('airOut', 'E', ' °C')],
      [l('Eau : départ, retour', 'Water: supply, return'), cat(lab(85, 0, 'R', ' °C, '), fig('returnT', 'E', ' °C'))],
    ],
    { size: 1.85, pad: 0.55 },
  );
  modelTag(d, 176, 122, 92);
  grid(
    d,
    176,
    128.5,
    [
      { label: l('Ce que trouve le modèle', 'What the model finds'), w: 56 },
      { label: '', w: 36, align: 'end', mono: true },
    ],
    [
      [l('Plancher de la pleine puissance', 'Floor of full power'), fig('floor', 'M', ' °C')],
      [l('Soufflante', 'Blower'), cat(fig('blowerKwLow', 'M'), l(' à ', ' to '), fig('blowerKwHigh', 'M', ' kW'))],
      [l('Pression', 'Pressure'), cat(fig('blowerKpaLow', 'M'), l(' à ', ' to '), fig('blowerKpaHigh', 'M', ' kPa'))],
      [l('Conductance de l’échangeur', 'Conductance of the exchanger'), fig('exchangerUA', 'M', ' kW/K')],
    ],
    { size: 1.85, pad: 0.55 },
  );
  note(
    d,
    276,
    122,
    128,
    l(
      'Rapporté : une boucle fermée, des soufflantes et des registres, le cœur chargé d’abord, la décharge par l’extérieur. Notre hypothèse : deux soufflantes, et chaque zone capable de rejoindre l’une ou l’autre boucle, parce qu’un réseau sans interruption ne peut pas attendre la fin d’une charge. Si le constructeur la contredit, une soufflante disparaît, et ce troisième schéma avec elle.',
      'Reported: a closed loop, blowers and dampers, the core charged first, discharge from the outside. Our assumption: two blowers, and each zone able to join either loop, because a network without interruption cannot wait for a charge to end. If the maker contradicts this, one blower goes away, and this third diagram with it.',
    ),
    { size: 1.9 },
  );
  note(
    d,
    276,
    162,
    128,
    l(
      'Pourquoi ce schéma explique les 100 MWh : sur le bras chaud de la décharge, l’air revient moins chaud à mesure que la pierre refroidit, et pour 1 MW il en faudrait plus que la soufflante n’en donne. La taille de celle-ci n’est publiée nulle part.',
      'Why this diagram explains the 100 MWh: on the hot arm of the discharge, the air comes back less hot as the stone cools, and at 1 MW it would take more of it than the blower gives. The blower’s size is published nowhere.',
    ),
    { size: 1.9 },
  );
  marksLegend(d, 14, 172, 100);
  // ---- the one setting nobody publishes
  modelTag(d, 176, 170, 92);
  const curve = blowerCurve();
  const x0 = 198;
  const y0 = 180;
  const maxU = 140;
  const rowH = 9.5;
  p.text(
    [176, y0 - 1.5],
    l('MWh rendus à 1 MW, selon la soufflante, en m³/s par MW *', 'MWh given at 1 MW, by blower, in m³/s per MW *'),
    { size: 1.75, weight: 'bold', baseline: 'bottom' },
  );
  curve.forEach((c, i) => {
    const y = y0 + i * rowH;
    const w = (c.usable / maxU) * 64;
    p.text([x0 - 2, y + 3.4], lab(c.rate, c.rate % 1 ? 1 : 0, 'E', ''), {
      size: 1.9,
      mono: true,
      anchor: 'end',
      baseline: 'middle',
    });
    p.rect([x0, y], [x0 + w, y + 6.8], { w: W.thin, color: RED, fill: c.rate === 5 ? '#f3c9b6' : '#f9e8df' });
    p.text([x0 + w + 2, y + 3.4], lab(c.usable, 0, 'M', ''), { size: 1.9, mono: true, baseline: 'middle', color: RED });
  });
}

export const airLoop: DrawingSheet = {
  id: 'air-loop',
  number: NUMBER,
  group: 'plant-room',
  title: l('La boucle d’air', 'The air loop'),
  description: l(
    'Trois schémas pour les trois façons de tourner : la charge par le cœur, la décharge par l’extérieur, et les deux à la fois sur des zones différentes, une hypothèse du labo. Les traits forts montrent l’air qui circule ; un trait fin, un registre fermé. Le tableau rappelle ce qui est rapporté, estimé ou calculé.',
    'Three diagrams for the three ways of running: charge through the core, discharge from the outside, and both at once on different zones, an assumption of the lab. Thick lines show the air that flows; a thin line, a shut damper. The table recalls what is reported, estimated or computed.',
  ),
  scene: 'plant-room',
  parts: ITEMS,
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La boucle d’air', 'The air loop'),
      subtitle: l('Schéma en charge, en décharge, et les deux', 'Diagram on charge, on discharge, and both'),
      number: NUMBER,
      scale: tr(l('schéma', 'diagram')),
    });
    draw(d);
    return d;
  },
};
