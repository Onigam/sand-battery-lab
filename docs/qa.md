# Review of the Sand Battery Lab

**Date:** 2026-11-04. **Commit:** `fe032d8` (`main`, `status: building`), the same bundle as the live site (`index-DixMs5Da.js`). **Reviewer:** `lab-reviewer`, who built none of this lab.

**Verdict: not ready for the owner's checkpoint as it stands.** 0 blockers, 10 major, 12 minor, no console error and no failed request in any walk. Every blocker of the last review is fixed, and the spoken guide works. Seven majors belong to the lab or its card, and several are one line. Three belong to the kit and are in every lab using it, so they need not hold this one.

All screenshots are under `R` = `~/.cache/lab-review/sand-battery-lab/review-2026-11-04/`. The code, the data, the tests and `public/lab.json` were not touched.

## What was walked

A focused walk of about 65 minutes, not the full one: 446 shots, looked at through 38 contact sheets and about 25 full-size views. Chrome for Testing 154, headless, Metal, closed by its pid; port 5861, stopped; load 3.3 to 4.8, memory at least 70 % free.

| Walk                                                                                                     | Folder                                |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Four worlds' home and first visit, main and all labels, 1280, 1024, 768, 600, 390, FR and EN, light/dark | `R/homes`, DOM audit `homes/log.json` |
| All 51 parts by the visitor's chip at 1280 FR: framing, rays to the part                                 | `R/parts`, `parts/log.json`           |
| The selected label of all 51 parts at 1280, 1024 FR and EN, 768, 600, 390                                | `R/labels`, `labels/log.json`         |
| Spoken guide, 14 whole plays in the browser, plus the start of the intro on the live site                | `R/voice`, `R/labels`, `R/final`      |
| The last review's blockers and majors; ground-level and hand-set cameras; click pairs; turned camera     | `R/recheck`, `R/extra`, `R/final`     |
| Guides (8 of 30 steps), 12 scenarios started, game by real clicks, 10 plans, 4 lessons and quizzes, tabs | `R/modes`, `R/game`, `modes/log.json` |
| Text lint on every tab of 51 parts in FR and EN, 8 guide steps, 12 scenarios, plans' panel, 4 lessons    | `modes/log.json`                      |

## Gates

| Gate                   | Result                                                                 |
| ---------------------- | ---------------------------------------------------------------------- |
| `npm run typecheck`    | pass                                                                   |
| `npm run format:check` | pass                                                                   |
| `npm test`             | pass: 19 files, 626 tests, 0 todo, so **no shortfall in the standard** |
| `npm run build`        | pass                                                                   |

## Rule by rule (`lab-quality.md`)

| Rule                                         | Result                                                                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Every moving part attached                | ✓ risers rise with the wall, duct and blowers join; sampled, not every joint                                                                     |
| 1. Nothing floats, nothing sinks             | ✓ at the chimney, transformer, silo, risers on the ground (`R/recheck/site-*-foot.png`, `D11-riser-foot-side.png`); not re-measured part by part |
| 1. Turning the right way, speed read right   | Not checked by eye; tests pass. See « Not checked »                                                                                              |
| 1. A part sits where it acts                 | ✓                                                                                                                                                |
| 1. The maker's dimensions first              | ✓ 13, 15, 14, 6 m on PL-02 and in the sheets and voice                                                                                           |
| 2. One machine, the same everywhere          | ✓ test and eye (`silo` and `plant-room`)                                                                                                         |
| 2. Every system has a place                  | ✓ `plant-room`                                                                                                                                   |
| 2. A tool that teaches nothing is left out   | N3                                                                                                                                               |
| 3. Every prop reads as what it is            | N17; birch, gravel and solar glass of the last review ✓                                                                                          |
| 3. The setting's polish pass                 | ✓ in winter and summer; N18                                                                                                                      |
| 3. Water follows the physics                 | ✓ no open water; dots in pipes                                                                                                                   |
| 3. Device found, selecting brings you close  | Found ✓. Close ✓: 1 of 51 farther than home, and that is one turbine. N2                                                                         |
| 3. A warm, full, stable picture              | No streak or fog defect in any still. `flicker.mjs` not re-run                                                                                   |
| 4. The camera turns around what you look at  | ✓ from empty space in all four worlds, the part stays centred. N13 from a grab on a solid                                                        |
| 4. Nothing crushed at any width              | ✓ tabs and specs at 1024, 768, 600, 390; no clipped panel text in 54 audits. N5, N6                                                              |
| 4. The spoken guide is the way in            | ✓ ring and invitation on a fresh visit at all sizes. N8                                                                                          |
| 5. As much detail per device as Pelton       | ✓ all ways to look, 6 lessons, 12 questions, 10 sheets                                                                                           |
| 5. Title and description in both languages   | ✓ page title and `<meta>` follow; title no longer cut. N14                                                                                       |
| 5. README English first, French at the end   | ✓ order. N19 for content                                                                                                                         |
| 6. Never tuned, disagreements said           | ✓ sampled                                                                                                                                        |
| 6. Warnings said once, no research reference | References ✓, 0 in the lint. Tags: N9                                                                                                            |
| 7. Pelton's tone, 3D follows, subtitles      | 3D ✓ except N1; subtitles ✓; label ✓. Tone and sound not judged                                                                                  |
| 7. A sample first; no credit without a yes   | Not checked: 0 credit, local voice; the owner's listening is his                                                                                 |
| 7. Whisper back, rate, gaps, both languages  | Rate and gaps ✓ from the manifests. Whisper not redone (`narration/README.md` says done). Played in both languages ✓                             |
| 8. The review                                | This file                                                                                                                                        |

## The last review's blockers and majors

| Id  | State  | Evidence                                                                                                                                         |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Fixed  | No streak from behind at 40 m, side at 32 m, room at 33 m; near 0.1, far 150 measured (`recheck/D1-*.png`)                                       |
| D2  | Fixed  | Slab alone when isolated; the wall leaves with its pipes (`recheck/D2-*.png`)                                                                    |
| D3  | Fixed  | 1 of 51 farther than home, `wind-farm`, one turbine at 407 m (`parts/log.json`)                                                                  |
| D4  | Fixed  | Whole section and scale at 768 and 390 (`final/768-silo-cut.png`, `final/390-silo-cut.png`)                                                      |
| D5  | Partly | Heat meter, pump, blower of discharge now read. Rest in N2                                                                                       |
| D6  | Fixed  | Rails end on the wall (`homes/1280-fr-light-plant-room.png`)                                                                                     |
| D7  | Partly | The village no longer breaks; the slider now does nothing: N3                                                                                    |
| D8  | Fixed  | Stone clear of the toolbar at 1280 and 1024                                                                                                      |
| D9  | Fixed  | Bar in all three coloured worlds; beside its labels at 390                                                                                       |
| D10 | Fixed  | Fine crowns, no boulders (`extra/summer-near.png`)                                                                                               |
| D11 | Fixed  | Fine gravel (`recheck/D11-gravel-above.png`)                                                                                                     |
| D12 | Fixed  | Dark glass in winter (`homes/1280-fr-light-first.png`)                                                                                           |
| D13 | Fixed  | Fits at 768, two lines at 390. The tagline stays hidden: N14                                                                                     |
| D14 | Fixed  | « de 80 à 90 % » in the panel and `physics.md`                                                                                                   |
| D15 | Fixed  | « Avant la mise en service, l'exploitant attendait environ 160 t » in the sheet                                                                  |
| D16 | Fixed  | Copying the opponent: « Écart 0 € », no congratulation, at 1280, 1024, 390 (`game/1280-fr-copy.png`)                                             |
| D17 | Fixed  | Prices, score and grid in one view at 1280 (`game/1280-fr-open.png`). Real clicks paint and score: 11 blocks, 6,145 to 5,399 €, 11 chips pressed |
| D18 | Fixed  | « Le dessin reste celui du silo de 100 MWh » (`game/1280-preset.png`)                                                                            |
| D19 | Open   | N9. The owner's decision is still not recorded                                                                                                   |
| D20 | Open   | N4                                                                                                                                               |
| D21 | Fixed  | Blower before resistors in the overview and the voice                                                                                            |
| D22 | Partly | The camera no longer ends inside a block in my two drags; N13                                                                                    |
| D23 | Fixed  | Rotation, emulated: 390 px canvas (`recheck/D23-portrait.png`)                                                                                   |

## The owner's past finds, the test set

| Past find                       | Here                                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| The spring in the void          | Nothing loose in `silo` isolated or exploded. A label pointing at a hidden part: N1, N2        |
| The wheel turning backwards     | No fast wheel; sense held by a test, not checked by eye                                        |
| The specs crushed               | Fine at 1024, 768, 600, 390, both languages (`modes/*-part-specs.png`)                         |
| The untranslated title          | Translated, page title too                                                                     |
| The fixed camera pivot          | Fine from empty space in the four worlds; N13 from a grab on a solid                           |
| The missing equipment room      | There: `plant-room`                                                                            |
| The chain not attached          | No chain. Motor, coupling and pipes join in the close-ups sampled                              |
| The jellyfish tree              | The birch is fixed; nothing of the kind in the props sampled, N17 for two weak ones            |
| The sunk generator              | Ground-level shots clean; the lab's tests hold the machines on the deck, not re-measured by me |
| Called finished with two worlds | Four worlds, 51 parts, `status: building`, nobody says otherwise                               |

## Major

**N1. The return bend's voice shows a wall.** `pipe-cell`, `part-return-bend`, seen at 1280 FR. `[[explode:0.6]]` at the start lifts the bend out of the frame and the camera stays: **0 of 50 points of the part on screen**, for 13 of the 17 s, while the voice says « Ce petit coude » and « Regardez ce qu'il n'a pas ». Assembled it is on screen. The sheet's tip sends the visitor to the same place (« Quand vous verrez le U en éclaté »). `R/labels/voice-return-bend/t3.png`, `t9.png`, `R/final/bend-explode-06.png`. **Fix, narrator:** drop the cue or follow it with a frame; a modeler's check that a part's frame follows the explode. The script's hash includes the cues, so this one clip is generated again in each language.

**N2. Turn the camera, click a part, and you see a wall with its name on it.** The direction carries from click to click (6 pairs in `plant-room`: same direction every time; from behind too), and no part sets a `viewDir`, which kit 0.6.0 now offers. From behind, rays that reach the part first: `storage-bed` 0 of 34, `pipe-field` 0 of 48, `wall-insulation` 0 of 21, `foundation-slab` 0 of 11, `equipment-floor` 0 of 42; in `pipe-cell` `heat-pipe` 0 of 50, `return-bend` 0 of 47, `pipe-spacer` 0 of 26. `R/final/behind-silo-storage-bed.png`, `behind-silo-pipe-field.png`, `behind-cell-return-bend.png`. From the home direction, what D5 left: `charge-blower` 20 of 49 (the resistor bank in front), `discharge-damper` 14 of 48, `cold-air-duct` 11 of 50. The same frames are in the voice (`frame:charge-blower`: 16 of 40). **Fix, modeler:** `viewDir` on the parts inside the silo and the block (the opening's side), and on those three.

**N3. The first tool on the first screen does nothing.** `site`, Éclaté at full: same picture (`R/recheck/D7-site-exploded.png`). Rule: a tool that teaches nothing is left out. Kit 0.6.0 has `SceneDef.explode: false`. **Fix, modeler, one line** in `WORLD.site`, `src/three/index.ts`, and the guides' offsets can come back (`docs/kit-requests.md` 19).

**N4. « Étiquettes : Toutes » piles up below 1280 (D20).** Overlapping pairs, FR, `site` / `silo` / `pipe-cell` / `plant-room`: 1280: 1, 0, 0, 0. 1024: 5, 0, 0, 0. 768: 10, 5, 1, 14. 600: 5, 8, 1, 5. 390: 8, 12, 1, 14. EN about the same. `R/homes/768-fr-dark-plant-room-all.png`. **Tried in the page:** `declutter` on the active world gives **0 overlaps** at 1024, 768 and 390, with up to 9 names folded into dots (`R/labels/declutter/`, `labels/log.json`). Labels past the edge remain, 0 to 6. **Fix, modeler, one line per world;** `docs/3d.md` line 95 still waits for it. « Principales » has no overlap at any size, in both languages.

**N5. The name of the selected part is cut or covered.** By the chip's path, of 51 parts:

| Size    | Cut by the view or the panel                                                                                                                                                             | Over another label              |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 1280 FR | `dh-trench` 70 px                                                                                                                                                                        | `boiler-stack`, `cold-air-duct` |
| 1024 FR | `dh-trench` 144, `crushed-soapstone` 45                                                                                                                                                  | same two                        |
| 1024 EN | `dh-trench` 144, `crushed-soapstone` 45                                                                                                                                                  | `cold-air-duct`                 |
| 768 FR  | `discharge-blower` 64, `dh-trench` 76, `crushed-soapstone` 38, `house-substation` 32, `duct-penetration` 32, `boiler-stack` 23, `pipe-spacer` 15, `charge-damper` 9, `wall-insulation` 1 | same two                        |
| 600 FR  | `dh-trench` 38                                                                                                                                                                           | same two                        |
| 390 FR  | `dh-trench` 81, `discharge-blower` 59, `crushed-soapstone` 33, `duct-penetration` 28, `house-substation` 27, `boiler-stack` 18, `pipe-spacer` 11, `charge-damper` 5                      | same two                        |

So the part the sheet calls the most important reads « SOUFFLANTE DE D » on a tablet. `R/labels/768-fr/discharge-blower.png`, `390-fr/discharge-blower.png`, `1024-fr/crushed-soapstone.png`, `1280-fr/boiler-stack.png`, `1280-fr/dh-trench.png`. **Fix, modeler:** the anchors of these parts. **Lead, kit:** keep the selected label inside the view (a hotspot's side, already on the 0.6.0 list).

**N6. With the sheet open on a tablet or phone, the labels hide the machine.** 600 × 800 and 390: the 3D is about 150 px tall, and the six main labels cover it, one over another (« …MPE » is POMPE). `R/modes/600-fr-part.png`, `390-fr-part.png`. **Fix, lead, kit:** fold labels below a view height. The lab cannot reach it.

**N7. The plans' list does not follow the drawing.** Click PL-02: the sheet changes, the list still highlights PL-01, and the card under it still describes PL-01. `R/modes/1280-fr-plan-02.png`. `drawing` is missing from `panelKeys` in the kit's `app.ts`. The DOM shows the same on Piggott and on the gravity lab. **Fix, lead, kit, one word.**

**N8. The invitation covers the worlds on a phone (D46, worse there).** Fresh visit: at 390 and 600 it sits over the world tabs until closed (`R/final/fresh-390.png`, `fresh-600.png`); at 1280, 1024 and 768 over the panel's title (`R/homes/1280-fr-light-first.png`). **Fix, lead, kit.**

**N9. The tag outweighs the figure (D19).** Lesson 4's cards: « 69 MWh (32 %) (résultat du modèle) » in large type, four times, and more in lesson 5 (`R/modes/1024-fr-lesson.png`). The last review asked for the word to move to the card's label in any case; it has not moved. Whether the tags in the texts (about 220 written out in the French source, 446 rendered at the last review) become marks is **the owner's and the lead's decision**, still not recorded. **Fix, author:** the cards.

**N10. The showcase card says two false things today.** `onigam-labs/src/data/labs/sand-battery-lab.json`, seen on labs.onigam.io (`R/final/showcase-card.png`):

- `tags: ["off-grid"]` prints **« Hors réseau »** on a machine that buys from the grid and sells to a heating network. The lab's `lab.json` says `heat, storage, electricity, grid`.
- `spokenGuide: []` prints **« Guide parlé : Pas encore »**, with 112 files online. It should be `["fr", "en"]`.
- To open, the schema also wants `liveUrl`, `thumbnail` and `sources`, all absent (`capture` too, as on Piggott).
- Name « Batterie de sable » against « Labo de la batterie de sable », as siblings differ; the tagline is shortened, faithful. The owner's call only if he minds.

**Fix, lead.**

## Minor

- **N11.** The intro ends at 281 m from the village, more than twice its home (119 to 140 m): the `mode:install` framing is never undone (`R/voice/fr-intro/zz-end.png`). The EN script has the same cues. Nothing else stays on: flows, explode, section, selection and mode all back in the 14 plays. Narrator: `[[home]]` at the end; costs a clip in each language.
- **N12.** The voice's « deux échantillons, grossis pour vous » frames both tables: 50 × 70 px each, no grain to see (`R/voice/en-scene-pipe-cell/05-t19-frame=quartz-sand+crushed-soapstone.png`). The scale's label stands behind the subtitle at `frame:heat-pipe,return-bend` (`01-t5-…`). Narrator.
- **N13.** A drag that starts on a solid pivots there and can send the selected part off screen: NDC −1.36, 0.42 for `crushed-soapstone`, −1.42, 0.5 for `pad-transformer` after 360 px (`extra/log.json`). Kit's design; the camera stays out of solids. Kit.
- **N14.** The tagline is hidden at 1024 and below, so on a phone's first screen nothing says there is no sand (`R/homes/390-fr-light-site.png`). Kit, or a short phrase the owner chooses.
- **N15.** After any scenario the select reads « Réglages personnels » (`R/modes/1280-fr-scen-0.png`, D25). Physicist.
- **N16.** « Week-end à prix négatifs » says « les résistances tournent à plein ». The strip shows 378 kW at first, then 157 to 188 kW for about 30 h at −9 to −24 €/MWh, stock falling from 74 to 69 %, then 626 kW (`final/log-mini.json`). The sheet says the power falls « jusqu'au tiers à plein ». Physicist: is it the zone logic, and do the words hold?
- **N17.** Close up, the solar glass is flat black with no cell or frame (`R/recheck/site-solar-near.png`); the magnified quartz reads as pale lumps, close to popcorn (`R/parts/pipe-cell--quartz-sand.png`). Modeler.
- **N18.** First screen at 1280: the turbines' rotors are out of frame, white poles only (`R/homes/1280-fr-light-first.png`, D37). Modeler.
- **N19.** README in French: « l'audio n'est pas encore généré », against the English and the repo (line 52). GitHub's description: « store heat in a silo of sand », the opposite of the lab's first line. Homepage and README point to `vercel.app`, as on siblings; `onigam.io` also answers 200. All README links answer. Lead.
- **N20.** Toolbar on three rows with all labels at 768, « Ralenti ×1 » alone on the last; two rows at 1024 (`R/homes/768-fr-dark-plant-room-all.png`, `R/modes/1024-fr-lesson.png`). Kit.
- **N21.** ×3600, ×86400, ×604800 in the strip (D45). The panel explains them once. Kit.
- **N22.** Main labels a few pixels over the edge: « Pierre ollaire » 4 px under the panel at 768 FR, « 0 à 600 °C » 7 px under the toolbar at 1024 FR (`homes/log.json`). Modeler.

## The spoken guide

**Played, 14 whole plays of 12 segments:** FR intro whole, EN intro's start and end; a world each: `scene-site` EN, `scene-silo` FR at 1280 and EN at 390, `scene-pipe-cell` EN, `scene-plant-room` FR at 1280 and 1024; parts: `storage-bed`, `pipe-field`, `heat-pipe`, `return-bend` FR, `discharge-blower`, `heat-meter` EN at 1280, 600 or 768. Live site: the intro's first 6 s.

| Check                       | Result                                                                                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Files                       | 56 clips and a manifest per language; requests 206, no failure                                                                                        |
| Manifests                   | FR 1,239 s, 17.2 characters a second (15.6 to 19.2); EN 1,212 s, 16.9 (14.2 to 20.1); no subtitle gap over 0.6 s                                      |
| Subtitles                   | On at once, changing with the position, two lines at most, inside the dock at 390. « Voix de synthèse » and « Synthetic voice » shown in each segment |
| The camera follows          | ✓ each cue sampled just before the next. `site`, `silo`, `plant-room` and `pipe-cell` read as named, with N1, N2 and N12 as the exceptions            |
| Nothing stays on at the end | ✓ store unchanged after all 14 plays, no emphasis left, flows off, « Réécouter » offered. Only the camera after the intro: N11                        |
| Taking over                 | Drag or world change: voice goes on, « Reprendre le guidage » offered and works. Another part or language: stops cleanly, no error                    |
| The invitation              | Ring on the speaker, 2:23 FR, 2:15 EN, plays on tap; gone after use. N8                                                                               |

I cannot hear: nothing here says how it sounds, and the Whisper check was not redone.

## Sheets, guides, lessons, quiz, simulation

- **Figures on screen against the voice, 10 parts, all agree:** `wall-insulation` 38 to 67 kW; `inner-shell` about 9 cm; `core-zone` 417 and 375 °C; `charge-blower` a third at full; `expansion-loop` 5 cm and 6,000 cycles; `cable-riser` 1,443 A, 960 mm²; `silo-exterior` 13, 15 m, 8 K, 375 °C; `pipe-field` 3.7 km, 85 and 46 MWh; `discharge-blower` 275 °C, 46 to 132 MWh; `foundation-slab` 127 kPa, about 13 t/m².
- **Nothing reads as a build plan.** Guides and sheets say « notre lecture », « pas un plan à copier », and every plan says « pas un plan de construction ». Text lint: 0 placeholder, raw `**`, reference or backlog note in all the sampled text, both languages for the parts. Clipped text: 0 in 54 audits at 1024, 768, 600, 390.
- **Modes.** Guides 20 + 10 steps; 12 scenarios start, no error; « La soufflante lâche » plays in order: alarm by 12 s, input to 0 by 24 s. Quiz: right and wrong feedback on 4 lessons. Plans: 10 of 10 open, read as drawings, except N7. Navigation: the arrow label and « Ouvrir le silo » go to `silo`. Sources: 49 links, 44 answered; the maker's site, two press sites and ISO refused curl with 403 and DLR did not answer in 12 s, none confirmed broken.
- **Identity, kit 0.6.0, against labs.onigam.io:** same background (rgb 238, 241, 236 and 13, 26, 36), text colour and Space Grotesk, measured at 1280 in light and dark; same mark by eye, and the same frame at the other widths. The 3D keeps its own colours in dark, as the kit intends.

## Not checked

- Real phones, Safari, Firefox. Phones and rotation emulated, on Metal.
- The voice itself, and Whisper back.
- Motion by eye; `flicker.mjs` not re-run, so no shimmer figure at this commit; the sense of rotation by eye.
- Text overlap inside the drawings: my audit found no SVG text and so measured nothing. I looked at nine sheets on a grid and PL-02 full size. EN drawings beyond PL-01 not seen.
- Each part at three distances, in x-ray and isolated: done for 5 hero parts only, and FR only for close-ups. Part close-ups in EN not seen; the 3D does not change with the language.
- Lessons 2 and 3 not opened; 22 of 30 guide steps; 7 of 12 scenarios started and linted but not looked at; seasons other than winter and one summer.
- Sources against the facts: not re-read, the last review's table stands for what did not change. The 5 links above.
- Live site: load, identity and the intro's first 6 s only; the walk ran on the dev server at the same commit.
- The fixes marked « tried in the page » were tried live; none is built or tested.
