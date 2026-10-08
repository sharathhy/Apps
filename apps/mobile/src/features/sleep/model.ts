import { addDays, clockMinutes, fromLocal, parseClock, parseDateKey } from '@/lib/time/zoned';

export interface SleepEntry {
  id: string;
  bedAt: string;
  wakeAt: string;
  /** Local date of the morning you woke up ("YYYY-MM-DD"). */
  day: string;
  /** How rested you felt, 1 to 5. */
  quality: 1 | 2 | 3 | 4 | 5 | null;
  note: string;
  updatedAt: string;
}

export const MAX_SLEEP_HOURS = 24;

/**
 * Turns "bed at 23:30, woke at 07:00 on the morning of `wakeDay`" into
 * exact instants. A bedtime later on the clock than the wake time means the
 * night before. Both ends use the zone's rules for that date, so a night
 * across a daylight saving change has its real length (one hour shorter or
 * longer).
 */
export function nightToInstants(
  wakeDay: string,
  bed: string,
  wake: string,
  timeZone: string,
): { bedAt: Date; wakeAt: Date } | null {
  const date = parseDateKey(wakeDay);
  const b = parseClock(bed);
  const w = parseClock(wake);
  if (!date || !b || !w) return null;
  const bedDate = clockMinutes(bed) >= clockMinutes(wake) ? addDays(date, -1) : date;
  const bedAt = fromLocal({ ...bedDate, ...b }, timeZone);
  const wakeAt = fromLocal({ ...date, ...w }, timeZone);
  const hours = (wakeAt.getTime() - bedAt.getTime()) / 3_600_000;
  return hours > 0 && hours <= MAX_SLEEP_HOURS ? { bedAt, wakeAt } : null;
}

export function durationMinutes(entry: Pick<SleepEntry, 'bedAt' | 'wakeAt'>): number {
  return Math.round((new Date(entry.wakeAt).getTime() - new Date(entry.bedAt).getTime()) / 60_000);
}

export function formatDuration(minutes: number): { hours: number; minutes: number } {
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}

/**
 * How much bedtimes vary, as a standard deviation in minutes. Times are
 * measured from noon so 23:30 and 00:30 count as an hour apart, not 23.
 */
export function bedtimeSpread(bedClocks: string[]): number | null {
  if (bedClocks.length < 2) return null;
  const fromNoon = bedClocks.map((c) => (clockMinutes(c) - 12 * 60 + 24 * 60) % (24 * 60));
  const mean = fromNoon.reduce((a, b) => a + b, 0) / fromNoon.length;
  const variance = fromNoon.reduce((a, b) => a + (b - mean) ** 2, 0) / fromNoon.length;
  return Math.round(Math.sqrt(variance));
}
