import { trackActivity } from '@/features/achievements/award';
import { useRequirements } from '@/features/requirements/store';

import type { PregnancySymptom } from './model';
import { usePregnancy } from './store';

export async function logSymptoms(
  day: string,
  symptoms: PregnancySymptom[],
  note: string,
  now = new Date(),
) {
  const entry = usePregnancy.getState().addSymptoms({ at: now.toISOString(), day, symptoms, note });
  await trackActivity('log_entry', 'pregnancy', now);
  return entry;
}

/** Weight is logged for the person's own record only: no goals, no streaks, no achievements for it. */
export async function logWeight(day: string, kg: number, now = new Date()) {
  usePregnancy.getState().saveWeight(day, kg);
  await trackActivity('log_entry', 'pregnancy', now);
}

export async function finishKickSession(id: string, now = new Date()) {
  const store = usePregnancy.getState();
  const session = store.kicks.find((k) => k.id === id);
  store.endKicks(id, now);
  if (session && session.count > 0) {
    await trackActivity('log_entry', 'pregnancy', now);
    await trackActivity('kick_session', 'pregnancy', now);
  }
}

export async function toggleBagItem(id: string, now = new Date()) {
  const store = usePregnancy.getState();
  store.toggleBagItem(id);
  const bag = usePregnancy.getState().bag;
  if (bag.length > 0 && bag.every((b) => b.done)) {
    await trackActivity('hospital_bag_packed', 'pregnancy', now);
  }
}

export function setDueDate(day: string) {
  useRequirements.getState().setValue('dueDate', day);
  usePregnancy.getState().setStatus('active');
}

/**
 * Stops pregnancy tracking quietly: hides the content and appointment
 * reminders. Logged data stays until the person deletes it.
 */
export function endPregnancyTracking() {
  usePregnancy.getState().setStatus('ended');
}

/** Deletes every pregnancy log and the due date. */
export function deletePregnancyData() {
  usePregnancy.getState().reset();
  useRequirements.getState().setValue('dueDate', null);
}
