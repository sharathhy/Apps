import { toLocal } from '@/lib/time/zoned';

import { afterQuietHours, inQuietHours, planNotifications, type PlanInput } from '../planner';
import type { Reminder } from '../reminders';
import { snoozeUntil } from '../snooze';
import { defaultNotificationPreferences, type NotificationPreferences } from '../types';

const prefs: NotificationPreferences = {
  ...defaultNotificationPreferences,
  enabled: true,
  types: { scheduled: true, smart: true, achievement: true, requirement: true, insight: true },
};

const reminder = (over: Partial<Reminder> = {}): Reminder => ({
  id: 'r1',
  module: 'water',
  kind: 'scheduled',
  templateKey: 'water.drink',
  times: ['08:00'],
  weekdays: [],
  timezone: 'Asia/Kolkata',
  enabled: true,
  snoozedUntil: null,
  updatedAt: '2026-01-01T00:00:00Z',
  ...over,
});

const plan = (over: Partial<PlanInput> = {}) =>
  planNotifications({
    reminders: [reminder()],
    prefs,
    now: new Date('2026-10-08T00:00:00Z'),
    timeZone: 'Asia/Kolkata',
    visibleModules: ['water', 'mood', 'sleep', 'nutrition', 'cycle', 'pregnancy'],
    horizonDays: 2,
    ...over,
  });

const isoTimes = (p: ReturnType<typeof plan>) => p.planned.map((n) => n.fireAt.toISOString());
const local = (d: Date, tz: string) => {
  const l = toLocal(d, tz);
  return `${l.hour}:${String(l.minute).padStart(2, '0')}`;
};

describe('planNotifications', () => {
  it('plans nothing until notifications are switched on', () => {
    expect(plan({ prefs: defaultNotificationPreferences }).planned).toEqual([]);
  });

  it('respects the type and module switches and hidden modules', () => {
    expect(
      plan({ prefs: { ...prefs, types: { ...prefs.types, scheduled: false } } }).planned,
    ).toEqual([]);
    expect(plan({ prefs: { ...prefs, modules: { water: false } } }).planned).toEqual([]);
    expect(
      plan({ reminders: [reminder({ module: 'cycle' })], visibleModules: ['water'] }).planned,
    ).toEqual([]);
  });

  it('schedules each local time once per day, from now on', () => {
    // 05:30 in India; 08:00 IST = 02:30 UTC.
    expect(isoTimes(plan())).toEqual([
      '2026-10-08T02:30:00.000Z',
      '2026-10-09T02:30:00.000Z',
      '2026-10-10T02:30:00.000Z',
    ]);
    expect(plan({ now: new Date('2026-10-08T03:00:00Z') }).planned).toHaveLength(2);
  });

  it('only uses the chosen weekdays', () => {
    // 8 Oct 2026 is a Thursday (4).
    const p = plan({ reminders: [reminder({ weekdays: [5] })] });
    expect(isoTimes(p)).toEqual(['2026-10-09T02:30:00.000Z']);
  });

  it('keeps 08:00 local across the US DST change', () => {
    const p = plan({
      timeZone: 'America/New_York',
      now: new Date('2026-03-07T05:00:00Z'), // 00:00 local on 7 March
      horizonDays: 2,
    });
    expect(isoTimes(p)).toEqual([
      '2026-03-07T13:00:00.000Z',
      '2026-03-08T12:00:00.000Z',
      '2026-03-09T12:00:00.000Z',
    ]);
  });

  it('never fires twice when clocks go back over a reminder time', () => {
    const p = plan({
      reminders: [reminder({ times: ['01:30'] })],
      prefs: { ...prefs, quietStart: '23:00', quietEnd: '01:00' },
      timeZone: 'America/New_York',
      now: new Date('2026-11-01T04:00:00Z'), // 00:00 local on 1 November
      horizonDays: 0,
    });
    expect(isoTimes(p)).toEqual(['2026-11-01T05:30:00.000Z']);
  });

  it('follows the device when it changes time zone', () => {
    const india = plan({ now: new Date('2026-10-08T12:00:00Z'), horizonDays: 0 });
    const usa = plan({
      now: new Date('2026-10-08T12:00:00Z'),
      timeZone: 'America/Los_Angeles',
      horizonDays: 0,
    });
    expect(india.planned).toHaveLength(0); // 08:00 IST already passed
    expect(usa.planned.map((n) => local(n.fireAt, 'America/Los_Angeles'))).toEqual(['8:00']);
  });

  it('skips times inside quiet hours, including ranges past midnight', () => {
    const p = plan({
      reminders: [reminder({ times: ['06:30', '08:00', '23:00'] })],
      horizonDays: 0,
    });
    expect(p.planned.map((n) => local(n.fireAt, 'Asia/Kolkata'))).toEqual(['8:00']);
    expect(p.skipped.map((s) => s.reason)).toEqual(['quiet_hours', 'quiet_hours']);
    expect(inQuietHours(22 * 60, '22:00', '07:00')).toBe(true);
    expect(inQuietHours(7 * 60, '22:00', '07:00')).toBe(false);
    expect(inQuietHours(13 * 60, '12:00', '14:00')).toBe(true);
    expect(inQuietHours(13 * 60, '09:00', '09:00')).toBe(false);
  });

  it('applies the daily limit by priority and counts what was already shown', () => {
    const many = reminder({ times: ['09:00', '10:00', '11:00', '12:00'] });
    const req = reminder({ id: 'req', kind: 'requirement', times: ['08:00'] });
    const p = plan({ reminders: [req, many], horizonDays: 0 });
    expect(p.planned.map((n) => local(n.fireAt, 'Asia/Kolkata'))).toEqual([
      '9:00',
      '10:00',
      '11:00',
    ]);
    expect(p.skipped.filter((s) => s.reason === 'daily_limit')).toHaveLength(2);

    const shown = plan({ reminders: [many], horizonDays: 0, shownPerDay: { '2026-10-08': 2 } });
    expect(shown.planned).toHaveLength(1);
  });

  it('caps the total so the OS limit is never hit', () => {
    const p = plan({
      reminders: [reminder({ times: ['08:00', '12:00', '16:00'] })],
      horizonDays: 30,
      maxScheduled: 10,
    });
    expect(p.planned).toHaveLength(10);
  });

  it('replaces regular times with a snoozed delivery', () => {
    const now = new Date('2026-10-08T02:30:00Z'); // 08:00 IST
    const until = snoozeUntil('1h', now, 'Asia/Kolkata');
    const p = plan({
      now,
      reminders: [reminder({ times: ['08:00', '08:30'], snoozedUntil: until.toISOString() })],
      horizonDays: 0,
    });
    expect(p.planned.map((n) => [local(n.fireAt, 'Asia/Kolkata'), n.snoozed])).toEqual([
      ['9:00', true],
    ]);
  });

  it('moves a snooze that ends in quiet hours to the end of quiet hours', () => {
    const now = new Date('2026-10-08T16:00:00Z'); // 21:30 IST
    const until = snoozeUntil('1h', now, 'Asia/Kolkata'); // 22:30, inside quiet hours
    const p = plan({
      now,
      reminders: [reminder({ times: [], snoozedUntil: until.toISOString() })],
    });
    expect(p.planned[0]!.fireAt.toISOString()).toBe('2026-10-09T01:30:00.000Z'); // 07:00 IST
    expect(
      afterQuietHours(new Date('2026-10-08T06:30:00Z'), prefs, 'Asia/Kolkata').toISOString(),
    ).toBe('2026-10-08T06:30:00.000Z');
  });
});

describe('snoozeUntil', () => {
  const now = new Date('2026-03-07T14:00:00Z'); // 09:00 in New York, the day before DST starts
  it('adds 10 minutes or an hour', () => {
    expect(snoozeUntil('10m', now, 'America/New_York').toISOString()).toBe(
      '2026-03-07T14:10:00.000Z',
    );
    expect(snoozeUntil('1h', now, 'America/New_York').toISOString()).toBe(
      '2026-03-07T15:00:00.000Z',
    );
  });
  it('keeps the wall-clock time for "tomorrow" across DST', () => {
    expect(snoozeUntil('tomorrow', now, 'America/New_York').toISOString()).toBe(
      '2026-03-08T13:00:00.000Z',
    );
  });
});

describe('smart reminders', () => {
  it('spreads times across waking hours', () => {
    const { spreadTimes } = jest.requireActual('../smart') as typeof import('../smart');
    expect(spreadTimes('09:00', '21:00', 5)).toEqual(['09:00', '12:00', '15:00', '18:00', '21:00']);
    expect(spreadTimes('22:00', '02:00', 3)).toEqual(['22:00', '00:00', '02:00']);
  });

  it('holds smart reminders back, but never scheduled ones', () => {
    const smart = reminder({ id: 's', kind: 'smart', times: ['09:00', '12:00', '15:00'] });
    const fixed = reminder({ id: 'f', times: ['12:30'] });
    const p = plan({
      reminders: [smart, fixed],
      horizonDays: 0,
      prefs: { ...prefs, dailyLimit: 5 },
      smartHoldUntil: { water: new Date('2026-10-08T07:00:00Z') }, // 12:30 IST
    });
    expect(p.planned.map((n) => [n.reminderId, local(n.fireAt, 'Asia/Kolkata')])).toEqual([
      ['f', '12:30'],
      ['s', '15:00'],
    ]);
  });
});
