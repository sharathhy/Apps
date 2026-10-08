import type { ModuleId } from '@wellness/design-tokens';

import {
  addDays,
  clockMinutes,
  dateKey,
  fromLocal,
  isoWeekday,
  parseClock,
  toLocal,
} from '@/lib/time/zoned';

import type { Reminder, ReminderKind } from './reminders';
import type { NotificationPreferences } from './types';

export interface PlannedNotification {
  /** Stable id for the OS schedule: reminder id plus fire time. */
  key: string;
  reminderId: string;
  module: ModuleId | null;
  kind: ReminderKind;
  templateKey: string;
  fireAt: Date;
  snoozed: boolean;
}

export type SkipReason = 'quiet_hours' | 'daily_limit' | 'cap';

export interface PlanInput {
  reminders: Reminder[];
  prefs: NotificationPreferences;
  now: Date;
  timeZone: string;
  /** Modules the person can see; reminders for other modules never fire. */
  visibleModules: readonly ModuleId[];
  /** One-off notices (e.g. a requirement reminder) planned elsewhere. */
  oneOffs?: Omit<PlannedNotification, 'key' | 'snoozed'>[];
  /** Notifications already shown per local date ("YYYY-MM-DD"); they count toward the limit. */
  shownPerDay?: Record<string, number>;
  horizonDays?: number;
  /** iOS keeps at most 64 pending notifications; stay well under it. */
  maxScheduled?: number;
}

export interface Plan {
  planned: PlannedNotification[];
  skipped: { item: PlannedNotification; reason: SkipReason }[];
}

/** Lower is more important when the daily limit forces a choice. */
const priority: Record<ReminderKind, number> = {
  scheduled: 0,
  requirement: 1,
  smart: 2,
  insight: 3,
  achievement: 4,
};

/** True when local "HH:MM" falls inside quiet hours (which may wrap past midnight). */
export function inQuietHours(minutes: number, quietStart: string, quietEnd: string): boolean {
  const start = clockMinutes(quietStart);
  const end = clockMinutes(quietEnd);
  if (start === end) return false;
  return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

const localMinutes = (instant: Date, timeZone: string) => {
  const l = toLocal(instant, timeZone);
  return l.hour * 60 + l.minute;
};

/** The first instant at or after `instant` that is outside quiet hours. */
export function afterQuietHours(instant: Date, prefs: NotificationPreferences, timeZone: string) {
  if (!inQuietHours(localMinutes(instant, timeZone), prefs.quietStart, prefs.quietEnd)) {
    return instant;
  }
  const end = parseClock(prefs.quietEnd)!;
  const local = toLocal(instant, timeZone);
  const sameDay = fromLocal({ ...local, ...end }, timeZone);
  return sameDay > instant ? sameDay : fromLocal({ ...addDays(local, 1), ...end }, timeZone);
}

export function isReminderAllowed(
  reminder: Pick<Reminder, 'kind' | 'module'>,
  prefs: NotificationPreferences,
  visibleModules: readonly ModuleId[],
): boolean {
  if (!prefs.enabled || !prefs.types[reminder.kind]) return false;
  if (reminder.module === null) return true;
  return visibleModules.includes(reminder.module) && prefs.modules[reminder.module] !== false;
}

/**
 * Works out exactly which notifications to hand to the OS for the next few
 * days. Pure, so it is unit tested across time zones and DST changes. The
 * app re-runs it on start, when it returns to the foreground (which catches
 * time zone changes and new days) and whenever reminders or settings change.
 */
export function planNotifications(input: PlanInput): Plan {
  const { prefs, now, timeZone, visibleModules } = input;
  const horizon = input.horizonDays ?? 7;
  const cap = input.maxScheduled ?? 48;
  const candidates: PlannedNotification[] = [];
  const skipped: Plan['skipped'] = [];
  if (!prefs.enabled) return { planned: [], skipped };

  const today = toLocal(now, timeZone);
  for (const reminder of input.reminders) {
    if (!reminder.enabled || !isReminderAllowed(reminder, prefs, visibleModules)) continue;
    const base = {
      reminderId: reminder.id,
      module: reminder.module,
      kind: reminder.kind,
      templateKey: reminder.templateKey,
    };
    const snoozedUntil = reminder.snoozedUntil ? new Date(reminder.snoozedUntil) : null;
    const snoozeActive = snoozedUntil !== null && snoozedUntil > now;

    for (let offset = 0; offset <= horizon; offset++) {
      const date = addDays(today, offset);
      if (reminder.weekdays.length > 0 && !reminder.weekdays.includes(isoWeekday(date))) continue;
      for (const time of reminder.times) {
        const clock = parseClock(time);
        if (!clock) continue;
        const fireAt = fromLocal({ ...date, ...clock }, timeZone);
        if (fireAt <= now) continue;
        // Snoozing means "not now": regular times before the snooze end are dropped.
        if (snoozeActive && fireAt <= snoozedUntil) continue;
        const item = {
          ...base,
          key: `${reminder.id}@${fireAt.toISOString()}`,
          fireAt,
          snoozed: false,
        };
        if (inQuietHours(localMinutes(fireAt, timeZone), prefs.quietStart, prefs.quietEnd)) {
          skipped.push({ item, reason: 'quiet_hours' });
        } else {
          candidates.push(item);
        }
      }
    }
    if (snoozeActive) {
      // A snooze that ends in quiet hours waits until they are over.
      const fireAt = afterQuietHours(snoozedUntil, prefs, timeZone);
      candidates.push({ ...base, key: `${reminder.id}@snooze`, fireAt, snoozed: true });
    }
  }

  for (const oneOff of input.oneOffs ?? []) {
    if (!isReminderAllowed(oneOff, prefs, visibleModules) || oneOff.fireAt <= now) continue;
    const fireAt = afterQuietHours(oneOff.fireAt, prefs, timeZone);
    candidates.push({ ...oneOff, fireAt, key: `${oneOff.reminderId}@once`, snoozed: false });
  }

  // Daily limit per local day, keeping the most important first, then the earliest.
  const byDay = new Map<string, PlannedNotification[]>();
  for (const item of candidates) {
    const day = dateKey(toLocal(item.fireAt, timeZone));
    byDay.set(day, [...(byDay.get(day) ?? []), item]);
  }
  const kept: PlannedNotification[] = [];
  for (const [day, items] of byDay) {
    const room = Math.max(0, prefs.dailyLimit - (input.shownPerDay?.[day] ?? 0));
    items
      .sort(
        (a, b) => priority[a.kind] - priority[b.kind] || a.fireAt.getTime() - b.fireAt.getTime(),
      )
      .forEach((item, i) =>
        i < room ? kept.push(item) : skipped.push({ item, reason: 'daily_limit' }),
      );
  }

  kept.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
  for (const item of kept.slice(cap)) skipped.push({ item, reason: 'cap' });
  return { planned: kept.slice(0, cap), skipped };
}
