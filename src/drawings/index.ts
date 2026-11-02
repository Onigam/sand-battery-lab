import { configureDrawings, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { generalArrangement } from './pl01-general';
import { siloSection } from './pl02-section';
import { temperatureMapsSheet } from './pl03-maps';
import { pipeField } from './pl04-pipes';
import { airLoop } from './pl05-air';
import { singleLine } from './pl06-single-line';
import { heatSide } from './pl07-heat';
import { energyBalance } from './pl08-balance';
import { assemblySequence } from './pl09-sequence';
import { scaleComparison } from './pl10-scale';

// The title block's texts of every sheet: « reconstruction » is said here, once per sheet as any title block does, and nowhere else on the sheets. src/lab.ts may set the project's name on top of this.
configureDrawings({
  project: { fr: 'LABO DE LA BATTERIE DE SABLE', en: 'SAND BATTERY LAB' },
  disclaimer: {
    fr: 'Reconstitution pédagogique indépendante : pas un plan de construction',
    en: 'Independent educational reconstruction: not a construction plan',
  },
  date: '2026-11-02',
});

/** Every drawing of the "Plans" mode, in reading order (the numbers of the title blocks). */
export const SHEETS: DrawingSheet[] = [
  generalArrangement,
  siloSection,
  temperatureMapsSheet,
  pipeField,
  airLoop,
  singleLine,
  heatSide,
  energyBalance,
  assemblySequence,
  scaleComparison,
];

/** The groups of the "Plans" mode, for `plans.groups` in src/lab.ts. */
export const PLAN_GROUPS: { id: string; label: L }[] = [
  { id: 'site', label: l('Le village', 'The village') },
  { id: 'silo', label: l('Le silo', 'The silo') },
  { id: 'pipe-cell', label: l('Les tubes', 'The pipes') },
  { id: 'plant-room', label: l('L’étage technique', 'The equipment floor') },
  { id: 'model', label: l('Ce que trouve le modèle', 'What the model finds') },
];
