# Physics of the Sand Battery lab

The simulation in `src/sim` (pure TypeScript, no DOM, no three.js, runs in Node under vitest). It models the class of machine of the Pornainen plant (research §0.1): a bed of crushed stone in an insulated silo, buried pipes, closed air loops, an electric air heater, an air-to-water exchanger, a village's heating network, an hourly price of electricity.

The heat out, the usable capacity, the efficiency, the losses and the charging time are **outcomes** of these equations, not curves drawn.

**Nothing is tuned to a reported figure.** No independent measurement of a real silo exists: every efficiency comes from the maker or its customers, and they disagree. Where the model and a source differ, §5 says so and why, and §6 says how little a match proves, since most inputs are estimates.

Words used for a number: **reported** (a source of `docs/research.md`, K or S number), **derived** (computed from reported figures, the computation is next to it), **estimate** (the sources are silent: a choice with its reason), **model** (an output of this simulation). In the data shown to a visitor `†` marks a model result and `*` an estimate.

## What the model finds: the short version

| Question                                                            | Answer of the model                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Which efficiency does it land on?                                   | **About 91 % over a year** (88 to 93 % across the estimates), at the top of what is reported (about 80 %, above 85 %, 85 to 90 %). **84 %** for a single cycle at full power with a day of rest each way, **74 %** with a week of rest. Both are closer to a ceiling than a prediction: the model has no air leak, no real thermal bridge, no fouling, no commissioning. See §5.3                                                                                                                                                    |
| Why is 100 MWh only 46 % of the heat?                               | **Because a capacity needs a power, and a heat needs a temperature.** Of the 217 MWh above ambient at full: 42 MWh sit below the 85 °C of the supply and can never come out (the second law); the rest comes out at a power that falls as the stone cools. At 1 MW the model gives **32 % (69 MWh)**, at winter demand **56 %**, at summer demand **74 %**, and **80 %** if the power may fall to nothing. The reported 46 % sits inside that range. It would be reached at 1 MW with blowers about 1.7 times the estimate. See §5.1 |
| Why does Vääksy store 2.5 times the energy at nearly the same size? | **Largely found: the model gives 2.3.** Mass ×1.2, a top 100 K higher above the same floor ×1.8, sand's c(T) ×1.07. The usable swing is what scales, and it starts from a floor set by the air, not from ambient, so 100 K more on top is a large gain. **Its absolute figures are not retrieved** (69 and 160 MWh against 100 and 250). See §5.2                                                                                                                                                                                    |

The first sentence the owner should weigh: **the size of the blowers is unknown, and it weighs more than anything else in this model** (§6). The maker could answer it in one line.

## 1. The model

All SI, temperatures in °C. Files: `silo.ts` (every constant, its tag), `plant.ts` (the plant at one instant and one step), `operate.ts` (when to charge), `week.ts` (the prices, the demand, the weather), `runs.ts` (long runs), `presets.ts`, `types.ts`, `engine.ts` (`SandSim implements LabSim`), `texts.ts`. The two reusable cores: `thermal/` (§2) and `market/` (§3).

### 1.1 The bed

An axisymmetric grid (r, z) of **10 rings × 6 layers**. The state of each cell is its **enthalpy**, so energy is conserved while c changes with T. T comes from h(T). Conduction between cells uses k(T), with the exact logarithmic conductance of a ring.

- **There is no convection in a bed.** Its « stratification » is a radial and axial gradient kept by slow conduction and by the order of charge. It is unlike a water tank: the next labs must not read one for the other (`thermal/stratify.ts` holds what a fluid tank needs, and this lab does not use it).
- Step: at most 30 min in the live engine, 1 h in the runs. Conduction is stable far beyond that here (the network takes substeps when it is not, for the drums). Doubling the grid moves the usable heat by under 5 %, a step of 15 min by under 3 % (tested).
- Cost: **about 60 µs a step**, on this machine. At a week per second the engine takes 5 to 6 steps a frame.

### 1.2 The media

| Medium            | ρ, kg/m³ | c(T)                                                                                                                                                                   | k(T)                                                                                                                                                                      | Tag                                      |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Quartz sand       | 1,425    | Measured, J/kg·K: 776 at 60 °C, 827, 936, 1,009, 1,072, 1,133 at 500 °C (Juul 2023), 1,187 at 600 °C (Baumann & Zunft 2015, another sand); straight between and beyond | 0.218 at 25 °C, 0.451 at 500 °C, straight                                                                                                                                 | reported, measured                       |
| Crushed soapstone | 2,165    | **1,000, constant**: an unreferenced value from a heater maker (0.98 to 1.0); its change with temperature is unknown                                                   | **0.7, constant**: estimate (0.5 to 1.0); no measurement of a bed; one source says bulk k barely depends on the solid, the maker that soapstone conducts faster than sand | ρ derived; c reported weakly; k estimate |

The real swing does need c(T): for sand, 0.8 kJ/kg·K would understate 100 to 500 °C by 20 %. For soapstone we do not have the curve. With the shape of sand, scaled to the same mean, the heat above ambient at 400 °C falls from 217 to 200 MWh and the usable heat rises from 69 to 71 MWh: the share goes from 32 to 36 %, because the swing sits where c is high.

### 1.3 The pipes

Subgrid: no cell resolves a pipe. In each cell, from the pipe wall to the stone's mean temperature, the quasi-steady conductance per metre of leg:

```text
g_stone = 2π k / B,   B = ln(R/r)/(1 − x²)² − (3 − x²)/(4(1 − x²)),   x = r/R,   πR² = pitch²
```

Research §5.2 quotes the familiar limit ln(R/r) − 3/4, which is **10 % off** at R/r = 5.6, so the exact form is used (tested against a fine radial integration). In series with the air film `g_film = h π D_i`, h from Gnielinski's correlation at the air speed in the pipe. Air paths: as many in parallel as keep about 15 m/s at full flow in a warm pipe, with at most 10 legs in series (the rule gives 68 paths of 9 legs here).

The time constant of the cell is about **36 h**: short against a 100 h charge, long against a burst of cheap hours. In a burst the stone next to the pipe runs hotter than the cell's mean, which this model does not resolve. Research §5.2 proposed splitting each cell if bursts looked too fast. They do not: at 1 MW the quasi-steady drop is about 66 K, and the true conductance in a short burst is higher, so the model errs on the safe side for power. It stays a limit (§7). `SandSim.getPipeProfile` gives the fine profile around a pipe for the magnified world, consistent with the conductance.

### 1.4 The air

The air holds next to no heat, so each loop is a steady state on the present temperatures of the stone. Marching through a cell: `T_out = T_cell + (T_in − T_cell) exp(−G/(ṁ c_p))`, down the layers and back up, for each open ring, the flow split by pipe count. The march is linear in the inlet, `T_out = A + B·T_in`, so a closed loop is solved in one pass.

- **Blowers:** volume at the blower's inlet, `P = V̇ Δp / η`, Δp from the pipes (Petukhov, Darcy-Weisbach, bends) plus 20 velocity heads of the main duct for the rest of the loop. Limits: 5 m³/s per MW, 5 kPa. Their heat goes into the air, their motor's losses to the room.
- **Charge:** heater to the air limit (500 °C), through the ducts into the bed, back through the blower. The flow is what makes the heater take the power offered, up to the blower's limit. **The return air is hot, so near full the blower moves little mass and the power falls by itself.** The blower is assumed on the return side, upstream of the resistors (a fan after them would see 500 °C).
- **Discharge:** bed, ducts, counterflow exchanger by ε-NTU, back through the blower. UA of the exchanger is sized for its power at the design point (60 °C of air out, 15 K above the return water): **16 kW/K per MW**, following the air flow to the power 0.6. The water flow is free, so that the water leaves at its supply temperature; if the heat cannot do that at the highest flow, the heat falls until it can.
- **Ducts:** 15 W/K per loop at 1 MW, only while flowing (about 15 m at about 1 W/m·K).
- **The usable capacity** is not an input. It is what comes out until the highest flow can no longer hold the demand.

In closed form, for an even bed, the floor of a power P, with C = ṁ_max c_p, ε the bed's effectiveness and T_cold the air leaving the exchanger:

```text
T_floor ≈ T_cold + P / (ε C)        (1 MW: 60 + 1e6 / (0.87 × 5,400) ≈ 272 °C; the model's bisection gives 275 °C)
```

### 1.5 The zones

Three zones with outer radii 0.6, 0.8 and 1 of R (36, 28 and 36 % of the pipes, estimate). **Reported as a principle** (core charged first, discharged from the outside); the radii are ours.

- **Discharge** tries sets of zones from the coolest stone: outer, outer + middle, middle, all, middle + core, core. The first that holds the demand runs; none does, the best one runs at falling power.
- **Charge** tries core, core + middle, middle, all, middle + outer, outer. It stays on a set while that set takes at least half of what is offered (estimate), then moves on. A zone over the core limit closes.
- **At the same time on different zones: an assumption.** Each zone can connect to either header. The pilot swapped one loop with valves, but a network with no interruption cannot wait for a charge to end. If the maker contradicts this, one blower goes away. When the heat needs every zone and a charge is on offer, the heat keeps priority on the zones it needs and one is left for the charge.

### 1.6 The walls

Each boundary cell loses through its half-cell, then a series `U = 1/(t/λ + 1/h_out)` on the side and the top, `1/(t/λ)` to the ground. Insulation: wall 0.45 m, top 1.0 m, base 0.5 m, λ = 0.1 W/m·K, h_out = 10 W/m²·K, ground 8 °C (all estimates; the wall is capped by the reported 0.5 m of build-up). The pipes cross the top insulation: each leg is a bridge of steel, about 10 W/K in all, against 103 W/K for the rest of the silo.

### 1.7 Electricity

Heater η = 1 into the air. In front of it and the blowers: a low-voltage riser (`cableResistance` from the kit; 1,443 A), a transformer at 99 % (usual), controls and ventilation at 2 kW per MW (estimate), a pump at 150 kPa. Round-trip efficiency = heat sold / all the electricity at the meter, with what the stone gained or lost over the period taken off.

### 1.8 The clock, the prices, the demand

- **Prices:** a week drawn by hand, labelled so everywhere, span 3 to 373 €/MWh (reported for a real week), mean 60 €/MWh. Two variants: no wind (nothing under 70), a negative weekend.
- **Demand:** derived from the maker's « a week of winter, almost a month of summer »: 595 and 139 kW, a cosine between them, times a drawn daily shape. 3.2 GWh a year. Scaled by the rated power on the other silos.
- **Boiler:** whatever the stone cannot give, at 45 €/MWh (estimate, no source).
- **Rules:** always, under a price, the optimiser, painted hours, the solar overflow, never.
- **Fast clock:** the blowers run up and down (12 s) and the heating element follows (1,000 kg·500 J/kg·K per MW) in real seconds, so a failure can be watched. Flow under 30 % of what the heater needs trips it. At high speed they are at their final value.

## 2. The thermal core (`src/sim/thermal/`)

Self-contained, pure, no import from the lab or the kit, no lab-specific name (a test holds both). It stays here until its second user, then moves to `@onigam/lab-kit/sim/thermal` unchanged.

| File          | Interface                                                                                                                                                                                                                                                                                                                     | For                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `material.ts` | `Material { rho, c(T), h(T), Tof(h), k(T) }`, `makeMaterial`, `constantMaterial`, `piecewise`; `quartzSand`, `quartzPure`, `crushedSoapstone`, `liquidWater`                                                                                                                                                                  | Any table of a material. Add brick, concrete and wood with the lab that sources them |
| `air.ts`      | `airRho`, `airCp`, `airMu`, `airK`, `airPr`                                                                                                                                                                                                                                                                                   | Any air path                                                                         |
| `network.ts`  | `createNetwork(nodes, links)`, `stepNetwork(net, dt)` (stable substeps), `stableStep`, `setNodeTemperature`, `setLinkConductance`, `updateConductances`, `totalEnthalpy`, `totalBoundaryEnergy`. Nodes: mass of a material, plain capacity, or fixed. Links: a fixed G in series with k(T) paths. `net.Q[i]`: heat applied, W | The RC core: poêle, chauffe-eau, house, gasifier                                     |
| `grid.ts`     | `buildGrid({ geometry: 'rz' \| 'xy', xEdges, yEdges, material, T })`, gives nodes, links, `id(i, j)`, `faces(side)`; `uniformEdges`                                                                                                                                                                                           | A massive body: the stove's mass, a wall                                             |
| `exchange.ts` | `seriesU`, `surfaceLoss`, `flowHeat`, `effectiveness(UA, Cmin, Cmax, 'counter' \| 'parallel' \| 'cross')`, `fluidLine`, `marchFluid`, `pipeCellConductance`, `pipeCellFactor`, `pipeCellTime`, `pipeCellShape`, `pitchRadius`, `tubeFlow`, `tubePressureDrop`                                                                 | Insulation, exchangers, a fluid through a mass, floor loops, flues                   |
| `stratify.ts` | `buoyancyMix(T, w)`: layers of a **fluid** column made stable, energy kept                                                                                                                                                                                                                                                    | The chauffe-eau. **Not used here**: a bed does not convect                           |

Functions change only what is passed to them, in place and without allocating in the hot path. Tested against closed forms: a two-node exponential, a slab's series solution, a cylinder's first mode (5.783 α/R²), textbook ε-NTU values, a fine radial integration of the pipe cell, energy to rounding with c and k changing. Left out on purpose, added by the lab that needs them: `stackDraft`, `solarGain`.

## 3. The market core (`src/sim/market/`)

Genuinely needed here, for the game's opponent. `solveDispatch(problem)`: backward induction on a grid of levels with the value read between them, a charging limit that may depend on the level, a loss, a backup price, a terminal value. `planCost`, `chargeDiscount`. Tested against every possible plan on a small problem. Generic and free of lab names; the gravity battery may want it, the lead decides.

**The game's opponent** (`gamePlan`) is the optimiser on a tank model, whose plan runs through the full model, against plain price thresholds run the same way, and the cheapest wins. It matters: on the drawn winter week a threshold of 40 €/MWh beats the tank's plan by about 1 %, because the boiler at 45 €/MWh makes that threshold nearly the economic answer. The visitor can still beat it by a little, which the panel says.

The kit has no widget to paint hours (`docs/kit-requests.md`). Until it does, the panel paints blocks of three hours with the kit's chips; the engine takes a plan of 168 booleans, so the real widget replaces only that part.

## 4. Scale presets

Simulation only: the 3D draws one silo, `state.onDrawnSilo` says when the section applies.

| Preset                | Bed                                                    | Mass    | Rated, charge  | Full mean | Air    | Tag                                                                                                      |
| --------------------- | ------------------------------------------------------ | ------- | -------------- | --------- | ------ | -------------------------------------------------------------------------------------------------------- |
| `pornainen-soapstone` | 14 × 6 m                                               | 2,000 t | 1 MW, 1 MW     | 400 °C    | 500 °C | reported; charge power estimate; air reported, to check                                                  |
| `same-silo-sand`      | 14 × 6 m                                               | 1,316 t | 1 MW, 1 MW     | 400 °C    | 500 °C | the same volume, sand's density                                                                          |
| `kankaanpaa`          | 4 × 6.4 m (80 m³)                                      | 114 t   | 200 kW, 200 kW | 340 °C    | 550 °C | reported size; mean derived from core 500 °C, edge 175 °C (a parabola); insulation 0.3 m estimate        |
| `vaaksy`              | 14 × 10.9 m                                            | 2,400 t | 2 MW, 3 MW     | 500 °C    | 650 °C | reported mass, power, « above 500 °C »; bed height derived; air estimate, the top of the maker's section |
| `two-drums`           | 0.46 × 2.41 m (same volume and A/V as two 200 L drums) | 571 kg  | 5 kW, 5 kW     | 310 °C    | 400 °C | derived, estimates; not a design                                                                         |

The other silos' pipes come from one rule: **the same stone drop as Pornainen at their own power** (66 K). Same blower rule, 5 m³/s per MW of each loop. No silo gets its own tuning.

## 5. Figures retrieved and not retrieved

### 5.1 K4 and K32: 100 MWh, 46 % of the heat

**Reported:** up to 100 MWh, 2,000 t, mean 400 °C at full, so 217 MWh above 10 °C: 46 %. **Not retrieved at 1 MW: the model gives 69 MWh.**

Where the 217 MWh of a full charge go in the model:

| Part                               | MWh            | Why                                                                                                 |
| ---------------------------------- | -------------- | --------------------------------------------------------------------------------------------------- |
| Given at the rated 1 MW            | **69** (32 %)  | Down to a mean of about 275 °C, the floor of §1.4                                                   |
| Given afterwards, at falling power | **105** (48 %) | Stops when the exchanger can no longer bring the water to 85 °C                                     |
| Stays in the stone                 | **43** (20 %)  | Below about the 85 °C of the supply: 2,000 t × 1 kJ/kg·K × 75 K = 42 MWh, no blower can change that |

The same full silo against the power asked, nothing else changing (`capacityRun`):

| Power            | Usable, MWh | Share of the heat | Lasts    | Mean at the end |
| ---------------- | ----------- | ----------------- | -------- | --------------- |
| 1,000 kW (rated) | 69          | 32 %              | 69 h     | 274 °C          |
| 800 kW           | 93          | 43 %              | 116 h    | 230 °C          |
| 595 kW (winter)  | 122         | 56 %              | 8.5 days | 175 °C          |
| 139 kW (summer)  | 160         | 74 %              | 48 days  | 81 °C           |

So **46 % is what you get near 750 kW in this model, or at 1 MW with blowers 1.7 times larger.** The model cannot tell which. What it can say: a capacity without a power means little; the maker's « about a week of winter demand » reads about right (8.5 days); its « almost a month of summer » reads short (48 days, walls included); and none of this says that 100 MWh is the physical limit. Plausible range at 1 MW across the estimates of §6: **46 to 132 MWh**.

Also not found: the ratio of charge. S17's « about 100 hours » is 183 h here from floor to full at 1 MW offered (it is 120 h at 600 °C of air, 124 h at 1.5 MW): the air loop limits the top of the charge, and the power falls to about a third at full.

### 5.2 K23 and K31: Vääksy, 2.5 times at nearly the same size

**Found, in the ratio:** 160 / 69 = **2.3** against the reported 2.5. **Not retrieved in absolute terms:** 160 MWh against 250. Same physics, same blower rule, same floor (270 and 275 °C):

| Step, with the floor of 275 °C        | MWh | Factor                                    |
| ------------------------------------- | --- | ----------------------------------------- |
| Pornainen, 2,000 t, soapstone, 400 °C | 69  |                                           |
| 2,400 t                               | 83  | ×1.20, the mass                           |
| Mean 500 °C instead of 400 °C         | 150 | ×1.80, the top: (500 − 275) / (400 − 275) |
| Sand's c(T) instead of 1.0            | 160 | ×1.07                                     |

Three things to read in this:

- **Mass and c explain little. The swing explains most**, and only because it starts from a floor set by the air. On the K31 reading (ΔT = E/mc) the swing doubles from 180 to 375 K; the model's says the top alone can do most of that.
- **« Nearly the same size » is an outside dimension.** Inside, Vääksy's bed is 1,684 m³ against 924 m³ (a third lighter sand, no equipment floor above the stone).
- **The ratio moves with the floor.** With blowers of 10 m³/s per MW on both, 105 and 208 MWh, ratio 2.0. To print 250 MWh Vääksy would need both a bigger blower and a mean of about 560 °C (254 MWh), which « above 500 °C » allows. A coherent reading is therefore: blowers near 9 m³/s per MW, the same floor near 220 °C for both, Vääksy's mean near 560 °C. **That is a reading, not a finding; no source gives any of the three.**

**Why Pornainen stops at a mean of 400 °C** when the same machine at 500 °C and 650 °C of air would give 123 MWh is not something this model can say: a limit of its air, its steel or its stone, or a prudent first plant. From memory and not verified, soapstone holds magnesite, which breaks down at a few hundred degrees: worth asking the maker, and not to be quoted before that.

### 5.3 K10, K11, K22, K25: efficiency

No independent measurement. **What the model lands on, and why:**

| Case                                               | Model                                                        | Reported, all from the maker or its customers                                                       |
| -------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Pornainen, a year, 40 €/MWh rule                   | **91 %** (walls 4.6 %, circulation 4.3 % of the electricity) | about 80 % (undated), above 85 % (first year, method not stated), « tested » about 85 %, 80 to 90 % |
| Pornainen, a year, always charging                 | **90 %** (mean 238 °C instead of 170 °C)                     |                                                                                                     |
| Pornainen, a year, real prices (§5.5)              | **90 %**                                                     |                                                                                                     |
| Pornainen, one rated cycle, a day of rest each way | **84 %** (walls 11.5 %, circulation 4.3 %)                   |                                                                                                     |
| Pornainen, the same, a week of rest                | **74 %**                                                     |                                                                                                     |
| Kankaanpää, one rated cycle, a day of rest         | **75 %** (walls 19 %)                                        | 60 to 75 % overall                                                                                  |
| Kankaanpää, a year, 40 €/MWh rule                  | **87 %**                                                     | 85 % on three-day cycles, partly simulated                                                          |
| Vääksy, a year                                     | **93 %**                                                     | none yet; about 85 % for the 2 MW product, 90 % at 10 MW                                            |

The model **agrees with the maker's split of the losses** (5 % + 5 %, hence 90 %), and on the direction with size. It lands above the operator's « above 85 % » and that is to be expected: **it has none of the losses a plant has and a model does not** (air leaks, real bridges at supports and hatches, ventilation of a hot plant room, fouling, part-load motors, the ramp-ups of a first year). Read 91 % as a ceiling. The 80 % and the 85 % can both be right: their dates, their cycles and their definitions differ, and the table shows how much a cycle's rest alone moves the figure.

### 5.4 Every key figure

`exact`: arithmetic, retrieved. Tests: `src/sim/figures.test.ts`, with the K number in each name, unless noted.

| K   | Reported                                                                    | Model                                                                                                                                                                                              | Status                                                                                                                                                                                                   |
| --- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K1  | 36 % of process heat                                                        | No output of the model                                                                                                                                                                             | Context, no test                                                                                                                                                                                         |
| K2  | 100 Mt CO₂e a year                                                          | No output of the model                                                                                                                                                                             | Context, no test                                                                                                                                                                                         |
| K3  | 1 MW                                                                        | 1 MW held                                                                                                                                                                                          | Retrieved, design point                                                                                                                                                                                  |
| K4  | up to 100 MWh                                                               | 69 MWh at 1 MW, 122 at 595 kW                                                                                                                                                                      | **Not retrieved at rated power**, §5.1                                                                                                                                                                   |
| K5  | 13 × 15 m                                                                   | Input                                                                                                                                                                                              | Retrieved                                                                                                                                                                                                |
| K6  | bed 14 × 6 m                                                                | 924 m³                                                                                                                                                                                             | Retrieved                                                                                                                                                                                                |
| K7  | 2,000 t, 40 trucks                                                          | 50 t a truck, grid 2,000 t                                                                                                                                                                         | Retrieved                                                                                                                                                                                                |
| K8  | about 400 °C mean at full                                                   | Input, reached. Core 417 °C, edge 375 °C                                                                                                                                                           | Retrieved; the field is flatter than the maker's picture: **a mean of 400 °C under 500 °C of air leaves little room for a hot core**. At 650 °C of air: core 516 °C, edge 258 °C                         |
| K9  | half-life about 3 months, the maker's model                                 | 190 days (heat above ambient), 45 days (heat above the rated floor)                                                                                                                                | **Bracketed**: the sentence does not say which energy                                                                                                                                                    |
| K10 | about 80 %, above 85 %, 80 to 90 %                                          | 91 % a year, 84 % a cycle                                                                                                                                                                          | Above; a ceiling, §5.3                                                                                                                                                                                   |
| K11 | about 5 % + typically under 5 %                                             | 4.3 % + 4.6 % over a year; 4.3 % + 11.5 % on a rated cycle                                                                                                                                         | Retrieved over a year, **not on a single cycle**                                                                                                                                                         |
| K12 | a week of winter, nearly a month of summer                                  | 8.5 days, 48 days from full                                                                                                                                                                        | Winter retrieved; summer longer                                                                                                                                                                          |
| K13 | chips −60 %, oil −100 %, CO₂ −160 t, −70 %                                  | Silo gives 63 to 83 % of the heat depending on the rule                                                                                                                                            | Coherent; no CO₂ in the model, no test of it                                                                                                                                                             |
| K14 | charging 70 to 80 % under spot                                              | 63 % on the drawn week. **Real year: 71 to 81 %**, §5.5                                                                                                                                            | Retrieved offline with a price rule                                                                                                                                                                      |
| K15 | 3 to 373 €/MWh                                                              | The span of the drawn week                                                                                                                                                                         | Exact, drawn to it, labelled so                                                                                                                                                                          |
| K16 | unknown, estimate 1 MW                                                      | Input. 183 h from floor to full against « about 100 hours »                                                                                                                                        | **Not retrieved**, §5.1                                                                                                                                                                                  |
| K17 | unknown; about 3,000 MWh, 30 cycles (S20, to check)                         | 2.6 GWh under a price rule, 3.2 GWh if never refusing; 38 times the rated-power capacity, 26 times 100 MWh                                                                                         | Same order; S20 not confirmed                                                                                                                                                                            |
| K18 | the build                                                                   | No output of the model                                                                                                                                                                             | Context, guides                                                                                                                                                                                          |
| K19 | reserve markets                                                             | A scenario: the heater sheds at once, the heat does not move. No revenue                                                                                                                           | Behaviour only, `engine.test.ts`                                                                                                                                                                         |
| K20 | 30+ years, 20 to 200 cycles                                                 | No wear in the model                                                                                                                                                                               | Context, sheets                                                                                                                                                                                          |
| K21 | 20 kW, 3 MWh, 42 t                                                          | 257 kJ/kg                                                                                                                                                                                          | Exact                                                                                                                                                                                                    |
| K22 | 8 MWh, 200 kW, core 500 °C, edge 150 to 200 °C, 60 to 75 %                  | 2.2 MWh at 200 kW, 5.5 MWh at 100 kW, 7.4 MWh in all at falling power; core 404 °C, edge 247 °C; 75 %                                                                                              | Efficiency **retrieved**, capacity **not** at 200 kW, near at 100 kW and falling power. Field flatter: with the charge kept on the core (spill 15 %) core 497 °C, edge 145 °C, which brackets the report |
| K23 | 2 MW, 250 MWh                                                               | 160 MWh                                                                                                                                                                                            | **Ratio found, absolute not**, §5.2                                                                                                                                                                      |
| K24 | 2 MW, 3 MW of charge, 2,400 t                                               | Inputs                                                                                                                                                                                             | Retrieved                                                                                                                                                                                                |
| K25 | larger is better, 85 to 95 %                                                | 75 %, 84 %, 91 % on the same cycle by size                                                                                                                                                         | Direction retrieved                                                                                                                                                                                      |
| K26 | c(T) of sand; means 999 and 1,045                                           | The table, the means                                                                                                                                                                               | Exact                                                                                                                                                                                                    |
| K27 | inversion at 573 °C                                                         | An alarm on sand                                                                                                                                                                                   | Retrieved                                                                                                                                                                                                |
| K28 | k of sand, 1,425 kg/m³                                                      | The table                                                                                                                                                                                          | Exact                                                                                                                                                                                                    |
| K29 | soapstone 3,140 solid; c about 1.0; k unknown                               | 2,165 bulk, porosity 0.31                                                                                                                                                                          | Derived, estimates                                                                                                                                                                                       |
| K30 | 1 m of sand, far face at 100 °C in a little over 8 days                     | **7.4 days** with measured c(T) and k(T)                                                                                                                                                           | Near; k(T) is higher than the research's 0.30 once warm                                                                                                                                                  |
| K31 | 257, 288, 180, 375 kJ/kg                                                    | Same                                                                                                                                                                                               | Exact                                                                                                                                                                                                    |
| K32 | 46 %                                                                        | 32 %, 56 %, 74 %, 80 % by power                                                                                                                                                                    | **Found why**, §5.1                                                                                                                                                                                      |
| K33 | 108, 156, 58 kWh/m³                                                         | Same                                                                                                                                                                                               | Exact                                                                                                                                                                                                    |
| K34 | 3.2 kg/s, 20 to 34 kW, 2 to 3.4 %                                           | 5.3 kg/s at the blower's limit; 11 to 25 kW at 1 MW, 2.3 to 3.4 kPa                                                                                                                                | Retrieved. **But 300 K of air cannot hold 1 MW to a mean of 220 °C**, this estimate is what limits K4                                                                                                    |
| K35 | 1,443 A                                                                     | Same                                                                                                                                                                                               | Exact                                                                                                                                                                                                    |
| K36 | 139, 595 kW, 3.2 GWh, 32 cycles                                             | Same                                                                                                                                                                                               | Exact                                                                                                                                                                                                    |
| K37 | 17 to 28 kW, 70 kW lumped; 6 to 19 % a year                                 | 38 kW when full (its edge is at 375 °C, not 150 to 250 °C), about 15 kW over a year, 4.6 %                                                                                                         | Above when full, below over a year: **the silo spends much of the year far from full**                                                                                                                   |
| K38 | A/V 9.5, 5.6, 1.3, 0.62; two drums about 48 kWh, half a day of a 5 kW house | Same A/V. 41 kWh at full (the charge levels off at a mean of 303 °C, its walls take the rest), **under 1 kWh at a full 5 kW, 14 kWh at 2.5 kW, about 25 kWh at falling power; half-life 1.3 days** | A/V exact; the drums do far worse than the arithmetic: 5 hours of a 5 kW house at best, and their blower rule is the same as a plant's                                                                   |
| K39 | cold to the touch, about 4 K                                                | About 8 K over the air at full, 76 W/m²                                                                                                                                                            | Same order                                                                                                                                                                                               |
| K40 | 30 to 35 % back to electricity                                              | No output: the model returns heat                                                                                                                                                                  | Context, lesson                                                                                                                                                                                          |
| K41 | 5 cm                                                                        | Same                                                                                                                                                                                               | Exact                                                                                                                                                                                                    |
| K42 | pitch 0.5 m: 600 legs, 3.7 km, about 93 K; 1 m is too coarse                | 616 legs, 3.7 km, 66 K in the stone (the −3/4 and the exact factor) plus the film; pitch 1 m cannot hold 1 MW at 400 °C                                                                            | Retrieved                                                                                                                                                                                                |
| K43 | not disclosed                                                               | No cost of the plant                                                                                                                                                                               | Context                                                                                                                                                                                                  |
| K44 | about 500 °C of air, to check                                               | Input                                                                                                                                                                                              | The charging time depends on it heavily: 515 h at 400 °C, 183 h at 500 °C, 120 h at 600 °C                                                                                                               |

### 5.5 The offline check of K14, on a real year

As research Q7 proposed: once, offline, no price data in the repository. The Finnish day-ahead prices from 1 July 2025 to 30 June 2026 (the plant's first year), read from the public `sahkotin.fi` API, 8,760 hours, mean **70.9 €/MWh**, from −12 to 770. Pornainen under a price rule, K36's demand:

| Charge under | Paid     | Under the mean | Heat     | From the stone | Efficiency |
| ------------ | -------- | -------------- | -------- | -------------- | ---------- |
| 25 €/MWh     | 12 €/MWh | 83 %           | 1.92 GWh | 60 %           | 90 %       |
| 30 €/MWh     | 14 €/MWh | 81 %           | 2.01 GWh | 63 %           | 90 %       |
| 40 €/MWh     | 17 €/MWh | **75 %**       | 2.19 GWh | 68 %           | 90 %       |
| 50 €/MWh     | 21 €/MWh | **71 %**       | 2.28 GWh | 71 %           | 90 %       |

**Retrieved: 70 to 80 % under the spot average is what a simple rule at 30 to 50 €/MWh gives.** The rule needs no foresight and is not tuned to this. It also ties K14 to K13: buying that cheaply leaves about a third of the heat to the boiler, which is coherent with chips falling by 60 % rather than disappearing. The drawn week reads lower (63 to 66 %) because it is a hard winter week with a 1 MW heater against 595 kW of demand.

## 6. How little a match proves: the sensitivity table

Pornainen, one change at a time. The efficiency is a year under the 40 €/MWh rule.

| Change                                          | Tag of the input   | Usable at 1 MW, MWh | Share of 217 MWh | Floor, °C | Charge, h | Loss when full, kW | Half-life, days (heat / usable) | Efficiency |
| ----------------------------------------------- | ------------------ | ------------------- | ---------------- | --------- | --------- | ------------------ | ------------------------------- | ---------- |
| **Default**                                     |                    | **69**              | **32 %**         | **275**   | **183**   | **38**             | **190 / 45**                    | **91 %**   |
| Blower 2.5 m³/s/MW                              | estimate           | 0                   | 0 %              | 436       | 13        | 39                 | 188 / 0                         | 90 %       |
| Blower 7.5                                      |                    | 94                  | 43 %             | 230       | 168       | 37                 | 192 / 65                        | 92 %       |
| Blower 10                                       |                    | 105                 | 48 %             | 210       | 162       | 36                 | 194 / 75                        | 92 %       |
| Blower 15                                       |                    | 116                 | 53 %             | 191       | 159       | 35                 | 195 / 86                        | 92 %       |
| Blower 30                                       |                    | 132                 | 61 %             | 167       | 154       | 35                 | 197 / 99                        | 90 %       |
| Pitch 0.4 m                                     | estimate           | 85                  | 39 %             | 254       | 205       | 41                 | 181 / 50                        | 92 %       |
| Pitch 0.6 m                                     |                    | 46                  | 21 %             | 318       | 157       | 36                 | 196 / 29                        | 90 %       |
| Bed k 0.5 W/m·K                                 | estimate           | 59                  | 27 %             | 295       | 171       | 36                 | 207 / 39                        | 91 %       |
| Bed k 1.0 W/m·K                                 |                    | 76                  | 35 %             | 262       | 190       | 39                 | 177 / 47                        | 92 %       |
| Soapstone c 900 J/kg·K                          | weak               | 62                  | 32 % of 195      | 275       |           |                    |                                 |            |
| Soapstone c 1,100                               |                    | 76                  | 32 % of 238      | 275       |           |                    |                                 |            |
| Soapstone c(T) shaped like sand                 | unknown            | 71                  | 36 % of 200      | 275       |           |                    |                                 |            |
| Insulation 0.225 m                              | estimate           | 67                  | 31 %             | 275       | 196       | 67                 | 116 / 26                        | 88 %       |
| Insulation 1 m (does not fit the reported size) |                    | 70                  | 32 %             | 275       | 174       | 18                 | 366 / 90                        | 93 %       |
| λ 0.05 W/m·K                                    | estimate           | 70                  | 32 %             | 275       | 176       | 22                 | 310 / 76                        | 93 %       |
| λ 0.2 W/m·K                                     |                    | 68                  | 31 %             | 275       | 196       | 64                 | 121 / 27                        | 88 %       |
| Air 400 °C (mean stops at 374 °C)               | reported, to check | 56                  | 27 %             | 275       | 515       | 36                 | 189 / 38                        | 91 %       |
| Air 600 °C                                      |                    | 70                  | 32 %             | 275       | 120       | 34                 | 199 / 49                        | 91 %       |
| Air 650 °C                                      |                    | 74                  | 34 %             | 275       | 119       | 32                 | 203 / 51                        | 91 %       |
| Charge 1.5 MW                                   | estimate           | 69                  | 32 %             | 275       | 124       | 37                 | 191 / 45                        | 91 %       |
| Mean 500 °C, air 650 °C                         |                    | 123                 | 45 %             | 275       | 228       | 46                 | 193 / 70                        | 91 %       |
| Same silo, sand                                 |                    | 30                  | 23 % of 131      | 323       | 103       | 35                 | 135 / 20                        | 90 %       |
| Same silo, sand, pitch 0.35 m                   |                    | 55                  | 42 %             | 261       | 136       | 39                 | 123 / 35                        | 92 %       |

Reading: **the efficiency is the safest figure of the model** (88 to 93 %), **the capacity at rated power the least safe** (0 to 132 MWh), and the half-life of usable heat follows the capacity. The blower and the pitch weigh most, and neither is published. A match on K4 would prove nothing: a blower of about 8.5 m³/s per MW prints 100 MWh, and it was not set.

## 7. Assumptions and limits

**To confirm, by weight:**

1. **Blowers of 5 m³/s per MW**, 5 kPa, on the return side: from the research's K34, itself resting on 300 K of air. Decides K4. Ask the maker.
2. **Pipes**: 0.5 m of pitch, 50 mm of radius, 3 mm of wall, 9 legs on a path. Ours, sized by the physics. The maker keeps its layout secret.
3. **Soapstone bed**: k = 0.7 W/m·K, c = 1.0 constant, no measurement of a bed.
4. **Charge and discharge at once**, on different zones. An assumption the network's 100 % reliability pushes towards.
5. **Charging power 1 MW** (a secondary source that may only restate the capacity); **air at 500 °C** (a documentary's automatic transcription, to check).
6. **Insulation**: 0.45 / 1.0 / 0.5 m at λ = 0.1 W/m·K. The wall is a ceiling from the reported dimensions.
7. **Supply 85 °C, return 45 °C**: the supply from a sister plant, the return from other networks. Pornainen's are unpublished. At 100 / 60 °C the floor rises by 21 K.
8. **Demand**: derived from the maker's own sentence, so K12 and K36 are one figure twice.
9. **Boiler at 45 €/MWh**, no taxes or grid fees on the electricity: only the spot price counts. The game's verdict moves with these.
10. **Equipment floor inside the silo** (research Q3): only matters through the duct length.

**Limits of the model.** No moisture and no latent heat in the first heating (the scenario's ramp is drawn, the rate is not published). The cell is lumped around its pipes: under a day and a half, the stone next to a pipe runs hotter than the cell's mean, unresolved. Pipes reach the wall (the maker may keep them off it, which would cool the edge). No air leak, no real bridge beyond the pipes through the top. Ground at a fixed temperature, no thermal mass in the insulation or the shell: the first days of a cold silo lose less than this says. Insulation's λ is one value, while a real one rises with temperature. A linear heat loss in ducts. No wear, no sintering, no quartz damage: 573 °C is an alarm, not a model. The optimiser plans on a tank. The zones' order of charge is a rule, not a controller's optimum: the 50 % spill is a choice, and the field at full moves with it (core 417 °C at 50 %, 476 °C at 15 %, for the same usable heat within 2 %).

## 8. Tests

`npm test`. `src/sim/thermal/thermal.test.ts` (the core, closed forms, its purity), `src/sim/market/market.test.ts` (the optimiser against every plan), `src/sim/figures.test.ts` (a test per key figure; the numbers pinned are what the model gives, not targets), `src/sim/engine.test.ts` (energy to 1e-6, grid and step convergence, cost of a step, zones, the 3D's state, time, presets, ranges, all scenarios and alarms, the game), `src/panels/*.test.ts` (the panel on a stand-in for the DOM; the words: parity, no research code, no number but those listed).

## 9. Sources for what is not in `docs/research.md`

Usual engineering relations, from memory of the standard texts, checked by the tests against closed forms where possible: ε-NTU relations, Petukhov's friction and Gnielinski's correlation, Sutherland's law, the standard air tables, the exact annulus factor of §1.3 (derived here and tested by integration). Usual values, tagged estimates in `silo.ts`: steel conductivity, fan and motor efficiencies, film on the cladding. The real-year prices of §5.5: `sahkotin.fi`, not committed; their licence was not checked, which is why they stay out.
