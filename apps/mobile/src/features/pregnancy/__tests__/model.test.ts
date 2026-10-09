import {
  contentWeek,
  dueFromConception,
  dueFromLastPeriod,
  gestationalAge,
  isUrgent,
  sessionMinutes,
} from '../model';

describe('due date (ACOG Committee Opinion 700)', () => {
  it('adds 280 days to the last period (Naegele: +1 year, -3 months, +7 days)', () => {
    expect(dueFromLastPeriod('2025-01-01')).toBe('2025-10-08');
    expect(dueFromLastPeriod('2025-06-10')).toBe('2026-03-17');
  });

  it('counts 29 February in a leap year', () => {
    // 280 days from 1 Jun 2023 crosses 29 Feb 2024.
    expect(dueFromLastPeriod('2023-06-01')).toBe('2024-03-07');
    expect(dueFromLastPeriod('2022-06-01')).toBe('2023-03-08');
  });

  it('adjusts for longer or shorter cycles, within limits', () => {
    expect(dueFromLastPeriod('2025-01-01', 32)).toBe('2025-10-12');
    expect(dueFromLastPeriod('2025-01-01', 25)).toBe('2025-10-05');
    expect(dueFromLastPeriod('2025-01-01', 90)).toBe('2025-10-22');
  });

  it('adds 266 days to conception (NHS)', () => {
    expect(dueFromConception('2025-01-15')).toBe('2025-10-08');
  });
});

describe('gestational age', () => {
  const due = '2025-10-08'; // last period 1 Jan 2025

  it('counts weeks and days from the last period', () => {
    expect(gestationalAge(due, '2025-01-01')).toMatchObject({ weeks: 0, days: 0, trimester: 1 });
    expect(gestationalAge(due, '2025-03-27')).toMatchObject({ weeks: 12, days: 1, daysToGo: 195 });
  });

  it('changes trimester at 14+0 and 28+0 (ACOG)', () => {
    expect(gestationalAge(due, '2025-04-08')!.trimester).toBe(1); // 13+6
    expect(gestationalAge(due, '2025-04-09')!.trimester).toBe(2); // 14+0
    expect(gestationalAge(due, '2025-07-15')!.trimester).toBe(2); // 27+6
    expect(gestationalAge(due, '2025-07-16')!.trimester).toBe(3); // 28+0
  });

  it('labels term the way ACOG defines it', () => {
    expect(gestationalAge(due, '2025-09-16')!.term).toBe('preterm'); // 36+6
    expect(gestationalAge(due, '2025-09-17')!.term).toBe('earlyTerm'); // 37+0
    expect(gestationalAge(due, '2025-10-01')!.term).toBe('fullTerm'); // 39+0
    expect(gestationalAge(due, '2025-10-15')!.term).toBe('lateTerm'); // 41+0
    expect(gestationalAge(due, '2025-10-22')!.term).toBe('postTerm'); // 42+0
    expect(gestationalAge(due, '2025-10-08')).toMatchObject({ weeks: 40, days: 0, daysToGo: 0 });
  });

  it('is unaffected by daylight saving changes and returns null before the pregnancy', () => {
    // US clocks change on 9 March 2025 and EU clocks on 30 March 2025.
    expect(gestationalAge(due, '2025-03-30')).toMatchObject({ weeks: 12, days: 4 });
    expect(gestationalAge(due, '2024-12-31')).toBeNull();
  });

  it('keeps week content within weeks 4 to 42', () => {
    expect(contentWeek(1)).toBe(4);
    expect(contentWeek(20)).toBe(20);
    expect(contentWeek(44)).toBe(42);
  });
});

describe('symptoms and kicks', () => {
  it('flags symptoms that need help straight away', () => {
    expect(isUrgent(['nausea', 'tired'])).toBe(false);
    expect(isUrgent(['nausea', 'fewerMovements'])).toBe(true);
    expect(isUrgent(['bleeding'])).toBe(true);
  });

  it('times a kick session', () => {
    const s = {
      id: 'a',
      startedAt: '2025-07-01T10:00:00Z',
      endedAt: '2025-07-01T10:24:30Z',
      count: 10,
    };
    expect(sessionMinutes(s)).toBe(25);
    expect(sessionMinutes({ ...s, endedAt: null }, new Date('2025-07-01T10:05:00Z'))).toBe(5);
  });
});
