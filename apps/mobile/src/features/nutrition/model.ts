/**
 * Nutrition: meals made of food items, each in a food group. The balanced
 * plate view works from food groups alone, so every food counts toward it
 * even when its nutrient values are unknown. There are no calorie targets,
 * deficits or "good"/"bad" foods anywhere in this module.
 *
 * Balanced plate guidance:
 * - ICMR-National Institute of Nutrition, Dietary Guidelines for Indians
 *   (2024), "My Plate for the Day". https://www.nin.res.in/
 * - USDA MyPlate. https://www.myplate.gov/
 */

export const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = (typeof mealTypes)[number];

/** Same list as the food_group check in supabase/migrations. */
export const foodGroups = [
  'grains',
  'pulses',
  'vegetables',
  'fruits',
  'dairy',
  'protein',
  'nutsSeeds',
  'fats',
  'sweets',
  'drinks',
  'mixed',
  'other',
] as const;
export type FoodGroup = (typeof foodGroups)[number];

/** Household and standard measures. Shown translated; never converted to grams unless the food says how. */
export const units = [
  'katori',
  'piece',
  'glass',
  'cup',
  'tbsp',
  'plate',
  'bowl',
  'slice',
  'serving',
  'g',
  'ml',
  'oz',
  'can',
] as const;
export type Unit = (typeof units)[number];

export interface Nutrients {
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
}
export const nutrientKeys = ['protein', 'carbs', 'fat', 'fiber'] as const;
export const emptyNutrients: Nutrients = {
  kcal: null,
  protein: null,
  carbs: null,
  fat: null,
  fiber: null,
};

export interface Meal {
  id: string;
  type: MealType;
  /** ISO instant the meal was logged. */
  at: string;
  /** Local day it counts toward. */
  day: string;
  homeCooked: boolean;
  updatedAt: string;
}

export interface MealItem {
  id: string;
  mealId: string;
  /** "in:roti", "us:oatmeal", "custom:<id>" or "off:<barcode>". */
  foodRef: string;
  name: string;
  quantity: number;
  unit: Unit | string;
  group: FoodGroup;
  /** Totals for this item, when the food's values are known. */
  nutrients: Nutrients | null;
  updatedAt: string;
}

export interface CustomFood {
  id: string;
  name: string;
  barcode: string | null;
  /** What one serving is, in the person's words ("1 bar", "1 katori"). */
  servingUnit: string;
  servingGrams: number | null;
  /** Per serving. */
  nutrients: Nutrients;
  group: FoodGroup;
  /** Where the values came from: typed in, or Open Food Facts. */
  source: 'manual' | 'openFoodFacts';
  updatedAt: string;
}

/** Limits keep every item total inside the database's number columns. */
export const MAX_QUANTITY = 20;
export const NUTRIENT_LIMITS = { kcal: 4000, protein: 400, carbs: 400, fat: 400, fiber: 400 };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Nutrients for `quantity` servings, rounded like the database stores them. */
export function scaleNutrients(per: Nutrients, quantity: number): Nutrients {
  const scale = (v: number | null) => (v === null ? null : round2(v * quantity));
  return {
    kcal: scale(per.kcal),
    protein: scale(per.protein),
    carbs: scale(per.carbs),
    fat: scale(per.fat),
    fiber: scale(per.fiber),
  };
}

export function hasAnyNutrient(n: Nutrients | null): n is Nutrients {
  return !!n && Object.values(n).some((v) => v !== null);
}

export interface DayTotals {
  /** Sums over items whose value is known. */
  nutrients: Record<keyof Nutrients, number>;
  /** Items with at least one known value, and all items. */
  itemsWithValues: number;
  items: number;
}

export function dayTotals(items: readonly MealItem[]): DayTotals {
  const nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  let itemsWithValues = 0;
  for (const item of items) {
    if (!hasAnyNutrient(item.nutrients)) continue;
    itemsWithValues++;
    for (const k of Object.keys(nutrients) as (keyof Nutrients)[]) {
      nutrients[k] = round2(nutrients[k] + (item.nutrients[k] ?? 0));
    }
  }
  return { nutrients, itemsWithValues, items: items.length };
}

export type Region = 'IN' | 'US';

/**
 * The plate sections each guide describes. ICMR-NIN groups pulses, eggs and
 * meat together and adds nuts and seeds; MyPlate has protein foods and dairy.
 */
export type PlateSectionId =
  'vegetables' | 'fruits' | 'grains' | 'pulsesProtein' | 'dairy' | 'nutsSeeds' | 'protein';

export const plateSections: Record<Region, { id: PlateSectionId; groups: FoodGroup[] }[]> = {
  IN: [
    { id: 'vegetables', groups: ['vegetables'] },
    { id: 'fruits', groups: ['fruits'] },
    { id: 'grains', groups: ['grains'] },
    { id: 'pulsesProtein', groups: ['pulses', 'protein'] },
    { id: 'dairy', groups: ['dairy'] },
    { id: 'nutsSeeds', groups: ['nutsSeeds'] },
  ],
  US: [
    { id: 'vegetables', groups: ['vegetables'] },
    { id: 'fruits', groups: ['fruits'] },
    { id: 'grains', groups: ['grains'] },
    { id: 'protein', groups: ['protein', 'pulses', 'nutsSeeds'] },
    { id: 'dairy', groups: ['dairy'] },
  ],
};

export interface PlateSection {
  id: PlateSectionId;
  /** Meals of the day that included this section. */
  meals: number;
}

/** How the day's meals spread across the plate sections. Mixed dishes count toward none. */
export function plateForDay(
  meals: readonly Meal[],
  items: readonly MealItem[],
  region: Region,
): PlateSection[] {
  const mealIds = new Set(meals.map((m) => m.id));
  return plateSections[region].map((section) => ({
    id: section.id,
    meals: new Set(
      items
        .filter((i) => mealIds.has(i.mealId) && section.groups.includes(i.group))
        .map((i) => i.mealId),
    ).size,
  }));
}

/** Vegetables or fruit at any meal of the day: the "colourful" day the achievement counts. */
export function isColourfulDay(items: readonly MealItem[]): boolean {
  return items.some((i) => i.group === 'vegetables' || i.group === 'fruits');
}

/** Parses a typed nutrient value; empty means unknown. */
export function parseAmount(text: string, max: number): number | null | 'invalid' {
  const clean = text.trim().replace(',', '.');
  if (!clean) return null;
  const n = Number(clean);
  if (!Number.isFinite(n) || n < 0 || n > max) return 'invalid';
  return round2(n);
}

/** A CSV a person can keep or share: one row per food item. */
export function nutritionCsv(meals: readonly Meal[], items: readonly MealItem[]): string {
  const cell = (v: string | number | null) => {
    const text = v === null ? '' : String(v);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const byId = new Map(meals.map((m) => [m.id, m]));
  const rows = items
    .map((i) => ({ i, m: byId.get(i.mealId) }))
    .filter((r): r is { i: MealItem; m: Meal } => !!r.m)
    .sort((a, b) => (a.m.at < b.m.at ? -1 : 1))
    .map(({ i, m }) =>
      [
        m.day,
        m.type,
        m.homeCooked ? 'yes' : 'no',
        i.name,
        i.quantity,
        i.unit,
        i.group,
        i.nutrients?.kcal ?? null,
        i.nutrients?.protein ?? null,
        i.nutrients?.carbs ?? null,
        i.nutrients?.fat ?? null,
        i.nutrients?.fiber ?? null,
      ]
        .map(cell)
        .join(','),
    );
  return [
    'day,meal,home_cooked,food,quantity,unit,food_group,energy_kcal,protein_g,carbs_g,fat_g,fiber_g',
    ...rows,
  ].join('\n');
}
