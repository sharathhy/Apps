import { trackActivity } from '@/features/achievements/award';
import { useRequirements } from '@/features/requirements/store';

import type { CycleDayLog } from './model';
import { useCycle } from './store';

/** Keeps the setup value ("last period start") in step with the logged periods. */
function syncLastPeriodStart() {
  const latest = useCycle.getState().periods[0]?.start ?? null;
  const req = useRequirements.getState();
  if (latest && (!req.lastPeriodStart || latest > req.lastPeriodStart)) {
    req.setValue('lastPeriodStart', latest);
  }
}

export async function logPeriodStart(day: string, now = new Date()) {
  const period = useCycle.getState().addPeriod(day, now);
  syncLastPeriodStart();
  await trackActivity('log_entry', 'cycle', now);
  await trackActivity('period_logged', 'cycle', now);
  return period;
}

/**
 * Deletes a period. When it was the one given during setup, the setup value
 * moves to the latest remaining period, or is cleared.
 */
export function deletePeriod(id: string) {
  const cycle = useCycle.getState();
  const removed = cycle.periods.find((p) => p.id === id);
  cycle.removePeriod(id);
  const req = useRequirements.getState();
  if (removed && req.lastPeriodStart === removed.start) {
    req.setValue('lastPeriodStart', useCycle.getState().periods[0]?.start ?? null);
  }
}

/** Removes the start given during setup when no logged period matches it. */
export function clearSetupStart() {
  useRequirements
    .getState()
    .setValue('lastPeriodStart', useCycle.getState().periods[0]?.start ?? null);
}

export async function saveCycleDay(log: Omit<CycleDayLog, 'updatedAt'>, now = new Date()) {
  useCycle.getState().saveLog(log, now);
  if (log.flow || log.symptoms.length || log.note.trim()) {
    await trackActivity('log_entry', 'cycle', now);
  }
}
