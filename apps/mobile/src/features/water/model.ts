import { ML_PER_FL_OZ, type UnitSystem } from '@/lib/region';
import { addDays, dateKey, parseDateKey } from '@/lib/time/zoned';

export const drinkTypes = [
  'water',
  'tea',
  'coffee',
  'milk',
  'juice',
  'coconutWater',
  'buttermilk',
  'other',
] as const;
export type DrinkType = (typeof drinkTypes)[number];

export interface WaterEntry {
  id: string;
  /** ISO instant the drink was logged for. */
  at: string;
  /** Local date it counts toward ("YYYY-MM-DD"), fixed when logged so travel does not move it. */
  day: string;
  amountMl: number;
  drink: DrinkType;
  updatedAt: string;
}

/** Largest single entry, matching the database check. */
export const MAX_ENTRY_ML = 5000;

/** Quick-add sizes. Metric uses common glass and bottle sizes; imperial uses US cups and bottles. */
export function quickAddSizes(units: UnitSystem): { ml: number; label: string }[] {
  return units === 'imperial'
    ? [8, 12, 16.9, 24].map((oz) => ({ ml: Math.round(oz * ML_PER_FL_OZ), label: `${oz} fl oz` }))
    : [150, 250, 500, 750].map((ml) => ({ ml, label: `${ml} ml` }));
}

export function formatVolume(ml: number, units: UnitSystem): string {
  if (units === 'imperial') return `${Math.round(ml / ML_PER_FL_OZ)} fl oz`;
  return ml >= 1000 ? `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1)} L` : `${ml} ml`;
}

export function totalForDay(entries: WaterEntry[], day: string): number {
  return entries.reduce((sum, e) => (e.day === day ? sum + e.amountMl : sum), 0);
}

/** Totals for the `count` days ending on `lastDay`, oldest first. */
export function dailyTotals(
  entries: WaterEntry[],
  lastDay: string,
  count: number,
): { day: string; ml: number }[] {
  const end = parseDateKey(lastDay);
  if (!end) return [];
  const totals = new Map<string, number>();
  for (const e of entries) totals.set(e.day, (totals.get(e.day) ?? 0) + e.amountMl);
  return Array.from({ length: count }, (_, i) => {
    const day = dateKey(addDays(end, i - count + 1));
    return { day, ml: totals.get(day) ?? 0 };
  });
}

/** Average over days that have at least one entry, so days not tracked do not drag it down. */
export function averageOfLoggedDays(series: { ml: number }[]): number {
  const logged = series.filter((d) => d.ml > 0);
  return logged.length ? Math.round(logged.reduce((s, d) => s + d.ml, 0) / logged.length) : 0;
}

/** True when this entry is the one that takes the day's total to the goal. */
export function crossesGoal(before: number, added: number, goal: number | null): boolean {
  return goal !== null && goal > 0 && before < goal && before + added >= goal;
}
