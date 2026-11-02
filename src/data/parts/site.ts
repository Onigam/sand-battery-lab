// Parts of the `site` world (ids frozen in src/data/ids.ts): the plant in its village, in the order of the story: cheap current in, warm school out. The site is
// a GENERIC Nordic village, not a copy of the real plot: what is seen on the maker's photographs (a clad pair of pipes down the wall, a riser, an annex at the
// foot, a fence, gravel) is said to be seen, its function read by us is said to be read, and every size that no source gives is an estimate.
// The silo of the site is the silo of the `silo` world, the same function from dims.ts; only the sheet differs: this one looks at it from the yard.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, tf } from '../part-helpers';

export const SITE_PARTS: PartInfo[] = [
  {
    id: 'silo-exterior',
    scene: 'site',
    category: 'structure',
    name: l('Le silo vu du dehors', 'The silo from outside'),
    short: l(
      'Un cylindre trapu de 13 m sur 15 m, plein de pierre à 400 °C en moyenne, et frais au toucher.',
      'A squat cylinder, 13 m by 15 m, full of stone at a mean of 400 °C, and cool to the touch.',
    ),
    description: lf(
      'Vu de la cour, rien ne trahit ce qu’il y a dedans : un cylindre trapu d’environ 13 m de haut et 15 m de large, bardé d’acier nervuré sombre, coiffé d’un toit conique bas. Le plus grand silo de ce genre en service ne contient pas de sable, mais environ 2 000 t de pierre ollaire concassée, à une moyenne d’environ 400 °C quand il est plein. Le constructeur assure que l’extérieur reste frais ; le modèle trouve environ {surfaceK} K au-dessus de l’air à pleine charge (résultat du modèle). Le lit de pierre ne fait que 6 m de haut : le reste, ce sont les fondations, les isolants et, selon notre lecture, un étage technique sous le toit. Cliquez pour l’ouvrir en coupe.',
      'From the yard nothing gives away what is inside: a squat cylinder about 13 m high and 15 m wide, clad in dark ribbed steel, under a low conical roof. The largest silo of its kind in service holds no sand at all but about 2,000 t of crushed soapstone, at a mean of about 400 °C when full. The maker says the outside stays cool; the model finds about {surfaceK} K above the air at full charge (model result). The stone itself is only 6 m deep: the rest is foundations, insulation and, on our reading, an equipment floor under the roof. Click to open it in section.',
    ),
    material: l(
      'Bardage d’acier nervuré, isolant, virole d’acier, pierre ollaire concassée',
      'Ribbed steel cladding, insulation, steel shell, crushed soapstone',
    ),
    specs: [
      sp('Hors tout', 'Overall', l('environ 13 m de haut, 15 m de large', 'about 13 m high, 15 m wide')),
      sp('Contenu', 'Contents', l('environ 2 000 t de pierre ollaire concassée', 'about 2,000 t of crushed soapstone')),
      sp('Annoncé', 'Quoted', l('1 MW, jusqu’à 100 MWh', '1 MW, up to 100 MWh')),
      sp('Rendu à 1 MW', 'Given at 1 MW', tf('model', '{usable} MWh')),
      sp('Mise en service', 'In service since', l('juin 2025', 'June 2025')),
      sp(
        'Cour',
        'Yard',
        l(
          'environ 20 × 30 m, chiffre donné pour le produit de 2 MW',
          'about 20 × 30 m, the figure given for the 2 MW product',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Rien de spectaculaire : un joint de bardage ou un solin de pied qui laisse entrer la pluie. Un isolant mouillé conduit bien mieux la chaleur, et le défaut se voit d’abord sur la facture de l’hiver.',
        check:
          'Une caméra thermique, un matin froid : une tache plus chaude sur le bardage trahit un pont thermique ou un isolant humide. Faites le tour du pied, regardez les fixations et les passages de tuyaux.',
        care: 'Une tournée après chaque tempête, et le bardage refermé aussitôt. L’essentiel de cette machine ne demande rien : c’est sa peau qu’on surveille.',
      },
      {
        failure:
          'Nothing dramatic: a cladding joint or a flashing at the foot that lets the rain in. Wet insulation conducts heat far better, and the fault shows first on the winter’s bill.',
        check:
          'A thermal camera on a cold morning: a warmer patch on the cladding gives away a thermal bridge or damp insulation. Walk round the foot, look at the fixings and where the pipes pass through.',
        care: 'A round after every storm, and the cladding closed again at once. Most of this machine asks for nothing: it is its skin that gets watched.',
      },
    ),
    tip: lf(
      'Le paradoxe de cette machine tient dans une main posée sur le bardage : de l’autre côté d’un demi-mètre de paroi, le bord de la pierre atteint {edgeFull} °C à pleine charge (résultat du modèle).',
      'The paradox of this machine fits in a hand laid on the cladding: on the far side of half a metre of wall, the edge of the stone reaches {edgeFull} °C at full charge (model result).',
    ),
    design: l(
      'Pour un volume donné, le cylindre qui a le moins de surface est aussi haut que large. Avec 13 m pour 15 m, le silo en est tout près : chaque mètre carré de paroi en moins est une fuite en moins.',
      'For a given volume, the cylinder with the least surface is as tall as it is wide. At 13 m by 15 m the silo is close to that: every square metre of wall saved is one leak fewer.',
    ),
  },
  {
    id: 'dh-riser',
    scene: 'site',
    category: 'hydraulic',
    name: l('Colonnes du réseau', 'Network risers'),
    short: l(
      'Deux tuyaux d’eau gainés qui descendent le long de la paroi : le départ vers le village et le retour.',
      'Two clad water pipes running down the wall: the supply to the village and the return.',
    ),
    description: lf(
      'Sur une photographie du constructeur, deux tuyaux gainés descendent du haut de la paroi jusqu’au sol. C’est l’un des indices qui nous font placer l’équipement sous le toit : la chaleur quitte le silo par le haut, sous forme d’eau chaude. L’un porte le départ, l’autre le retour, à {returnT} °C (estimation) : le départ de 85 °C vient d’une installation sœur, celui du vrai silo n’est pas publié. Pour transporter 1 MW avec 40 K d’écart, il faut environ {waterKgS} kg/s d’eau (dérivé). Aucune vapeur ici, seulement de l’eau chaude sous pression, comme dans n’importe quel réseau de chaleur.',
      'On one of the maker’s photographs two clad pipes run from high on the wall down to the ground. It is one of the clues that lead us to place the equipment under the roof: the heat leaves the silo from the top, as hot water. One carries the supply, the other the return at {returnT} °C (estimate): the 85 °C of supply comes from a sister plant, the real silo’s is not published. Carrying 1 MW across a 40 K difference takes about {waterKgS} kg/s of water (derived). No steam here, only hot water under pressure, as in any heating network.',
    ),
    material: l(
      'Acier, isolant, gaine de tôle (tailles non publiées)',
      'Steel, insulation, sheet-metal jacket (sizes not published)',
    ),
    qty: 2,
    specs: [
      sp('Nombre', 'Number', l('deux, vus sur une photo du constructeur', 'two, seen on a photo from the maker')),
      sp(
        'Températures de service',
        'Service temperatures',
        tf('estimate', 'départ 85 °C, retour {returnT} °C', 'supply 85 °C, return {returnT} °C'),
      ),
      sp('Débit à 1 MW', 'Flow at 1 MW', tf('derived', '{waterKgS} kg/s')),
      sp('Vidange', 'Draining', l('tenue par le réseau, hors de ce modèle', 'run by the network, outside this model')),
    ],
    maintenance: maint(
      {
        failure:
          'Le gel, si l’eau s’arrête en plein hiver : dans la ville du premier silo, le froid peut descendre à −23 °C. Puis la gaine déchirée qui laisse l’isolant prendre l’eau, et une fuite à une bride.',
        check:
          'Une caméra thermique montre tout de suite lequel est le départ, et si la gaine a perdu son isolant. Vérifiez les supports : le tuyau s’allonge en chauffant et doit pouvoir glisser.',
        care: 'L’eau doit rester en mouvement par grand froid, ou la colonne doit pouvoir se vidanger. Recousez la gaine dès qu’elle est abîmée.',
      },
      {
        failure:
          'Frost, if the water stops in midwinter: in the first silo’s town, the cold can fall to −23 °C. Then a torn jacket that lets the insulation get wet, and a leak at a flange.',
        check:
          'A thermal camera shows at once which pipe is the supply, and where the jacket has lost its insulation. Check the supports: the pipe grows as it warms and must be able to slide.',
        care: 'The water has to keep moving in hard frost, or the riser has to be drainable. Mend the jacket as soon as it is damaged.',
      },
    ),
    tip: l(
      'Cherchez les deux colonnes sur le bardage : ce sont les seuls signes extérieurs que ce silo chauffe un village.',
      'Look for the two risers on the cladding: they are the only outward signs that this silo heats a village.',
    ),
    design: l(
      'Mettre l’échangeur en haut, tout près de l’air chaud, puis descendre l’eau, c’est transporter la chaleur par le fluide qui la porte le mieux : l’eau se contente d’un petit tuyau là où l’air demande une gaine.',
      'Putting the exchanger up top, close to the hot air, and then bringing the water down means moving the heat in the fluid that carries it best: water is content with a small pipe where air demands a duct.',
    ),
    video: ['01:40'],
  },
  {
    id: 'cable-riser',
    scene: 'site',
    category: 'electrical',
    name: l('Colonne des câbles', 'Cable riser'),
    short: l(
      'Le chemin vertical qui monte le courant à l’étage. Sa fonction est lue sur une photo : aucune source ne la nomme.',
      'The vertical run that takes the current upstairs. Its function is read from a photo: no source names it.',
    ),
    description: lf(
      'Une gaine verticale monte le long de la paroi sur les photographies du constructeur, sans légende. Nous y lisons le chemin du courant, de l’annexe au pied jusqu’à l’étage technique. Si la tension est bien de {volts} V (hypothèse), 1 MW représente {amps} A (dérivé), et cela ne se fait pas avec un câble de maison : le labo compte {riserMm2} mm² par phase sur {riserLength} m (estimation), soit {riserLossKw} kW perdus à pleine charge. Plus le chemin est court, moins il coûte : c’est encore une raison de garder le transformateur au pied du silo.',
      'A vertical duct climbs the wall on the maker’s photographs, without a caption. We read it as the path of the current, from the annex at the foot up to the equipment floor. If the voltage is indeed {volts} V (assumption), 1 MW means {amps} A (derived), which no household cable can carry: the lab counts {riserMm2} mm² per phase over {riserLength} m (estimate), so {riserLossKw} kW lost at full load. The shorter the run, the less it costs: one more reason to keep the transformer at the foot of the silo.',
    ),
    material: l(
      'Câbles de cuivre ou d’aluminium, chemin de câbles, capot d’acier',
      'Copper or aluminium cables, cable tray, steel cover',
    ),
    specs: [
      sp(
        'Ce que l’on sait',
        'What is known',
        l('une gaine verticale sur une photo, rien de plus', 'a vertical duct on a photo, nothing more'),
      ),
      sp('Courant à 1 MW', 'Current at 1 MW', tf('derived', '{amps} A')),
      sp('Section par phase', 'Section per phase', tf('estimate', '{riserMm2} mm²')),
      sp('Longueur', 'Length', tf('estimate', '{riserLength} m')),
      sp('Pertes à pleine charge', 'Losses at full load', tf('estimate', '{riserLossKw} kW')),
    ],
    maintenance: maint(
      {
        failure:
          'Une cosse mal serrée chauffe : à ce courant, un mauvais contact se réchauffe vite et finit par brûler le câble. Viennent ensuite un collier desserré par le vent et une gaine vieillie au soleil.',
        check:
          'Une caméra thermique à pleine charge, capots ouverts par un électricien habilité : les trois phases doivent avoir la même température. Une phase plus chaude désigne le point à resserrer.',
        care: 'Resserrage des bornes selon le plan du fabricant, colliers et capot vérifiés une fois l’an, charge coupée.',
      },
      {
        failure:
          'A poorly tightened lug heats up: at this current a bad contact warms fast and ends by burning the cable. Then a clamp worked loose by the wind and a sheath aged by the sun.',
        check:
          'A thermal camera at full load, the covers opened by an authorised electrician: all three phases should show the same temperature. A hotter phase points to the joint to retighten.',
        care: 'Terminals retightened on the manufacturer’s schedule, clamps and cover checked once a year, with the load off.',
      },
    ),
    tip: l(
      'Le courant monte par une colonne, l’eau descend par deux autres : la façade résume à elle seule ce qui entre et ce qui sort.',
      'The current climbs one riser and the water comes down two others: the wall alone sums up what goes in and what comes out.',
    ),
    design: lf(
      'Doubler la tension divise le courant par deux et les pertes par quatre. C’est pourquoi le courant voyage en moyenne tension jusqu’au pied du silo, et ne passe à {volts} V (hypothèse) que sur les derniers mètres.',
      'Double the voltage and the current halves, the losses fall by four. That is why the current travels at medium voltage to the foot of the silo, and only drops to {volts} V (assumption) for the last few metres.',
    ),
  },
  {
    id: 'electrical-annex',
    scene: 'site',
    category: 'electrical',
    name: l('Local électrique au pied du silo', 'Electrical annex'),
    short: l(
      'Le petit bâtiment au pied du silo. Vu sur une photo, sa fonction n’est pas donnée : nous le lisons comme électrique.',
      'The small building at the foot of the silo. Seen on a photo, its function is not given: we read it as electrical.',
    ),
    description: lf(
      'Une annexe basse se tient au pied du silo sur une photographie du constructeur, et aucune source ne dit à quoi elle sert. Le labo y loge l’arrivée de la moyenne tension et sa protection, parce que ces appareils aiment le sol, l’air frais et une porte facile à atteindre pour le distributeur : c’est notre lecture, rien de plus. Ses dimensions, {annexW} × {annexD} × {annexH} m, sont une estimation, proportionnée à ce qu’on voit sur la photo sans en prendre aucune cote. Le silo de 250 MWh en construction a, lui, un bâtiment technique séparé : les deux dispositions existent.',
      'A low annex stands at the foot of the silo on a photograph from the maker, and no source says what it is for. The lab houses the medium-voltage incomer and its protection there, because such equipment likes the ground, cool air and a door the network operator can reach easily: that is our reading, nothing more. Its size, {annexW} × {annexD} × {annexH} m, is an estimate, in proportion to what the photo shows without taking any measure from it. The 250 MWh silo under construction has a separate technical building: both layouts exist.',
    ),
    material: l(
      'Bardage d’acier, dalle de béton, cellule moyenne tension',
      'Steel cladding, concrete slab, medium-voltage cell',
    ),
    specs: [
      sp('Vu', 'Seen', l('une annexe au pied du silo, sur une photo', 'an annex at the foot of the silo, on a photo')),
      sp('Fonction', 'Function', l('électrique, selon notre lecture', 'electrical, on our reading')),
      sp('Dimensions', 'Size', tf('estimate', '{annexW} × {annexD} × {annexH} m')),
      sp('Accès', 'Access', l('personnel habilité seulement', 'authorised staff only')),
    ],
    maintenance: maint(
      {
        failure:
          'L’humidité et les petites bêtes : la condensation sur une cellule moyenne tension et un rongeur dans un caniveau de câbles sont les pannes classiques de ces locaux.',
        check:
          'Depuis la porte, sans rien ouvrir : l’odeur, un voyant, un chauffage anti-condensation qui marche. Tout le reste est le travail d’un électricien habilité, installation consignée.',
        care: 'Ventilation dégagée, passages de câbles rebouchés, essais des protections selon les règles du pays et du distributeur.',
      },
      {
        failure:
          'Damp and small animals: condensation on a medium-voltage cell and a rodent in a cable trench are the classic faults of such rooms.',
        check:
          'From the door, opening nothing: the smell, an indicator lamp, an anti-condensation heater that works. All the rest is the job of an authorised electrician, with the installation locked out.',
        care: 'Vents kept clear, cable entries sealed, protections tested to the rules of the country and the network operator.',
      },
    ),
    tip: l(
      'Quand la fonction d’un objet n’est écrite nulle part, ce labo le dit : ici, seule la forme est une observation.',
      'When an object’s function is written nowhere, this lab says so: here, only the shape is an observation.',
    ),
    design: l(
      'Séparer la moyenne tension de la chaleur et du monde qui circule à l’étage simplifie tout : l’électricien et le distributeur n’ont pas à monter, et le matériel n’a pas chaud.',
      'Keeping the medium voltage away from the heat and from the people moving about upstairs simplifies everything: the electrician and the network operator need not climb, and the equipment stays cool.',
    ),
  },
  {
    id: 'pad-transformer',
    scene: 'site',
    category: 'electrical',
    name: l('Transformateur', 'Pad-mounted transformer'),
    short: lf(
      'Il ramène la moyenne tension de la ligne à {volts} V pour les résistances et les moteurs (hypothèse).',
      'It brings the line’s medium voltage down to {volts} V for the resistors and the motors (assumption).',
    ),
    description: lf(
      'À 1 MW et {volts} V, le courant monte à {amps} A (dérivé) : impossible de faire venir cela depuis le réseau. Le courant arrive donc en moyenne tension, ici {mediumV} kV (hypothèse), et le transformateur le ramène à la tension des appareils, tout près d’eux. Sa taille, environ {transformerKva} kVA (estimation), laisse de la marge au-dessus du mégawatt des résistances pour les moteurs et les automatismes. Son rendement est compté à {transformerEta} % (estimation), et le peu qu’il perd part en chaleur dans la cour : il ne rejoint pas la pierre, et le modèle le met dans les pertes. Aucune source ne donne le transformateur du vrai silo.',
      'At 1 MW and {volts} V the current climbs to {amps} A (derived): no way to bring that from the grid. So the current arrives at medium voltage, here {mediumV} kV (assumption), and the transformer brings it down to the equipment’s voltage, close by. Its size, about {transformerKva} kVA (estimate), leaves room above the resistors’ megawatt for the motors and the controls. Its efficiency is counted at {transformerEta}% (estimate), and the little it loses goes into the yard as heat: it never reaches the stone, and the model books it as a loss. No source gives the real silo’s transformer.',
    ),
    material: l(
      'Cuivre ou aluminium, tôles d’acier magnétique, huile ou résine',
      'Copper or aluminium, magnetic steel laminations, oil or resin',
    ),
    specs: [
      sp('Tensions', 'Voltages', tf('assumed', '{mediumV} kV vers {volts} V', '{mediumV} kV to {volts} V')),
      sp('Puissance', 'Rating', tf('estimate', 'environ {transformerKva} kVA', 'about {transformerKva} kVA')),
      sp('Rendement en charge', 'Efficiency at load', tf('estimate', '{transformerEta} %', '{transformerEta}%')),
      sp('Courant côté bas', 'Current on the low side', tf('derived', '{amps} A à 1 MW', '{amps} A at 1 MW')),
    ],
    maintenance: maint(
      {
        failure:
          'L’isolement qui vieillit à force de chauffer, une borne desserrée, une fuite d’huile sur un modèle à huile. Un transformateur meurt rarement d’un coup, il prévient longtemps.',
        check:
          'Température et bruit au passage, niveau d’huile et bac de rétention, herbe et neige dégagées autour des ailettes. Ne jamais ouvrir l’enclos soi-même : la moyenne tension tue sans contact.',
        care: 'Analyse d’huile et contrôle des connexions par une entreprise habilitée, à la périodicité du fabricant.',
      },
      {
        failure:
          'Insulation that ages with heat, a loose terminal, an oil leak on an oil-filled unit. A transformer rarely dies all at once: it gives long warnings.',
        check:
          'Temperature and hum in passing, oil level and catch pan, grass and snow kept clear of the fins. Never open the enclosure yourself: medium voltage kills without contact.',
        care: 'Oil analysis and connection checks by an authorised firm, at the manufacturer’s intervals.',
      },
    ),
    tip: l(
      'Le silo est une charge qui se pilote à la seconde : le transformateur voit des heures à plein et des heures à vide, jamais un fonctionnement régulier.',
      'The silo is a load controlled by the second: the transformer sees hours at full and hours at nothing, never a steady duty.',
    ),
    design: lf(
      'Un transformateur reste bon marché à faire tourner, mais il n’est pas gratuit : à {transformerEta} % (estimation), un mégawattheure sur cent ne rejoindra jamais la pierre. Au regard de la chaleur stockée, c’est peu, et c’est le prix pour pouvoir brancher un mégawatt.',
      'A transformer is cheap to run, but not free: at {transformerEta}% (estimate), one megawatt-hour in a hundred will never reach the stone. Against the heat stored that is little, and it is the price of being able to plug in a megawatt.',
    ),
  },
  {
    id: 'power-line',
    scene: 'site',
    category: 'electrical',
    name: l('Ligne moyenne tension', 'Medium-voltage line'),
    short: l(
      'Le réseau électrique : c’est par elle qu’arrivent les heures bon marché, et par elle que le silo rend service.',
      'The grid: the cheap hours arrive by it, and through it the silo does the grid a service.',
    ),
    description: lf(
      'La ligne apporte le courant quand il ne coûte presque rien. Elle ne reçoit rien en retour : le silo n’a pas de quoi refaire de l’électricité, il rend de la chaleur. Son utilité pour le réseau vient d’ailleurs : une charge de 1 MW qu’on peut couper à l’instant sans qu’aucune maison ne le sente, et c’est pourquoi le vrai silo participe aux marchés de réserve du gestionnaire national. Le modèle joue cela dans un scénario, sans aucun chiffre de recette, car aucun n’est publié. Sa tension, {mediumV} kV, est une hypothèse. Un détail qu’on oublie : sans courant, plus de soufflante ni de pompe ; une coupure arrête aussi la chaleur, et aucune source ne dit si l’installation a un secours.',
      'The line brings the current when it costs next to nothing. It gets nothing back: the silo has no way to make electricity again, it gives back heat. Its use to the grid lies elsewhere: a 1 MW load that can be cut in an instant without a single house feeling it, which is why the real silo takes part in the national operator’s reserve markets. The model plays this in a scenario, with no revenue figure, since none is published. Its voltage, {mediumV} kV, is an assumption. One detail that gets forgotten: with no current there is no blower and no pump; a blackout stops the heat too, and no source says whether the plant has a backup.',
    ),
    material: l('Conducteurs d’aluminium, isolateurs, poteaux', 'Aluminium conductors, insulators, poles'),
    specs: [
      sp('Tension', 'Voltage', tf('assumed', '{mediumV} kV')),
      sp(
        'Appel de puissance',
        'Load drawn',
        tf('assumed', '{chargeMw} MW de résistances, plus les moteurs', '{chargeMw} MW of resistors, plus the motors'),
      ),
      sp(
        'Marchés de réserve',
        'Reserve markets',
        l('oui, selon le constructeur ; recettes non publiées', 'yes, says the maker; revenues not published'),
      ),
      sp('Sens du courant', 'Direction of the current', l('uniquement vers le silo', 'towards the silo only')),
    ],
    maintenance: maint(
      {
        failure:
          'Les arbres et la neige lourde sur les conducteurs, une coupure de quelques heures. Le stock de pierre ne craint rien, mais la circulation s’arrête, et la chaudière ne repart que si elle a elle aussi du courant.',
        check:
          'Rien à toucher : c’est le domaine du distributeur. Ce que l’exploitant vérifie, c’est ce qui se passe à la coupure et au retour du courant, et si tout repart seul.',
        care: 'Élagage et visites par le distributeur. Du côté de l’installation, un essai de reprise après coupure avant chaque hiver.',
      },
      {
        failure:
          'Trees and heavy snow on the conductors, a blackout of a few hours. The stock of stone fears nothing, but the circulation stops, and the boiler only restarts if it has current too.',
        check:
          'Nothing to touch: this belongs to the network operator. What the plant checks is what happens when the power goes and comes back, and whether everything restarts by itself.',
        care: 'Pruning and inspections by the network operator. On the plant’s side, a restart test after a blackout before each winter.',
      },
    ),
    tip: l(
      'Pas d’électricité en retour : retenez-le dès ici, c’est la confusion la plus fréquente sur ces « batteries ».',
      'No electricity back: remember it from here on, it is the commonest confusion about these “batteries”.',
    ),
    design: l(
      'Une charge qu’on peut couper sans gêner personne vaut quelque chose pour un réseau chargé de vent et de soleil : c’est elle qu’on efface en premier. La pierre rend cela possible, car entre l’heure où l’on charge et celle où l’on chauffe, plus rien ne dépend de l’autre.',
      'A load that can be cut without bothering anyone is worth something to a grid full of wind and sun: it is the first to be shed. The stone makes this possible, because the hour of charging and the hour of heating no longer depend on each other.',
    ),
    video: ['01:17'],
  },
  {
    id: 'solar-field',
    scene: 'site',
    category: 'site',
    name: l('Champ solaire', 'Solar field'),
    short: l(
      'Le trop-plein de l’été. Il n’est pas sur le vrai terrain : le labo le dessine pour jouer le scénario du surplus solaire.',
      'The summer’s overflow. It is not on the real plot: the lab draws it to play the solar-overflow rule.',
    ),
    description: l(
      'Ce champ n’existe pas au vrai silo. Il est là pour une idée : le tout premier pilote du constructeur, 20 kW et 3 MWh, chauffait son sable avec 100 m² de panneaux. Au lieu de couper la production quand le réseau n’en veut plus, on peut l’envoyer dans la pierre, et la règle « surplus solaire seul » de la simulation fait exactement cela. Elle montre aussi sa limite sous ces latitudes : le soleil abonde quand la demande est faible, et manque quand elle est au plus fort. La pierre tient des jours ou des semaines, rarement une saison : elle ne range pas juillet pour janvier. Le courant de ce champ passe par la même ligne et le même transformateur.',
      'This field does not exist at the real silo. It is there for one idea: the maker’s very first pilot, 20 kW and 3 MWh, heated its sand from 100 m² of panels. Instead of curtailing production when the grid wants no more, it can be sent into the stone, and the simulation’s “solar overflow only” rule does exactly that. It also shows its limit at these latitudes: the sun is plentiful when demand is low and short when demand peaks. The stone holds for days or weeks, rarely a season: it does not put July away for January. The current of this field uses the same line and the same transformer.',
    ),
    material: l(
      'Modules photovoltaïques, structures d’acier, onduleurs',
      'Photovoltaic modules, steel frames, inverters',
    ),
    specs: [
      sp(
        'Au vrai silo',
        'At the real silo',
        l('aucun : il est dessiné pour le scénario', 'none: drawn for the scenario'),
      ),
      sp(
        'Au premier pilote',
        'At the first pilot',
        l('100 m² de panneaux, pour 20 kW et 3 MWh de stock', '100 m² of panels, for 20 kW and 3 MWh of storage'),
      ),
      sp(
        'Dans le modèle',
        'In the model',
        l('un surplus dessiné, qui n’a rien d’un relevé', 'a drawn overflow, in no way a record'),
      ),
      sp(
        'Durée de garde',
        'Holding time',
        l('des jours à des semaines, rarement une saison', 'days to weeks, rarely a season'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'La neige sur les modules, un connecteur qui chauffe, un onduleur qui s’arrête. Sous ces latitudes, la production d’hiver reste faible, quel que soit le soin apporté.',
        check:
          'Comparez la production d’une rangée à l’autre : une rangée en retrait désigne le connecteur ou la chaîne à contrôler.',
        care: 'Nettoyage et désherbage selon le site, vérification annuelle des connexions, onduleurs à remplacer un jour.',
      },
      {
        failure:
          'Snow on the modules, a connector that heats up, an inverter that stops. At these latitudes winter output stays low whatever care is taken.',
        check:
          'Compare the output of one row with another: a row lagging behind points to the connector or string to check.',
        care: 'Cleaning and weeding as the site requires, a yearly check of the connections, inverters to replace one day.',
      },
    ),
    tip: l(
      'Essayez la règle « surplus solaire seul » en toute saison : elle apprend en une minute pourquoi ce silo garde sa chaudière et sa ligne.',
      'Try the “solar overflow only” rule in every season: it shows in a minute why this silo keeps its boiler and its line.',
    ),
    design: l(
      'Un stockage de chaleur à court terme récompense l’électricité de trop, d’où qu’elle vienne : le vent la nuit, le soleil à midi. Il n’a pas besoin d’être à côté de la production : le réseau s’en charge, et le prix fait le lien.',
      'Short-term heat storage rewards surplus electricity wherever it comes from: wind at night, sun at noon. It need not sit next to the production: the grid takes care of that, and the price makes the link.',
    ),
    video: ['01:17'],
  },
  {
    id: 'wind-farm',
    scene: 'site',
    category: 'site',
    name: l('Parc éolien au loin', 'Distant wind farm'),
    short: l(
      'Rien ne le relie au silo, sinon le marché : quand il vente la nuit, le courant s’effondre et la pierre charge.',
      'Nothing links it to the silo but the market: when it blows at night the price collapses and the stone charges.',
    ),
    description: lf(
      'Aucun câble ne va de ces éoliennes au silo. Elles injectent sur le réseau comme les autres, et quand il y a plus de vent que de consommation, le prix tombe. Une source rapporte un prix qui a couru de 3 à 373 €/MWh dans une même semaine ; notre semaine de prix est dessinée à la main, à cet écart-là, et elle ne prétend pas être un relevé. Sur une vraie année, vérifiée une seule fois hors du labo, une règle simple qui ne charge que sous 30 à 50 €/MWh achète de {discountRealLow} à {discountRealHigh} % sous la moyenne (résultat du modèle), ce qui rejoint ce que l’exploitant annonce pour sa première année : de 70 à 80 %. Dix jours sans vent, et plus rien n’est bon marché : c’est un des scénarios.',
      'No cable runs from these turbines to the silo. They feed the grid like everyone else, and when there is more wind than demand the price falls. One source reports a price that ran from 3 to 373 €/MWh within a single week; our week of prices is drawn by hand to that span and does not pretend to be a record. On a real year, checked once outside the lab, a simple rule that only charges under 30 to 50 €/MWh buys {discountRealLow} to {discountRealHigh}% below the mean (model result), which matches what the operator announces for its first year: 70 to 80%. Ten days without wind, and nothing is cheap any more: that is one of the scenarios.',
    ),
    material: l(
      'Sans objet pour ce labo : ces éoliennes sont un décor qui explique un prix',
      'Not relevant to this lab: these turbines are a setting that explains a price',
    ),
    specs: [
      sp('Lien avec le silo', 'Link to the silo', l('le prix, aucun câble', 'the price, no cable')),
      sp(
        'Écart de prix rapporté',
        'Reported price span',
        l('de 3 à 373 €/MWh en une semaine', '3 to 373 €/MWh in a week'),
      ),
      sp('Semaine du labo', 'The lab’s week', l('dessinée à la main, à cet écart', 'drawn by hand, to that span')),
      sp(
        'Rabais à l’achat, annoncé',
        'Purchase discount, announced',
        l('de 70 à 80 % sous la moyenne du marché', '70 to 80% below the market mean'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'La panne qui compte ici n’en est pas une : c’est l’anticyclone. Des jours froids et sans vent, le courant cher, et le silo qui se vide au moment où le village en a le plus besoin.',
        check:
          'Lancez le scénario « Dix jours sans vent », puis regardez la chaudière revenir et le prix moyen de la chaleur monter.',
        care: 'Rien à entretenir de ce côté : on règle le prix sous lequel on charge, et on garde la chaudière en état.',
      },
      {
        failure:
          'The fault that matters here is not a fault: it is the high-pressure spell. Cold, windless days, dear current, and the silo emptying just when the village needs it most.',
        check: 'Run the “Ten windless days” scenario, then watch the boiler come back and the mean cost of heat climb.',
        care: 'Nothing to maintain on this side: you set the price under which you charge, and you keep the boiler in order.',
      },
    ),
    tip: l(
      'Les éoliennes sont loin sur la carte et très près dans la facture : c’est par elles qu’il faut comprendre la leçon sur les heures bon marché.',
      'The turbines are far away on the map and very close on the bill: they are the way into the lesson on cheap hours.',
    ),
    design: l(
      'Un silo ne stocke pas du vent, il stocke une chute de prix. Ce qui décide n’est donc pas la distance au parc, mais la fréquence de ces chutes : plus le réseau a d’éolien, plus ces heures sont nombreuses.',
      'A silo does not store wind, it stores a fall in price. So what decides is not the distance to the wind farm but how often those falls come: the more wind on the grid, the more of those hours there are.',
    ),
  },
  {
    id: 'chip-boiler-plant',
    scene: 'site',
    category: 'site',
    name: l('Chaufferie à plaquettes', 'Wood-chip boiler plant'),
    short: l(
      'L’ancienne chaudière, gardée pour les pointes et le secours : sans elle, le réseau ne tiendrait pas sa promesse.',
      'The old boiler, kept for peaks and backup: without it, the network could not keep its promise.',
    ),
    description: lf(
      'Le silo n’a pas remplacé la chaufferie, il l’a mise en réserve. D’après le constructeur, le réseau a supprimé le fioul et réduit les plaquettes d’environ 60 %, sans la moindre interruption la première année. Dans le modèle, la pierre fournit de {coverageLow} à {coverageHigh} % de la chaleur selon la règle choisie (résultat du modèle) ; la chaudière reprend le reste, à {boilerPrice} €/MWh (estimation, aucun prix n’est publié). Ce prix joue le rôle d’un plafond : charger plus cher que lui n’a d’intérêt que pour garder du stock. C’est aussi ce que la chaufferie apporte de plus utile : on ne dimensionne pas un silo pour la pire semaine de la décennie.',
      'The silo did not replace the boiler plant, it put it in reserve. According to the maker, the network has dropped oil altogether and cut chips by about 60%, with not one interruption in the first year. In the model the stone supplies {coverageLow} to {coverageHigh}% of the heat depending on the rule chosen (model result); the boiler takes the rest, at {boilerPrice} €/MWh (estimate, no price is published). That price acts as a ceiling: charging above it only makes sense to keep a stock. That is also the most useful thing the plant offers: nobody sizes a silo for the worst week of the decade.',
    ),
    material: l(
      'Chaudière à bois, silo à plaquettes, convoyeurs, cendrier',
      'Wood boiler, chip store, conveyors, ash bin',
    ),
    specs: [
      sp('Rôle', 'Role', l('pointes et secours, selon le constructeur', 'peaks and backup, says the maker')),
      sp('Plaquettes', 'Chips', l('environ 60 % de moins', 'about 60% less')),
      sp('Fioul', 'Oil', l('supprimé', 'dropped altogether')),
      sp(
        'Part de la pierre',
        'Share of the stone',
        tf('model', 'de {coverageLow} à {coverageHigh} %', '{coverageLow} to {coverageHigh}%'),
      ),
      sp('Prix de sa chaleur', 'Price of its heat', tf('estimate', '{boilerPrice} €/MWh')),
    ],
    maintenance: maint(
      {
        failure:
          'Une chaudière qui ne tourne plus que par moments vieillit autrement : démarrages à froid, condensation, plaquettes qui prennent l’humidité en attendant dans le silo. Le jour où on l’appelle, elle doit partir.',
        check:
          'Un essai de démarrage avant l’hiver, le taux d’humidité des plaquettes, l’état des convoyeurs et du cendrier.',
        care: 'Ramonage, cendres, révision selon le fabricant. Elle garde ses risques à elle : feu, fumées, monoxyde de carbone. Le silo, lui, ne brûle rien.',
      },
      {
        failure:
          'A boiler that only runs now and then ages differently: cold starts, condensation, chips picking up damp while they wait in the store. On the day it is called, it has to start.',
        check: 'A test start before winter, the moisture of the chips, the condition of the conveyors and the ash bin.',
        care: 'Sweeping, ash, servicing to the manufacturer’s schedule. It keeps its own hazards: fire, flue gas, carbon monoxide. The silo burns nothing.',
      },
    ),
    tip: l(
      'Regardez la chaudière dans la simulation pendant dix jours sans vent : la courbe explique mieux qu’une phrase pourquoi on l’a gardée.',
      'Watch the boiler in the simulation during ten windless days: the curve explains better than a sentence why it was kept.',
    ),
    design: l(
      'Un stockage ne remplace pas une source : il déplace une source dans le temps. Un réseau qui promet de la chaleur sans interruption a donc toujours besoin de quelque chose qui démarre quand le stock est vide.',
      'Storage does not replace a source: it moves a source in time. A network that promises heat without interruption will always need something that starts when the stock is empty.',
    ),
  },
  {
    id: 'boiler-stack',
    scene: 'site',
    category: 'site',
    name: l('Cheminée de la chaufferie', 'Boiler stack'),
    short: l(
      'La seule fumée du site, et elle se fait rare : c’est par elle que l’on voit le gain annoncé.',
      'The only smoke on the site, and a rarer sight now: it is where the announced gain shows.',
    ),
    description: l(
      'Le silo ne brûle rien et n’a pas de cheminée : la seule fumée du site vient d’ici. Avant la mise en service, l’exploitant attendait environ 160 t de CO₂e évitées par an. Après un an, le constructeur rapporte 70 % d’émissions en moins, environ 60 % de plaquettes en moins et plus aucune goutte de fioul. Ces chiffres sont les leurs : le modèle ne calcule pas le CO₂, et le labo ne peut pas les vérifier. Reste une image simple : cette cheminée brûle bien moins, et le village reste chauffé.',
      'The silo burns nothing and has no chimney: the only smoke on the site comes from here. Before commissioning, the operator expected about 160 t of CO₂e avoided a year. After a year, the maker reports a 70% cut in emissions, about 60% fewer chips and not one drop of oil. These figures are theirs: the model does not compute CO₂, and the lab cannot check them. A simple picture remains: this stack burns far less, and the village stays warm.',
    ),
    material: l('Conduit d’acier isolé, fût de métal ou de maçonnerie', 'Insulated steel flue, metal or masonry shaft'),
    specs: [
      sp(
        'CO₂e évité',
        'CO₂e avoided',
        l(
          'environ 160 t par an attendues ; 70 % rapportés après un an',
          'about 160 t a year expected; 70% reported after a year',
        ),
      ),
      sp(
        'Dans le modèle',
        'In the model',
        l('pas de CO₂ : la cheminée n’y est qu’un repère', 'no CO₂: the stack is only a landmark there'),
      ),
      sp('Au silo', 'At the silo', l('aucune combustion, aucun conduit', 'no combustion, no flue')),
    ],
    maintenance: maint(
      {
        failure:
          'Une cheminée qui reste souvent froide condense : les fumées déposent une eau acide, et la corrosion du conduit passe devant l’encrassement.',
        check:
          'Inspection du conduit à l’occasion du ramonage, analyse des fumées au démarrage, examen des pieds et des colliers.',
        care: 'Ramonage aux périodes fixées par les règles locales, et une chauffe complète de temps en temps pour sécher le conduit.',
      },
      {
        failure:
          'A stack that stays cold much of the time condenses: the flue gas leaves acid water behind, and corrosion takes over from soot as the main worry.',
        check: 'Inspect the flue when it is swept, analyse the flue gas at start-up, look at the foot and the clamps.',
        care: 'Sweeping at the intervals local rules set, and a full heat from time to time to dry the flue.',
      },
    ),
    tip: l(
      'Le CO₂ se lit ici en années, et non en semaines : méfiez-vous d’une semaine de simulation pour juger un chiffre annuel.',
      'CO₂ reads here in years, not weeks: beware of using one simulated week to judge an annual figure.',
    ),
    design: l(
      'Garder une cheminée n’est pas un échec du projet : c’est le prix d’un réseau sûr. Le gain se mesure à la quantité brûlée, pas à la disparition de la chaudière.',
      'Keeping a stack is no failure of the project: it is the price of a reliable network. The gain is measured by how much gets burned, not by the boiler disappearing.',
    ),
  },
  {
    id: 'dh-trench',
    scene: 'site',
    category: 'hydraulic',
    name: l('Tranchée du réseau de chaleur', 'District-heating trench'),
    short: l(
      'Deux tuyaux préisolés en tranchée, dessinés ouverts : l’aller chaud vers le village, le retour vers le silo.',
      'Two pre-insulated pipes in a trench, drawn open: hot out to the village, cooler back to the silo.',
    ),
    description: lf(
      'Le silo ne sert à rien sans ce tuyau. Dans une tranchée d’environ 1 m de profondeur (estimation), deux tubes préisolés portent l’eau vers les bâtiments et la ramènent, à {returnT} °C (estimation). La tranchée est dessinée ouverte pour qu’on la voie ; dans la réalité, elle est rebouchée, et seul un regard de temps en temps la signale. Ces réseaux existaient avant le silo : c’est bien pour cela qu’il a de quoi se brancher, et c’est une condition qui exclut beaucoup de lieux. Les pertes du réseau ne sont pas dans le modèle, qui s’arrête au compteur de chaleur.',
      'The silo is useless without this pipe. In a trench about 1 m deep (estimate), two pre-insulated pipes carry the water to the buildings and bring it back, at {returnT} °C (estimate). The trench is drawn open so that it can be seen; in reality it is backfilled, marked only by the odd manhole. These networks came before the silo: that is why it has something to connect to, and it is a condition that rules out many places. The network’s own losses are not in the model, which stops at the heat meter.',
    ),
    material: l(
      'Tube d’acier, mousse isolante, gaine plastique, lit de sable',
      'Steel pipe, insulating foam, plastic jacket, sand bedding',
    ),
    specs: [
      sp('Tuyaux', 'Pipes', l('un aller, un retour, préisolés', 'one out, one back, pre-insulated')),
      sp('Profondeur', 'Depth', tf('estimate', 'environ 1 m', 'about 1 m')),
      sp('Retour', 'Return', tf('estimate', '{returnT} °C')),
      sp(
        'Dans le modèle',
        'In the model',
        l('non modélisée : le modèle s’arrête au compteur', 'not modelled: the model stops at the meter'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une pelleteuse, d’abord. Ensuite l’humidité qui entre par un joint de gaine : la mousse mouillée isole mal, et l’acier rouille sans qu’on le voie.',
        check:
          'Beaucoup de tuyaux modernes portent un fil de surveillance dans leur mousse, qui donne l’alarme à l’humidité. Une ligne de neige fondue sur la tranchée, en hiver, dit à peu près la même chose.',
        care: 'Plans de réseau tenus à jour, regards dégagés, et une déclaration avant de creuser : ce n’est pas un tuyau qu’on veut trouver à la pelle.',
      },
      {
        failure:
          'A digger, first of all. Then damp getting in through a jacket joint: wet foam insulates badly, and the steel rusts out of sight.',
        check:
          'Many modern pipes carry a monitoring wire in their foam that gives the alarm on damp. A line of melted snow along the trench in winter says much the same.',
        care: 'Network drawings kept up to date, manholes clear, and a notice before digging: this is not a pipe to find with a spade.',
      },
    ),
    tip: l(
      'Sans réseau de chaleur tout proche, pas de silo : c’est sans doute la première question à poser à un site, et la plus décevante.',
      'No heating network close by, no silo: it is probably the first question to ask of a site, and the most disappointing.',
    ),
    design: l(
      'Ce silo est un appareil de réseau : il n’a de sens qu’adossé à des tuyaux déjà enterrés et à des clients déjà raccordés. Il ne chauffe pas un quartier neuf à lui seul : il transforme un réseau existant.',
      'This silo is a network device: it makes sense only alongside pipes already buried and customers already connected. It does not heat a new neighbourhood by itself: it transforms an existing network.',
    ),
    video: ['01:40'],
  },
  {
    id: 'village-school',
    scene: 'site',
    category: 'site',
    name: l('L’école du village', 'The village school'),
    short: l(
      'La demande, en chair et en os : ses radiateurs ne savent pas d’où vient l’eau chaude, et c’est tout le but.',
      'The demand in flesh and blood: its radiators do not know where the hot water comes from, and that is the point.',
    ),
    description: lf(
      'L’école représente tous les bâtiments du réseau. Selon le constructeur, les 100 MWh annoncés représentent à peu près une semaine de demande d’hiver et presque un mois d’été. On en tire {winterKw} kW et {summerKw} kW (dérivé), soit environ {yearGWh} GWh par an (dérivé). Le modèle retrouve l’hiver : {daysWinter} jours à partir de plein ; pour l’été, il donne {daysSummer} jours, bien plus qu’un mois (résultat du modèle). À cette puissance modérée, le silo rend bien plus que sa capacité à pleine puissance : {usableWinter} MWh en hiver contre {usable} MWh à 1 MW, le même plein (résultat du modèle). Les écoliers n’en savent rien : c’est le but.',
      'The school stands for all the buildings on the network. According to the maker, the 100 MWh it quotes come to about a week of winter demand and almost a month of summer. That gives {winterKw} kW and {summerKw} kW (derived), so about {yearGWh} GWh a year (derived). The model finds the winter again: {daysWinter} days from full; for the summer it gives {daysSummer} days, well over a month (model result). At that moderate power the silo gives far more than its capacity at full power: {usableWinter} MWh in winter against {usable} MWh at 1 MW, from the same full charge (model result). The pupils know nothing of it: that is the point.',
    ),
    material: l('Radiateurs à eau, boucle du bâtiment, sous-station', 'Water radiators, building loop, substation'),
    specs: [
      sp('Demande d’hiver', 'Winter demand', tf('derived', '{winterKw} kW')),
      sp('Demande d’été', 'Summer demand', tf('derived', '{summerKw} kW')),
      sp(
        'Sur une année',
        'Over a year',
        tf(
          'derived',
          'environ {yearGWh} GWh, soit {cycles} fois 100 MWh',
          'about {yearGWh} GWh, or {cycles} times 100 MWh',
        ),
      ),
      sp(
        'Fiabilité annoncée',
        'Announced reliability',
        l('100 %, aucune interruption la première année', '100%, no interruption in the first year'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Pour le silo, la panne d’un bâtiment se lit dans l’eau qui revient. Une vanne de radiateur bloquée ouverte renvoie de l’eau trop chaude, et tout le réseau rend moins.',
        check:
          'La température de retour, bâtiment par bâtiment. Un retour trop chaud se paie jusqu’à la pierre : il faut plus d’air pour la même chaleur.',
        care: 'Équilibrage des circuits et réglage des courbes de chauffe. Une action discrète, qui fait plus pour le réseau que bien des équipements neufs.',
      },
      {
        failure:
          'For the silo, a building’s fault shows in the water that comes back. A radiator valve stuck open returns water that is too hot, and the whole network yields less.',
        check:
          'The return temperature, building by building. Too warm a return is paid for right back at the stone: it takes more air for the same heat.',
        care: 'Balancing the circuits and setting the heating curves. A quiet job that does more for the network than much new equipment.',
      },
    ),
    tip: lf(
      'Essayez un retour plus chaud dans la simulation : un silo donne d’autant plus que l’eau revient froide. Le plancher de {floor} °C (résultat du modèle) se déplace avec elle.',
      'Try a warmer return in the simulation: a silo gives all the more when the water comes back cold. The floor of {floor} °C (model result) moves with it.',
    ),
    design: lf(
      'Rien ne change à l’école le jour où le silo arrive : c’est la force du réseau. La forme de la demande sur la journée est dessinée dans le modèle, mais les {winterKw} kW et les {summerKw} kW découlent de ce que dit le constructeur (dérivé). Nous n’avons donc pas deux preuves, mais un seul chiffre vu de deux côtés.',
      'Nothing changes at the school the day the silo arrives: that is the strength of a network. The daily shape of the demand is drawn in the model, but the {winterKw} kW and {summerKw} kW follow from what the maker says (derived). So we do not have two proofs, only one figure seen from two sides.',
    ),
  },
  {
    id: 'house-substation',
    scene: 'site',
    category: 'hydraulic',
    name: l('Sous-station d’une maison', 'A house substation'),
    short: l(
      'Un échangeur à plaques dans une cave : ni flamme ni cheminée à la maison, et l’eau du réseau n’y entre pas.',
      'A plate exchanger in a cellar: no flame or chimney at home, and the network’s water never enters the house.',
    ),
    description: lf(
      'Une maison raccordée n’a pas de chaudière. Dans la cave, un échangeur à plaques passe la chaleur de l’eau du réseau à l’eau de la maison, sans mélange ; une vanne règle le débit selon le besoin. L’eau repart plus froide, à {returnT} °C (estimation) dans ce modèle. Ce retour n’est pas un détail : c’est lui qui refroidit l’air dans l’échangeur du silo, et donc lui qui permet d’aller chercher la chaleur jusqu’au fond de la pierre. L’appareil est générique, aucune source ne décrit ceux de ce réseau.',
      'A connected house has no boiler. In the cellar a plate exchanger passes the heat from the network’s water to the house’s water without mixing them; a valve sets the flow to the need. The water leaves colder, at {returnT} °C (estimate) in this model. That return is no detail: it is what cools the air in the silo’s exchanger, and so what lets the air fetch heat from deep in the stone. The device is generic, no source describes those of this network.',
    ),
    material: l('Plaques d’inox, vanne de réglage, compteur', 'Stainless plates, control valve, meter'),
    specs: [
      sp('Type', 'Type', l('échangeur à plaques, générique', 'plate exchanger, generic')),
      sp('Eau', 'Water', l('deux circuits, jamais mélangés', 'two circuits, never mixed')),
      sp('Retour', 'Return', tf('estimate', '{returnT} °C')),
    ],
    maintenance: maint(
      {
        failure:
          'Des plaques entartrées ou encrassées : il faut plus de débit pour la même chaleur, et l’eau revient trop chaude au réseau.',
        check:
          'L’écart entre l’aller et le retour de la maison : s’il se réduit au fil des ans alors que rien n’a changé, l’échangeur est à nettoyer.',
        care: 'Détartrage ou nettoyage périodique, vanne et sondes contrôlées par le réseau, filtre à vider.',
      },
      {
        failure:
          'Scaled or fouled plates: it takes more flow for the same heat, and the water returns to the network too warm.',
        check:
          'The difference between the house’s flow and return: if it shrinks over the years while nothing else has changed, the exchanger needs cleaning.',
        care: 'Descaling or cleaning from time to time, the valve and sensors checked by the network, the strainer emptied.',
      },
    ),
    tip: l(
      'Plus d’entretien de chaudière à la maison, et aucun risque de monoxyde de carbone : la flamme est ailleurs, et de moins en moins souvent.',
      'No more boiler servicing at home and no carbon monoxide risk: the flame is elsewhere, and less and less often.',
    ),
    design: l(
      'Deux circuits, c’est deux pressions, deux qualités d’eau et aucune fuite de maison qui puisse vider le réseau. Le prix à payer est un petit écart de température entre les deux eaux : l’échangeur reste une petite marche à franchir.',
      'Two circuits mean two pressures, two water qualities and no leak in a house that can empty the network. The price is a small temperature gap between the two waters: the exchanger remains a small step to climb.',
    ),
  },
];
