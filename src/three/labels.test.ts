import { describe, expect, it } from 'vitest';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { SandState } from '../sim/types';
import { LABEL_HEIGHT, labelBoxes, type LabelBox } from './framing';
import { createPipeCellScene } from './pipecell/scene';
import { createPlantRoomScene } from './plantroom/scene';
import { createSiloScene } from './silo/scene';
import { createSiteScene } from './site/scene';
import { stateWith, view } from './test-utils';

// The labels of the default views, without a browser: the camera of the kit's overview and the box of a label are replicated (framing.ts). For the labels shown in "Principales" mode: at most six, none
// over another, none outside the view, none under the toolbar. From Mill Lab.

const SIZES: [string, number, number, number][] = [
  ['1280×800 (3D view 842×678)', 842, 678, 96],
  ['1280×800 with the sheet (842×736)', 842, 736, 96],
  ['768×1024 (380×902)', 380, 902, 130],
  ['phone 390×632', 390, 632, 92],
];

function check(name: string, mod: SceneModule<SandState>) {
  describe(`labels of ${name}`, () => {
    mod.update(stateWith(), 1 / 60, view({ time: 1 }));
    for (const lang of ['fr', 'en'] as const)
      for (const [label, w, h, toolbar] of SIZES) {
        it(`keep apart and inside the view: ${label}, ${lang}`, () => {
          const boxes = labelBoxes(mod, { w, h }, lang, toolbar).filter((b) => !b.minor);
          const bottom = w < h * 0.7 ? h - toolbar : h;
          const above = w < h * 0.7 ? 0 : toolbar;
          expect(boxes.length).toBeLessThanOrEqual(6);
          const over = (a: LabelBox, b: LabelBox) =>
            a.x0 < b.x1 + 3 && b.x0 < a.x1 + 3 && a.y0 < b.y1 + 3 && b.y0 < a.y1 + 3;
          const clash: string[] = [];
          boxes.forEach((a, i) => boxes.slice(i + 1).forEach((b) => over(a, b) && clash.push(`${a.text} / ${b.text}`)));
          expect(clash).toEqual([]);
          for (const b of boxes) {
            expect(b.inFront, b.text).toBe(true);
            expect(b.ax, `${b.text} dot`).toBeGreaterThan(0);
            expect(b.ax, `${b.text} dot`).toBeLessThan(w);
            expect(b.x1, `${b.text} label inside the view`).toBeLessThanOrEqual(w);
            expect(b.ay - LABEL_HEIGHT / 2, `${b.text} label under the top`).toBeGreaterThan(6);
            expect(b.ay + LABEL_HEIGHT / 2, `${b.text} above the toolbar`).toBeLessThan(bottom - above + 12);
          }
        });
      }
  });
}

check('site', createSiteScene());
check('silo', createSiloScene());
check('pipe-cell', createPipeCellScene());
check('plant-room', createPlantRoomScene());
