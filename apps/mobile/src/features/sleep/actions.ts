import { trackActivity } from '@/features/achievements/award';

import type { SleepEntry } from './model';
import { useSleep } from './store';

export async function logSleep(entry: Omit<SleepEntry, 'id' | 'updatedAt'>, now = new Date()) {
  const saved = useSleep.getState().save(entry, now);
  await trackActivity('log_entry', 'sleep', now);
  await trackActivity('sleep_logged', 'sleep', now);
  return saved;
}
