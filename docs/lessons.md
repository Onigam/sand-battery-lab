# Lessons of the Sand Battery lab

Six lessons, two questions each, every one opening on a scenario of the simulation (`src/data/lessons.ts`). The heart is the fourth: a capacity only means something at a given power.

| #   | id                        | Title                                       | Opens on                                | What it must leave                                                                                                     |
| --- | ------------------------- | ------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | `heat-in-stone`           | De la chaleur dans une pierre               | `soapstone-vs-sand`, `silo`, bed        | E = m·c·ΔT, c is a curve, soapstone's held at 1.0 (an assumption), 2.3 against 2.5 times, stone against water          |
| 2   | `the-gradient`            | Une chaleur qui se traîne                   | `core-first`, `silo`, pipe field        | no convection, a metre in 8 days (7.4 in the model), why so many pipes, the core first, a field flatter than published |
| 3   | `surface-and-volume`      | La surface et le volume                     | `scale`, `silo`, wall insulation        | A/V, the half-life bracketed, 75 and 84 % by size, the two drums: a few hours, not a winter                            |
| 4   | `air-carries-the-power`   | Une capacité n'a de sens qu'à une puissance | `winter-week`, `plant-room`, the blower | Q = ṁ·cₚ·ΔT, the floor, 69 + 105 + 43 = 217 MWh, the same silo at four powers, the unknown blower, 46 to 132 MWh       |
| 5   | `the-cheap-hours`         | À vous de jouer                             | `negative-weekend`, `plant-room`        | the game; the final stock counts; the boiler sets the threshold; 63 % on the drawn week, 71 to 81 % on a real year     |
| 6   | `heat-is-not-electricity` | De la chaleur, pas de l'électricité         | `windless-days`, `site`, the boiler     | 30 to 35 % back to electricity, a fair comparison, when it is the wrong answer                                         |

## The game

Lesson 5 is written around the game as it stands: **blocks of three hours** in the simulation panel, section « À vous de jouer : peignez vos heures », and it says these blocks are a stopgap. When the kit's timeline widget arrives (`docs/kit-requests.md`, request 1), only that sentence of the lesson changes.

## What the lessons say about the model

69 MWh is never said to be measured, 100 MWh never said to be the model's. The lessons use no second « no independent measurement »: it is said once, on the heat meter's sheet. Heat pump: no figure, an order of magnitude with its tag, since the research gives none.

## Tests

`src/data/data.test.ts` (the visitor texts' rules hold on the lessons) and `src/data/lessons.test.ts`: six lessons, two questions each, three choices at least, the answer in range and not always the same, every scenario, world and part real, the heart of lesson 4, the game of lesson 5.
