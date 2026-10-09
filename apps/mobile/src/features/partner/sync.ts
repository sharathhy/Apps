import { usePregnancy } from '@/features/pregnancy/store';
import { useRequirements } from '@/features/requirements/store';

import { publishSnapshots } from './api';

/**
 * Keeps the shared summary up to date while the app runs. Changes are
 * batched for a few seconds; nothing is sent without consent and a link.
 */
export function startPartnerSync(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => void publishSnapshots().catch(() => undefined), 3000);
  };
  const unsubscribe = [usePregnancy.subscribe(schedule), useRequirements.subscribe(schedule)];
  schedule();
  return () => {
    clearTimeout(timer);
    unsubscribe.forEach((u) => u());
  };
}
