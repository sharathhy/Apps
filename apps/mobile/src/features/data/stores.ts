import { useAchievements } from '@/features/achievements/store';
import { useConsent } from '@/features/consent/store';
import { useInbox } from '@/features/notifications/inboxStore';
import { useNotificationPrefs } from '@/features/notifications/prefsStore';
import { useReminders } from '@/features/notifications/remindersStore';
import { useProfile } from '@/features/profile/store';
import { useMood } from '@/features/mood/store';
import { useRequirements } from '@/features/requirements/store';
import { useSleep } from '@/features/sleep/store';
import { useWater } from '@/features/water/store';

/**
 * Every persisted on-device store, by its storage key. Used to rehydrate at
 * start-up, to build data exports and to wipe everything on deletion. New
 * module stores must be added here so export and deletion stay complete.
 */
export const persistedStores = {
  profile: useProfile,
  consent: useConsent,
  notificationPreferences: useNotificationPrefs,
  reminders: useReminders,
  notificationCenter: useInbox,
  achievements: useAchievements,
  setupDetails: useRequirements,
  water: useWater,
  mood: useMood,
  sleep: useSleep,
} as const;

export type PersistedStoreKey = keyof typeof persistedStores;

export async function rehydrateAll(): Promise<void> {
  await Promise.all(Object.values(persistedStores).map((store) => store.persist.rehydrate()));
}
