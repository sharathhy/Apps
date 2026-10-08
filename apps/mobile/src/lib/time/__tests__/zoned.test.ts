import {
  addDays,
  daysBetween,
  fromLocal,
  isoWeekday,
  offsetMinutes,
  parseClock,
  parseDateKey,
  toLocal,
} from '../zoned';

const ny = 'America/New_York';
const iso = (d: Date) => d.toISOString();

describe('zoned time', () => {
  it('handles fixed-offset zones (India, no DST)', () => {
    expect(
      iso(fromLocal({ year: 2026, month: 3, day: 8, hour: 8, minute: 0 }, 'Asia/Kolkata')),
    ).toBe('2026-03-08T02:30:00.000Z');
    expect(offsetMinutes(new Date('2026-07-01T00:00:00Z'), 'Asia/Kolkata')).toBe(330);
  });

  it('keeps the wall-clock time across the US spring-forward change', () => {
    // DST starts 8 March 2026 at 02:00 in New York.
    expect(iso(fromLocal({ year: 2026, month: 3, day: 7, hour: 8, minute: 0 }, ny))).toBe(
      '2026-03-07T13:00:00.000Z',
    );
    expect(iso(fromLocal({ year: 2026, month: 3, day: 8, hour: 8, minute: 0 }, ny))).toBe(
      '2026-03-08T12:00:00.000Z',
    );
  });

  it('moves a time inside the skipped hour forward by the gap', () => {
    const t = fromLocal({ year: 2026, month: 3, day: 8, hour: 2, minute: 30 }, ny);
    expect(iso(t)).toBe('2026-03-08T07:30:00.000Z');
    expect(toLocal(t, ny)).toMatchObject({ hour: 3, minute: 30 });
  });

  it('uses the first occurrence of a repeated hour when clocks go back', () => {
    // DST ends 1 November 2026 at 02:00; 01:30 happens twice.
    expect(iso(fromLocal({ year: 2026, month: 11, day: 1, hour: 1, minute: 30 }, ny))).toBe(
      '2026-11-01T05:30:00.000Z',
    );
  });

  it('handles the southern hemisphere and half-hour DST (Lord Howe)', () => {
    // Australia/Sydney DST ends 5 April 2026 at 03:00 → 02:00.
    expect(
      iso(fromLocal({ year: 2026, month: 4, day: 5, hour: 9, minute: 0 }, 'Australia/Sydney')),
    ).toBe('2026-04-04T23:00:00.000Z');
    expect(offsetMinutes(new Date('2026-01-15T00:00:00Z'), 'Australia/Lord_Howe')).toBe(660);
    expect(offsetMinutes(new Date('2026-07-15T00:00:00Z'), 'Australia/Lord_Howe')).toBe(630);
  });

  it('does calendar arithmetic across month ends and leap years', () => {
    expect(addDays({ year: 2028, month: 2, day: 28 }, 1)).toEqual({
      year: 2028,
      month: 2,
      day: 29,
    });
    expect(addDays({ year: 2027, month: 2, day: 28 }, 1)).toEqual({ year: 2027, month: 3, day: 1 });
    expect(addDays({ year: 2026, month: 12, day: 31 }, 1)).toEqual({
      year: 2027,
      month: 1,
      day: 1,
    });
    expect(daysBetween({ year: 2028, month: 2, day: 1 }, { year: 2028, month: 3, day: 1 })).toBe(
      29,
    );
    expect(isoWeekday({ year: 2026, month: 10, day: 11 })).toBe(7);
    expect(isoWeekday({ year: 2026, month: 10, day: 12 })).toBe(1);
  });

  it('validates date keys and clock strings', () => {
    expect(parseDateKey('2028-02-29')).toEqual({ year: 2028, month: 2, day: 29 });
    expect(parseDateKey('2027-02-29')).toBeNull();
    expect(parseClock('07:05')).toEqual({ hour: 7, minute: 5 });
    expect(parseClock('24:00')).toBeNull();
  });
});
