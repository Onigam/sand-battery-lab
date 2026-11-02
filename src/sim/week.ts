// What the plant lives in: a hand-drawn week of prices, the heat the village asks, the outside air, a solar field's overflow. All DRAWN, none
// of it a record of a real week: the span of the first week (3 to 373 €/MWh) is the one a press article reports from the maker's own data; the
// shape (cheap windy nights, an evening peak, a calm cold day, a quiet weekend) is ours.

/** A week starting Monday 00:00, €/MWh, drawn by hand. */
const DRAWN: readonly number[] = [
  // Monday
  18, 14, 12, 11, 12, 20, 48, 85, 96, 88, 74, 66, 60, 58, 62, 72, 92, 118, 104, 80, 62, 46, 34, 24,
  // Tuesday
  16, 12, 10, 9, 10, 16, 40, 76, 88, 82, 70, 62, 58, 54, 58, 68, 88, 110, 98, 76, 58, 42, 30, 20,
  // Wednesday: the wind falls
  22, 20, 22, 26, 32, 44, 72, 110, 134, 126, 104, 92, 84, 80, 84, 98, 124, 162, 148, 118, 92, 74, 58, 44,
  // Thursday: calm and cold, the peak of the week
  38, 34, 32, 34, 40, 58, 96, 158, 212, 196, 162, 138, 124, 118, 128, 164, 246, 373, 318, 232, 164, 118, 82, 60,
  // Friday: the wind comes back
  44, 36, 30, 28, 30, 42, 70, 112, 128, 112, 88, 74, 62, 54, 52, 58, 74, 92, 82, 62, 44, 30, 20, 14,
  // Saturday
  10, 8, 7, 6, 6, 7, 9, 14, 20, 24, 22, 18, 14, 12, 12, 16, 24, 38, 40, 30, 22, 14, 10, 8,
  // Sunday: the wind and little use
  6, 5, 4, 3, 3, 3, 4, 6, 8, 10, 10, 8, 6, 5, 5, 8, 14, 26, 34, 28, 20, 14, 18, 24,
];

/** The same shape with no wind at all: no cheap hour in the week. */
const WINDLESS: readonly number[] = DRAWN.map((v, h) => {
  const day = DRAWN.slice(72, 96); // the shape of the calm day, every day, scaled down a little
  return Math.round(Math.max(70, 0.7 * day[h % 24]!, 0.6 * v));
});

/** A week whose weekend is flooded with wind and sun: prices fall below zero. */
const NEGATIVE: readonly number[] = DRAWN.map((v, h) => {
  if (h < 120) return v;
  const hour = h % 24;
  return Math.round(-30 + 22 * Math.abs(Math.cos(((hour - 13) * Math.PI) / 24)));
});

export type PriceWeekId = 'drawn' | 'windless' | 'negative';
export const PRICE_WEEK_IDS: readonly PriceWeekId[] = ['drawn', 'windless', 'negative'];

export const PRICE_WEEKS: Record<PriceWeekId, readonly number[]> = {
  drawn: DRAWN,
  windless: WINDLESS,
  negative: NEGATIVE,
};

export const HOURS_PER_WEEK = 168;

export const priceAt = (week: PriceWeekId, hourOfWeek: number): number =>
  PRICE_WEEKS[week][Math.floor(hourOfWeek) % HOURS_PER_WEEK]!;

/** Hour of the week (Monday 00:00 is 0) of a day of the year and an hour of the day. The year starts on a Monday, near enough. */
export const hourOfWeekAt = (dayOfYear: number, hour: number): number =>
  (Math.floor(dayOfYear) * 24 + Math.floor(hour)) % HOURS_PER_WEEK;

/** DERIVED from what the maker says 100 MWh means: about a week of winter demand, almost a month of summer demand, W at 1 MW rated. */
export const WINTER_DEMAND = 100e6 / (7 * 24);
export const SUMMER_DEMAND = 100e6 / (30 * 24);

/** ESTIMATE, drawn: the shape of a day on the network, mean 1: a morning and an evening peak. */
const DAY_SHAPE: readonly number[] = [
  0.84, 0.8, 0.8, 0.8, 0.84, 0.94, 1.14, 1.26, 1.22, 1.1, 1.0, 0.98, 0.98, 0.95, 0.95, 1.0, 1.05, 1.15, 1.21, 1.16,
  1.05, 0.96, 0.92, 0.85,
];

export type Season = 'year' | 'winter' | 'summer';

/** Coldest and warmest days of the year (ESTIMATE, usual for southern Finland). */
export const WINTER_DAY = 15;
export const SUMMER_DAY = 197;

const seasonDay = (season: Season, day: number): number =>
  season === 'winter' ? WINTER_DAY : season === 'summer' ? SUMMER_DAY : day;

/** How deep in the winter a day is: 1 on the coldest day, 0 on the warmest. For the 3D's snow too. */
export const winterness = (season: Season, day: number): number =>
  0.5 + 0.5 * Math.cos((2 * Math.PI * (seasonDay(season, day) - WINTER_DAY)) / 365);

/** Heat the network asks, W: the winter and summer levels between the seasons, times the shape of the day, scaled by the plant's rated power. */
export function demandAt(season: Season, day: number, hour: number, rated: number): number {
  const w = winterness(season, day);
  const level = SUMMER_DEMAND + (WINTER_DEMAND - SUMMER_DEMAND) * w;
  return (level * DAY_SHAPE[Math.floor(hour) % 24]! * rated) / 1e6;
}

/** Outside air, °C: ESTIMATE, a usual curve for southern Finland; the reported minimum is −23 °C at a sister plant, the slider reaches it. */
export function outsideAt(season: Season, day: number, hour: number, shift: number): number {
  const w = winterness(season, day);
  return -6 + 23 * (1 - w) + 3 * Math.sin((2 * Math.PI * (hour - 9)) / 24) + shift;
}

/** A drawn week of a solar field's overflow, 0 to 1 of the heater's power: the sun at noon, a few clouds. */
const CLOUDS: readonly number[] = [1, 0.8, 0.3, 0.2, 0.6, 1, 0.9];
export function solarOverflowAt(hourOfWeek: number): number {
  const day = Math.floor(hourOfWeek / 24) % 7;
  const hour = hourOfWeek % 24;
  const sun = Math.max(0, Math.cos(((hour - 13) * Math.PI) / 11));
  return CLOUDS[day]! * sun * sun;
}

/** ESTIMATE: a MWh of heat from the wood-chip boiler, fuel and handling, €. No source gives the plant's figure. */
export const BOILER_PRICE = 45;
