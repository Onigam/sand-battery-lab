import type { PartInfo } from '@onigam/lab-kit/content';
import { DIM_SPECS } from './parts/dim-specs';
import { PIPE_CELL_PARTS } from './parts/pipe-cell';
import { PLANT_ROOM_PARTS } from './parts/plant-room';
import { SILO_PARTS } from './parts/silo';
import { SITE_PARTS } from './parts/site';

// The parts catalogue: one entry per selectable 3D part, one file per world in ./parts, in the catalogue order of src/data/ids.ts (frozen from docs/research.md §4;
// data.test.ts checks that ids, worlds and categories agree with it): 13 in `site`, 14 in `silo`, 9 in `pipe-cell`, 15 in `plant-room`.
// The dimension rows of every sheet are read from src/three/dims.ts in ./parts/dim-specs.ts and appended here, so that no length is typed twice.
export const PARTS: PartInfo[] = [...SITE_PARTS, ...SILO_PARTS, ...PIPE_CELL_PARTS, ...PLANT_ROOM_PARTS].map((p) => ({
  ...p,
  specs: [...p.specs, ...(DIM_SPECS[p.id] ?? [])],
}));
