/**
 * Wall-clock time in an IANA time zone, without a date library.
 *
 * Reminders are stored as local wall-clock times ("08:00 on weekdays") plus
 * the zone they were set in. These helpers turn a local date and time into
 * the exact instant to fire, handling daylight saving changes:
 * - a time that does not exist (the hour skipped when clocks go forward) moves
 *   forward by the length of the gap, so 02:30 becomes 03:30;
 * - a time that happens twice (the hour repeated when clocks go back) uses the
 *   first occurrence, so a reminder never fires twice.
 */

/** A calendar date with no time zone. Month is 1–12. */
export interface CivilDate {
  year: number;
  month: number;
  day: number;
}

export interface LocalDateTime extends CivilDate {
  hour: number;
  minute: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** True when the runtime knows this IANA zone name. */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** The local date and time shown on a clock in `timeZone` at `instant`. */
export function toLocal(instant: Date, timeZone: string): LocalDateTime & { second: number } {
  const parts = formatter(timeZone).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    // Some engines print midnight as 24 even with h23.
    hour: get('hour') % 24,
    minute: get('minute'),
    second: get('second'),
  };
}

/** Minutes the zone is ahead of UTC at `instant` (e.g. 330 for India). */
export function offsetMinutes(instant: Date, timeZone: string): number {
  const l = toLocal(instant, timeZone);
  const asUtc = Date.UTC(l.year, l.month - 1, l.day, l.hour, l.minute, l.second);
  const whole = Math.floor(instant.getTime() / 1000) * 1000;
  return Math.round((asUtc - whole) / 60_000);
}

const sameWallTime = (a: LocalDateTime, b: LocalDateTime) =>
  a.year === b.year &&
  a.month === b.month &&
  a.day === b.day &&
  a.hour === b.hour &&
  a.minute === b.minute;

/** The instant a clock in `timeZone` shows `local`. See the file comment for DST rules. */
export function fromLocal(local: LocalDateTime, timeZone: string): Date {
  const wall = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  const day = 86_400_000;
  // Offsets either side of a transition; the wall time maps to one, both or neither.
  const before = offsetMinutes(new Date(wall - day), timeZone);
  const after = offsetMinutes(new Date(wall + day), timeZone);
  const candidates = [...new Set([before, after])]
    .map((offset) => wall - offset * 60_000)
    .filter((t) => sameWallTime(toLocal(new Date(t), timeZone), local))
    .sort((a, b) => a - b);
  if (candidates.length > 0) return new Date(candidates[0]!);
  // In the gap: keep the pre-transition offset, which lands after the gap.
  return new Date(wall - before * 60_000);
}

export function addDays(date: CivilDate, days: number): CivilDate {
  const d = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** ISO weekday: 1 is Monday, 7 is Sunday. */
export function isoWeekday(date: CivilDate): number {
  const d = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
  return d === 0 ? 7 : d;
}

/** "YYYY-MM-DD", which sorts and compares as a string. */
export function dateKey(date: CivilDate): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.year}-${p(date.month)}-${p(date.day)}`;
}

export function parseDateKey(key: string): CivilDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const date = { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  return dateKey(addDays(date, 0)) === key ? date : null;
}

/** Whole days from `a` to `b` (positive when b is later). */
export function daysBetween(a: CivilDate, b: CivilDate): number {
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000,
  );
}

export function localDateKey(instant: Date, timeZone: string): string {
  return dateKey(toLocal(instant, timeZone));
}

/** Parses "HH:MM" (24-hour). */
export function parseClock(value: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  return hour < 24 && minute < 60 ? { hour, minute } : null;
}

export function formatClock(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Minutes since local midnight for "HH:MM". */
export function clockMinutes(value: string): number {
  const c = parseClock(value);
  return c ? c.hour * 60 + c.minute : 0;
}
