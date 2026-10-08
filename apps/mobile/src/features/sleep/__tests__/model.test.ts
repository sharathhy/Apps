import { bedtimeSpread, durationMinutes, nightToInstants } from '../model';

const ny = 'America/New_York';

describe('sleep model', () => {
  it('puts a late bedtime on the night before', () => {
    const night = nightToInstants('2026-10-08', '23:30', '07:00', 'Asia/Kolkata')!;
    expect(night.bedAt.toISOString()).toBe('2026-10-07T18:00:00.000Z');
    expect(
      durationMinutes({ bedAt: night.bedAt.toISOString(), wakeAt: night.wakeAt.toISOString() }),
    ).toBe(450);
  });

  it('keeps an after-midnight bedtime on the same date', () => {
    const night = nightToInstants('2026-10-08', '01:00', '08:00', 'Asia/Kolkata')!;
    expect(
      durationMinutes({ bedAt: night.bedAt.toISOString(), wakeAt: night.wakeAt.toISOString() }),
    ).toBe(420);
  });

  it('gives the real length across daylight saving changes', () => {
    // Clocks go forward on 8 March 2026 in New York: 23:00 to 07:00 is 7 hours.
    const spring = nightToInstants('2026-03-08', '23:00', '07:00', ny)!;
    expect(
      durationMinutes({ bedAt: spring.bedAt.toISOString(), wakeAt: spring.wakeAt.toISOString() }),
    ).toBe(420);
    // Clocks go back on 1 November 2026: the same night is 9 hours.
    const autumn = nightToInstants('2026-11-01', '23:00', '07:00', ny)!;
    expect(
      durationMinutes({ bedAt: autumn.bedAt.toISOString(), wakeAt: autumn.wakeAt.toISOString() }),
    ).toBe(540);
  });

  it('handles a leap day morning', () => {
    const night = nightToInstants('2028-02-29', '22:00', '06:00', 'Asia/Kolkata')!;
    expect(night.bedAt.toISOString()).toBe('2028-02-28T16:30:00.000Z');
  });

  it('rejects invalid input', () => {
    expect(nightToInstants('2026-02-30', '22:00', '06:00', ny)).toBeNull();
    expect(nightToInstants('2026-10-08', '25:00', '06:00', ny)).toBeNull();
  });

  it('measures bedtime spread across midnight', () => {
    expect(bedtimeSpread(['23:30', '00:30'])).toBe(30);
    expect(bedtimeSpread(['22:00', '22:00', '22:00'])).toBe(0);
    expect(bedtimeSpread(['22:00'])).toBeNull();
  });
});
