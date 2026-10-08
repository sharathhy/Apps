import {
  cycleCsv,
  cycleHistory,
  cycleLengths,
  cycleStats,
  dayKind,
  periodStarts,
  predictCycle,
  type Period,
} from '../model';

const period = (start: string, end: string | null = null): Period => ({
  id: start,
  start,
  end,
  updatedAt: '2024-01-01T00:00:00Z',
});

describe('cycle estimates', () => {
  it('uses 28 days (NHS average) until there is a full cycle', () => {
    const starts = periodStarts([], '2024-03-01');
    const stats = cycleStats(starts, []);
    expect(stats).toMatchObject({ averageCycle: 28, cyclesUsed: 0, irregular: false });
    const p = predictCycle(starts, stats, '2024-03-10')!;
    expect(p.cycleDay).toBe(10);
    expect(p.nextStart).toBe('2024-03-29');
  });

  it('puts ovulation 14 days before the next period and the fertile window on the 6 days ending there', () => {
    // Worked example: 28-day cycles starting 1 Jan 2024. Next start 25 Mar
    // (across 29 February), ovulation 11 Mar, fertile 6 to 11 Mar.
    const periods = ['2024-01-01', '2024-01-29', '2024-02-26'].map((d) => period(d));
    const starts = periodStarts(periods, null);
    const stats = cycleStats(starts, periods);
    const p = predictCycle(starts, stats, '2024-03-01')!;
    expect(p.nextStart).toBe('2024-03-25');
    expect(p.nextRange).toEqual({ from: '2024-03-25', to: '2024-03-25' });
    expect(p.ovulation).toEqual({ from: '2024-03-11', to: '2024-03-11' });
    expect(p.fertile).toEqual({ from: '2024-03-06', to: '2024-03-11' });
    expect(p.daysUntil).toBe(24);
  });

  it('counts leap days correctly', () => {
    const leap = cycleStats(['2024-02-15'], []);
    expect(predictCycle(['2024-02-15'], leap, '2024-02-20')!.nextStart).toBe('2024-03-14');
    expect(predictCycle(['2023-02-15'], leap, '2023-02-20')!.nextStart).toBe('2023-03-15');
  });

  it('is unaffected by daylight saving changes, since it counts calendar days', () => {
    // US clocks change on 8 March 2026 and EU clocks on 29 March 2026.
    const p = predictCycle(['2026-03-01'], cycleStats(['2026-03-01'], []), '2026-03-09')!;
    expect(p.nextStart).toBe('2026-03-29');
    expect(p.cycleDay).toBe(9);
  });

  it('shows a range when cycles vary by more than 7 days (FIGO)', () => {
    const starts = ['2024-01-01', '2024-01-26', '2024-03-01', '2024-03-31'];
    expect(cycleLengths(starts)).toEqual([25, 35, 30]);
    const stats = cycleStats(starts, []);
    expect(stats).toMatchObject({ averageCycle: 30, shortest: 25, longest: 35, irregular: true });
    const p = predictCycle(starts, stats, '2024-04-05')!;
    expect(p.nextRange).toEqual({ from: '2024-04-25', to: '2024-05-05' });
    expect(p.ovulation).toEqual({ from: '2024-04-11', to: '2024-04-21' });
    expect(p.fertile).toEqual({ from: '2024-04-06', to: '2024-04-21' });
  });

  it('leaves out gaps that look like a missed log and uses only the last 6 cycles', () => {
    expect(cycleLengths(['2024-01-01', '2024-05-01', '2024-05-29'])).toEqual([28]);
    const starts = ['2023-01-01'];
    for (let i = 0; i < 8; i++) starts.push(addDays(starts.at(-1)!, i < 2 ? 40 : 30));
    expect(cycleStats(starts, []).averageCycle).toBe(30);
  });

  it('flags an average outside 21 to 40 days only after 3 cycles', () => {
    expect(cycleStats(['2024-01-01', '2024-02-15', '2024-03-31'], []).outsideCommonRange).toBe(
      false,
    );
    expect(
      cycleStats(['2024-01-01', '2024-02-15', '2024-03-31', '2024-05-15'], []).outsideCommonRange,
    ).toBe(true);
  });

  it('averages logged period lengths', () => {
    const periods = [period('2024-01-01', '2024-01-04'), period('2024-01-29', '2024-02-03')];
    expect(cycleStats(periodStarts(periods, null), periods).averagePeriod).toBe(5);
  });

  it('labels calendar days, with logged days winning over estimates', () => {
    const periods = [period('2024-01-01', '2024-01-05'), period('2024-01-29', '2024-02-02')];
    const starts = periodStarts(periods, null);
    const stats = cycleStats(starts, periods);
    const p = predictCycle(starts, stats, '2024-02-05');
    const kind = (day: string) => dayKind(day, periods, {}, p, stats, '2024-02-05');
    expect(kind('2024-01-30')).toBe('period');
    expect(kind('2024-02-06')).toBeNull();
    expect(kind('2024-02-08')).toBe('fertile');
    expect(kind('2024-02-12')).toBe('ovulation');
    expect(kind('2024-02-26')).toBe('predictedPeriod');
    expect(kind('2024-03-01')).toBe('predictedPeriod');
    expect(kind('2024-03-02')).toBeNull();
  });

  it('returns nothing to predict before any period is known', () => {
    expect(predictCycle([], cycleStats([], []), '2024-01-01')).toBeNull();
  });
});

describe('cycle export', () => {
  it('lists cycles newest first and escapes notes for CSV', () => {
    const periods = [period('2024-01-01', '2024-01-05'), period('2024-01-29')];
    const rows = cycleHistory(periodStarts(periods, null), periods);
    expect(rows).toEqual([
      { start: '2024-01-29', length: null, periodDays: null },
      { start: '2024-01-01', length: 28, periodDays: 5 },
    ]);
    const csv = cycleCsv(rows, [
      {
        day: '2024-01-02',
        flow: 'heavy',
        symptoms: ['cramps', 'tired'],
        note: 'Said "ow", rested',
        updatedAt: '',
      },
    ]);
    expect(csv).toContain('2024-01-01,28,5');
    expect(csv).toContain('2024-01-02,heavy,cramps tired,"Said ""ow"", rested"');
  });
});

function addDays(key: string, n: number) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
