import { strL } from '@onigam/lab-kit/i18n';
import type { AppContext, LabDefinition } from '@onigam/lab-kit/ui';
import { aboutPanel } from './data/about';
import { ASSEMBLY, INSTALL } from './data/guide';
import { LESSONS } from './data/lessons';
import { OVERVIEWS } from './data/overviews';
import { PARTS } from './data/parts';
import { MAIN_VIDEO } from './data/sources';
import { PLAN_GROUPS, SHEETS } from './drawings';
import { SimPanel } from './panels/sim';
import { STRIP_SPEEDS, stripAlarms, stripClock, stripValues } from './panels/strip';
import { SandSim } from './sim/engine';
import { createPipeCellScene, createPlantRoomScene, createSiloScene, createSiteScene, WORLD } from './three';

// The lab described to the kit. Edit the content here and in src/data, src/three, src/sim, src/drawings;
// the kit supplies the whole application frame (see BRIEF.md: the frame is locked).

const sim = new SandSim();

/** What the 3D reads from the parameters, since the state does not carry it: the stone or the sand of the bed. */
const medium = () => sim.params.medium;

export const lab: LabDefinition<SandSim> = {
  id: 'sand-battery-lab',
  brand: { title: strL('labTitle'), tagline: strL('tagline'), icon: './favicon.svg' },
  sim,
  defaultScene: 'site',
  video: { id: MAIN_VIDEO.id },
  parts: PARTS,
  scenes: [
    {
      id: 'site',
      label: strL('sceneSite'),
      module: createSiteScene(),
      ...WORLD.site,
      overview: {
        ...OVERVIEWS.site,
        actions: [
          { label: strL('goSilo'), scene: 'silo', primary: true },
          { label: strL('goPlantRoom'), scene: 'plant-room' },
        ],
      },
    },
    {
      id: 'silo',
      label: strL('sceneSilo'),
      module: createSiloScene({ medium }),
      ...WORLD.silo,
      overview: {
        ...OVERVIEWS.silo,
        actions: [
          { label: strL('goPipeCell'), scene: 'pipe-cell', primary: true },
          { label: strL('goPlantRoom'), scene: 'plant-room' },
        ],
      },
    },
    {
      id: 'pipe-cell',
      label: strL('scenePipeCell'),
      module: createPipeCellScene({
        profile: (ring, layer, points) => sim.getPipeProfile(ring, layer, points),
        medium,
      }),
      ...WORLD['pipe-cell'],
      overview: {
        ...OVERVIEWS['pipe-cell'],
        actions: [{ label: strL('goSilo'), scene: 'silo', primary: true }],
      },
    },
    {
      id: 'plant-room',
      label: strL('scenePlantRoom'),
      module: createPlantRoomScene({ medium }),
      ...WORLD['plant-room'],
      overview: {
        ...OVERVIEWS['plant-room'],
        actions: [
          { label: strL('goSilo'), scene: 'silo', primary: true },
          { label: strL('goSite'), scene: 'site' },
        ],
      },
    },
  ],
  partLinks: {
    'silo-exterior': { scene: 'silo', label: strL('goSilo') },
    'equipment-floor': { scene: 'plant-room', label: strL('goPlantRoom') },
    'pipe-field': { scene: 'pipe-cell', label: strL('goPipeCell') },
  },
  guides: {
    // the assembly moves through the worlds (each step names its own) and the installation plays on the village
    assembly: { scene: 'silo', steps: ASSEMBLY },
    install: { scene: 'site', steps: INSTALL },
  },
  lessons: { items: LESSONS, intro: strL('lessonsIntro') },
  plans: { sheets: SHEETS, groups: PLAN_GROUPS, intro: strL('plansIntro') },
  // spoken guide: audio and subtitles generated from narration/<lang>.json (see narration/README.md)
  narration: { manifest: 'audio/{lang}/manifest.json' },
  simPanel: (ctx: AppContext<SandSim>) => new SimPanel(ctx),
  strip: { values: stripValues, clock: stripClock, alarms: stripAlarms, speeds: STRIP_SPEEDS },
  about: aboutPanel,
};
