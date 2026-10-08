import { ModuleRoute } from '@/components/ModuleRoute';
import { SleepScreen } from '@/features/sleep';

export default function SleepRoute() {
  return <ModuleRoute id="sleep" screen={SleepScreen} />;
}
