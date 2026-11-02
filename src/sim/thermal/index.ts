// The thermal core: an RC network with enthalpy nodes and temperature-dependent conduction, grids of massive bodies, what passes heat
// between things, and the stratification of a fluid tank. Pure functions and plain data: no DOM, no three.js, no import from a lab or from
// the kit. It lives in this lab until a second lab uses it, then moves to `@onigam/lab-kit/sim/thermal` unchanged.
//
// Units: SI, temperatures in °C. Docs and limits: `docs/physics.md`, section "The thermal core".

export * from './air';
export * from './exchange';
export * from './grid';
export * from './material';
export * from './network';
export * from './stratify';
