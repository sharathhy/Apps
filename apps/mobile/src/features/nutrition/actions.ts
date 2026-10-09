import { trackActivity } from '@/features/achievements/award';

import { isColourfulDay, type MealType } from './model';
import { useNutrition, type NewItem } from './store';

/** Logs a food to a meal and records progress toward achievements. */
export async function logFood(type: MealType, day: string, item: NewItem, now = new Date()) {
  const saved = useNutrition.getState().addItem(type, day, item, now);
  await trackActivity('meal_logged', 'nutrition', now);
  const { meals, items } = useNutrition.getState();
  const dayMeals = new Set(meals.filter((m) => m.day === day).map((m) => m.id));
  if (isColourfulDay(items.filter((i) => dayMeals.has(i.mealId)))) {
    await trackActivity('colourful_day', 'nutrition', now);
  }
  return saved;
}

export async function markHomeCooked(mealId: string, homeCooked: boolean, now = new Date()) {
  useNutrition.getState().setHomeCooked(mealId, homeCooked, now);
  if (homeCooked) await trackActivity('home_cooked_meal', 'nutrition', now);
}
