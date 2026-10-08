import { useConsent } from '@/features/consent/store';
import { useNotificationPrefs } from '@/features/notifications/prefsStore';
import { useProfile } from '@/features/profile/store';

/**
 * Every persisted on-device store, by its storage key. Used to rehydrate at
 * start-up, to build data exports and to wipe everything on deletion. New
 * module stores must be added here so export and deletion stay complete.
 */
export const persistedStores = {
  profile: useProfile,
  consent: useConsent,
  notificationPreferences: useNotificationPrefs,
} as const;

export type PersistedStoreKey = keyof typeof persistedStores;

export async function rehydrateAll(): Promise<void> {
  await Promise.all(Object.values(persistedStores).map((store) => store.persist.rehydrate()));
}
