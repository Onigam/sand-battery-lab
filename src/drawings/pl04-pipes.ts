import { Drawing, INK_2, W, type DrawingSheet, type Pt } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { PARTS } from '../data/parts';
import { LEVEL, PIPE, PIPE_GROWTH, SILO, ZONE_R } from '../three/dims';
import { arrow, balloon, caption, dimH, dimV, FILL, grid, HOT, marksLegend, modelTag, note, PAPER } from './draw';
import { cat, fig, lab, PC, perMetre } from './geom';

// PL-04: the pipe field, all of it an estimate: a quarter of the bed in plan with its zones and legs, one U-pipe in section with its bend, its spacers, its loop and its header, the loop magnified. The real layout
// is a secret of the maker: this is what the physics needs, generic.

const NUMBER = 'PL-04';
export const LAYOUT = {
  plan: { scale: 50, ox: 22, oy: 172 },
  section: { scale: 40, ox: 226, oy: 250 },
  loop: { scale: 10, ox: 342, oy: 88 },
} as const;
export const ITEMS = [
  'heat-pipe',
  'return-bend',
  'pipe-spacer',
  'branch-header',
  'expansion-loop',
  'core-zone',
  'outer-zone',
];
const n = (id: string): number => ITEMS.indexOf(id) + 1;

function draw(d: Drawing): void {
  // ---- a quarter of the bed in plan: the legs on a square grid, the three zones
  const P = LAYOUT.plan;
  const v = d.view(P.ox, P.oy, perMetre(P.scale));
  const B = SILO.bedR;
  v.arc([0, 0], B, 0, 90, { w: W.thick });
  v.line([0, 0], [B, 0], { w: W.thin, dash: 'center' });
  v.line([0, 0], [0, B], { w: W.thin, dash: 'center' });
  const tints = ['#f6d9c5', '#f9e8c9', '#e4edf3'];
  [ZONE_R[2], ZONE_R[1], ZONE_R[0]].forEach((r, i) => {
    const pts: Pt[] = [[0, 0]];
    for (let a = 0; a <= 90; a += 3) pts.push([r * Math.cos((a * Math.PI) / 180), r * Math.sin((a * Math.PI) / 180)]);
    v.polyline(pts, { closed: true, w: W.thin, fill: tints[2 - i] });
  });
  const p = PIPE.pitch;
  for (let i = 0; (i + 0.5) * p < B; i++)
    for (let j = 0; (j + 0.5) * p < B; j++) {
      const x = (i + 0.5) * p;
      const y = (j + 0.5) * p;
      if (Math.hypot(x, y) > B - PIPE.r) continue;
      v.circle([x, y], PIPE.r, { w: W.thin, fill: '#7a5a2a' });
    }
  dimH(v, [0.25, -0.1], [0.75, -0.1], -0.7, fig('pitch', 'E', ' m'), 2);
  dimH(v, [0, 0], [ZONE_R[0], 0], -1.4, lab(ZONE_R[0], 1, 'E'), 2);
  dimH(v, [0, 0], [ZONE_R[1], 0], -2.1, lab(ZONE_R[1], 1, 'E'), 2);
  dimH(v, [0, 0], [ZONE_R[2], 0], -2.8, lab(ZONE_R[2], 0, 'R'), 2);
  v.text([1.5, 1.5], l('cœur', 'core'), { size: 2.6, weight: 'bold', anchor: 'middle', halo: true });
  v.text([3.67, 3.67], l('milieu', 'middle'), { size: 2.2, anchor: 'middle', halo: true });
  v.text([4.5, 4.5], l('extérieur', 'outer'), { size: 2.2, anchor: 'middle', halo: true });
  balloon(v, [2.2, 1.2], P.ox + 150, P.oy - 16, n('core-zone'));
  balloon(v, [5.4, 3.6], P.ox + 150, P.oy - 62, n('outer-zone'));
  caption(d, P.ox + 72, 22, l('UN QUART DU LIT, EN PLAN', 'A QUARTER OF THE BED, IN PLAN'), `1:${P.scale}`);

  // ---- one U-pipe in section, between the shell's floor and the header
  const S = LAYOUT.section;
  const e = d.view(S.ox, S.oy, perMetre(S.scale));
  const y0 = LEVEL.bedBottom;
  const y1 = LEVEL.bedTop;
  e.rect([-0.75, y0], [1.25, y1], { w: W.thin, fill: FILL.stone });
  e.rect([-0.75, y1], [1.25, LEVEL.deckBottom], { w: W.thin, fill: FILL.insulation });
  e.rect([-0.75, y0 - 0.25], [1.25, y0], { w: W.thin, fill: FILL.insulation });
  const r = PIPE.r;
  const xa = 0;
  const xb = PIPE.pitch;
  const yB = PIPE.legBottom;
  const yTop = PIPE.legTop;
  // legs, as two lines each
  for (const x of [xa, xb]) {
    e.line([x - r, yB], [x - r, yTop], { w: W.medium });
    e.line([x + r, yB], [x + r, yTop], { w: W.medium });
    e.line([x, yB], [x, yTop], { w: W.thin, color: HOT, dash: 'center' });
  }
  const cx = (xa + xb) / 2;
  e.arc([cx, yB], PIPE.bendR + r, 180, 360, { w: W.medium });
  e.arc([cx, yB], PIPE.bendR - r, 180, 360, { w: W.medium });
  // the block the bend rests on: the stone buries it
  e.rect([cx - PIPE.blockW / 2, y0], [cx + PIPE.blockW / 2, yB - PIPE.bendR - r], { w: W.thin, fill: INK_2 });
  // spacers on their levels, the bar and the collars
  for (const y of PIPE.spacerYs) {
    e.rect([-0.6, y - 0.03], [1.1, y + 0.03], { w: W.thin, fill: INK_2 });
    for (const x of [xa, xb])
      e.rect([x - PIPE.collarR, y - PIPE.collarH / 2], [x + PIPE.collarR, y + PIPE.collarH / 2], {
        w: W.thin,
        fill: PAPER,
      });
  }
  // the loops and the headers
  const hy = PIPE.headerY;
  for (const [x, sx] of [
    [xa, -1],
    [xb, 1],
  ] as const) {
    e.polyline(
      [
        [x, yTop],
        [x, yTop + 0.12],
        [x + sx * PIPE.loopWidth, yTop + 0.12],
        [x + sx * PIPE.loopWidth, hy - 0.12],
        [x + sx * PIPE.headerOffset, hy - 0.12],
        [x + sx * PIPE.headerOffset, hy - PIPE.headerR],
      ],
      { w: W.medium },
    );
    e.circle([x + sx * PIPE.headerOffset, hy], PIPE.headerR, { w: W.medium, fill: PAPER });
  }
  arrow(e, [xa + r + 0.12, y1 - 1.5], [xa + r + 0.12, y1 - 2.4], HOT);
  arrow(e, [xb + r + 0.12, y1 - 2.4], [xb + r + 0.12, y1 - 1.5], HOT);
  dimV(e, [1.25, y0], [1.25, y1], 1.5, lab(SILO.bedHeight, 0, 'R'), 2);
  dimH(e, [xa, y0 - 0.25], [xb, y0 - 0.25], y0 - 0.5, fig('pitch', 'E', ' m'), 2);
  dimV(e, [-0.75, yB - PIPE.bendR - r], [-0.75, y0], -0.95, lab(PIPE.bendClearance, 2, 'E'), 1.9);
  PIPE.spacerYs.forEach((y, i) => dimV(e, [-0.75, y0], [-0.75, y], -1.25 - i * 0.3, lab(y - y0, 0, 'E'), 1.9));
  e.text([cx, y0 + 3.2], l('pierre', 'stone'), { size: 2.2, anchor: 'middle', halo: true });
  e.text([cx, y1 + 0.85], l('isolant', 'insulation'), { size: 1.9, anchor: 'middle', halo: true });
  const bx = S.ox + 66;
  balloon(e, [xb - r, y0 + 1], bx, S.oy - 110, n('heat-pipe'));
  balloon(e, [cx + 0.2, yB - PIPE.bendR], bx, S.oy - 36, n('return-bend'));
  balloon(e, [1.1, PIPE.spacerYs[0]!], bx, S.oy - 86, n('pipe-spacer'));
  balloon(e, [xb + PIPE.headerOffset, hy], bx, S.oy - 206, n('branch-header'));
  balloon(e, [xb + PIPE.loopWidth, yTop + 0.25], bx, S.oy - 190, n('expansion-loop'));
  caption(d, S.ox + 8, 22, l('UN TUBE EN U, EN COUPE', 'ONE U-PIPE, IN SECTION'), `1:${S.scale}`);

  // ---- the loop magnified
  const L = LAYOUT.loop;
  const q = d.view(L.ox, L.oy, perMetre(L.scale));
  const lw = PIPE.loopWidth;
  const growth = PIPE_GROWTH;
  const rl = PIPE.r;
  const outline = (shift: number, style: { w: number; color?: string; dash?: 'hidden' }) =>
    q.polyline(
      [
        [0, 0 + shift],
        [0, 0.12 + shift],
        [lw, 0.12 + shift / 2],
        [lw, 0.34],
        [PIPE.headerOffset, 0.34],
      ],
      style,
    );
  outline(0, { w: W.thick });
  outline(growth, { w: W.medium, color: HOT, dash: 'hidden' });
  q.line([-rl, 0], [-rl, -0.08], { w: W.medium });
  q.line([rl, 0], [rl, -0.08], { w: W.medium });
  dimH(q, [0, 0.34], [lw, 0.34], 0.42, lab(lw * 1000, 0, 'E', ' mm'), 2);
  dimV(q, [0, 0], [0, growth], -0.12, lab(growth * 100, 0, 'D', ' cm'), 2);
  q.text([lw + 0.03, 0.2], l('à chaud, tiretés', 'hot, dashed'), { size: 2, color: HOT });
  caption(d, L.ox + 16, 22, l('LA LYRE, GROSSIE', 'THE LOOP, MAGNIFIED'), `1:${L.scale}`);

  // ---- the items and the figures
  const X = 314;
  grid(
    d,
    X,
    104,
    [
      { label: l('N°', 'No.'), w: 8, align: 'middle', mono: true },
      { label: l('Pièce', 'Part'), w: 40 },
      { label: l('Taille', 'Size'), w: 44, mono: true },
    ],
    [
      [
        '1',
        PARTS.find((x) => x.id === 'heat-pipe')!.name,
        cat('r ', lab(PIPE.r * 1000, 0, 'E', ' mm'), ', e ', lab(PIPE.wall * 1000, 0, 'E', ' mm')),
      ],
      ['2', PARTS.find((x) => x.id === 'return-bend')!.name, cat('R ', lab(PIPE.bendR * 1000, 0, 'E', ' mm'))],
      [
        '3',
        PARTS.find((x) => x.id === 'pipe-spacer')!.name,
        cat(lab(PIPE.barW * 1000, 0, 'R', ' × '), lab(PIPE.barH * 1000, 0, 'E', ' mm')),
      ],
      ['4', PARTS.find((x) => x.id === 'branch-header')!.name, cat('r ', lab(PIPE.headerR * 1000, 0, 'E', ' mm'))],
      ['5', PARTS.find((x) => x.id === 'expansion-loop')!.name, lab(PIPE.loopWidth * 1000, 0, 'E', ' mm')],
      [
        '6',
        PARTS.find((x) => x.id === 'core-zone')!.name,
        cat(fig('pipesCore', 'E', PC), l(' des tubes', ' of the pipes')),
      ],
      [
        '7',
        PARTS.find((x) => x.id === 'outer-zone')!.name,
        cat(fig('pipesOuter', 'E', PC), l(' des tubes', ' of the pipes')),
      ],
    ],
    { size: 1.75, pad: 0.5 },
  );
  modelTag(d, X, 150, 92);
  grid(
    d,
    X,
    156.5,
    [
      { label: l('Le champ entier', 'The whole field'), w: 56 },
      { label: '', w: 36, align: 'end', mono: true },
    ],
    [
      [l('Branches', 'Legs'), fig('legs', 'M')],
      [l('Longueur de tube', 'Length of pipe'), fig('pipeKm', 'M', ' km')],
      [l('Chute dans la pierre, 1 MW', 'Drop in the stone, 1 MW'), fig('dropK', 'M', ' K')],
      [l('Chemins d’air en parallèle', 'Air paths in parallel'), fig('paths', 'M')],
      [l('Branches en série', 'Legs in series'), fig('legsPerPath', 'M')],
      [l('Temps propre d’une cellule', 'Cell time constant'), fig('cellHours', 'M', ' h')],
    ],
    { size: 1.75, pad: 0.5 },
  );
  note(
    d,
    314,
    206,
    92,
    l(
      'Le constructeur garde son tracé secret : il parle seulement de tubes d’inox verticaux, de zones, d’air en boucle fermée. Ce champ est générique et sort d’un exercice de physique : il dit ce qu’il faut pour sortir 1 MW d’une pierre qui conduit si mal, pas ce qui existe sous le toit du vrai silo.',
      'The maker keeps its layout secret: it speaks only of vertical stainless pipes, of zones, of air in a closed loop. This field is generic and comes from a physics exercise: it says what it takes to get 1 MW out of a stone that conducts so poorly, not what lies under the roof of the real silo.',
    ),
    { size: 1.8 },
  );
  marksLegend(d, 15, 236, 100);
}

export const pipeField: DrawingSheet = {
  id: 'pipe-field',
  number: NUMBER,
  group: 'pipe-cell',
  title: l('Le champ de tubes, générique', 'The pipe field, generic'),
  description: l(
    'Un quart du lit en plan, avec ses trois zones et ses branches au pas estimé, puis un tube en U complet : la branche, le coude, les entretoises, la lyre et le collecteur. Tout est estimé : le constructeur ne publie pas son tracé. Le dernier détail montre comment la lyre avale les 5 cm d’allongement.',
    'A quarter of the bed in plan, with its three zones and its legs at the estimated pitch, then a complete U-pipe: the leg, the bend, the spacers, the loop and the header. It is all estimated: the maker does not publish its layout. The last detail shows how the loop takes up the 5 cm of growth.',
  ),
  scene: 'pipe-cell',
  parts: ITEMS,
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le champ de tubes, générique', 'The pipe field, generic'),
      subtitle: l('Plan, coupe, détail : tout est estimé', 'Plan, section, detail: all estimated'),
      number: NUMBER,
      scale: `1:${LAYOUT.plan.scale} · 1:${LAYOUT.section.scale}`,
    });
    draw(d);
    return d;
  },
};
