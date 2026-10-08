import { addDays, fromLocal, toLocal } from '@/lib/time/zoned';

export const snoozeOptions = ['10m', '1h', 'tomorrow'] as const;
export type SnoozeOption = (typeof snoozeOptions)[number];

/**
 * When a snoozed notification should come back. "Tomorrow" keeps the same
 * wall-clock time, so it is right even when the clocks change overnight.
 */
export function snoozeUntil(option: SnoozeOption, now: Date, timeZone: string): Date {
  switch (option) {
    case '10m':
      return new Date(now.getTime() + 10 * 60_000);
    case '1h':
      return new Date(now.getTime() + 60 * 60_000);
    case 'tomorrow': {
      const local = toLocal(now, timeZone);
      return fromLocal({ ...addDays(local, 1), hour: local.hour, minute: local.minute }, timeZone);
    }
  }
}
