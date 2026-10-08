import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { PlannedNotification } from './planner';
import { snoozeOptions } from './snooze';

/**
 * The thin layer over the operating system's notification APIs. On the web
 * there are no OS notifications: everything appears in the in-app
 * notification center instead.
 */

export const supportsDeviceNotifications = Platform.OS !== 'web';

/** Identifiers of everything this app schedules start with this, so nothing else is touched. */
export const SCHEDULE_PREFIX = 'wellness:';
export const REMINDER_CATEGORY = 'reminder';
export const ANDROID_CHANNEL = 'reminders';

export type PermissionState = 'granted' | 'provisional' | 'denied' | 'undetermined' | 'unsupported';

function toState(status: Notifications.NotificationPermissionsStatus): PermissionState {
  if (status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'provisional';
  if (status.granted) return 'granted';
  return status.canAskAgain ? 'undetermined' : 'denied';
}

export async function getPermission(): Promise<PermissionState> {
  if (!supportsDeviceNotifications) return 'unsupported';
  return toState(await Notifications.getPermissionsAsync());
}

/**
 * Asks the OS for permission. Only called after the person has turned
 * notifications on and seen what they will receive. On Android 13+ the
 * channel must exist first, or the system prompt does not appear.
 */
export async function requestPermission(): Promise<PermissionState> {
  if (!supportsDeviceNotifications) return 'unsupported';
  await ensureChannel();
  return toState(
    await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    }),
  );
}

export async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    // Private: the lock screen shows that a notification exists, not its text.
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
}

/** Snooze buttons on reminder notifications. Titles are translated by the caller. */
export async function registerCategories(labels: Record<(typeof snoozeOptions)[number], string>) {
  if (!supportsDeviceNotifications) return;
  await Notifications.setNotificationCategoryAsync(
    REMINDER_CATEGORY,
    snoozeOptions.map((option) => ({
      identifier: `snooze:${option}`,
      buttonTitle: labels[option],
      options: { opensAppToForeground: false },
    })),
  );
}

export function configureForegroundPresentation() {
  if (!supportsDeviceNotifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export interface NotificationData extends Record<string, unknown> {
  reminderId?: string;
  kind?: string;
  module?: string | null;
  href?: string;
}

const identifierFor = (item: PlannedNotification, contentKey: string) =>
  `${SCHEDULE_PREFIX}${item.key}#${contentKey}`;

/**
 * Makes the OS schedule match the plan: cancels what is no longer wanted and
 * adds what is missing. Identifiers include a short content key, so changing
 * the wording (for example lock-screen privacy) replaces the notification.
 */
export async function applySchedule(
  plan: PlannedNotification[],
  contentFor: (item: PlannedNotification) => { title: string; body: string },
): Promise<{ scheduled: number; cancelled: number }> {
  if (!supportsDeviceNotifications) return { scheduled: 0, cancelled: 0 };
  const wanted = new Map<string, { item: PlannedNotification; title: string; body: string }>();
  for (const item of plan) {
    const content = contentFor(item);
    wanted.set(identifierFor(item, hash(content.title + content.body)), { item, ...content });
  }
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  let cancelled = 0;
  const present = new Set<string>();
  for (const request of existing) {
    if (!request.identifier.startsWith(SCHEDULE_PREFIX)) continue;
    if (wanted.has(request.identifier)) {
      present.add(request.identifier);
    } else {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
      cancelled++;
    }
  }
  let scheduled = 0;
  for (const [identifier, { item, title, body }] of wanted) {
    if (present.has(identifier)) continue;
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title,
        body,
        categoryIdentifier: REMINDER_CATEGORY,
        data: {
          reminderId: item.reminderId,
          kind: item.kind,
          module: item.module,
        } satisfies NotificationData,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: item.fireAt,
        channelId: ANDROID_CHANNEL,
      },
    });
    scheduled++;
  }
  return { scheduled, cancelled };
}

/** Shows a notification now (used for achievements). */
export async function presentNow(title: string, body: string, data: NotificationData) {
  if (!supportsDeviceNotifications) return;
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: { channelId: ANDROID_CHANNEL },
  });
}

/** Small stable string hash (djb2), only used to detect wording changes. */
export function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
