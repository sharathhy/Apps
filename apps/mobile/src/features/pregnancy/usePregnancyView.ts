import { useRequirements } from '@/features/requirements/store';
import { deviceTimeZone } from '@/lib/time/device';
import { localDateKey } from '@/lib/time/zoned';

import { gestationalAge } from './model';
import { usePregnancy } from './store';

export function usePregnancyView() {
  const dueDate = useRequirements((s) => s.dueDate);
  const status = usePregnancy((s) => s.status);
  const today = localDateKey(new Date(), deviceTimeZone());
  const age = dueDate ? gestationalAge(dueDate, today) : null;
  return { dueDate, status, today, age };
}
