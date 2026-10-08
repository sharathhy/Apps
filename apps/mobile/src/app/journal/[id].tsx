import { ModuleRoute } from '@/components/ModuleRoute';
import { JournalEntryScreen } from '@/features/mood/screens/JournalEntryScreen';

/** Only "new" is pre-rendered for the web export; saved entries open client-side. */
export function generateStaticParams() {
  return [{ id: 'new' }];
}

export default function JournalEntryRoute() {
  return <ModuleRoute id="mood" screen={JournalEntryScreen} />;
}
