import type { TFunction } from 'i18next';

import { foodByRef, foodName } from './foods';
import { units, type MealItem, type Unit } from './model';

const isUnit = (u: string): u is Unit => (units as readonly string[]).includes(u);

/** "2 katori", "1½ cups" style text; custom units are shown as the person typed them. */
export function amountLabel(t: TFunction, quantity: number, unit: string): string {
  return isUnit(unit)
    ? t(`nutrition.units.${unit}`, { count: quantity })
    : t('nutrition.customAmount', { count: quantity, unit });
}

/** Built-in foods are shown in the app's language; others as saved. */
export function itemName(item: Pick<MealItem, 'foodRef' | 'name'>, language: string): string {
  const food = foodByRef.get(item.foodRef);
  return food ? foodName(food, language) : item.name;
}

/** Grams or kcal with at most one decimal. */
export function formatAmount(n: number, language: string): string {
  return n.toLocaleString(language === 'hi' ? 'hi-IN' : 'en', { maximumFractionDigits: 1 });
}
