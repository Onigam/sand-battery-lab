// The Sources panel as data: the credits and the links to every source of docs/research.md §1, the outline of the main video, in the lab's own words. A source read only through a summary
// (`f`, `s` in the research) or a transcript is linked and credited, never quoted: nothing here is a quotation. No image or footage from any source is reused.
// `src/data/about.ts` builds the panel from this for `about` in src/lab.ts.

export interface SourceEntry {
  href: string;
  label: string;
  fr: string;
  en: string;
}

/** The main video, its id for the kit's `video` and its link. */
export const MAIN_VIDEO = {
  id: 'bZ9TyJ1bQ3Y',
  href: 'https://www.youtube.com/watch?v=bZ9TyJ1bQ3Y',
  label: 'What Is a Sand Battery? (Polar Night Energy)',
};

/** The chapters of the main video, in the lab's words: [timestamp, French, English]. */
export const CHAPTERS: [timestamp: string, fr: string, en: string][] = [
  ['00:00', 'Qu’est-ce qu’une batterie de sable', 'What a sand battery is'],
  ['00:27', 'Pourquoi il faut stocker l’énergie', 'Why energy has to be stored'],
  ['00:50', 'Comment la batterie fonctionne', 'How the battery works'],
  ['01:26', 'Ce qui en sort, et à quoi ça sert', 'What comes out, and what it is for'],
  ['01:45', 'Ce qu’on peut en attendre pour le climat', 'What may be expected of it for the climate'],
];

/** Groups of links, in reading order. */
export const SOURCES: { fr: string; en: string; items: SourceEntry[] }[] = [
  {
    fr: 'Le constructeur',
    en: 'The maker',
    items: [
      {
        href: 'https://polarnightenergy.com/sand-battery/',
        label: 'Polar Night Energy, Sand Battery',
        fr: 'la page du produit et ses questions fréquentes',
        en: 'the product page and its FAQ',
      },
      {
        href: 'https://polarnightenergy.com/reference/solution-for-clean-energys-big-problem/',
        label: 'Polar Night Energy, Pornainen',
        fr: 'la référence du silo de 100 MWh dessiné ici',
        en: 'the reference of the 100 MWh silo drawn here',
      },
      {
        href: 'https://polarnightenergy.com/news/sand-batterys-efficiency-explained/',
        label: 'Sand Battery’s Efficiency Explained',
        fr: 'l’article de son responsable scientifique, la meilleure source technique',
        en: 'the article by its lead scientist, the best technical source',
      },
      {
        href: 'https://polarnightenergy.com/news/worlds-largest-sand-battery-achieves-its-targets-emissions-reduced-by-70/',
        label: 'First-year results, 2026',
        fr: 'les résultats de la première année, annoncés par le constructeur',
        en: 'the first-year results, as announced by the maker',
      },
      {
        href: 'https://polarnightenergy.com/news/worlds-largest-sand-battery-now-in-operation/',
        label: 'In operation, 2025',
        fr: 'la mise en service et le chantier',
        en: 'the start of service and the build',
      },
      {
        href: 'https://polarnightenergy.com/news/can-sand-battery-produce-electricity/',
        label: 'Can Sand Battery Produce Electricity?',
        fr: 'le retour vers l’électricité, une perspective',
        en: 'the way back to electricity, a prospect',
      },
      {
        href: 'https://polarnightenergy.com/news/what-is-a-sand-battery/',
        label: 'What Is a Sand Battery? (article)',
        fr: 'le principe, les soufflantes et les registres, les rendements selon la taille',
        en: 'the principle, the blowers and dampers, efficiencies by size',
      },
      {
        href: 'https://polarnightenergy.com/news/new-industrial-sand-battery-filled-with-soapstone-equal-to-1000-fireplaces/',
        label: 'Filled with soapstone, 2024',
        fr: 'le remplissage en pierre ollaire',
        en: 'the filling with soapstone',
      },
      {
        href: 'https://polarnightenergy.com/news/loviisan-lampo-invests-in-polar-night-energys-sand-battery-in-pornainen-towards-non-combustion-heat-production/',
        label: 'The investment, 2024',
        fr: 'la décision d’investir à Pornainen',
        en: 'the decision to invest at Pornainen',
      },
      {
        href: 'https://www.futureenergysolutions.fi/wp-content/uploads/2025/09/Eronen-Sand-battery-by-Polar-Night-Energy.pdf',
        label: 'Eronen, The Sand Battery, 2025',
        fr: 'une présentation : l’histoire, une coupe colorée, des photos du dehors (aucune n’est reprise)',
        en: 'a presentation: the history, a coloured section, photos of the outside (none reused)',
      },
      {
        href: 'https://patents.google.com/patent/US20220146205A1/en',
        label: 'Eronen, Ylönen, patent',
        fr: 'la famille de brevets, sur des tubes verticaux et une boucle fermée ; un brevet n’est pas une installation',
        en: 'the patent family, on vertical pipes and a closed loop; a patent is not a plant',
      },
      {
        href: 'https://patents.google.com/patent/FI128161B/en',
        label: 'Eronen, Ylönen, Finnish patent',
        fr: 'le même brevet, dans sa version finlandaise',
        en: 'the same patent, in its Finnish version',
      },
    ],
  },
  {
    fr: 'Les autres silos, et leurs exploitants',
    en: 'The other silos, and their operators',
    items: [
      {
        href: 'https://polarnightenergy.com/reference/worlds-first-sand-battery/',
        label: 'Polar Night Energy, Kankaanpää',
        fr: 'le premier silo, 8 MWh, de vrai sable',
        en: 'the first silo, 8 MWh, of real sand',
      },
      {
        href: 'https://www.vatajankoski.fi/en/projects/sand-battery/',
        label: 'Vatajankoski',
        fr: 'l’exploitant de ce premier silo',
        en: 'the operator of that first silo',
      },
      {
        href: 'https://polarnightenergy.com/reference/decarbonizing-heating/',
        label: 'Polar Night Energy, Vääksy',
        fr: 'le silo de 250 MWh de Lahti Energia, de vrai sable, prévu pour 2027',
        en: 'Lahti Energia’s 250 MWh silo, of real sand, due in 2027',
      },
      {
        href: 'https://polarnightenergy.com/news/lahti-energias-sand-battery-construction-progresses-on-schedule/',
        label: 'Lahti Energia, the build',
        fr: 'l’avancement du chantier : les fondations avant le silo',
        en: 'the progress of the build: the foundations before the silo',
      },
      {
        href: 'https://polarnightenergy.com/reference/innovative-pilot-in-thermal-energy-storage/',
        label: 'Polar Night Energy, Hiedanranta',
        fr: 'le pilote de 20 kW et 3 MWh',
        en: 'the pilot of 20 kW and 3 MWh',
      },
      {
        href: 'https://polarnightenergy.com/reference/sand-to-power-pilot/',
        label: 'Sand to Power',
        fr: 'le pilote pour refaire de l’électricité : ce silo-ci n’en fait pas',
        en: 'the pilot for making electricity again: this silo does not',
      },
      {
        href: 'https://capman.com/2024/03/capman-infras-portfolio-company-loviisan-lampo-invests-in-new-innovative-sand-battery-in-finland-targeting-significant-emissions-reductions/',
        label: 'CapMan, Loviisan Lämpö',
        fr: 'l’investissement de l’exploitant du silo de 100 MWh',
        en: 'the investment by the operator of the 100 MWh silo',
      },
    ],
  },
  {
    fr: 'Les matériaux, mesurés',
    en: 'The materials, measured',
    items: [
      {
        href: 'https://kth.diva-portal.org/smash/get/diva2:1793974/FULLTEXT01.pdf',
        label: 'Juul, KTH, 2023',
        fr: 'capacité thermique, masse volumique et conduction d’un sable mesuré',
        en: 'heat capacity, density and conduction of a measured sand',
      },
      {
        href: 'https://elib.dlr.de/96432/1/Properties%20of%20granular%20materials_SOM_rev1_150527x.pdf',
        label: 'Baumann & Zunft, DLR, 2015',
        fr: 'le quartz à 573 °C et la tenue des grains aux cycles',
        en: 'quartz at 573 °C and how grains stand up to cycling',
      },
      {
        href: 'https://ecp.ep.liu.se/index.php/modelica/article/download/973/881/994',
        label: 'Hinkelman, Milner, Zuo, 2023',
        fr: 'la capacité thermique du quartz pur',
        en: 'the heat capacity of pure quartz',
      },
      {
        href: 'https://kivi.info/wp-content/uploads/2019/09/Soapstone-Tulikivi-Oyj-2023-EN.pdf',
        label: 'Tulikivi, test reports, 2022',
        fr: 'la masse volumique et la porosité de la pierre ollaire, sur des plaques',
        en: 'the density and porosity of soapstone, on tiles',
      },
      {
        href: 'https://www.greenstoneheat.com/why-soapstone-is-the-ultimate-material-for-masonry-heater/',
        label: 'Greenstone',
        fr: 'la capacité thermique et la conduction de la pierre ollaire, sans référence : le meilleur chiffre trouvé',
        en: 'the heat capacity and conduction of soapstone, with no reference: the best figure found',
      },
    ],
  },
  {
    fr: 'Reportages et articles',
    en: 'Reports and articles',
    items: [
      {
        href: 'https://www.youtube.com/watch?v=2zlcqv8ufMY',
        label: 'Meanwhile In Europe, 2026',
        fr: 'un documentaire tourné sur place, à l’origine de notre lecture de l’étage technique',
        en: 'a documentary filmed on site, behind our reading of the equipment floor',
      },
      {
        href: 'https://www.youtube.com/watch?v=7AW60Bd1V64',
        label: 'Two Bit da Vinci, 2025',
        fr: 'une visite du pilote avec le constructeur',
        en: 'a visit to the pilot with the maker',
      },
      {
        href: 'https://www.youtube.com/watch?v=EbEVOa9IEgQ',
        label: 'German Science Guy, 2025',
        fr: 'un reportage, dont une partie seulement a été lue',
        en: 'a report, of which only part was read',
      },
      {
        href: 'https://interestingengineering.com/energy/sand-battery-polar-night-energy',
        label: 'Interesting Engineering, 2026',
        fr: 'l’écart de prix d’une semaine, et la durée de charge, de seconde main',
        en: 'a week’s span of prices and the charging time, second-hand',
      },
      {
        href: 'https://solarthermalworld.org/news/sand-batteries-provide-heat-to-district-heating-networks-in-finland/',
        label: 'Solarthermalworld, 2024',
        fr: 'un entretien avec la société, sur les rendements selon la taille',
        en: 'an interview with the company, on efficiencies by size',
      },
      {
        href: 'https://newatlas.com/energy/largest-sand-battery-finland-pornainen/',
        label: 'New Atlas, 2025',
        fr: 'le silo de 100 MWh, d’après le constructeur',
        en: 'the 100 MWh silo, after the maker',
      },
      {
        href: 'https://www.pv-magazine.com/2025/06/11/worlds-largest-1-mw-100-mwh-sand-battery-commissioned-in-finland/',
        label: 'pv magazine, 2025',
        fr: 'la mise en service',
        en: 'the commissioning',
      },
      {
        href: 'https://www.ess-news.com/2024/11/13/testing-to-start-on-100-mwh-sand-based-thermal-battery-in-finland/',
        label: 'ESS News, 2024',
        fr: 'le début des essais',
        en: 'the start of testing',
      },
      {
        href: 'https://heat-exchanger-world.com/energy-storage-polar-night-energy-how-a-sand-battery-could-solve-green-energys-biggest-challenge/',
        label: 'Heat Exchanger World, 2022',
        fr: 'des gaines réparties, de l’inox',
        en: 'evenly spread ducts, stainless steel',
      },
      {
        href: 'https://unric.org/en/sand-warms-up-the-finnish-polar-night/',
        label: 'UNRIC, 2022',
        fr: 'la ville du premier silo, jusqu’à −23 °C',
        en: 'the first silo’s town, down to −23 °C',
      },
      {
        href: 'https://www.dna.fi/yrityksille/blogi/-/blogs/hiekka-akku-on-taman-hetken-puhuttavin-innovaatio-polar-night-energylla-on-kunnianhimoiset-kasvutavoitteet',
        label: 'DNA, 2024',
        fr: 'le silo de 100 MWh en projet',
        en: 'the 100 MWh silo as a project',
      },
    ],
  },
  {
    fr: 'Le réseau et les règles',
    en: 'The grid and the rules',
    items: [
      {
        href: 'https://www.fingrid.fi/globalassets/dokumentit/fi/sahkomarkkinat/reservit/implementation-guide-fcr-2.16.pdf',
        label: 'Fingrid, reserve markets',
        fr: 'les marchés de réserve du réseau finlandais',
        en: 'the reserve markets of the Finnish grid',
      },
      {
        href: 'https://data.fingrid.fi/en/about',
        label: 'Fingrid, open data',
        fr: 'les données ouvertes du gestionnaire de réseau',
        en: 'the grid operator’s open data',
      },
      {
        href: 'https://research.chalmers.se/en/publication/252325',
        label: 'Chalmers, return temperatures',
        fr: 'des températures de retour de réseaux, pas celle de ce réseau',
        en: 'return temperatures of networks, not this one’s',
      },
      {
        href: 'https://energia.fi/wp-content/uploads/2025/01/Risto-Kosonen_Kaukolammon-paluuveden-kaytto-rakennusten-lammityksessa.pdf',
        label: 'Aalto, return water',
        fr: 'une présentation sur l’eau de retour, pas sur ce réseau',
        en: 'a presentation on return water, not on this network',
      },
      {
        href: 'https://www.iso.org/standard/43558.html',
        label: 'ISO, hot surfaces',
        fr: 'le domaine d’une norme sur les surfaces chaudes ; ses tableaux n’ont pas été lus',
        en: 'the scope of a standard on hot surfaces; its tables were not read',
      },
      {
        href: 'https://osha.europa.eu/en/legislation/directive/regulation-20231230eu-machinery',
        label: 'EU-OSHA, machinery',
        fr: 'une piste pour les règles européennes, non vérifiée par un juriste',
        en: 'a pointer to the European rules, not checked by a lawyer',
      },
    ],
  },
];
