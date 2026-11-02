// The frozen part ids of every world, with their category: docs/research.md §4, word for word. The contract between the catalogue, the guides, the
// lessons, the drawings and the 3D registries. The kit knows five categories only (hydraulic, mechanical, electrical, structure, site), so the research's
// finer ones map onto them: the water of the network is `hydraulic`, the air loop and its pipes are `mechanical`, the stone and what holds it are `structure`.
// (docs/kit-requests.md asks for a label of the lab's own, because a pipe full of air is not « mechanical » in any useful sense.)
import type { PartCategory } from '@onigam/lab-kit/content';

export type WorldId = 'site' | 'silo' | 'pipe-cell' | 'plant-room';

export const WORLDS: readonly WorldId[] = ['site', 'silo', 'pipe-cell', 'plant-room'];

export const PART_CATEGORIES: Record<WorldId, Record<string, PartCategory>> = {
  site: {
    'silo-exterior': 'structure',
    'dh-riser': 'hydraulic',
    'cable-riser': 'electrical',
    'electrical-annex': 'electrical',
    'pad-transformer': 'electrical',
    'power-line': 'electrical',
    'solar-field': 'site',
    'wind-farm': 'site',
    'chip-boiler-plant': 'site',
    'boiler-stack': 'site',
    'dh-trench': 'hydraulic',
    'village-school': 'site',
    'house-substation': 'hydraulic',
  },
  silo: {
    'foundation-slab': 'structure',
    'base-insulation': 'structure',
    'inner-shell': 'structure',
    'wall-insulation': 'structure',
    'outer-cladding': 'structure',
    'storage-bed': 'structure',
    'pipe-field': 'mechanical',
    'top-insulation': 'structure',
    'equipment-floor': 'structure',
    'conical-roof': 'structure',
    'upper-vent': 'structure',
    'access-ladder': 'structure',
    'thermocouple-lance': 'electrical',
    'duct-penetration': 'mechanical',
  },
  'pipe-cell': {
    'heat-pipe': 'mechanical',
    'return-bend': 'mechanical',
    'pipe-spacer': 'structure',
    'branch-header': 'mechanical',
    'expansion-loop': 'mechanical',
    'core-zone': 'structure',
    'outer-zone': 'structure',
    'quartz-sand': 'structure',
    'crushed-soapstone': 'structure',
  },
  'plant-room': {
    'lv-switchboard': 'electrical',
    'heater-controller': 'electrical',
    'resistor-bank': 'electrical',
    'charge-blower': 'mechanical',
    'discharge-blower': 'mechanical',
    'blower-drive': 'electrical',
    'charge-damper': 'mechanical',
    'discharge-damper': 'mechanical',
    'hot-air-duct': 'mechanical',
    'cold-air-duct': 'mechanical',
    'air-water-exchanger': 'hydraulic',
    'dh-pump': 'hydraulic',
    'heat-meter': 'hydraulic',
    'expansion-vessel': 'hydraulic',
    'control-cabinet': 'electrical',
  },
};

/** The ids of a world, in catalogue order. */
export const partIds = (world: WorldId): string[] => Object.keys(PART_CATEGORIES[world]);
