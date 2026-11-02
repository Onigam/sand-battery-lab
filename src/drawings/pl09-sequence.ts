import { Drawing, INK_2, W, type DrawingSheet, type View } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { ASSEMBLY } from '../data/assembly';
import { LEVEL, PIPE, SILO, WALL } from '../three/dims';
import { FILL, grid, HOT, note, PAPER, poly, WATER } from './draw';
import { perMetre } from './geom';

// PL-09: the build, exploded and numbered: each layer of the silo lifted apart in the order of the assembly guide, with the number of its step, and the guide's twenty steps beside it with their world and their origin.
// The sizes are dims.ts's; the order is the guide's, most of it our reading, and the table says which is which.

const NUMBER = 'PL-09';
export const LAYOUT = { scale: 100, ox: 102, oy: 244, gap: 0.95, spread: 0.85 } as const;

/** The step a part is installed in, 1 to 20. */
export const stepOf = (id: string): number => ASSEMBLY.findIndex((s) => s.parts.includes(id)) + 1;

const ORIGIN_FR = /Origine : (rapporté|pratique courante|notre lecture)/;

function marker(p: View, x: number, y: number, id: string): void {
  p.circle([x, y], 3, { w: W.thin, fill: PAPER });
  p.text([x, y], String(stepOf(id)), { size: 2.3, weight: 'bold', anchor: 'middle', baseline: 'middle' });
}

function draw(d: Drawing): void {
  const L = LAYOUT;
  const k = perMetre(L.scale);
  const p = d.paper();
  let lift = 0;
  const v = (extra: number) => d.view(L.ox, L.oy - (lift + extra) * k, k);
  const mark = (id: string, y: number) => marker(p, L.ox - 86, L.oy - (lift + y) * k, id);
  const R = SILO.outerR;
  const B = SILO.bedR;

  // ---- slab, base insulation
  let e = v(0);
  e.rect([-SILO.slabR, 0], [SILO.slabR, LEVEL.slabTop], { w: W.medium, fill: FILL.concrete, hatch: 'steel' });
  mark('foundation-slab', LEVEL.slabTop / 2);
  lift += L.gap;
  e = v(0);
  e.rect([-WALL.insulationOut, LEVEL.slabTop], [WALL.insulationOut, LEVEL.bedBottom], {
    w: W.thin,
    fill: FILL.insulation,
  });
  mark('base-insulation', (LEVEL.slabTop + LEVEL.bedBottom) / 2);
  lift += L.gap;

  // ---- the shell, then the stone and the pipes in it: all rise together, the walls open out on each side
  e = v(0);
  e.rect([-B, LEVEL.bedBottom], [B, LEVEL.bedTop], { w: W.thin, fill: FILL.stone });
  for (const sx of [-1, 1])
    e.rect([sx * B, LEVEL.bedBottom], [sx * WALL.shellOut, LEVEL.bedTop], { w: W.medium, fill: '#555' });
  const legs = Math.floor(B / PIPE.pitch);
  for (let i = 0; i < legs; i += 2)
    for (const sx of [-1, 1]) {
      const x = sx * (i + 0.5) * PIPE.pitch;
      e.line([x, PIPE.legBottom], [x, LEVEL.bedTop + 0.45], { w: W.thin, color: '#7a5a2a' });
    }
  for (const y of PIPE.spacerYs) e.line([-B + 0.1, y], [B - 0.1, y], { w: W.thin, dash: 'hidden', color: INK_2 });
  e.text([0, LEVEL.bedBottom + 3], l('pierre', 'stone'), { size: 2.6, weight: 'bold', anchor: 'middle', halo: true });
  mark('inner-shell', LEVEL.bedBottom + 5);
  marker(p, L.ox + 73, L.oy - (lift + LEVEL.bedBottom + 5) * k, 'pipe-field');
  marker(p, L.ox + 73, L.oy - (lift + LEVEL.bedBottom + 3) * k, 'storage-bed');
  marker(p, L.ox + 73, L.oy - (lift + LEVEL.bedBottom + 1) * k, 'thermocouple-lance');

  // ---- the wall layers, pulled sideways
  const s = L.spread;
  for (const sx of [-1, 1]) {
    e.rect(
      [sx * (WALL.shellOut + s * 0.5), LEVEL.bedBottom - 0.6],
      [sx * (WALL.insulationOut + s * 0.5), LEVEL.bedTop + 1],
      { w: W.thin, fill: FILL.insulation },
    );
    e.rect([sx * (WALL.insulationOut + s), LEVEL.bedBottom - 0.6], [sx * (R + s), LEVEL.bedTop + 1], {
      w: W.medium,
      fill: FILL.steel,
    });
  }
  mark('wall-insulation', LEVEL.bedBottom + 1);
  lift += L.gap;

  // ---- the top insulation, the deck
  e = v(0);
  e.rect([-WALL.insulationOut, LEVEL.bedTop], [WALL.insulationOut, LEVEL.deckBottom], {
    w: W.thin,
    fill: FILL.insulation,
  });
  mark('top-insulation', (LEVEL.bedTop + LEVEL.deckBottom) / 2);
  lift += L.gap * 0.7;
  e = v(0);
  e.rect([-R, LEVEL.deckBottom], [R, LEVEL.floor], { w: W.medium, fill: FILL.steel });
  mark('equipment-floor', LEVEL.floor);

  // ---- the equipment on its deck: the four groups of the guide
  const f = LEVEL.floor;
  const box = (x0: number, x1: number, h: number, color: string) =>
    e.rect([x0, f], [x1, f + h], { w: W.medium, fill: PAPER, color });
  box(-6.6, -4.6, 2.1, INK_2);
  box(-3.8, -0.6, 1.3, HOT);
  box(0.2, 3, 1.5, WATER);
  e.line([-0.6, f + 0.7], [0.2, f + 0.7], { w: W.medium });
  marker(p, L.ox - 56, L.oy - (lift + f + 1) * k, 'lv-switchboard');
  marker(p, L.ox - 22, L.oy - (lift + f + 0.65) * k, 'resistor-bank');
  marker(p, L.ox + 16, L.oy - (lift + f + 0.75) * k, 'air-water-exchanger');
  marker(p, L.ox + 40, L.oy - (lift + f + 0.7) * k, 'hot-air-duct');
  lift += L.gap * 0.7;

  // ---- the roof
  e = v(0);
  const r = SILO.roof;
  poly(
    e,
    [
      [-r.eaveR, LEVEL.eaves],
      [-r.hubR, LEVEL.apex - r.hubH],
      [-r.hubR, LEVEL.apex],
      [r.hubR, LEVEL.apex],
      [r.hubR, LEVEL.apex - r.hubH],
      [r.eaveR, LEVEL.eaves],
    ],
    { w: W.thick, fill: FILL.roof },
  );
  mark('conical-roof', LEVEL.eaves + 0.6);

  // ---- the twenty steps
  grid(
    d,
    196,
    18,
    [
      { label: l('N°', 'No.'), w: 8, align: 'middle', mono: true },
      { label: l('Étape', 'Step'), w: 80 },
      { label: l('Où', 'Where'), w: 22 },
      { label: l('Origine', 'Origin'), w: 36 },
      { label: l('Pour quoi', 'What for'), w: 56 },
    ],
    ASSEMBLY.map((s, i) => {
      const fr = ORIGIN_FR.exec(s.text.fr)![1]!;
      const origin =
        fr === 'rapporté'
          ? l('rapporté', 'reported')
          : fr === 'pratique courante'
            ? l('pratique courante', 'usual practice')
            : l('notre lecture', 'our reading');
      return [String(i + 1), s.title, WORLD_NAME[s.scene as string]!, origin, FOR[i]!];
    }),
    { size: 1.95, pad: 0.75, lineH: 3 },
  );
  d.paper().text([96, 22], l('LE SILO, ÉCLATÉ', 'THE SILO, EXPLODED'), { size: 2.8, weight: 'bold', anchor: 'middle' });
  d.paper().text([96, 26], `1:${L.scale}`, { size: 2.1, anchor: 'middle', mono: true, color: INK_2 });
  note(
    d,
    196,
    176,
    202,
    l(
      'Chaque couche du silo, soulevée, avec le numéro de son étape dans le guide de montage. Peu de choses de cet ordre sont rapportées : les fondations d’abord, le remplissage terminé fin octobre 2024, la chauffe et les essais l’hiver suivant, la mise en service en juin 2025. Le reste est notre lecture. Les tailles sont celles du modèle 3D, dont seules 13 m, 15 m, 14 m et 6 m viennent du constructeur.',
      'Each layer of the silo, lifted, with the number of its step in the assembly guide. Few things in this order are reported: the foundations first, the filling finished at the end of October 2024, the heating and tests the next winter, the start of service in June 2025. The rest is our reading. The sizes are those of the 3D model, of which only 13 m, 15 m, 14 m and 6 m come from the maker.',
    ),
    { size: 1.95 },
  );
}

const WORLD_NAME: Record<string, ReturnType<typeof l>> = {
  site: l('village', 'village'),
  silo: l('silo', 'silo'),
  'pipe-cell': l('un tube', 'one pipe'),
  'plant-room': l('étage', 'floor'),
};

const FOR = [
  l('le sol, l’accès', 'the soil, the access'),
  l('le poids, sans pencher', 'the weight, no tilt'),
  l('isoler et porter', 'insulate and carry'),
  l('la poussée de la pierre', 'the thrust of the stone'),
  l('tenir le pas', 'holding the pitch'),
  l('l’air dedans, la pierre dehors', 'air in, stone out'),
  l('la dilatation, l’équilibre', 'growth, balance'),
  l('dernière occasion de réparer', 'last chance to repair'),
  l('les seuls yeux du lit', 'the bed’s only eyes'),
  l('l’ordre de la chaleur', 'the order of the heat'),
  l('la conduction mesurée', 'the measured conduction'),
  l('environ 2 000 t, sèches', 'about 2,000 t, dry'),
  l('le point faible', 'the weak spot'),
  l('acier, isolant, acier', 'steel, insulation, steel'),
  l('des gaines courtes', 'short ducts'),
  l('hors d’eau, hors d’air', 'closed to the weather'),
  l('fermer les boucles', 'closing the loops'),
  l('faire l’air chaud', 'making the hot air'),
  l('rendre à l’eau', 'giving to the water'),
  l('décider, sécuriser', 'deciding, protecting'),
];

export const assemblySequence: DrawingSheet = {
  id: 'assembly-sequence',
  number: NUMBER,
  group: 'silo',
  title: l('La séquence de montage', 'The assembly sequence'),
  description: l(
    'Le silo en éclaté, avec à droite les vingt étapes du guide : chaque numéro renvoie à une étape, chaque étape dit si elle est rapportée, de pratique courante, ou notre lecture. Ce n’est pas un plan de chantier : aucune durée, aucun couple, aucune soudure n’y figure.',
    'The silo exploded, with the twenty steps of the guide on the right: each number points to a step, each step says whether it is reported, usual practice, or our reading. This is no site plan: no duration, no torque, no weld is given.',
  ),
  scene: 'silo',
  parts: [
    'foundation-slab',
    'base-insulation',
    'inner-shell',
    'wall-insulation',
    'outer-cladding',
    'storage-bed',
    'pipe-field',
    'top-insulation',
    'equipment-floor',
    'conical-roof',
    'thermocouple-lance',
  ],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La séquence de montage', 'The assembly sequence'),
      subtitle: l('Vue éclatée et les vingt étapes', 'Exploded view and the twenty steps'),
      number: NUMBER,
      scale: `1:${LAYOUT.scale}`,
    });
    draw(d);
    return d;
  },
};
