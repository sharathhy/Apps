import {
  averageOfLoggedDays,
  crossesGoal,
  dailyTotals,
  formatVolume,
  quickAddSizes,
  totalForDay,
  type WaterEntry,
} from '../model';

const entry = (day: string, amountMl: number): WaterEntry => ({
  id: `${day}-${amountMl}-${Math.random()}`,
  at: `${day}T08:00:00Z`,
  day,
  amountMl,
  drink: 'water',
  updatedAt: `${day}T08:00:00Z`,
});

describe('water model', () => {
  const entries = [entry('2026-10-08', 250), entry('2026-10-08', 500), entry('2026-10-06', 1000)];

  it('totals a day', () => {
    expect(totalForDay(entries, '2026-10-08')).toBe(750);
    expect(totalForDay(entries, '2026-10-07')).toBe(0);
  });

  it('builds a daily series ending today, across month ends', () => {
    expect(dailyTotals(entries, '2026-10-08', 3)).toEqual([
      { day: '2026-10-06', ml: 1000 },
      { day: '2026-10-07', ml: 0 },
      { day: '2026-10-08', ml: 750 },
    ]);
    expect(dailyTotals([], '2026-03-01', 2).map((d) => d.day)).toEqual([
      '2026-02-28',
      '2026-03-01',
    ]);
    expect(dailyTotals([], '2028-03-01', 2).map((d) => d.day)).toEqual([
      '2028-02-29',
      '2028-03-01',
    ]);
  });

  it('averages only days that were logged', () => {
    expect(averageOfLoggedDays(dailyTotals(entries, '2026-10-08', 7))).toBe(875);
    expect(averageOfLoggedDays([])).toBe(0);
  });

  it('detects the entry that reaches the goal, once', () => {
    expect(crossesGoal(1800, 250, 2000)).toBe(true);
    expect(crossesGoal(2000, 250, 2000)).toBe(false);
    expect(crossesGoal(0, 250, null)).toBe(false);
  });

  it('uses regional units', () => {
    expect(quickAddSizes('metric').map((s) => s.label)).toEqual([
      '150 ml',
      '250 ml',
      '500 ml',
      '750 ml',
    ]);
    expect(quickAddSizes('imperial')[0]).toEqual({ ml: 237, label: '8 fl oz' });
    expect(formatVolume(2000, 'metric')).toBe('2 L');
    expect(formatVolume(1500, 'metric')).toBe('1.5 L');
    expect(formatVolume(237, 'imperial')).toBe('8 fl oz');
  });
});
