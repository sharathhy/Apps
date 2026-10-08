import { addDays, dateKey, daysBetween, parseDateKey } from './zoned';

/** Calendar-day arithmetic on "YYYY-MM-DD" keys. No time zones involved. */
export function addDaysKey(key: string, days: number): string {
  return dateKey(addDays(parseDateKey(key)!, days));
}

/** Whole days from `a` to `b` (positive when `b` is later). */
export function daysBetweenKeys(a: string, b: string): number {
  return daysBetween(parseDateKey(a)!, parseDateKey(b)!);
}
