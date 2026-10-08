import { ModuleRoute } from '@/components/ModuleRoute';
import { PregnancyScreen } from '@/features/pregnancy';

export default function PregnancyRoute() {
  return <ModuleRoute id="pregnancy" screen={PregnancyScreen} />;
}
