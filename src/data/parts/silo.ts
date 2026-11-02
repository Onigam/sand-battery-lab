// Parts of the `silo` world (ids frozen in src/data/ids.ts): the machine in section, from the slab to the roof. What the maker gives: the outside size, the bed in its
// own model (14 × 6 m), the mass, the mean at full, an inner steel shell, insulation and an outer cladding, pipes it calls free of maintenance. What it keeps: the pipe
// layout, the insulation, the equipment. So the split of the height, the thicknesses and the pipes are ESTIMATES, sized by the physics, and said so. The equipment floor is
// OUR READING of a film and a photo, said once on its own sheet and in the world's overview. The hazards of a hot bed are said once, on `storage-bed`.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, tf } from '../part-helpers';

export const SILO_PARTS: PartInfo[] = [
  {
    id: 'foundation-slab',
    scene: 'silo',
    category: 'structure',
    name: l('Radier', 'Foundation slab'),
    short: lf(
      'La dalle qui porte tout : environ 2 000 t de pierre, soit {bedPressure} kPa sous le lit (dérivé).',
      'The slab that carries it all: about 2,000 t of stone, or {bedPressure} kPa under the bed (derived).',
    ),
    description: lf(
      'Tout repose ici. Environ 2 000 t de pierre sur {bedArea} m² de lit, cela fait {bedPressure} kPa au sol (dérivé), à quoi s’ajoutent l’acier et l’équipement. Un radier en anneau d’environ {slabDiameter} m (estimation) répartit cette charge sur un terrain qu’une étude de sol a jugé capable de la tenir sans tasser d’un côté plus que de l’autre. Le béton n’aime pas la chaleur : tout l’objet de la couche suivante est de le garder près de la température du sol, {groundT} °C dans le modèle (estimation). Pour le silo de 250 MWh, le constructeur dit que les fondations ont précédé le silo et son bâtiment technique : c’est l’un des rares faits publiés sur l’ordre du chantier.',
      'Everything rests here. About 2,000 t of stone over {bedArea} m² of bed comes to {bedPressure} kPa on the ground (derived), to which the steel and the equipment are added. A ring slab about {slabDiameter} m across (estimate) spreads this load over ground that a survey has judged able to carry it without settling more on one side than the other. Concrete dislikes heat: the whole purpose of the next layer is to keep it near ground temperature, {groundT} °C in the model (estimate). For the 250 MWh silo, the maker says the foundations came before the silo and its technical building: one of the few published facts about the order of the work.',
    ),
    material: l('Béton armé, sur un sol préparé et drainé', 'Reinforced concrete, on prepared and drained ground'),
    specs: [
      sp('Charge', 'Load', l('environ 2 000 t de pierre, plus l’acier', 'about 2,000 t of stone, plus the steel')),
      sp(
        'Pression sous le lit',
        'Pressure under the bed',
        tf('derived', '{bedPressure} kPa, la pierre seule', '{bedPressure} kPa, the stone alone'),
      ),
      sp('Diamètre', 'Diameter', tf('estimate', 'environ {slabDiameter} m', 'about {slabDiameter} m')),
      sp(
        'Radier et isolation dessous',
        'Slab and insulation under the bed',
        tf('estimate', '{foundationStack} m au total', '{foundationStack} m in all'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Le tassement inégal : le silo penche à peine, mais la virole et les tubes le ressentent. Une dalle fissurée qui laisse monter l’eau du sol est l’autre risque, car de l’eau sous un isolant chaud ne reste pas de l’eau.',
        check:
          'Des repères de niveau scellés au pied, relevés plusieurs fois pendant le remplissage puis de loin en loin, et les drains inspectés après la fonte des neiges.',
        care: 'Rien sur la dalle elle-même : on garde le pied du silo sec, fossés et drains dégagés. Tout se joue avant le premier camion.',
      },
      {
        failure:
          'Uneven settling: the silo barely tilts, but the shell and the pipes feel it. A cracked slab that lets ground water rise is the other risk, because water under hot insulation does not stay water.',
        check:
          'Level marks set in the foot, read several times during filling and then at long intervals, and the drains inspected after the thaw.',
        care: 'Nothing on the slab itself: the foot of the silo is kept dry, ditches and drains clear. It is all settled before the first truck.',
      },
    ),
    tip: l(
      'Observez le remplissage du point de vue de la dalle : la charge arrive camion après camion, et c’est là qu’elle doit tasser, avant que la chaleur s’en mêle.',
      'Think of the filling from the slab’s point of view: the load arrives truck after truck, and that is when it should settle, before the heat joins in.',
    ),
    design: l(
      'Une pierre ne bouge pas, ne tourne pas, n’use rien : c’est du poids mort qu’il suffit de bien poser. La fondation d’un silo est un problème de géotechnique ordinaire, ce qui fait partie de son charme.',
      'Stone does not move, turn or wear anything: it is dead weight that only needs to be set down properly. A silo’s foundation is an ordinary geotechnical problem, which is part of its charm.',
    ),
  },
  {
    id: 'base-insulation',
    scene: 'silo',
    category: 'structure',
    name: l('Isolation sous le lit', 'Base insulation'),
    short: lf(
      'Elle doit isoler et porter à la fois : {baseInsulation} m (estimation) sous {bedPressure} kPa (dérivé), et personne n’y retournera.',
      'It has to insulate and to carry: {baseInsulation} m (estimate) under {bedPressure} kPa (derived), and nobody will ever go back to it.',
    ),
    description: lf(
      'Sous le lit, l’isolant a un double travail. Il doit arrêter la chaleur vers le sol, mais aussi supporter tout le poids, {bedPressure} kPa (dérivé) : pas question d’une laine. Le brevet du constructeur cite une conductivité inférieure à 0,3 W/m·K et prend en exemple l’argile expansée, un granulat qui se tient de lui-même ; mais un brevet n’est pas le plan d’une installation, et l’isolant réel n’est pas publié. Le modèle compte {baseInsulation} m à {lambda} W/m·K (estimation), soit environ 0,2 W/m²·K (dérivé). Le modèle garde le sol à {groundT} °C (estimation) : le vrai sol finit par se réchauffer un peu, ce qui ralentit encore cette fuite.',
      'Under the bed the insulation has two jobs. It must stop heat going to the ground, and also bear the whole weight, {bedPressure} kPa (derived): no wool will do. The maker’s patent mentions a conductivity below 0.3 W/m·K and takes expanded clay as an example, a granulate that holds itself up; but a patent is not the plan of a plant, and the real insulation is not published. The model counts {baseInsulation} m at {lambda} W/m·K (estimate), about 0.2 W/m²·K (derived). The model keeps the ground at {groundT} °C (estimate): the real ground ends up warming a little, which slows this leak further.',
    ),
    material: l(
      'Non publié. Exemple du brevet : argile expansée, un granulat porteur',
      'Not published. The patent’s example: expanded clay, a load-bearing granulate',
    ),
    specs: [
      sp('Épaisseur', 'Thickness', tf('estimate', '{baseInsulation} m')),
      sp('Conductivité', 'Conductivity', tf('estimate', '{lambda} W/m·K')),
      sp('Seuil du brevet', 'The patent’s limit', l('moins de 0,3 W/m·K', 'below 0.3 W/m·K')),
      sp('Charge à porter', 'Load to carry', tf('derived', '{bedPressure} kPa')),
      sp('Sol sous l’isolant', 'Ground below', tf('estimate', '{groundT} °C')),
    ],
    maintenance: maint(
      {
        failure:
          'L’écrasement à long terme sous le poids et à chaud, qui ferait perdre l’épaisseur et creuserait un point bas ; ou l’humidité qui remonte. Aucun des deux ne se répare sous 2 000 t de pierre.',
        check:
          'Une température du sol qui monte d’année en année sous le radier raconte l’histoire. Il faut donc avoir posé la sonde avant le radier, et non après.',
        care: 'Rien en service. Le seul entretien possible a lieu à la pose : isolant sec, posé de niveau, protégé de la pluie jusqu’à la fermeture de la virole.',
      },
      {
        failure:
          'Long-term crushing under the weight and the heat, which would lose thickness and dig a low spot; or damp rising. Neither can be repaired under 2,000 t of stone.',
        check:
          'A ground temperature that climbs year on year under the slab tells the story. So the probe has to be fitted before the slab, not after.',
        care: 'Nothing in service. The only maintenance possible is at laying: dry insulation, laid level, kept out of the rain until the shell is closed.',
      },
    ),
    tip: l(
      'Quand une pièce ne sera plus jamais accessible, son entretien se fait le jour de sa pose : gardez cette idée pour toute la suite du chantier.',
      'When a part will never be reached again, its maintenance happens the day it is laid: keep that thought for the rest of the build.',
    ),
    design: lf(
      'Un isolant porteur isole en général moins bien qu’une laine, et il coûte cher à ces épaisseurs. Le chiffre de {baseInsulation} m (estimation) vient donc d’un équilibre : assez pour sauver le béton, pas plus que ce que la hauteur permet.',
      'A load-bearing insulation usually insulates worse than wool, and is dear at these thicknesses. The {baseInsulation} m (estimate) thus comes from a balance: enough to save the concrete, no more than the height allows.',
    ),
  },
  {
    id: 'inner-shell',
    scene: 'silo',
    category: 'structure',
    name: l('Virole intérieure', 'Inner steel shell'),
    short: lf(
      'Le cylindre d’acier qui retient la pierre, à {edgeFull} °C au bord quand tout est plein (résultat du modèle).',
      'The steel cylinder that holds the stone, at {edgeFull} °C at the edge when full (model result).',
    ),
    description: lf(
      'Le constructeur décrit une enveloppe intérieure d’acier, un isolant, puis un bardage extérieur. Cette virole retient la poussée de la pierre comme un tonneau retient son vin, et elle travaille à chaud : {edgeFull} °C au bord à pleine charge dans le modèle (résultat du modèle), sous la limite de {shellLimit} °C qu’il prend pour un acier de construction (estimation). En chauffant, elle s’élargit d’environ {shellGrowCm} cm sur son diamètre (dérivé, avec la dilatation de l’inox ; l’acier réel n’est pas publié). Or les grains, eux, descendent combler le jeu : en refroidissant, la virole serre une pierre qui ne recule pas. Ce cliquet thermique est connu pour les lits granulaires ; le constructeur ne publie pas comment il le traite.',
      'The maker describes an inner steel shell, insulation, then an outer cladding. This shell holds back the thrust of the stone as a barrel holds its wine, and it works hot: {edgeFull} °C at the edge at full charge in the model (model result), under the {shellLimit} °C limit it takes for a structural steel (estimate). As it warms it widens by about {shellGrowCm} cm across its diameter (derived, with the expansion of stainless steel; the real steel is not published). The grains, meanwhile, slip down to fill the gap: on cooling, the shell tightens on stone that will not move back. This thermal ratcheting is known for granular beds; the maker does not publish how it handles it.',
    ),
    material: l(
      'Acier soudé en viroles superposées (nuance non publiée)',
      'Welded steel in stacked courses (grade not published)',
    ),
    specs: [
      sp('Diamètre intérieur', 'Inside diameter', l('environ 14 m', 'about 14 m')),
      sp('Bord de pierre, à plein', 'Edge of the stone, full', tf('model', '{edgeFull} °C')),
      sp('Limite retenue', 'Limit taken', tf('estimate', '{shellLimit} °C')),
      sp(
        'Dilatation du diamètre',
        'Growth of the diameter',
        tf('derived', 'environ {shellGrowCm} cm', 'about {shellGrowCm} cm'),
      ),
      sp(
        'Cycles sur 30 ans',
        'Cycles over 30 years',
        tf('derived', 'de {cyclesLow} à {cyclesHigh}', '{cyclesLow} to {cyclesHigh}'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'La fatigue des soudures, à force d’allers et retours de température, et le cliquet thermique, qui pousse un peu plus à chaque cycle. Le modèle n’a ni l’un ni l’autre : il ne connaît aucune usure.',
        check:
          'On ne voit pas la virole : on lit les températures de bord, et on surveille les déformations du bardage, qui trahissent ce qui bouge dessous.',
        care: 'Aucune pendant la vie du silo. Le constructeur annonce plus de 30 ans : c’est dans les soudures et dans la montée en température qu’ils se gagnent.',
      },
      {
        failure:
          'Fatigue of the welds, from the coming and going of temperature, and thermal ratcheting, which pushes a little further each cycle. The model has neither: it knows no wear.',
        check:
          'The shell cannot be seen: the edge temperatures are read, and the cladding is watched for distortions that give away what moves beneath it.',
        care: 'None in the silo’s life. The maker announces over 30 years: they are won in the welds and in how the temperature is brought up.',
      },
    ),
    tip: l(
      'Le silo ne se charge pas en un jour pour rien : une montée lente laisse la virole, les tubes et la pierre grandir ensemble.',
      'There is a reason the silo is not charged in a day: a slow rise lets the shell, the pipes and the stone grow together.',
    ),
    design: lf(
      'Garder un bord plus froid que le cœur n’est pas seulement une économie de chaleur : c’est aussi ménager l’acier. Avec 650 °C d’air et la charge par le cœur, le bord en resterait à {edgeHotAir} °C (résultat du modèle) et la virole aurait une vie bien plus calme ; une moyenne de 400 °C sous 500 °C d’air, elle, laisse peu d’écart.',
      'Keeping the edge cooler than the core is not just a saving of heat: it also spares the steel. With 650 °C of air charging through the core the edge would stop at {edgeHotAir} °C (model result) and the shell would lead a much calmer life; a mean of 400 °C under 500 °C of air leaves little of that gap.',
    ),
  },
  {
    id: 'wall-insulation',
    scene: 'silo',
    category: 'structure',
    name: l('Isolation des parois', 'Wall insulation'),
    short: lf(
      'Entre les deux aciers : {wallInsulation} m (estimation), pas plus de {wallBuildUp} m tout compris (dérivé).',
      'Between the two steels: {wallInsulation} m (estimate), no more than {wallBuildUp} m all told (derived).',
    ),
    description: lf(
      'Pour un silo de 15 m autour d’un lit de 14 m, il reste {wallBuildUp} m de paroi de chaque côté (dérivé) : c’est un plafond pour la virole, l’isolant et le bardage réunis. Le modèle y met {wallInsulation} m d’isolant à {lambda} W/m·K (estimation), avec des matériaux ordinaires, comme le dit le constructeur sans en préciser davantage. Les parois perdent alors {lossFull} kW à plein (résultat du modèle), et {lossYear} kW en moyenne sur l’année, car le silo reste rarement plein. Otez la moitié de l’isolant : à plein, la perte monte à {lossThin} kW, et la demi-vie de la chaleur passe de {halfHeat} à {halfHeatThin} jours (résultat du modèle). C’est le scénario « Moitié moins d’isolant ».',
      'A 15 m silo around a 14 m bed leaves {wallBuildUp} m of wall on each side (derived): a ceiling for the shell, the insulation and the cladding together. The model puts {wallInsulation} m of insulation there at {lambda} W/m·K (estimate), with ordinary materials, as the maker says without going further. The walls then lose {lossFull} kW when full (model result), and {lossYear} kW on average over the year, because the silo is seldom full. Take half the insulation away: when full the loss climbs to {lossThin} kW, and the half-life of the heat falls from {halfHeat} to {halfHeatThin} days (model result). That is the “Half the insulation” scenario.',
    ),
    material: l(
      'Non publié : des matériaux courants, selon le constructeur',
      'Not published: ordinary materials, says the maker',
    ),
    specs: [
      sp('Épaisseur', 'Thickness', tf('estimate', '{wallInsulation} m')),
      sp('Plafond de la paroi', 'Ceiling of the wall', tf('derived', '{wallBuildUp} m')),
      sp(
        'Conductivité',
        'Conductivity',
        tf('estimate', '{lambda} W/m·K, une seule valeur', '{lambda} W/m·K, one single value'),
      ),
      sp(
        'Pertes par les parois',
        'Losses through the walls',
        tf(
          'model',
          '{lossFull} kW à plein, {lossYear} kW sur l’année',
          '{lossFull} kW when full, {lossYear} kW over the year',
        ),
      ),
      sp(
        'Moitié moins d’isolant',
        'Half the insulation',
        tf('model', '{lossThin} kW à plein', '{lossThin} kW when full'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un isolant en vrac tasse avec le temps et laisse un vide en haut de paroi. Si l’eau de pluie entre, il devient presque inutile là où il est mouillé.',
        check:
          'La caméra thermique sur le bardage, un matin froid. Une bande chaude en haut de paroi signale un tassement ; une tache chaude en bas, plutôt de l’eau.',
        care: 'On recharge par le haut un isolant qui a tassé. Le reste consiste à garder le bardage étanche.',
      },
      {
        failure:
          'Loose insulation settles with time and leaves a gap at the top of the wall. If rain gets in, it becomes almost useless wherever it is wet.',
        check:
          'The thermal camera on the cladding, on a cold morning. A warm band at the top of the wall points to settling; a warm patch at the bottom, more likely water.',
        care: 'Settled insulation is topped up from above. The rest is keeping the cladding watertight.',
      },
    ),
    tip: l(
      'Au-delà d’un demi-mètre, le curseur sort des dimensions annoncées : le modèle vous laisse essayer, mais ce silo-là n’existe pas.',
      'Beyond half a metre the slider leaves the quoted size: the model lets you try, but that silo does not exist.',
    ),
    design: lf(
      'Doubler l’isolant coûte cher et diminue les pertes, mais il sauve peu de capacité à pleine puissance : {usable} MWh à peu près dans tous les cas (résultat du modèle). L’isolant protège le temps de garde, pas la puissance. C’est le genre de nuance que seul un modèle montre.',
      'Doubling the insulation is dear and cuts the losses, but it saves little capacity at full power: about {usable} MWh in every case (model result). Insulation protects the holding time, not the power. It is the kind of nuance only a model shows.',
    ),
  },
  {
    id: 'outer-cladding',
    scene: 'silo',
    category: 'structure',
    name: l('Bardage extérieur', 'Outer steel cladding'),
    short: lf(
      'Protège des intempéries et reste froid : environ {surfaceK} K au-dessus de l’air à pleine charge (résultat du modèle).',
      'Keeps the weather out and stays cool: about {surfaceK} K above the air at full charge (model result).',
    ),
    description: lf(
      'Le bardage n’a rien à contenir, il protège. C’est de l’acier nervuré sombre sur les photographies, avec un solin au pied qui rejette l’eau de pluie. Le constructeur dit que cette surface reste froide ; le modèle la trouve environ {surfaceK} K au-dessus de l’air, avec {surfaceW} W/m² qui passent (résultat du modèle). Ce n’est pas brûlant, et l’alarme « bardage chaud » du modèle, fixée à {surfaceLimit} °C (estimation), n’est pas un seuil de brûlure : c’est un repère pour dire que quelque chose a changé dedans. Regarder ce bardage en hiver, c’est lire la santé de l’isolant.',
      'The cladding has nothing to contain, it protects. It is dark ribbed steel on the photographs, with a flashing at the foot that throws off the rain. The maker says this surface stays cool; the model finds it about {surfaceK} K above the air, with {surfaceW} W/m² passing through (model result). That is not burning hot, and the model’s “warm cladding” alarm, set at {surfaceLimit} °C (estimate), is not a burn threshold: it is a marker to say that something has changed inside. Looking at this cladding in winter means reading the health of the insulation.',
    ),
    material: l('Tôle d’acier nervurée, solin au pied', 'Ribbed sheet steel, flashing at the foot'),
    specs: [
      sp('Aspect', 'Look', l('acier nervuré sombre, vu sur des photos', 'dark ribbed steel, seen on photos')),
      sp(
        'À pleine charge',
        'At full charge',
        tf('model', '{surfaceK} K au-dessus de l’air, {surfaceW} W/m²', '{surfaceK} K above the air, {surfaceW} W/m²'),
      ),
      sp(
        'Alarme du modèle',
        'The model’s alarm',
        tf(
          'estimate',
          '{surfaceLimit} °C, un repère, pas un seuil de brûlure',
          '{surfaceLimit} °C, a marker, not a burn threshold',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'La rouille aux coupes et aux fixations, un panneau soulevé par le vent, et la condensation derrière le bardage : si la vapeur reste piégée, elle mouille l’isolant.',
        check:
          'Le tour du silo à pied, en regardant bien la jonction avec le toit, les passages de tuyaux et le solin de pied.',
        care: 'Retouche de peinture, fixations changées, panneau resserré. Rien de plus qu’un hangar agricole, à ceci près que l’eau derrière se paie plus cher.',
      },
      {
        failure:
          'Rust at the cuts and fixings, a panel lifted by the wind, and condensation behind the cladding: trapped vapour wets the insulation.',
        check:
          'A walk around the silo, looking closely at the join with the roof, where pipes pass through, and the flashing at the foot.',
        care: 'A touch of paint, fixings changed, a panel tightened. No more than a farm shed, except that water behind it costs more.',
      },
    ),
    tip: l(
      'Sa couleur sombre n’y change presque rien : la chaleur à retenir vient de l’intérieur, et le soleil d’hiver n’est pas une source qui compte ici.',
      'Its dark colour makes hardly any difference: the heat to keep comes from inside, and the winter sun is not a source that counts here.',
    ),
    design: l(
      'Mettre deux aciers et un isolant entre eux, c’est séparer deux métiers : l’un retient la pierre à chaud, l’autre retient la pluie à froid. Ni l’un ni l’autre n’a à faire le travail de l’autre.',
      'Two steels with insulation between them separate two jobs: one holds the stone when hot, the other holds off the rain when cold. Neither has to do the other’s work.',
    ),
  },
  {
    id: 'storage-bed',
    scene: 'silo',
    category: 'structure',
    name: l('Le lit de pierre', 'The storage bed'),
    short: lf(
      'Environ 2 000 t de pierre ollaire concassée, pas de sable : {heatFull} MWh au-dessus de l’ambiante (dérivé) et une coupe colorée par le modèle.',
      'About 2,000 t of crushed soapstone, no sand: {heatFull} MWh above ambient (derived), in a section coloured live by the model.',
    ),
    description: lf(
      'Voici le cœur de la machine, et il ne contient pas de sable : environ 2 000 t de pierre ollaire concassée, sous-produit d’une usine de poêles. Selon le modèle du constructeur, le lit fait 14 m de large sur 6 m de haut, soit {bedVolume} m³ à {bulkDensity} kg/m³ (dérivé). À 400 °C de moyenne, il tient {heatFull} MWh au-dessus de 10 °C (dérivé), et le constructeur annonce jusqu’à 100 MWh, soit {share100} % (dérivé), sans dire à quelle puissance. **Une capacité n’a de sens qu’à une puissance donnée.** Le modèle en rend {usable} MWh à 1 MW ({shareUsable} %), puis {tail} MWh à puissance décroissante ({shareTail} %), et {stays} MWh restent dans la pierre ({shareStays} %), trop froids pour chauffer l’eau du réseau (résultat du modèle). L’écart avec 100 MWh tient à la taille des soufflantes, qui n’est publiée nulle part.',
      'Here is the heart of the machine, and there is no sand in it: about 2,000 t of crushed soapstone, a by-product of a stove factory. In the maker’s own model the bed is 14 m wide and 6 m deep, so {bedVolume} m³ at {bulkDensity} kg/m³ (derived). At a mean of 400 °C it holds {heatFull} MWh above 10 °C (derived), and the maker quotes up to 100 MWh, which is {share100}% (derived), without saying at what power. **A capacity only means something at a given power.** The model gets {usable} MWh out at 1 MW ({shareUsable}%), then {tail} MWh at falling power ({shareTail}%), and {stays} MWh stay in the stone ({shareStays}%), too cold to heat the network’s water (model result). The gap with 100 MWh comes down to the size of the blowers, which is published nowhere.',
    ),
    material: l(
      'Pierre ollaire concassée (masse volumique du solide mesurée : 3 140 kg/m³)',
      'Crushed soapstone (density of the solid, measured: 3,140 kg/m³)',
    ),
    specs: [
      sp('Masse', 'Mass', l('environ 2 000 t, en 40 camions', 'about 2,000 t, in 40 trucks')),
      sp('Dimensions', 'Size', l('14 m × 6 m, dans le modèle du constructeur', '14 m × 6 m, in the maker’s own model')),
      sp('Volume, masse volumique', 'Volume, bulk density', tf('derived', '{bedVolume} m³, {bulkDensity} kg/m³')),
      sp('Moyenne à pleine charge', 'Mean at full charge', l('environ 400 °C', 'about 400 °C')),
      sp('Chaleur au-dessus de 10 °C', 'Heat above 10 °C', tf('derived', '{heatFull} MWh')),
      sp(
        'Capacité annoncée',
        'Quoted capacity',
        l('jusqu’à 100 MWh, à une puissance non dite', 'up to 100 MWh, at a power not stated'),
      ),
      sp(
        'Rendu à 1 MW',
        'Given at 1 MW',
        tf(
          'model',
          '{usable} MWh ; de {rangeLow} à {rangeHigh} MWh selon les estimations',
          '{usable} MWh; {rangeLow} to {rangeHigh} MWh across the estimates',
        ),
      ),
      sp(
        'À la demande d’hiver',
        'At winter demand',
        tf('model', '{usableWinter} MWh, {daysWinter} jours', '{usableWinter} MWh, {daysWinter} days'),
      ),
      sp(
        'Demi-vie au repos',
        'Half-life at rest',
        tf(
          'model',
          '{halfHeat} jours pour la chaleur, {halfUsable} jours pour le plein régime',
          '{halfHeat} days for the heat, {halfUsable} days for full power',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Rien ne tourne, rien ne s’use visiblement : la pierre se tasse un peu, ce qui crée un vide sous l’isolant du dessus, et elle pourrait s’agglomérer, ce que le modèle ignore. Le risque réel est ailleurs : de l’eau sur une pierre chaude devient de la vapeur, d’un coup.',
        check:
          'On ne regarde pas dedans, on lit les cannes de température : un point qui ne suit plus ses voisins dit qu’un tube ou une zone a un problème.',
        care: 'Le constructeur annonce des tubes sans entretien et une durée de vie de plus de 30 ans. Cette chaleur ne se voit pas : pierre, air et gaines restent dangereux des mois après l’arrêt, et personne n’ouvre rien à chaud.',
      },
      {
        failure:
          'Nothing turns, nothing visibly wears: the stone settles a little, which opens a gap under the top insulation, and it might cake together, which the model ignores. The real risk is elsewhere: water on hot stone turns to steam, all at once.',
        check:
          'Nobody looks inside, the temperature lances are read: a point that no longer follows its neighbours says a pipe or a zone has a problem.',
        care: 'The maker announces maintenance-free pipes and a life of over 30 years. This heat cannot be seen: stone, air and ducts stay dangerous months after a stop, and nobody opens anything while hot.',
      },
    ),
    tip: lf(
      'Les couleurs de la coupe sont une fausse couleur, en °C : à 400 °C, une pierre ne rougeoie pas. Il faudrait des soufflantes {blowerTimes} fois plus grosses pour que le modèle rende 100 MWh à 1 MW (résultat du modèle), et personne ne les a publiées.',
      'The colours of the section are false colour, in °C: stone at 400 °C does not glow. It would take blowers {blowerTimes} times larger for the model to give 100 MWh at 1 MW (model result), and nobody has published them.',
    ),
    design: lf(
      'Pourquoi le silo de 250 MWh annonce-t-il 2,5 fois plus à peu près à la même taille ? Le modèle trouve {ratioV} fois (résultat du modèle) : la masse y fait ×{factorMass}, le sommet de 100 K plus haut ×{factorTop}, le c(T) du sable ×{factorC}. Sa valeur absolue, {usableV} MWh, n’est pas retrouvée. Ce qui compte, c’est la course utilisable, et elle part d’un plancher fixé par l’air, pas de l’ambiante.',
      'Why does the 250 MWh silo quote 2.5 times as much at about the same size? The model finds {ratioV} times (model result): the mass gives ×{factorMass}, a top 100 K higher ×{factorTop}, sand’s c(T) ×{factorC}. Its absolute figure, {usableV} MWh, is not found. What counts is the usable swing, and it starts from a floor set by the air, not from ambient.',
    ),
    video: ['00:08'],
  },
  {
    id: 'pipe-field',
    scene: 'silo',
    category: 'mechanical',
    name: l('Le champ de tubes', 'The pipe field'),
    short: lf(
      'Des centaines de branches enfouies, sans entretien selon le constructeur. Le tracé est secret : le nôtre vient d’un calcul (estimation).',
      'Hundreds of buried legs, free of maintenance, says the maker. The layout is secret: ours comes from a sizing exercise (estimate).',
    ),
    description: lf(
      'L’air ne touche jamais la pierre : il passe dans des tubes d’inox enfouis, qui la chauffent, puis lui reprennent la chaleur. Le constructeur garde le tracé secret. Le labo dessine donc des tubes en U génériques, dimensionnés par un exercice de physique : au pas de {pitch} m (estimation) et {pipeRadiusMm} mm de rayon (estimation), cela donne {legs} branches et {pipeKm} km de tube (résultat du modèle). À 1 MW, {dropK} K se perdent dans la pierre entre le tube et la moyenne de la cellule (résultat du modèle). Au pas de 1 m, le modèle ne tient plus 1 MW à 400 °C, et au pas de {pitch} m, chaque changement de pas compte : {usablePitch04} MWh à 0,4 m, {usablePitch06} MWh à 0,6 m, à 1 MW (résultat du modèle). C’est un des deux réglages inconnus qui pèsent le plus.',
      'The air never touches the stone: it runs through buried stainless pipes that warm it and later take the heat back. The maker keeps the layout secret. So the lab draws generic U-pipes, sized by a physics exercise: at a pitch of {pitch} m (estimate) and a radius of {pipeRadiusMm} mm (estimate), that gives {legs} legs and {pipeKm} km of pipe (model result). At 1 MW, {dropK} K are lost in the stone between the pipe and the cell’s mean (model result). At a pitch of 1 m the model can no longer hold 1 MW at 400 °C, and around {pitch} m every change counts: {usablePitch04} MWh at 0.4 m, {usablePitch06} MWh at 0.6 m, at 1 MW (model result). It is one of the two unknown settings that weigh most.',
    ),
    material: l(
      'Tube d’inox (acier inoxydable selon les sources ; nuance non publiée)',
      'Stainless steel pipe (stainless according to the sources; grade not published)',
    ),
    specs: [
      sp('Tracé réel', 'Real layout', l('non publié', 'not published')),
      sp('Pas', 'Pitch', tf('estimate', '{pitch} m, à maille carrée', '{pitch} m, on a square grid')),
      sp('Branches, longueur', 'Legs, length', tf('model', '{legs} branches, {pipeKm} km', '{legs} legs, {pipeKm} km')),
      sp('Chute dans la pierre à 1 MW', 'Drop in the stone at 1 MW', tf('model', '{dropK} K')),
      sp(
        'Chemins d’air',
        'Air paths',
        tf(
          'model',
          '{paths} en parallèle, {legsPerPath} branches en série',
          '{paths} in parallel, {legsPerPath} legs in series',
        ),
      ),
      sp(
        'Vitesse d’air à plein débit',
        'Air speed at full flow',
        tf('estimate', 'environ {airSpeed} m/s', 'about {airSpeed} m/s'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une fuite ou une fissure de soudure après des milliers de dilatations : on ne la répare pas sous la pierre. C’est pourquoi on la teste avant de la recouvrir, et c’est ce que veut dire « sans entretien ».',
        check:
          'Une zone qui ne chauffe plus comme ses voisines, une perte de pression dans la boucle d’air. On condamne alors ce chemin d’air depuis le collecteur, sans creuser.',
        care: 'Aucun en service, si l’épreuve du champ a été faite à la pose. Une boucle fermée garde aussi l’air sec et propre, donc les tubes.',
      },
      {
        failure:
          'A leak or a cracked weld after thousands of expansions: it cannot be repaired under the stone. That is why it is tested before it is buried, and what “maintenance-free” really means.',
        check:
          'A zone that no longer warms like its neighbours, a loss of pressure in the air loop. That air path is then shut off from the header, with no digging.',
        care: 'None in service, if the field was proof-tested when laid. A closed loop also keeps the air dry and clean, and so the pipes.',
      },
    ),
    tip: l(
      'Ouvrez ce champ pour entrer dans une cellule : c’est à l’échelle d’un tube que l’on comprend pourquoi la chaleur met tant de temps.',
      'Open this field to step into one cell: it is at the scale of one pipe that you understand why the heat takes so long.',
    ),
    design: lf(
      'La chaleur se traîne dans la pierre, donc on va la chercher partout : le pas est fixé par la conduction du lit, et non par l’air. Un pas serré coûte plus de tube mais rend plus de puissance : {usablePitch04} MWh contre {usablePitch06} MWh pour 20 cm de différence (résultat du modèle).',
      'Heat crawls through stone, so it has to be fetched everywhere: the pitch is set by the conduction of the bed, not by the air. A tight pitch costs more pipe but gives more power: {usablePitch04} MWh against {usablePitch06} MWh for 20 cm of difference (model result).',
    ),
  },
  {
    id: 'top-insulation',
    scene: 'silo',
    category: 'structure',
    name: l('Isolation du dessus', 'Top insulation'),
    short: lf(
      'Environ {topInsulation} m (estimation) entre la pierre chaude et l’étage : la seule couche que tous les tubes traversent.',
      'About {topInsulation} m (estimate) between the hot stone and the floor above: the one layer every pipe crosses.',
    ),
    description: lf(
      'Par-dessus la pierre, le modèle pose {topInsulation} m d’isolant à {lambda} W/m·K (estimation), le double de ce qu’il met au sol et aux parois, car ici tous les tubes passent. Le lit lui-même ne connaît pas la convection, mais au-dessus, tout vide laissé par le tassement fait une poche d’air qui transporte la chaleur vers le haut. L’isolant du dessus doit donc suivre la pierre qui descend, et reposer sur elle sans laisser d’espace. Il sépare aussi deux mondes : au-dessous {coreFull} °C au cœur à pleine charge (résultat du modèle), au-dessus, selon notre lecture, un local où des gens travaillent.',
      'On top of the stone, the model lays {topInsulation} m of insulation at {lambda} W/m·K (estimate), twice what it puts under the bed or in the walls, because all the pipes pass through here. The bed itself knows no convection, but above it any gap left by settling makes a pocket of air that carries heat upward. So the top insulation has to follow the stone as it sinks, resting on it with no space left. It also separates two worlds: below, {coreFull} °C at the core at full charge (model result); above, on our reading, a room where people work.',
    ),
    material: l(
      'Non publié : un isolant léger, en vrac ou en panneaux, posé sur la pierre',
      'Not published: a light insulation, loose or in panels, laid on the stone',
    ),
    specs: [
      sp('Épaisseur', 'Thickness', tf('estimate', '{topInsulation} m')),
      sp('Conductivité', 'Conductivity', tf('estimate', '{lambda} W/m·K')),
      sp(
        'Ponts thermiques',
        'Thermal bridges',
        tf(
          'model',
          'environ {bridgeWK} W/K par les tubes, {restWK} W/K pour tout le reste',
          'about {bridgeWK} W/K through the pipes, {restWK} W/K for all the rest',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Le tassement de la pierre ouvre un vide sous l’isolant, l’air s’y met à circuler autour des tubes, et le plancher de l’étage se réchauffe.',
        check:
          'Le sol de l’étage à la caméra thermique, surtout autour des traversées ; une tache chaude désigne l’endroit.',
        care: 'On peut ajouter de l’isolant par le haut sans vider le silo, car c’est la seule couche encore accessible.',
      },
      {
        failure:
          'Settling stone opens a gap under the insulation, air starts moving around the pipes, and the floor above warms up.',
        check:
          'The floor upstairs through a thermal camera, above all around the crossings; a warm patch points to the spot.',
        care: 'Insulation can be added from above without emptying the silo, as this is the one layer still within reach.',
      },
    ),
    tip: l(
      'Posé après le remplissage, jamais avant : il n’y a pas d’isolant de toit sans pierre pour le porter.',
      'Laid after filling, never before: there is no top insulation without stone to carry it.',
    ),
    design: lf(
      'Pourquoi un mètre en haut quand le mur n’a que {wallInsulation} m (estimation) ? Parce que la hauteur est moins chère que le diamètre : le constructeur annonce 15 m de large au total, mais rien n’empêche d’épaissir le dessus. C’est une hypothèse raisonnable du modèle, jamais une cote publiée.',
      'Why a metre at the top when the wall has only {wallInsulation} m (estimate)? Because height is cheaper than diameter: the maker quotes 15 m of overall width, but nothing stops the top being thicker. It is a reasonable choice in the model, never a published dimension.',
    ),
  },
  {
    id: 'equipment-floor',
    scene: 'silo',
    category: 'structure',
    name: l('L’étage technique', 'The equipment floor'),
    short: l(
      'Notre lecture : l’équipement sur un plancher sous le toit, juste au-dessus de la pierre. Aucune source ne le dessine.',
      'Our reading: the equipment on a deck under the roof, directly above the stone. No source draws it.',
    ),
    description: lf(
      'Ce plancher est une lecture, et nous la disons telle quelle. Quatre indices y conduisent : un documentaire tourné sur place montre l’ingénieur parmi les résistances, la soufflante et l’échangeur, avec la pierre sous ses pieds ; une photo du constructeur montre deux tuyaux qui descendent de haut sur la paroi ; un de ses schémas met la boucle au-dessus du lit, et il insiste sur des gaines courtes. Surtout, un lit de 6 m dans une structure de 13 m laisse bien 7 m à expliquer. Le labo y place un plancher d’environ {deckAcross} m avec {floorStack} m de hauteur libre (estimation). L’autre disposition existe : le silo de 250 MWh a un bâtiment technique séparé. Pour le modèle, cela ne change que la longueur des gaines. Cliquez pour y entrer.',
      'This floor is a reading, and we say so plainly. Four clues lead to it: a documentary filmed on site shows the engineer among the resistors, the blower and the exchanger, with the stone under his feet; a photo from the maker shows two pipes coming down from high on the wall; one of its diagrams has the loop above the bed, and it insists on short ducts. Above all, a 6 m bed in a 13 m structure leaves a good 7 m to explain. The lab puts a deck about {deckAcross} m across there, with {floorStack} m of clear height (estimate). The other layout exists: the 250 MWh silo has a separate technical building. To the model, it changes only the length of the ducts. Click to step inside.',
    ),
    material: l('Charpente et plancher d’acier', 'Steel frame and deck'),
    specs: [
      sp('Statut', 'Status', l('notre lecture d’un film et d’une photo', 'our reading of a film and a photo')),
      sp('Plancher', 'Deck', tf('estimate', 'environ {deckAcross} m de large', 'about {deckAcross} m across')),
      sp('Hauteur libre', 'Clear height', tf('estimate', '{floorStack} m')),
      sp('Hauteur du toit', 'Height of the roof', tf('estimate', '{roofStack} m')),
      sp(
        'Dans le modèle',
        'In the model',
        l('compte seulement par la longueur des gaines', 'only counts through the length of the ducts'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'La chaleur qui s’accumule : un local fermé au-dessus de la pierre, avec des gaines chaudes et de l’électronique, peut monter assez haut pour que les appareils se déclenchent.',
        check:
          'La température du local au fil des saisons, et la ventilation haute ; les vibrations de la charpente quand les soufflantes tournent.',
        care: 'Ventilation dégagée, passages propres, garde-corps et accès contrôlés. On y travaille souvent machine en marche : la ronde reste courte et régulière.',
      },
      {
        failure:
          'Heat that builds up: a closed room above the stone, with hot ducts and electronics, can climb high enough for the equipment to trip.',
        check:
          'The room’s temperature through the seasons, and the high ventilation; the vibration of the frame while the blowers run.',
        care: 'Vents clear, walkways tidy, guard rails and controlled access. People often work here with the machine running: the rounds stay short and regular.',
      },
    ),
    tip: l(
      'Si le constructeur précise un jour où se trouve son équipement, ce plancher changera de statut, ou de place. C’est écrit pour cela.',
      'If the maker one day says where its equipment stands, this floor will change status, or place. That is why it is written this way.',
    ),
    design: l(
      'Mettre l’équipement sur la pierre, c’est raccourcir les gaines chaudes, donc les pertes, sans sortir de la silhouette du silo. Le constructeur dit tenir à des gaines courtes et bien isolées : ce choix va dans ce sens.',
      'Putting the equipment on top of the stone shortens the hot ducts, and so the losses, without leaving the silo’s outline. The maker says it cares about short, well-insulated ducts: this layout goes that way.',
    ),
  },
  {
    id: 'conical-roof',
    scene: 'silo',
    category: 'structure',
    name: l('Toit conique', 'Conical roof'),
    short: lf(
      'Un cône bas à moyeu central, vu sur les photos : il fait glisser la neige et couvre {roofStack} m de hauteur (estimation).',
      'A low cone with a central hub, seen on the photos: it sheds the snow and takes up {roofStack} m of height (estimate).',
    ),
    description: lf(
      'Sur les photographies, le silo porte un toit conique bas, avec un moyeu au centre. Sa pente fait glisser une partie de la neige ; la charpente doit tenir le reste, et il ne faut pas compter sur la pierre pour la faire fondre : l’isolant est là pour que sa chaleur n’arrive pas jusqu’ici. Le modèle lui accorde {roofStack} m de hauteur (estimation), ce qui complète l’empilement jusqu’aux 13 m annoncés. Aucune source n’en donne la charpente, et ce toit ne joue aucun rôle dans le modèle thermique, sinon qu’il garde le local au sec.',
      'On the photographs the silo wears a low conical roof with a hub in the middle. Its slope sheds some of the snow; the frame has to carry the rest, and the stone cannot be counted on to melt it: the insulation is there so that its heat never gets this far. The model allows it {roofStack} m of height (estimate), which brings the stack up to the quoted 13 m. No source gives its frame, and this roof plays no part in the thermal model, except for keeping the room dry.',
    ),
    material: l('Charpente et couverture d’acier', 'Steel frame and roofing'),
    specs: [
      sp(
        'Forme',
        'Shape',
        l('cône bas à moyeu central, vu sur des photos', 'low cone with a central hub, seen on photos'),
      ),
      sp('Hauteur', 'Height', tf('estimate', '{roofStack} m')),
      sp('Dans le modèle', 'In the model', l('sans rôle thermique', 'no thermal part')),
    ],
    maintenance: maint(
      {
        failure:
          'Une fuite au moyeu ou à une jonction de tôles : l’eau arrive sur l’équipement avant qu’on la voie. Une neige très lourde reste le cas de charge qui décide.',
        check:
          'Depuis l’étage, lampe à la main, après un dégel : traces au plafond, joints du moyeu. Dehors, on regarde, on ne monte pas sans raison.',
        care: 'Joints refaits de loin en loin, gouttières et solins dégagés.',
      },
      {
        failure:
          'A leak at the hub or a sheet joint: the water reaches the equipment before anyone sees it. Very heavy snow remains the load case that decides.',
        check:
          'From the floor below, torch in hand, after a thaw: marks on the ceiling, the hub’s seals. Outside, you look; you do not climb without a reason.',
        care: 'Seals renewed at long intervals, gutters and flashings kept clear.',
      },
    ),
    tip: l(
      'Un toit qui perd sa neige plus vite que le hangar voisin signale une fuite de chaleur : ici, l’hiver fait le travail d’une caméra thermique.',
      'A roof that loses its snow faster than the shed next door points to a heat leak: here, winter does the work of a thermal camera.',
    ),
    design: l(
      'Un cône bas enferme un plancher rond avec très peu de matière, et il renvoie l’eau loin du pied : c’est la solution la plus simple sur un cylindre de cette taille.',
      'A low cone encloses a round deck with very little material, and it throws the water away from the foot: the simplest answer on a cylinder of this size.',
    ),
  },
  {
    id: 'upper-vent',
    scene: 'silo',
    category: 'structure',
    name: l('Ouverture haute', 'Upper opening'),
    short: l(
      'Une ouverture haut sur la paroi, vue sur une photo. Nous la lisons comme la ventilation de l’étage technique.',
      'An opening high on the wall, seen on a photo. We read it as the ventilation of the equipment floor.',
    ),
    description: lf(
      'Une photographie montre une ouverture haut sur la paroi, sans légende. Nous y lisons la ventilation de l’étage technique : un local plein de moteurs, d’armoires et de gaines chaudes, juste au-dessus de la pierre, doit évacuer ce qui s’y accumule. Le modèle compte {auxKw} kW par MW pour l’automatisme et cette ventilation (estimation), et il suppose l’air du local à quinze degrés au-dessus de l’extérieur (estimation). Cette ouverture n’a aucun lien avec l’air des boucles, qui reste enfermé : deux airs se côtoient ici, et ils ne se mélangent jamais.',
      'One photograph shows an opening high on the wall, with no caption. We read it as the ventilation of the equipment floor: a room full of motors, cabinets and hot ducts, right above the stone, has to get rid of what builds up in it. The model counts {auxKw} kW per MW for the controls and this ventilation (estimate), and supposes the room’s air fifteen degrees above outside (estimate). This opening has nothing to do with the air in the loops, which stays shut in: two kinds of air live side by side here and never mix.',
    ),
    material: l('Grille d’acier, volet, grillage anti-oiseaux', 'Steel louvre, shutter, bird mesh'),
    specs: [
      sp('Vu', 'Seen', l('une ouverture haute, sur une photo', 'a high opening, on a photo')),
      sp('Fonction', 'Function', l('ventilation, selon notre lecture', 'ventilation, on our reading')),
      sp(
        'Automatisme et ventilation',
        'Controls and ventilation',
        tf('estimate', '{auxKw} kW par MW', '{auxKw} kW per MW'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un nid, de la neige poudreuse poussée par le vent, un volet coincé : le local chauffe, et l’électronique prend les premiers coups.',
        check:
          'De l’intérieur : le volet s’ouvre et se ferme, le grillage est propre, aucune trace d’humidité sous la grille.',
        care: 'Nettoyage du grillage, réglage du volet, joint refait avant l’hiver.',
      },
      {
        failure:
          'A nest, powder snow driven in by the wind, a stuck shutter: the room heats up, and the electronics take the first blows.',
        check: 'From inside: the shutter opens and closes, the mesh is clean, no trace of damp under the louvre.',
        care: 'The mesh cleaned, the shutter adjusted, the seal renewed before winter.',
      },
    ),
    tip: l(
      'Quand une observation dépasse ce que dit une photo, ce labo le signale : cette pièce-ci n’est qu’une hypothèse de lecture.',
      'When an observation goes beyond what a photo says, this lab flags it: this part is only a reading.',
    ),
    design: l(
      'Ventiler le local par le haut, c’est laisser l’air chaud sortir de lui-même : il monte, et la ventilation dépense moins. Le prix est une ouverture de plus à protéger de la neige.',
      'Venting the room from the top lets the warm air leave by itself: it rises, and the fans spend less. The price is one more opening to protect from the snow.',
    ),
  },
  {
    id: 'access-ladder',
    scene: 'silo',
    category: 'structure',
    name: l('Échelle à crinoline', 'Caged ladder'),
    short: l(
      'Le chemin de l’étage, vu sur une photo du constructeur : une montée quotidienne, à faire les mains libres.',
      'The way to the equipment floor, seen on a photo from the maker: a daily climb, to be made with free hands.',
    ),
    description: l(
      'Une échelle monte le long de la paroi sur une photographie du constructeur. Elle dit deux choses : quelque chose, là-haut, demande qu’on y vienne, et on y vient à pied. Sur 13 m de hauteur totale, l’échelle ne porte aucune pièce lourde : un équipement monte à la grue ou au palan, jamais sur l’épaule. Le modèle l’ignore ; pour un exploitant, c’est le premier risque de chaque visite.',
      'A ladder climbs the wall on a photograph from the maker. It says two things: something up there calls for a visit, and the visit is made on foot. Over 13 m of total height, the ladder carries no heavy part: equipment goes up by crane or hoist, never on a shoulder. The model ignores it; to an operator, it is the first risk of every visit.',
    ),
    material: l('Acier galvanisé, crinoline ou rail antichute', 'Galvanised steel, safety cage or fall-arrest rail'),
    specs: [
      sp('Vu', 'Seen', l('une échelle à crinoline, sur une photo', 'a caged ladder, on a photo')),
      sp(
        'Hauteur à servir',
        'Height to serve',
        l('jusqu’à l’étage, sous les 13 m du toit', 'up to the floor, under the 13 m of the roof'),
      ),
      sp('Charge', 'Load', l('une personne, les mains libres', 'one person, hands free')),
    ],
    maintenance: maint(
      {
        failure:
          'Un barreau corrodé, une fixation desserrée, du verglas : l’échelle lâche rarement, on en tombe plus souvent.',
        check:
          'À vue, barreau par barreau au début de chaque saison ; le système antichute selon ses propres règles de contrôle.',
        care: 'Galvanisation retouchée, fixations reprises, déneigement avant toute montée.',
      },
      {
        failure: 'A corroded rung, a loose fixing, ice: ladders seldom give way, but people fall from them more often.',
        check: 'By eye, rung by rung at the start of each season; the fall-arrest system by its own inspection rules.',
        care: 'Galvanising touched up, fixings redone, snow cleared before any climb.',
      },
    ),
    tip: l(
      'Les outils montent dans un sac hissé à la corde : sur une échelle, les deux mains servent à l’échelle.',
      'Tools go up in a bag hauled on a rope: on a ladder, both hands are for the ladder.',
    ),
    design: l(
      'Une échelle coûte moins qu’un escalier et prend moins de place sur un cylindre. Le choix se paie à chaque visite, et c’est un petit rappel qu’on ne vient là que par nécessité.',
      'A ladder costs less than a staircase and takes less room on a cylinder. The choice is paid for at every visit, a small reminder that nobody comes up here unless they must.',
    ),
  },
  {
    id: 'thermocouple-lance',
    scene: 'silo',
    category: 'electrical',
    name: l('Cannes de température', 'Temperature lances'),
    short: l(
      'Les seuls yeux dans la pierre : des sondes enfoncées à plusieurs hauteurs. Générique : aucune source ne les décrit.',
      'The only eyes in the stone: probes pushed in at several heights. Generic: no source describes them.',
    ),
    description: lf(
      'Une fois la pierre versée, plus personne ne voit l’intérieur. Il reste les températures : des thermocouples dans des doigts de gant, à plusieurs hauteurs et à plusieurs rayons. L’une des images du constructeur montre une coupe colorée entre 0 et 650 °C, qui suppose bien des mesures ou un calcul qui les prolonge, mais il n’en publie ni le nombre ni la place. Le labo en dessine une poignée. La coupe colorée, elle, vient du modèle (une grille de 10 anneaux sur 6 couches), pas de sondes. L’automate s’en sert pour dire quelle zone charger ou décharger, et quelle zone fermer quand elle approche sa limite.',
      'Once the stone is poured, nobody can see inside. Temperatures remain: thermocouples in thermowells, at several heights and radii. One of the maker’s images shows a section coloured between 0 and 650 °C, which implies plenty of measurements or a calculation extending them, but it publishes neither their number nor their place. The lab draws a handful. The coloured section, for its part, comes from the model (a grid of 10 rings by 6 layers), not from probes. The controller uses them to tell which zone to charge or discharge, and which to close as it nears its limit.',
    ),
    material: l(
      'Thermocouple sous gaine d’inox, doigt de gant, câble de compensation',
      'Stainless-sheathed thermocouple, thermowell, compensating cable',
    ),
    specs: [
      sp('Nombre réel', 'Real number', l('non publié', 'not published')),
      sp('Principe', 'Principle', l('une tension née entre deux métaux', 'a voltage born between two metals')),
      sp('Échelle de la coupe du constructeur', 'Scale of the maker’s section', l('de 0 à 650 °C', '0 to 650 °C')),
      sp('Grille du modèle', 'The model’s grid', tf('model', '10 anneaux sur 6 couches', '10 rings by 6 layers')),
    ],
    maintenance: maint(
      {
        failure:
          'Une sonde qui dérive ou un fil qui casse : pire que pas d’alarme, un chiffre plausible et faux. L’automate conduit alors une zone sur une fausse température.',
        check:
          'Comparez une sonde à ses voisines lors d’un long repos, quand les écarts devraient se réduire : celle qui s’en écarte ment.',
        care: 'Grâce au doigt de gant, une sonde se remplace par le haut, sans toucher à la pierre : c’est l’astuce qui rend cette machine exploitable sur 30 ans.',
      },
      {
        failure:
          'A drifting probe or a broken wire: worse than no alarm, a plausible and false figure. The controller then runs a zone on a false temperature.',
        check:
          'Compare a probe with its neighbours during a long rest, when the gaps should close: the one that strays is lying.',
        care: 'Thanks to the thermowell, a probe is replaced from above, without touching the stone: the trick that makes this machine workable over 30 years.',
      },
    ),
    tip: l(
      'Ne confondez pas la coupe colorée et une mesure : elle sort du modèle, et les vraies sondes ne la verraient qu’en quelques points.',
      'Do not mistake the coloured section for a measurement: it comes from the model, and real probes would see it at only a few points.',
    ),
    design: l(
      'Dans un stock qu’on ne peut ni ouvrir ni pencher, tout le pilotage repose sur ces quelques chiffres. Les mettre dans un doigt de gant soudé plutôt que directement dans la pierre : c’est ce qui fait qu’une panne de sonde reste une petite panne.',
      'In a store you can neither open nor tip, the whole of the control rests on these few figures. Putting them in a welded thermowell rather than straight in the stone is what makes a probe failure stay a small failure.',
    ),
  },
  {
    id: 'duct-penetration',
    scene: 'silo',
    category: 'mechanical',
    name: l('Traversée de l’isolation', 'Insulation penetration'),
    short: lf(
      'Là où les tubes traversent l’isolant du dessus, le point faible : {bridgeWK} W/K à eux tous (résultat du modèle).',
      'Where the pipes cross the top insulation, the weak spot: {bridgeWK} W/K between them (model result).',
    ),
    description: lf(
      'Un isolant n’est bon que là où rien ne le traverse. Ici, tout le champ de tubes le traverse, et chaque branche d’acier est un petit pont thermique. Le modèle les compte tous : environ {bridgeWK} W/K, contre {restWK} W/K pour le reste du silo (résultat du modèle), un dixième environ, pas négligeable. Ces traversées doivent aussi laisser glisser le tube, qui s’allonge d’environ {growCm} cm à chaque grande chauffe (dérivé) : un fourreau, un garnissage souple, et aucune soudure entre le tube et le plancher. Le constructeur n’en dit rien : la forme dessinée est la nôtre. Son principe, lui, se retrouve partout où une conduite chaude traverse une paroi.',
      'Insulation is only good where nothing crosses it. Here the whole pipe field crosses it, and each leg of steel is a small thermal bridge. The model counts them all: about {bridgeWK} W/K against {restWK} W/K for the rest of the silo (model result), about a tenth, not negligible. These crossings must also let the pipe slide, as it grows about {growCm} cm at each big heating (derived): a sleeve, a flexible packing, and no weld between pipe and deck. The maker says nothing of them: the shape drawn is ours. The principle, though, turns up wherever a hot pipe crosses a wall.',
    ),
    material: l(
      'Fourreau d’acier, garnissage fibreux haute température',
      'Steel sleeve, high-temperature fibrous packing',
    ),
    specs: [
      sp(
        'Pont thermique',
        'Thermal bridge',
        tf('model', 'environ {bridgeWK} W/K à eux tous', 'about {bridgeWK} W/K between them'),
      ),
      sp('Reste du silo', 'Rest of the silo', tf('model', '{restWK} W/K')),
      sp('Allongement à loger', 'Growth to allow', tf('derived', 'environ {growCm} cm', 'about {growCm} cm')),
      sp('Forme', 'Shape', l('la nôtre : non publiée', 'ours: not published')),
    ],
    maintenance: maint(
      {
        failure:
          'Le garnissage qui se tasse ou sort de son logement : de l’air chaud remonte le long du tube, et l’étage se réchauffe en un point précis.',
        check:
          'La caméra thermique, depuis l’étage, rangée par rangée, juste après une longue charge : c’est là que les traversées se trahissent.',
        care: 'Repli et remplacement du garnissage par le dessus : ces traversées sont l’une des seules parties du lit qu’on peut encore atteindre.',
      },
      {
        failure:
          'The packing settles or slips out of its seat: hot air climbs along the pipe, and the floor warms at one exact spot.',
        check:
          'The thermal camera, from the floor above, row by row, just after a long charge: that is when the crossings give themselves away.',
        care: 'Packing folded back and replaced from above: these crossings are among the few parts of the bed still within reach.',
      },
    ),
    tip: l(
      'En isolation, on ne perd pas la chaleur là où l’isolant est mauvais, mais là où il est interrompu : cette pièce le montre mieux que toutes les autres.',
      'In insulation, heat is lost not where the insulant is poor but where it is interrupted: this part shows it better than any other.',
    ),
    design: l(
      'Moins de branches ferait moins de ponts, mais la conduction de la pierre impose le pas : c’est un compromis subi, et l’on préfère soigner les traversées plutôt que d’espacer les tubes.',
      'Fewer legs would mean fewer bridges, but the stone’s conduction sets the pitch: it is a forced compromise, and better to take care of the crossings than to space the pipes further apart.',
    ),
  },
];
