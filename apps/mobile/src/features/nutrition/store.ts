import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  MAX_QUANTITY,
  type CustomFood,
  type FoodGroup,
  type Meal,
  type MealItem,
  type MealType,
  type Nutrients,
} from './model';

export interface NewItem {
  foodRef: string;
  name: string;
  quantity: number;
  unit: string;
  group: FoodGroup;
  nutrients: Nutrients | null;
}

export interface Removed {
  item: MealItem;
  meal: Meal | null;
}

interface NutritionState {
  meals: Meal[];
  items: MealItem[];
  customFoods: CustomFood[];
  /** Energy (kcal) is plain information and hidden until the person turns it on. */
  showEnergy: boolean;
  /** Adds an item to the day's meal of that type, creating the meal if needed. */
  addItem: (type: MealType, day: string, item: NewItem, now?: Date) => MealItem;
  updateItem: (id: string, patch: Pick<MealItem, 'quantity' | 'nutrients'>, now?: Date) => void;
  /** Returns what was removed (with its meal if that emptied it), for undo. */
  removeItem: (id: string) => Removed | undefined;
  restore: (removed: Removed) => void;
  setHomeCooked: (mealId: string, homeCooked: boolean, now?: Date) => void;
  saveCustomFood: (
    food: Omit<CustomFood, 'id' | 'updatedAt'> & { id?: string },
    now?: Date,
  ) => CustomFood;
  removeCustomFood: (id: string) => void;
  setShowEnergy: (on: boolean) => void;
  reset: () => void;
}

const initial = {
  meals: [] as Meal[],
  items: [] as MealItem[],
  customFoods: [] as CustomFood[],
  showEnergy: false,
};

const clampQuantity = (q: number) =>
  Math.min(MAX_QUANTITY, Math.max(0.25, Math.round(q * 100) / 100));

/** Drops meals left with no items, so an emptied meal disappears everywhere. */
const withoutEmptyMeals = (meals: Meal[], items: MealItem[]) => {
  const used = new Set(items.map((i) => i.mealId));
  return meals.filter((m) => used.has(m.id));
};

export const useNutrition = create<NutritionState>()(
  persist(
    (set, get) => ({
      ...initial,
      addItem: (type, day, item, now = new Date()) => {
        const stamp = now.toISOString();
        let meal = get().meals.find((m) => m.day === day && m.type === type);
        const meals = meal
          ? get().meals
          : [
              (meal = {
                id: randomUUID(),
                type,
                day,
                at: stamp,
                homeCooked: false,
                updatedAt: stamp,
              }),
              ...get().meals,
            ];
        const entry: MealItem = {
          ...item,
          name: item.name.trim().slice(0, 200),
          quantity: clampQuantity(item.quantity),
          id: randomUUID(),
          mealId: meal.id,
          updatedAt: stamp,
        };
        set({ meals, items: [...get().items, entry] });
        return entry;
      },
      updateItem: (id, patch, now = new Date()) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  ...patch,
                  quantity: clampQuantity(patch.quantity),
                  updatedAt: now.toISOString(),
                }
              : i,
          ),
        })),
      removeItem: (id) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return undefined;
        const items = get().items.filter((i) => i.id !== id);
        const meals = withoutEmptyMeals(get().meals, items);
        const meal =
          meals.length < get().meals.length
            ? (get().meals.find((m) => m.id === item.mealId) ?? null)
            : null;
        set({ items, meals });
        return { item, meal };
      },
      restore: ({ item, meal }) =>
        set((s) => {
          if (s.items.some((i) => i.id === item.id)) return s;
          const meals =
            meal && !s.meals.some((m) => m.id === meal.id) ? [meal, ...s.meals] : s.meals;
          if (!meals.some((m) => m.id === item.mealId)) return s;
          return { items: [...s.items, item], meals };
        }),
      setHomeCooked: (mealId, homeCooked, now = new Date()) =>
        set((s) => ({
          meals: s.meals.map((m) =>
            m.id === mealId ? { ...m, homeCooked, updatedAt: now.toISOString() } : m,
          ),
        })),
      saveCustomFood: ({ id, ...food }, now = new Date()) => {
        const saved: CustomFood = {
          ...food,
          name: food.name.trim().slice(0, 200),
          servingUnit: food.servingUnit.trim().slice(0, 60) || '1 serving',
          id: id ?? randomUUID(),
          updatedAt: now.toISOString(),
        };
        set((s) => ({
          customFoods: [saved, ...s.customFoods.filter((f) => f.id !== saved.id)],
        }));
        return saved;
      },
      removeCustomFood: (id) =>
        set((s) => ({ customFoods: s.customFoods.filter((f) => f.id !== id) })),
      setShowEnergy: (showEnergy) => set({ showEnergy }),
      reset: () => set({ ...initial }),
    }),
    {
      name: 'nutrition-v1',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: ({ meals, items, customFoods, showEnergy }) => ({
        meals,
        items,
        customFoods,
        showEnergy,
      }),
    },
  ),
);
