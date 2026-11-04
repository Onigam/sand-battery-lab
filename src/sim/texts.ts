import type { Strategy } from './operate';
import type { MediumId } from './silo';
import type { AlarmKey, PresetId, ScenarioId } from './types';

// The words the simulation owns, French and English written together. Plain data: the panel registers them with the kit.

export type Pair = readonly [string, string];

export const ALARM_TEXTS: Record<AlarmKey, { text: Pair; severe: boolean }> = {
  noFlow: { text: ['Plus d’air sur les résistances', 'No air over the resistors'], severe: true },
  elementHot: { text: ['Résistances au-delà de leur limite', 'Resistors over their limit'], severe: true },
  airHot: { text: ['Air au-delà de sa limite', 'Air over its limit'], severe: true },
  coreHot: { text: ['Cœur au-delà de sa limite', 'Core over its limit'], severe: true },
  wallHot: { text: ['Virole trop chaude', 'Inner shell too hot'], severe: true },
  surfaceWarm: { text: ['Bardage chaud au toucher', 'Cladding warm to the touch'], severe: false },
  lowCharge: { text: ['Stock bas, chaudière appelée', 'Stock low, boiler called'], severe: false },
  returnWarm: { text: ['Retour du réseau trop chaud', 'Network return too warm'], severe: false },
  quartzInversion: { text: ['Sable au-delà de 573 °C', 'Sand above 573 °C'], severe: false },
};

export const PRESET_TEXTS: Record<PresetId, Pair> = {
  'pornainen-soapstone': ['100 MWh, pierre ollaire (le lab)', '100 MWh, soapstone (the lab)'],
  'same-silo-sand': ['Le même silo rempli de sable', 'The same silo, filled with sand'],
  kankaanpaa: ['8 MWh, le premier silo', '8 MWh, the first silo'],
  vaaksy: ['250 MWh, le silo de 2027', '250 MWh, the 2027 silo'],
  'two-drums': ['Deux fûts de sable', 'Two drums of sand'],
};

export const SCENARIO_TEXTS: Record<ScenarioId, { name: Pair; lesson: Pair }> = {
  'cold-start': {
    name: ['Première chauffe', 'First heating'],
    lesson: [
      'La pierre part de la température de la cour. L’air monte lentement, pour laisser partir l’humidité : la vitesse réelle n’est pas publiée, la rampe est dessinée. Regardez le cœur prendre de l’avance sur le bord.',
      'The stone starts at the temperature of the yard. The air climbs slowly, to let the moisture out: the real rate is not published, the ramp is drawn. Watch the core pull ahead of the edge.',
    ],
  },
  'winter-week': {
    name: ['Une semaine d’hiver', 'A winter week'],
    lesson: [
      'Plein au départ, aucune charge, la demande du jour le plus froid. Le silo tient plusieurs jours : à puissance modérée, il donne plus que sa capacité à pleine puissance.',
      'Full at the start, no charge, the demand of the coldest day. The silo holds for days: at moderate power it gives more than its capacity at full power.',
    ],
  },
  'summer-month': {
    name: ['Un mois d’été', 'A summer month'],
    lesson: [
      'La même pierre et une petite demande : la chaleur dure des semaines, et les parois en perdent une part visible, car le temps travaille contre le stock.',
      'The same stone and a small demand: the heat lasts for weeks, and the walls take a visible share of it, because time works against the stock.',
    ],
  },
  'windless-days': {
    name: ['Dix jours sans vent', 'Ten windless days'],
    lesson: [
      'Plus aucune heure bon marché : la règle reste hors du marché, le stock s’en va, la chaudière revient. C’est pour cela qu’on la garde.',
      'No cheap hour any more: the rule stays out of the market, the stock goes, the boiler comes back. That is why it is kept.',
    ],
  },
  'negative-weekend': {
    name: ['Week-end à prix négatifs', 'A negative-price weekend'],
    lesson: [
      'Le courant est payé pour être pris, et le silo en prend tant qu’il peut. Mais quand la pierre chauffe, l’air revient chaud et la puissance acceptée baisse : ce n’est pas le prix qui limite, c’est la boucle d’air.',
      'You are paid to take the current, and the silo takes all it can. But as the stone warms, the air comes back hot and the power it accepts falls: the price is not the limit, the air loop is.',
    ],
  },
  'idle-three-months': {
    name: ['Trois mois au repos', 'Three months idle'],
    lesson: [
      'Plein, rien n’entre, rien ne sort. La chaleur totale baisse lentement, la chaleur encore utile à pleine puissance baisse bien plus vite : tout dépend de laquelle on parle.',
      'Full, nothing in, nothing out. The total heat falls slowly, the heat still usable at full power falls much faster: it all depends on which one you mean.',
    ],
  },
  'core-first': {
    name: ['Le cœur d’abord, ou partout', 'Core first, or everywhere'],
    lesson: [
      'La même chaleur, cette fois répartie partout dès le début. La comparaison du panneau montre ce que change l’ordre : le bord est plus chaud, les parois perdent plus.',
      'The same heat, spread everywhere from the start this time. The panel’s comparison shows what the order changes: the edge is hotter, the walls lose more.',
    ],
  },
  'half-insulation': {
    name: ['Moitié moins d’isolant', 'Half the insulation'],
    lesson: [
      'L’isolant le plus cher est celui qu’on enlève : deux fois moins épais, deux fois plus de pertes, et le bardage n’est plus aussi frais.',
      'The most expensive insulation is the one you remove: half as thick, twice the losses, and the cladding is no longer as cool.',
    ],
  },
  scale: {
    name: ['L’échelle', 'The scale'],
    lesson: [
      'Quatre tailles laissées seules, l’une après l’autre, à la même horloge. Le deux-fûts est froid en quelques jours, le grand silo a à peine bougé : la surface croît moins vite que le volume.',
      'Four sizes left alone, one after the other, on the same clock. The two drums are cold in days, the big silo has barely moved: surface grows more slowly than volume.',
    ],
  },
  'soapstone-vs-sand': {
    name: ['Pierre ollaire ou sable', 'Soapstone or sand'],
    lesson: [
      'Au même silo, le sable pèse un tiers de moins : le stock chute à température égale. Avec un air très chaud, il franchit aussi une ligne : à 573 °C, le quartz change de forme.',
      'In the same silo, sand weighs a third less: the stock falls at the same temperature. With very hot air it also crosses a line: at 573 °C, quartz changes form.',
    ],
  },
  'blower-failure': {
    name: ['La soufflante lâche', 'The blower fails'],
    lesson: [
      'En temps réel. La soufflante s’arrête, le débit chute, le pressostat coupe les résistances avant qu’elles ne brûlent, puis elles refroidissent. Sans air, elles n’ont aucune autre issue.',
      'In real time. The blower stops, the flow falls, the pressure switch cuts the resistors before they burn, then they cool. Without air they have no other way out.',
    ],
  },
  'reserve-call': {
    name: ['Le réseau électrique appelle', 'The grid calls'],
    lesson: [
      'En temps réel. Le réseau demande moins de charge : les résistances s’effacent aussitôt, et le village ne voit rien, car la chaleur vient de la pierre.',
      'In real time. The grid asks for less load: the resistors drop out at once, and the village sees nothing, because the heat comes from the stone.',
    ],
  },
};

export const MEDIUM_TEXTS: Record<MediumId, Pair> = {
  soapstone: ['Pierre ollaire concassée', 'Crushed soapstone'],
  sand: ['Sable de quartz', 'Quartz sand'],
};

export const STRATEGY_TEXTS: Record<Strategy, Pair> = {
  always: ['Dès qu’il y a de la place', 'Whenever there is room'],
  threshold: ['Sous un prix', 'Under a price'],
  optimal: ['L’optimiseur (il connaît la semaine)', 'The optimiser (it knows the week)'],
  painted: ['Mes heures peintes', 'My painted hours'],
  solar: ['Le surplus solaire seul', 'The solar overflow only'],
  off: ['Ne jamais charger', 'Never charge'],
};
