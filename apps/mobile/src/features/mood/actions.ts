import { trackActivity } from '@/features/achievements/award';
import { deviceTimeZone } from '@/lib/time/device';
import { localDateKey } from '@/lib/time/zoned';

import type { BreathingPatternId, MoodLevel, MoodTag } from './model';
import { useMood } from './store';

const today = (now: Date) => localDateKey(now, deviceTimeZone());

export async function checkIn(mood: MoodLevel, tags: MoodTag[], note: string, now = new Date()) {
  const entry = useMood.getState().addEntry({ mood, tags, note, at: now, day: today(now) });
  await trackActivity('log_entry', 'mood', now);
  await trackActivity('mood_check_in', 'mood', now);
  return entry;
}

export async function saveJournalEntry(
  body: string,
  promptKey: string | null,
  id?: string,
  now = new Date(),
) {
  const entry = useMood.getState().saveJournal({ id, body, promptKey, at: now, day: today(now) });
  if (!id) {
    await trackActivity('log_entry', 'mood', now);
    await trackActivity('journal_entry', 'mood', now);
  }
  return entry;
}

/** Sessions shorter than a minute are not saved, so a quick look does not count. */
export const MIN_BREATHING_SECONDS = 60;

export async function finishBreathing(
  pattern: BreathingPatternId,
  seconds: number,
  now = new Date(),
) {
  if (seconds < MIN_BREATHING_SECONDS) return null;
  const session = useMood.getState().addBreathing(pattern, seconds, now);
  await trackActivity('log_entry', 'mood', now);
  await trackActivity('breathing_session', 'mood', now);
  return session;
}
