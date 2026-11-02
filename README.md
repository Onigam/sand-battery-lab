# Sand Battery Lab

An interactive 3D lab of a **sand battery that holds no sand**: a 13 m silo of crushed soapstone, heated through buried pipes by electricity when it is cheap, that gives its heat back to a Finnish village's heating network. It stores heat and gives back heat, not electricity. The machine drawn is a generic reconstruction of the class of the Pornainen plant (1 MW, up to 100 MWh, about 2,000 t).

**▶ https://sand-battery-lab.vercel.app** · French and English · desktop, tablet and phone

It belongs to a series that started with [Pelton Lab](https://github.com/Onigam/pelton-lab), built on the same frame, [lab-kit](https://github.com/Onigam/lab-kit). The lab is being built: `public/lab.json` says `building` until the bar of the series is met and the owner has said yes.

## What is in it

- **Four 3D worlds**: the **village** (the silo in its yard, the two water pipes and the cable riser on its wall, the annex, the transformer, the line, the old wood-chip boiler kept as a backup, the open trench of the network, the school), the **silo in section**, coloured live by the model, the hot core spreading as it charges, **one pipe in the stone** (a U-pipe, a spacer, a header, an expansion loop, grains of sand and of soapstone), and the **equipment floor**, read in the order the current and the heat flow. Explode, X-ray, isolate, section, flows, labels.
- **A catalogue of 51 parts**, each with a sheet (what it does, how it is made and sized, how it fails and is looked after, why it is designed that way). **Two guides**, tagged step by step as reported, usual practice or our reading: how a crew builds it (20 steps) and how it joins the town (10 steps).
- **Six lessons with twelve questions**, each opening on a scenario: heat in a stone, heat that crawls, surface and volume, a capacity only means something at a given power, the cheap hours (paint your charging hours against an opponent), heat that is not electricity.
- **A simulation** (a pure, unit-tested thermal model): an enthalpy grid of the bed with a measured c(T) for sand, buried pipes, closed air loops, an exchanger, the network's demand, a hand-drawn week of prices, five starting points and twelve scenarios.
- **Ten A3 design drawings** generated from the same dimensions as the 3D model and from the model's results.

## What is real and what is not

- **What the model finds, against what is quoted.** The maker quotes up to 100 MWh at 1 MW. The model gives **69 MWh at the rated 1 MW**, 105 MWh afterwards at falling power, and leaves 43 MWh in the stone, out of the 217 MWh above ambient at full. The cause is the size of the blowers, an estimate that nobody publishes: a capacity only means something at a given power. Neither is a measurement of the other, and nothing was tuned to print 100.
- **The 250 MWh silo:** the model finds 2.3 times the energy at nearly the same size (2.5 quoted), from mass, a mean 100 K higher and sand's c(T). It does not find the absolute figure.
- **Efficiency:** about 91% over a year in the model, to be read as a ceiling, since it has no air leaks, real thermal bridges or first-year ramp-ups. **No independent measurement of a real silo exists**: every published figure comes from the maker or its customers, and they disagree.
- **Reading and estimates.** The equipment on a floor under the roof is our reading of a film and a photo. The maker keeps its pipe layout secret: the U-pipes are generic, sized by a physics exercise. The insulation, the blowers, the heat exchanger, soapstone's bed conductivity and the boiler's price are estimates. Soapstone's heat capacity is held at 1.0 kJ/kg·K because its real curve is unknown; a week of prices is drawn by hand and labelled as such. Every figure is tagged reported, derived, model result, assumption or estimate.
- **An independent educational reconstruction**, not an official drawing and not a product of the maker, with which it has no link; no footage, photo or drawing of any source is reused. No version for the home: two drums of sand last a few hours, and the third lesson does the sums. A plant like this is an industrial installation, subject to the rules of its country, which were not checked: heat that does not show, water on hot stone, high current and medium voltage, work at height, confined spaces, silica dust.

## Run it

```bash
npm install
npm run dev
```

`npm run typecheck && npm run format:check && npm test && npm run build` is what CI runs; every push to `main` deploys to Vercel. `npm run kit:bump` moves to a newer lab-kit.

## Project layout

- `src/three/` the four worlds and `dims.ts`, the single source of dimensions; `src/sim/` the pure physics, with its thermal and market cores; `src/data/` the parts, guides, lessons, sources and figures; `src/drawings/` the A3 sheets; `src/panels/` the simulation panel; `src/lab.ts` describes the lab to the kit.
- `docs/` research notes and sources, physics notes (what the model finds, figure by figure), data, drawings and lessons notes, requests to the kit; `BRIEF.md` is the brief the agent team works from.

Built with Three.js, TypeScript and Vite (MIT). Credits and links to every source are in the app, in _Sources_.

---

## Français

Un labo 3D interactif d’une **batterie de sable qui ne contient pas de sable** : un silo de 13 m plein de pierre ollaire concassée, chauffé par des tubes enfouis quand l’électricité ne coûte presque rien, qui rend sa chaleur au réseau d’un village finlandais. Il stocke de la chaleur et rend de la chaleur, pas du courant. La machine dessinée est une reconstitution générique de la classe de l’installation de Pornainen (1 MW, jusqu’à 100 MWh, environ 2 000 t).

**▶ https://sand-battery-lab.vercel.app** · français et anglais · ordinateur, tablette et téléphone

Il fait partie d’une série commencée avec [Pelton Lab](https://github.com/Onigam/pelton-lab), sur le même socle, [lab-kit](https://github.com/Onigam/lab-kit). Le labo est en construction : `public/lab.json` reste à `building` tant que le niveau de la série n’est pas atteint et que le propriétaire n’a pas dit oui.

**Ce qu’il contient.** Quatre mondes 3D (le village, le silo en coupe coloré en direct par le modèle, un tube dans la pierre, l’étage technique lu dans l’ordre du courant et de la chaleur) ; un catalogue de 51 pièces avec leur fiche ; deux guides, chaque étape marquée « rapporté », « pratique courante » ou « notre lecture » : comment une équipe la construit (20 étapes) et comment elle rejoint la ville (10 étapes) ; six leçons et douze questions, chacune ouverte sur un scénario, dont un jeu sur les heures de charge ; une simulation pure et testée ; dix planches A3 générées à partir des dimensions du modèle et de ses résultats.

**Ce qui est réel et ce qui ne l’est pas.** Le constructeur annonce jusqu’à 100 MWh à 1 MW. Le modèle en donne **69 MWh à 1 MW**, puis 105 MWh à puissance décroissante, et laisse 43 MWh dans la pierre, sur les 217 MWh au-dessus de l’ambiante à plein. La cause est la taille des soufflantes, une estimation que personne ne publie : une capacité n’a de sens qu’à une puissance donnée. Rien n’a été réglé pour retrouver 100. Le silo de 250 MWh : le modèle trouve 2,3 fois plus à presque la même taille (2,5 annoncés), mais pas la valeur absolue. Le rendement : environ 91 % sur un an dans le modèle, à lire comme un plafond. **Aucune mesure indépendante d’un vrai silo n’existe** : tous les chiffres viennent du constructeur ou de ses clients, et ils ne concordent pas. L’équipement à l’étage, sous le toit, est notre lecture d’un film et d’une photo ; le tracé des tubes reste secret, le nôtre vient d’un calcul ; la capacité thermique de la pierre est tenue à 1,0 kJ/kg·K faute de courbe connue ; la semaine de prix est dessinée à la main, et annoncée comme telle.

**Reconstitution pédagogique indépendante**, ni plan officiel ni produit du constructeur, sans lien avec lui, sans aucune image reprise d’une source. Pas de version pour la maison : deux fûts de sable tiennent quelques heures, et la troisième leçon fait le calcul. Une installation comme celle-ci est un ouvrage industriel, soumis aux règles de son pays, qui n’ont pas été vérifiées.

`npm install` puis `npm run dev` pour lancer en local ; chaque push sur `main` déploie sur Vercel. Les crédits et les liens vers toutes les sources sont dans l’application, dans _Sources_.
