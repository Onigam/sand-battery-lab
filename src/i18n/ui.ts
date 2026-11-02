import { registerStrings, tx, type CommonKey } from '@onigam/lab-kit/i18n';
import { DERIVED } from '../data/figures';
import { nEn, nFr } from '../data/units';

// The lab's own interface strings, `key: [fr, en]`. The ones every lab shares (modes, toolbar, panels, guides) live in the kit; the simulation panel's words live in
// src/panels/strings.ts, written by the physics role. This file holds the frame's words for this lab: titles, worlds, and the Sources panel's notices.

export const LAB_STRINGS = {
  labTitle: ['LABO DE LA BATTERIE DE SABLE', 'SAND BATTERY LAB'],
  // the top bar shows about 60 capitals at 1280 px, and cuts the rest; the longer line is for the showcase, in public/lab.json
  tagline: ['Le plus grand silo ne contient pas de sable : de la pierre', 'The largest silo holds no sand, but stone'],

  // ---- the worlds and the shortcuts between them
  sceneSite: ['Le village', 'The village'],
  sceneSilo: ['Le silo', 'The silo'],
  scenePipeCell: ['Un tube dans la pierre', 'One pipe in the stone'],
  scenePlantRoom: ['L’étage technique', 'The equipment floor'],
  goSite: ['Voir le village', 'See the village'],
  goSilo: ['Ouvrir le silo', 'Open the silo'],
  goPipeCell: ['Entrer dans le champ de tubes', 'Step into the pipe field'],
  goPlantRoom: ['Entrer dans l’étage technique', 'Step onto the equipment floor'],

  // ---- the intros
  plansIntro: [
    'Dix planches A3 générées à partir des dimensions du modèle 3D et des résultats de la simulation : l’implantation, le silo en coupe, le champ de températures, le champ de tubes, la boucle d’air, les schémas électrique et hydraulique, le bilan d’énergie, la séquence de montage et l’échelle des silos réels. Seules quelques cotes sont publiées : toutes les autres sont marquées comme estimées.',
    'Ten A3 sheets generated from the dimensions of the 3D model and the results of the simulation: the layout, the silo in section, the temperature field, the pipe field, the air loop, the electrical and water diagrams, the energy balance, the assembly sequence and the scale of the real silos. Only a few dimensions are published: all the others are marked as estimates.',
  ],
  lessonsIntro: [
    'Six leçons, chacune ouverte sur un scénario de la simulation : de la chaleur dans la pierre jusqu’à ce qu’un silo ne sait pas faire. Le cœur est dans la quatrième : une capacité n’a de sens qu’à une puissance donnée.',
    'Six lessons, each opening on a scenario of the simulation: from heat in stone to what a silo cannot do. The heart is in the fourth: a capacity only means something at a given power.',
  ],

  // ---- the notices of the Sources panel, each said once
  disclaimer: [
    'Reconstitution pédagogique indépendante, sans lien avec le constructeur : ce n’est ni un plan officiel ni un produit. Le village est générique, et les tubes, les isolants, les soufflantes et leurs tailles sont estimés par le calcul, car le constructeur ne les publie pas. Aucune image, aucun extrait et aucun dessin d’une source n’est repris. « Sand Battery » est le nom que le constructeur donne à son produit ; ce labo écrit « batterie de sable » comme un nom commun.',
    'An independent educational reconstruction, not affiliated with the maker: neither an official drawing nor a product. The village is generic, and the pipes, the insulation, the blowers and their sizes are estimated by calculation, since the maker does not publish them. No image, clip or drawing from any source is reused. “Sand Battery” is the name the maker gives its product; this lab writes “sand battery” as a common noun.',
  ],
  noticeReading: [
    'Comment lire les chiffres. Sans mention, un chiffre est rapporté par une source, nommée en toutes lettres. « Dérivé » : calculé à partir de chiffres rapportés. « Résultat du modèle » : sorti de la simulation, jamais réglé pour retrouver une source. « Hypothèse » et « estimation » : les sources se taisent, et le choix est le nôtre. Le modèle donne 69 MWh à 1 MW là où le constructeur annonce jusqu’à 100 MWh : l’écart vient de la taille des soufflantes, qu’il ne publie pas, et les notes de physique le détaillent.',
    'How to read the figures. With no mention, a figure is reported by a source, named in words. “Derived”: computed from reported figures. “Model result”: out of the simulation, never set to match a source. “Assumption” and “estimate”: the sources are silent, and the choice is ours. The model gives 69 MWh at 1 MW where the maker quotes up to 100 MWh: the gap comes from the size of the blowers, which it does not publish, and the physics notes go through it.',
  ],
  safety: [
    `Dangers d’une vraie installation : une chaleur de 400 à 600 °C qui ne se voit pas et qui dure ; de l’eau sur une pierre chaude, qui devient vapeur d’un coup ; ${nFr(DERIVED.amps)} A à basse tension (dérivé), et de la moyenne tension au transformateur ; des soufflantes tournantes, de l’eau chaude sous pression, le travail en hauteur et les espaces confinés ; la poussière de silice au remplissage. Le silo ne brûle rien et ne fait pas de monoxyde de carbone, mais la chaudière gardée en secours garde ses propres risques.`,
    `The hazards of a real plant: heat of 400 to 600 °C that does not show and that lasts; water on hot stone, which turns to steam at once; ${nEn(DERIVED.amps)} A at low voltage (derived), and medium voltage at the transformer; rotating blowers, hot water under pressure, work at height and confined spaces; silica dust at filling. The silo burns nothing and makes no carbon monoxide, but the boiler kept as a backup keeps hazards of its own.`,
  ],
  homeBuild: [
    'Pas de version pour la maison : le constructeur n’a pas de produit domestique, et ce labo ne donne aucune cote de construction. La troisième leçon fait le calcul : deux fûts de sable tiennent quelques heures, pas un hiver.',
    'No version for the home: the maker has no household product, and this lab gives no building dimensions. The third lesson does the sums: two drums of sand last a few hours, not a winter.',
  ],
  legal: [
    'Une installation comme celle-ci est un ouvrage industriel, soumis aux règles de son pays : permis de construire, raccordement au réseau, classement. Nous n’avons trouvé aucun texte propre aux batteries de sable, et les règles françaises, suisses et finlandaises n’ont pas été vérifiées : ce labo n’est pas un avis juridique.',
    'A plant like this is an industrial installation, subject to the rules of its country: building permit, grid connection, classification. We found no text specific to sand batteries, and the French, Swiss and Finnish rules have not been checked: this lab is not legal advice.',
  ],
  mainSource: ['Source principale :', 'Main source:'],
  mainSourceNote: [
    '— la vidéo de Polar Night Energy. Elle ne donne aucun chiffre de machine : ceux du labo viennent du site du constructeur, de son responsable scientifique et de ses clients.',
    '— the video by Polar Night Energy. It gives no figure for the machine: those of the lab come from the maker’s site, its lead scientist and its customers.',
  ],
  chapters: ['La vidéo, chapitre par chapitre', 'The video, chapter by chapter'],
  sourcesNoCopy: [
    'Merci à Polar Night Energy, Loviisan Lämpö, Vatajankoski, Lahti Energia, Tulikivi, DLR, KTH et Penn State. Certaines sources de seconde main n’ont été lues qu’en résumé : elles sont créditées ici sans être citées.',
    'Thanks to Polar Night Energy, Loviisan Lämpö, Vatajankoski, Lahti Energia, Tulikivi, DLR, KTH and Penn State. Some second-hand sources were read in summary only: they are credited here, not quoted.',
  ],
} as const satisfies Record<string, readonly [string, string]>;

registerStrings(LAB_STRINGS);

export type UiKey = keyof typeof LAB_STRINGS | CommonKey;

export { colon } from '@onigam/lab-kit/i18n';

export function t(key: UiKey): string {
  return tx(key);
}
