import { ML_PER_FL_OZ, parseDateInput, type DateOrder, type UnitSystem } from '@/lib/region';
import { addDays, daysBetween, parseDateKey, type CivilDate } from '@/lib/time/zoned';

import type { Requirement } from './definitions';

/** Sensible bounds so a goal can never be extreme. */
export const WATER_GOAL_ML = { min: 500, max: 5000 } as const;

export const waterBounds = (units: UnitSystem) =>
  units === 'imperial'
    ? {
        min: Math.ceil(WATER_GOAL_ML.min / ML_PER_FL_OZ),
        max: Math.floor(WATER_GOAL_ML.max / ML_PER_FL_OZ),
        unit: 'fl oz',
      }
    : { ...WATER_GOAL_ML, unit: 'ml' };

export type ValidationResult =
  | { ok: true; value: number | string }
  | { ok: false; error: 'range' | 'invalidDate' | 'future' | 'tooOld' | 'dueRange' };

/** Checks what was typed into a requirement form and converts it to the stored value. */
export function validateRequirement(
  id: Requirement['id'],
  input: string,
  ctx: { units: UnitSystem; dateOrder: DateOrder; today: CivilDate },
): ValidationResult {
  if (id === 'waterGoal') {
    const n = Number(input.replace(',', '.'));
    const bounds = waterBounds(ctx.units);
    if (!Number.isFinite(n) || n < bounds.min || n > bounds.max)
      return { ok: false, error: 'range' };
    return { ok: true, value: Math.round(ctx.units === 'imperial' ? n * ML_PER_FL_OZ : n) };
  }
  const key = parseDateInput(input, ctx.dateOrder);
  const date = key ? parseDateKey(key) : null;
  if (!key || !date) return { ok: false, error: 'invalidDate' };
  const diff = daysBetween(ctx.today, date);
  if (id === 'lastPeriod') {
    if (diff > 0) return { ok: false, error: 'future' };
    if (diff < -365) return { ok: false, error: 'tooOld' };
  } else {
    // A due date from two weeks ago up to 42 weeks ahead.
    if (diff < -14 || daysBetween(ctx.today, addDays(ctx.today, 42 * 7)) < diff) {
      return { ok: false, error: 'dueRange' };
    }
  }
  return { ok: true, value: key };
}
