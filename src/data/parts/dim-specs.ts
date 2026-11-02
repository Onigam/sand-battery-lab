// The dimension rows of the part sheets, ALL read from src/three/dims.ts (the single source of lengths, BRIEF §5): nothing in this file is a number typed here, except the unit conversions.
// They are appended to the specs of each sheet by ../parts.ts. Whatever is reported (15 m, 13 m, 14 m, 6 m) is written in the sheets themselves; every length here is an ESTIMATE of the
// 3D model (the sources give none) and is tagged « estimation ». Scenery sizes are the lab's choice: a generic village, never the real plot.
import type { Spec } from '@onigam/lab-kit/content';
import {
  CABLE_RISER,
  CELL,
  LADDER,
  LANCES,
  LEVEL,
  PIPE,
  PLANT,
  RISERS,
  SILO,
  SITE,
  VENT,
  WALL,
  ZONE_R,
} from '../../three/dims';
import { lenM, lenMm, sp, tagged } from '../part-helpers';
import { nEn, nFr } from '../units';

/** A count that is an estimate, in both languages. */
const count = (n: number, fr: string, en: string) => tagged('estimate', `${nFr(n)} ${fr}`, `${nEn(n)} ${en}`);

const twoDigits = (...m: number[]) => lenM('estimate', 2, ...m);

export const DIM_SPECS: Record<string, Spec[]> = {
  // ---- site
  'dh-riser': [
    sp('Rayon du tuyau dessiné', 'Drawn pipe radius', lenMm('estimate', RISERS.pipeR)),
    sp('Rayon de sa gaine', 'Radius of its jacket', lenMm('estimate', RISERS.jacketR)),
    sp('Hauteur de sortie du mur', 'Height where it leaves the wall', twoDigits(RISERS.topY)),
  ],
  'cable-riser': [
    sp('Gaine dessinée', 'Drawn duct', lenMm('estimate', CABLE_RISER.width, CABLE_RISER.depth)),
    sp('Sommet', 'Top', twoDigits(CABLE_RISER.topY)),
  ],
  'pad-transformer': [
    sp('Socle', 'Pad', twoDigits(SITE.transformer.padW, SITE.transformer.padD)),
    sp('Cuve', 'Tank', twoDigits(SITE.transformer.tankW, SITE.transformer.tankD, SITE.transformer.tankH)),
  ],
  'power-line': [
    sp('Hauteur des poteaux dessinés', 'Height of the drawn poles', twoDigits(SITE.line.poleH)),
    sp('Longueur de la traverse', 'Length of the cross-arm', twoDigits(SITE.line.crossArm)),
  ],
  'solar-field': [
    sp('Rangées dessinées', 'Drawn rows', count(SITE.solar.rows, 'rangées', 'rows')),
    sp('Panneaux par rangée', 'Panels per row', count(SITE.solar.panels, 'panneaux', 'panels')),
    sp('Taille d’un panneau', 'Size of a panel', twoDigits(SITE.solar.panelW, SITE.solar.panelL)),
  ],
  'wind-farm': [
    sp('Moyeu dessiné', 'Drawn hub', lenM('estimate', 0, SITE.wind.hub)),
    sp('Rayon du rotor', 'Rotor radius', lenM('estimate', 0, SITE.wind.rotorR)),
    sp('Éoliennes dessinées', 'Drawn turbines', count(SITE.wind.turbines.length, 'machines', 'machines')),
  ],
  'chip-boiler-plant': [
    sp('Halle dessinée', 'Drawn hall', twoDigits(SITE.boiler.length, SITE.boiler.width, SITE.boiler.height)),
    sp('Stock de plaquettes', 'Chip store', twoDigits(SITE.boiler.storeL, SITE.boiler.storeW, SITE.boiler.storeH)),
  ],
  'boiler-stack': [
    sp('Hauteur dessinée', 'Drawn height', twoDigits(SITE.boiler.stackH)),
    sp('Rayon', 'Radius', lenMm('estimate', SITE.boiler.stackR)),
  ],
  'dh-trench': [
    sp('Largeur dessinée', 'Drawn width', twoDigits(SITE.trench.width)),
    sp('Profondeur dessinée', 'Drawn depth', twoDigits(SITE.trench.depth)),
    sp('Rayon des tuyaux', 'Radius of the pipes', lenMm('estimate', SITE.trench.pipeR)),
  ],
  'village-school': [
    sp('Corps de bâtiment dessiné', 'Drawn main block', twoDigits(SITE.school.length, SITE.school.width)),
    sp('Étages', 'Storeys', count(SITE.school.storeys, 'niveaux', 'storeys')),
  ],
  'house-substation': [
    sp('Maison dessinée', 'Drawn house', twoDigits(SITE.substationHouse.length, SITE.substationHouse.width)),
  ],
  // ---- silo
  'foundation-slab': [sp('Épaisseur dessinée', 'Drawn thickness', twoDigits(SILO.slabH))],
  'base-insulation': [sp('Dessus de l’isolant', 'Top of the insulation', twoDigits(LEVEL.bedBottom))],
  'inner-shell': [
    sp('Épaisseur dessinée', 'Drawn thickness', lenMm('estimate', SILO.shellT)),
    sp('Rayon extérieur', 'Outer radius', twoDigits(WALL.shellOut)),
  ],
  'wall-insulation': [sp('Rayon extérieur', 'Outer radius', twoDigits(WALL.insulationOut))],
  'outer-cladding': [
    sp('Épaisseur dessinée', 'Drawn thickness', lenMm('estimate', SILO.claddingT)),
    sp('Nervures', 'Ribs', count(SILO.ribs, 'nervures', 'ribs')),
    sp('Profondeur d’une nervure', 'Depth of a rib', lenMm('estimate', SILO.ribDepth)),
  ],
  'pipe-field': [
    sp('Rayon des zones', 'Radius of the zones', twoDigits(...ZONE_R)),
    sp('Bas des branches droites', 'Bottom of the straight legs', twoDigits(PIPE.legBottom)),
  ],
  'top-insulation': [sp('Niveaux', 'Levels', twoDigits(LEVEL.bedTop, LEVEL.deckBottom))],
  'equipment-floor': [
    sp('Niveau du plancher', 'Level of the deck', twoDigits(LEVEL.floor)),
    sp('Plafond du local', 'Ceiling of the room', twoDigits(LEVEL.ceiling)),
    sp('Épaisseur du plancher', 'Thickness of the deck', lenMm('estimate', SILO.deckT)),
  ],
  'conical-roof': [
    sp('Rayon à l’égout', 'Radius at the eaves', twoDigits(SILO.roof.eaveR)),
    sp('Rayon du moyeu', 'Radius of the hub', twoDigits(SILO.roof.hubR)),
    sp('Égout', 'Eaves', twoDigits(LEVEL.eaves)),
  ],
  'upper-vent': [sp('Grille dessinée', 'Drawn louvre', twoDigits(VENT.width, VENT.height))],
  'access-ladder': [
    sp('Largeur', 'Width', lenMm('estimate', LADDER.width)),
    sp('Pas des barreaux', 'Rung spacing', lenMm('estimate', LADDER.rungEvery)),
    sp('Palier', 'Landing', twoDigits(LADDER.landingW, LADDER.landingD)),
  ],
  'thermocouple-lance': [
    sp('Cannes dessinées', 'Drawn lances', count(LANCES.onX.length + LANCES.onZ.length, 'cannes', 'lances')),
    sp('Rayon d’une canne', 'Radius of a lance', lenMm('estimate', LANCES.r)),
  ],
  // ---- pipe cell
  'return-bend': [
    sp('Rayon de courbure', 'Bend radius', lenMm('estimate', PIPE.bendR)),
    sp('Pierre sous le coude', 'Stone under the bend', lenMm('estimate', PIPE.bendClearance)),
  ],
  'pipe-spacer': [
    sp('Section d’une barre', 'Section of a bar', lenMm('estimate', PIPE.barW, PIPE.barH)),
    sp('Niveaux des cadres', 'Levels of the frames', twoDigits(...PIPE.spacerYs)),
  ],
  'branch-header': [
    sp('Rayon', 'Radius', lenMm('estimate', PIPE.headerR)),
    sp('Niveau de l’axe', 'Level of the axis', twoDigits(PIPE.headerY)),
  ],
  'expansion-loop': [sp('Largeur de la lyre', 'Width of the loop', lenMm('estimate', PIPE.loopWidth))],
  'core-zone': [sp('Rayon', 'Radius', twoDigits(ZONE_R[0]))],
  'outer-zone': [sp('Du rayon au bord', 'From radius to edge', twoDigits(ZONE_R[1], ZONE_R[2]))],
  'quartz-sand': [
    sp('Grain dessiné, très grossi', 'Drawn grain, greatly magnified', lenMm('estimate', CELL.magnified.sand)),
  ],
  'crushed-soapstone': [
    sp('Grain dessiné, très grossi', 'Drawn grain, greatly magnified', lenMm('estimate', CELL.magnified.soap)),
  ],
  // ---- plant room
  'lv-switchboard': [
    sp('Armoire dessinée', 'Drawn cabinet', twoDigits(PLANT.switchboard.w, PLANT.switchboard.d, PLANT.switchboard.h)),
  ],
  'heater-controller': [
    sp('Armoire dessinée', 'Drawn cabinet', twoDigits(PLANT.controller.w, PLANT.controller.d, PLANT.controller.h)),
  ],
  'resistor-bank': [
    sp('Étages dessinés', 'Drawn stages', count(PLANT.bank.stages, 'étages', 'stages')),
    sp('Éléments par étage', 'Elements per stage', count(PLANT.bank.elementsPerStage, 'éléments', 'elements')),
  ],
  'charge-blower': [
    sp('Rayon de la roue', 'Radius of the impeller', lenMm('estimate', PLANT.blower.impellerR)),
    sp('Largeur de la volute', 'Width of the casing', lenMm('estimate', PLANT.blower.width)),
  ],
  'discharge-blower': [
    sp('Rayon de la roue', 'Radius of the impeller', lenMm('estimate', PLANT.blower.impellerR)),
    sp('Pales', 'Blades', count(PLANT.blower.blades, 'pales', 'blades')),
  ],
  'blower-drive': [sp('Armoire dessinée', 'Drawn cabinet', twoDigits(PLANT.drive.w, PLANT.drive.d, PLANT.drive.h))],
  'charge-damper': [
    sp('Caisson dessiné', 'Drawn box', lenMm('estimate', PLANT.damper.w, PLANT.damper.h, PLANT.damper.l)),
  ],
  'discharge-damper': [
    sp('Caisson dessiné', 'Drawn box', lenMm('estimate', PLANT.damper.w, PLANT.damper.h, PLANT.damper.l)),
  ],
  'hot-air-duct': [sp('Rayon avec son habillage', 'Radius with its jacket', lenMm('estimate', PLANT.mainR))],
  'cold-air-duct': [sp('Rayon avec son habillage', 'Radius with its jacket', lenMm('estimate', PLANT.mainR))],
  'air-water-exchanger': [
    sp(
      'Caisson dessiné',
      'Drawn casing',
      twoDigits(PLANT.exchanger.x1 - PLANT.exchanger.x0, PLANT.exchanger.depth, PLANT.exchanger.h),
    ),
  ],
  'dh-pump': [
    sp('Rayon de la volute', 'Radius of the casing', lenMm('estimate', PLANT.pump.voluteR)),
    sp('Longueur du moteur', 'Length of the motor', lenMm('estimate', PLANT.pump.motorL)),
  ],
  'heat-meter': [sp('Corps du compteur', 'Body of the meter', lenMm('estimate', PLANT.meter.bodyL))],
  'expansion-vessel': [
    sp('Rayon', 'Radius', lenMm('estimate', PLANT.vessel.r)),
    sp('Hauteur', 'Height', lenMm('estimate', PLANT.vessel.h)),
  ],
  'control-cabinet': [
    sp('Armoire dessinée', 'Drawn cabinet', twoDigits(PLANT.control.w, PLANT.control.d, PLANT.control.h)),
  ],
};
