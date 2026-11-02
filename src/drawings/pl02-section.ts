import { Drawing, INK_2, W, type DrawingSheet, type Pt } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { partIds } from '../data/ids';
import { PARTS } from '../data/parts';
import { LANCES, LEVEL, PIPE, SILO, WALL, ZONE_R } from '../three/dims';
import { balloon, caption, dimH, dimV, FILL, grid, heading, marksLegend, note, PAPER, poly } from './draw';
import { lab, perMetre, scaleText } from './geom';

// PL-02: the silo in section, from the slab to the roof, the official and the estimated dimensions told apart by their marks, and the wall build-up magnified. Everything from dims.ts.

const NUMBER = 'PL-02';
export const LAYOUT = {
  section: { scale: 75, ox: 140, oy: 206 },
  wall: { scale: 10, ox: 312, oy: 92 },
} as const;
export const ITEMS = partIds('silo');
const n = (id: string): number => ITEMS.indexOf(id) + 1;

function draw(d: Drawing): void {
  const S = LAYOUT.section;
  const v = d.view(S.ox, S.oy, perMetre(S.scale));
  const R = SILO.outerR;
  const B = SILO.bedR;

  // ---- the ground and the slab
  v.rect([-R - 1.6, -0.5], [R + 2.4, 0], { w: W.thin, hatch: 'earth', fill: FILL.earth });
  v.rect([-SILO.slabR, 0], [SILO.slabR, LEVEL.slabTop], { w: W.medium, fill: FILL.concrete, hatch: 'steel' });
  // the base insulation, the bed, the top insulation
  v.rect([-WALL.insulationOut, LEVEL.slabTop], [WALL.insulationOut, LEVEL.bedBottom], {
    w: W.thin,
    fill: FILL.insulation,
  });
  v.rect([-B, LEVEL.bedBottom], [B, LEVEL.bedTop], { w: W.thin, fill: FILL.stone });
  v.rect([-WALL.insulationOut, LEVEL.bedTop], [WALL.insulationOut, LEVEL.deckBottom], {
    w: W.thin,
    fill: FILL.insulation,
  });
  // the shell, the wall insulation, the cladding
  for (const sx of [-1, 1]) {
    v.rect([sx * B, LEVEL.slabTop], [sx * WALL.shellOut, LEVEL.deckBottom], { w: W.thin, fill: '#555' });
    v.rect([sx * WALL.shellOut, LEVEL.slabTop], [sx * WALL.insulationOut, LEVEL.deckBottom], {
      w: W.thin,
      fill: FILL.insulation,
    });
    v.rect([sx * WALL.insulationOut, LEVEL.slabTop], [sx * R, LEVEL.eaves], { w: W.medium, fill: FILL.steel });
  }
  // the room
  v.rect([-WALL.roomIn, LEVEL.floor], [WALL.roomIn, LEVEL.ceiling], { w: W.thin, fill: FILL.room });
  v.rect([-R, LEVEL.deckBottom], [R, LEVEL.floor], { w: W.medium, fill: FILL.steel });
  // the roof
  const r = SILO.roof;
  poly(
    v,
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
  v.line([-WALL.roomIn, LEVEL.ceiling], [WALL.roomIn, LEVEL.ceiling], { w: W.thin });

  // ---- the U-pipes on the plane of the section, drawn as they are in dims.ts
  const legsPerSide = Math.floor(B / PIPE.pitch);
  for (let i = 0; i < legsPerSide; i++) {
    for (const sx of [-1, 1]) {
      const x = sx * (i + 0.5) * PIPE.pitch;
      v.line([x, PIPE.legBottom], [x, PIPE.headerY], { w: W.thin, color: '#7a5a2a' });
      if (i % 2 === 0) {
        const c: Pt = [sx * (i + 1) * PIPE.pitch, PIPE.legBottom];
        v.arc(c, PIPE.bendR, 180, 360, { w: W.thin, color: '#7a5a2a' });
      }
    }
  }
  for (const y of PIPE.spacerYs) v.line([-B + 0.1, y], [B - 0.1, y], { w: W.thin, color: INK_2, dash: 'hidden' });
  // the zones, by their radii: dashed lines through the bed
  for (const zr of ZONE_R.slice(0, 2))
    for (const sx of [-1, 1])
      v.line([sx * zr, LEVEL.bedBottom], [sx * zr, LEVEL.bedTop], { w: W.thin, dash: 'center', color: '#a13b1a' });
  // the lances on the plane z = 0
  for (const [rr, depth] of LANCES.onX)
    v.line([rr, LEVEL.floor], [rr, LEVEL.bedTop - depth], { w: W.medium, color: '#1a5c8a' });
  v.center([0, -0.8], [0, LEVEL.apex + 0.6], 0);

  // ---- official dimensions, without a mark
  dimV(v, [R, 0], [R, LEVEL.apex], R + 2.4, lab(SILO.totalHeight, 0, 'R'));
  dimH(v, [-R, 0], [R, 0], -2.2, lab(2 * R, 0, 'R'));
  dimV(v, [-B, LEVEL.bedBottom], [-B, LEVEL.bedTop], -R - 1.6, lab(SILO.bedHeight, 0, 'R'));
  dimH(v, [-B, LEVEL.bedTop], [B, LEVEL.bedTop], LEVEL.bedTop - 0.55, lab(2 * B, 0, 'R'));
  // ---- estimated: the split of the stack
  const stack: [number, number, ReturnType<typeof lab>][] = [
    [0, LEVEL.bedBottom, lab(LEVEL.bedBottom, 1, 'E')],
    [LEVEL.bedTop, LEVEL.deckBottom, lab(LEVEL.deckBottom - LEVEL.bedTop, 1, 'E')],
    [LEVEL.deckBottom, LEVEL.eaves, lab(LEVEL.eaves - LEVEL.deckBottom, 1, 'E')],
    [LEVEL.eaves, LEVEL.apex, lab(LEVEL.apex - LEVEL.eaves, 1, 'E')],
  ];
  for (const [y0, y1, t] of stack) dimV(v, [-R, y0], [-R, y1], -R - 1.6, t, 2);

  v.text([0, LEVEL.bedBottom + 3.6], l('pierre ollaire concassée', 'crushed soapstone'), {
    size: 2.6,
    anchor: 'middle',
    weight: 'bold',
    halo: true,
  });
  v.text([0, LEVEL.floor + 1.4], l('étage technique : notre lecture', 'equipment floor: our reading'), {
    size: 2.1,
    anchor: 'middle',
    halo: true,
    italic: true,
  });

  // ---- balloons
  const bx = S.ox + 116;
  const bal = (id: string, at: Pt, py: number, x = bx) => balloon(v, at, x, py, n(id));
  bal('conical-roof', [5.2, LEVEL.eaves + 0.45], 34);
  bal('upper-vent', [R - 0.1, LEVEL.floor + 2.2], 46);
  bal('equipment-floor', [6.8, LEVEL.floor + 0.3], 58);
  bal('access-ladder', [R, LEVEL.floor - 0.1], 70);
  bal('duct-penetration', [PIPE.pitch * 13.5, LEVEL.bedTop + 0.75], 82);
  bal('top-insulation', [6.7, LEVEL.bedTop + 0.3], 94);
  bal('thermocouple-lance', [LANCES.onX[2]![0], LEVEL.bedTop - 1.2], 106);
  bal('pipe-field', [PIPE.pitch * 12.5, LEVEL.bedBottom + 3.7], 122);
  bal('storage-bed', [5.2, LEVEL.bedBottom + 3], 136);
  bal('inner-shell', [B, LEVEL.bedBottom + 2], 150);
  bal('wall-insulation', [WALL.shellOut + 0.2, LEVEL.bedBottom + 1.4], 162);
  bal('outer-cladding', [R, LEVEL.bedBottom + 0.8], 174);
  bal('base-insulation', [6.8, LEVEL.slabTop + 0.25], 186);
  bal('foundation-slab', [7.6, LEVEL.slabTop / 2], 198);
  caption(d, S.ox - 10, 243, l('COUPE PAR L’AXE DU SILO', 'SECTION THROUGH THE AXIS OF THE SILO'), scaleText(S.scale));

  // ---- the wall magnified
  const W2 = LAYOUT.wall;
  const w = d.view(W2.ox, W2.oy, perMetre(W2.scale));
  const y0 = 0;
  const y1 = 0.5;
  const t0 = SILO.shellT;
  const t1 = t0 + SILO.wallInsulation;
  const t2 = t1 + SILO.claddingT;
  w.rect([-0.35, y0], [0, y1], { w: W.thin, fill: FILL.stone, hatch: 'earth' });
  w.rect([0, y0], [t0, y1], { w: W.medium, fill: '#555' });
  w.rect([t0, y0], [t1, y1], { w: W.thin, fill: FILL.insulation });
  w.rect([t1, y0], [t2, y1], { w: W.medium, fill: FILL.steel });
  w.line([t2, y0], [t2, y1], { w: W.thick });
  dimH(w, [0, y0], [t2, y0], y0 - 0.1, lab(PART_WALL(), 2, 'D'));
  dimH(w, [t0, y1], [t1, y1], y1 + 0.07, lab(SILO.wallInsulation, 2, 'E'));
  dimH(w, [0, y1], [t0, y1], y1 + 0.17, lab(SILO.shellT * 1000, 0, 'E', ' mm'));
  w.text([-0.17, 0.25], l('pierre', 'stone'), { size: 2.1, anchor: 'middle', halo: true });
  w.text([(t0 + t1) / 2, 0.25], l('isolant', 'insulation'), { size: 2.1, anchor: 'middle' });
  w.text([t2 + 0.03, 0.3], l('dehors', 'outside'), { size: 2.1 });
  caption(d, W2.ox + 24, 112, l('DÉTAIL : LA PAROI', 'DETAIL: THE WALL'), scaleText(W2.scale));

  // ---- the levels
  heading(d, 275, 124, l('LES NIVEAUX, DEPUIS LE SOL', 'THE LEVELS, FROM THE GROUND'));
  grid(
    d,
    275,
    129,
    [
      { label: l('Niveau', 'Level'), w: 70 },
      { label: 'm', w: 40, align: 'end', mono: true },
    ],
    [
      [l('Dessus du radier', 'Top of the slab'), lab(LEVEL.slabTop, 2, 'E', '')],
      [l('Bas du lit', 'Bottom of the bed'), lab(LEVEL.bedBottom, 2, 'E', '')],
      [
        l('Haut du lit (6 m de pierre, rapportés)', 'Top of the bed (6 m of stone, reported)'),
        lab(LEVEL.bedTop, 2, 'E', ''),
      ],
      [l('Sous le plancher', 'Under the deck'), lab(LEVEL.deckBottom, 2, 'E', '')],
      [l('Plancher de l’étage', 'Floor of the room'), lab(LEVEL.floor, 2, 'E', '')],
      [l('Égout du toit', 'Eaves'), lab(LEVEL.eaves, 2, 'E', '')],
      [l('Moyeu (rapporté en hauteur totale)', 'Hub (reported as the total height)'), lab(LEVEL.apex, 2, 'R', '')],
    ],
    { size: 1.85, pad: 0.6 },
  );

  // ---- the items
  grid(
    d,
    275,
    176,
    [
      { label: l('N°', 'No.'), w: 8, align: 'middle', mono: true },
      { label: l('Pièce', 'Part'), w: 52 },
    ],
    ITEMS.slice(0, 7).map((id, i) => [String(i + 1), PARTS.find((p) => p.id === id)!.name]),
    { size: 1.8, pad: 0.45 },
  );
  grid(
    d,
    337,
    176,
    [
      { label: l('N°', 'No.'), w: 8, align: 'middle', mono: true },
      { label: l('Pièce', 'Part'), w: 52 },
    ],
    ITEMS.slice(7).map((id, i) => [String(i + 8), PARTS.find((p) => p.id === id)!.name]),
    { size: 1.8, pad: 0.45 },
  );
  void PAPER;
  marksLegend(d, 15, 250, 100);
  note(
    d,
    120,
    250,
    108,
    l(
      'Le constructeur donne le silo (environ 13 m sur 15 m) et, dans son propre modèle, le lit (14 m sur 6 m). Tout le reste de l’empilement est une estimation qui se referme sur ces chiffres. Le lit dessiné n’est pas à l’échelle du grain ; les tubes sont génériques, leur tracé réel reste secret.',
      'The maker gives the silo (about 13 m by 15 m) and, in its own model, the bed (14 m by 6 m). All the rest of the stack is an estimate that closes on those figures. The bed drawn is not at the scale of the grain; the pipes are generic, their real layout remains secret.',
    ),
    { size: 1.85 },
  );
}

const PART_WALL = (): number => SILO.outerR - SILO.bedR;

export const siloSection: DrawingSheet = {
  id: 'silo-section',
  number: NUMBER,
  group: 'silo',
  title: l('Le silo en coupe', 'The silo in section'),
  description: l(
    'La machine de bas en haut, en coupe par son axe : radier, isolants, virole, lit de pierre et champ de tubes, étage technique et toit. Les cotes sans marque sont données par le constructeur ; celles qui portent une étoile sont estimées, et se referment sur les 13 m annoncés. À droite, la paroi grossie : un demi-mètre pour tout loger.',
    'The machine from the bottom up, in section through its axis: slab, insulation, shell, stone bed and pipe field, equipment floor and roof. Dimensions without a mark come from the maker; those with a star are estimated, and close on the quoted 13 m. On the right, the wall magnified: half a metre to fit it all in.',
  ),
  scene: 'silo',
  parts: ITEMS,
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le silo en coupe', 'The silo in section'),
      subtitle: l('Cotes rapportées et cotes estimées', 'Reported and estimated dimensions'),
      number: NUMBER,
      scale: `${scaleText(LAYOUT.section.scale)} · ${scaleText(LAYOUT.wall.scale)}`,
    });
    draw(d);
    return d;
  },
};
