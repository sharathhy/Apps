import type { ModuleId } from '@wellness/design-tokens';

import { useAchievements, type EarnedAchievement } from '@/features/achievements/store';
import { supabase } from '@/lib/supabase';

import { useNotificationPrefs } from './prefsStore';
import type { Reminder, ReminderKind } from './reminders';
import { useReminders } from './remindersStore';
import { defaultNotificationPreferences, type NotificationPreferences } from './types';

/**
 * Keeps reminders, notification settings and earned achievements in the
 * account, so a reinstall or a new phone gets them back. Everything here is
 * a no-op when signed out or when accounts are not configured.
 */

interface ReminderRow {
  id: string;
  module: ModuleId | null;
  kind: ReminderKind;
  template_key: string;
  schedule: { times: string[]; weekdays: number[] };
  timezone: string;
  enabled: boolean;
  snoozed_until: string | null;
  updated_at: string;
}

export const reminderToRow = (r: Reminder): ReminderRow => ({
  id: r.id,
  module: r.module,
  kind: r.kind,
  template_key: r.templateKey,
  schedule: { times: r.times, weekdays: r.weekdays },
  timezone: r.timezone,
  enabled: r.enabled,
  snoozed_until: r.snoozedUntil,
  updated_at: r.updatedAt,
});

export const reminderFromRow = (row: ReminderRow): Reminder => ({
  id: row.id,
  module: row.module,
  kind: row.kind,
  templateKey: row.template_key,
  times: Array.isArray(row.schedule?.times) ? row.schedule.times : [],
  weekdays: Array.isArray(row.schedule?.weekdays) ? row.schedule.weekdays : [],
  timezone: row.timezone,
  enabled: row.enabled,
  snoozedUntil: row.snoozed_until,
  updatedAt: row.updated_at,
});

const prefsToRow = (p: NotificationPreferences) => ({
  global_enabled: p.enabled,
  types: p.types,
  modules: p.modules,
  quiet_start: p.quietStart,
  quiet_end: p.quietEnd,
  daily_limit: p.dailyLimit,
  lock_screen_private: p.lockScreenPrivate,
});

async function signedInUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function pushNotificationData(): Promise<void> {
  const userId = await signedInUserId();
  if (!supabase || !userId) return;
  const { reminders } = useReminders.getState();
  const prefs = useNotificationPrefs.getState();
  const { earned } = useAchievements.getState();

  if (reminders.length) {
    await supabase
      .from('reminders')
      .upsert(reminders.map((r) => ({ ...reminderToRow(r), user_id: userId })));
  }
  await supabase.from('notification_preferences').upsert({ user_id: userId, ...prefsToRow(prefs) });
  if (earned.length) {
    await supabase.from('achievements_earned').upsert(
      earned.map((e) => ({
        user_id: userId,
        achievement_key: e.id,
        earned_at: e.earnedAt,
        notified_at: e.notifiedAt,
      })),
      { onConflict: 'user_id,achievement_key' },
    );
  }
}

export async function deleteRemoteReminder(id: string): Promise<void> {
  const userId = await signedInUserId();
  if (!supabase || !userId) return;
  await supabase.from('reminders').delete().eq('id', id);
}

/**
 * Restores from the account after a reinstall or on a new device. Local data
 * wins when there is any, so nothing set up offline is overwritten.
 */
export async function restoreNotificationData(): Promise<{ reminders: number }> {
  const userId = await signedInUserId();
  if (!supabase || !userId) return { reminders: 0 };

  const [reminders, prefs, earned] = await Promise.all([
    supabase.from('reminders').select('*'),
    supabase.from('notification_preferences').select('*').maybeSingle(),
    supabase.from('achievements_earned').select('*'),
  ]);

  let restored = 0;
  if (!reminders.error && reminders.data?.length && !useReminders.getState().reminders.length) {
    useReminders.getState().replaceAll((reminders.data as ReminderRow[]).map(reminderFromRow));
    restored = reminders.data.length;
  }

  const local = useNotificationPrefs.getState();
  const untouched =
    !local.enabled &&
    JSON.stringify(local.types) === JSON.stringify(defaultNotificationPreferences.types);
  if (!prefs.error && prefs.data && untouched) {
    const row = prefs.data as Record<string, unknown>;
    useNotificationPrefs.setState({
      enabled: Boolean(row.global_enabled),
      types: { ...defaultNotificationPreferences.types, ...(row.types as object) },
      modules: (row.modules as NotificationPreferences['modules']) ?? {},
      quietStart: String(row.quiet_start ?? '22:00').slice(0, 5),
      quietEnd: String(row.quiet_end ?? '07:00').slice(0, 5),
      dailyLimit: Number(row.daily_limit ?? 3),
      lockScreenPrivate: row.lock_screen_private !== false,
    });
  }

  if (!earned.error && earned.data) {
    useAchievements.getState().mergeEarned(
      (
        earned.data as { achievement_key: string; earned_at: string; notified_at: string | null }[]
      ).map((row): EarnedAchievement => ({
        id: row.achievement_key,
        earnedAt: row.earned_at,
        notifiedAt: row.notified_at,
      })),
    );
  }
  return { reminders: restored };
}
