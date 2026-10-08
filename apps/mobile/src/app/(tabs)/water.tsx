import { ModuleRoute } from '@/components/ModuleRoute';
import { WaterScreen } from '@/features/water';

export default function WaterRoute() {
  return <ModuleRoute id="water" screen={WaterScreen} />;
}
