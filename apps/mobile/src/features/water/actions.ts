import { trackActivity } from '@/features/achievements/award';
import { useRequirements } from '@/features/requirements/store';
import { deviceTimeZone } from '@/lib/time/device';
import { localDateKey } from '@/lib/time/zoned';

import { crossesGoal, totalForDay, type DrinkType, type WaterEntry } from './model';
import { useWater } from './store';

/** Logs a drink for today and records progress toward achievements. */
export async function logDrink(
  amountMl: number,
  drink: DrinkType,
  now = new Date(),
): Promise<WaterEntry> {
  const day = localDateKey(now, deviceTimeZone());
  const before = totalForDay(useWater.getState().entries, day);
  const entry = useWater.getState().add({ amountMl, drink, at: now, day });
  await trackActivity('log_entry', 'water', now);
  if (crossesGoal(before, entry.amountMl, useRequirements.getState().waterGoalMl)) {
    await trackActivity('water_goal_met', 'water', now);
  }
  return entry;
}
