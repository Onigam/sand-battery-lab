import { lazyModule } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { SandState } from '../sim/types';
import { createPipeCellScene as buildPipeCell, type PipeCellOptions } from './pipecell/scene';
import { createPlantRoomScene as buildPlantRoom, type PlantRoomOptions } from './plantroom/scene';
import { createSiloScene as buildSilo, type SiloWorldOptions } from './silo/scene';
import { createSiteScene as buildSite, type SiteOptions } from './site/scene';

// The four worlds, all `lazyModule`s: nothing is built until the visitor goes there. Use the result as the `module` of a `SceneDef`. They read the simulation's state in `update`; what the
// state does not carry (the medium, the fine profile around a pipe) is passed by the application: `createPipeCellScene({ profile: sim.getPipeProfile.bind(sim), medium: () => sim.params.medium })`.

export const createSiteScene = (opts: SiteOptions = {}): SceneModule<SandState> =>
  lazyModule<SandState>('site', () => buildSite(opts));
export const createSiloScene = (opts: SiloWorldOptions = {}): SceneModule<SandState> =>
  lazyModule<SandState>('silo', () => buildSilo(opts));
export const createPipeCellScene = (opts: PipeCellOptions = {}): SceneModule<SandState> =>
  lazyModule<SandState>('pipe-cell', () => buildPipeCell(opts));
export const createPlantRoomScene = (opts: PlantRoomOptions = {}): SceneModule<SandState> =>
  lazyModule<SandState>('plant-room', () => buildPlantRoom(opts));

/** What `src/lab.ts` needs to know about each world, as `SceneDef` fields: spread it into the definition. */
export const WORLD = {
  site: {
    /** The kit treats this id as a landscape: authored home pose, far plane 4000 m. The trench is drawn open: no section tool here. */
    cutaway: false,
    /** A village does not come apart, and a slider that moves nothing teaches nothing (review N3). */
    explode: false,
    /** X-ray only makes sense around a selected part in a landscape. */
    xrayNeedsSelection: true,
    partPadding: 1.3,
    stepFrame: { padding: 1.7, minRadius: 3 },
  },
  silo: {
    /** The section is the hero of this world: a quarter is already open, the tool opens the half. */
    cutaway: true,
    /** Slow motion only scales what turns: nothing does here, and without it the toolbar keeps to one row at 1280 px. */
    slowMo: false,
    partPadding: 1.15,
    stepFrame: { padding: 1.5, minRadius: 2 },
    /** Parts made transparent by X-ray while nothing is selected: the shell, so the stone and the pipes read. */
    xrayShell: (id: string): boolean =>
      id === 'outer-cladding' ||
      id === 'wall-insulation' ||
      id === 'inner-shell' ||
      id === 'top-insulation' ||
      id === 'conical-roof' ||
      id === 'upper-vent' ||
      id === 'access-ladder',
  },
  'pipe-cell': {
    cutaway: true,
    slowMo: false,
    partPadding: 1.2,
    stepFrame: { padding: 1.5, minRadius: 0.5 },
    xrayShell: (id: string): boolean => id === 'core-zone' || id === 'outer-zone',
  },
  'plant-room': {
    /** No section here: the room is open to the eye, the machines come off in the exploded view. */
    cutaway: false,
    partPadding: 1.3,
    stepFrame: { padding: 1.5, minRadius: 0.8 },
    /** With nothing selected X-ray clears the ducts and the dampers on them, the mass in front: the machines behind them read. */
    xrayShell: (id: string): boolean =>
      id === 'hot-air-duct' || id === 'cold-air-duct' || id === 'charge-damper' || id === 'discharge-damper',
  },
} as const;
