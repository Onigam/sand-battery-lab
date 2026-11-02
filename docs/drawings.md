# Drawings of the Sand Battery lab

Ten A3 sheets (`src/drawings/`), every length read from `src/three/dims.ts`, every model result from `src/sim` or `src/data/figures.ts`, through `lab` and `fig` in `geom.ts`, which record what they print so that the test can tell a printed number from a typed one.

| Sheet | id                    | World        | What it shows                                                                                                     |
| ----- | --------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------- |
| PL-01 | `general-arrangement` | `site`       | the village in plan, 1:500, the silo in elevation, 1:200, the 13 items and their drawn sizes                      |
| PL-02 | `silo-section`        | `silo`       | the silo in section, 1:75, reported and estimated dimensions told apart, the wall at 1:10, the levels             |
| PL-03 | `temperature-maps`    | `silo`       | the section at 0, 25, 50, 100 % of a first charge, the model's own grid, the 3D's ramp, the charge as curves      |
| PL-04 | `pipe-field`          | `pipe-cell`  | a quarter of the bed in plan, a U-pipe in section, the loop at 1:10: generic, all estimated                       |
| PL-05 | `air-loop`            | `plant-room` | charge, discharge, both: three diagrams; what circulates; MWh at 1 MW against the blower, run from the model      |
| PL-06 | `single-line`         | `plant-room` | from the medium-voltage line to the resistors, the blowers, the pump and the cabinet; the flow switch             |
| PL-07 | `heat-side`           | `plant-room` | exchanger, pump, meter, vessel, risers, boiler in parallel, trench, school, house; where each temperature is from |
| PL-08 | `energy-balance`      | `silo`       | the 217 MWh of a full charge and a year's electricity as Sankeys; a capacity against the power, the maker's line  |
| PL-09 | `assembly-sequence`   | `silo`       | the silo exploded, numbered by the assembly guide; the twenty steps with their place and origin                   |
| PL-10 | `scale-comparison`    | `site`       | two drums and four silos at one scale; what each quotes against the model on one rule                             |

## Marks

No mark: given by a source. `†`: derived from reported figures. `*`: an estimate. The legend is on the sheets that carry dimensions. **A model result carries no mark: it sits under a red box that says MODEL RESULT, not a measurement, and is written in red where it stands alone.** The panel of the simulation uses `†` for a model result: `docs/data.md` flags the difference.

« Reconstruction » is said by the title block (`configureDrawings` in `src/drawings/index.ts`) and nowhere else on a sheet. The kit's default red line, « à vérifier avant fabrication », would suggest the opposite of what these sheets are.

## Scope

`PLAN_GROUPS` in `src/drawings/index.ts` is what `plans.groups` in `src/lab.ts` needs: the sheets group by `site`, `silo`, `pipe-cell`, `plant-room`, `model`. `model.ts` runs the simulation on first use and caches it: PL-03, PL-05, PL-08 and PL-10 cost a few hundred milliseconds once.

## Tests

`src/drawings/drawings.test.ts`: the contract, a render in both languages with no NaN and no French left in English, the marks, every printed number from a known source, the sheets' model results against `src/data/figures.ts`.
