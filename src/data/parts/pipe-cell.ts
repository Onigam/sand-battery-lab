// Parts of the `pipe-cell` world (ids frozen in src/data/ids.ts): a block of bed around a few pipes, magnified, and the two media side by side. The pipes are GENERIC U-pipes sized by a
// physics exercise: the maker keeps its layout secret, so the U, the spacer, the header and the loop are ours, each said so. The zones are REPORTED as a principle
// (core charged first, discharged from the outside); their radii are ours. Soapstone's c and bed k are the weakest figures of the lab, and its sheet says so.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, tf } from '../part-helpers';

export const PIPE_CELL_PARTS: PartInfo[] = [
  {
    id: 'heat-pipe',
    scene: 'pipe-cell',
    category: 'mechanical',
    name: l('Tube d’échange', 'Heat-transfer pipe'),
    short: l(
      'De l’air dedans, de la pierre autour, jamais de mélange : tout l’échange de chaleur du silo passe par sa paroi d’acier.',
      'Air inside, stone outside, never mixing: all the silo’s heat exchange passes through its steel wall.',
    ),
    description: lf(
      'L’air court dans le tube à environ {airSpeed} m/s à plein débit (estimation), et la paroi d’acier ne laisse passer que la chaleur. Sa résistance est négligeable : ce qui freine, c’est la pierre autour. Le temps propre d’une cellule est d’environ {cellHours} h (résultat du modèle) : assez court devant une charge de plusieurs jours, assez long pour qu’une bouffée d’heures bon marché ne pénètre pas loin. Le constructeur parle de tubes d’inox dans une boucle fermée ; son brevet revendique l’azote comme gaz préféré, mais ses installations tournent à l’air. Avec {pipeRadiusMm} mm de rayon et {pipeWallMm} mm de paroi (estimation), ce tube sort d’un calcul, pas d’un plan.',
      'The air runs through the pipe at about {airSpeed} m/s at full flow (estimate), and the steel wall lets only the heat through. Its resistance is negligible: what holds things back is the stone around it. A cell’s own time constant is about {cellHours} h (model result): short against a charge of several days, long enough that a burst of cheap hours does not reach far. The maker speaks of stainless pipes in a closed loop; its patent claims nitrogen as the preferred gas, but its plants run on air. At {pipeRadiusMm} mm of radius and {pipeWallMm} mm of wall (estimate), this pipe comes from a calculation, not a plan.',
    ),
    material: l('Tube d’inox (nuance non publiée)', 'Stainless steel pipe (grade not published)'),
    specs: [
      sp('Rayon extérieur', 'Outer radius', tf('estimate', '{pipeRadiusMm} mm')),
      sp('Paroi', 'Wall', tf('estimate', '{pipeWallMm} mm')),
      sp('Pas', 'Pitch', tf('estimate', '{pitch} m')),
      sp(
        'Vitesse d’air',
        'Air speed',
        tf('estimate', 'environ {airSpeed} m/s à plein débit', 'about {airSpeed} m/s at full flow'),
      ),
      sp(
        'Temps propre de la cellule',
        'Cell time constant',
        tf('model', 'environ {cellHours} h', 'about {cellHours} h'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une fissure de fatigue, à la longue, sous l’effet des dilatations. Un tube percé ne fait pas de drame : il laisse de l’air sortir de la boucle dans la pierre et un peu de poussière y entrer.',
        check:
          'La boucle d’air perd de la pression, et une zone perd de la puissance. C’est le seul indice : personne n’ira voir.',
        care: 'Aucun : le constructeur annonce ses tubes sans entretien. Le travail se fait avant : qualité des soudures, épreuve à la pression, et propreté à la pose.',
      },
      {
        failure:
          'A fatigue crack in the long run, from the expansions. A holed pipe is no drama: it lets air out of the loop into the stone and a little dust in.',
        check: 'The air loop loses pressure, and a zone loses power. That is the only clue: nobody will go and look.',
        care: 'None: the maker announces its pipes as maintenance-free. The work is done beforehand: quality welds, a proof test, and cleanliness when laid.',
      },
    ),
    tip: l(
      'L’air et la pierre ne se touchent jamais : c’est pourquoi l’échangeur et les soufflantes restent à l’abri de la poussière de la pierre.',
      'The air and the stone never touch: that is why the exchanger and the blowers stay safe from the dust of the stone.',
    ),
    design: lf(
      'Pourquoi ne pas souffler l’air directement dans la pierre ? Il y laisserait de la pression, ramènerait de la poussière, et il faudrait des débits énormes. Un tube fermé coûte {dropK} K de chute à 1 MW (résultat du modèle), mais il garde tout le reste propre et simple.',
      'Why not blow the air straight through the stone? It would lose pressure there, bring dust back, and take huge flows. A closed pipe costs {dropK} K of drop at 1 MW (model result), but it keeps everything else clean and simple.',
    ),
  },
  {
    id: 'return-bend',
    scene: 'pipe-cell',
    category: 'mechanical',
    name: l('Coude de retour', 'Return bend'),
    short: l(
      'Il retourne l’air au fond du U : c’est grâce à lui que le tube pend librement et qu’il s’allonge sans contrainte.',
      'It turns the air round at the bottom of the U: thanks to it the pipe hangs free and grows without strain.',
    ),
    description: lf(
      'Ce coude au fond du lit peut paraître un détail : c’est lui qui justifie la forme en U. Avec les deux extrémités au sommet, le tube pend depuis le dessus et grandit librement vers le bas. Pas de point fixe sous 2 000 t de pierre, et aucun passage à faire dans le fond de la virole. Le U reste notre lecture : le constructeur ne publie pas de tracé, et son brevet parle seulement de tubes verticaux. Dans le modèle, chaque coude compte pour environ trois quarts de hauteur dynamique de pression (estimation), une broutille face au reste de la boucle.',
      'This bend at the bottom of the bed may look like a detail: it is what justifies the U shape. With both ends at the top, the pipe hangs from above and grows freely downwards. No fixed point under 2,000 t of stone, and no passage to make through the floor of the shell. The U remains our reading: the maker publishes no layout, and its patent speaks only of vertical pipes. In the model each bend counts for about three quarters of a velocity head of pressure (estimate), a trifle against the rest of the loop.',
    ),
    material: l(
      'Coude d’inox soudé, assez doux pour ne pas freiner l’air',
      'Welded stainless bend, gentle enough not to brake the air',
    ),
    specs: [
      sp('Forme', 'Shape', l('un U, notre lecture', 'a U, our reading')),
      sp(
        'Perte de charge',
        'Pressure loss',
        tf('estimate', 'environ trois quarts de hauteur dynamique', 'about three quarters of a velocity head'),
      ),
      sp('Accès après pose', 'Access once laid', l('aucun', 'none')),
    ],
    maintenance: maint(
      {
        failure:
          'La soudure qui lâche au point le plus inaccessible du silo. C’est aussi le point bas, donc celui où finit toute poussière ou tout condensat de la boucle.',
        check:
          'Avant le remplissage, et seulement à ce moment-là : contrôle de la soudure et épreuve de chaque chemin d’air.',
        care: 'Aucun en service.',
      },
      {
        failure:
          'A weld that gives way at the least accessible point of the silo. It is also the low point, so where any dust or condensate of the loop ends up.',
        check: 'Before filling, and only then: a weld inspection and a proof test of each air path.',
        care: 'None in service.',
      },
    ),
    tip: l(
      'Quand vous verrez le U en éclaté, repérez ce qu’il n’a pas : aucun support, aucune sortie, aucun capteur à l’aplomb du coude. Tout passe par le haut.',
      'When you see the U exploded, note what it lacks: no support, no outlet, no sensor down at the bend. Everything goes through the top.',
    ),
    design: l(
      'Faire passer une soudure sous la pierre est une décision grave : on l’évite partout ailleurs. Ce coude est le seul endroit où le choix du U l’impose, et le gain vaut ce risque : aucun tube ne traverse le fond.',
      'Putting a weld under the stone is a serious decision: it is avoided everywhere else. This bend is the one place the U makes it unavoidable, and the gain is worth the risk: no pipe crosses the floor.',
    ),
  },
  {
    id: 'pipe-spacer',
    scene: 'pipe-cell',
    category: 'structure',
    name: l('Entretoise de tubes', 'Pipe spacer'),
    short: lf(
      'Elle tient le pas de {pitch} m (estimation) pendant que la pierre tombe : sans elle, les tubes finissent là où les camions les poussent.',
      'It holds the {pitch} m pitch (estimate) while the stone pours in: without it the pipes end up wherever the trucks push them.',
    ),
    description: lf(
      'Des centaines de tubes d’inox, posés avant 40 camions de pierre, sans rien pour les guider : ils finiraient serrés d’un côté, écartés de l’autre. L’entretoise leur donne une grille à respecter le temps du remplissage. Elle a une exigence de plus : le tube doit rester libre de glisser dedans pour s’allonger d’environ {growCm} cm à chaud (dérivé). Elle est perdue ensuite, et reste enfouie pour toute la vie du silo. Aucune source ne la décrit : nous la dessinons parce que sans elle, ce tracé ne tient pas debout. Une erreur de pas se paie cher : d’après le modèle, passer de {pitch} m (estimation) à 0,6 m fait tomber la capacité à 1 MW de {usable} à {usablePitch06} MWh (résultat du modèle).',
      'Hundreds of stainless pipes, set in place before 40 trucks of stone, with nothing to guide them: they would end up crowded on one side and spread on the other. The spacer gives them a grid to keep to during filling. It has one more requirement: the pipe must stay free to slide in it, growing about {growCm} cm when hot (derived). It is then lost, buried for the life of the silo. No source describes it: we draw it because without it this layout does not hold up. A mistake in the pitch costs dearly: in the model, going from {pitch} m (estimate) to 0.6 m drops the capacity at 1 MW from {usable} to {usablePitch06} MWh (model result).',
    ),
    material: l('Profilés d’acier ajourés (notre lecture)', 'Open-work steel sections (our reading)'),
    specs: [
      sp('Rôle', 'Role', l('tenir le pas pendant le remplissage', 'hold the pitch during filling')),
      sp('Pas à tenir', 'Pitch to hold', tf('estimate', '{pitch} m')),
      sp(
        'Jeu à laisser',
        'Play to leave',
        tf('derived', 'environ {growCm} cm de glissement', 'about {growCm} cm of sliding'),
      ),
      sp('Source', 'Source', l('aucune : notre lecture', 'none: our reading')),
    ],
    maintenance: maint(
      {
        failure:
          'Une entretoise qui cède au remplissage : deux tubes se touchent, une zone a une cellule trop dense et une trop lâche. Cela se voit après coup, dans le champ de températures.',
        check:
          'Relevé de la grille avant le premier camion, puis à chaque niveau de remplissage tant qu’on peut encore la voir.',
        care: 'Aucun : pièce perdue. Tout se joue à la pose et dans la façon de verser.',
      },
      {
        failure:
          'A spacer that gives way during filling: two pipes touch, a zone gets one cell too dense and one too loose. It shows afterwards, in the field of temperatures.',
        check:
          'A survey of the grid before the first truck, then at each level of the filling for as long as it can still be seen.',
        care: 'None: a sacrificed part. It all comes down to how it is fitted and how the stone is poured.',
      },
    ),
    tip: l(
      'Une pierre qui tombe se trie toute seule : les gros grains roulent plus loin que les fins. Verser au centre ou en pluie change le lit, et le pas ne suffit pas à tout rattraper.',
      'Think of how falling stone sorts itself: big grains roll further than fine ones. Pouring at the centre or as a rain changes the bed, and the pitch alone cannot make up for it all.',
    ),
    design: l(
      'Une pièce sans fonction en service, qu’on abandonne dans le lit : c’est typique d’une construction où le montage décide autant que le fonctionnement. Le guide de montage lui donne sa propre étape pour cette raison.',
      'A part with no function in service, abandoned in the bed: typical of a build in which the erection decides as much as the operation. The assembly guide gives it a step of its own for this reason.',
    ),
  },
  {
    id: 'branch-header',
    scene: 'pipe-cell',
    category: 'mechanical',
    name: l('Collecteur de branche', 'Branch header'),
    short: l(
      'Il distribue l’air à une rangée de tubes et ouvre ou ferme une zone : c’est par lui qu’on choisit où va la chaleur.',
      'It feeds a row of pipes and opens or closes a zone: this is how you choose where the heat goes.',
    ),
    description: lf(
      'Au-dessus du lit, les têtes de tubes se regroupent par rangées sur un collecteur. Dans le modèle, le champ forme {paths} chemins d’air en parallèle de {legsPerPath} branches en série (résultat du modèle). Chaque chemin doit avoir la même résistance : sinon, l’air choisit le plus facile et le voisin reste froid. Le principe des zones est rapporté : on charge par le cœur et on décharge par l’extérieur. En revanche, le fait que chaque zone puisse se brancher à l’un ou l’autre circuit est une hypothèse : le pilote changeait une boucle avec des vannes, mais un réseau sans interruption ne peut pas attendre la fin d’une charge. Si le constructeur la contredit, une soufflante disparaît.',
      'Above the bed the pipe heads are gathered in rows onto a header. In the model the field forms {paths} parallel air paths of {legsPerPath} legs in series (model result). Each path must have the same resistance: otherwise the air takes the easiest and its neighbour stays cold. The principle of zones is reported: charge through the core, discharge from the outside. On the other hand, that each zone can connect to either loop is an assumption: the pilot swapped one loop with valves, but a network without interruption cannot wait for a charge to end. If the maker contradicts this, one blower goes away.',
    ),
    material: l('Tube d’inox de plus gros diamètre, sous isolant', 'Larger stainless pipe, under insulation'),
    specs: [
      sp('Chemins d’air', 'Air paths', tf('model', '{paths} en parallèle', '{paths} in parallel')),
      sp('Branches en série', 'Legs in series', tf('model', '{legsPerPath} par chemin', '{legsPerPath} per path')),
      sp('Zones', 'Zones', l('principe rapporté : cœur, milieu, extérieur', 'reported principle: core, middle, outer')),
      sp(
        'Charge et décharge ensemble',
        'Charge and discharge at once',
        l('hypothèse du labo, sur des zones différentes', 'an assumption of the lab, on different zones'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une mauvaise répartition : une rangée trop facile prend le débit et les autres chauffent mal. Ou une fuite à une soudure de collecteur, qu’on entend bien mieux qu’on ne la voit.',
        check:
          'À l’étage, comparez les températures de retour de chaque rangée : à débit égal, elles devraient se suivre.',
        care: 'Isolant remis en place après chaque intervention. Le collecteur reste l’une des rares parties du champ qu’on peut atteindre.',
      },
      {
        failure:
          'Poor distribution: an easy row takes the flow and the others warm badly. Or a leak at a header weld, heard far more easily than seen.',
        check: 'Upstairs, compare the return temperature of each row: at equal flow they should follow one another.',
        care: 'Insulation put back after each intervention. The header is one of the few parts of the field still within reach.',
      },
    ),
    tip: l(
      'Le collecteur fait le lien entre les mondes : ce qui se décide à l’étage technique arrive ici, et ce qui se passe dans la pierre remonte par là.',
      'The header is the link between the worlds: what is decided on the equipment floor arrives here, and what happens in the stone comes back this way.',
    ),
    design: l(
      'Quand on a des centaines de branches, on ne peut pas toutes les piloter. On les regroupe, et on ne garde que quelques registres à un seul endroit : c’est le collecteur qui permet ce raccourci.',
      'With hundreds of legs, you cannot control them all. They are grouped, leaving just a few dampers in one place: the header is what allows that shortcut.',
    ),
  },
  {
    id: 'expansion-loop',
    scene: 'pipe-cell',
    category: 'mechanical',
    name: l('Lyre de dilatation', 'Expansion loop'),
    short: lf(
      'Une boucle de tube qui plie pour que le tube de 6 m puisse grandir d’environ {growCm} cm sans casser sa soudure (dérivé).',
      'A loop of pipe that flexes so that a 6 m pipe can grow about {growCm} cm without breaking its weld (derived).',
    ),
    description: lf(
      '6 m d’inox sur 500 K, c’est environ {growCm} cm de plus (dérivé, avec 17 µm/m·K, une valeur usuelle). Si le collecteur et le tube étaient reliés tout droit, ces centimètres iraient droit dans la soudure. La lyre leur offre un chemin : quelques coudes qui fléchissent un peu à chaque cycle. Or le constructeur annonce de 20 à 200 cycles par an, plus de 30 ans durant : soit de {cyclesLow} à {cyclesHigh} allers-retours dans la vie du silo (dérivé). C’est pourquoi ce coude-là compte autant. La forme dessinée est un exemple générique : le constructeur ne dit pas comment il traite ce problème, mais il doit bien le traiter.',
      '6 m of stainless steel over 500 K is about {growCm} cm longer (derived, at 17 µm/m·K, a usual value). If header and pipe were joined in a straight line, those centimetres would go straight into the weld. The loop gives them a path: a few bends that flex a little with each cycle. Now the maker announces 20 to 200 cycles a year, for over 30 years: so {cyclesLow} to {cyclesHigh} round trips in the silo’s life (derived). That is why this bend matters so much. The shape drawn is a generic example: the maker does not say how it deals with this, but deal with it it must.',
    ),
    material: l(
      'Tube d’inox cintré, sans soudure dans la partie qui fléchit',
      'Bent stainless pipe, no weld in the part that flexes',
    ),
    specs: [
      sp(
        'Allongement à loger',
        'Growth to take',
        tf('derived', 'environ {growCm} cm sur 6 m et 500 K', 'about {growCm} cm over 6 m and 500 K'),
      ),
      sp(
        'Coefficient retenu',
        'Coefficient taken',
        l('17 µm/m·K, valeur usuelle de l’inox', '17 µm/m·K, a usual value for stainless'),
      ),
      sp('Cycles annoncés', 'Announced cycles', l('de 20 à 200 par an', '20 to 200 a year')),
      sp(
        'Sur 30 ans',
        'Over 30 years',
        tf('derived', 'de {cyclesLow} à {cyclesHigh} cycles', '{cyclesLow} to {cyclesHigh} cycles'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'La fatigue, justement : une fissure sur l’extérieur du coude, là où la courbure varie le plus. Elle s’annonce par une fuite d’air, jamais par un bruit.',
        check:
          'De temps en temps, à l’étage, à vue : la lyre doit changer de forme entre froid et chaud. Une lyre qui ne bouge plus indique que quelque chose bloque.',
        care: 'Laisser la lyre libre : aucun isolant bourré trop serré autour, aucun câble fixé dessus.',
      },
      {
        failure:
          'Fatigue, precisely: a crack on the outside of the bend, where the curve changes most. It announces itself by a leak of air, never by a noise.',
        check:
          'From time to time, upstairs, by eye: the loop should change shape between cold and hot. A loop that no longer moves means something is jamming it.',
        care: 'Leave the loop free: no insulation packed too tight around it, no cable fixed to it.',
      },
    ),
    tip: l(
      'Cherchez la lyre sur un réseau de chauffage urbain, à l’air libre : c’est un grand U de tuyau qui a l’air inutile. La même idée sert ici, en plus petit.',
      'Look for one on a district-heating line in the open: a large U of pipe that looks pointless. The same idea is at work here, on a smaller scale.',
    ),
    design: lf(
      'Une lyre ne supprime pas la dilatation : elle transforme un grand effort en petite flexion répartie. Le prix à payer, un peu de perte de charge en plus et de la hauteur sous l’isolant : un échange très favorable pour {cyclesHigh} cycles (dérivé).',
      'A loop does not remove the expansion: it turns a large force into a small, spread flexing. The price, a little more pressure loss and some height under the insulation, is a very good bargain for {cyclesHigh} cycles (derived).',
    ),
  },
  {
    id: 'core-zone',
    scene: 'pipe-cell',
    category: 'structure',
    name: l('Zone de cœur', 'Core zone'),
    short: lf(
      'Chargée la première, elle garde sa chaleur le plus longtemps. Principe rapporté ; rayon de {zoneCore} % (estimation).',
      'Charged first, it keeps its heat longest. The principle is reported; a radius of {zoneCore}% (estimate).',
    ),
    description: lf(
      'Le constructeur charge le cœur d’abord et décharge par l’extérieur : c’est rapporté comme principe, sans plan. Le labo en fait une zone jusqu’à {zoneCore} % du rayon, soit {pipesCore} % des tubes (estimation). L’idée est simple : la chaleur du centre doit traverser toute la pierre avant d’atteindre la paroi, donc elle y reste mieux. Le modèle montre aussi une limite qu’on n’attendait pas : une moyenne de 400 °C sous 500 °C d’air laisse peu de place à un cœur chaud, {coreFull} °C au centre et {edgeFull} °C au bord à plein (résultat du modèle), un champ bien plus plat que l’image publiée par le constructeur. Avec 650 °C d’air, on trouve {coreHotAir} °C et {edgeHotAir} °C (résultat du modèle).',
      'The maker charges the core first and discharges from the outside: that is reported as a principle, without a plan. The lab makes it a zone out to {zoneCore}% of the radius, or {pipesCore}% of the pipes (estimate). The idea is simple: heat at the centre has to cross all the stone to reach the wall, so it stays better there. The model also shows a limit nobody expected: a mean of 400 °C under 500 °C of air leaves little room for a hot core, {coreFull} °C at the centre and {edgeFull} °C at the edge when full (model result), a field much flatter than the picture published by the maker. With 650 °C of air the figures are {coreHotAir} °C and {edgeHotAir} °C (model result).',
    ),
    material: l(
      'Pierre et tubes du centre : le découpage est tracé par le pilotage, pas par une cloison',
      'Stone and pipes at the centre: the division is drawn by the control, not by a partition',
    ),
    specs: [
      sp('Principe', 'Principle', l('chargée d’abord, rapporté', 'charged first, reported')),
      sp(
        'Rayon',
        'Radius',
        tf('estimate', 'jusqu’à {zoneCore} % du rayon du lit', 'out to {zoneCore}% of the bed’s radius'),
      ),
      sp('Part des tubes', 'Share of the pipes', tf('estimate', '{pipesCore} %', '{pipesCore}%')),
      sp('À plein, sous 500 °C d’air', 'When full, under 500 °C of air', tf('model', '{coreFull} °C')),
      sp('À plein, sous 650 °C d’air', 'When full, under 650 °C of air', tf('model', '{coreHotAir} °C')),
      sp('Limite de cœur', 'Core limit', l('600 °C, selon le constructeur', '600 °C, says the maker')),
    ],
    maintenance: maint(
      {
        failure:
          'Une zone qui n’est plus maîtrisée : une sonde fausse, ou un registre qui ne s’ouvre plus, et le cœur reste froid ou dépasse sa limite.',
        check:
          'Le scénario « Le cœur d’abord, ou partout » montre ce que change l’ordre ; à la vraie machine, on lit l’écart entre les sondes du centre et celles du bord.',
        care: 'Rien sur la pierre elle-même : on règle le pilotage, et l’ordre de charge peut encore changer des années après.',
      },
      {
        failure:
          'A zone no longer under control: a false probe or a damper that will not open, and the core stays cold or goes over its limit.',
        check:
          'The “Core first, or everywhere” scenario shows what the order changes; on the real machine, you read the gap between the centre’s probes and the edge’s.',
        care: 'Nothing on the stone itself: the control is adjusted, and the order of charge can still change years later.',
      },
    ),
    tip: l(
      'Une zone n’a pas de paroi : c’est une décision. C’est peut-être la pièce la plus légère de la machine, et elle change beaucoup de choses.',
      'A zone has no wall: it is a decision. It may be the lightest part of the machine, and it changes a good deal.',
    ),
    design: l(
      'La forme et les zones remplacent ici la convection d’un ballon d’eau chaude : dans un lit, rien ne remue, et c’est à l’ordre de charge de créer un gradient. Il ne faudra pas lire le ballon qui suit dans la série à la lumière de celui-ci.',
      'Shape and zones here replace the convection of a hot-water tank: in a bed nothing stirs, and it falls to the order of charge to create a gradient. The tank that comes later in the series must not be read in the light of this one.',
    ),
  },
  {
    id: 'outer-zone',
    scene: 'pipe-cell',
    category: 'structure',
    name: l('Zone périphérique', 'Outer zone'),
    short: lf(
      'Déchargée la première, elle reste plus froide : un isolant vivant autour du cœur, de {zoneMiddle} à 100 % du rayon (estimation).',
      'Discharged first, it stays cooler: a living insulation around the core, from {zoneMiddle} to 100% of the radius (estimate).',
    ),
    description: lf(
      'Autour du cœur et de la zone du milieu, l’anneau extérieur va de {zoneMiddle} à 100 % du rayon, soit {pipesOuter} % des tubes (estimation). On le vide en premier, pour deux raisons : ce qui reste chaud au bord fuit le plus vite, et un bord tiède isole le cœur. L’exploitant du premier silo rapporte 500 °C au cœur et de 150 à 200 °C au bord. Notre modèle du même silo est plus plat, {kankaCore} °C et {kankaEdge} °C (résultat du modèle) ; en gardant la charge sur le cœur, il donne {kankaCoreKept} °C et {kankaEdgeKept} °C (résultat du modèle), qui encadrent ce rapport. Le comportement réel dépend donc beaucoup d’une règle de pilotage que personne ne publie.',
      'Around the core and the middle zone, the outer ring runs from {zoneMiddle} to 100% of the radius, or {pipesOuter}% of the pipes (estimate). It is emptied first, for two reasons: what stays hot at the edge leaks fastest, and a lukewarm edge insulates the core. The operator of the first silo reports 500 °C at the core and 150 to 200 °C at the edge. Our model of that silo is flatter, {kankaCore} °C and {kankaEdge} °C (model result); keeping the charge on the core, it gives {kankaCoreKept} °C and {kankaEdgeKept} °C (model result), which bracket that report. So the real behaviour depends a good deal on a control rule nobody publishes.',
    ),
    material: l('Pierre et tubes du bord, jusqu’à la virole', 'Stone and pipes at the edge, out to the shell'),
    specs: [
      sp('Principe', 'Principle', l('déchargée d’abord, rapporté', 'discharged first, reported')),
      sp('Rayon', 'Radius', tf('estimate', 'de {zoneMiddle} à 100 %', '{zoneMiddle} to 100%')),
      sp('Part des tubes', 'Share of the pipes', tf('estimate', '{pipesOuter} %', '{pipesOuter}%')),
      sp('Bord à plein', 'Edge when full', tf('model', '{edgeFull} °C')),
      sp('Premier silo, rapporté', 'First silo, reported', l('de 150 à 200 °C au bord', '150 to 200 °C at the edge')),
    ],
    maintenance: maint(
      {
        failure:
          'Un bord trop chaud par manque de décharge : la virole souffre et les parois perdent plus. L’alarme « Virole trop chaude » du modèle le signale.',
        check: 'L’écart entre bord et cœur au fil des saisons : plus il se réduit, plus les parois travaillent.',
        care: 'Là encore, un réglage : la part de charge qu’on accepte de laisser partir au bord, un compromis entre confort du réseau et pertes.',
      },
      {
        failure:
          'An edge too hot for lack of discharge: the shell suffers and the walls lose more. The model’s “Inner shell too hot” alarm flags it.',
        check:
          'The gap between edge and core through the seasons: the more it closes, the harder the walls are working.',
        care: 'A setting again: how much of the charge you let go to the edge, a compromise between the network’s comfort and the losses.',
      },
    ),
    tip: l(
      'Dans le scénario de charge, regardez le bord prendre du retard sur le cœur, puis réduire l’écart quand la pierre est pleine : c’est le moment où la paroi commence à coûter.',
      'In the charge scenario, watch the edge lag behind the core, then close the gap as the stone fills: that is the moment the wall starts to cost.',
    ),
    design: l(
      'Rien ne sépare physiquement cette zone : la pierre fait son propre isolant. Une couche de pierre tiède coûte beaucoup moins que la même épaisseur d’isolant : c’est une de ces idées simples qui profitent de l’échelle.',
      'Nothing physically separates this zone: the stone makes its own insulation. A layer of lukewarm stone costs far less than the same thickness of insulation: one of those simple ideas that thrive on scale.',
    ),
  },
  {
    id: 'quartz-sand',
    scene: 'pipe-cell',
    category: 'structure',
    name: l('Sable de quartz', 'Quartz sand'),
    short: l(
      'Le vrai sable, celui de 2022 et de 2027 : plus léger que la pierre, moins conducteur, et avec une ligne à 573 °C.',
      'Real sand, the one of 2022 and 2027: lighter than the stone, less conductive, and with a line at 573 °C.',
    ),
    description: lf(
      'Le sable est à l’origine du nom, et il remplit le premier silo de 2022 et celui de 2027, mais pas celui-ci. Mesuré, il pèse 1 425 kg/m³ et sa capacité thermique monte de 776 J/kg·K à 60 °C à 1 133 à 500 °C : une valeur fixe de 0,8 kJ/kg·K sous-estime l’énergie d’environ {understate} % (dérivé). La moyenne sur la course est de {meanCSand} J/kg·K (dérivé). Sa conduction reste faible, de 0,218 à 0,451 W/m·K. Dans le même silo, il pèse {sandMass} t (dérivé), et le modèle n’en tire que {sandUsable} MWh à 1 MW avec les mêmes tubes, {sandUsableTight} MWh en les resserrant à 0,35 m (résultat du modèle). À 573 °C, le quartz change de forme, avec 0,8 % de volume en plus ; un essai en laboratoire n’a mesuré aucun dégât à des vitesses bien plus rapides que celles d’un silo.',
      'Sand gave its name to the idea, and it fills the first silo of 2022 and the one of 2027, but not this one. Measured, it weighs 1,425 kg/m³ and its heat capacity climbs from 776 J/kg·K at 60 °C to 1,133 at 500 °C: a fixed 0.8 kJ/kg·K understates the energy by about {understate}% (derived). The mean over the swing is {meanCSand} J/kg·K (derived). Its conduction stays low, 0.218 to 0.451 W/m·K. In the same silo it weighs {sandMass} t (derived), and the model gets only {sandUsable} MWh from it at 1 MW with the same pipes, {sandUsableTight} MWh with them tightened to 0.35 m (model result). At 573 °C quartz changes form, gaining 0.8% in volume; a laboratory test measured no damage at rates far faster than a silo’s.',
    ),
    material: l('Sable de quartz, fin ou de construction', 'Quartz sand, fine or building grade'),
    specs: [
      sp('Masse volumique en vrac', 'Bulk density', l('1 425 kg/m³, mesurée', '1,425 kg/m³, measured')),
      sp('Vides', 'Voids', l('0,44, sur un autre sable', '0.44, on another sand')),
      sp(
        'c à 60 °C et à 500 °C',
        'c at 60 °C and at 500 °C',
        l('776 et 1 133 J/kg·K, mesurés', '776 and 1,133 J/kg·K, measured'),
      ),
      sp('c à 600 °C', 'c at 600 °C', l('1 187 J/kg·K, sur un autre sable', '1,187 J/kg·K, on another sand')),
      sp(
        'Conduction du lit',
        'Conduction of the bed',
        l('de 0,218 à 0,451 W/m·K, de 25 à 500 °C', '0.218 to 0.451 W/m·K, from 25 to 500 °C'),
      ),
      sp('Inversion du quartz', 'Quartz inversion', l('vers 573 °C, 0,8 % de volume', 'about 573 °C, 0.8% in volume')),
      sp(
        'Même silo, à 1 MW',
        'Same silo, at 1 MW',
        tf('model', '{sandUsable} MWh sur {sandHeat} MWh', '{sandUsable} MWh out of {sandHeat} MWh'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Des grains qui éclatent si l’on passe vite la ligne de 573 °C ou si on les trempe à l’eau : un essai les a abîmés ainsi, jamais à des vitesses de 25 K/min en montée et de 4 K/min en descente. Le modèle ne fait qu’en donner l’alarme.',
        check:
          'Dans un silo, ce qui surveille cela, c’est le maximum des températures. Essayez un air très chaud dans le scénario « Pierre ollaire ou sable » pour voir l’alarme.',
        care: 'Rester sous la ligne, ou la franchir très lentement. Un sable sec au remplissage, c’est tout ce qui peut se préparer.',
      },
      {
        failure:
          'Grains that burst if the 573 °C line is crossed fast or if they are quenched with water: one test damaged them that way, never at rates of 25 K/min rising and 4 K/min falling. The model only gives an alarm for it.',
        check:
          'In a silo, what watches this is the highest temperature. Try very hot air in the “Soapstone or sand” scenario to see the alarm.',
        care: 'Stay under the line or cross it very slowly. Sand dry at filling is all that can be prepared.',
      },
    ),
    tip: lf(
      'Un même volume de sable pèse un tiers de moins que la pierre : {sandMass} t contre 2 000 t (dérivé). Le sable n’est pas un moins bon produit, il demande seulement des tubes plus serrés.',
      'The same volume of sand weighs a third less than the stone: {sandMass} t against 2,000 t (derived). Sand is no worse a product, it just asks for tighter pipes.',
    ),
    design: lf(
      'Le silo de 250 MWh reprend le sable : pour une même taille, il mise sur la température, 500 °C et plus, plutôt que sur la masse. Son énergie par kilo est le double de celle de ce silo-ci : {specificV} contre {specificLab} kJ/kg (dérivé). À ce niveau, la ligne de 573 °C n’est plus un détail.',
      'The 250 MWh silo goes back to sand: at the same size it banks on temperature, 500 °C and above, rather than on mass. Its energy per kilo is twice this silo’s: {specificV} against {specificLab} kJ/kg (derived). At that level the 573 °C line is no longer a detail.',
    ),
    video: ['00:08'],
  },
  {
    id: 'crushed-soapstone',
    scene: 'pipe-cell',
    category: 'structure',
    name: l('Pierre ollaire concassée', 'Crushed soapstone'),
    short: l(
      'Le vrai contenu du silo : un sous-produit d’usine de poêles, dense, et dont on connaît mal les propriétés thermiques.',
      'What the silo really holds: a by-product of a stove factory, dense, and with thermal properties little known.',
    ),
    description: lf(
      'Le constructeur a choisi un rebut : de la pierre ollaire concassée, celle des poêles de masse. Au laboratoire, le solide mesure 3 140 kg/m³ pour 0,2 % de porosité ouverte ; c’était une plaque, pas des grains. En vrac dans ce silo, on en déduit {bulkDensity} kg/m³, soit {porosity} % de vides (dérivé). Ses valeurs thermiques sont les plus faibles du labo : un fabricant de poêles donne de 0,98 à 1,0 kJ/kg·K sans référence, et de 6 à 12 W/m·K pour le solide. Le modèle tient c fixe à {soapstoneC} kJ/kg·K (hypothèse), car sa courbe réelle est inconnue, et prend {kBed} W/m·K pour le lit (estimation). Selon le constructeur, elle conduit plus vite que le sable : avec sa densité, c’est ce qu’elle apporte.',
      'The maker chose a waste product: crushed soapstone, the stone of masonry heaters. In the laboratory the solid measures 3,140 kg/m³ with 0.2% open porosity; that was a tile, not grains. Loose in this silo it comes to {bulkDensity} kg/m³, or {porosity}% voids (derived). Its thermal values are the weakest in the lab: a heater maker gives 0.98 to 1.0 kJ/kg·K with no reference, and 6 to 12 W/m·K for the solid. The model holds c fixed at {soapstoneC} kJ/kg·K (assumption), as its real curve is unknown, and takes {kBed} W/m·K for the bed (estimate). According to the maker it conducts faster than sand: that, with its density, is what it brings.',
    ),
    material: l(
      'Pierre ollaire concassée, sous-produit d’une usine de poêles',
      'Crushed soapstone, a by-product of a stove factory',
    ),
    specs: [
      sp(
        'Solide, mesuré sur une plaque',
        'Solid, measured on a tile',
        l('3 140 kg/m³, 0,2 % de porosité ouverte', '3,140 kg/m³, 0.2% open porosity'),
      ),
      sp(
        'En vrac, dans ce silo',
        'Loose, in this silo',
        tf('derived', '{bulkDensity} kg/m³, {porosity} % de vides', '{bulkDensity} kg/m³, {porosity}% voids'),
      ),
      sp(
        'c dans le modèle',
        'c in the model',
        tf('assumed', '{soapstoneC} kJ/kg·K, constant', '{soapstoneC} kJ/kg·K, constant'),
      ),
      sp(
        'c, selon un fabricant',
        'c, from a heater maker',
        l('de 0,98 à 1,0 kJ/kg·K, sans référence', '0.98 to 1.0 kJ/kg·K, no reference'),
      ),
      sp(
        'Conduction du lit',
        'Conduction of the bed',
        tf('estimate', '{kBed} W/m·K, de {kBedLow} à {kBedHigh}', '{kBed} W/m·K, {kBedLow} to {kBedHigh}'),
      ),
      sp(
        'Si son c suivait la courbe du sable',
        'If its c followed sand’s curve',
        tf(
          'model',
          '{soapstoneCurved} MWh à 1 MW sur {soapstoneCurvedHeat} MWh',
          '{soapstoneCurved} MWh at 1 MW out of {soapstoneCurvedHeat} MWh',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Personne n’a publié ce que donne cette pierre après des milliers de cycles en grains. Une pierre qui se réduit à la longue en fines bouche ses vides et change sa conduction.',
        check:
          'Un essai au laboratoire, avant de la choisir : le guide de montage lui consacre une étape, parce que le constructeur dit tester ses matériaux. Après, le champ de température sur plusieurs années raconte la suite.',
        care: 'Rien, sinon de la livrer sèche. Les grains sont vidés avec l’installation, le jour où on la démonte.',
      },
      {
        failure:
          'Nobody has published what this stone does as grains after thousands of cycles. A stone that slowly breaks down into fines clogs its voids and changes its conduction.',
        check:
          'A laboratory test, before choosing it: the assembly guide gives it a step because the maker says it tests its materials. After that, the temperature field over several years tells the rest.',
        care: 'None, except to deliver it dry. The grains are emptied with the plant, on the day it is dismantled.',
      },
    ),
    tip: lf(
      'Le bouton « Matériau » de la simulation change ce contenu. Essayez les deux : le sable pèse un tiers de moins pour le même silo, et il n’a pas le même c(T). Le modèle rend {usable} MWh avec la pierre à 1 MW (résultat du modèle).',
      'The simulation’s “Medium” button changes this filling. Try both: sand weighs a third less for the same silo, and does not have the same c(T). The model gives {usable} MWh with the stone at 1 MW (model result).',
    ),
    design: lf(
      'Pourquoi le sable, à l’origine, et une pierre maintenant ? À volume égal, cette pierre pèse plus, donc elle stocke plus à température égale, et elle conduit mieux. Si son vrai c(T) suivait celui du sable, la chaleur à plein tomberait de {heatFull} à {soapstoneCurvedHeat} MWh, mais la part rendue à 1 MW grimperait (résultat du modèle, dérivé). Cette courbe n’a pas été mesurée.',
      'Why sand at first, and a stone now? For the same volume this stone weighs more, so it stores more at the same temperature, and it conducts better. If its real c(T) followed sand’s, the heat when full would fall from {heatFull} to {soapstoneCurvedHeat} MWh, but the share given at 1 MW would climb (model result, derived). That curve has not been measured.',
    ),
    video: ['00:08'],
  },
];
