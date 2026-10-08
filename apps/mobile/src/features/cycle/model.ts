import { addDaysKey, daysBetweenKeys } from '@/lib/time/days';

/**
 * Cycle estimates. Every value here is an estimate built from the person's
 * own logs, shown as such, and never as contraception.
 *
 * Sources:
 * - NHS, "Periods" (nhs.uk/conditions/periods): the average cycle is 28 days;
 *   anywhere from 21 to 40 days is common; a period usually lasts 2 to 7 days.
 * - NHS, "Natural family planning (fertility awareness)": ovulation is
 *   usually 10 to 16 days before the next period; apps alone are not a
 *   reliable form of contraception.
 * - ACOG FAQ, "Fertility Awareness-Based Methods of Family Planning": the
 *   egg can be fertilised for about a day; sperm can live up to 5 days.
 * - Wilcox, Weinberg & Baird, "Timing of sexual intercourse in relation to
 *   ovulation", NEJM 1995;333:1517-21: the fertile window is the 6 days
 *   ending on the day of ovulation.
 * - Munro et al., FIGO AUB System 1 (revised), Int J Gynaecol Obstet
 *   2018;143:393-408: cycles are "irregular" when the shortest and longest
 *   differ by more than 7 to 9 days.
 */
export const DEFAULT_CYCLE_DAYS = 28;
export const DEFAULT_PERIOD_DAYS = 5;
/** Ovulation is estimated this many days before the next period (NHS: 10 to 16, usually about 14). */
export const LUTEAL_DAYS = 14;
/** Fertile window: 5 days before ovulation through ovulation day (Wilcox 1995). */
export const FERTILE_DAYS_BEFORE_OVULATION = 5;
/** Shortest-to-longest difference above which cycles count as irregular (FIGO 2018, lower bound). */
export const IRREGULAR_SPREAD_DAYS = 7;
/** Range NHS calls common. Outside it we gently suggest talking to a doctor. */
export const COMMON_CYCLE_RANGE = { min: 21, max: 40 } as const;
/** Only the most recent cycles count, so old patterns fade out. */
export const CYCLES_USED = 6;
/** Gaps outside this are almost certainly a missed log, so they are left out of averages. */
const PLAUSIBLE_CYCLE = { min: 10, max: 90 } as const;

export const flows = ['spotting', 'light', 'medium', 'heavy'] as const;
export type Flow = (typeof flows)[number];

export const cycleSymptoms = [
  'cramps',
  'headache',
  'bloating',
  'tenderBreasts',
  'backPain',
  'acne',
  'tired',
  'cravings',
  'nausea',
  'moodSwings',
  'discharge',
] as const;
export type CycleSymptom = (typeof cycleSymptoms)[number];

export interface Period {
  id: string;
  /** First day, "YYYY-MM-DD". */
  start: string;
  /** Last day, or null while it is ongoing or not recorded. */
  end: string | null;
  updatedAt: string;
}

export interface CycleDayLog {
  day: string;
  flow: Flow | null;
  symptoms: CycleSymptom[];
  note: string;
  updatedAt: string;
}

/** Sorted, de-duplicated period start days, including the start given during setup. */
export function periodStarts(periods: readonly Period[], setupStart: string | null): string[] {
  const all = new Set(periods.map((p) => p.start));
  if (setupStart) all.add(setupStart);
  return [...all].sort();
}

/** Length of each complete cycle, oldest first. Implausible gaps (missed logs) are dropped. */
export function cycleLengths(starts: readonly string[]): number[] {
  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const days = daysBetweenKeys(starts[i - 1]!, starts[i]!);
    if (days >= PLAUSIBLE_CYCLE.min && days <= PLAUSIBLE_CYCLE.max) lengths.push(days);
  }
  return lengths;
}

export interface CycleStats {
  /** Rounded average of recent cycles, or 28 when there are none yet. */
  averageCycle: number;
  shortest: number;
  longest: number;
  /** How many recent cycles the averages use (0 means the defaults are shown). */
  cyclesUsed: number;
  irregular: boolean;
  averagePeriod: number;
  /** True when at least 3 cycles average outside 21 to 40 days. */
  outsideCommonRange: boolean;
}

export function cycleStats(starts: readonly string[], periods: readonly Period[]): CycleStats {
  const recent = cycleLengths(starts).slice(-CYCLES_USED);
  const lengths = periods
    .filter((p) => p.end)
    .map((p) => daysBetweenKeys(p.start, p.end!) + 1)
    .filter((d) => d >= 1 && d <= 15)
    .slice(-CYCLES_USED);
  const average = (xs: number[], fallback: number) =>
    xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : fallback;
  const averageCycle = average(recent, DEFAULT_CYCLE_DAYS);
  const shortest = recent.length ? Math.min(...recent) : averageCycle;
  const longest = recent.length ? Math.max(...recent) : averageCycle;
  return {
    averageCycle,
    shortest,
    longest,
    cyclesUsed: recent.length,
    irregular: recent.length >= 2 && longest - shortest > IRREGULAR_SPREAD_DAYS,
    averagePeriod: average(lengths, DEFAULT_PERIOD_DAYS),
    outsideCommonRange:
      recent.length >= 3 &&
      (averageCycle < COMMON_CYCLE_RANGE.min || averageCycle > COMMON_CYCLE_RANGE.max),
  };
}

export interface DayRange {
  from: string;
  to: string;
}

export interface CyclePrediction {
  /** Day of the current cycle; day 1 is the first day of the last period. */
  cycleDay: number;
  /** Most likely start of the next period. */
  nextStart: string;
  /** Earliest and latest likely start; the same day unless cycles are irregular. */
  nextRange: DayRange;
  ovulation: DayRange;
  fertile: DayRange;
  /** Days until `nextStart` (negative once it has passed). */
  daysUntil: number;
}

/**
 * Estimates the next period and fertile window from the last start. When
 * cycles vary a lot, the estimate is a range instead of one day.
 * Returns null until at least one period start is known.
 */
export function predictCycle(
  starts: readonly string[],
  stats: CycleStats,
  today: string,
): CyclePrediction | null {
  const last = starts.at(-1);
  if (!last || last > today) return null;
  const nextStart = addDaysKey(last, stats.averageCycle);
  const early = stats.irregular ? stats.shortest : stats.averageCycle;
  const late = stats.irregular ? stats.longest : stats.averageCycle;
  const ovulation = {
    from: addDaysKey(last, early - LUTEAL_DAYS),
    to: addDaysKey(last, late - LUTEAL_DAYS),
  };
  return {
    cycleDay: daysBetweenKeys(last, today) + 1,
    nextStart,
    nextRange: { from: addDaysKey(last, early), to: addDaysKey(last, late) },
    ovulation,
    fertile: { from: addDaysKey(ovulation.from, -FERTILE_DAYS_BEFORE_OVULATION), to: ovulation.to },
    daysUntil: daysBetweenKeys(today, nextStart),
  };
}

export type DayKind = 'period' | 'predictedPeriod' | 'ovulation' | 'fertile' | null;

const within = (day: string, range: DayRange) => day >= range.from && day <= range.to;

/**
 * What a calendar day shows. Logged period days win over estimates; the
 * estimate covers the coming cycle only, since later ones are too uncertain.
 */
export function dayKind(
  day: string,
  periods: readonly Period[],
  logs: Readonly<Record<string, CycleDayLog>>,
  prediction: CyclePrediction | null,
  stats: CycleStats,
  today: string,
): DayKind {
  const flow = logs[day]?.flow;
  if (flow && flow !== 'spotting') return 'period';
  for (const p of periods) {
    const end =
      p.end ??
      (p.start <= today ? minKey(today, addDaysKey(p.start, stats.averagePeriod - 1)) : p.start);
    if (day >= p.start && day <= end) return 'period';
  }
  if (!prediction || day < today) return null;
  const predicted = {
    from: prediction.nextRange.from,
    to: addDaysKey(prediction.nextRange.to, stats.averagePeriod - 1),
  };
  if (within(day, predicted)) return 'predictedPeriod';
  if (within(day, prediction.ovulation)) return 'ovulation';
  if (within(day, prediction.fertile)) return 'fertile';
  return null;
}

const minKey = (a: string, b: string) => (a < b ? a : b);

export interface CycleRow {
  start: string;
  /** Days until the next start, or null for the current cycle. */
  length: number | null;
  /** Logged period length, or null when no end was recorded. */
  periodDays: number | null;
}

/** One row per cycle, newest first, for the history list and the CSV export. */
export function cycleHistory(starts: readonly string[], periods: readonly Period[]): CycleRow[] {
  const ends = new Map(periods.map((p) => [p.start, p.end]));
  return starts
    .map((start, i) => {
      const next = starts[i + 1];
      const end = ends.get(start);
      return {
        start,
        length: next ? daysBetweenKeys(start, next) : null,
        periodDays: end ? daysBetweenKeys(start, end) + 1 : null,
      };
    })
    .reverse();
}

const csvCell = (value: string | number | null) => {
  const text = value === null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** CSV a person can share with their doctor: one table of cycles and one of daily logs. */
export function cycleCsv(rows: readonly CycleRow[], logs: readonly CycleDayLog[]): string {
  const lines = [
    'cycle_start,cycle_length_days,period_length_days',
    ...rows.map((r) => [r.start, r.length, r.periodDays].map(csvCell).join(',')),
    '',
    'day,flow,symptoms,note',
    ...[...logs]
      .sort((a, b) => (a.day < b.day ? 1 : -1))
      .map((l) => [l.day, l.flow, l.symptoms.join(' '), l.note].map(csvCell).join(',')),
  ];
  return `${lines.join('\n')}\n`;
}
