import { useLocalSearchParams } from 'expo-router';
import type { ComponentType } from 'react';

import { ModuleRoute } from '@/components/ModuleRoute';
import { AddFoodScreen } from '@/features/nutrition/screens/AddFoodScreen';
import { FoodFormScreen } from '@/features/nutrition/screens/FoodFormScreen';
import { FoodsScreen } from '@/features/nutrition/screens/FoodsScreen';
import { ScanScreen } from '@/features/nutrition/screens/ScanScreen';
import { nutritionTools, type NutritionToolId } from '@/features/nutrition/tools';

const screens: Record<NutritionToolId, ComponentType> = {
  add: AddFoodScreen,
  food: FoodFormScreen,
  foods: FoodsScreen,
  scan: ScanScreen,
};

export function generateStaticParams() {
  return nutritionTools.map((tool) => ({ tool }));
}

export default function NutritionToolRoute() {
  const { tool } = useLocalSearchParams<{ tool: NutritionToolId }>();
  return <ModuleRoute id="nutrition" screen={screens[tool] ?? AddFoodScreen} />;
}
