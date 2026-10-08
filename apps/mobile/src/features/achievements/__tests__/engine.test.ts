import { achievements, visibleAchievements } from '../catalog';
import { emptySummary, longestStreakWithGrace, meetsCriterion, newlyEarned } from '../engine';
import { recordActivity } from '../store';

const days = (start: string, n: number, skip: number[] = []) => {
  const out: string[] = [];
  const d = new Date(`${start}T00:00:00Z`);
  for (let i = 0; i < n; i++) {
    if (!skip.includes(i)) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
};

describe('longestStreakWithGrace', () => {
  it('counts consecutive days', () => {
    expect(longestStreakWithGrace(days('2026-10-01', 7))).toBe(7);
    expect(longestStreakWithGrace([])).toBe(0);
  });

  it('forgives one missed day', () => {
    // 8 calendar days with day 3 missed: 7 logged days still make a 7-day streak.
    expect(longestStreakWithGrace(days('2026-10-01', 8, [3]))).toBe(7);
  });

  it('ends the run after two missed days in a row', () => {
    expect(longestStreakWithGrace(days('2026-10-01', 9, [3, 4]))).toBe(4);
  });

  it('allows one grace day per seven logged days', () => {
    // Two misses close together: the second ends the run.
    expect(longestStreakWithGrace(days('2026-10-01', 10, [2, 5]))).toBe(4);
    // A month with a miss each week still reaches 30 logged days.
    const month = days('2026-10-01', 35, [8, 17, 26, 34]);
    expect(longestStreakWithGrace(month)).toBe(31);
  });

  it('works across month ends, leap days and unsorted input', () => {
    const leap = days('2028-02-25', 7);
    expect(longestStreakWithGrace([...leap].reverse())).toBe(7);
    expect(leap).toContain('2028-02-29');
  });
});

describe('achievements', () => {
  it('has unique ids and never rewards restriction or weight', () => {
    const ids = achievements.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of achievements) {
      expect(a.id).not.toMatch(/weight|calorie|fast|restrict|lose|loss|deficit/i);
    }
  });

  it('hides tracker-specific achievements from people without that tracker', () => {
    const menIds = visibleAchievements(['water', 'mood', 'sleep', 'nutrition']).map((a) => a.id);
    expect(menIds).not.toContain('cycle_first');
    expect(menIds).not.toContain('kicks_first');
    expect(menIds).toContain('welcome');
  });

  it('earns each achievement once', () => {
    let summary = recordActivity(emptySummary, 'onboarding_complete', '2026-10-08');
    const first = newlyEarned(achievements, summary, new Set());
    expect(first.map((a) => a.id)).toEqual(['welcome']);
    summary = recordActivity(summary, 'onboarding_complete', '2026-10-09');
    expect(newlyEarned(achievements, summary, new Set(['welcome']))).toEqual([]);
  });

  it('counts distinct days and trackers', () => {
    let s = emptySummary;
    for (const d of ['2026-10-01', '2026-10-01', '2026-10-02'])
      s = recordActivity(s, 'sleep_logged', d, 'sleep');
    expect(meetsCriterion({ kind: 'days', event: 'sleep_logged', min: 2 }, s)).toBe(true);
    expect(meetsCriterion({ kind: 'days', event: 'sleep_logged', min: 3 }, s)).toBe(false);
    s = recordActivity(s, 'meal_logged', '2026-10-02', 'nutrition');
    s = recordActivity(s, 'mood_check_in', '2026-10-02', 'mood');
    expect(meetsCriterion({ kind: 'modules', min: 3 }, s)).toBe(true);
    // Reading content is not logging, so it does not build a streak.
    expect(recordActivity(emptySummary, 'article_read', '2026-10-01').logDays).toEqual([]);
  });
});

describe('currentStreakWithGrace', () => {
  const { currentStreakWithGrace } = jest.requireActual('../engine') as typeof import('../engine');
  it('counts a streak that ends today or yesterday', () => {
    expect(currentStreakWithGrace(days('2026-10-01', 5), '2026-10-05')).toBe(5);
    expect(currentStreakWithGrace(days('2026-10-01', 5), '2026-10-06')).toBe(5);
  });
  it('keeps it through one missed day with grace, not two', () => {
    expect(currentStreakWithGrace(days('2026-10-01', 5), '2026-10-07')).toBe(5);
    expect(currentStreakWithGrace(days('2026-10-01', 5), '2026-10-08')).toBe(0);
    expect(currentStreakWithGrace([], '2026-10-08')).toBe(0);
  });
});
