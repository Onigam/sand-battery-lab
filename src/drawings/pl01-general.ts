import { COLORS, Drawing, INK_2, W, type DrawingSheet, type Pt } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { partIds } from '../data/ids';
import { PARTS } from '../data/parts';
import { AZIMUTH, CABLE_RISER, LADDER, LEVEL, RISERS, SILO, SITE, siteFromSilo, VENT } from '../three/dims';
import { arrow, balloon, caption, dimH, dimV, FILL, grid, marksLegend, note, PAPER, poly, RED, WATER } from './draw';
import { lab, perMetre, scaleText } from './geom';

// PL-01: the plot and the village in plan, the silo from outside in elevation, all read from dims.ts. Only the outside of the silo is reported; the plot's size is reported for the 2 MW product; the
// village is generic scenery at true scale, never the real plot.

const NUMBER = 'PL-01';
/** Where the views stand: the scale of each (1:n), the paper position of the silo's axis in the plan, and of its foot in the elevation. */
export const LAYOUT = {
  plan: { scale: 500, ox: 176, oy: 160 },
  elevation: { scale: 200, ox: 352, oy: 92 },
} as const;

export const ITEMS = partIds('site');
const n = (id: string): number => ITEMS.indexOf(id) + 1;

const site2 = (x: number, y: number, z: number): Pt => {
  const [sx, , sz] = siteFromSilo(x, y, z);
  return [sx, -sz];
};
const P = (x: number, z: number): Pt => [x, -z];

function draw(d: Drawing): void {
  const A = LAYOUT.plan;
  const v = d.view(A.ox, A.oy, perMetre(A.scale));

  // ---- the yard
  const y = SITE.yard;
  v.rect(P(y.x0, y.z0), P(y.x1, y.z1), { w: W.medium, fill: FILL.gravel, dash: 'hidden' });
  // the road and the drive
  v.rect(P(-78, SITE.road.z - SITE.road.width / 2), P(y.x1 + 48, SITE.road.z + SITE.road.width / 2), {
    w: W.thin,
    color: INK_2,
    fill: '#ebe7de',
  });
  v.rect(
    P(y.gateX - SITE.road.driveW / 2, y.z1),
    P(y.gateX + SITE.road.driveW / 2, SITE.road.z - SITE.road.width / 2),
    {
      w: W.thin,
      color: INK_2,
      fill: '#ebe7de',
    },
  );

  // ---- the silo: its slab and its wall, at the place of dims.ts
  const c = site2(0, 0, 0);
  v.circle(c, SILO.slabR, { w: W.thin, fill: FILL.concrete });
  v.circle(c, SILO.outerR, { w: W.thick, fill: FILL.roof });
  v.circle(c, SILO.roof.hubR, { w: W.thin, fill: PAPER });
  v.center([c[0] - SILO.slabR - 1, c[1]], [c[0] + SILO.slabR + 1, c[1]], 1);
  v.center([c[0], c[1] - SILO.slabR - 1], [c[0], c[1] + SILO.slabR + 1], 1);

  // ---- the annex, tangent to the slab under the cable riser
  const az = AZIMUTH.cable;
  const a = (az * Math.PI) / 180;
  const t: Pt = [-Math.sin(a), Math.cos(a)];
  const u: Pt = [Math.cos(a), Math.sin(a)];
  const r0 = SILO.slabR;
  const r1 = SILO.slabR + SITE.annex.depth;
  const hl = SITE.annex.length / 2;
  const corner = (r: number, s: number): Pt => site2(u[0] * r + t[0] * s, 0, u[1] * r + t[1] * s);
  poly(v, [corner(r0, -hl), corner(r0, hl), corner(r1, hl), corner(r1, -hl)], { w: W.medium, fill: PAPER });

  // ---- the transformer on its pad, the line
  const tr = SITE.transformer;
  v.rect(P(tr.x - tr.padW / 2, tr.z - tr.padD / 2), P(tr.x + tr.padW / 2, tr.z + tr.padD / 2), {
    w: W.medium,
    fill: FILL.concrete,
  });
  const poles = SITE.line.poles;
  for (let i = 0; i + 1 < poles.length && poles[i]![0] < 70; i++) {
    const p0 = poles[i]!;
    const p1 = poles[i + 1]!;
    const k = Math.min(1, (70 - p0[0]) / (p1[0] - p0[0]));
    v.line(P(p0[0], p0[1]), P(p0[0] + (p1[0] - p0[0]) * k, p0[1] + (p1[1] - p0[1]) * k), {
      w: W.medium,
      color: COLORS.acL,
    });
    v.circle(P(p0[0], p0[1]), 0.7, { w: W.thin, fill: PAPER });
  }
  v.line(P(tr.x, tr.z), P(poles[0]![0], poles[0]![1]), { w: W.thin, color: COLORS.acL });

  // ---- the trench, drawn open, and its spur to the school, with the house at its end
  const tp = SITE.trench.path;
  for (let i = 0; i + 1 < tp.length; i++)
    v.line(P(tp[i]![0], tp[i]![1]), P(tp[i + 1]![0], tp[i + 1]![1]), { w: 1.2, color: WATER });
  const sp = SITE.trench.schoolSpur;
  v.line(P(sp[0]![0], sp[0]![1]), P(sp[1]![0], sp[1]![1]), { w: 1.2, color: WATER });

  // ---- the boiler plant, the school, the house, the solar field
  const b = SITE.boiler;
  v.rect(P(b.x - b.length / 2, b.z - b.width / 2), P(b.x + b.length / 2, b.z + b.width / 2), {
    w: W.medium,
    fill: PAPER,
  });
  v.rect(P(b.x - b.length / 2 - b.storeL, b.z - b.storeW / 2), P(b.x - b.length / 2, b.z + b.storeW / 2), {
    w: W.thin,
    fill: FILL.concrete,
  });
  v.circle(P(b.x + b.length / 2 - 1.5, b.z), b.stackR, { w: W.medium, fill: INK_2 });
  const s = SITE.school;
  v.rect(P(s.x - s.length / 2, s.z - s.width / 2), P(s.x + s.length / 2, s.z + s.width / 2), {
    w: W.medium,
    fill: PAPER,
  });
  const h = SITE.substationHouse;
  v.rect(P(h.x - h.length / 2, h.z - h.width / 2), P(h.x + h.length / 2, h.z + h.width / 2), {
    w: W.medium,
    fill: PAPER,
  });
  const sol = SITE.solar;
  for (let i = 0; i < sol.rows; i++) {
    const z = sol.z0 + i * sol.rowEvery;
    v.rect(
      P(sol.x0, z),
      P(sol.x0 + sol.panels * sol.panelW, z + sol.panelL * Math.cos((sol.tiltDeg * Math.PI) / 180)),
      {
        w: W.thin,
        fill: '#d7dfe8',
      },
    );
  }

  // ---- dimensions of the plot, its size reported for the 2 MW product
  dimH(v, P(y.x0, y.z0), P(y.x1, y.z0), -y.z0 + 7, lab(y.x1 - y.x0, 0, 'R'));
  dimV(v, P(y.x0, y.z0), P(y.x0, y.z1), y.x0 - 5.5, lab(y.z1 - y.z0, 0, 'R'));

  // ---- balloons
  const bal = (id: string, at: Pt, bx: number, by: number) => balloon(v, at, bx, by, n(id));
  bal('silo-exterior', c, A.ox + 16, A.oy - 34);
  bal(
    'dh-riser',
    site2(
      RISERS.axisR * Math.cos((AZIMUTH.water * Math.PI) / 180),
      0,
      RISERS.axisR * Math.sin((AZIMUTH.water * Math.PI) / 180),
    ),
    A.ox - 44,
    A.oy + 8,
  );
  bal('cable-riser', corner(r0 - 0.5, 0), A.ox + 42, A.oy - 2);
  bal('electrical-annex', corner((r0 + r1) / 2, 0), A.ox + 42, A.oy + 11);
  bal('pad-transformer', P(tr.x, tr.z), A.ox + 42, A.oy + 24);
  bal('power-line', P(40, 10.5), A.ox + 88, A.oy + 4);
  bal('solar-field', P(sol.x0 + 10, sol.z0 + 18), A.ox + 50, A.oy - 110);
  bal('wind-farm', P(50, -14), A.ox + 62, A.oy - 14);
  bal('chip-boiler-plant', P(b.x, b.z), A.ox - 50, A.oy - 44);
  bal('boiler-stack', P(b.x + b.length / 2 - 1.5, b.z), A.ox - 20, A.oy - 44);
  bal('dh-trench', P(-30, 21.5), A.ox - 58, A.oy + 62);
  bal('village-school', P(s.x, s.z), A.ox - 110, A.oy - 22);
  bal('house-substation', P(h.x, h.z), A.ox - 150, A.oy + 62);
  arrow(v, P(38, -14), P(56, -18), INK_2, W.thin);
  v.text(P(38, -10), l('vers le parc éolien', 'to the wind farm'), { size: 1.8, color: INK_2 });
  caption(d, 75, 22, l('LE VILLAGE, EN PLAN', 'THE VILLAGE, IN PLAN'), scaleText(A.scale));

  // ---- the silo from outside, in elevation
  const E = LAYOUT.elevation;
  const e = d.view(E.ox, E.oy, perMetre(E.scale));
  const R = SILO.outerR;
  e.rect([-SILO.slabR, 0], [SILO.slabR, SILO.slabH], { w: W.medium, fill: FILL.concrete });
  e.rect([-R, SILO.slabH], [R, LEVEL.eaves], { w: W.thick, fill: '#d4cec3' });
  for (let i = -6; i <= 6; i++)
    e.line([(i * R) / 7, SILO.slabH], [(i * R) / 7, LEVEL.eaves], { w: W.thin, color: INK_2 });
  poly(
    e,
    [
      [-SILO.roof.eaveR, LEVEL.eaves],
      [-SILO.roof.hubR, LEVEL.apex - SILO.roof.hubH],
      [-SILO.roof.hubR, LEVEL.apex],
      [SILO.roof.hubR, LEVEL.apex],
      [SILO.roof.hubR, LEVEL.apex - SILO.roof.hubH],
      [SILO.roof.eaveR, LEVEL.eaves],
    ],
    { w: W.thick, fill: FILL.roof },
  );
  e.line([-10.6, 0], [10.6, 0], { w: W.medium });
  // the two risers, the cable riser, the opening, the ladder: on the wall, in their true heights
  const px = R - 3.2;
  e.rect([px - RISERS.jacketR, RISERS.elbowY], [px + RISERS.jacketR, RISERS.topY], { w: W.thin, fill: FILL.water });
  e.rect([px + 0.5 - RISERS.jacketR, RISERS.elbowY], [px + 0.5 + RISERS.jacketR, RISERS.topY], {
    w: W.thin,
    fill: FILL.water,
  });
  const cx = -R + 2.5;
  e.rect([cx - CABLE_RISER.width / 2, CABLE_RISER.boxH], [cx + CABLE_RISER.width / 2, CABLE_RISER.topY], {
    w: W.thin,
    fill: PAPER,
  });
  e.rect([0.5, VENT.y - VENT.height / 2], [0.5 + VENT.width, VENT.y + VENT.height / 2], { w: W.thin, fill: PAPER });
  const lx = -1.8;
  e.rect([lx - LADDER.width / 2, 0], [lx + LADDER.width / 2, LADDER.landingY], { w: W.thin, color: RED, fill: PAPER });
  e.rect([lx - LADDER.landingW / 2, LADDER.landingY - 0.08], [lx + LADDER.landingW / 2, LADDER.landingY], {
    w: W.thin,
    fill: INK_2,
  });

  dimV(e, [R, 0], [R, LEVEL.apex], R + 3.5, lab(SILO.totalHeight, 0, 'R'));
  dimH(e, [-R, 0], [R, 0], -3.2, lab(2 * R, 0, 'R'));
  dimV(e, [-R, 0], [-R, LEVEL.eaves], -R - 3.5, lab(LEVEL.eaves, 1, 'E'));
  e.text([px + 0.25, RISERS.topY + 0.5], l('eau', 'water'), { size: 1.7, anchor: 'middle', halo: true });
  e.text([cx, CABLE_RISER.topY + 0.5], l('câbles', 'cables'), { size: 1.7, anchor: 'middle', halo: true });
  e.text([1.25, VENT.y + VENT.height / 2 + 0.3], l('ouverture', 'opening'), {
    size: 1.7,
    anchor: 'middle',
    halo: true,
  });
  e.text([lx, LADDER.landingY + 0.5], l('échelle', 'ladder'), { size: 1.7, anchor: 'middle', halo: true });
  caption(d, E.ox, 22, l('LE SILO VU DU DEHORS', 'THE SILO FROM OUTSIDE'), scaleText(E.scale));

  // ---- the items
  const X = 300;
  grid(
    d,
    X,
    116,
    [
      { label: l('N°', 'No.'), w: 8, align: 'middle', mono: true },
      { label: l('Pièce', 'Part'), w: 44 },
      { label: l('Taille dessinée', 'Drawn size'), w: 58, mono: true },
    ],
    ITEMS.map((id, i) => {
      const part = PARTS.find((p) => p.id === id)!;
      return [String(i + 1), part.name, SIZE[id] ?? '—'];
    }),
    { size: 1.75, pad: 0.55 },
  );

  // ---- the legend and the note
  marksLegend(d, 15, 250, 100);
  note(
    d,
    15,
    32,
    120,
    l(
      'Ce village est générique, à la vraie échelle : ce n’est pas le terrain réel. Seuls sont rapportés le silo (environ 13 m sur 15 m) et la parcelle, donnée pour le produit de 2 MW. Les colonnes, la gaine, l’annexe, l’échelle et l’ouverture sont vues sur des photos du constructeur, leur place et leur taille sont les nôtres. La tranchée est dessinée ouverte : on ne laisse jamais un réseau de chaleur à découvert.',
      'This village is generic, at true scale: it is not the real plot. Only the silo (about 13 m by 15 m) and the plot, given for the 2 MW product, are reported. The risers, the duct, the annex, the ladder and the opening are seen on the maker’s photos, their place and size are ours. The trench is drawn open: a heating network is never left uncovered.',
    ),
    { size: 1.85 },
  );
}

/** The drawn sizes of the items, read from dims.ts. */
const SIZE: Partial<Record<string, ReturnType<typeof lab>>> = {};
function fillSizes(): void {
  const dims3 = (a: number, b: number, c: number, dig = 1) => {
    const x = lab(a, dig, 'E', ' × ');
    const y = lab(b, dig, 'E', ' × ');
    const z = lab(c, dig, 'E', ' m');
    return { fr: (x.fr + y.fr + z.fr).replace(/\*/g, '') + ' *', en: (x.en + y.en + z.en).replace(/\*/g, '') + ' *' };
  };
  const dims2 = (a: number, b: number, dig = 1) => {
    const x = lab(a, dig, 'E', ' × ');
    const z = lab(b, dig, 'E', ' m');
    return { fr: (x.fr + z.fr).replace(/\*/g, '') + ' *', en: (x.en + z.en).replace(/\*/g, '') + ' *' };
  };
  SIZE['electrical-annex'] = dims3(SITE.annex.length, SITE.annex.depth, SITE.annex.height, 0);
  SIZE['pad-transformer'] = dims3(SITE.transformer.tankW, SITE.transformer.tankD, SITE.transformer.tankH);
  SIZE['chip-boiler-plant'] = dims3(SITE.boiler.length, SITE.boiler.width, SITE.boiler.height);
  SIZE['boiler-stack'] = lab(SITE.boiler.stackH, 0, 'E');
  SIZE['dh-trench'] = dims2(SITE.trench.width, SITE.trench.depth, 2);
  SIZE['village-school'] = dims3(SITE.school.length, SITE.school.width, SITE.school.storeyH * SITE.school.storeys);
  SIZE['house-substation'] = dims3(SITE.substationHouse.length, SITE.substationHouse.width, SITE.substationHouse.wallH);
  SIZE['power-line'] = lab(SITE.line.poleH, 1, 'E');
  SIZE['wind-farm'] = lab(SITE.wind.hub, 0, 'E');
  SIZE['solar-field'] = dims2(SITE.solar.panelW, SITE.solar.panelL, 2);
  SIZE['silo-exterior'] = l(`${SILO.totalHeight} × ${2 * SILO.outerR} m`, `${SILO.totalHeight} × ${2 * SILO.outerR} m`);
  SIZE['dh-riser'] = lab(RISERS.jacketR * 2, 2, 'E');
  SIZE['cable-riser'] = lab(CABLE_RISER.width, 2, 'E');
}

export const generalArrangement: DrawingSheet = {
  id: 'general-arrangement',
  number: NUMBER,
  group: 'site',
  title: l('Implantation et silo vu du dehors', 'Layout and the silo from outside'),
  description: l(
    'Le village en plan et le silo en élévation, à leur vraie échelle, lus dans les dimensions du modèle 3D. Le village est générique : seuls le silo et la taille de la parcelle sont rapportés. Suivez le courant de la ligne au transformateur, puis l’eau chaude de la tranchée à l’école et à la maison.',
    'The village in plan and the silo in elevation, at their true scale, read from the dimensions of the 3D model. The village is generic: only the silo and the size of the plot are reported. Follow the current from the line to the transformer, then the hot water from the trench to the school and the house.',
  ),
  scene: 'site',
  parts: ITEMS,
  render() {
    fillSizes();
    const d = new Drawing();
    d.frame({
      title: l('Implantation et silo vu du dehors', 'Layout and the silo from outside'),
      subtitle: l('Plan du village, élévation du silo', 'Plan of the village, elevation of the silo'),
      number: NUMBER,
      scale: `${scaleText(LAYOUT.plan.scale)} · ${scaleText(LAYOUT.elevation.scale)}`,
    });
    draw(d);
    return d;
  },
};
