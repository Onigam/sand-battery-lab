# The village of the `site` world

Generic, at true scale, never the real plot: a Nordic village at the forest's edge. Only the yard's size is reported (about 20 × 30 m, for the maker's 2 MW product). Every dimension is in `SITE` (`src/three/dims.ts`), tagged. No texture file: every map is procedural (`src/three/textures.ts`), no text anywhere, because films are captured with no interface.

## The line of the story, right to left along the road

The medium-voltage line on its poles → the transformer on its pad → the annex at the silo's foot → the cable riser up the wall → the silo → the two water pipes down the wall → the open trench → the school and a house whose cellar is drawn open. The wood-chip boiler (reported, kept as a backup) stands beside the plot, a wind farm on the far ridge, a solar field in a clearing behind.

The silo is turned by `SITE.silo.yawDeg` so that its pipes and its cable face the road. The riser is on the west side and the line comes from the east, so the story reads from right to left. It is the same function as in the `silo` world, moved (`machine.test.ts`).

## What is scenery and what follows the model

| Thing                            | What it reads                                      | Kind                                                                 |
| -------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| Snow on the land, roofs, boughs  | `state.winter`, `snowOf()`                         | decoration of a size set by the model: the amount, not its thickness |
| Birch leaves, thinning then gone | `state.winter`, `leavesOf()`                       | same                                                                 |
| Snow left on the silo's roof     | as everywhere: nothing melts on it                 | follows K39: the outside stays cold                                  |
| Smoke from the stack             | `state.boiler` (none at zero, more as it burns)    | the amount follows the model, the plume is ours                      |
| Turbine rotors                   | `state.price`: cheap hours turn faster             | decoration: the prices are drawn, the wind is not modelled           |
| The sun's height                 | `state.day`, at 60.4° north                        | geometry                                                             |
| The sun's hour                   | held at 14:36 above ×600; within daylight below it | a choice: a day at ×3600 would strobe, and a view is never dark      |
| Flow dots                        | `state.heater`, `state.waterFlow`                  | they run only when the model moves current or water                  |

## The land

One mesh on a graded grid, 170 × 170 cells: about 1.7 m in the middle, about 160 m at the horizon. A flat clearing, low rolling land, a far ridge. Each building, the yard and the trench have a pad: flat to the millimetre (tested), blended into the land by a margin. Grass, gravel, road, dug earth and snow are computed per pixel from the same shapes as `terrainHeight`, so an edge never depends on the grid. The trench and the cellar are exact holes discarded in the shader, their walls built from the same lines.

The forest floor darkens with distance under the canopy (`aForest`, from `forestMask`): from afar a forest reads as a mass, not as cones on snow.

## The plants (instanced, all from unit geometries)

| Species      | Count  | Triangles each | Note                                                                                                         |
| ------------ | ------ | -------------- | ------------------------------------------------------------------------------------------------------------ |
| Spruce, near | ~460   | 504 / 108      | trunk, whorls of drooping boughs with a dark keel; under 150 m full, beyond it fewer boughs and no keel      |
| Young spruce | ~130   | 84             | the forest comes down in steps                                                                               |
| Birch        | ~110   | ~1,000 / ~300  | white bark with lenticels, rising branches, twigs that hang (near only), a broken crown that falls in winter |
| Far forest   | ~3,400 | 12             | two stacked cones                                                                                            |

Every tree stands on `terrainHeight`, off the pads, the road, the line and the trench (tested), and keeps out of the corridor of the home view. Past 130 m (trees) and 150 m (far forest) the many faces blend to one mean colour and one lit surface: that is what stops a forest of dark boughs on white snow from crawling.

## The buildings

Boarded walls in the colours of the country (Falun red, ochre, white, pale grey), sheet roofs that hold the snow, white frames, a stone plinth, a chimney. The school is the same language at school size, with a porch, a flagpole and a bicycle rack. The boiler plant is a clad steel hall with a chip store, an inclined conveyor and a guyed stack. All of them merge by material, so the whole village is about 10 draw calls.
