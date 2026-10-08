import { ModulePlaceholder } from '@/components/ModulePlaceholder';

import { cycleModule } from '../manifest';

export function CycleScreen() {
  return <ModulePlaceholder module={cycleModule} />;
}
