import { configureDrawings } from '@onigam/lab-kit/drawings';
import { strL } from '@onigam/lab-kit/i18n';
import { h, type AppContext, type LabDefinition } from '@onigam/lab-kit/ui';
import { ASSEMBLY } from './data/guide';
import { LESSONS } from './data/lessons';
import { PARTS } from './data/parts';
import { SHEETS } from './drawings';
import { t } from './i18n/ui';
import { SimPanel } from './panels/sim';
import { STRIP_SPEEDS, stripAlarms, stripClock, stripValues } from './panels/strip';
import { SandSim } from './sim/engine';
import { createPipeCellScene, createPlantRoomScene, createSiloScene, createSiteScene, WORLD } from './three';

// The lab described to the kit. Edit the content here and in src/data, src/three, src/sim, src/drawings;
// the kit supplies the whole application frame (see BRIEF.md: the frame is locked).

configureDrawings({ project: { fr: 'SAND BATTERY LAB — dispositif', en: 'SAND BATTERY LAB — device' } });

const sim = new SandSim();

export const lab: LabDefinition<SandSim> = {
  id: 'sand-battery-lab',
  brand: { title: 'SAND BATTERY LAB', tagline: strL('tagline'), icon: './favicon.svg' },
  sim,
  defaultScene: 'site',
  parts: PARTS,
  scenes: [
    { id: 'site', label: strL('sceneSite'), module: createSiteScene(), ...WORLD.site },
    {
      id: 'silo',
      label: strL('sceneSilo'),
      module: createSiloScene({ medium: () => sim.params.medium }),
      ...WORLD.silo,
    },
    {
      id: 'pipe-cell',
      label: strL('scenePipeCell'),
      module: createPipeCellScene({
        profile: (ring, layer, points) => sim.getPipeProfile(ring, layer, points),
        medium: () => sim.params.medium,
      }),
      ...WORLD['pipe-cell'],
    },
    {
      id: 'plant-room',
      label: strL('scenePlantRoom'),
      module: createPlantRoomScene({ medium: () => sim.params.medium }),
      ...WORLD['plant-room'],
    },
  ],
  partLinks: {
    'silo-exterior': { scene: 'silo', label: strL('goSilo') },
    'equipment-floor': { scene: 'plant-room', label: strL('goPlantRoom') },
    'pipe-field': { scene: 'pipe-cell', label: strL('goPipeCell') },
  },
  guides: { assembly: { scene: 'silo', steps: ASSEMBLY } },
  lessons: { items: LESSONS, intro: strL('lessonsIntro') },
  plans: {
    sheets: SHEETS,
    groups: [{ id: 'device', label: strL('groupDevice') }],
    intro: strL('plansIntro'),
  },
  simPanel: (ctx: AppContext<SandSim>) => new SimPanel(ctx),
  strip: { values: stripValues, clock: stripClock, alarms: stripAlarms, speeds: STRIP_SPEEDS },
  about: () => [h('div', { class: 'callout callout--tip' }, h('span', {}, t('disclaimer')))],
};
