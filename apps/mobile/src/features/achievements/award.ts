import type { ModuleId } from '@wellness/design-tokens';

import i18n from '@/i18n';
import { notificationContent } from '@/features/notifications/content';
import { getPermission, presentNow } from '@/features/notifications/device';
import { useInbox } from '@/features/notifications/inboxStore';
import { inQuietHours } from '@/features/notifications/planner';
import { useNotificationPrefs } from '@/features/notifications/prefsStore';
import { activeModules } from '@/features/profile/activeModules';
import { deviceTimeZone } from '@/lib/time/device';
import { localDateKey, toLocal } from '@/lib/time/zoned';

import { visibleAchievements, type ActivityEvent } from './catalog';
import { newlyEarned } from './engine';
import { useAchievements } from './store';

/**
 * Records something the person did and awards any achievements it unlocks.
 * Each new achievement goes to the notification center, and is sent as a
 * notification at most once, only if achievement notifications are on and
 * it is outside quiet hours and under the daily limit.
 */
export async function trackActivity(
  event: ActivityEvent,
  module: ModuleId | null = null,
  now = new Date(),
): Promise<string[]> {
  useAchievements.getState().record(event, localDateKey(now, deviceTimeZone()), module);
  return checkAchievements(now);
}

export async function checkAchievements(now = new Date()): Promise<string[]> {
  const state = useAchievements.getState();
  const fresh = newlyEarned(
    visibleAchievements(activeModules()),
    state.activity,
    new Set(state.earned.map((e) => e.id)),
  );
  if (!fresh.length) return [];
  state.markEarned(
    fresh.map((a) => a.id),
    now,
  );
  for (const achievement of fresh) {
    useInbox.getState().add(
      {
        type: 'achievement',
        module: achievement.module ?? null,
        titleKey: 'achievements.newBadge',
        bodyKey: `achievements.items.${achievement.id}.name`,
        href: '/achievements',
      },
      now,
    );
    await notifyOnce(achievement.id, achievement.module ?? null, now);
  }
  return fresh.map((a) => a.id);
}

async function notifyOnce(id: string, module: ModuleId | null, now: Date) {
  const prefs = useNotificationPrefs.getState();
  const earned = useAchievements.getState().earned.find((e) => e.id === id);
  if (!earned || earned.notifiedAt) return;
  if (!prefs.enabled || !prefs.types.achievement) return;
  if (module && prefs.modules[module] === false) return;
  const tz = deviceTimeZone();
  const local = toLocal(now, tz);
  if (inQuietHours(local.hour * 60 + local.minute, prefs.quietStart, prefs.quietEnd)) return;
  const day = localDateKey(now, tz);
  const inbox = useInbox.getState();
  if ((inbox.shownPerDay[day] ?? 0) >= prefs.dailyLimit) return;
  const permission = await getPermission();
  if (permission !== 'granted' && permission !== 'provisional') return;

  const { title, body } = notificationContent(
    { kind: 'achievement', module, templateKey: id },
    prefs.lockScreenPrivate,
    i18n.t,
  );
  await presentNow(title, body, { kind: 'achievement', module, href: '/achievements' });
  inbox.countShown(day);
  useAchievements.getState().markNotified(id, now);
}
