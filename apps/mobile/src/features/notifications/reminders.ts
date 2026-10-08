import type { ModuleId } from '@wellness/design-tokens';

import type { notificationTypes } from './types';

export type ReminderKind = (typeof notificationTypes)[number];

/**
 * A repeating reminder at local wall-clock times. Stored on the device and,
 * when signed in, in the `reminders` table so it survives a reinstall.
 */
export interface Reminder {
  id: string;
  module: ModuleId | null;
  kind: ReminderKind;
  /** Picks the wording, e.g. "water.drink". See notificationContent. */
  templateKey: string;
  /** Local "HH:MM" times. */
  times: string[];
  /** ISO weekdays (1 Monday … 7 Sunday). Empty means every day. */
  weekdays: number[];
  /** The zone the times were set in. Times follow the device when it changes zone. */
  timezone: string;
  enabled: boolean;
  /** ISO instant of a one-off snoozed delivery, if any. */
  snoozedUntil: string | null;
  updatedAt: string;
}

/** Built-in wording per module. Every message is neutral: no guilt, no pressure. */
export const reminderTemplates: Record<ModuleId, string> = {
  water: 'water.drink',
  mood: 'mood.checkIn',
  sleep: 'sleep.windDown',
  cycle: 'cycle.log',
  pregnancy: 'pregnancy.log',
  nutrition: 'nutrition.log',
};

export const defaultReminderTimes: Record<ModuleId, string[]> = {
  water: ['10:00', '13:00', '16:00'],
  mood: ['20:00'],
  sleep: ['21:30'],
  cycle: ['09:00'],
  pregnancy: ['09:00'],
  nutrition: ['13:00'],
};
