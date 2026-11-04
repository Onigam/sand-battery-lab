// The six lessons (docs/research.md §0.6), each opening on a scenario of the simulation, two quiz questions each. The heart is lesson 4: a capacity only means something at a given power. What
// the model finds is used in place of the research's text (docs/physics.md): 69 MWh at the rated 1 MW against the 100 MWh quoted, the budget of the 217 MWh, the 250 MWh silo's 2.3 against the 2.5
// quoted, efficiency as a ceiling. Lesson 5 is written around the charging-hours game as it stands today: blocks of three hours in the simulation panel. The proper widget is a kit request, which is not the visitor's business.
// « We found no independent measurement » is said once, in the simulation panel under the year's efficiency: the lessons do not repeat it.
import type { Lesson } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, mf, sp } from './part-helpers';

export const LESSONS: Lesson[] = [
  {
    id: 'heat-in-stone',
    title: l('De la chaleur dans une pierre', 'Heat in a stone'),
    summary: l(
      'E = m·c·ΔT : pourquoi c n’est pas fixe, et pourquoi deux silos de la même taille stockent 100 et 250 MWh.',
      'E = m·c·ΔT: why c is not fixed, and why two silos of the same size store 100 and 250 MWh.',
    ),
    body: [
      lf(
        'Une pierre chaude n’a rien de chimique : elle garde de la chaleur, à raison de sa masse, de sa capacité thermique et de son écart de température. Le plus grand silo en service ne contient pas de sable, mais environ 2 000 t de pierre ollaire concassée. À 400 °C de moyenne et {soapstoneC} kJ/kg·K (hypothèse), cela fait **{heatFull} MWh au-dessus de 10 °C** (dérivé). Le constructeur, lui, annonce jusqu’à 100 MWh. La quatrième leçon explique cet écart.',
        'A hot stone involves no chemistry: it holds heat in proportion to its mass, its heat capacity and its temperature difference. The largest silo in service holds no sand but about 2,000 t of crushed soapstone. At a mean of 400 °C and {soapstoneC} kJ/kg·K (assumption), that makes **{heatFull} MWh above 10 °C** (derived). The maker, for its part, quotes up to 100 MWh. The fourth lesson explains the gap.',
      ),
      lf(
        'Le « c » n’est pas une constante. Un sable mesuré passe de 776 J/kg·K à 60 °C à 1 133 à 500 °C, soit {meanCSand} en moyenne sur la course (dérivé) : la valeur fixe de 0,8 kJ/kg·K, juste près de l’ambiante, sous-estime l’énergie d’environ {understate} % (dérivé). Pour la pierre ollaire, la courbe réelle n’est pas connue, et le modèle la tient à {soapstoneC} : c’est une hypothèse. Avec la forme de la courbe du sable, la chaleur à plein tomberait à {soapstoneCurvedHeat} MWh (résultat du modèle).',
        'The “c” is no constant. A measured sand goes from 776 J/kg·K at 60 °C to 1,133 at 500 °C, a mean of {meanCSand} over the swing (derived): the fixed value of 0.8 kJ/kg·K, right near room temperature, understates the energy by about {understate}% (derived). For soapstone the real curve is not known, and the model holds it at {soapstoneC}: an assumption. With the shape of sand’s curve, the heat when full would fall to {soapstoneCurvedHeat} MWh (model result).',
      ),
      lf(
        'À presque la même taille vue du dehors, le silo de 250 MWh annonce {ratioQuoted} fois plus que celui de 100 MWh (dérivé). Soit {specificV} contre {specificLab} kJ/kg, ou une course moyenne de {swingV} K contre {swingLab} K (dérivé). Le modèle trouve {ratioV} fois : la masse fait ×{factorMass}, un sommet 100 K plus haut ×{factorTop}, le c(T) du sable ×{factorC} (résultat du modèle). Il retrouve le rapport, pas la valeur absolue, {usableV} MWh. Et dedans, la même taille cache {bedVolumeV} m³ de lit contre {bedVolume} m³ (dérivé).',
        'At nearly the same outside size, the 250 MWh silo quotes {ratioQuoted} times as much as the 100 MWh one (derived). That is {specificV} against {specificLab} kJ/kg, or a mean swing of {swingV} K against {swingLab} K (derived). The model finds {ratioV} times: the mass gives ×{factorMass}, a top 100 K higher ×{factorTop}, sand’s c(T) ×{factorC} (model result). It finds the ratio, not the absolute figure, {usableV} MWh. And inside, the same size hides {bedVolumeV} m³ of bed against {bedVolume} m³ (derived).',
      ),
      lf(
        'Comparée à l’eau, la pierre tient : {densityBed} kWh/m³ annoncés pour le lit contre {densityWater} kWh/m³ pour de l’eau de 45 à 95 °C (dérivé), et sa chaleur reste utile au-dessus de 100 °C. Lancez le scénario : le même silo passe de la pierre au sable, un tiers plus léger, et un air très chaud franchit la ligne de 573 °C, où le quartz change de forme.',
        'Against water, stone holds up: {densityBed} kWh/m³ quoted for the bed against {densityWater} kWh/m³ for water from 45 to 95 °C (derived), and its heat stays useful above 100 °C. Run the scenario: the same silo goes from stone to sand, a third lighter, and very hot air crosses the 573 °C line, where quartz changes form.',
      ),
    ],
    figures: [
      sp('Pierre', 'Stone', l('environ 2 000 t, pas de sable', 'about 2,000 t, no sand')),
      sp('Chaleur à plein', 'Heat when full', mf('derived', '{heatFull} MWh')),
      sp('Annoncé', 'Quoted', l('jusqu’à 100 MWh', 'up to 100 MWh')),
      sp('Eau, de 45 à 95 °C', 'Water, 45 to 95 °C', mf('derived', '{densityWater} kWh/m³')),
    ],
    formula: 'E = m · c(T) · ΔT',
    focus: { scene: 'silo', part: 'storage-bed', scenario: 'soapstone-vs-sand' },
    quiz: [
      {
        q: l(
          'Un calcul sur du sable prend c = 0,8 kJ/kg·K de 100 à 500 °C. Son résultat est…',
          'A calculation on sand takes c = 0.8 kJ/kg·K from 100 to 500 °C. Its result is…',
        ),
        choices: [
          l('juste : c est une constante', 'right: c is a constant'),
          lf('trop bas d’environ {understate} % (dérivé)', 'too low by about {understate}% (derived)'),
          l('trop haut : c baisse avec la température', 'too high: c falls with temperature'),
        ],
        answer: 1,
        explain: lf(
          'Un sable mesuré monte de 776 à 1 133 J/kg·K sur cette course, avec {meanCSand} en moyenne (dérivé). La valeur de 0,8 ne vaut que près de l’ambiante.',
          'A measured sand climbs from 776 to 1,133 J/kg·K over this swing, a mean of {meanCSand} (derived). The value of 0.8 only holds near room temperature.',
        ),
      },
      {
        q: l(
          'Selon le modèle, qu’est-ce qui explique surtout que le silo de 250 MWh stocke tant, à presque la même taille ?',
          'In the model, what mostly explains why the 250 MWh silo stores so much, at nearly the same size?',
        ),
        choices: [
          lf(
            'sa masse : son lit de sable pèse plus lourd que la pierre d’ici, ×{factorMass} (résultat du modèle)',
            'its mass: its bed of sand weighs more than the stone here, ×{factorMass} (model result)',
          ),
          lf(
            'un sommet 100 K plus haut, ×{factorTop} (résultat du modèle)',
            'a top 100 K higher, ×{factorTop} (model result)',
          ),
          lf('le c(T) du sable, ×{factorC} (résultat du modèle)', 'sand’s c(T), ×{factorC} (model result)'),
        ],
        answer: 1,
        explain: lf(
          'La course utilisable part d’un plancher fixé par l’air, et non de l’ambiante : 100 K de plus en haut pèsent donc lourd. Le modèle donne {ratioV} fois au total contre {ratioQuoted} annoncé, mais pas les valeurs absolues (résultat du modèle ; dérivé pour le rapport annoncé).',
          'The usable swing starts from a floor set by the air, not from ambient: so 100 K more at the top weighs heavily. The model gives {ratioV} times in all against {ratioQuoted} quoted, but not the absolute figures (model result; derived for the quoted ratio).',
        ),
      },
    ],
  },
  {
    id: 'the-gradient',
    title: l('Une chaleur qui se traîne', 'Heat that crawls'),
    summary: l(
      'Un mètre de sable, huit jours : pourquoi il faut tant de tubes, et comment on garde un cœur chaud.',
      'A metre of sand, eight days: why it takes so many pipes, and how a hot core is kept.',
    ),
    body: [
      lf(
        'Un lit de pierre n’a pas de convection : rien n’y remue, à la différence de l’eau d’un ballon. Selon le constructeur, 1 m de sable à 20 °C, chauffé à 500 °C sur une face, met un peu plus de 8 jours à atteindre 100 °C sur l’autre. Le modèle trouve {block} jours avec les valeurs mesurées (résultat du modèle). La chaleur se traîne.',
        'A bed of stone has no convection: nothing stirs, unlike the water in a tank. According to the maker, 1 m of sand at 20 °C, heated to 500 °C on one face, takes a little over 8 days to reach 100 °C on the other. The model finds {block} days with the measured values (model result). Heat crawls.',
      ),
      lf(
        'C’est pourquoi on va la chercher partout. Le tracé réel reste secret ; le nôtre sort d’un calcul : un tube tous les {pitch} m (estimation), soit {legs} branches et {pipeKm} km (résultat du modèle). À 1 MW, {dropK} K se perdent entre le tube et la moyenne de la pierre autour (résultat du modèle). Au pas de 1 m, le modèle ne tient plus 1 MW à 400 °C. Et une bouffée d’heures bon marché s’arrête près du tube : le temps propre d’une cellule est d’environ {cellHours} h (résultat du modèle).',
        'That is why it gets fetched everywhere. The real layout remains secret; ours comes from a calculation: a pipe every {pitch} m (estimate), or {legs} legs and {pipeKm} km (model result). At 1 MW, {dropK} K are lost between the pipe and the mean of the stone around it (model result). At a pitch of 1 m the model can no longer hold 1 MW at 400 °C. And a burst of cheap hours stops near the pipe: the cell’s own time constant is about {cellHours} h (model result).',
      ),
      lf(
        'Cette lenteur se retourne en avantage : on charge le cœur d’abord et on décharge par l’extérieur, un principe que rapporte le constructeur, sans dire comment. La chaleur du centre doit traverser tout le lit pour atteindre la paroi. Un fait que le modèle montre sans qu’on s’y attende : une moyenne de 400 °C sous 500 °C d’air laisse peu de place à un cœur chaud, {coreFull} °C au centre et {edgeFull} °C au bord (résultat du modèle), bien plus plat que l’image publiée. Avec 650 °C d’air, on trouve {coreHotAir} °C et {edgeHotAir} °C.',
        'This slowness turns into an advantage: the core is charged first and discharged from the outside, a principle the maker reports without saying how. Heat at the centre has to cross the whole bed to reach the wall. One thing the model shows unexpectedly: a mean of 400 °C under 500 °C of air leaves little room for a hot core, {coreFull} °C at the centre and {edgeFull} °C at the edge (model result), much flatter than the published picture. With 650 °C of air, the figures are {coreHotAir} °C and {edgeHotAir} °C.',
      ),
      l(
        'Lancez le scénario : la même chaleur, répartie partout dès le début, avec un bord plus chaud et des parois qui perdent plus. La comparaison du panneau chiffre ce que change l’ordre. Gardez une idée pour la suite de la série : le gradient d’un ballon d’eau tient à ce que l’eau chaude monte. Celui-ci tient seulement à la lenteur et à l’ordre.',
        'Run the scenario: the same heat, spread everywhere from the start, with a hotter edge and walls that lose more. The panel’s comparison puts figures on what the order changes. Keep one idea for later in the series: a water tank’s gradient comes from hot water rising. This one comes only from slowness and order.',
      ),
    ],
    figures: [
      sp('1 m de sable, annoncé', '1 m of sand, quoted', l('un peu plus de 8 jours', 'a little over 8 days')),
      sp('Le même, dans le modèle', 'The same, in the model', mf('model', '{block} jours', '{block} days')),
      sp('Pas des tubes', 'Pipe pitch', mf('estimate', '{pitch} m')),
      sp('Convection', 'Convection', l('aucune', 'none')),
    ],
    formula: 't ≈ L² / α',
    focus: { scene: 'silo', part: 'pipe-field', scenario: 'core-first' },
    quiz: [
      {
        q: l(
          'Qu’est-ce qui crée le gradient de température dans le lit ?',
          'What creates the temperature gradient in the bed?',
        ),
        choices: [
          l(
            'l’air chaud qui monte entre les grains, comme l’eau chaude dans un ballon',
            'hot air rising between the grains, as hot water does in a tank',
          ),
          l('une cloison entre le cœur et le bord', 'a partition between core and edge'),
          l('la lenteur de la conduction et l’ordre de la charge', 'slow conduction and the order of charge'),
        ],
        answer: 2,
        explain: l(
          'L’air reste dans les tubes et rien ne remue dans la pierre. Les zones n’ont pas de cloison : ce sont des décisions de tuyauterie et de pilotage.',
          'The air stays in the pipes and nothing stirs in the stone. The zones have no partition: they are decisions of piping and control.',
        ),
      },
      {
        q: lf(
          'Pourquoi le modèle a-t-il besoin de tubes tous les {pitch} m (estimation), et non tous les 2 m ?',
          'Why does the model need pipes every {pitch} m (estimate), not every 2 m?',
        ),
        choices: [
          l('parce que l’air manque de pression', 'because the air lacks pressure'),
          l('parce que la pierre est trop lourde pour les tubes', 'because the stone is too heavy for the pipes'),
          l(
            'parce que la chaleur se déplace si lentement qu’un tube lointain ne pourrait pas donner 1 MW',
            'because heat moves so slowly that a distant pipe could not give 1 MW',
          ),
        ],
        answer: 2,
        explain: lf(
          'Au pas de 1 m déjà, le modèle ne tient plus 1 MW à 400 °C. Le pas de {pitch} m reste une estimation : le constructeur garde le sien secret.',
          'Even at a pitch of 1 m, the model can no longer hold 1 MW at 400 °C. The pitch of {pitch} m remains an estimate: the maker keeps its own secret.',
        ),
      },
    ],
  },
  {
    id: 'surface-and-volume',
    title: l('La surface et le volume', 'Surface and volume'),
    summary: l(
      'Pourquoi un silo garde sa chaleur des semaines et deux fûts une journée : la loi d’échelle, chiffres à l’appui.',
      'Why a silo keeps its heat for weeks and two drums for a day: the law of scale, in figures.',
    ),
    body: [
      lf(
        'La chaleur stockée croît avec le volume, la fuite avec la surface. Mesurez donc leur rapport : {avDrum} m⁻¹ pour un fût de 200 L, {avBin} pour un bac de 1 m³, {avFirst} pour le silo de 8 MWh et {avBed} pour le lit dessiné ici (dérivé). Chaque fois qu’on double le diamètre et la hauteur, ce rapport est divisé par deux. Aucun isolant ne rattrapera une petite taille.',
        'The heat stored grows with volume, the leak with surface. So measure their ratio: {avDrum} m⁻¹ for a 200 L drum, {avBin} for a 1 m³ bin, {avFirst} for the 8 MWh silo and {avBed} for the bed drawn here (derived). Each time diameter and height are doubled, this ratio halves. No insulation will make up for small size.',
      ),
      lf(
        'Le constructeur parle d’environ trois mois pour perdre la moitié de l’énergie : c’est le résultat de son propre modèle, pas une mesure, et sa phrase ne dit pas de quelle énergie il s’agit. Le nôtre l’encadre : {halfHeat} jours pour la chaleur au-dessus de l’ambiante, {halfUsable} jours pour ce qui peut encore sortir à 1 MW (résultat du modèle). Sur le terrain, ces installations tournent en jours ou en semaines, de 20 à 200 cycles par an, pas d’une saison à l’autre.',
        'The maker speaks of about three months to lose half of the energy: that is the result of its own model, not a measurement, and its sentence does not say which energy. Ours brackets it: {halfHeat} days for the heat above ambient, {halfUsable} days for what can still come out at 1 MW (model result). In the field these plants work in days or weeks, 20 to 200 cycles a year, not from one season to the next.',
      ),
      lf(
        'L’échelle se lit aussi dans les rendements annoncés : de 60 à 75 % pour le silo de 8 MWh, plus de 85 % pour celui de 100 MWh. Sur le même cycle, le modèle donne {kankaEta} % et {etaCycle} % (résultat du modèle) : il retrouve la direction, et il montre combien le repos compte, {etaWeek} % après une semaine de repos.',
        'Scale can also be read in the announced efficiencies: 60 to 75% for the 8 MWh silo, above 85% for the 100 MWh one. On the same cycle the model gives {kankaEta}% and {etaCycle}% (model result): it finds the direction, and it shows how much the rest matters, {etaWeek}% after a week of rest.',
      ),
      lf(
        'Et la maison ? Deux fûts de sable, c’est {drumsMass} kg, et sur 300 K, environ {drumsKwh} kWh (dérivé) : une demi-journée d’une maison de 5 kW, avant toute perte. Le modèle fait pire : {drumsFull} kWh à plein, moins de 1 kWh à 5 kW, {drumsHalfPower} kWh à 2,5 kW, {drumsFalling} kWh à puissance décroissante, et une demi-vie de {drumsHalfLife} jour (résultat du modèle). Des vidéos promettent un hiver entier : l’arithmétique dit quelques heures. Le constructeur n’a pas de produit pour la maison.',
        'And the house? Two drums of sand make {drumsMass} kg and, over 300 K, about {drumsKwh} kWh (derived): half a day of a 5 kW house, before any loss. The model does worse: {drumsFull} kWh when full, under 1 kWh at 5 kW, {drumsHalfPower} kWh at 2.5 kW, {drumsFalling} kWh at falling power, and a half-life of {drumsHalfLife} days (model result). Videos promise a whole winter: the sums say a few hours. The maker has no product for homes.',
      ),
    ],
    figures: [
      sp('Fût de 200 L', '200 L drum', mf('derived', '{avDrum} m⁻¹')),
      sp('Silo de 8 MWh', '8 MWh silo', mf('derived', '{avFirst} m⁻¹')),
      sp('Lit de ce silo', 'This silo’s bed', mf('derived', '{avBed} m⁻¹')),
      sp(
        'Demi-vie de la chaleur',
        'Half-life of the heat',
        mf(
          'model',
          '{halfHeat} jours ; deux fûts : {drumsHalfLife} jour',
          '{halfHeat} days; two drums: {drumsHalfLife} days',
        ),
      ),
    ],
    formula: 'A / V = 4 / D + 2 / H',
    focus: { scene: 'silo', part: 'wall-insulation', scenario: 'scale' },
    quiz: [
      {
        q: l(
          'On double le diamètre et la hauteur d’un silo. Le rapport surface sur volume est…',
          'A silo’s diameter and height are both doubled. The ratio of surface to volume is…',
        ),
        choices: [
          l('inchangé', 'unchanged'),
          l('divisé par deux', 'halved'),
          l('divisé par huit : le volume l’emporte', 'divided by eight: the volume wins'),
        ],
        answer: 1,
        explain: l(
          'La surface est multipliée par quatre et le volume par huit, donc leur rapport est divisé par deux. C’est toute la raison d’être des grands silos.',
          'The surface is multiplied by four and the volume by eight, so their ratio halves. That is the whole reason for big silos.',
        ),
      },
      {
        q: l(
          'Deux fûts de sable bien isolés peuvent-ils chauffer une maison un hiver ?',
          'Can two well-insulated drums of sand heat a house for a winter?',
        ),
        choices: [
          l('non : quelques heures au mieux', 'no: a few hours at best'),
          l(
            'oui, si on les charge en été et qu’on garde cette chaleur pour janvier',
            'yes, if they are charged in summer and that heat is kept for January',
          ),
          l(
            'oui, avec un sable très fin, qui garde mieux la chaleur',
            'yes, with very fine sand, which holds heat better',
          ),
        ],
        answer: 0,
        explain: lf(
          'L’arithmétique donne {drumsKwh} kWh avant toute perte (dérivé), une demi-journée d’une maison de 5 kW. Le rapport surface sur volume de {avDrum} m⁻¹ (dérivé) fait le reste : une demi-vie de {drumsHalfLife} jour (résultat du modèle). Aucune cote de construction n’est donnée ici.',
          'The sums give {drumsKwh} kWh before any loss (derived), half a day of a 5 kW house. A surface-to-volume ratio of {avDrum} m⁻¹ (derived) does the rest: a half-life of {drumsHalfLife} days (model result). No building dimension is given here.',
        ),
      },
    ],
  },
  {
    id: 'air-carries-the-power',
    title: l('Une capacité n’a de sens qu’à une puissance', 'A capacity only means something at a power'),
    summary: lf(
      '{usable} MWh à 1 MW (résultat du modèle), jusqu’à 100 MWh annoncés : c’est l’air qui porte la puissance, et c’est le cœur de ce labo.',
      '{usable} MWh at 1 MW (model result), up to 100 MWh quoted: air carries the power, and that is the heart of this lab.',
    ),
    body: [
      lf(
        'L’air porte la puissance : Q = ṁ·cₚ·ΔT. Pour sortir 1 MW sur 300 K d’écart, il faut environ {airKgS} kg/s d’air (dérivé). Or, plus la pierre refroidit, moins l’air revient chaud, et plus il en faudrait. À un moment, la soufflante n’en donne plus assez : c’est le plancher. Avec {blowerRate} m³/s par MW (estimation), il tombe à {floor} °C de moyenne (résultat du modèle), bien au-dessus de l’eau du réseau.',
        'Air carries the power: Q = ṁ·cₚ·ΔT. To get 1 MW out across a 300 K difference takes about {airKgS} kg/s of air (derived). Now, the cooler the stone, the less hot the air comes back, and the more of it is needed. At some point the blower cannot give enough: that is the floor. At {blowerRate} m³/s per MW (estimate), it lies at a mean of {floor} °C (model result), well above the network’s water.',
      ),
      lf(
        'Voici où vont les {heatFull} MWh d’un plein (dérivé). **{usable} MWh sortent à 1 MW** ({shareUsable} %). **{tail} MWh sortent ensuite, à puissance décroissante** ({shareTail} %), jusqu’à ce que l’échangeur ne porte plus l’eau à 85 °C. **{stays} MWh restent dans la pierre** ({shareStays} %), sous l’eau de départ : 2 000 t × 1 kJ/kg·K × 75 K font déjà {belowSupply} MWh (dérivé), et aucune soufflante n’y changera rien (résultat du modèle).',
        'Here is where the {heatFull} MWh of a full charge go (derived). **{usable} MWh come out at 1 MW** ({shareUsable}%). **{tail} MWh come out afterwards, at falling power** ({shareTail}%), until the exchanger can no longer take the water to 85 °C. **{stays} MWh stay in the stone** ({shareStays}%), below the supply water: 2,000 t × 1 kJ/kg·K × 75 K already make {belowSupply} MWh (derived), and no blower will change that (model result).',
      ),
      lf(
        'Le même silo rend donc {usable} MWh à 1 MW, {usable800} MWh à 800 kW, {usableWinter} MWh à {winterKw} kW et {usableSummer} MWh à {summerKw} kW (résultat du modèle ; dérivé pour ces deux demandes) : **une capacité n’a de sens qu’à une puissance donnée**. Les 100 MWh annoncés, soit {share100} % de la chaleur (dérivé), tiennent dans cette fourchette, sans que la puissance soit dite : le modèle les trouverait vers {powerFor46} kW, ou à 1 MW avec des soufflantes {blowerTimes} fois plus grosses.',
        'So the same silo gives {usable} MWh at 1 MW, {usable800} MWh at 800 kW, {usableWinter} MWh at {winterKw} kW and {usableSummer} MWh at {summerKw} kW (model result; derived for those two demands): **a capacity only means something at a given power**. The 100 MWh quoted, {share100}% of the heat (derived), fit inside that range, with the power left unsaid: the model would find them near {powerFor46} kW, or at 1 MW with blowers {blowerTimes} times larger.',
      ),
      lf(
        'Le modèle ne peut pas dire laquelle : la taille des soufflantes n’est publiée nulle part, et selon les estimations, il rend de {rangeLow} à {rangeHigh} MWh à 1 MW (résultat du modèle). Il ne prétend donc pas contredire le constructeur, et une ligne de sa part trancherait. Il dit tout de même deux choses : « une semaine d’hiver » tombe juste, avec {daysWinter} jours, et « presque un mois d’été » tombe court, avec {daysSummer} jours (résultat du modèle). Lancez le scénario : plein, sans charge, à la demande du jour le plus froid.',
        'The model cannot say which: the size of the blowers is published nowhere, and across the estimates it gives {rangeLow} to {rangeHigh} MWh at 1 MW (model result). So it does not claim to contradict the maker, and one line from it would settle the matter. It does say two things all the same: “a week of winter” is about right, at {daysWinter} days, and “almost a month of summer” is short, at {daysSummer} days (model result). Run the scenario: full, no charge, at the demand of the coldest day.',
      ),
    ],
    figures: [
      sp('À 1 MW', 'At 1 MW', mf('model', '{usable} MWh ({shareUsable} %)', '{usable} MWh ({shareUsable}%)')),
      sp(
        'Puis, à puissance décroissante',
        'Then, at falling power',
        mf('model', '{tail} MWh ({shareTail} %)', '{tail} MWh ({shareTail}%)'),
      ),
      sp(
        'Reste dans la pierre',
        'Stays in the stone',
        mf('model', '{stays} MWh ({shareStays} %)', '{stays} MWh ({shareStays}%)'),
      ),
      sp(
        'À la demande d’hiver',
        'At winter demand',
        mf('model', '{usableWinter} MWh en {daysWinter} jours', '{usableWinter} MWh in {daysWinter} days'),
      ),
      sp('Annoncé', 'Quoted', l('jusqu’à 100 MWh, puissance non dite', 'up to 100 MWh, power unsaid')),
    ],
    formula: 'Q = ṁ · cₚ · ΔT',
    focus: { scene: 'plant-room', part: 'discharge-blower', scenario: 'winter-week' },
    quiz: [
      {
        q: lf(
          'Le même silo rend {usable} MWh à 1 MW et {usableWinter} MWh à {winterKw} kW (résultat du modèle ; dérivé pour la demande). Pourquoi ?',
          'The same silo gives {usable} MWh at 1 MW and {usableWinter} MWh at {winterKw} kW (model result; derived for the demand). Why?',
        ),
        choices: [
          l('parce qu’à plus faible puissance, le plancher descend', 'because at lower power, the floor comes down'),
          l(
            'parce qu’il perd moins par ses parois en hiver, quand l’air froid du dehors protège le silo',
            'because it loses less through its walls in winter, when the cold air outside protects the silo',
          ),
          l(
            'parce que la pierre, une fois froide, stocke davantage de chaleur par degré',
            'because stone, once cold, stores more heat for each degree',
          ),
        ],
        answer: 0,
        explain: l(
          'Avec le même débit maximal, une puissance plus faible se contente d’un air moins chaud. Le silo peut donc descendre plus bas avant que le régime demandé ne s’arrête.',
          'At the same highest flow, a lower power is content with less hot air. So the silo can go lower before the power asked for stops.',
        ),
      },
      {
        q: lf(
          'Que deviennent les {stays} MWh qui restent dans la pierre (résultat du modèle) ?',
          'What becomes of the {stays} MWh that stay in the stone (model result)?',
        ),
        choices: [
          l('une soufflante plus grosse les récupérerait', 'a bigger blower would recover them'),
          l('ils sont perdus par les parois', 'they are lost through the walls'),
          l(
            'ils sont sous l’eau de départ, à 85 °C : ils restent, cycle après cycle',
            'they sit below the supply water at 85 °C: they stay, cycle after cycle',
          ),
        ],
        answer: 2,
        explain: lf(
          'C’est le deuxième principe : une pierre plus froide que l’eau de départ ne peut pas la chauffer. 2 000 t × 1 kJ/kg·K × 75 K font déjà {belowSupply} MWh (dérivé).',
          'That is the second law: stone colder than the supply water cannot heat it. 2,000 t × 1 kJ/kg·K × 75 K already make {belowSupply} MWh (derived).',
        ),
      },
    ],
  },
  {
    id: 'the-cheap-hours',
    title: l('À vous de jouer : les heures bon marché', 'Your turn: the cheap hours'),
    summary: l(
      'Peignez vos heures de charge sur une semaine de prix dessinée, contre un adversaire qui connaît toute la semaine.',
      'Paint your charging hours on a hand-drawn week of prices, against an opponent that knows the whole week.',
    ),
    body: [
      l(
        'Le silo ne produit rien : il choisit quand acheter. Pour vous mettre à sa place, ouvrez la **Simulation**, section « À vous de jouer : peignez vos heures ». Une semaine d’hiver, un silo plein à moitié, des prix dessinés à la main et annoncés comme tels, à l’écart de 3 à 373 €/MWh qu’une source rapporte pour une vraie semaine. Cliquez les tranches de trois heures où vous chargez, puis comparez avec l’adversaire.',
        'The silo produces nothing: it chooses when to buy. To put yourself in its place, open the **Simulation**, section “Your turn: paint your hours”. A winter week, a half-full silo, prices drawn by hand and labelled as such, at the 3 to 373 €/MWh span a source reports for a real week. Click the three-hour blocks in which you charge, then compare with the opponent.',
      ),
      lf(
        'Le stock final compte : un silo vide à la fin de la semaine n’est pas une économie. La chaudière non plus n’est pas gratuite : {boilerPrice} €/MWh dans ce modèle (estimation), et ce chiffre décide beaucoup. L’adversaire connaît toute la semaine : un optimiseur planifie sur un modèle simplifié, on fait tourner son plan et quelques seuils de prix sur le modèle complet, et le meilleur gagne. Rien ne prouve qu’il soit imbattable, mais en tranches entières, nous ne l’avons pas battu : s’en approcher, c’est déjà une belle semaine.',
        'The final stock counts: an empty silo at the end of the week is no saving. The boiler is not free either: {boilerPrice} €/MWh in this model (estimate), and that figure decides a lot. The opponent knows the whole week: an optimiser plans on a simplified model, its plan and a few price thresholds run on the full model, and the best wins. Nothing proves it cannot be beaten, but with whole blocks we have not beaten it: getting close is already a good week.',
      ),
      lf(
        'Sur la semaine dessinée, l’optimiseur achète à {discountDrawn} % sous la moyenne (résultat du modèle). L’exploitant annonce de 70 à 80 % pour sa première année, et ce n’est pas contradictoire : une semaine d’hiver dure n’est pas une année. Vérifiée une seule fois, hors du labo, sur une vraie année de prix, une règle simple à 30 ou 50 €/MWh achète de {discountRealHigh} à {discountRealLow} % sous la moyenne (résultat du modèle). Aucune donnée de prix n’est livrée avec ce labo. Il n’y a donc pas besoin de prévoir l’avenir pour gagner gros.',
        'On the drawn week the optimiser buys {discountDrawn}% below the mean (model result). The operator announces 70 to 80% for its first year, and that is no contradiction: one hard winter week is not a year. Checked once, outside the lab, on a real year of prices, a simple rule at 30 or 50 €/MWh buys {discountRealHigh} to {discountRealLow}% below the mean (model result). No price data ships with this lab. So there is no need to foresee the future to win big.',
      ),
      l(
        'Deuxième manche : la règle « surplus solaire seul », et le scénario « Le réseau électrique appelle », où la charge s’efface à la seconde et où le village ne voit rien. Aucun chiffre de recette n’est publié pour ces marchés, et le modèle n’en invente pas. Enfin, le scénario de cette leçon : un week-end à prix négatifs, où l’on vous paie pour prendre le courant. La puissance acceptée baisse quand même : ce n’est pas le prix qui limite, c’est la boucle d’air.',
        'Second round: the “solar overflow only” rule, and the “The grid calls” scenario, where the charge drops out in a second and the village sees nothing. No revenue figure is published for these markets, and the model invents none. Finally, this lesson’s scenario: a negative-price weekend, in which you are paid to take the current. The power accepted falls all the same: the price is not the limit, the air loop is.',
      ),
    ],
    figures: [
      sp('Écart de prix', 'Price span', l('de 3 à 373 €/MWh, semaine dessinée', '3 to 373 €/MWh, a drawn week')),
      sp('Chaudière', 'Boiler', mf('estimate', '{boilerPrice} €/MWh')),
      sp(
        'Annoncé par l’exploitant',
        'Announced by the operator',
        l('de 70 à 80 % sous la moyenne', '70 to 80% below the mean'),
      ),
      sp(
        'Une règle simple, une vraie année',
        'A simple rule, a real year',
        mf('model', 'de {discountRealLow} à {discountRealHigh} %', '{discountRealLow} to {discountRealHigh}%'),
      ),
    ],
    focus: { scene: 'plant-room', part: 'control-cabinet', scenario: 'negative-weekend' },
    video: '01:21',
    quiz: [
      {
        q: l(
          'Pourquoi le jeu compte-t-il ce qu’il reste dans la pierre à la fin de la semaine ?',
          'Why does the game count what is left in the stone at the end of the week?',
        ),
        choices: [
          l('parce qu’un silo vidé se paie la semaine d’après', 'because an emptied silo is paid for the next week'),
          l(
            'parce qu’une pierre trop froide se fissure, et s’abîme en se réchauffant',
            'because stone left too cold cracks, and gets damaged as it warms up again',
          ),
          l('pour que le jeu dure plus longtemps', 'to make the game last longer'),
        ],
        answer: 0,
        explain: l(
          'Sans ce compte, la meilleure stratégie serait de ne jamais charger et de vider le stock. Le stock final vaut ce qu’il aurait coûté de le remplacer.',
          'Without this count, the best strategy would be never to charge and to empty the stock. The final stock is worth what it would have cost to replace.',
        ),
      },
      {
        q: l(
          'Sur la semaine dessinée, charger sous 40 €/MWh fait presque aussi bien que l’optimiseur. Pourquoi ?',
          'On the drawn week, charging under 40 €/MWh does almost as well as the optimiser. Why?',
        ),
        choices: [
          lf(
            'parce que la chaudière à {boilerPrice} €/MWh (estimation) fait de ce seuil presque la réponse économique',
            'because the boiler at {boilerPrice} €/MWh (estimate) makes that threshold almost the economic answer',
          ),
          l('parce que l’optimiseur se trompe', 'because the optimiser is wrong'),
          l('parce que les prix ne bougent presque pas', 'because prices hardly move'),
        ],
        answer: 0,
        explain: l(
          'Acheter à moins que le prix de la chaudière, c’est toujours gagner ; au-dessus, seul le besoin de stock le justifie. Cette réponse tient à un prix que le modèle estime : changez-le, et le verdict change.',
          'Buying at less than the boiler’s price always wins; above it, only the need for stock can justify it. This answer rests on a price the model estimates: change it, and the verdict changes.',
        ),
      },
    ],
  },
  {
    id: 'heat-is-not-electricity',
    title: l('De la chaleur, pas de l’électricité', 'Heat, not electricity'),
    summary: l(
      'Ce qu’un silo sait faire, ce qu’il ne sait pas faire, et les cas où une autre solution vaut mieux.',
      'What a silo can do, what it cannot, and the cases in which something else is better.',
    ),
    body: [
      l(
        'Le mot « batterie » prête à confusion. Ce silo prend de l’électricité et rend de la chaleur, et le chemin inverse n’existe pas ici. Le constructeur étudie ce retour, sur un pilote sans turbine de 2025 à 2027, et il en attend de 30 à 35 % de rendement électrique, jusqu’à 90 % si l’on valorise aussi la chaleur. C’est une perspective. Le silo dessiné ici n’en fait rien.',
        'The word “battery” misleads. This silo takes in electricity and gives back heat, and the reverse path does not exist here. The maker is studying that return, on a pilot with no turbine from 2025 to 2027, and expects 30 to 35% electrical efficiency from it, up to 90% if the heat is used too. That is a prospect. The silo drawn here does nothing of the kind.',
      ),
      lf(
        'Comparons honnêtement, chaleur contre chaleur. Une **chaudière électrique** transforme le courant aussi bien que ces résistances, mais elle n’a pas de stock : elle ne peut pas attendre un prix bas sans réservoir. Un **réservoir d’eau** stocke {densityWater} kWh/m³ de 45 à 95 °C (dérivé), contre {densityBed} kWh/m³ annoncés pour le lit (dérivé) : c’est moins, mais souvent plus simple, et il s’arrête vers 100 °C. Une **pompe à chaleur** donne plusieurs kilowattheures de chaleur pour un de courant (ordre de grandeur, estimation), mais à des températures bien plus basses, et sans stock.',
        'Let us compare honestly, heat against heat. An **electric boiler** turns current into heat as well as these resistors do, but has no store: it cannot wait for a low price without a tank. A **water tank** stores {densityWater} kWh/m³ from 45 to 95 °C (derived), against {densityBed} kWh/m³ quoted for the bed (derived): less, but often simpler, and it stops near 100 °C. A **heat pump** gives several kilowatt-hours of heat for one of current (an order of magnitude, estimate), but at far lower temperatures, and with no store.',
      ),
      l(
        'Quand est-ce le mauvais choix ? Sans réseau de chaleur tout proche, sans demande importante : le constructeur vise au moins 6 GWh de chaleur par an pour son produit de 2 MW, et il dit lui-même ne rien proposer pour la maison. Sans heures bon marché, aussi : lancez le scénario, dix jours sans vent, la chaudière revient. Pour une saison entière, enfin : le lit tient des jours ou des semaines, rarement plus.',
        'When is it the wrong choice? With no heating network close by and no large demand: the maker aims for at least 6 GWh of heat a year for its 2 MW product, and says itself that it offers nothing for the home. With no cheap hours, too: run the scenario, ten windless days, and the boiler comes back. For a whole season, finally: the bed holds for days or weeks, rarely longer.',
      ),
      l(
        'Quand est-ce le bon choix ? Un réseau existant, une chaudière à garder pour la pointe, un marché où le courant tombe parfois à presque rien : l’exploitant annonce 70 % de CO₂ en moins et une chaufferie moins sollicitée. Et là où la chaleur va au-delà de ce que l’eau tient : le constructeur rappelle, dans sa vidéo, que 36 % de la chaleur industrielle se trouve dans sa plage de température. Ce sont ses chiffres, et le modèle ne les vérifie pas.',
        'When is it the right choice? An existing network, a boiler to keep for the peak, a market where current sometimes falls to almost nothing: the operator announces 70% less CO₂ and a boiler plant called on less. And where the heat goes beyond what water can hold: the maker recalls, in its video, that 36% of industrial heat lies in its temperature range. These are its figures, and the model does not check them.',
      ),
    ],
    figures: [
      sp('Retour vers l’électricité, attendu', 'Back to electricity, expected', l('de 30 à 35 %', '30 to 35%')),
      sp('Ce silo', 'This silo', l('de la chaleur, seulement', 'heat, only')),
      sp('Eau, de 45 à 95 °C', 'Water, 45 to 95 °C', mf('derived', '{densityWater} kWh/m³')),
      sp('Lit, annoncé', 'Bed, quoted', mf('derived', '{densityBed} kWh/m³')),
    ],
    focus: { scene: 'site', part: 'chip-boiler-plant', scenario: 'windless-days' },
    video: '01:36',
    quiz: [
      {
        q: l('Que rend ce silo à la ville ?', 'What does this silo give back to the town?'),
        choices: [
          l('de l’électricité, quand le prix monte', 'electricity, when the price climbs'),
          l('de l’eau chaude, pour le réseau de chaleur', 'hot water, for the heating network'),
          l('les deux, au choix', 'both, as it chooses'),
        ],
        answer: 1,
        explain: l(
          'Retourner vers l’électricité est un projet à part, avec de 30 à 35 % de rendement attendu et un pilote sans turbine. Ce silo donne de l’eau chaude.',
          'Going back to electricity is a separate project, with 30 to 35% expected efficiency and a pilot with no turbine. This silo gives hot water.',
        ),
      },
      {
        q: l(
          'Dans lequel de ces cas une batterie de sable est-elle le plus mauvais choix ?',
          'In which of these cases is a sand battery the worst choice?',
        ),
        choices: [
          l(
            'un réseau de chaleur existant, sur un marché à prix très variables',
            'an existing heating network, on a market with very variable prices',
          ),
          l(
            'une maison isolée, sans réseau, pour tout un hiver',
            'an isolated house, with no network, for a whole winter',
          ),
          l(
            'une usine qui veut de la vapeur et de la chaleur chaque jour',
            'a factory that wants steam and heat every day',
          ),
        ],
        answer: 1,
        explain: l(
          'Petite taille, grandes fuites, et une saison au lieu de quelques jours : tout y va contre. Le constructeur n’a d’ailleurs pas de produit pour la maison.',
          'Small size, big leaks, and a season instead of a few days: it all goes against it. The maker has no product for the home in any case.',
        ),
      },
    ],
  },
];
