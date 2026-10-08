import { addDays, clockMinutes, formatClock, fromLocal, toLocal } from '@/lib/time/zoned';

/**
 * Evenly spaced times between the start and end of someone's waking hours,
 * both ends included, e.g. 09:00–21:00 with 5 → 09:00, 12:00, 15:00, 18:00, 21:00.
 */
export function spreadTimes(start: string, end: string, count: number): string[] {
  const a = clockMinutes(start);
  let b = clockMinutes(end);
  if (b <= a) b += 24 * 60;
  if (count <= 1) return [formatClock(Math.floor(a / 60), a % 60)];
  const step = (b - a) / (count - 1);
  return Array.from({ length: count }, (_, i) => {
    const m = (Math.round((a + i * step) / 5) * 5) % (24 * 60);
    return formatClock(Math.floor(m / 60), m % 60);
  });
}

/** Local midnight at the end of the day that contains `now`. */
export function endOfLocalDay(now: Date, timeZone: string): Date {
  const next = addDays(toLocal(now, timeZone), 1);
  return fromLocal({ ...next, hour: 0, minute: 0 }, timeZone);
}
