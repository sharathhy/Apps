import { ModuleRoute } from '@/components/ModuleRoute';
import { BreatheScreen } from '@/features/mood/screens/BreatheScreen';

export default function BreatheRoute() {
  return <ModuleRoute id="mood" screen={BreatheScreen} />;
}
