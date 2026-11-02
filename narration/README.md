# Narration scripts (French and English)

`fr.json` and `en.json` follow `lab-kit/docs/narration.md`: **56 segments each** (`intro`, 4 worlds, 51 parts: site 13, silo 14, pipe-cell 9, plant-room 15), ids `intro`,
`scene-<world>`, `part-<id>`, no lesson segments. **No audio exists yet.** This lab uses the local voice (`--engine voicebox`, 0 credit, the Voicebox application open); the session
that orchestrates the lab generates it after these checks, and the agent that writes this script never does.

Check the length without spending or generating anything (`HOME=<empty dir>` keeps the tool from even opening the key file):

```
HOME=$(mktemp -d) node ~/Dev/lab-kit/tools/narration/generate.mjs --src narration/fr.json --out public/audio/fr --dry-run --engine voicebox
HOME=$(mktemp -d) node ~/Dev/lab-kit/tools/narration/generate.mjs --src narration/en.json --out public/audio/en --dry-run --engine voicebox
```

## Budget (spoken characters, cues removed)

| Language | Total  | Intro | Worlds                                                    | Parts  | Longest parts                                                                                           |
| -------- | ------ | ----- | --------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| French   | 21,350 | 2,485 | 2,571 (site 624, silo 649, pipe-cell 643, plant-room 655) | 16,294 | `heat-meter` 454, `discharge-blower` 437, `resistor-bank` 424, `storage-bed` 409, `equipment-floor` 400 |
| English  | 20,529 | 2,404 | 2,524 (site 608, silo 672, pipe-cell 612, plant-room 632) | 15,601 | `discharge-blower` 431, `resistor-bank` 422, `heat-meter` 413, `storage-bed` 383, `equipment-floor` 365 |

The ceiling is 30,000 per language and the aim 17,000 to 24,000 (`src/narration.test.ts`). `generate.mjs` refuses a segment over 2,500 characters, so the intro has little room left: anything added to it
has to replace something. Ordinary parts are about 300 characters, not 270: most of them carry a figure of the maker against a figure of the simulation, and that takes a sentence.

## Register

Pelton Lab's tone (`lab-kit/docs/narration-style.md`). The thread is **one grain of stone**, which never moves: the heat comes to find it. It appears in the intro, `scene-pipe-cell`, `part-storage-bed`, `part-heat-pipe`
and `part-crushed-soapstone`. The intro follows the story from the wind to the school, closes on « un coup de vent, un grain de pierre, beaucoup de patience… et une classe bien au chaud », then asks the lab's question.

## The truths, each said once (`src/narration.test.ts` counts them)

| Truth                                                                           | Where                      |
| ------------------------------------------------------------------------------- | -------------------------- |
| The real machine holds crushed soapstone, not sand                              | `intro`, from its opening  |
| Educational, independent, generic reconstruction; neither a plan nor a product  | `intro`                    |
| Where the figures come from: the simulation, unless a source is quoted          | `intro`                    |
| No independent measurement of these machines was found                          | `intro`                    |
| A capacity only means something at a given power: 217, then 69, 105 and 43 MWh  | `intro`                    |
| The maker quotes up to 100 MWh, the model 69 at 1 MW, a blower nobody publishes | `intro`, the same passage  |
| False colour: stone at 400 °C does not glow                                     | `scene-silo`, one sentence |

**Why the heart is in the introduction.** Said once means one segment, and a part is played only by someone who clicks it, while the introduction is the way in. So `part-storage-bed` and `part-discharge-blower` do not repeat it:
the first is about the calm of the bed, the second about why the blower decides, with the range of 46 to 132 MWh across the unknown settings. None of them says 217, 69, 105, 43 or 100 MWh.

**Hedges.** « dans le modèle » is never said. « notre simulation », « notre calcul » or « notre estimation » only appear where a figure stands against one from a source (`part-silo-exterior`, `part-village-school`, `part-core-zone`,
`part-heat-meter`, `part-discharge-blower`, `scene-pipe-cell`). What the lab chose has the lab as its subject (« le labo compte », « dans ce labo », « nous dessinons »), which keeps it from sounding like a fact about the real silo without a
disclaimer each time. « notre lecture » is only in the intro.

**Attribution.** « le constructeur », « l’exploitant », « un fabricant », « une source », « un documentaire » at most, and only where the sheet attributes the fact to them.

**Places.** `narration-style.md` bans people, channels, companies, brands and institutions, and says nothing of places; Pelton's guide says Toulouse, Italy and France. So a place is allowed, and **the voice says « en Finlande », once, and never the town**: this village is generic,
naming the real town over it would suggest it is the place, and the town points straight at its operator. The town stays in the overview of the site and the Sources panel, which credit it. A test refuses every name of the Sources.

**Safety, one line each, where the gesture is risky:** hidden heat (`storage-bed`), water on hot pipes (`air-water-exchanger`), medium voltage (`pad-transformer`), arc on the board (`lv-switchboard`), both hands on the ladder (`access-ladder`), digging (`dh-trench`), an industrial
installation under each country's rules (`scene-site`), the two drums at home (`quartz-sand`).

## What the sheets say and the voice does not

- « Aucune mesure indépendante d’un vrai silo n’existe » (`heat-meter`) is an absolute, and the research only says none was found (`docs/research.md` §0.2). The voice says **« nous n’avons trouvé aucune mesure indépendante »**.
- The air at about 500 °C rests on the automatic transcription of a documentary: said once, with « à vérifier » (`resistor-bank`). Elsewhere the voice says « air très chaud ».
- « La lueur dessinée est une fausse couleur » (`resistor-bank`): the false colour is said once, in the silo world, so the plant room says nothing about its glowing elements.
- Formulas (`air froid + P / (ε·C)`), `c(T)`, W/K, W/m·K, kPa, the 250 MWh silo's factors of 1.2, 1.8 and 1.07: they cannot be spoken, and they stay on the sheets and in lesson 1.
- « environ 100 h dans une source secondaire, sans doute la capacité redite » (`charge-blower`): a guess about a source, not for the voice. −23 °C (`dh-riser`), left out for length.

Two spoken figures are not printed on a sheet: « environ treize tonnes sur chaque mètre carré » (`foundation-slab`: 2,000 t over the 154 m² of bed, in place of 127 kPa) and « près de quatre kilomètres de tube » (`pipe-field`, for 3.7 km).

## Cues (88 in each language, the same in both)

- Totals: frame 30, flows 16, cutaway 10, home 9, scene 8, mode 6, explode 6, xray 2, select 1. Every « on » has its « off » before the end of the segment.
- Intro (22): `home`, `frame` on the silo, `scene` hops plant-room, pipe-cell, silo, plant-room, site, silo, site, then `mode` hops assembly, install, sim, lessons, plans, explore, `scene:site`, `select:none`.
- Worlds: `home` first, one `frame` per element named, `flows` in the site and the plant room, `cutaway` in the silo and the pipe cell, `explode` in the silo and the plant room.
- Parts: no camera cue. `flows` on `dh-riser`, `dh-trench`, `discharge-blower`, `air-water-exchanger`, `dh-pump`; `cutaway` on `storage-bed`, `heat-pipe`, `core-zone`; `xray` on `pipe-field`; `explode` on `return-bend`.
- Spacing: camera cues at least 35 spoken characters apart. Section and X-ray only in the silo and the pipe cell.
- **The flows follow the model.** The dots run only when the simulation moves current, air or water, and at load (mid-February, 6 am) the heater is off, the blower of discharge runs and the water flows. So every `flows` cue stands on the water or the discharge side, and no sentence says « regardez » about moving dots: on the charge side they might show nothing.
  The lab has no `narration.onCue` hook, so no `lab:` cue. A hook such as `lab:scenario:cold-start` would let the intro show the stone heating up.

## Checked

`npx vitest run src/narration.test.ts`: the contract, ids, scopes and starting worlds, known cues on real ids, frames in the current world, what is switched on is switched off, section and X-ray where allowed, no camera cue in a part, 35 characters between camera moves, the hops of the intro, each truth and each hazard once, no name, spoken text only,
sentences at most 135 characters, exclamations and questions, no « tu », British English, the budget, no run of seven words from the private transcripts (`~/.cache/lab-review/research/sand-battery-lab/`, both languages), the same cues in the same order within a tenth of the segment between languages, and the manifests once they exist.

`node ~/Dev/lab-kit/tools/narration/tone-stats.mjs narration/fr.json`, against Pelton's script:

| Measure                      | French | Pelton | English | Pelton's English | Why they differ                                                                                                |
| ---------------------------- | ------ | ------ | ------- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Average sentence, characters | 70     | 79     | 67      | 69               | Subtitles cut at sentence ends: the same as Mill (71), the ram pump (70) and Piggott (67)                      |
| Sentences over 120           | 0      | 35     | 0       | 2                | The rule since Pelton is « almost none »; Pelton's 35 are its one departure from it                            |
| Exclamations per 1,000       | 0.80   | 0.80   | 0.83    | 0.83             | Held there on purpose                                                                                          |
| Questions per 1,000          | 0.42   | 0.29   | 0.44    | 0.35             | Like Mill (0.43) and Piggott (0.48). This lab is an inquiry: what is the link, who publishes what, where is it |
| « tu », digits or symbols    | 0      | 0      | 0       | 0                |                                                                                                                |

## To listen for in the sample (not measured, a script cannot tell)

French: ollaire, virole, gradateur, consigné, préisolés, mégawattheures, the long numbers (« mille quatre cent quarante-trois », « trois cent soixante-treize »). English: soapstone, thermowell, megawatt-hours, « one thousand four hundred and forty-three ». The percentages in a row of `part-heat-meter` are the hardest passage for the voice and the listener.

## Wired

`src/lab.ts` has `narration: { manifest: 'audio/{lang}/manifest.json' }`. `scripts/check-narration.mjs` runs in `npm run build`, and skips a language folder with no manifest yet.

## After the review of 2 November

- **The order of the charge.** Air goes through the blower, then the resistors: `intro` and `scene-plant-room` said the reverse, against the 3D and the model, and now follow them. Their frames go with it: `charge-blower`, then `resistor-bank,hot-air-duct`.
- **« Frais », not « froid ».** The maker says « cool », the model 8 K above the air (`part-silo-exterior`).
- **The frames moved closer** (`partPadding` 1.3, 1.15, 1.2 and 1.3; `docs/3d.md`). All 30 `frame` cues were read against it and shot at 1280: each sentence still has its object in view, and none had to change for it. A turbine stands for « les éoliennes », the first pole for « la ligne », the corner at the road for the trench. `charge-blower` is partly behind the bank, which suits a sentence about the two of them.
