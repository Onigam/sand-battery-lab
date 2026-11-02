import type { StripAlarm, StripValue } from '@onigam/lab-kit/ui';
import { SPEEDS } from '../sim/presets';
import { ALARM_TEXTS } from '../sim/texts';
import type { SandSim } from '../sim/engine';
import { power } from './model';
import { months, num, st, sx } from './strings';

// What the bottom strip of the frame shows: five live values, the date of the clock, the alarms.

const asValue = (w: number): { value: string; unit: string } => {
  const p = power(w);
  return { value: num(p.value, p.digits), unit: p.unit };
};

export function stripValues(sim: SandSim): StripValue[] {
  const s = sim.state;
  return [
    { label: st('stripLevel'), value: num(100 * s.chargeLevel), unit: '%' },
    { label: st('stripMean'), value: num(s.meanT), unit: '°C' },
    { label: st('stripIn'), ...asValue(s.heater), cls: 'live--water' },
    { label: st('stripOut'), ...asValue(s.heatOut) },
    { label: st('stripPrice'), value: num(s.price), unit: '€/MWh' },
  ];
}

const DAYS_BEFORE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

/** Month of a day of the year, 0 to 11. */
export function monthOf(day: number): number {
  const d = Math.floor(day);
  for (let m = 11; m >= 0; m--) if (d >= DAYS_BEFORE[m]!) return m;
  return 0;
}

export function stripClock(sim: SandSim): { time: string; sub: string } {
  const s = sim.state;
  const hh = Math.floor(s.hour);
  const mm = Math.floor((s.hour - hh) * 60);
  const m = monthOf(s.day);
  return {
    time: `${Math.floor(s.day) - DAYS_BEFORE[m]! + 1} ${months()[m]}`,
    sub: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
  };
}

export function stripAlarms(sim: SandSim): StripAlarm[] {
  return sim.state.alarms.map((a) => ({ key: a, label: sx('alarm', a), severe: ALARM_TEXTS[a].severe }));
}

export const STRIP_SPEEDS = SPEEDS;
