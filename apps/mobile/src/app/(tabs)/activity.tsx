import { ModuleRoute } from '@/components/ModuleRoute';
import { ActivityScreen } from '@/features/activity';

export default function ActivityRoute() {
  return <ModuleRoute id="activity" screen={ActivityScreen} />;
}
