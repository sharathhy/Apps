import { ModuleRoute } from '@/components/ModuleRoute';
import { JournalScreen } from '@/features/mood/screens/JournalScreen';

export default function JournalRoute() {
  return <ModuleRoute id="mood" screen={JournalScreen} />;
}
