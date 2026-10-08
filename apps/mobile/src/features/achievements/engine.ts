import type { ModuleId } from '@wellness/design-tokens';

import { daysBetween, parseDateKey } from '@/lib/time/zoned';

import type { AchievementDefinition, ActivityEvent, Criterion } from './catalog';

/** Everything the engine needs, kept small: counts and the local dates things happened. */
export interface ActivitySummary {
  counts: Partial<Record<ActivityEvent, number>>;
  /** Local dates ("YYYY-MM-DD") on which each event happened. */
  eventDays: Partial<Record<ActivityEvent, string[]>>;
  /** Local dates on which anything was logged, for streaks. */
  logDays: string[];
  /** Trackers something has been logged in. */
  modulesUsed: ModuleId[];
}

export const emptySummary: ActivitySummary = {
  counts: {},
  eventDays: {},
  logDays: [],
  modulesUsed: [],
};

/**
 * The longest run of logged days, where one missed day is forgiven per seven
 * logged days (the "grace day"). Two missed days in a row end the run. The
 * forgiven day itself does not count toward the length.
 */
export function longestStreakWithGrace(dayKeys: string[]): number {
  const days = [...new Set(dayKeys)]
    .map(parseDateKey)
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .sort((a, b) => daysBetween(b, a));
  let best = 0;
  let run = 0;
  let graceLeft = 1;
  let sinceGrace = 0;
  for (let i = 0; i < days.length; i++) {
    const gap = i === 0 ? 1 : daysBetween(days[i - 1]!, days[i]!);
    if (gap === 1) {
      run++;
    } else if (gap === 2 && graceLeft > 0) {
      graceLeft--;
      sinceGrace = 0;
      run++;
    } else {
      run = 1;
      graceLeft = 1;
      sinceGrace = 0;
    }
    sinceGrace++;
    if (sinceGrace >= 7 && graceLeft === 0) {
      graceLeft = 1;
      sinceGrace = 0;
    }
    best = Math.max(best, run);
  }
  return best;
}

export function meetsCriterion(criterion: Criterion, summary: ActivitySummary): boolean {
  switch (criterion.kind) {
    case 'count':
      return (summary.counts[criterion.event] ?? 0) >= (criterion.min ?? 1);
    case 'days':
      return new Set(summary.eventDays[criterion.event] ?? []).size >= criterion.min;
    case 'streak':
      return longestStreakWithGrace(summary.logDays) >= criterion.days;
    case 'modules':
      return new Set(summary.modulesUsed).size >= criterion.min;
  }
}

/** Achievements newly earned: met now, visible to this person, and not earned before. */
export function newlyEarned(
  definitions: AchievementDefinition[],
  summary: ActivitySummary,
  earned: ReadonlySet<string>,
): AchievementDefinition[] {
  return definitions.filter((d) => !earned.has(d.id) && meetsCriterion(d.criterion, summary));
}
