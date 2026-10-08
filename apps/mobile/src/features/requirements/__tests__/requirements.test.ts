import { missingRequirements, nextRequirementNotice, requirements } from '../definitions';

const values = { waterGoalMl: null, lastPeriodStart: null, dueDate: null };
const tz = 'Asia/Kolkata';
const now = new Date('2026-10-08T06:00:00Z'); // 11:30 IST

describe('requirements', () => {
  it('only asks for data the active trackers need', () => {
    expect(missingRequirements(values, ['water', 'mood']).map((r) => r.id)).toEqual(['waterGoal']);
    expect(missingRequirements({ ...values, waterGoalMl: 2000 }, ['water'])).toEqual([]);
    expect(missingRequirements(values, ['water', 'cycle', 'pregnancy'])).toHaveLength(3);
  });

  it('sends nothing until the in-app prompt has been seen', () => {
    const missing = missingRequirements(values, ['water']);
    expect(
      nextRequirementNotice({ missing, promptSeenAt: {}, lastNoticeAt: null, now, timeZone: tz }),
    ).toBeNull();
  });

  it('plans the next 10:00 local and keeps a planned time', () => {
    const missing = [requirements[0]!];
    const seen = { waterGoal: '2026-10-07T00:00:00Z' };
    const first = nextRequirementNotice({
      missing,
      promptSeenAt: seen,
      lastNoticeAt: null,
      now,
      timeZone: tz,
    });
    expect(first?.fireAt.toISOString()).toBe('2026-10-09T04:30:00.000Z');
    const again = nextRequirementNotice({
      missing,
      promptSeenAt: seen,
      lastNoticeAt: first!.fireAt.toISOString(),
      now,
      timeZone: tz,
    });
    expect(again?.fireAt.toISOString()).toBe('2026-10-09T04:30:00.000Z');
  });

  it('waits a week after the last notice', () => {
    const missing = [requirements[0]!];
    const seen = { waterGoal: '2026-10-01T00:00:00Z' };
    const next = nextRequirementNotice({
      missing,
      promptSeenAt: seen,
      lastNoticeAt: '2026-10-07T04:30:00.000Z',
      now,
      timeZone: tz,
    });
    expect(next?.fireAt.toISOString()).toBe('2026-10-14T04:30:00.000Z');
  });

  it('stops once the data is entered', () => {
    expect(
      nextRequirementNotice({
        missing: missingRequirements({ ...values, waterGoalMl: 2000 }, ['water']),
        promptSeenAt: { waterGoal: '2026-10-01T00:00:00Z' },
        lastNoticeAt: null,
        now,
        timeZone: tz,
      }),
    ).toBeNull();
  });
});
