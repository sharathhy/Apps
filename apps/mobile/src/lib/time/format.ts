import { formatClock, parseClock } from './zoned';

/** "08:00" shown the local way, e.g. "8:00 am" in English or "8:00 am" style for Hindi. */
export function clockLabel(value: string, locale: string): string {
  const clock = parseClock(value);
  if (!clock) return value;
  try {
    return new Date(2000, 0, 1, clock.hour, clock.minute).toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

/** Moves "HH:MM" by `minutes`, wrapping around midnight. */
export function shiftClock(value: string, minutes: number): string {
  const clock = parseClock(value) ?? { hour: 0, minute: 0 };
  const total = (((clock.hour * 60 + clock.minute + minutes) % 1440) + 1440) % 1440;
  return formatClock(Math.floor(total / 60), total % 60);
}
