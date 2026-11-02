// Parts of the `plant-room` world (ids frozen in src/data/ids.ts): the equipment floor under the roof, read in the order the current and the heat go. The maker reports resistors, a closed
// air loop, blowers and dampers, an air-to-water exchanger and an optimising controller; it publishes no size for any of them. The sizes here come from the physics and are ESTIMATES,
// two blowers rather than one is an ASSUMPTION (charge and discharge at once), and 69 MWh at 1 MW against the quoted 100 MWh is said where it belongs: on the discharge blower.
// The statement that no independent measurement of a real silo exists is made once in the lab, in the simulation panel under the year's efficiency (`efficiencyHint`): `heat-meter` defines efficiency and quotes who says what.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, tf } from '../part-helpers';

export const PLANT_ROOM_PARTS: PartInfo[] = [
  {
    id: 'lv-switchboard',
    scene: 'plant-room',
    category: 'electrical',
    name: l('Tableau basse tension', 'Low-voltage switchboard'),
    short: lf(
      'Tout le courant passe ici : {amps} A à 1 MW (dérivé), répartis entre les résistances, les moteurs et l’automatisme.',
      'All the current passes here: {amps} A at 1 MW (derived), shared out between the resistors, the motors and the controls.',
    ),
    description: lf(
      'La colonne de câbles aboutit ici : à {volts} V (hypothèse), le mégawatt des résistances représente {amps} A (dérivé). De ce tableau partent trois familles : les résistances, de très loin les plus gourmandes ; les variateurs des soufflantes et la pompe ; l’automatisme et la ventilation, environ {auxKw} kW par MW dans le modèle (estimation). Il porte aussi le coupe-circuit général, celui qui permet de tout arrêter sans monter sur rien. Sur ce tableau, tout est générique : aucune source ne décrit celui du vrai silo. Lisez-le comme un poste de contrôle : c’est ici que se lit tout ce que le silo consomme.',
      'The cable riser ends here: at {volts} V (assumption), the resistors’ megawatt means {amps} A (derived). Three families leave this board: the resistors, by far the hungriest; the blower drives and the pump; the controls and ventilation, about {auxKw} kW per MW in the model (estimate). It also carries the main isolator, the one that stops everything without climbing onto anything. On this board everything is generic: no source describes the real silo’s. Read it as a control post: all the silo draws can be read here.',
    ),
    material: l(
      'Jeux de barres en cuivre, disjoncteurs, enveloppe d’acier',
      'Copper busbars, circuit breakers, steel enclosure',
    ),
    specs: [
      sp('Courant à 1 MW', 'Current at 1 MW', tf('derived', '{amps} A')),
      sp('Tension', 'Voltage', tf('assumed', '{volts} V, triphasé', '{volts} V, three-phase')),
      sp(
        'Automatisme et ventilation',
        'Controls and ventilation',
        tf('estimate', '{auxKw} kW par MW', '{auxKw} kW per MW'),
      ),
      sp('Source', 'Source', l('aucune : générique', 'none: generic')),
    ],
    maintenance: maint(
      {
        failure:
          'Une connexion desserrée, qui chauffe à force de cycles de charge. Sur un jeu de barres, cela finit en arc : la coupure d’urgence ne suffit plus à empêcher les dégâts.',
        check:
          'Une caméra thermique à pleine charge, capots ouverts par du personnel habilité et protégé : les trois phases doivent se ressembler.',
        care: 'Resserrage et nettoyage, hors tension et consignation vérifiée, selon le plan du fabricant.',
      },
      {
        failure:
          'A loose connection, heated by load cycles. On a busbar this ends in an arc: the emergency stop is no longer enough to prevent the damage.',
        check:
          'A thermal camera at full load, covers opened by authorised and protected staff: the three phases should look alike.',
        care: 'Retightening and cleaning, dead and with the lock-out verified, on the manufacturer’s schedule.',
      },
    ),
    tip: lf(
      'Pensez à ce qu’il y a derrière le chiffre : {amps} A (dérivé), c’est de l’ordre de cent fois le courant d’une prise de maison.',
      'Think of what lies behind the figure: {amps} A (derived) is of the order of a hundred times the current of a household socket.',
    ),
    design: l(
      'Ranger ce tableau à l’étage garde les câbles courts entre lui et les résistances : à ce courant, chaque mètre coûte. Le gros transformateur reste en bas, pour ne pas alourdir le plancher.',
      'Placing this board upstairs keeps the cables short between it and the resistors: at this current every metre costs. The big transformer stays below, so as not to weigh down the deck.',
    ),
  },
  {
    id: 'heater-controller',
    scene: 'plant-room',
    category: 'electrical',
    name: l('Gradateur de résistances', 'Heater controller'),
    short: l(
      'Il ouvre et ferme le passage du courant par paliers, assez vite pour suivre un prix ou un appel de réserve du réseau.',
      'It opens and closes the way for the current in steps, fast enough to follow a price or a reserve call from the grid.',
    ),
    description: lf(
      'Les résistances sont une charge très simple : tout ou rien, ou par paliers. Ce gradateur décide à chaque instant la part de puissance à laisser passer, selon l’ordre de l’automatisme. Sa rapidité est son intérêt : c’est lui qui permet de participer aux marchés de réserve, ce que le constructeur rapporte, et dans le scénario « Le réseau électrique appelle », les résistances s’effacent aussitôt alors que le village ne voit rien. Sa technologie, contacteurs ou électronique, n’est pas publiée. Une sécurité s’y ajoute : sans débit d’air, les résistances doivent se couper, sous {flowSwitch} % du débit nécessaire dans le modèle (estimation).',
      'Resistors are a very simple load: on or off, or in steps. This controller decides at every moment what share of the power to let through, on the order of the control system. Its speed is its value: it is what allows the plant to take part in the reserve markets, which the maker reports, and in the “The grid calls” scenario the resistors drop out at once while the village sees nothing. Its technology, contactors or electronics, is not published. A safety comes on top: without air flow the resistors must cut out, under {flowSwitch}% of the flow needed in the model (estimate).',
    ),
    material: l(
      'Contacteurs ou électronique de puissance, radiateurs, armoire ventilée',
      'Contactors or power electronics, heat sinks, ventilated cabinet',
    ),
    specs: [
      sp('Fonction', 'Function', l('régler le courant des résistances', 'set the current of the resistors')),
      sp('Technologie', 'Technology', l('non publiée', 'not published')),
      sp(
        'Réponse au réseau',
        'Response to the grid',
        l('assez rapide pour la réserve, selon le constructeur', 'fast enough for reserve, says the maker'),
      ),
      sp(
        'Seuil de débit d’air',
        'Air flow threshold',
        tf('estimate', '{flowSwitch} % du débit nécessaire', '{flowSwitch}% of the flow needed'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un contacteur collé fermé, c’est le pire : le courant passe alors que l’ordre dit non. C’est pourquoi la sécurité du manque d’air doit agir en amont, sur un autre organe.',
        check:
          'Un essai réel du déclenchement : on simule un manque de débit, et l’on vérifie que le courant tombe, puis que tout repart seul au retour.',
        care: 'Filtres et ventilateurs de l’armoire, connexions serrées, contacteurs remplacés à leur nombre de manœuvres.',
      },
      {
        failure:
          'A contactor stuck closed is the worst: the current flows while the order says no. That is why the no-air safety must act upstream, on another device.',
        check:
          'A real trip test: simulate a loss of flow, check the current falls, then that everything restarts by itself on its return.',
        care: 'Cabinet filters and fans, connections tight, contactors replaced at their rated number of operations.',
      },
    ),
    tip: l(
      'Lancez « Le réseau électrique appelle » : voilà pourquoi un silo vaut quelque chose au réseau même quand il est plein de chaleur.',
      'Run “The grid calls”: that is why a silo is worth something to the grid even when full of heat.',
    ),
    design: l(
      'Une résistance ne craint pas les coupures. Là où une pompe à chaleur ou une turbine demanderaient des rampes, cette charge se pilote à l’instant, et cet atout tient presque tout entier dans cette armoire.',
      'A resistor does not mind being cut off. Where a heat pump or a turbine would ask for ramps, this load is driven instantly, and nearly all of that advantage sits in this cabinet.',
    ),
  },
  {
    id: 'resistor-bank',
    scene: 'plant-room',
    category: 'electrical',
    name: l('Batterie de résistances', 'Resistor bank'),
    short: lf(
      'Ici, l’électricité devient de l’air chaud, à près de 100 %. Puissance réelle non publiée : le labo compte {chargeMw} MW (hypothèse).',
      'Here electricity becomes hot air, at nearly 100%. The real power is not published: the lab counts {chargeMw} MW (assumption).',
    ),
    description: lf(
      'Le moment où l’énergie change de nature : un courant traverse des résistances, l’air qui passe devant se réchauffe, et presque rien n’est perdu. Selon un documentaire tourné sur place, à vérifier, l’air sort à environ 500 °C ; le constructeur, de son côté, annonce jusqu’à 600 °C pour son produit. La puissance de charge n’est pas publiée : le labo prend {chargeMw} MW (hypothèse), dans un caisson d’environ {bankL} × {bankS} × {bankS} m (estimation). L’élément s’échauffe de {elementRise} K de plus que l’air au débit nominal, avec une limite de {elementLimit} °C (estimation). Sans air, il n’a plus d’issue pour sa chaleur et brûle vite : c’est le scénario « La soufflante lâche ». La lueur dessinée est une fausse couleur.',
      'The moment the energy changes its nature: a current crosses the resistors, the air passing over them warms, and hardly anything is lost. According to a documentary filmed on site, to be checked, the air leaves at about 500 °C; the maker, for its part, announces up to 600 °C for its product. The charging power is not published: the lab takes {chargeMw} MW (assumption), in a casing about {bankL} × {bankS} × {bankS} m (estimate). The element runs {elementRise} K above the air at rated flow, with a limit of {elementLimit} °C (estimate). With no air it has no way out for its heat and soon burns: that is the “The blower fails” scenario. The glow drawn is false colour.',
    ),
    material: l(
      'Éléments résistants haute température, isolateurs céramiques, caisson d’acier isolé',
      'High-temperature elements, ceramic insulators, insulated steel casing',
    ),
    specs: [
      sp('Puissance', 'Power', tf('assumed', '{chargeMw} MW à cette installation', '{chargeMw} MW at this plant')),
      sp(
        'Pour le produit de 2 MW',
        'For the 2 MW product',
        l('3 MW de charge, selon le constructeur', '3 MW of charge, says the maker'),
      ),
      sp(
        'Air en sortie',
        'Air out',
        l('environ 500 °C, par un documentaire, à vérifier', 'about 500 °C, from a documentary, to be checked'),
      ),
      sp(
        'Caisson',
        'Casing',
        tf('estimate', 'environ {bankL} × {bankS} × {bankS} m', 'about {bankL} × {bankS} × {bankS} m'),
      ),
      sp('Limite de l’élément', 'Limit of the element', tf('estimate', '{elementLimit} °C')),
      sp(
        'Rendement vers l’air',
        'Efficiency into the air',
        l('près de 100 %, sa chaleur n’a nulle part ailleurs où aller', 'nearly 100%, its heat has nowhere else to go'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un élément coupé, un isolateur fêlé par les chocs thermiques, ou surtout une surchauffe par manque d’air, qui détruit en une fois ce qui durerait des années.',
        check:
          'La résistance de chaque étage hors tension : une valeur qui s’écarte désigne un élément défectueux. Le pressostat doit couper réellement : on le prouve par un essai.',
        care: 'Un caisson conçu pour sortir un élément sans tout démonter. On y intervient à l’arrêt, consigné et refroidi : une fois le courant coupé, la chaleur reste.',
      },
      {
        failure:
          'A broken element, an insulator cracked by thermal shocks, above all an overheating for lack of air, which destroys in one go what would have lasted years.',
        check:
          'The resistance of each stage with the power off: a value that strays points to a faulty element. The pressure switch must really cut: that is proven by a test.',
        care: 'A casing designed to pull an element without taking everything apart. Work is done stopped, locked out and cooled: once the current is off, the heat is still there.',
      },
    ),
    tip: l(
      'En temps réel, lancez « La soufflante lâche » et regardez l’ordre : débit, pressostat, coupure, refroidissement. Puis enlevez le pressostat pour voir à quoi il sert.',
      'In real time, run “The blower fails” and watch the order: flow, pressure switch, trip, cooling. Then remove the switch to see what it is for.',
    ),
    design: lf(
      'La résistance transforme tout en chaleur : rien de mieux, rien de moins. Une pompe à chaleur ferait mieux avec le même courant, mais elle ne saurait pas atteindre 500 °C : ce silo paie son niveau de température au prix fort, ce que la dernière leçon compare honnêtement. Le modèle compte {chargeHours} h de charge, de son plancher à plein, à 1 MW offert (résultat du modèle).',
      'A resistor turns everything into heat: nothing better, nothing less. A heat pump would do more with the same current, but it could not reach 500 °C: this silo pays full price for its temperature, which the last lesson compares honestly. The model counts {chargeHours} h of charge, from its floor to full, with 1 MW on offer (model result).',
    ),
    video: ['01:17'],
  },
  {
    id: 'charge-blower',
    scene: 'plant-room',
    category: 'mechanical',
    name: l('Soufflante de charge', 'Charge blower'),
    short: l(
      'Elle pousse l’air à travers les résistances puis dans le cœur. Seule, elle fixe combien de puissance le silo accepte.',
      'It drives the air through the resistors and into the core. On its own it sets how much power the silo accepts.',
    ),
    description: lf(
      'Les soufflantes sont rapportées par le constructeur ; en mettre deux est une hypothèse, pour charger et décharger à la fois sur des zones différentes. Celle-ci se tient du côté du retour, en amont des résistances, car après elles, elle verrait 500 °C : c’est une estimation raisonnable. Avec {blowerRate} m³/s par MW et {blowerLimitKpa} kPa au plus (estimation), elle pousse une masse d’air qui dépend de sa température : quand la pierre chauffe, l’air revient chaud, moins dense, et elle en déplace moins. La puissance acceptée baisse alors d’elle-même jusqu’au tiers à plein, et la charge dure {chargeHours} h de son plancher à plein (résultat du modèle), contre environ 100 h dans une source secondaire, sans doute la capacité redite.',
      'Blowers are reported by the maker; having two is an assumption, to charge and discharge at once on different zones. This one stands on the return side, upstream of the resistors, because after them it would see 500 °C: a reasonable estimate. At {blowerRate} m³/s per MW and at most {blowerLimitKpa} kPa (estimate), it moves a mass of air that depends on its temperature: as the stone warms, the air comes back hot and thin, and it shifts less of it. The power accepted then falls by itself, to a third at full, and the charge lasts {chargeHours} h from its floor to full (model result), against about 100 h in a secondary source, which may just restate the capacity.',
    ),
    material: l(
      'Roue d’acier, moteur, volute isolée, joint d’arbre',
      'Steel impeller, motor, insulated casing, shaft seal',
    ),
    specs: [
      sp('Taille', 'Size', tf('estimate', '{blowerRate} m³/s par MW de boucle', '{blowerRate} m³/s per MW of loop')),
      sp('Pression maximale', 'Highest pressure', tf('estimate', '{blowerLimitKpa} kPa')),
      sp(
        'Place',
        'Place',
        tf('estimate', 'sur le retour, en amont des résistances', 'on the return, upstream of the resistors'),
      ),
      sp(
        'Durée d’une charge',
        'Length of a charge',
        tf(
          'model',
          '{chargeHours} h à 500 °C d’air, {chargeHours600} h à 600 °C',
          '{chargeHours} h at 500 °C of air, {chargeHours600} h at 600 °C',
        ),
      ),
      sp('Deux soufflantes', 'Two blowers', l('hypothèse du labo', 'an assumption of the lab')),
    ],
    maintenance: maint(
      {
        failure:
          'Un roulement qui chauffe près d’une volute chaude, puis qui lâche. Le débit tombe, et la sécurité doit couper les résistances avant qu’elles ne brûlent.',
        check:
          'Vibration et température des paliers en marche. Le scénario « La soufflante lâche » montre en temps réel ce qui se passe quand elle s’arrête.',
        care: 'Graissage, alignement et contrôle de l’équilibrage de la roue, joint d’arbre vérifié, à l’arrêt et consigné.',
      },
      {
        failure:
          'A bearing heating up by a hot casing, then giving way. The flow falls, and the safety must cut the resistors before they burn.',
        check:
          'Vibration and bearing temperature while running. The “The blower fails” scenario shows in real time what happens when it stops.',
        care: 'Greasing, alignment and a check of the impeller’s balance, shaft seal looked at, stopped and locked out.',
      },
    ),
    tip: lf(
      'Descendez l’air à 400 °C dans la simulation : la charge passe à {chargeHours400} h (résultat du modèle). Ce n’est pas l’électricité qui limite la fin de charge, c’est la boucle d’air.',
      'Bring the air down to 400 °C in the simulation: the charge goes to {chargeHours400} h (model result). It is not the electricity that limits the end of a charge, it is the air loop.',
    ),
    design: lf(
      'Son effort réel est limité par son air : une soufflante sur le retour chaud travaille à plus faible densité et dépense peu : de {blowerKwLow} à {blowerKwHigh} kW à 1 MW dans la boucle de décharge (résultat du modèle), à peine quelques pour cent de ce qui passe. Toute sa chaleur reste dans la boucle.',
      'Its real effort is limited by its air: a blower on the hot return works at lower density and uses little: {blowerKwLow} to {blowerKwHigh} kW at 1 MW on the discharge loop (model result), barely a few per cent of what passes through. All its heat stays in the loop.',
    ),
  },
  {
    id: 'discharge-blower',
    scene: 'plant-room',
    category: 'mechanical',
    name: l('Soufflante de décharge', 'Discharge blower'),
    short: lf(
      'La pièce qui décide de la capacité à pleine puissance : {blowerRate} m³/s par MW (estimation), et la moitié de l’histoire des 100 MWh.',
      'The part that decides the capacity at full power: {blowerRate} m³/s per MW (estimate), and half the story of the 100 MWh.',
    ),
    description: lf(
      'C’est la pièce la plus importante du labo, et sa taille n’est publiée nulle part. Elle tire l’air à travers la pierre, puis l’échangeur, en boucle. Quand la pierre refroidit, l’air revient moins chaud, et il en faudrait plus pour porter 1 MW : à un moment, la soufflante n’en donne plus assez. Avec {blowerRate} m³/s par MW (estimation), cela arrive à {floor} °C de moyenne : à 1 MW, le modèle rend {usable} MWh, contre les 100 MWh annoncés. Il en faudrait {blowerFor100} m³/s par MW, soit {blowerTimes} fois plus, pour y arriver (résultat du modèle), et cela ne prouverait rien puisqu’on ne l’a pas mesurée. De {rangeLow} à {rangeHigh} MWh selon les réglages inconnus : une seule ligne du constructeur suffirait à trancher.',
      'This is the most important part in the lab, and its size is published nowhere. It draws the air through the stone, then the exchanger, in a loop. As the stone cools, the air comes back less hot, and it would take more of it to carry 1 MW: at some point the blower cannot give enough. At {blowerRate} m³/s per MW (estimate), this happens at a mean of {floor} °C: at 1 MW the model gives {usable} MWh, against the 100 MWh quoted. It would take {blowerFor100} m³/s per MW, {blowerTimes} times more, to get there (model result), and that would prove nothing since it has not been measured. {rangeLow} to {rangeHigh} MWh across the unknown settings: one line from the maker would settle it.',
    ),
    material: l('Roue d’acier, moteur, volute', 'Steel impeller, motor, casing'),
    specs: [
      sp('Taille', 'Size', tf('estimate', '{blowerRate} m³/s par MW de boucle', '{blowerRate} m³/s per MW of loop')),
      sp(
        'Plancher de pleine puissance',
        'Floor of full power',
        tf('model', '{floor} °C de moyenne', 'a mean of {floor} °C'),
      ),
      sp(
        'Rendu à 1 MW',
        'Given at 1 MW',
        tf('model', '{usable} MWh ; annoncé : jusqu’à 100 MWh', '{usable} MWh; quoted: up to 100 MWh'),
      ),
      sp(
        'Pour rendre 100 MWh à 1 MW',
        'To give 100 MWh at 1 MW',
        tf('model', '{blowerFor100} m³/s par MW, jamais réglé ainsi', '{blowerFor100} m³/s per MW, never set that way'),
      ),
      sp(
        'Électricité à 1 MW',
        'Electricity at 1 MW',
        tf(
          'model',
          'de {blowerKwLow} à {blowerKwHigh} kW, de {blowerKpaLow} à {blowerKpaHigh} kPa',
          '{blowerKwLow} to {blowerKwHigh} kW, {blowerKpaLow} to {blowerKpaHigh} kPa',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Le roulement et le moteur, comme toute soufflante ; mais ici, c’est le réseau qui s’arrête avec elle. Le village passe alors sur la chaudière en attendant.',
        check:
          'Vibration et température des paliers ; débit et pression en essai ; comparaison de la chaleur rendue avec ce que la température de la pierre laisse attendre.',
        care: 'Graissage et équilibrage comme pour l’autre ; à ceci près qu’elle voit de l’air tiède et non brûlant : elle vieillit mieux.',
      },
      {
        failure:
          'Bearing and motor, like any blower; but here, the network stops with it. The village then goes over to the boiler in the meantime.',
        check:
          'Vibration and bearing temperature; flow and pressure in a test; a comparison of the heat given with what the stone’s temperature should allow.',
        care: 'Greasing and balancing as for the other; except that it sees lukewarm air and not scorching air: it ages better.',
      },
    ),
    tip: l(
      'Dans la simulation, déplacez le curseur « Taille des soufflantes ». Aucun réglage ne pèse autant, et c’est le réglage que personne ne connaît.',
      'In the simulation, move the “Size of the blowers” slider. No setting weighs as much, and it is the one nobody knows.',
    ),
    design: lf(
      'Une capacité sans puissance ne veut rien dire : {usable}, {usable800}, {usableWinter} et {usableSummer} MWh, c’est le même plein, à 1 MW, à 800 kW, à {winterKw} kW et à {summerKw} kW (dérivé pour ces deux demandes ; résultat du modèle pour le reste). À 1 MW, {shareUsable} % de la chaleur sortent, le reste sort plus lentement ou jamais.',
      'A capacity without a power means nothing: {usable}, {usable800}, {usableWinter} and {usableSummer} MWh are the same full charge, at 1 MW, at 800 kW, at {winterKw} kW and at {summerKw} kW (derived for those two demands; model result for the rest). At 1 MW, {shareUsable}% of the heat comes out; the rest comes out more slowly, or never.',
    ),
  },
  {
    id: 'blower-drive',
    scene: 'plant-room',
    category: 'electrical',
    name: l('Variateur', 'Blower drive'),
    short: l(
      'Il règle la vitesse de la soufflante, donc le débit d’air, donc la chaleur qui sort : le vrai robinet de la machine.',
      'It sets the blower’s speed, so the air flow, so the heat that leaves: the real tap of the machine.',
    ),
    description: lf(
      'Pas de registre étranglé ici : on règle la chaleur en faisant tourner la soufflante plus ou moins vite, avec un variateur de fréquence, comme pour n’importe quel gros moteur industriel. Une soufflante à mi-vitesse consomme environ huit fois moins (dérivé : la pression suit le carré du débit), et c’est pour cela que cette machine dépense si peu : {circYear} % de l’électricité sur l’année pour la circulation et la charge, contre environ 5 % annoncés (résultat du modèle). Dans le modèle, la soufflante monte et descend en {blowerRunSeconds} s (estimation), ce qui se voit en temps réel lors d’une panne. La réponse des moteurs à charge partielle, elle, n’y figure pas.',
      'No throttling damper here: the heat is set by running the blower faster or slower, with a frequency drive, as for any big industrial motor. A blower at half speed uses about eight times less (derived: the pressure follows the square of the flow), and that is why this machine spends so little: {circYear}% of the electricity over the year for circulation and charging, against about 5% announced (model result). In the model the blower runs up and down in {blowerRunSeconds} s (estimate), which can be seen in real time during a failure. The behaviour of motors at part load, for its part, is not in it.',
    ),
    material: l('Électronique de puissance, armoire ventilée', 'Power electronics, ventilated cabinet'),
    specs: [
      sp('Type', 'Type', l('variateur de fréquence, générique', 'frequency drive, generic')),
      sp('Temps de montée dans le modèle', 'Run-up time in the model', tf('estimate', '{blowerRunSeconds} s')),
      sp(
        'Circulation et charge, sur un an',
        'Circulation and charging, over a year',
        tf('model', '{circYear} % de l’électricité', '{circYear}% of the electricity'),
      ),
      sp('Annoncé', 'Announced', l('environ 5 % par cycle', 'about 5% per cycle')),
    ],
    maintenance: maint(
      {
        failure:
          'Des condensateurs qui vieillissent, des ventilateurs bouchés, de la poussière sur une carte. Un local chaud raccourcit tout cela.',
        check: 'Le journal de défauts du variateur et la température de son armoire en plein régime.',
        care: 'Filtres changés, ventilateurs et condensateurs remplacés selon le fabricant, et le variateur dépoussiéré à l’arrêt et consigné.',
      },
      {
        failure: 'Ageing capacitors, clogged fans, dust on a board. A warm room shortens all of this.',
        check: 'The drive’s fault log and the temperature of its cabinet at full duty.',
        care: 'Filters changed, fans and capacitors replaced to the manufacturer’s schedule, the drive dusted stopped and locked out.',
      },
    ),
    tip: l(
      'La soufflante ne connaît pas la demande : elle reçoit une consigne de vitesse d’un automatisme qui, lui, regarde la température de l’eau qui part vers le village.',
      'The blower knows nothing of the demand: it gets a speed order from a controller that watches the temperature of the water leaving for the village.',
    ),
    design: l(
      'Fixer la vitesse, c’est fixer le débit, et donc la chaleur portée : régler ainsi coûte peu quand la demande est faible, ce qui est le cas le plus clair de l’année, et la chaleur de la soufflante reste dans la boucle.',
      'Setting the speed sets the flow, and so the heat carried: regulating this way costs little while demand is low, which is most of the year, and the blower’s heat stays in the loop.',
    ),
  },
  {
    id: 'charge-damper',
    scene: 'plant-room',
    category: 'mechanical',
    name: l('Registre de charge', 'Charge damper'),
    short: l(
      'Un volet qui ouvre une zone à l’air chaud : c’est lui qui met en œuvre le principe « le cœur d’abord ».',
      'A flap that opens a zone to the hot air: this is what carries out the “core first” principle.',
    ),
    description: lf(
      'Le constructeur rapporte des registres qui aiguillent l’air d’une zone à l’autre ; un pilote les faisait pivoter pour passer de la charge à la décharge. Ceux de la charge voient l’air le plus chaud, jusqu’à 500 °C dans le modèle, et l’étanchéité y est difficile : le métal se déforme. Le modèle dessine une règle : charger le cœur tant qu’il prend au moins la moitié de la puissance offerte (estimation), puis le milieu, puis l’extérieur, et fermer toute zone qui passe sa limite. Vous voyez ces volets s’ouvrir et se fermer dans cette salle : ils suivent le modèle en direct.',
      'The maker reports dampers that steer the air from one zone to the next; a pilot swung them to go from charge to discharge. The charge dampers see the hottest air, up to 500 °C in the model, and sealing is hard there: metal warps. The model draws a rule: charge the core as long as it takes at least half the power on offer (estimate), then the middle, then the outside, and close any zone over its limit. You see these flaps open and close in this room: they follow the model live.',
    ),
    material: l('Volet d’acier haute température, axe, actionneur', 'High-temperature steel flap, axle, actuator'),
    specs: [
      sp(
        'Rapporté',
        'Reported',
        l('des registres qui aiguillent l’air, sans plan', 'dampers steering the air, without a plan'),
      ),
      sp('Air vu', 'Air seen', l('jusqu’à environ 500 °C, à vérifier', 'up to about 500 °C, to be checked')),
      sp(
        'Règle du modèle',
        'The model’s rule',
        tf(
          'estimate',
          'une zone tant qu’elle prend la moitié de l’offre',
          'a zone as long as it takes half of the offer',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un volet qui se grippe à chaud ou qui ne ferme plus : l’air passe où il ne faut pas, et une zone reçoit ce qui était destiné à une autre.',
        check:
          'Une course complète à l’arrêt, en regardant la position lue par l’automatisme ; à chaud, les températures des zones disent si le volet ferme vraiment.',
        care: 'Axes dégagés et graissés avec un produit adapté à la chaleur, actionneur testé, joints refaits.',
      },
      {
        failure:
          'A flap that seizes when hot or will not shut: the air goes where it should not, and a zone receives what was meant for another.',
        check:
          'A full stroke while stopped, watching the position read by the controller; when hot, the zone temperatures tell whether the flap really shuts.',
        care: 'Axles kept free and greased with a heat-proof product, the actuator tested, seals renewed.',
      },
    ),
    tip: l(
      'Le scénario « Le cœur d’abord, ou partout » compare les deux règles : mêmes volets, mêmes tubes, mais un bord plus chaud et des parois qui perdent plus.',
      'The “Core first, or everywhere” scenario compares the two rules: same flaps, same pipes, but a hotter edge and walls that lose more.',
    ),
    design: l(
      'Une bonne partie de l’intelligence de la machine tient dans quelques volets, qui évitent de faire dix boucles. On gagne de la souplesse et on perd un peu de pression à chaque passage : l’échange reste très favorable.',
      'Much of the machine’s intelligence lies in a few flaps, which spare it from building ten loops. Flexibility is gained and a little pressure lost at each pass: still a very good bargain.',
    ),
  },
  {
    id: 'discharge-damper',
    scene: 'plant-room',
    category: 'mechanical',
    name: l('Registre de décharge', 'Discharge damper'),
    short: l(
      'Le même volet, côté échangeur : on commence par la zone la plus froide qui suffit encore à la demande.',
      'The same flap on the exchanger’s side: it starts with the coolest zone that can still meet the demand.',
    ),
    description: lf(
      'Le registre de décharge ouvre une zone vers l’échangeur. L’ordre est rapporté : on décharge par l’extérieur, pour laisser le cœur chaud le plus longtemps possible. Le modèle l’applique ainsi : il essaie d’abord la zone la plus froide capable de tenir la demande, puis monte vers le cœur à mesure que la température baisse. C’est un gain réel : le cœur sert de réserve, disponible pour la pointe, et le bord se refroidit, donc il fuit moins. Comme les deux boucles travaillent sur des zones différentes, le modèle peut charger et décharger ensemble : c’est une hypothèse, poussée par un réseau qui ne peut pas attendre.',
      'The discharge damper opens a zone to the exchanger. The order is reported: discharge from the outside, leaving the core hot for as long as possible. The model applies it this way: it first tries the coolest zone able to hold the demand, then moves towards the core as the temperature falls. It is a real gain: the core serves as a reserve for the peak, and the edge cools, so leaks less. As the two loops work on different zones, the model can charge and discharge together: an assumption, pushed by a network that cannot wait.',
    ),
    material: l('Volet d’acier, axe, actionneur', 'Steel flap, axle, actuator'),
    specs: [
      sp(
        'Ordre de décharge',
        'Order of discharge',
        l('par l’extérieur d’abord, rapporté', 'from the outside first, reported'),
      ),
      sp(
        'Règle du modèle',
        'The model’s rule',
        l('la zone la plus froide qui tient la demande', 'the coolest zone that holds the demand'),
      ),
      sp(
        'Charge et décharge ensemble',
        'Charge and discharge at once',
        l('hypothèse, sur des zones différentes', 'an assumption, on different zones'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Le même grippage que l’autre, plus rare car l’air y est moins chaud ; mais un volet bloqué fermé peut priver le réseau juste au moment de la pointe.',
        check: 'Essayez chaque registre avant l’hiver, position lue et position réelle comparées.',
        care: 'Mêmes soins, moins souvent. Une position manuelle de secours aide le jour où l’actionneur lâche.',
      },
      {
        failure:
          'The same seizing as the other, rarer because the air is cooler; but a flap stuck shut can starve the network just at the peak.',
        check: 'Try each damper before winter, comparing the position read with the real one.',
        care: 'The same care, less often. A manual fallback position helps on the day the actuator gives up.',
      },
    ),
    tip: l(
      'Regardez la coupe colorée pendant une décharge : le bord se vide avant le cœur, et cela se voit à l’œil nu.',
      'Watch the coloured section during a discharge: the edge empties before the core, and it shows to the naked eye.',
    ),
    design: l(
      'Prendre d’abord la pierre la plus froide qui suffit, c’est garder la plus chaude pour le moment où il en faudra : on n’utilise pas sa réserve tant qu’il reste de quoi faire.',
      'Taking the coolest stone that will do first means keeping the hottest for when it is needed: a reserve is not touched while there is still enough to go on.',
    ),
  },
  {
    id: 'hot-air-duct',
    scene: 'plant-room',
    category: 'mechanical',
    name: l('Gaine d’air chaud', 'Hot-air duct'),
    short: lf(
      'Courte et bien isolée, à dessein : environ {ductDiameter} m à l’intérieur (dérivé) pour porter le mégawatt à {airSpeed} m/s (estimation).',
      'Short and well insulated, on purpose: about {ductDiameter} m inside (derived) to carry the megawatt at {airSpeed} m/s (estimate).',
    ),
    description: lf(
      'Le constructeur tient à ses gaines courtes et bien isolées, et il en donne la raison : tout mètre chaud qui traîne dehors est une perte, chaque fois que l’air y passe. Dans le modèle, une boucle à 1 MW a {ductWK} W/K de gaines, environ {ductLength} m (estimation), qui ne perdent que lorsqu’elles soufflent. Le diamètre vient de la physique : 1 MW sur 300 K demande environ {airKgS} kg/s d’air (dérivé), et la soufflante de {blowerRate} m³/s (estimation), à {airSpeed} m/s (estimation), donne une gaine de {ductDiameter} m (dérivé). L’air y atteint jusqu’à environ 500 °C, et l’on ne touche pas ces gaines : leur habillage tiède ne dit rien de ce qui passe dedans.',
      'The maker cares about short, well-insulated ducts and gives the reason: every hot metre left outside is a loss, each time air passes through it. In the model a loop at 1 MW has {ductWK} W/K of ducts, about {ductLength} m (estimate), which only lose while they blow. The diameter comes from physics: 1 MW over 300 K takes about {airKgS} kg/s of air (derived), and the blower’s {blowerRate} m³/s (estimate), at {airSpeed} m/s (estimate), gives a duct of {ductDiameter} m (derived). The air there reaches up to about 500 °C, and nobody touches these ducts: their lukewarm jacket says nothing of what passes inside.',
    ),
    material: l('Tôle d’acier inoxydable, isolant, habillage', 'Stainless sheet, insulation, jacket'),
    specs: [
      sp('Diamètre intérieur', 'Inside diameter', tf('derived', 'environ {ductDiameter} m', 'about {ductDiameter} m')),
      sp('Vitesse d’air retenue', 'Air speed taken', tf('estimate', '{airSpeed} m/s')),
      sp('Débit massique à 300 K d’écart', 'Mass flow at a 300 K difference', tf('derived', '{airKgS} kg/s')),
      sp(
        'Longueur, conductance',
        'Length, conductance',
        tf('estimate', '{ductLength} m, {ductWK} W/K', '{ductLength} m, {ductWK} W/K'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un soufflet de dilatation fatigué, une fuite à une bride. L’air chaud sous pression sort alors par là, et la boucle cesse d’être fermée.',
        check:
          'À chaud et de loin : caméra thermique le long de la gaine, écoute des brides. Une perte de pression de boucle confirme le diagnostic.',
        care: 'Joints et soufflets contrôlés à l’arrêt ; isolant et habillage remis en état aussitôt.',
      },
      {
        failure:
          'A tired expansion bellows, a leak at a flange. The hot air under pressure comes out there, and the loop stops being closed.',
        check:
          'When hot and from a distance: a thermal camera along the duct, listening at the flanges. A loss of pressure in the loop confirms it.',
        care: 'Seals and bellows checked when stopped; insulation and jacket put right at once.',
      },
    ),
    tip: l(
      'Coupez les Flux, rallumez-les, et suivez le chemin : un tuyau gros comme un homme pour porter autant de puissance que quelques tuyaux d’eau.',
      'Switch the Flows off and on again, and follow the path: a pipe as wide as a person to carry as much power as a few water pipes.',
    ),
    design: lf(
      'L’air est un mauvais transporteur de chaleur : voilà pourquoi il demande {ductDiameter} m de gaine là où {waterKgS} kg/s d’eau suffisent (dérivé). On le choisit parce qu’il ne bout pas, ne gèle pas et supporte très bien la température : le reste découle de ce choix.',
      'Air is a poor carrier of heat: that is why it asks for {ductDiameter} m of duct where {waterKgS} kg/s of water will do (derived). It is chosen because it does not boil or freeze and takes temperature very well: the rest follows from that choice.',
    ),
  },
  {
    id: 'cold-air-duct',
    scene: 'plant-room',
    category: 'mechanical',
    name: l('Gaine d’air froid', 'Cool-air duct'),
    short: lf(
      'L’air revient et repart : la boucle est fermée, c’est toujours le même air. Environ {airOut} °C en sortie d’échangeur (estimation).',
      'The air comes back and leaves again: the loop is closed, the same air every time. About {airOut} °C leaving the exchanger (estimate).',
    ),
    description: lf(
      'La vidéo principale parle d’un transfert en boucle fermée, et le mot compte : on n’aspire pas l’air du dehors, on ne le rejette pas. L’air cédé à l’échangeur repart vers la pierre, à environ {airOut} °C au point de calcul (estimation), {pinch} K au-dessus du retour de l’eau (estimation). Cette gaine porte le côté froid, mais « froid » reste relatif : l’air sert à nouveau, avec sa chaleur restante, et rien n’entre de l’extérieur, donc ni poussière ni humidité. Ses pertes comptent peu : plus l’air est froid, moins il perd de chaleur.',
      'The main video speaks of a closed-loop transfer, and the word matters: no air is drawn in from outside, none is thrown away. The air that has given up its heat at the exchanger returns to the stone, at about {airOut} °C at the design point (estimate), {pinch} K above the return water (estimate). This duct carries the cool side, but “cool” stays relative: the air serves again with its remaining heat, and nothing gets in from outside, so neither dust nor damp. Its losses count for little: the cooler the air, the less heat it loses.',
    ),
    material: l('Tôle d’acier, isolant, habillage', 'Sheet steel, insulation, jacket'),
    specs: [
      sp('Boucle', 'Loop', l('fermée, rapportée', 'closed, reported')),
      sp(
        'Air en sortie d’échangeur',
        'Air leaving the exchanger',
        tf('estimate', '{airOut} °C au point de calcul', '{airOut} °C at the design point'),
      ),
      sp('Écart avec l’eau de retour', 'Gap with the return water', tf('estimate', '{pinch} K')),
    ],
    maintenance: maint(
      {
        failure:
          'Une fuite vers l’intérieur : c’est le seul endroit où l’air extérieur et son humidité peuvent entrer. Avec de l’air humide, la boucle n’est plus vraiment fermée, et les soudures chaudes n’aiment pas cela.',
        check:
          'Un essai de pression de la boucle à l’arrêt, et l’humidité de l’air de boucle si l’installation la mesure.',
        care: 'Joints refaits, supports libres, pas d’ouverture de trappes sans les refermer et les contrôler.',
      },
      {
        failure:
          'A leak inwards: the only place where outside air and its damp can get in. With damp air the loop is no longer really closed, and hot welds dislike that.',
        check:
          'A pressure test of the loop while stopped, and the humidity of the loop’s air if the plant measures it.',
        care: 'Seals renewed, supports free, no hatch opened without closing and checking it again.',
      },
    ),
    tip: l(
      'Le mot « batterie » trompe : il n’y a ici ni électrolyte, ni charge chimique. Une boucle d’air, c’est juste de la plomberie.',
      'The word “battery” misleads: there is neither electrolyte nor chemical charge here. An air loop is just plumbing.',
    ),
    design: l(
      'Une boucle ouverte aurait moins de gaines, mais elle ferait entrer l’hiver finlandais dans la pierre et rejetterait la chaleur restante. La boucle fermée récupère tout ce que l’échangeur n’a pas pris.',
      'An open loop would have fewer ducts, but it would let the Finnish winter into the stone and throw away the heat left over. The closed loop recovers all that the exchanger did not take.',
    ),
    video: ['01:26'],
  },
  {
    id: 'air-water-exchanger',
    scene: 'plant-room',
    category: 'hydraulic',
    name: l('Échangeur air-eau', 'Air-to-water exchanger'),
    short: lf(
      'C’est ici que 1 MW passe de l’air à l’eau du village : {exchangerUA} kW/K dans le modèle (résultat du modèle).',
      'Here 1 MW passes from the air to the village’s water: {exchangerUA} kW/K in the model (model result).',
    ),
    description: lf(
      'L’échangeur est la seule pièce où les deux fluides se rencontrent, sans se mélanger. L’air chaud cède sa chaleur à l’eau du réseau, à contre-courant : l’air qui sort froid croise l’eau qui entre froide, et l’eau qui sort chaude croise l’air qui entre chaud. Ainsi, l’air sort à {airOut} °C, {pinch} K au-dessus du retour (estimation), ce qui donne {exchangerUA} kW/K par MW (résultat du modèle). Sa taille n’est pas publiée. C’est lui qui décide quand la chaleur n’est plus utile : le lit n’est plus utile quand l’air ne peut plus porter l’eau à 85 °C. C’est là que {stays} MWh restent dans la pierre (résultat du modèle). Le constructeur prévoit d’autres sorties, vapeur et air chaud, pour l’industrie.',
      'The exchanger is the one part where the two fluids meet, without mixing. The hot air gives its heat to the network’s water, in counterflow: the air leaving cold meets the water entering cold, and the water leaving hot meets the air entering hot. So the air leaves at {airOut} °C, {pinch} K above the return (estimate), which gives {exchangerUA} kW/K per MW (model result). Its size is not published. It decides when the heat is no longer useful: the bed stops being useful when the air can no longer take the water to 85 °C. That is where {stays} MWh stay in the stone (model result). The maker foresees other outputs, steam and hot air, for industry.',
    ),
    material: l(
      'Tubes à ailettes, côté eau en acier, côté air en acier ou aluminium',
      'Finned tubes, steel on the water side, steel or aluminium on the air side',
    ),
    specs: [
      sp('Conception', 'Design', l('contre-courant, air-eau', 'counterflow, air to water')),
      sp('Conductance', 'Conductance', tf('model', '{exchangerUA} kW/K par MW', '{exchangerUA} kW/K per MW')),
      sp(
        'Air en sortie',
        'Air out',
        tf('estimate', '{airOut} °C, {pinch} K au-dessus du retour', '{airOut} °C, {pinch} K above the return'),
      ),
      sp(
        'Eau en sortie',
        'Water out',
        l('85 °C : le départ d’une installation sœur', '85 °C: the supply of a sister plant'),
      ),
      sp(
        'Reste dans la pierre',
        'Stays in the stone',
        tf('model', '{stays} MWh sous l’eau de départ', '{stays} MWh below the water’s supply'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une fuite d’eau dans la boucle d’air, le pire scénario : de l’eau sur des tubes chauds devient de la vapeur. Plus banalement, un encrassement côté eau qui fait baisser la chaleur transmise.',
        check:
          'La différence de température entre l’air et l’eau, à mêmes débits : si elle grandit au fil des ans, l’échange se dégrade. Toute baisse inattendue de pression d’eau se suit de près.',
        care: 'Eau du réseau traitée ; nettoyage côté eau ; inspection des tubes à l’arrêt, à froid, avant l’hiver.',
      },
      {
        failure:
          'A water leak into the air loop, the worst case: water on hot pipes turns to steam. More mundanely, fouling on the water side that cuts the heat passed on.',
        check:
          'The temperature difference between the air and the water at the same flows: if it widens over the years, the exchange is degrading. Any unexplained fall in water pressure gets followed closely.',
        care: 'Network water treated; the water side cleaned; pipes inspected stopped and cold, before winter.',
      },
    ),
    tip: l(
      'Essayez un retour de réseau plus chaud dans la simulation, ou un départ plus élevé : l’échangeur se fait moins accommodant, et la capacité chute.',
      'Try a warmer network return in the simulation, or a higher supply: the exchanger becomes less obliging, and the capacity falls.',
    ),
    design: lf(
      'Le plancher de {floor} °C s’écrit presque sur un coin de table : air froid + P / (ε·C), avec {airOut} °C, 1 MW, et le débit de la soufflante (résultat du modèle, estimation). Un échangeur plus grand y gagnerait peu : ce qui limite, c’est le débit d’air. C’est pourquoi le modèle tient son équilibre sur la soufflante.',
      'The floor of {floor} °C can almost be worked out on a napkin: cold air + P / (ε·C), with {airOut} °C, 1 MW and the blower’s flow (model result, estimate). A bigger exchanger would gain little: what limits is the flow of air. That is why the model’s balance rests on the blower.',
    ),
    video: ['01:29'],
  },
  {
    id: 'dh-pump',
    scene: 'plant-room',
    category: 'hydraulic',
    name: l('Pompe du réseau', 'Network pump'),
    short: lf(
      'Elle envoie l’eau vers le village : environ {waterKgS} kg/s à 1 MW (dérivé), sous environ {pumpKpa} kPa (estimation).',
      'It sends the water out to the village: about {waterKgS} kg/s at 1 MW (derived), at about {pumpKpa} kPa (estimate).',
    ),
    description: lf(
      'Le débit d’eau reste libre : l’automatisme le règle pour que l’eau parte à 85 °C. Si la chaleur manque, il réduit l’eau pour garder la température, et le débit tombe. Pour 1 MW et 40 K d’écart, il faut environ {waterKgS} kg/s (dérivé), sous une pression d’environ {pumpKpa} kPa (estimation) : c’est modeste comparé à l’air qu’il faut déplacer pour la même puissance. Une pompe de ce type est un appareil ordinaire. Sur ce réseau, on ne sait pas s’il y en a une autre de secours : aucune source n’en parle. La pompe, comme la soufflante, a besoin de courant.',
      'The water flow stays free: the controller sets it so that the water leaves at 85 °C. If heat runs short it cuts the water to hold the temperature, and the flow falls. For 1 MW and a 40 K difference it takes about {waterKgS} kg/s (derived), at a pressure of about {pumpKpa} kPa (estimate): modest compared with the air to be moved for the same power. A pump of this kind is an ordinary device. On this network, nobody knows if there is a spare one: no source mentions it. The pump, like the blower, needs current.',
    ),
    material: l(
      'Corps de fonte, roue et arbre d’acier, garniture mécanique, moteur',
      'Cast iron body, steel impeller and shaft, mechanical seal, motor',
    ),
    specs: [
      sp('Débit à 1 MW', 'Flow at 1 MW', tf('derived', '{waterKgS} kg/s')),
      sp('Pression', 'Pressure', tf('estimate', '{pumpKpa} kPa')),
      sp('Réglage', 'Control', l('selon la température de départ', 'on the supply temperature')),
    ],
    maintenance: maint(
      {
        failure:
          'Une garniture qui fuit, une cavitation si la pression tombe trop bas, un moteur qui s’arrête, et un village à qui il ne reste que la chaudière.',
        check: 'Pression en amont et en aval, bruit caractéristique de cavitation, température et vibration du palier.',
        care: 'Garniture à changer, roulements selon le fabricant, et une pompe de secours testée si elle existe.',
      },
      {
        failure:
          'A leaking seal, cavitation if the pressure falls too low, a motor that stops, and a village left with only the boiler.',
        check: 'Pressure before and after, the characteristic sound of cavitation, bearing temperature and vibration.',
        care: 'Seal to change, bearings to the manufacturer’s schedule, and a standby pump tested if there is one.',
      },
    ),
    tip: l(
      'Quelques kilowatts ici, plus d’une dizaine pour déplacer l’air : chaque fois qu’on hésite, la comparaison entre l’air et l’eau revient à la même chose.',
      'A few kilowatts here, more than ten to move the air: whenever in doubt, the comparison of air and water comes back to the same thing.',
    ),
    design: l(
      'Régler sur la température et non sur le débit, c’est livrer une eau toujours utilisable aux bâtiments : mieux vaut peu d’eau à la bonne température que beaucoup d’eau tiède.',
      'Controlling on temperature and not on flow delivers water the buildings can always use: better little water at the right temperature than plenty of lukewarm water.',
    ),
  },
  {
    id: 'heat-meter',
    scene: 'plant-room',
    category: 'hydraulic',
    name: l('Compteur de chaleur', 'Heat meter'),
    short: l(
      'Ce qui est vendu, donc ce que veut dire un rendement : débit multiplié par écart de température, à la sortie du silo.',
      'What is sold, and so what an efficiency means: flow times temperature difference, on the way out of the silo.',
    ),
    description: lf(
      'Un rendement n’a de sens qu’au regard de ce qu’on mesure, et ce compteur est l’une de ses deux bornes : le rendement, ici, c’est la chaleur vendue sur toute l’électricité au compteur, en tenant compte de ce que la pierre a gagné ou perdu. Tous les chiffres publiés viennent du constructeur ou de ses clients, et ils ne concordent pas : environ 80 %, plus de 85 % après la première année sans méthode indiquée, de 80 à 90 % ailleurs ; de 60 à 75 % sur le premier silo. Le modèle trouve {etaYear} % sur l’année, mais {etaCycle} % sur un cycle à pleine puissance et {etaWeek} % après une semaine de repos (résultat du modèle). Lisez {etaYear} % comme un plafond : le modèle ne connaît ni fuites d’air, ni vrais ponts thermiques, ni les réglages d’une première année.',
      'An efficiency only means something in terms of what gets measured, and this meter is one of its two ends: efficiency here is the heat sold over all the electricity at the meter, allowing for what the stone has gained or lost. Every published figure comes from the maker or its customers, and they disagree: about 80%, above 85% after the first year with no method stated, 80 to 90% elsewhere; 60 to 75% on the first silo. The model finds {etaYear}% over a year, but {etaCycle}% on a full-power cycle and {etaWeek}% after a week of rest (model result). Read {etaYear}% as a ceiling: the model knows no air leaks, no real thermal bridges, none of a first year’s ramp-ups.',
    ),
    material: l(
      'Débitmètre, deux sondes de température appairées, calculateur',
      'Flow meter, two matched temperature probes, calculator',
    ),
    specs: [
      sp(
        'Calcul',
        'Calculation',
        l('débit × écart de température × capacité de l’eau', 'flow × temperature difference × heat capacity of water'),
      ),
      sp(
        'Rendement, sur un an',
        'Efficiency, over a year',
        tf('model', '{etaYear} %, à lire comme un plafond', '{etaYear}%, to be read as a ceiling'),
      ),
      sp(
        'Sur un cycle',
        'On a cycle',
        tf(
          'model',
          '{etaCycle} %, {etaWeek} % après une semaine de repos',
          '{etaCycle}%, {etaWeek}% after a week of rest',
        ),
      ),
      sp(
        'Pertes, sur un an',
        'Losses, over a year',
        tf('model', 'parois {wallsYear} %, circulation {circYear} %', 'walls {wallsYear}%, circulation {circYear}%'),
      ),
      sp('Répartition annoncée', 'Announced split', l('environ 5 % et moins de 5 %', 'about 5% and under 5%')),
    ],
    maintenance: maint(
      {
        failure:
          'Une sonde qui dérive : sur 40 K d’écart, 1 K d’erreur représente {meterError} % de la chaleur comptée (dérivé). Le silo semble soudain plus ou moins bon, sans que rien n’ait changé.',
        check:
          'Comparez les deux sondes dans la même eau, sans chaleur transférée : elles doivent lire pareil. C’est tout l’intérêt de les avoir appairées.',
        care: 'Étalonnage à la périodicité fixée par les règles du pays et du contrat.',
      },
      {
        failure:
          'A drifting probe: over a 40 K difference, 1 K of error is {meterError}% of the heat counted (derived). The silo suddenly seems better or worse, though nothing has changed.',
        check:
          'Compare the two probes in the same water, with no heat moving: they should read alike. That is the whole point of having them matched.',
        care: 'Calibration at the intervals set by the country’s rules and the contract.',
      },
    ),
    tip: lf(
      'Le modèle partage les pertes à peu près comme le constructeur, {wallsYear} % et {circYear} % sur un an (résultat du modèle), mais sur un seul cycle à plein régime, les parois montent à {wallsCycle} %. Un rendement dit toujours sur quel cycle il a été calculé, ou il ne dit rien.',
      'The model splits the losses about as the maker does, {wallsYear}% and {circYear}% over a year (model result), but on a single full-power cycle the walls rise to {wallsCycle}%. An efficiency always says what cycle it was computed on, or it says nothing.',
    ),
    design: l(
      'Le chiffre annoncé de la première année, plus de 85 %, et celui de la page plus ancienne, environ 80 %, peuvent être vrais tous les deux : leurs dates, leurs cycles et leurs définitions diffèrent. C’est la leçon la plus utile de ce compteur.',
      'The first-year figure, above 85%, and the older page’s, about 80%, can both be true: their dates, their cycles and their definitions differ. It is the most useful lesson of this meter.',
    ),
  },
  {
    id: 'expansion-vessel',
    scene: 'plant-room',
    category: 'hydraulic',
    name: l('Vase d’expansion', 'Expansion vessel'),
    short: l(
      'L’eau chaude grandit, elle aussi : ce réservoir à membrane encaisse la différence sans que la pression s’emballe.',
      'Hot water grows too: this membrane tank takes up the difference without the pressure running away.',
    ),
    description: lf(
      'Comme l’inox des tubes, l’eau se dilate quand elle chauffe. Dans un circuit fermé, cela ferait monter la pression, jusqu’à ce qu’une soupape s’ouvre. Le vase d’expansion, un réservoir à membrane avec un coussin de gaz, offre à l’eau un peu d’espace supplémentaire. Quand la température de l’eau varie, de {returnT} °C (estimation) jusqu’à 85 °C, c’est là que ce volume est encaissé. L’appareil est banal : tout circuit de chauffage fermé en possède un, et sa taille dépend de l’eau du réseau, qui n’est pas publiée. Il compte ici parce qu’il illustre une idée présente à tous les étages de la machine : tout ce qui chauffe grandit.',
      'Like the stainless steel of the pipes, water expands as it warms. In a closed circuit this would raise the pressure until a relief valve opened. The expansion vessel, a membrane tank with a cushion of gas, gives the water a little extra room. As the water’s temperature varies, from {returnT} °C (estimate) up to 85 °C, that volume is taken up here. The device is ordinary: every closed heating circuit has one, and its size depends on the water in the network, which is not published. It matters here because it shows an idea found on every level of the machine: whatever warms, grows.',
    ),
    material: l('Cuve d’acier, membrane, coussin de gaz', 'Steel vessel, membrane, gas cushion'),
    specs: [
      sp('Type', 'Type', l('à membrane, générique', 'membrane type, generic')),
      sp(
        'Écart de température à encaisser',
        'Temperature change to take',
        tf('estimate', 'de {returnT} à 85 °C', '{returnT} to 85 °C'),
      ),
      sp(
        'Taille',
        'Size',
        l('non publiée : elle dépend de l’eau du réseau', 'not published: it depends on the network’s water'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une membrane percée ou un coussin de gaz vide : la pression fait alors le yoyo et la soupape coule à chaque chauffe.',
        check:
          'La pression de gaz, pompe arrêtée et circuit isolé. Un manomètre qui oscille beaucoup à chaque variation de température dit la même chose.',
        care: 'Pression de gaz vérifiée une fois par an, soupape testée.',
      },
      {
        failure:
          'A torn membrane or an empty gas cushion: the pressure then swings and the relief valve weeps at each heating.',
        check:
          'The gas pressure, with the pump stopped and the circuit isolated. A gauge that swings a lot with each change of temperature says the same.',
        care: 'Gas pressure checked once a year, the relief valve tested.',
      },
    ),
    tip: l(
      'Une soupape qui coule n’est presque jamais un défaut de soupape : regardez d’abord le vase.',
      'A weeping relief valve is hardly ever a fault of the valve: look at the vessel first.',
    ),
    design: l(
      'Le vase garde la pression dans une plage où les bâtiments et la pompe sont à l’aise, sans jamais perdre d’eau. Il évite un appoint d’eau à chaque cycle : de l’eau fraîche, c’est de l’oxygène et de la corrosion en plus.',
      'The vessel keeps the pressure in a range where the buildings and the pump are at ease, without ever losing water. It avoids topping up at every cycle: fresh water means more oxygen and more corrosion.',
    ),
  },
  {
    id: 'control-cabinet',
    scene: 'plant-room',
    category: 'electrical',
    name: l('Armoire d’automatisme', 'Control cabinet'),
    short: l(
      'Elle lit les prix et décide des heures de charge, selon un algorithme d’un prestataire, dont le constructeur parle sans le publier.',
      'It reads the prices and decides the charging hours, on a contractor’s algorithm the maker mentions without publishing it.',
    ),
    description: lf(
      'Cette armoire est le cerveau du silo. Selon le constructeur, un algorithme fourni par un prestataire optimise la charge et la participation au marché de réserve ; elle exécute aussi les sécurités. Le modèle propose ses propres règles : charger dès qu’il y a de la place, sous un prix, avec l’optimiseur qui connaît la semaine, à vos heures peintes, sur le surplus solaire, ou jamais. D’après l’exploitant, la charge de la première année a coûté de 70 à 80 % sous la moyenne du marché, et plus de 90 % certains mois. Sur notre semaine dessinée, l’optimiseur en est à {discountDrawn} % (résultat du modèle). Rien ne dit que son vrai algorithme ressemble au nôtre : le nôtre planifie sur un modèle réduit et son plan est validé par le modèle complet.',
      'This cabinet is the silo’s brain. According to the maker, an algorithm from a contractor optimises the charging and the part played in the reserve market; it also runs the safeties. The model offers rules of its own: charge whenever there is room, under a price, with the optimiser that knows the week, on your painted hours, on the solar overflow, or never. According to the operator, the charging of the first year cost 70 to 80% below the market mean, and over 90% in some months. On our drawn week the optimiser stands at {discountDrawn}% (model result). Nothing says its real algorithm resembles ours: ours plans on a reduced model and its plan is checked on the full one.',
    ),
    material: l(
      'Automates, relais de sécurité, réseau, armoire d’acier',
      'Controllers, safety relays, network, steel cabinet',
    ),
    specs: [
      sp('Algorithme', 'Algorithm', l('d’un prestataire, non publié', 'from a contractor, not published')),
      sp(
        'Rabais annoncé',
        'Announced discount',
        l(
          'de 70 à 80 % sous la moyenne, plus de 90 % certains mois',
          '70 to 80% below the mean, over 90% in some months',
        ),
      ),
      sp('Sur la semaine dessinée', 'On the drawn week', tf('model', '{discountDrawn} %', '{discountDrawn}%')),
      sp(
        'Sur une vraie année, contrôle hors du labo',
        'On a real year, a check outside the lab',
        tf('model', 'de {discountRealLow} à {discountRealHigh} %', '{discountRealLow} to {discountRealHigh}%'),
      ),
      sp(
        'Part de la pierre',
        'Share of the stone',
        tf(
          'model',
          'de {coverageLow} à {coverageHigh} % de la chaleur',
          '{coverageLow} to {coverageHigh}% of the heat',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une liaison de données coupée : plus de prix, donc plus de décision. L’armoire doit alors retomber sur une règle sûre, et les sécurités ne doivent jamais dépendre d’elle seule.',
        check:
          'Un essai de perte de liaison ; les journaux d’alarmes ; le pressostat qui coupe bien sans passer par l’automate.',
        care: 'Sauvegarde du programme, mises à jour décidées et contrôlées, accès réseau tenu fermé.',
      },
      {
        failure:
          'A cut data link: no prices, so no decision. The cabinet must then fall back on a safe rule, and the safeties must never depend on it alone.',
        check:
          'A test of link loss; the alarm logs; the pressure switch cutting properly without going through the controller.',
        care: 'Program backed up, updates decided and checked, network access kept shut.',
      },
    ),
    tip: l(
      'Le mini-jeu de la leçon sur les heures bon marché vous met à la place de cette armoire : essayez de battre l’adversaire, mais n’oubliez pas ce qu’il reste dans la pierre à la fin de la semaine.',
      'The game in the lesson on cheap hours puts you in this cabinet’s place: try to beat the opponent, but do not forget what is left in the stone at the end of the week.',
    ),
    design: l(
      'La pierre ne change rien aux prix, mais elle permet de ne plus les subir : ce qui compte n’est plus la température du moment, mais ce qu’on fera de la semaine. Cela fait de l’automatisme la pièce la moins chère à améliorer.',
      'The stone changes nothing about prices, but it means you no longer have to endure them: what counts is no longer today’s temperature but what you do with the week. That makes the control system the cheapest part to improve.',
    ),
  },
];
