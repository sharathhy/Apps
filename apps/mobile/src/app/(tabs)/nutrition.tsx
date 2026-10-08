import { ModuleRoute } from '@/components/ModuleRoute';
import { NutritionScreen } from '@/features/nutrition';

export default function NutritionRoute() {
  return <ModuleRoute id="nutrition" screen={NutritionScreen} />;
}
