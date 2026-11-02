# Review of the Sand Battery Lab

**Date:** 2026-11-02. **Commit:** `d38b211` (`main`, `status: building`). **Reviewer:** `lab-reviewer`, who built none of this lab.

**Verdict: not ready for the owner's checkpoint.** 4 blockers, 19 major, 24 minor. No console error in any walk.

All screenshots are under `R` = `~/.cache/lab-review/sand-battery-lab/2026-11-02-d38b211/`. The file names of `R/z` and `R/final` carry a camera's label, not its distance. Scratch scripts are in the session's scratchpad (`rv-*.mjs`). The code, the data, the tests and `public/lab.json` were not touched: every « tried in the page » below was done live in the browser, and the repository has no such change.

## What was walked

| Walk (headless, Metal, port 5852)                                                              | Shots | Folder                                                                 |
| ---------------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------- |
| 1280 FR: every part set, close, mid, isolated, x-ray, exploded; every world view; every mode   | 379   | `R/1280-fr`                                                            |
| 1280 EN: every part set, close, mid; every world view; every mode                              | 226   | `R/1280-en`                                                            |
| 768 and 390, FR and EN: worlds, tools, sheet tabs, modes                                       | 292   | `R/768-fr`, `R/768-en`, `R/390-fr`, `R/390-en`                         |
| A visitor's path at 1280: home, click the part's chip, Isoler, Transparence, Éclaté; occlusion | 208   | `R/select-1280-fr`, `R/select-1280-fr.log`                             |
| Both guides step by step (20 + 10), six lessons with their scenarios, quiz wrong then right    | 73    | `R/modes-1280-fr`                                                      |
| The ten A3 sheets in both languages, with a text-overlap audit                                 | 30    | `R/sheets-1280-fr`, `R/extra/plan-*`                                   |
| 12 scenarios, sand switch, heat at cold / half / full, flows in 3 worlds, orbit around a part  | 70    | `R/behave-1280-fr`                                                     |
| The painted-hours game played by hand at 1280 and 390                                          | 12    | `R/game-1280-fr`, `R/game-390-fr`                                      |
| Phones: fresh visit, real taps, sheet tabs, rotation; seasons; all round the silo; presets     | 101   | `R/phone`, `R/tabs`, `R/extra`, `R/modes-390-fr`                       |
| Hand-set cameras at the joints and at ground level                                             | 100   | `R/close-site`, `R/close-room`, `R/final`, `R/final2`, `R/z`, `R/last` |
| Motion, shimmer, tree trials                                                                   | 72    | `R/rotor*`, `R/flicker-1280`, `R/flickermap`, `R/trials`               |
| Fixes tried in the page, live state                                                            | 45    | `R/near`, `R/fixes`, `R/fog`, `R/dist`, `R/state`, `R/keep`            |

1,608 shots. How they were looked at, plainly: the FR parts on 14 grids of six views each at 260 px a tile (`R/sheets/grid`), with full-size looks at what looked wrong. Of the 292 narrow shots, about 110 on sheets, all through a DOM audit for clipped text and overflow. The EN walk at 1280 by a sheet of all 51 part panels, the DOM audit and the text lint, not view by view: the 3D does not change with the language.

Everything was shot on Google Chrome 156 from `/Applications`. After the coordinator's instruction no browser was launched; `rv-*.mjs` now point at Chrome for Testing 154.

Frame timing: the first gates and walks ran at a load average of about 33 (a film render and other labs on this Mac). At the end, at a load of about 4, all four worlds ran at 60 fps at 1280. No timing conclusion rests on the loaded period.

## Gates

| Gate                   | Result                                                                                                                                                                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`    | pass                                                                                                                                                                                                                                                                       |
| `npm run format:check` | pass                                                                                                                                                                                                                                                                       |
| `npm test`             | **first run failed**: `drawings.test.ts`, `beforeAll` over its 10 s limit at a load of 33 (D43). Alone: pass in 6.5 s. Second full run: **485 passed, 1 skipped, 2 todo**                                                                                                  |
| `npm run build`        | **fails while the audio is being generated**: `check-narration.mjs` meets the untracked `public/audio/fr` (first ENOENT on the empty folder, then « in the script, not in the manifest »). That is the generation in progress, not the commit. `tsc` and `vite build` pass |

**The standard's shortfalls (todos):** `spoken guide in fr: no manifest (no audio)`, `spoken guide in en: no manifest (no audio)`. Everything else is over the bar: 4 worlds, 51 parts, 20 + 10 steps, 6 lessons, 12 questions, 10 sheets, README, `lab.json`.

## Rule by rule (`lab-quality.md`)

| Rule                                         | Result                                                                                                                                                                                                         |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Every moving part attached                | D2 (risers left behind by the wall in the exploded silo). Rotor, shaft, coupling, motor and dampers ✓ close up                                                                                                 |
| 1. Nothing floats, nothing sinks             | D2, D6. Otherwise ✓ measured: 13 machines of the room at the deck, gap 0 to 10 mm, the other two carried by ducts and pipes; stack 0 / 0.5 / 1 / 7 / 8 closes; bends on their blocks                           |
| 1. Turning the right way, speed read right   | ✓ from `machine.test.ts` for the sense, 2 turns a second at most, so no blur disc is due. Motion seen, but only from above: D39                                                                                |
| 1. A part sits where it acts                 | ✓                                                                                                                                                                                                              |
| 1. The maker's dimensions first              | ✓ 13, 15, 14 and 6 m in `dims.ts`, PL-02 and the sheets                                                                                                                                                        |
| 2. One machine, the same everywhere          | ✓ same function, `machine.test.ts`; seen in `silo` and `plant-room`, and from outside in `site`                                                                                                                |
| 2. Every system has a place                  | ✓ `plant-room` is the equipment room, read in flow order                                                                                                                                                       |
| 2. A tool that teaches nothing is left out   | D7, D36                                                                                                                                                                                                        |
| 3. Every prop reads as what it is            | D10, D11, D12, D37, D41, D47                                                                                                                                                                                   |
| 3. The setting's polish pass                 | ✓ relief, banks of forest, boarded buildings, fence, trench, seasons. The winter haze is heavy: D37                                                                                                            |
| 3. Water follows the physics                 | ✓ no open water; dots inside pipes only, following `waterFlow` (`docs/water.md`)                                                                                                                               |
| 3. Device found, selecting brings you close  | Found ✓ (the silo reads at once). Selecting: D3, D5                                                                                                                                                            |
| 3. A warm, full, stable picture              | D1, D4, D24 (see « Shimmer »)                                                                                                                                                                                  |
| 4. The camera turns around what you look at  | ✓ in `site`, `silo`, `plant-room` from empty space. D22 in `pipe-cell`                                                                                                                                         |
| 4. Nothing crushed at any width              | ✓ part sheets, tabs and specs readable at 1280, 768 and 390 in both languages, no clipped text (DOM audit: only the title). D13, D23, D38                                                                      |
| 4. The spoken guide is the way in            | Not checked at this commit, no audio. The invitation appeared as a manifest arrived: D46                                                                                                                       |
| 5. As much detail per device as Pelton       | ✓ exploded, x-ray, isolate, cut, flows, 6 lessons, 12 questions, 10 sheets with connections, assembly and dimensions                                                                                           |
| 5. Title and description in both languages   | ✓ « Labo de la batterie de sable » / « Sand Battery Lab », `lab.json` bilingual; cut on narrow screens: D13; `<meta>` English only: D44                                                                        |
| 5. README English first, French at the end   | ✓                                                                                                                                                                                                              |
| 6. Never tuned, disagreements said           | ✓ 69 against 100 MWh from the first overview on; nothing tuned that I could find. D27 for the figures that do not agree with each other                                                                        |
| 6. Warnings said once, no research reference | References ✓: 0 K or S codes in 1,255 text pairs, the scripts and the sheets. « Reconstruction » once ✓, hazards once ✓. **The tags are not**: D19                                                             |
| 7. Pelton's tone, 3D follows, subtitles      | Scripts only: 56 segments in each language, 21,316 and 20,500 spoken characters, no digit, no name, the grain as thread ✓. Sound, subtitles and following not checked, by request. Scripts and frames: D5, D21 |
| 7. A sample first; no credit without a yes   | Not checked (0 credit by decision, local voice)                                                                                                                                                                |
| 7. Whisper back, rate, gaps, both languages  | Not checked: comes with the separate pass                                                                                                                                                                      |
| 8. The review                                | This file                                                                                                                                                                                                      |

## The owner's past finds, the test set

| Past find                       | Here                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| The spring in the void          | **Caught**: pipes, cable riser and scale bar standing alone in the air (D2), ceiling rails ending in the air (D6)                    |
| The wheel turning backwards     | No fast wheel: 2 turns a second at most, the sense held by a test. The movement is hard to see at all (D39)                          |
| The specs crushed               | Fine at 1280, 768, 390, both languages (`R/tabs/four.jpg`)                                                                           |
| The untranslated title          | Translated. Cut on narrow screens (D13)                                                                                              |
| The fixed camera pivot          | Fine from empty space in three worlds, measured. `pipe-cell` loses the part (D22)                                                    |
| The missing equipment room      | There: `plant-room`, 15 machines in flow order                                                                                       |
| The chain not attached          | No chain. Motor, coupling, port and scroll join, and the risers' feet line up with the trench's pipes (`R/final2/trench-head-c.png`) |
| The jellyfish tree              | **Caught**: the birch in leaf, stacked boulders on a white trunk (D10)                                                               |
| The sunk generator              | Measured: every machine at the deck to within 10 mm; ground-level close-ups in `R/close-site`, `R/close-room`                        |
| Called finished with two worlds | Four worlds, 51 parts; `status: building` and nobody says otherwise. Two lines of the standard remain, the audio                     |

## Blockers

**D1. The silo's wall flashes yellow and white.** `silo` and `plant-room`. From anywhere but the home side, the dark cladding is streaked with the wool and the room's liner fighting through it: at 40 m (`R/z/z-silo-back-45.png`), 31 m (`R/z/z-silo-back-34.png`), 32 m (`R/z/z-silo-right-34.png`), in the plant room at 33 m and 45 m (`R/z/z-room-back-36.png`, `R/final/far-50-b.png`). At 768 and 390 the camera starts at the 54 m limit, so the streaks are **in the home view** (`R/phone/fr-1-world-silo.png`, and undimmed by fog in `R/fog/w768-home-fog58.png`, `R/fog/w768-back-fog58.png`). `flicker.mjs` cannot see this: it orbits 5° on the home side. **Cause, tested:** depth. With `near` 0.01, `far` 60 and 24 bits, a depth step is about 1 cm at 40 m, and the valleys of the ribs (r 7.47 m) stand 5 mm off the wool (r 7.465 m). Tried in the page: `near` 0.1 or 1 clears it completely (`R/near/near-001.png` as shipped, `R/near/near-01.png`, `R/near/near-1.png`); hiding the wool leaves the top band, which is the liner (`R/near/hide-wall-insulation.png`). **Fix, lead, kit, one line:** `near` 0.1 outside `site` in `Stage.setActive`; the closest any world lets the camera come is 0.5 m. Add it to request 11.

**D2. Isolate and explode leave things standing in the void.** `silo`, all 14 parts. Isolate the slab, or anything else: the scale bar on its stand, the cable riser and the two water pipes stay, floating around nothing (`R/final/silo-iso-slab.png`, and every `R/1280-fr/*-silo-*-isolated.png`). In the exploded silo the wall rises 8 m and the pipes that are fixed to it stay on the ground (`R/z/exploded-silo-risers.png`). Cause: `silo/scene.ts:247-258`, risers and scale are in the scene but in no part, since their ids belong to `site`. **Fix, modeler:** in this world, parent the risers to `outer-cladding`, so that they move and hide with it, and the scale to `storage-bed`, whose colours it explains.

**D3. Selecting a part takes the camera away from it.** 24 of the 51 parts are framed **farther than the world's home view** (home at 1280: `site` 119.7 m, `silo` 34.3, `pipe-cell` 15.7, `plant-room` 19.9).

- `silo`: 10 of 14 go to the 54 m limit, 11 with `upper-vent`. Click « Le lit de pierre »: the silo shrinks by a third (`R/select-1280-fr/silo--storage-bed--1-selected.png`).
- `site`: `power-line` and `wind-farm` 480 m, `dh-trench` 254, `solar-field` 173, `village-school` 158, and the silo itself only reaches 100 m. Click the line: the whole village is a smudge and no ray in 49 hits the line (`R/select-1280-fr/site--power-line--1-selected.png`).
- `plant-room`: `blower-drive` 37, `cold-air-duct` 39, `dh-pump` 24, `hot-air-duct` 24, `control-cabinet` 20.5. `pipe-cell`: `heat-pipe` 20.5, both zones 18.4.

Table in `R/select-1280-fr.log`. This is the rule « selecting it brings the camera close enough to read it ». **Fix, modeler, one line:** `partPadding` in `src/three/index.ts`, now 2.6 / 1.9 / 1.9 / 2.2. Tried in the page at 1.3 / 1.15 / 1.2 / 1.3: 24 farther than home becomes 12 (`R/fixes/log.json`). Seven are layers as large as the silo itself, at 36 to 41 m instead of 54; `blower-drive` and `cold-air-duct` at 22 to 23 m. **Lead, kit:** the last three, `power-line` 448 m, `wind-farm` 480 m, `dh-trench` 127 m, have boxes 209 to 1,314 m wide and need a frame box per part, with request 13.

**D4. On tablets and phones the fog eats the silo.** `silo`, 768 and 390, both languages. At those widths the camera stands at 54 m, and `fog: [52, 59]` starts there: everything behind the axis sinks into it. The section, the hero of this world, loses half of itself and the scale bar when « Coupe » is on (`R/768-en/022-silo-cut.png`, `R/fog/w768-cut.png`, `R/fog/w390-cut.png`); the home view is already washed out (`R/fog/w768-home.png`, `R/fog/w390-home.png`). At 1024 and 1280 the camera is at 35 m and nothing shows (`R/fog/w1024-cut.png`, `R/fog/w1280-cut.png`), which is why nobody saw it. **Tried in the page:** a far plane of 90 m alone changes nothing (`R/fog/w768-cut-far90.png`); fog from 58 to 60 m gives back the whole section and the scale, with the floor still fading softly and no clipping I could see (`R/fog/w768-cut-fog58.png`, `R/fog/w768-home-fog58.png`). **Fix, modeler, one line:** `silo/scene.ts:162`, and the same in `plantroom/scene.ts:126`, which only reaches it at full pinch-out. It unveils D1 at those widths, so the two go together. **Lead, kit:** request 11 gives real margin.

## Major

**D5. A machine you select is hidden behind another, or too small to read.** The app keeps the home direction. Of the rays that reach the part, how many reach it first, at that direction (`R/fixes/log.json`): `discharge-blower` **5 of 38** (behind the exchanger), `discharge-damper` 3 of 12, `cold-air-duct` 6 of 20, `charge-blower` 14 of 32 (behind the bank), `charge-damper` 9 of 17, `expansion-vessel` 10 of 19. The discharge blower is the part whose sheet opens on « la pièce la plus importante du labo », and the visitor gets its outline across the exchanger (`R/select-1280-fr/plant-room--discharge-blower--1-selected.png`). **The heat meter and the pump are a different case:** not hidden (5 of 5, 3 of 4), but their boxes run along 5.5 m of pipe, so the camera stays 19 and 24 m away and the machine is a few pixels under a long outline (`R/select-1280-fr/plant-room--heat-meter--1-selected.png`). The same for `blower-drive`, 9.9 m for two cabinets. In `pipe-cell`, `pipe-spacer` is 0 of 5 and `heat-pipe` 8 of 32, inside the blocks with no hint to open them. In `site`, `house-substation` frames a blank white roof with an outline on it (`R/select-1280-fr/site--house-substation--1-selected.png`), and its cellar is open towards the other side (`R/final2/cellar-from-open.png`). **The voice frames the same machines:** `[[frame:charge-blower]]`, `[[frame:discharge-blower,discharge-damper]]`, `[[frame:dh-pump,heat-meter]]`.

**Tried in the page:** the same azimuth at 60° of elevation: `discharge-blower` 26 of 32, `expansion-vessel` 13 of 13, `dh-pump` 8 of 8, `resistor-bank` 36 of 38; `charge-blower` 12 of 26 and `discharge-damper` 6 of 13 stay partly hidden (`R/fixes/room-home-60.png`, `R/fixes/room-home-50.png`). **Fix, modeler:** the room's home at `plantroom/scene.ts:281` to about (1.6, 30, 9.3); the long pipes of `heat-meter`, `dh-pump` and the drives' trays out of those parts' boxes, into a scenery group. **Lead, kit:** request 13, a view direction per part, for the rest.

**D6. The ceiling rails end in the air.** `plant-room`. Five dark bars cross the whole picture in the home view and stop in mid-air where the wall has opened (`R/1280-fr/271-plant-room-overview.png`, `R/close-room/room-behind-rails.png`, `R/z/z-room-back-20.png`). `docs/3d.md` says that from the usual side they tie into the wall that stands: that is one end only. They are also the highest-contrast lines of the view, in front of the machines. **Fix, modeler:** `machine/room.ts:28`, the same `dollhouse` discard as the wall, or stop the rails over the last rod.

**D7. Exploding the village breaks it.** `site`, the first tool on the first screen. The school hangs 9 m up, the boiler 7 m, the stack 11 m, the trench lifts as a frame and leaves white walls in the ground (`R/1280-fr/080-site-exploded.png`). Isolating any part leaves that hole as a bright white strip too (`R/1280-fr/011-site-dh-riser-isolated.png`). It teaches nothing. **Fix, modeler:** zero the offsets of `site`, so that the tool does nothing rather than break the picture, and draw the trench's walls in the hole's own colour. **Lead, kit:** a `SceneDef` flag to hide the tool, as `cutaway` does.

**D8. In the plant room the toolbar covers the only heat colour.** At 1280 the floor and half of the stone's section run under the toolbar (`R/1280-fr/271-plant-room-overview.png`). **Fix, modeler:** `homePadding` 0.92 to about 1.1 and the target lower, with D5's new home.

**D9. No scale in two of the three coloured worlds.** `pipe-cell` and `plant-room` colour the stone with no temperature anywhere on screen (`R/1280-fr/199-pipe-cell-overview.png`, `R/1280-fr/271-plant-room-overview.png`). In `silo` at 390 the bar sits behind its own three labels (`R/phone/fr-1-world-silo.png`). The colours do read: blue, green, amber are clear at cold, half and full, in every world and at every width outside D4, and none reads as glow. The temperatures read only in `silo`. **Fix, modeler:** reuse `buildScale()`, or labels on a small bar, in the other two worlds.

**D10. The birch in leaf looks like stacked boulders.** `site`, any summer view: a white trunk under big faceted green lumps (`R/extra/season-summer.png`, `R/extra/season-summer-birch.png`). The bare birches of the first screen are good. « Un mois d'été » goes straight there. This is the jellyfish. **Fix, modeler:** `vegetation.ts:329`, many more, much smaller puffs, softer normals.

**D11. The yard's gravel reads as polka dots.** `site`, close up: regular pale discs on grey (`R/final/riser-foot-side.png`, `R/final/riser-foot-above.png`, `R/extra/season-summer-birch.png`). Selecting the annex, the transformer or the risers shows it. **Fix, modeler:** `gravelMap` in `textures.ts`, smaller stones of varied size, and a second scale at `terrain.ts:300` to break the tiling.

**D12. The solar field is brown in winter.** `site`, the first screen, top right: brown stepped shingles, not panels (`R/1280-fr/080-site-exploded.png`, `R/sheets/grid/g01.jpg`). In summer they are the right navy (`R/extra/season-summer-birch.png`). **Fix, modeler:** `props.ts:369`, `patchSnow` on a glossy dark material: keep the snow off the glass, or give it real white.

**D13. The title is cut on narrow screens.** At 390: « LABO DE LA … » (357 px in 207) and « SAND BATTERY L… » (216 in 207). At 768: « LABO DE LA BATT… » (436 in 258) and « SAND BATTERY… » (264 in 224). The tagline is hidden at both widths (`R/tabs/four.jpg`, `R/768-en/022-silo-cut.png`). So on a first visit on a phone, nothing on the screen says what this is, or that the machine holds no sand: that first line is in the closed sheet. As styled, 15 characters fit at 390. **Fix, lead and owner:** a short French name, which is the owner's to choose, with kit request 14.

**D14. A misquoted efficiency, in the very sentence that frames the 91 %.** `efficiencyHint`, `src/panels/strings.ts:249-250`: « de 85 à 90 % ». No source says it; the source says **80 to 90** (S17, read in full), as the heat meter's sheet does. `docs/physics.md` line 15 has the same slip. **Fix, physicist or author:** 80.

**D15. The 160 t is a forecast, presented as a first-year result.** `boiler-stack` (`src/data/parts/site.ts:506-507`): « for its first year the operator announces about 160 t ». S13 (2024) and S4 (2025: « is expected to ») give it ahead of the first year; S3 gives it undated; **S5, the first-year report, gives 70 %, 60 % and 100 %, and no 160 t**. **Fix, author:** « the operator expected about 160 t a year; after a year the maker reports a 70 % cut, about 60 % fewer chips, no oil ». The voice's « annonce » can stay.

**D16. The game congratulates you for copying.** `Prendre le plan de l'adversaire`, then at once: « Écart 0 € » and « Vous battez l'adversaire » (`R/game-1280-fr/game-4-opponent.png`, `R/sheets/game390/sheet-000.jpg`). `src/panels/sim.ts:754`, `you.total <= them.total`. **Fix, physicist:** `<` with a margin of a euro.

**D17. You paint blind.** The game's section is 1,296 px tall in a 678 px panel at 1280, 1,245 px in a 387 px sheet at 390. The prices are not next to the grid (their chart is several sections below, after « Tous les chiffres »), the score is below the grid, and each day wraps, seven chips and a lone « 21 » (`R/game-1280-fr/game-2-painted.png`, `R/sheets/game390/sheet-000.jpg`). The roadmap's « aha » is a guess with no price in view. Played: nothing 6,145 €, every night 5,284 €, every hour 6,875 €, opponent 4,469 €. **Fix, physicist:** in `src/panels/sim.ts:419-424` move `weekChart.el` and `gameScore` into the section, above the grid. **Lead, kit:** request 1, the `timeline` widget, for the rest.

**D18. A preset of another size shows the same silo and says nothing.** « Deux fûts de sable » and « 8 MWh » keep the 15 m silo, with the stone gone to a plain colour and « 500 °C » still beside it (`R/extra/preset-two-drums.png`, `R/extra/preset-kankaanpaa.png`). No text in `src/panels` or `src/data` reads `onDrawnSilo`. **Fix, author:** one hint in the panel when it is false: « le dessin reste celui du silo de 100 MWh ».

**D19. The tags are on every figure, in words.** 446 parentheses in the sheets, guides and lessons: 211 « (estimation) », 123 « (résultat du modèle) », 96 « (dérivé) », 16 « (hypothèse) », in about 1,060 sentences. In lesson cards they outweigh the figure: « 69 MWh (32 %) (résultat du modèle) » in large type, five times (`R/modes-1280-fr/lesson-4-open.png`). The owner on this: « les disclaimers à chaque fois c'est un peu chiant ». It is honest and it is what the lab's own rule demands, so **a decision for the owner and the lead**: marks with one legend, as the panel already does with † and *. The lesson cards should move the word to the card's label in any case (author).

**D20. All labels overlap.** « Étiquettes : Toutes » at 1280: `plant-room` hides « Gaine d'air chaud » and « Échangeur », `silo` runs five together, `pipe-cell` covers « Coude de retour », `site` cuts « Colonnes » (`R/sheets/labels1280/sheet-000.jpg`); worse at 390 (`R/390-fr/005-site-labels.png`, `R/390-fr/023-silo-labels.png`, `R/390-fr/059-plant-room-labels.png`). « Principales » is clean at all widths. **Fix, modeler:** move the anchors in `plant-room` and `silo`; **lead, kit:** declutter.

**D21. The words put the blower after the resistors; the machine and the model do not.** The 3D ✓: return duct, blower, resistors, hot header (`R/dist/charge-order-above.png`). PL-05 ✓, sheet ✓, `part-charge-blower` ✓. But the overview of `plant-room`, which says it reads « in the order of the current and the heat », has « a resistor bank makes hot air, which the charge blower drives » (`src/data/overviews.ts:33-34`), and the voice has the same order in `intro` (« des résistances changent le courant en air très chaud, et une soufflante le pousse ») and `scene-plant-room`. **Fix, author and narrator, today, because the audio is being generated now:** « la soufflante de charge pousse l'air à travers les résistances… », and regenerate those two segments. `docs/research.md` §0.4 still shows the old order without a correction.

**D22. In `pipe-cell` a drag can lose the part.** Select « Pierre ollaire », drag from the top left, which lands on a block: the pivot jumps to the point pressed, as the kit intends, but a 360 px drag ends with the camera inside the block, the whole view orange, the part at NDC −4.9, 8.2 (`R/behave-1280-fr/orbit-pipe-cell-1.png`, `R/behave-1280-fr/orbit-pipe-cell-2.png`). The blocks are big and the camera close. **Fix, lead, kit:** do not let a grab pivot take the camera into a solid.

**D23. Rotating a phone with the panel collapsed breaks the page.** Emulated, 844 × 390, panel collapsed, then 390 × 844: `grid-template-columns` stays `78px 312px 0px`, and the 3D is 78 px wide until a reload (`R/phone/rotate-2-portrait.png`; every `R/extra/phone-*` shot shows the same break, because my script collapsed the panel at 390, so those are not views of the worlds). In the kit, so probably in every lab; not tried on a real phone. **Fix, lead, kit.**

## Minor

- **D24.** The village shimmers at twice Mill's orbit, below Mill's dolly, no pop: see below. The owner's look.
- **D25.** Sand switch: nothing moves in `site`, where the simulation opens by default; « Réglages personnels » when the settings equal the preset « Le même silo rempli de sable »; « Utile à plein » falls to « 141 kWh » then « 0,0 kWh ». The sand's reveal colour is close to the wool beside it (`R/dist/reveal.jpg`). Author: add « regardez le silo » to `mediumHint`.
- **D26.** Air dots are hot from the blower on, 2 m before the resistors: `equipment.ts:1309`, `chargeHot` starts at the blower (`R/dist/charge-order-above.png`). Modeler.
- **D27.** The same « full » three ways: edge 375 °C in the sheets, voice and `physics.md`, 369 °C in the panel's order table, 365 °C on PL-03 (core 417, 423); walls and circulation 4.6 / 4.3 % in the sheets, 4.5 / 4.2 % in the panel (`getYear`: 4.47, 4.18), held by a test with ±0.05 (`figures.test.ts:159`); charge 183 h, 281 h, 336 h with no start stated. Physicist.
- **D28.** « L'opérateur du premier silo a connu −23 °C » (`dh-riser`): S22 is a UN information article saying the town can fall to −23 °C. Author.
- **D29.** « The real network's largest customer is public buildings » (`village-school`): none of S3, S4, S5, S17 says it; S4 says a large share of the town's buildings are connected. Author.
- **D30.** « The tests went on all through the winter of 2024-2025 » (`winter-tests`), tagged reported for the dates: S13 says testing « will begin during the winter ». Author.
- **D31.** « Froid au toucher », « il reste froid », « cold to the touch »: the maker says « cool », the model 8 K above the air. Author, narrator.
- **D32.** Lesson 5 tells the visitor « ces tranches sont une solution provisoire : le labo attend un vrai bandeau » (`lessons.ts:323`): a backlog note. Author.
- **D33.** A year in which nothing is charged prints « Parois, part de l'électricité 141,3 % », « Circulation 100,0 % » (`R/modes-1280-fr/log.json`). Physicist: a dash under some electricity.
- **D34.** « Vous pouvez le battre d'un cheveu »: from whole blocks, by thresholds and block-by-block descent, I got no nearer than +14.9 €. It is beaten only by −0.6 €, by changing one block of its own plan, 7 of whose blocks are partial and drawn as full (`rv-beat.mjs`). A search, not a proof. Physicist.
- **D35.** Quiz: the longest answer is the right one in 10 of 12. All 12 answered wrong then right, feedback fine, progress reaches 6/6. Author.
- **D36.** Transparence does nothing in `plant-room` with nothing selected (`R/1280-fr/363-plant-room-xray.png`): no `xrayShell`. With a part selected it leaves dark blotches on the floor (`R/1280-fr/354-plant-room-expansion-vessel-xray.png`). Modeler.
- **D37.** First screen at 1280: the turbines' rotors are out of frame, white poles only, and the haze is a grey wall over a quarter of the picture (`R/1280-fr/080-site-exploded.png`). Cold. Modeler.
- **D38.** With a part selected the toolbar takes two rows at 1280, one tool alone on the second (`R/select-1280-fr/silo--storage-bed--1-selected.png`). Kit.
- **D39.** The blowers do turn (`R/rotor4`): at the coupling, seen from above only; the wheel in its port is hidden by the motor in every framing I tried. Modeler.
- **D40.** The elements glow salmon at 555 °C, off the stone's ramp (`R/dist/charge-order-above.png`). The sheet says false colour, once; the voice does not. I would leave the voice as it is, since real elements at that temperature are near a dull red, unlike stone at 400 °C: the owner's call. Modeler, if the colour is to join the ramp.
- **D41.** A bare white disc on the gravel around the risers' feet (`R/final/riser-foot-above.png`). Modeler.
- **D42.** Drawings: 0 text overlap and 0 reference in 20 audits, but « Projection européenne » touches the red line of the title block on every sheet (kit); PL-05 splits « de 11 / à 25 kW » across two rows; PL-01 lists a panel's size against « Champ solaire » (`R/extra/plan-fr-PL-05.png`, `R/extra/plan-fr-PL-01.png`). Author, kit.
- **D43.** `drawings.test.ts` `beforeAll` takes 6 s alone, over 10 s under load: CI may flake. `check-narration.mjs` throws on an empty language folder. Author, lead.
- **D44.** `<meta name="description">` English only; `docs/3d.md` compares its shimmer at 1000 × 640 with Mill's at 1280 × 720. Lead.
- **D45.** The speed labels ×3600, ×86400, ×604800 say nothing (kit request 4).
- **D46.** The invitation « Commencer par la visite guidée » covers the sheet's category and the panel toggle until it is closed (`R/select-1280-fr/plant-room--heat-meter--1-selected.png`). Kit.
- **D47.** Exploded, the dampers stay low and read as six little chairs under the risen ducts (`R/1280-fr/362-plant-room-exploded.png`). Modeler.

## What the builders asked

**Shimmer: would the owner notice the forest?** Same tool, same size as Mill (1280 × 720, 150 frames, Metal, pinned clocks), all worlds in `R/flicker-1280/flicker.md`:

| `site`                 | Orbit  | Dolly   | Spike       |
| ---------------------- | ------ | ------- | ----------- |
| This lab               | 5.25 % | 6.97 %  | 1.33 / 1.39 |
| Mill's site, for scale | 2.64 % | 9.64 %  | 1.35        |
| This lab, ratio 2      | 8.10 % | 10.88 % | 1.29 / 1.30 |
| This lab, phone        | 3.01 % | 4.66 %  | 1.23 / 1.27 |
| Half the spruces       | 5.19 % | 6.82 %  |             |
| A quarter of the mid   | 5.47 % | 7.08 %  |             |
| No spruce at all       | 3.37 % | 5.69 %  |             |
| No birch wood at all   | 4.00 % | 5.42 %  |             |
| No far birch wood      | 5.22 % | 6.91 %  |             |
| No young spruce        | 5.24 % | 6.94 %  |             |

The 7.54 % was at 1000 × 640; at the rule's size the village is twice Mill's orbit and below its dolly, with no pop. **Fewer spruces buy nothing**: half of them changes it by 1 %, a quarter makes it worse, since each one gone uncovers the next edge. Only none at all helps. The map sits on the forest band and the ridge line (`R/flickermap/compare.jpg`), and the 53 near birches alone weigh a quarter. Six consecutive frames at 2× show stable shapes and no crawl (`R/trials/strip.jpg`). **My reading: keep the forest, this is not a defect to fix before the owner looks.** I judged stills and numbers, not motion: the owner should do one slow orbit. If he sees it, thin the near birches' twigs, not the spruces.

**Part framing, the heat meter, the pump:** D3, D5. **Plant-room floor, rails:** D6, D8. **Title:** D13.

**The phone silo does not look small because of the far plane.** At the 54 m limit its box spans −0.97 to +0.95 of the width (`R/phone/log.json`): the portrait screen's width sets it, and the far plane does not make it smaller. The empty space is above it (`R/phone/fr-1-world-silo.png`). What the limit does cost is D1 and D4.

**Not walked until now:** parts close up, explode, x-ray, isolate: done, D2 to D7. Quiz answered: fine (D35). Game played: D16, D17, D34.

**The heat colours:** readable in every world and width outside D4, none reads as glow; the temperatures are readable only in `silo` (D9). The plant room's elements: D40.

**The sand switch, at 1280.** It works, and it stays true. In `silo`, `pipe-cell` and `plant-room` the stone turns its own colour for 3 s and comes back to the false colour, unchanged as it should be: the temperatures do not jump (mean 400.3 °C either way), the mass drops to 1,316 t, the budget goes to 30 / 79 / 23 MWh as `physics.md` says, and the 3 s are honest about what the switch is (`R/dist/reveal.jpg`, `R/panel/log.json`). In `site` nothing shows (D25).

**Charging-first logic:** the 3D and the drawing follow the model; the words do not (D21).

## Facts against their sources

Fetched today and read in full; the pages are in `R/sources`.

| Fact on screen                                 | Source                                                                                                              | Verdict                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 40 trucks, filled by the end of October 2024   | S13, 12.11.2024: « Forty truckloads », « completed at the end of October »                                          | ✓                            |
| 3 to 373 €/MWh in a week                       | S17: « within a single week from 3 €/MWh to 373 €/MWh », « Polar Night Energy's own data »                          | ✓, said as one source's      |
| Chips −60 %, oil dropped, no interruption      | S5's first-year table: 60 % biomass, 100 % oil, 100 % reliability, 70 % emissions; S4, S13 as expected; S17 as well | ✓                            |
| 160 t avoided                                  | S13 and S4 ahead of the first year, S3 undated, **not in S5**                                                       | **✗ D15**                    |
| First silo: core 500 °C, edge 150 to 200 °C    | S9, the operator: « the core is heated to around 500 Celsius degrees, the edge temperature is 150–200 degrees »     | ✓                            |
| Stove-factory by-product                       | S13, S3, S4: « a by-product of Tulikivi's fireplace production »                                                    | ✓ (« rebut » is S17's word)  |
| 80 to 90 %                                     | S17: « 80-90 percent »; **the panel prints 85 to 90**                                                               | **✗ D14**                    |
| About 80 %, above 85 %, 60 to 75 %             | S3, S5, S8                                                                                                          | ✓                            |
| About 100 h of charge                          | S17, a secondary source, as the sheet says                                                                          | ✓                            |
| 1 m of sand, 8 days; 14 × 6 m at 400 °C        | S6                                                                                                                  | ✓                            |
| 30 to 35 %, up to 90 %, no turbine, 2025-2027  | S12                                                                                                                 | ✓                            |
| 36 % of industrial heat; no home product       | S2                                                                                                                  | ✓                            |
| 6 GWh, 90 to 250 °C, 20 × 30 m (2 MW product)  | S2                                                                                                                  | ✓                            |
| c 0.98 to 1.0, k 6 to 12                       | S27, a heater maker, no reference; it says so                                                                       | ✓                            |
| About a year, 40 subcontractors, 100 workers   | S4                                                                                                                  | ✓                            |
| Air at 500 °C; engineer among the machines     | S31, the private Whisper text, lines 18-23 and 38; marked « to check » in the lab                                   | ✓ as marked, not on the film |
| −23 °C; largest customer; all winter; « cold » | S22, S4, S13, S2                                                                                                    | D28, D29, D30, D31           |

**Against `docs/physics.md`:** 217; 69 / 105 / 43, 32 / 48 / 20 %; 46 %; 93, 122, 159; 8.5 and 48 days; 275 °C; 91, 84, 74 %; ×1.2, ×1.8, ×1.07, 2.3; 160; 1,316 t; 30 / 79 / 23; 183, 120, 515 h; 7.4 days; 36 h; 66 K; 616, 3.7 km; 2.2 MWh, 0.8 kWh: all match on screen. What does not: D27. All 689 English sentences with a figure were read.

**Modelled never said as measured:** ✓. Model figures carry their tag or the panel's †, the drawings a red box; the voice says « notre simulation », with one line in the introduction for the rest.

**The first line says soapstone:** ✓ tagline, the village's panel title and first sentence, `lab.json`, README, `<meta>`, the voice's third sentence. Not on a phone's first screen (D13).

## Not checked

- Real phones, Safari, Firefox. All walks are headless Chrome on Metal, phones emulated. `FrameGovernor` on a real phone.
- The voice: no audio at this commit, by request: subtitles, « Voix de synthèse » on screen, the 3D following, the invitation's behaviour, Whisper back. Separate pass.
- Motion by eye: I judged stills and pixel differences. The owner's slow orbit of the village, the sense of rotation by eye.
- The fixes marked « tried in the page » were tried live, one at a time, at the widths named; none is built or run through the tests. `near` 0.1 was tried at 1280 only; the 60° home through the visitor's path was not walked.
- Sources not re-read: S10 (250 MWh silo), S11, S15 (patent), S16, S19, S20, S23 to S26, S28 to S30; S31 not watched, only its private transcript. The law pointers of `research.md` §7.
- The EN walk at 1280 view by view, and about 180 of the 292 narrow shots by eye (see « What was walked »).
- The live site: the review ran on the dev server at `d38b211`.
