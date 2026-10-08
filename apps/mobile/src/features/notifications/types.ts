import type { ModuleId } from '@wellness/design-tokens';

/** Notification types people can switch on or off. System notices cannot be turned off. */
export const notificationTypes = [
  'scheduled',
  'smart',
  'achievement',
  'requirement',
  'insight',
] as const;
export type NotificationType = (typeof notificationTypes)[number] | 'system';

export interface NotificationPreferences {
  /** Master switch. Off until the person opts in. */
  enabled: boolean;
  types: Record<(typeof notificationTypes)[number], boolean>;
  modules: Partial<Record<ModuleId, boolean>>;
  /** Local "HH:MM". */
  quietStart: string;
  quietEnd: string;
  /** 1 to 5, default 3. */
  dailyLimit: number;
  /** Hide message text on the lock screen. On by default. */
  lockScreenPrivate: boolean;
}

export const defaultNotificationPreferences: NotificationPreferences = {
  enabled: false,
  types: { scheduled: false, smart: false, achievement: false, requirement: false, insight: false },
  modules: {},
  quietStart: '22:00',
  quietEnd: '07:00',
  dailyLimit: 3,
  lockScreenPrivate: true,
};

export const MAX_DAILY_LIMIT = 5;
export const MIN_DAILY_LIMIT = 1;

export function clampDailyLimit(value: number): number {
  if (!Number.isFinite(value)) return defaultNotificationPreferences.dailyLimit;
  return Math.min(MAX_DAILY_LIMIT, Math.max(MIN_DAILY_LIMIT, Math.round(value)));
}
