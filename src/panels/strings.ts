import { getLang, registerStrings, tx } from '@onigam/lab-kit/i18n';
import { ALARM_TEXTS, MEDIUM_TEXTS, PRESET_TEXTS, SCENARIO_TEXTS, STRATEGY_TEXTS, type Pair } from '../sim/texts';

// The words of the simulation panel, French and English written together: `key: [fr, en]`. They are kept apart from src/i18n/ui.ts, which belongs to
// the data role, so that the two can be written at the same time. The texts of the alarms and the scenarios come from src/sim/texts.ts.

const PANEL = {
  simTitle2: ['Simulation', 'Simulation'],
  simIntro: [
    'Un modèle du silo, de ses boucles d’air et de ses parois. La pierre stocke de la chaleur et rend de la chaleur, pas du courant. Les tubes, l’isolant et les soufflantes ne sont pas publiés : ils sont estimés par le calcul. Aucune mesure indépendante d’un vrai silo n’existe.',
    'A model of the silo, its air loops and its walls. The stone stores heat and gives back heat, not electricity. The pipes, the insulation and the blowers are not published: they are estimated by calculation. No independent measurement of a real silo exists.',
  ],
  tagLegend: [
    '† résultat du modèle · * estimation : les sources se taisent.',
    '† result of the model · * estimate: the sources are silent.',
  ],
  preset: ['Point de départ', 'Starting point'],
  custom: ['Réglages personnels', 'Custom settings'],
  resetSim: ['Recommencer', 'Start again'],
  scenarios: ['Scénarios', 'Scenarios'],
  scenarioHint: [
    'Chacun raconte une chose. Ils règlent eux-mêmes la vitesse du temps.',
    'Each tells one thing. They set the speed of time themselves.',
  ],

  // ---- the status line
  statusIdle: [
    'Rien n’entre, rien ne sort : seules les parois travaillent.',
    'Nothing in, nothing out: only the walls are at work.',
  ],
  statusCharging: [
    'Les résistances chauffent l’air, l’air chauffe la pierre.',
    'The resistors heat the air, the air heats the stone.',
  ],
  statusDischarging: [
    'L’air va chercher la chaleur de la pierre pour le réseau.',
    'The air fetches the heat of the stone for the network.',
  ],
  statusBoth: [
    'Charge et décharge en même temps, sur des zones différentes.',
    'Charge and discharge at the same time, on different zones.',
  ],
  statusBoiler: [
    'La pierre ne suffit plus : la chaudière complète.',
    'The stone is no longer enough: the boiler makes up the rest.',
  ],
  statusFull: ['Plein : la charge attend.', 'Full: the charge waits.'],
  statusTripped: [
    'Plus d’air : le pressostat a coupé les résistances. Le réseau, lui, a sa propre soufflante.',
    'No air: the pressure switch has cut the resistors. The network has its own blower.',
  ],
  statusBurning: [
    'Plus d’air et plus de pressostat : les résistances n’ont aucune issue pour leur chaleur.',
    'No air and no pressure switch: the resistors have no way out for their heat.',
  ],
  statusFailing: ['La soufflante ralentit, le débit tombe.', 'The blower slows, the flow falls.'],
  statusReserve: [
    'Le réseau électrique a demandé moins de charge : les résistances se sont effacées.',
    'The grid has asked for less load: the resistors have dropped out.',
  ],

  // ---- the live figures
  liveLevel: ['Charge', 'Charge'],
  liveUsable: ['Utile à plein', 'At full power'],
  liveMean: ['Moyenne', 'Mean'],
  liveCore: ['Cœur', 'Core'],
  liveEdge: ['Bord', 'Edge'],
  liveHeater: ['Résistances', 'Resistors'],
  liveHeat: ['Réseau', 'Network'],
  liveWalls: ['Parois', 'Walls'],
  livePrice: ['Prix', 'Price'],
  liveCost: ['Coût chaleur', 'Cost of heat'],
  liveEfficiency: ['Rendement', 'Efficiency'],
  liveBoiler: ['Chaudière', 'Boiler'],

  levelHint: [
    'Charge : la part de la chaleur au-dessus de l’eau de retour. « Utile à plein » : ce qu’il reste avant que la pleine puissance s’arrête, bien avant une charge nulle.',
    'Charge: the share of the heat above the return water. “At full power”: what is left before full power stops, long before a charge of zero.',
  ],
  moreTitle: ['Tous les chiffres', 'All the figures'],
  moreDemand: ['Demande du réseau', 'Network demand'],
  moreFloor: ['Moyenne sous laquelle le plein régime s’arrête', 'Mean below which full power stops'],
  moreHeat: ['Chaleur au-dessus de l’air ambiant', 'Heat above ambient'],
  moreShell: ['Virole, au plus chaud', 'Inner shell, at its hottest'],
  moreSurface: ['Bardage, au plus chaud', 'Cladding, at its hottest'],
  moreOutside: ['Air extérieur', 'Outside air'],
  moreAirHot: ['Air en sortie de résistances', 'Air leaving the resistors'],
  moreAirBack: ['Air au retour de la charge', 'Air back from the charge'],
  moreExIn: ['Air à l’entrée de l’échangeur', 'Air into the exchanger'],
  moreExOut: ['Air à la sortie de l’échangeur', 'Air out of the exchanger'],
  moreChargeFlow: ['Débit d’air, charge', 'Air flow, charge'],
  moreDischargeFlow: ['Débit d’air, décharge', 'Air flow, discharge'],
  moreBlowers: ['Électricité des soufflantes', 'Electricity of the blowers'],
  moreWater: ['Débit d’eau', 'Water flow'],
  moreElectric: ['Électricité, tout compris', 'Electricity, everything'],
  moreElement: ['Résistances, leur température', 'Resistors, their temperature'],
  moreMass: ['Masse du lit', 'Mass of the bed'],
  moreSince: ['Depuis le départ', 'Since the start'],
  moreElectricE: ['Électricité payée', 'Electricity paid for'],
  moreHeatE: ['Chaleur livrée', 'Heat delivered'],
  moreBoilerE: ['Chaleur de la chaudière', 'Heat from the boiler'],
  moreWallsE: ['Perdu par les parois', 'Lost by the walls'],
  moreRestE: ['Perdu ailleurs (gaines, moteurs, poste)', 'Lost elsewhere (ducts, motors, transformer)'],
  moreCostE: ['Payé en électricité', 'Paid for electricity'],
  moreCostB: ['Payé en plaquettes', 'Paid for wood chips'],

  // ---- the budget of the stone: why the rating is under half of the heat
  budgetTitle: ['Où va la chaleur de la pierre, un plein', 'Where the heat of the stone goes, one full charge'],
  budgetAtPower: ['Rendue à pleine puissance', 'Given back at full power'],
  budgetTail: ['Rendue à puissance décroissante', 'Given back at falling power'],
  budgetStays: ['Reste dans la pierre', 'Stays in the stone'],
  budgetHint: [
    'Il faut de l’air pour porter la puissance. Quand la pierre refroidit, l’air revient moins chaud et il en faudrait plus qu’une soufflante n’en donne : le plein régime s’arrête bien avant que la pierre soit froide. Le reste sort à puissance plus faible, ou jamais.',
    'It takes air to carry the power. As the stone cools, the air comes back less hot and it would take more than a blower gives: full power stops long before the stone is cold. The rest comes out at lower power, or never.',
  ],
  budgetMaker: [
    'Le constructeur annonce jusqu’à 100 MWh, soit 46 % de la chaleur au-dessus de l’ambiante, sans dire à quelle puissance. Le modèle encadre ce chiffre : voir la courbe suivante.',
    'The maker quotes up to 100 MWh, which is 46 % of the heat above ambient, without saying at what power. The model brackets that figure: see the next curve.',
  ],

  // ---- sections
  secMachine: ['La machine', 'The machine'],
  medium: ['Matériau', 'Medium'],
  mediumHint: [
    'Le plus grand silo en service ne contient pas de sable : de la pierre ollaire concassée, plus dense. Le même volume de sable pèse un tiers de moins.',
    'The largest silo in service holds no sand: crushed soapstone, denser. The same volume of sand weighs a third less.',
  ],
  ratedPower: ['Puissance de chaleur *', 'Heat power *'],
  chargePower: ['Puissance des résistances *', 'Power of the resistors *'],
  chargeHint: [
    'La puissance de charge réelle n’est pas publiée. Soufflantes et échangeur suivent ces deux réglages.',
    'The real charging power is not published. Blowers and exchanger follow these two settings.',
  ],
  fullMeanT: ['Moyenne à pleine charge', 'Mean at full charge'],
  coreLimit: ['Limite du cœur', 'Core limit'],
  chargeAirT: ['Air de charge *', 'Charging air *'],
  tempHint: [
    'Une moyenne élevée sous un air peu chaud laisse peu de place à un cœur chaud : essayez plus d’air.',
    'A high mean under air that is not very hot leaves little room for a hot core: try more air.',
  ],
  secInside: ['L’intérieur : tubes et isolant', 'Inside: pipes and insulation'],
  pitch: ['Pas des tubes *', 'Pipe pitch *'],
  pitchHint: [
    'Le tracé réel est secret. Plus les tubes sont serrés, plus la pierre leur parle facilement, et plus il y en a à poser.',
    'The real layout is secret. The closer the pipes, the more easily the stone speaks to them, and the more there are to lay.',
  ],
  kScale: ['Conductivité du lit à mi-course *', 'Bed conductivity at mid-swing *'],
  insulation: ['Isolant des parois *', 'Wall insulation *'],
  lambda: ['Son lambda *', 'Its lambda *'],
  insulationHint: [
    'Au-delà d’un demi-mètre, l’isolant ne tient plus dans le diamètre annoncé.',
    'Beyond half a metre, the insulation no longer fits inside the quoted diameter.',
  ],
  blowerPerMW: ['Taille des soufflantes *', 'Size of the blowers *'],
  blowerHint: [
    'Le réglage qui pèse le plus. Une soufflante plus grosse garde la pleine puissance plus longtemps, et consomme plus quand elle tourne à fond.',
    'The setting that weighs most. A bigger blower holds full power for longer, and uses more when it runs flat out.',
  ],
  secNetwork: ['Le réseau et le temps qu’il fait', 'The network and the weather'],
  supplyT: ['Départ du réseau', 'Network supply'],
  returnT: ['Retour du réseau *', 'Network return *'],
  season: ['Saison', 'Season'],
  seasonYear: ['Suit l’horloge', 'Follows the clock'],
  seasonWinter: ['Toujours l’hiver', 'Always winter'],
  seasonSummer: ['Toujours l’été', 'Always summer'],
  outsideShift: ['Écart d’air extérieur', 'Outside air shift'],
  demandOn: ['Réseau raccordé', 'Network connected'],
  networkHint: [
    'La demande est tirée de ce que dit le constructeur : une semaine d’hiver, presque un mois d’été pour la capacité annoncée. Sa forme sur la journée est dessinée.',
    'The demand is drawn from what the maker says: a week of winter, almost a month of summer for the quoted capacity. Its shape over the day is drawn.',
  ],
  secRule: ['Quand charger', 'When to charge'],
  strategy: ['La règle', 'The rule'],
  threshold: ['Prix maximal', 'Highest price'],
  priceWeek: ['La semaine de prix', 'The week of prices'],
  weekDrawn: ['Dessinée, avec du vent', 'Drawn, with wind'],
  weekWindless: ['Dessinée, sans vent', 'Drawn, no wind'],
  weekNegative: ['Dessinée, week-end négatif', 'Drawn, negative weekend'],
  chargeOrder: ['Ordre de charge', 'Order of charge'],
  orderCore: ['Le cœur d’abord', 'Core first'],
  orderEven: ['Partout à la fois', 'Everywhere at once'],
  ruleHint: [
    'La chaudière coûte environ 45 €/MWh dans ce modèle (estimation) : charger au-dessus de ce prix n’a d’intérêt que pour garder du stock.',
    'The boiler costs about 45 €/MWh in this model (estimate): charging above that price only makes sense to keep a stock.',
  ],
  secFaults: ['Ce qui peut lâcher', 'What can fail'],
  blowerFailed: ['La soufflante de charge lâche', 'The charging blower fails'],
  interlock: ['Pressostat en service', 'Pressure switch in service'],
  reserveCall: ['Appel de réserve du réseau électrique', 'Reserve call from the grid'],
  faultHint: [
    'Sans air, les résistances n’ont aucune issue pour leur chaleur. Passez le temps réel pour voir la chaîne se dérouler.',
    'Without air, the resistors have no way out for their heat. Go to real time to watch the chain unfold.',
  ],

  // ---- the game
  secGame: ['À vous de jouer : peignez vos heures', 'Your turn: paint your hours'],
  gameIntro: [
    'Une semaine d’hiver, plein à moitié, prix dessinés. Cliquez les tranches de trois heures où vous chargez, puis comparez avec l’adversaire. Le stock final compte : un silo vide en fin de semaine n’est pas une économie.',
    'A winter week, half full, drawn prices. Click the three-hour blocks in which you charge, then compare with the opponent. The final stock counts: an empty silo at the end of the week is no saving.',
  ],
  gameClear: ['Tout effacer', 'Clear all'],
  gameCheap: ['Prendre le plan de l’adversaire', 'Take the opponent’s plan'],
  gameUse: ['Faire tourner le silo avec mes heures', 'Run the silo on my hours'],
  gameYou: ['Votre semaine', 'Your week'],
  gameOpponent: ['L’adversaire', 'The opponent'],
  gameDelta: ['Écart', 'Difference'],
  gameBeat: ['Vous battez l’adversaire.', 'You beat the opponent.'],
  gameHint: [
    'L’adversaire connaît toute la semaine et planifie sur un modèle simplifié ; il n’est pas imbattable sur le modèle complet.',
    'The opponent knows the whole week and plans on a simplified model; it is not unbeatable on the full model.',
  ],
  gameBoiler: ['dont chaudière', 'boiler included'],
  gameStock: ['dont stock final', 'final stock included'],

  // ---- the charts
  chartTemps: ['Températures, trois dernières semaines', 'Temperatures, last three weeks'],
  chartPowers: ['Puissances, trois dernières semaines', 'Powers, last three weeks'],
  chartSection: ['La pierre en coupe, du centre à la paroi', 'The stone in section, from the centre to the wall'],
  chartSectionHint: [
    'Il n’y a pas de convection dans un lit de pierre : ces écarts tiennent à la lenteur de la conduction et à l’ordre de la charge.',
    'There is no convection in a bed of stone: these gaps come from slow conduction and from the order of the charge.',
  ],
  chartCapacity: ['Ce que rend un plein, selon la puissance', 'What a full charge gives, against the power'],
  chartCapacityHint: [
    'Une capacité sans puissance ne veut rien dire : c’est le même silo, à tous les points de la courbe. Résultat du modèle.',
    'A capacity without a power means nothing: it is the same silo at every point of the curve. Result of the model.',
  ],
  chartWeek: ['La semaine de prix', 'The week of prices'],
  chartWeekHint: [
    'Une semaine dessinée à la main, pas un relevé. Son écart de 3 à 373 €/MWh est celui qu’une source rapporte pour une vraie semaine.',
    'A week drawn by hand, not a record. Its span of 3 to 373 €/MWh is what a source reports for a real week.',
  ],
  chartC: ['Pourquoi pas une valeur fixe : c(T)', 'Why not a fixed value: c(T)'],
  chartCHint: [
    'Le sable mesuré passe d’environ 0,78 à 1,13 kJ/kg·K sur la course : une valeur fixe de 0,8 sous-estime l’énergie d’un cinquième. Pour la pierre ollaire, la variation n’est pas connue.',
    'Measured sand goes from about 0.78 to 1.13 kJ/kg·K over the swing: a fixed 0.8 understates the energy by a fifth. For soapstone, the change is not known.',
  ],
  chartYear: ['Une année de cette machine sous cette règle', 'A year of this machine under this rule'],
  chartYearT: ['Température moyenne', 'Mean temperature'],
  yearHeat: ['Chaleur livrée en un an', 'Heat delivered in a year'],
  yearBoiler: ['Chaudière en un an', 'Boiler in a year'],
  yearShare: ['Part de la pierre', 'Share of the stone'],
  yearEfficiency: ['Rendement sur l’année', 'Efficiency over the year'],
  yearWalls: ['Parois, part de l’électricité', 'Walls, share of the electricity'],
  yearCirc: ['Circulation et charge, part', 'Circulation and charge, share'],
  yearPaid: ['Prix moyen payé', 'Mean price paid'],
  yearDiscount: ['Sous la moyenne de la semaine', 'Under the mean of the week'],
  efficiencyHint: [
    'Personne n’a mesuré un vrai silo de façon indépendante. Le constructeur et ses clients annoncent de 60 à 75 % sur le petit silo, et pour celui-ci environ 80 %, plus de 85 %, de 85 à 90 %. Ce chiffre-ci sort du modèle, qui ne connaît ni les fuites ni les ponts thermiques réels : il est plutôt un plafond.',
    'Nobody has measured a real silo independently. The maker and its customers quote 60 to 75 % for the small silo, and for this one about 80 %, above 85 %, 85 to 90 %. This figure comes from the model, which knows neither the real leaks nor the real thermal bridges: it is rather a ceiling.',
  ],
  chartOrder: ['Le cœur d’abord, ou partout', 'Core first, or everywhere'],
  orderHours: ['Durée de la charge', 'Length of the charge'],
  orderLoss: ['Perdu pendant la charge', 'Lost during the charge'],
  orderWall: ['Pertes une fois plein', 'Losses once full'],
  orderEdge: ['Bord une fois plein', 'Edge once full'],
  chartScale: ['L’échelle : la même physique', 'The scale: the same physics'],
  scaleTwoDrums: ['Deux fûts', 'Two drums'],
  scaleKankaanpaa: ['8 MWh', '8 MWh'],
  scalePornainen: ['100 MWh', '100 MWh'],
  scaleVaaksy: ['250 MWh', '250 MWh'],
  scaleHalfLife: ['demi-vie', 'half-life'],
  scaleUsable: ['à plein', 'at full power'],
  scaleSurface: ['surface/volume', 'surface/volume'],
  scaleEfficiency: ['cycle', 'cycle'],
  scaleHint: [
    'Les chiffres annoncés sont 8, 100 et 250 MWh. Ceux-ci sortent du modèle, à la pleine puissance de chaque silo, avec la même règle de dimensionnement pour tous. Deux fûts de sable ne chauffent pas une maison un hiver : quelques heures, et c’est fini en un jour ou deux.',
    'The quoted figures are 8, 100 and 250 MWh. These come from the model, at the full power of each silo, with the same sizing rule for all. Two drums of sand do not heat a house for a winter: a few hours, and it is over in a day or two.',
  ],
  computing: ['Calcul…', 'Computing…'],

  // ---- series
  seriesMean: ['Moyenne', 'Mean'],
  seriesCore: ['Cœur', 'Core'],
  seriesEdge: ['Bord', 'Edge'],
  seriesHeater: ['Résistances', 'Resistors'],
  seriesHeat: ['Vers le réseau', 'To the network'],
  seriesBoiler: ['Chaudière', 'Boiler'],
  seriesWalls: ['Parois', 'Walls'],
  seriesTop: ['Haut', 'Top'],
  seriesMiddle: ['Milieu', 'Middle'],
  seriesBottom: ['Bas', 'Bottom'],
  seriesUsable: ['Rendu à cette puissance', 'Given at this power'],
  seriesPrice: ['Prix', 'Price'],
  seriesPlan: ['Charge prévue', 'Planned charge'],
  seriesSand: ['Sable mesuré', 'Measured sand'],
  seriesSoapstone: ['Pierre ollaire (fixe)', 'Soapstone (fixed)'],
  seriesFixed: ['La valeur fixe 0,8', 'The fixed 0.8'],
  seriesQuartz: ['Quartz pur', 'Pure quartz'],
  seriesDayHeat: ['Pierre', 'Stone'],
  markNow: ['maintenant', 'now'],
  markRated: ['pleine puissance', 'full power'],
  markMaker: ['annoncé', 'quoted'],
  markFloor: ['paroi', 'wall'],
  unitDays: ['j', 'd'],
  unitHours: ['h', 'h'],
  dayShort: ['Lun,Mar,Mer,Jeu,Ven,Sam,Dim', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
  monthShort: [
    'janv.,févr.,mars,avr.,mai,juin,juil.,août,sept.,oct.,nov.,déc.',
    'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec',
  ],

  // ---- the strip
  stripLevel: ['Charge', 'Charge'],
  stripMean: ['Moyenne', 'Mean'],
  stripIn: ['Entrée', 'In'],
  stripOut: ['Sortie', 'Out'],
  stripPrice: ['Prix', 'Price'],
} as const satisfies Record<string, Pair>;

const fromSim = (prefix: string, table: Record<string, Pair>): Record<string, Pair> =>
  Object.fromEntries(Object.entries(table).map(([k, v]) => [`${prefix}:${k}`, v]));

const SIM_TEXTS: Record<string, Pair> = {
  ...fromSim('alarm', Object.fromEntries(Object.entries(ALARM_TEXTS).map(([k, v]) => [k, v.text]))),
  ...fromSim('preset', PRESET_TEXTS),
  ...fromSim('scenario', Object.fromEntries(Object.entries(SCENARIO_TEXTS).map(([k, v]) => [k, v.name]))),
  ...fromSim('lesson', Object.fromEntries(Object.entries(SCENARIO_TEXTS).map(([k, v]) => [k, v.lesson]))),
  ...fromSim('medium', MEDIUM_TEXTS),
  ...fromSim('strategy', STRATEGY_TEXTS),
};

/** Every word of the panel, for the parity test. */
export const PANEL_STRINGS: Record<string, Pair> = { ...PANEL, ...SIM_TEXTS };

registerStrings(PANEL_STRINGS);

export type PanelKey = keyof typeof PANEL;

/** A word of the panel in the language of the moment. */
export const st = (key: PanelKey): string => tx(key);

/** A word that comes from the simulation: `sx('alarm', 'noFlow')`. */
export const sx = (table: 'alarm' | 'preset' | 'scenario' | 'lesson' | 'medium' | 'strategy', id: string): string =>
  tx(`${table}:${id}`);

/** A number with the decimal mark of the language; no "-0". */
export function num(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '—';
  const v = Math.round(Math.abs(value) * 10 ** digits) === 0 ? 0 : value;
  return v.toLocaleString(getLang() === 'fr' ? 'fr-FR' : 'en-GB', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export const months = (): string[] => st('monthShort').split(',');
export const dayNames = (): string[] => st('dayShort').split(',');
