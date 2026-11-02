// Assembly guide: HOW A CREW BUILDS IT, 20 steps (docs/research.md §0.5, §4.5). The visitor will never build this plant, so the frame's « Assembly » mode tells the construction
// sequence and says what each step is FOR and what is checked. The honesty of the guide:
//   - said once, in the first step: this is the lab's reading of how such a plant goes up, not a plan to copy;
//   - every step ends with its origin, « Origine : rapporté / pratique courante / notre lecture » (`step` in part-helpers.ts; data.test.ts checks it);
//   - only a few facts of the order are reported (the foundations before the silo at the 250 MWh site; the filling ended in October 2024 with 40 truckloads, then tests in
//     winter, commissioning in June 2025). The rest of the sequence is ours;
//   - no recipe figure: no weld, torque, cure time, steel grade, pipe count or per-step duration. `torque` and `duration` stay empty (`duration` is a plain string in the kit,
//     so even the reported totals live in the text, in both languages: docs/kit-requests.md). `tools` lists the trades and machines of the step.
//   - every id of `silo`, `pipe-cell` and `plant-room` is installed in exactly one step, and nothing floats: the pipes get their spacer before the stone, the stone its shell.
// Warnings are said once, where the gesture is risky: confined space (4), dust (12), height (16), rotating blowers and the air safety (18), hot water under pressure (19), the current (20).
import type { GuideStep } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, step } from './part-helpers';

export const ASSEMBLY: GuideStep[] = [
  {
    id: 'plot',
    scene: 'site',
    title: l('Un terrain, une étude de sol', 'A plot, a soil survey'),
    text: step(
      'reported',
      'Ce guide raconte comment une équipe construit une telle installation : c’est notre lecture, pas un plan à copier, et personne ne fait ceci chez soi. Le vrai chantier a pris environ un an, avec environ 40 sous-traitants et plus de 100 ouvriers. Imaginez la cour vide : on étudie le sol, le drainage, l’accès des camions et de la grue. Rien n’est posé.',
      'This guide tells how a crew builds such a plant: it is our reading, not a plan to copy, and nobody does this at home. The real site took about a year, with some 40 subcontractors and over 100 workers. Picture the yard empty: the soil is surveyed, then the drainage, the access for the trucks and the crane. Nothing is placed yet.',
      [
        'pour les totaux ; l’ordre du chantier est notre lecture',
        'for the totals; the order of the work is our reading',
      ],
    ),
    parts: [],
    tools: [l('Géotechnicien', 'Soil engineer'), l('Géomètre', 'Surveyor')],
    tip: l(
      'Cherchez d’abord un réseau de chaleur à côté : sans lui, même le meilleur sol ne sert à rien.',
      'First look for a heating network next door: without it, even the best soil is no use.',
    ),
  },
  {
    id: 'slab',
    scene: 'silo',
    title: l('Couler le radier', 'Pour the slab'),
    text: step(
      'reported',
      'Tout commence par le **radier**, qui devra porter environ 2 000 t de pierre sans tasser d’un côté plus que de l’autre. Sa forme et son épaisseur viennent de l’étude de sol, et aucune cote n’est publiée. On y scelle des repères de niveau, relevés ensuite à chaque étape du remplissage. On contrôle : niveau, drainage, et une sonde de température posée sous la dalle, avant qu’il ne soit trop tard.',
      'It all starts with the **slab**, which will have to carry about 2,000 t of stone without settling more on one side than the other. Its shape and thickness come from the soil survey, and no dimension is published. Level marks are set in it, then read at each stage of filling. To check: level, drainage, and a temperature probe laid under the slab, before it is too late.',
      ['pour l’ordre, sur le silo de 250 MWh', 'for the order, at the 250 MWh silo'],
    ),
    parts: ['foundation-slab'],
    tools: [l('Pompe à béton', 'Concrete pump'), l('Ferrailleurs', 'Steel fixers'), l('Géomètre', 'Surveyor')],
  },
  {
    id: 'base',
    scene: 'silo',
    title: l('Isoler sous le lit', 'Insulate under the bed'),
    text: step(
      'practice',
      'L’**isolation sous le lit** se pose à sec, de niveau, et protégée de la pluie jusqu’à la fermeture de la virole. Elle devra isoler et porter tout le poids : elle ne sera plus jamais accessible, et son entretien se fait donc aujourd’hui. On contrôle : l’humidité du matériau à la livraison, l’épaisseur partout, et l’absence de point bas où l’eau resterait.',
      'The **base insulation** is laid dry, level, and kept out of the rain until the shell is closed. It will have to insulate and carry the whole weight: it will never be reached again, so its maintenance happens today. To check: the moisture of the material on delivery, the thickness everywhere, and no low spot where water could stay.',
    ),
    parts: ['base-insulation'],
    tools: [l('Grue', 'Crane'), l('Équipe d’isolation', 'Insulation crew')],
  },
  {
    id: 'shell',
    scene: 'silo',
    title: l('Monter la virole', 'Raise the shell'),
    text: step(
      'practice',
      'Les viroles d’acier montent l’une sur l’autre et sont soudées sur place. La **virole intérieure** devra contenir la pierre et sa poussée, tout en grandissant quand elle chauffe. On contrôle : la rondeur, l’aplomb, chaque soudure. Tant qu’elle est vide, l’intérieur reste un chantier ordinaire, et c’est le moment d’y travailler.',
      'The steel courses rise one on another and are welded on site. The **inner shell** will have to hold the stone and its thrust, while growing as it warms. To check: roundness, plumb, every weld. As long as it is empty the inside remains an ordinary worksite, and that is the time to work in it.',
    ),
    parts: ['inner-shell'],
    tools: [l('Grue', 'Crane'), l('Soudeurs', 'Welders'), l('Contrôle des soudures', 'Weld inspection')],
    warning: l(
      'Espace confiné : une virole fermée, c’est peu d’air, et une seule sortie. Permis d’entrer, ventilation et surveillance extérieure, comme dans tout réservoir.',
      'Confined space: a closed shell means little air and one way out. Entry permit, ventilation and a watch outside, as in any tank.',
    ),
  },
  {
    id: 'pipes',
    scene: 'pipe-cell',
    title: l('Descendre les tubes en U', 'Lower the U-pipes'),
    text: step(
      'reading',
      'Chaque **tube d’échange** descend dans la virole et le **coude de retour** referme le U au fond, posé sur une cale que la pierre enterrera. C’est la seule soudure qu’aucun visiteur ne reverra jamais : on la contrôle ici, ou jamais. Le U nous vient d’un exercice de physique : le tracé réel est gardé secret, et le constructeur indique seulement des tubes verticaux d’inox. On contrôle : soudures, propreté intérieure, aplomb.',
      'Each **heat-transfer pipe** goes down into the shell and the **return bend** closes the U at the bottom, resting on a block that the stone will bury. It is the one weld no visitor will ever see again: it gets checked here, or never. The U comes to us from a physics exercise: the real layout is kept secret, and the maker indicates only vertical stainless pipes. To check: welds, cleanliness inside, plumb.',
    ),
    parts: ['heat-pipe', 'return-bend'],
    tools: [
      l('Soudeurs inox', 'Stainless welders'),
      l('Palan', 'Hoist'),
      l('Contrôle des soudures', 'Weld inspection'),
    ],
  },
  {
    id: 'spacers',
    scene: 'pipe-cell',
    title: l('Tenir le pas : les entretoises', 'Holding the pitch: the spacers'),
    text: step(
      'reading',
      'Les tubes ne doivent pas bouger quand la pierre tombera : les **entretoises**, des cadres de barres et de colliers, tiennent le pas de {pitch} m (estimation). Le collier guide sans serrer, car le tube devra y glisser pour s’allonger. Le constructeur ne dit pas comment il fait : ces cadres, c’est ce qu’il faut pour que le champ dessiné tienne debout. On contrôle : le pas, partout, avant le premier camion.',
      'The pipes must not move when the stone falls: the **spacers**, frames of bars and collars, hold the {pitch} m pitch (estimate). The collar guides without gripping, because the pipe will have to slide in it as it grows. The maker does not say how it does this: these frames are what the field as drawn needs to stand up. To check: the pitch, everywhere, before the first truck.',
    ),
    parts: ['pipe-spacer'],
    tools: [l('Monteurs', 'Fitters'), l('Géomètre', 'Surveyor')],
  },
  {
    id: 'headers',
    scene: 'pipe-cell',
    title: l('Lyres et collecteurs', 'Loops and headers'),
    text: step(
      'reading',
      'Sur chaque tête de tube, une **lyre de dilatation** absorbe les {growCm} cm d’allongement (dérivé) ; puis les têtes se regroupent sur un **collecteur de branche**. Tout est dessiné pour que chaque chemin d’air ait la même résistance : l’air choisit toujours le plus facile. On contrôle : l’équilibre des longueurs, et que rien ne bride la lyre.',
      'On each pipe head an **expansion loop** takes up the {growCm} cm of growth (derived); then the heads gather onto a **branch header**. It is all laid out so that each air path has the same resistance: air always takes the easiest. To check: that the lengths balance, and that nothing restrains the loop.',
    ),
    parts: ['expansion-loop', 'branch-header'],
    tools: [l('Soudeurs inox', 'Stainless welders'), l('Tuyauteurs', 'Pipefitters')],
  },
  {
    id: 'proof',
    scene: 'silo',
    title: l('Éprouver le champ de tubes', 'Prove the pipe field'),
    text: step(
      'reading',
      'Le **champ de tubes** est complet : {legs} branches (résultat du modèle) dans le dessin de ce labo, un nombre que personne ne publie. Voici la dernière occasion de le réparer. On contrôle : chaque chemin, mis en pression et comparé à ses voisins. Ce test en dit plus sur l’avenir du silo que tout ce qui suivra : « sans entretien » n’a de sens que si le champ a été éprouvé ici.',
      'The **pipe field** is complete: {legs} legs (model result) in this lab’s drawing, a number nobody publishes. Here is the last chance to repair it. To check: each path, pressurised and compared with its neighbours. This test says more about the silo’s future than anything that follows: “maintenance-free” only means something if the field has been proved here.',
    ),
    parts: ['pipe-field'],
    tools: [l('Épreuve en pression', 'Pressure test'), l('Ingénieur de mise en service', 'Commissioning engineer')],
  },
  {
    id: 'lances',
    scene: 'silo',
    title: l('Placer les cannes de température', 'Place the temperature lances'),
    text: step(
      'practice',
      'Avant la pierre, on plante les **cannes de température**, dans des doigts de gant soudés : une sonde se remplacera par le haut, sans vider le silo. Ce sont les seuls yeux dans le lit pour les trente ans à venir. Leur nombre et leur place ne sont pas publiés, et le labo en dessine une poignée. On contrôle : chaque voie, jusqu’à l’armoire.',
      'Before the stone, the **temperature lances** go in, in welded thermowells: a probe can later be replaced from above without emptying the silo. They are the only eyes in the bed for the next thirty years. Their number and place are not published, and the lab draws a handful. To check: every channel, right through to the cabinet.',
    ),
    parts: ['thermocouple-lance'],
    tools: [l('Instrumentiste', 'Instrument technician')],
  },
  {
    id: 'zones',
    scene: 'pipe-cell',
    title: l('Donner aux tubes leur ordre', 'Give the pipes their order'),
    text: step(
      'reported',
      'La tuyauterie décide de l’ordre de la chaleur : la **zone de cœur** chargera d’abord, la **zone périphérique** déchargera d’abord. Personne ne dresse de cloison : ces zones naissent de la façon dont les collecteurs se raccordent. Le labo prend {zoneCore} % du rayon pour le cœur, {zoneMiddle} % pour le milieu (estimation). On contrôle : chaque rangée sur le bon collecteur, avant que tout ne disparaisse.',
      'The piping decides the order of the heat: the **core zone** will charge first, the **outer zone** will discharge first. No partition is raised: these zones arise from how the headers connect. The lab takes {zoneCore}% of the radius for the core, {zoneMiddle}% for the middle (estimate). To check: each row on the right header, before it all disappears.',
      ['pour le principe ; les rayons sont notre lecture', 'for the principle; the radii are our reading'],
    ),
    parts: ['core-zone', 'outer-zone'],
    tools: [l('Tuyauteurs', 'Pipefitters'), l('Ingénieur procédé', 'Process engineer')],
  },
  {
    id: 'stone-test',
    scene: 'pipe-cell',
    title: l('Choisir la pierre au laboratoire', 'Choose the stone in the laboratory'),
    text: step(
      'reported',
      'Le **sable de quartz** et la **pierre ollaire concassée** ne se valent pas : selon le constructeur, ses matériaux passent par le laboratoire avant d’être retenus. On mesure ici ce qui pèsera : conduction, masse volumique en vrac, tenue aux cycles. Pour le plus grand silo en service, ce fut la pierre, sous-produit d’une usine de poêles. Ni ce sable ni cette pierre ne sont encore installés dans le lit : ce sont les échantillons.',
      'The **quartz sand** and the **crushed soapstone** are not equal: the maker says its materials go through the laboratory before being chosen. What gets measured is what will weigh: conduction, bulk density, resistance to cycling. For the largest silo in service the choice was stone, a by-product of a stove factory. Neither sand nor stone is in the bed yet: these are the samples.',
    ),
    parts: ['quartz-sand', 'crushed-soapstone'],
    tools: [l('Laboratoire de matériaux', 'Materials laboratory')],
  },
  {
    id: 'filling',
    scene: 'silo',
    title: l('Verser le lit de pierre', 'Pour the storage bed'),
    text: step(
      'reported',
      'Le **lit de pierre** arrive : environ 40 camions, soit {perTruck} t chacun (dérivé), pour environ 2 000 t, versées autour des tubes et terminées fin octobre 2024. Cette batterie de sable ne contient pas de sable : c’est de la pierre, et elle doit être sèche. On verse sans frapper les tubes ni trier les grains, et l’on contrôle : le niveau, les repères du radier, les tubes encore visibles.',
      'The **storage bed** arrives: about 40 trucks, {perTruck} t each (derived), for about 2,000 t, poured around the pipes and finished at the end of October 2024. This sand battery holds no sand: it is stone, and it must be dry. It is poured without hitting the pipes or sorting the grains, and these are checked: the level, the slab’s marks, the pipes still in sight.',
    ),
    parts: ['storage-bed'],
    tools: [l('Camions-bennes', 'Tipper trucks'), l('Convoyeur', 'Conveyor'), l('Géomètre', 'Surveyor')],
    warning: l(
      'Poussière : le sable fin et la pierre concassée en dégagent, et la silice cristalline respirable abîme les poumons sans bruit. Remplissage capoté, aspiration et masques adaptés.',
      'Dust: fine sand and crushed stone give it off, and respirable crystalline silica silently damages the lungs. Covered filling, extraction and suitable masks.',
    ),
  },
  {
    id: 'top',
    scene: 'silo',
    title: l('Couvrir la pierre', 'Cover the stone'),
    text: step(
      'practice',
      'Par-dessus la pierre, l’**isolation du dessus**, environ {topInsulation} m (estimation), posée sur elle pour la suivre si elle tasse. Chaque tube la traverse par une **traversée de l’isolation**, avec un fourreau et un garnissage qui le laissent glisser. Chaque traversée est un pont thermique : c’est ici qu’on gagne ou qu’on perd l’isolation du haut. On contrôle : aucun vide, aucun tube bridé.',
      'On top of the stone goes the **top insulation**, about {topInsulation} m (estimate), resting on it so as to follow it if it settles. Each pipe crosses it through an **insulation penetration**, with a sleeve and packing that let it slide. Every crossing is a thermal bridge: this is where the insulation at the top is won or lost. To check: no gap, no pipe restrained.',
    ),
    parts: ['top-insulation', 'duct-penetration'],
    tools: [l('Équipe d’isolation', 'Insulation crew'), l('Grue', 'Crane')],
  },
  {
    id: 'walls',
    scene: 'silo',
    title: l('Isoler et barder la paroi', 'Insulate and clad the wall'),
    text: step(
      'practice',
      'Autour de la virole, l’**isolation des parois** remplit les {wallInsulation} m (estimation) qui restent ; puis le **bardage extérieur** referme le tout et rejette la pluie. Le constructeur rapporte ces trois couches : acier, isolant, acier. On contrôle : isolant sec et tassé, solin de pied, jonctions. Ici encore, l’eau prise maintenant coûtera cher à chaque hiver.',
      'Around the shell the **wall insulation** fills the {wallInsulation} m (estimate) left there; then the **outer cladding** closes it all and throws off the rain. The maker reports these three layers: steel, insulation, steel. To check: dry and well-packed insulation, the flashing at the foot, the joints. Here again, water taken in now will cost dearly every winter.',
    ),
    parts: ['wall-insulation', 'outer-cladding'],
    tools: [l('Équipe d’isolation', 'Insulation crew'), l('Bardeurs', 'Cladding crew'), l('Nacelle', 'Cherry picker')],
  },
  {
    id: 'deck',
    scene: 'silo',
    title: l('Poser l’étage technique', 'Lay the equipment floor'),
    text: step(
      'reading',
      'L’**étage technique** : un plancher d’environ {deckAcross} m de large, posé sur la paroi au-dessus de l’isolant (estimation), avec {floorStack} m de hauteur libre. Que l’équipement se tienne là est notre lecture d’un film et d’une photo ; le silo de 250 MWh a, lui, un bâtiment séparé. Ici, le plancher raccourcit les gaines chaudes. On contrôle : la charge admissible, et les passages de gaines.',
      'The **equipment floor**: a deck about {deckAcross} m across, set on the wall above the insulation (estimate), with {floorStack} m of clear height. That the equipment stands here is our reading of a film and a photo; the 250 MWh silo has a separate building. Here the deck shortens the hot ducts. To check: the permitted load, and the openings for the ducts.',
    ),
    parts: ['equipment-floor'],
    tools: [l('Charpentiers métalliques', 'Steel erectors'), l('Grue', 'Crane')],
  },
  {
    id: 'roof',
    scene: 'silo',
    title: l('Toit, ouverture et échelle', 'Roof, opening and ladder'),
    text: step(
      'reading',
      'Le **toit conique** arrive en secteurs, avec son moyeu ; l’**ouverture haute** ventile l’étage ; l’**échelle à crinoline** en donne l’accès. Toutes trois se voient sur les photos, et leur fonction reste notre lecture. On contrôle : les joints du moyeu, la tenue à la neige. Les gros appareils montent souvent avant que le toit ne se ferme : ce guide les montre après, pour les regarder un à un.',
      'The **conical roof** arrives in sectors, with its hub; the **upper opening** ventilates the floor; the **caged ladder** gives access to it. All three are seen on the photographs, and their function remains our reading. To check: the hub’s seals, the snow load. Large equipment often goes up before the roof closes: this guide shows it afterwards, so as to look at each piece.',
    ),
    parts: ['conical-roof', 'upper-vent', 'access-ladder'],
    tools: [l('Grue', 'Crane'), l('Couvreurs', 'Roofers'), l('Harnais antichute', 'Fall-arrest harness')],
    warning: l(
      'Travail en hauteur : à 13 m, sur une tôle lisse, l’accident vient d’un seul pas. Harnais et lignes de vie, jamais par grand vent ni sur le givre. Sur l’échelle, les deux mains servent à l’échelle.',
      'Work at height: at 13 m, on smooth sheet, one step is enough for an accident. Harnesses and lifelines, never in strong wind or on frost. On the ladder, both hands are for the ladder.',
    ),
  },
  {
    id: 'ducts',
    scene: 'plant-room',
    title: l('Gaines et registres', 'Ducts and dampers'),
    text: step(
      'reading',
      'Les boucles se referment : **gaine d’air chaud** et **gaine d’air froid**, courtes et bien isolées à la demande du constructeur, puis le **registre de charge** et le **registre de décharge** de chaque zone. La disposition dessinée est la nôtre, lue dans l’ordre où passe l’air. On contrôle : étanchéité, course complète de chaque registre, supports et soufflets libres de se dilater.',
      'The loops close: **hot-air duct** and **cool-air duct**, short and well insulated as the maker asks, then the **charge damper** and the **discharge damper** of each zone. The layout drawn is ours, read in the order the air passes. To check: tightness, the full stroke of each damper, supports and bellows free to expand.',
    ),
    parts: ['hot-air-duct', 'cold-air-duct', 'charge-damper', 'discharge-damper'],
    tools: [l('Chaudronniers', 'Boilermakers'), l('Calorifugeurs', 'Laggers')],
  },
  {
    id: 'heat-air',
    scene: 'plant-room',
    title: l('Résistances et soufflantes', 'Resistors and blowers'),
    text: step(
      'practice',
      'La **batterie de résistances** se monte sur la boucle de charge, puis la **soufflante de charge**, en amont, là où l’air est le moins chaud, et la **soufflante de décharge** sur l’autre boucle ; chacune a son **variateur**. Deux boucles restent une hypothèse du labo, comme leur taille, {blowerRate} m³/s par MW (estimation). On contrôle : l’alignement, le sens de rotation, et le débit qui coupe les résistances.',
      'The **resistor bank** goes on the charge loop, then the **charge blower** upstream of it, where the air is least hot, and the **discharge blower** on the other loop; each has its **blower drive**. Two loops remain an assumption of the lab, as does their size, {blowerRate} m³/s per MW (estimate). To check: alignment, direction of rotation, and the flow that cuts the resistors.',
    ),
    parts: ['resistor-bank', 'charge-blower', 'discharge-blower', 'blower-drive'],
    tools: [l('Monteurs', 'Fitters'), l('Électricien', 'Electrician'), l('Palan', 'Hoist')],
    warning: l(
      'Une roue happe et ne se voit plus quand elle tourne : consignation avant d’approcher, carters en place. Sans air, les résistances brûlent : leur sécurité de débit se prouve par un essai, pas par un plan.',
      'An impeller snatches, and cannot be seen once turning: lock out before going near, guards in place. Without air the resistors burn: their flow safety is proven by a test, not a drawing.',
    ),
  },
  {
    id: 'water',
    scene: 'plant-room',
    title: l('Le côté de l’eau', 'The water side'),
    text: step(
      'practice',
      'L’**échangeur air-eau** est la grande pièce : on le monte, on le raccorde. Puis la **pompe du réseau**, le **compteur de chaleur** qui dira ce qui est vendu, et le **vase d’expansion**, car l’eau chaude grandit elle aussi. On contrôle : l’étanchéité à l’épreuve, le sens de circulation à contre-courant, les sondes appairées du compteur. Tout cela est générique : aucune taille n’est publiée.',
      'The **air-to-water exchanger** is the big piece: it goes in and gets connected. Then the **network pump**, the **heat meter** that will say what is sold, and the **expansion vessel**, because hot water grows too. To check: tightness under test, the counterflow direction, the meter’s matched probes. All of this is generic: no size is published.',
    ),
    parts: ['air-water-exchanger', 'dh-pump', 'heat-meter', 'expansion-vessel'],
    tools: [l('Tuyauteurs', 'Pipefitters'), l('Épreuve en pression', 'Pressure test'), l('Palan', 'Hoist')],
    warning: l(
      'L’eau du réseau est chaude et sous pression : un joint qui lâche brûle à distance. Circuit isolé, vidangé et refroidi avant toute intervention.',
      'Network water is hot and under pressure: a joint that gives way scalds at a distance. Circuit isolated, drained and cooled before any work.',
    ),
  },
  {
    id: 'electrics',
    scene: 'plant-room',
    title: l('Le tableau et l’automatisme', 'The board and the controls'),
    text: lf(
      `Le **tableau basse tension** reçoit {amps} A à 1 MW (dérivé), le **gradateur de résistances** les répartit, et l’**armoire d’automatisme** lit les prix et les sondes. Dans ce labo, la machine est désormais complète : elle n’a jamais vu ni courant ni chaleur. On contrôle : isolement, sécurités, logique des registres, mais à froid. La chauffe appartient au guide d’installation. Origine : pratique courante.`,
      `The **low-voltage switchboard** takes {amps} A at 1 MW (derived), the **heater controller** shares them out, and the **control cabinet** reads the prices and the probes. In this lab the machine is now complete: it has seen neither current nor heat. To check: insulation, safeties, damper logic, but cold. The heating belongs to the installation guide. Origin: usual practice.`,
    ),
    parts: ['lv-switchboard', 'heater-controller', 'control-cabinet'],
    tools: [l('Électricien habilité', 'Authorised electrician'), l('Automaticien', 'Controls engineer')],
    warning: lf(
      'Électricité : {amps} A (dérivé) à {volts} V (hypothèse), de la moyenne tension au transformateur. Un arc sur un jeu de barres tue sans contact : personnel habilité seulement, consignation vérifiée.',
      'Electricity: {amps} A (derived) at {volts} V (assumption), medium voltage at the transformer. An arc on a busbar kills without contact: authorised staff only, lock-out verified.',
    ),
  },
];
