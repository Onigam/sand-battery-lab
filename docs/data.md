# Data of the Sand Battery lab (data role)

The texts of the lab: 51 part sheets, two guides, four overviews, six lessons with twelve questions, the Sources panel, the interface strings, written in French and English together. The machine drawn is a **generic reconstruction of the class of the Pornainen plant**; it says from its first line that the real machine holds crushed soapstone, not sand.

## Files

| File                          | What                                                                                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/ids.ts`             | the 51 ids of `docs/research.md` §4, by world, with their category. A test holds them to the research file, id by id                                           |
| `src/data/figures.ts`         | every number that is not reported: `MODEL` (held to `src/sim` by the test), `DERIVED`, `ASSUMED`, `ESTIMATE` (read from `src/sim/silo.ts` and `three/dims.ts`) |
| `src/data/part-helpers.ts`    | `lf`, `tf`, `sp`, `maint`, `step`: a text that prints a figure must say its status in the same text, or it throws at import                                    |
| `src/data/parts/*.ts`         | `site` (13), `silo` (14), `pipe-cell` (9), `plant-room` (15). Overview, Specs, Maintenance (failure, check, care), Design                                      |
| `src/data/parts/dim-specs.ts` | the dimension rows of the sheets, all read from `src/three/dims.ts`, all tagged estimate, appended by `src/data/parts.ts`                                      |
| `src/data/assembly.ts`        | « how a crew builds it », 20 steps                                                                                                                             |
| `src/data/install.ts`         | « how it joins the town », 10 steps                                                                                                                            |
| `src/data/guide.ts`           | re-exports both, as `src/lab.ts` imports them                                                                                                                  |
| `src/data/overviews.ts`       | the side panel of each world, `{ title, text }`                                                                                                                |
| `src/data/sources.ts`         | the Sources panel as data: every link of `docs/research.md` §1, the outline of the main video                                                                  |
| `src/data/about.ts`           | `aboutPanel(ctx)`: the panel built from it, for `about` in `src/lab.ts`                                                                                        |
| `src/i18n/ui.ts`              | the lab's strings: title, worlds, shortcuts, the notices of the Sources panel                                                                                  |
| `src/data/data.test.ts`       | the checks of this file                                                                                                                                        |

## What `src/lab.ts` has to do with it

The lead's file. To wire the rest of the delivery:

```ts
brand: { title: { fr: 'LABO DE LA BATTERIE DE SABLE', en: 'SAND BATTERY LAB' }, tagline: strL('tagline'), icon: './favicon.svg' },
video: { id: MAIN_VIDEO.id },
guides: { assembly: { scene: 'silo', steps: ASSEMBLY }, install: { scene: 'site', steps: INSTALL } },
plans: { sheets: SHEETS, groups: PLAN_GROUPS, intro: strL('plansIntro') },
about: aboutPanel,
```

Each `scenes[i]` gets `overview: { ...OVERVIEWS.site, actions: [{ label: strL('goSilo'), scene: 'silo', primary: true }] }`. The `configureDrawings` line goes: `src/drawings/index.ts` sets the project, the disclaimer and the date. `sceneDevice` and `groupDevice` of `src/i18n/ui.ts` can go with it. `index.html` and `package.json` still say « store heat in a silo of sand ».

## Conventions

- **Tags.** No mark: reported by a source, named in words (« le constructeur », « the operator »). `(dérivé)`, `(résultat du modèle)`, `(hypothèse)`, `(estimation)` otherwise. `lf` refuses a text that uses a non-reported figure without its tag.
- **One meaning for each mark, settled by the lead.** `†` is a model result, `‡` is derived, `*` is an estimate. The panel of the simulation writes `†` and `*`, with one legend. The drawings write `‡` and `*`, with a legend on each sheet, and put model results in a red box. The part sheets have no legend, so they write the words.
- **Names.** No person, company or brand outside the Sources panel. Of the places, only Pornainen, once, in the first overview: the other silos go by their size and year (« le silo de 250 MWh »), as the panel does.
- **Said once.** « Educational reconstruction », no household product, the law: the Sources panel. « No independent measurement »: the simulation panel, under the year's efficiency (`efficiencyHint`), where the 91 % a visitor would carry away is printed. The heat meter's sheet defines efficiency and says who quotes what. Each hazard: the step of the guide where the gesture is risky, and once together in the Sources panel. The reconstruction of the guides: the first step of each.
- **Origin of a guide step.** The last sentence of its text: `Origine : rapporté`, `pratique courante` or `notre lecture`, sometimes with a precision. No torque, no duration, no recipe figure.
- **Numbers.** Every number of a visitor text is in `FIG` or in the commented list of the test, with its source.

## What rests on a source read only in summary

Used in the lab's own words, never quoted, listed for the re-reading `docs/research.md` §9 asks for before a visitor sees them:

| Fact                                                    | Source                  | Where                                                         |
| ------------------------------------------------------- | ----------------------- | ------------------------------------------------------------- |
| about a year, about 40 subcontractors, over 100 workers | S4 (f)                  | assembly `plot`                                               |
| 40 trucks; filled by the end of October 2024            | S13, S4 (f)             | `storage-bed`, assembly `filling`                             |
| start of service June 2025; tests in the winter         | S4, S13 (f)             | `silo-exterior`, install `winter-tests`, `first-heat`         |
| chips −60 %, oil out, 160 t of CO₂e                     | S4 (f); S5 (t) for 70 % | `chip-boiler-plant`, `boiler-stack`                           |
| 3 to 373 €/MWh in a week                                | S17 (f), secondary      | `wind-farm`, lesson 5 (and the panel)                         |
| about 100 h of charge                                   | S17 (f), secondary      | `charge-blower`                                               |
| 80 to 90 %                                              | S17 (f)                 | `heat-meter`                                                  |
| first silo: core 500 °C, edge 150 to 200 °C             | S9 (f)                  | `outer-zone`                                                  |
| −23 °C                                                  | S22 (f)                 | `dh-riser`                                                    |
| by-product of a stove factory                           | S13 (f)                 | `storage-bed`, `crushed-soapstone`, assembly `stone-test`     |
| c 0.98 to 1.0, k 6 to 12 of soapstone                   | S27 (f)                 | `crushed-soapstone`                                           |
| vertical pipes; insulation under 0.3; expanded clay; N₂ | S15 (f)                 | `base-insulation`, `heat-pipe`, `return-bend`                 |
| 30 to 35 %, up to 90 %                                  | S12 (t, f)              | lesson 6                                                      |
| reserve markets of the national operator                | S3, S5 (t); S28 (s)     | `power-line`, install `optimiser`                             |
| equipment floor: the engineer among the equipment       | S31 (Whisper, to check) | `equipment-floor` (a paraphrase, said to be a reading)        |
| air at about 500 °C                                     | S31 (Whisper, to check) | `resistor-bank`, `hot-air-duct`, PL-05, PL-06 (said to check) |
| a visit: valves that swap a loop                        | S19 (auto captions)     | `charge-damper`                                               |

## One departure from the research

`docs/research.md` §4.5 puts `pipe-spacer` at step 5 and `heat-pipe` at step 6. In `dims.ts` the spacers are frames of bars and collars on the legs, 2 m and 4 m above the floor, so alone they would float. The guide lowers the pipes first (step 5, each bend on a block that the stone buries, drawn in `src/three`) and fits the spacers on them (step 6), still before the stone.

## Tests

`npm test`: `src/data/data.test.ts`. The catalogue against the research, the structure of every sheet, what the sheets must say, parity and typography, British English, no research code, no name, no quotation, no law from memory, what is said once, every number sourced, every model figure against `src/sim`, every id of the guides once, each step's origin and warnings, every link of the research in the Sources.
