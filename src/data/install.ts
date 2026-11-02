// Installation guide: HOW IT JOINS THE TOWN, 10 steps (docs/research.md §0.5, §4.5). From « does this site qualify » through the grid, the network, the slow first heating and the
// winter of tests, to the price algorithm. Same honesty as the assembly guide: said once in the first step, every step ending with its origin, no recipe figure, and no duration
// (the kit's `duration` is a plain string, not bilingual; the reported dates live in the text). Every id of `site` is installed in exactly one step; the five last steps install nothing.
// Warnings are said once, where the risk is: medium voltage (3), an open trench (5), water and hot stone (7), a hot bed that does not show (8).
import type { GuideStep } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { step } from './part-helpers';

export const INSTALL: GuideStep[] = [
  {
    id: 'qualify',
    scene: 'site',
    title: l('Ce site convient-il ?', 'Does this site qualify?'),
    text: step(
      'reported',
      'Ce guide raconte comment l’installation rejoint la ville : c’est notre lecture, pas une procédure. Tout part de ce qui existe déjà : la **chaufferie à plaquettes** et sa **cheminée**, l’**école du village**, chaque **sous-station de maison**. Le constructeur donne ses critères pour son produit de 2 MW : au moins 6 GWh de chaleur par an, une demande vers 90 à 250 °C, de l’électricité bon marché, une parcelle d’environ 20 × 30 m.',
      'This guide tells how the plant joins the town: it is our reading, not a procedure. It all starts from what is already there: the **wood-chip boiler plant** and its **stack**, the **village school**, each **house substation**. The maker gives its criteria for its 2 MW product: at least 6 GWh of heat a year, demand around 90 to 250 °C, low-cost electricity, a plot of about 20 × 30 m.',
      ['pour les critères ; le reste est notre lecture', 'for the criteria; the rest is our reading'],
    ),
    parts: ['chip-boiler-plant', 'boiler-stack', 'village-school', 'house-substation'],
    tools: [l('Bureau d’études', 'Design office'), l('Étude de faisabilité', 'Feasibility study')],
    tip: l(
      'Rien de tout cela n’a bougé pour le silo : il vient s’adosser au réseau, il ne le remplace pas.',
      'None of this moved for the silo: it comes to lean against the network, it does not replace it.',
    ),
  },
  {
    id: 'plant-in-yard',
    scene: 'site',
    title: l('Le silo dans sa cour', 'The silo in its yard'),
    text: step(
      'reading',
      'Le **silo** se dresse, construit selon l’autre guide. Sur sa paroi, deux éléments comptent pour la ville : les **colonnes du réseau** descendent l’eau chaude de l’étage vers le sol, et la **colonne des câbles** y monte le courant. Les photos du constructeur montrent bien deux tuyaux gainés et une gaine verticale ; ce à quoi ils servent, nous le lisons. On contrôle : supports, gaines, passages de paroi.',
      'The **silo** stands, built according to the other guide. On its wall, two things matter to the town: the **network risers** bring the hot water down from the floor to the ground, and the **cable riser** takes the current up. The maker’s photographs do show two clad pipes and a vertical duct; what they are for, we read. To check: supports, jackets, wall crossings.',
    ),
    parts: ['silo-exterior', 'dh-riser', 'cable-riser'],
    tools: [l('Tuyauteurs', 'Pipefitters'), l('Électricien', 'Electrician'), l('Nacelle', 'Cherry picker')],
  },
  {
    id: 'grid',
    scene: 'site',
    title: l('Le courant arrive', 'The current arrives'),
    text: step(
      'practice',
      'La **ligne moyenne tension** est raccordée au **transformateur**, et le **local électrique** abrite l’arrivée et sa protection. Ce raccordement se discute tôt avec le distributeur : un mégawatt qui se coupe à l’instant l’intéresse et l’inquiète. On contrôle : la mise à la terre, les protections, avec le distributeur, avant la moindre tension.',
      'The **medium-voltage line** is connected to the **transformer**, and the **electrical annex** houses the incomer and its protection. This connection gets discussed early with the network operator: a megawatt that can be cut in an instant interests and worries it. To check: the earthing, the protections, with the operator, before any voltage.',
    ),
    parts: ['power-line', 'pad-transformer', 'electrical-annex'],
    tools: [l('Distributeur d’électricité', 'Network operator'), l('Électricien habilité', 'Authorised electrician')],
    warning: l(
      'La moyenne tension tue sans contact, et un conducteur tombé peut rester sous tension. Seuls les habilités approchent ; pour les autres, on garde ses distances et on appelle.',
      'Medium voltage kills without contact, and a fallen conductor can stay live. Only authorised people go near; everyone else keeps away and calls.',
    ),
  },
  {
    id: 'where-from',
    scene: 'site',
    title: l('D’où vient le courant', 'Where the current comes from'),
    text: step(
      'reading',
      'Rien de physique n’est posé ici : l’étape dit d’où vient le prix. Le **parc éolien au loin** et le **champ solaire** n’ont aucun câble vers le silo, et ce champ n’existe pas au vrai site. Ils injectent sur le réseau et font tomber le prix quand ils produisent trop. Sur le contrat, on achète l’électricité au prix horaire. Reste à savoir à quels moments : c’est la dernière étape.',
      'Nothing physical is placed here: this step says where the price comes from. The **distant wind farm** and the **solar field** have no cable to the silo, and that field does not exist at the real site. They feed the grid and bring the price down when they produce too much. On the contract, the electricity is bought at the hourly price. When to buy remains to be settled: that is the last step.',
    ),
    parts: ['wind-farm', 'solar-field'],
    tools: [l('Fournisseur d’électricité', 'Electricity supplier')],
  },
  {
    id: 'trench',
    scene: 'site',
    title: l('Rejoindre le réseau de chaleur', 'Join the heating network'),
    text: step(
      'practice',
      'La **tranchée du réseau de chaleur** relie le pied des colonnes au réseau existant, et le silo est désormais raccordé à la chaudière, en parallèle : l’un peut prendre le relais de l’autre sans que personne ne le sente. On contrôle : soudures, fil de surveillance, épreuve en pression, puis le rinçage. La tranchée reste dessinée ouverte, pour qu’on la voie.',
      'The **district-heating trench** joins the foot of the risers to the existing network, and the silo is now connected to the boiler, in parallel: one can take over from the other without anyone noticing. To check: welds, monitoring wire, a pressure test, then flushing. The trench stays drawn open, so that it can be seen.',
    ),
    parts: ['dh-trench'],
    tools: [
      l('Pelle mécanique', 'Digger'),
      l('Soudeurs réseau', 'Network welders'),
      l('Épreuve en pression', 'Pressure test'),
    ],
    warning: l(
      'Une tranchée s’effondre sans prévenir : blindage ou talus au-delà d’une faible profondeur, et jamais seul au fond. Repérez les réseaux avant de creuser.',
      'A trench collapses without warning: shoring or a sloped side beyond a shallow depth, and never alone at the bottom. Locate the utilities before digging.',
    ),
  },
  {
    id: 'cold-tests',
    scene: 'plant-room',
    title: l('Les essais à froid', 'The cold tests'),
    text: step(
      'practice',
      'À cette étape, aucune chaleur. Les soufflantes tournent, les registres font toute leur course, l’eau circule dans l’échangeur. On coupe le débit d’air pour vérifier que le pressostat coupe bien les résistances, encore froides. Puis la coupure du réseau, le retour, le redémarrage. Une panne découverte à froid coûte une journée ; à chaud, elle coûte une semaine ou plus.',
      'At this stage, no heat. The blowers turn, the dampers run their full stroke, the water circulates through the exchanger. The air flow is cut to check that the pressure switch does cut the resistors, still cold. Then a grid cut, its return, and the restart. A fault found cold costs a day; found hot, it costs a week or more.',
    ),
    parts: [],
    tools: [l('Ingénieur de mise en service', 'Commissioning engineer'), l('Automaticien', 'Controls engineer')],
  },
  {
    id: 'first-heating',
    scene: 'silo',
    title: l('La première chauffe, lente', 'The first heating, slowly'),
    text: step(
      'reading',
      'Une pierre contient toujours un peu d’eau, et celle-ci doit partir avant que la chaleur ne l’y oblige. L’air monte donc lentement, la pierre sèche, et l’on surveille chaque sonde. La vitesse réelle n’est pas publiée, et le scénario « Première chauffe » dessine sa rampe sans la prétendre exacte. En même temps, virole, tubes et pierre apprennent à grandir ensemble.',
      'Stone always holds a little water, and it must leave before the heat forces it out. So the air climbs slowly, the stone dries, and every probe is watched. The real rate is not published, and the “First heating” scenario draws its ramp without claiming it is exact. At the same time, shell, pipes and stone learn to grow together.',
    ),
    parts: [],
    tools: [l('Ingénieur de mise en service', 'Commissioning engineer')],
    warning: l(
      'L’eau et la pierre chaude ne vont pas ensemble : une fuite d’eau ou un remplissage humide deviennent de la vapeur d’un seul coup. Remplissage sec, chauffe lente, et l’échangeur surveillé.',
      'Water and hot stone do not go together: a water leak or a damp fill turn to steam all at once. Dry fill, slow heating, and the exchanger watched.',
    ),
  },
  {
    id: 'winter-tests',
    scene: 'silo',
    title: l('Un hiver d’essais', 'A winter of tests'),
    text: step(
      'reported',
      'Après le remplissage, les essais ont duré tout l’hiver 2024-2025 sur le vrai silo. Charger, reposer, décharger, à des températures de plus en plus hautes : c’est à ce moment que la coupe colorée du modèle cède la place aux vraies sondes. La longueur de ces essais rappelle aussi que le premier chiffre d’un rendement sur un an inclut ces réglages, que le modèle n’a pas.',
      'After filling, the tests went on all through the winter of 2024-2025 at the real silo. Charging, resting, discharging, at higher and higher temperatures: this is when the model’s coloured section gives way to the real probes. The length of these tests is also a reminder that a first year’s efficiency figure includes these adjustments, which the model does not have.',
      [
        'pour les dates ; le contenu des essais est notre lecture',
        'for the dates; what the tests contained is our reading',
      ],
    ),
    parts: [],
    tools: [l('Ingénieur de mise en service', 'Commissioning engineer'), l('Exploitant du réseau', 'Network operator')],
    warning: l(
      'Cette chaleur ne se voit pas : une pierre à 400 °C ressemble à une pierre froide, et elle le reste des mois. Personne n’ouvre rien à chaud, ni trappe, ni bride, ni gaine.',
      'This heat does not show: stone at 400 °C looks like cold stone, and stays hot for months. Nobody opens anything while hot, no hatch, no flange, no duct.',
    ),
  },
  {
    id: 'first-heat',
    scene: 'site',
    title: l('La première chaleur dans le réseau', 'First heat in the network'),
    text: step(
      'reported',
      'En juin 2025, le silo entre en service. Le choix de cette saison n’est sans doute pas un hasard : l’été ne demande que peu, et la chaudière reste prête. L’eau descend par les colonnes, part dans la tranchée, et l’école et les maisons n’en savent rien. La chaudière, gardée en secours, prend désormais la main quand la pierre ne suffit plus.',
      'In June 2025 the silo goes into service. The choice of season is probably no accident: summer asks for little, and the boiler stays ready. The water comes down the risers, leaves by the trench, and the school and the houses know nothing of it. The boiler, kept as backup, now takes over when the stone no longer suffices.',
      [
        'pour la date et la chaudière ; le reste est notre lecture',
        'for the date and the boiler; the rest is our reading',
      ],
    ),
    parts: [],
    tools: [l('Exploitant du réseau', 'Network operator')],
  },
  {
    id: 'optimiser',
    scene: 'plant-room',
    title: l('L’algorithme et sa première année', 'The algorithm and its first year'),
    text: step(
      'reported',
      'Un algorithme fourni par un prestataire décide maintenant des heures de charge, et le silo vend aussi sa souplesse sur les marchés de réserve. Après un an, l’exploitant annonce plus de 85 % de rendement, sans dire comment il le mesure ; une charge de 70 à 80 % sous le prix moyen ; aucune interruption ; 70 % de CO₂ en moins. La leçon sur les heures bon marché vous laisse essayer à sa place.',
      'An algorithm from a contractor now decides the charging hours, and the silo also sells its flexibility on the reserve markets. After a year the operator announces above 85% efficiency, without saying how it measures it; charging 70 to 80% under the mean price; no interruption; 70% less CO₂. The lesson on cheap hours lets you try in its place.',
    ),
    parts: [],
    tools: [l('Prestataire de l’algorithme', 'Algorithm contractor'), l('Exploitant du réseau', 'Network operator')],
  },
];
