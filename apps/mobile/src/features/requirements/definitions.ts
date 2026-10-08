import type { ModuleId } from '@wellness/design-tokens';

import { addDays, fromLocal, toLocal } from '@/lib/time/zoned';

import type { SetupValues } from './store';

/**
 * The data each tracker needs to work. Each entry explains why it is asked
 * for (requirements.<id>.why in the locale files) on both the prompt and the form.
 */
export interface Requirement {
  id: 'waterGoal' | 'lastPeriod' | 'dueDate';
  module: ModuleId;
  field: keyof SetupValues;
}

export const requirements: Requirement[] = [
  { id: 'waterGoal', module: 'water', field: 'waterGoalMl' },
  { id: 'lastPeriod', module: 'cycle', field: 'lastPeriodStart' },
  { id: 'dueDate', module: 'pregnancy', field: 'dueDate' },
];

export function missingRequirements(
  values: SetupValues,
  activeModules: readonly ModuleId[],
): Requirement[] {
  return requirements.filter((r) => activeModules.includes(r.module) && values[r.field] === null);
}

export const NOTICE_INTERVAL_DAYS = 7;
/** Requirement notices go out mid-morning, local time. */
export const NOTICE_HOUR = 10;

/**
 * When the next requirement notification may fire, or null for none.
 * At most one a week, never before the in-app prompt has been seen, and
 * none at all once everything is filled in.
 */
export function nextRequirementNotice(input: {
  missing: Requirement[];
  promptSeenAt: Record<string, string>;
  lastNoticeAt: string | null;
  now: Date;
  timeZone: string;
}): { requirement: Requirement; fireAt: Date } | null {
  const requirement = input.missing.find((r) => input.promptSeenAt[r.id]);
  if (!requirement) return null;
  const last = input.lastNoticeAt ? new Date(input.lastNoticeAt) : null;
  // A notice already planned for the future keeps its time.
  if (last && last > input.now) return { requirement, fireAt: last };
  const earliest = last ? new Date(last.getTime() + NOTICE_INTERVAL_DAYS * 86_400_000) : input.now;
  const from = earliest > input.now ? earliest : input.now;
  const local = toLocal(from, input.timeZone);
  let fireAt = fromLocal({ ...local, hour: NOTICE_HOUR, minute: 0 }, input.timeZone);
  if (fireAt < from) {
    fireAt = fromLocal({ ...addDays(local, 1), hour: NOTICE_HOUR, minute: 0 }, input.timeZone);
  }
  return { requirement, fireAt };
}
