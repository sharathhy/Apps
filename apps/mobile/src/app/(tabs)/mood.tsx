import { ModuleRoute } from '@/components/ModuleRoute';
import { MoodScreen } from '@/features/mood';

export default function MoodRoute() {
  return <ModuleRoute id="mood" screen={MoodScreen} />;
}
