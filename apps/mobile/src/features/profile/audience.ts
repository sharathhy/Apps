import type { ModuleId } from '@wellness/design-tokens';

/**
 * Who the user wants the app set up for. This only decides which trackers
 * are shown by default; the user can turn any tracker on or off afterwards.
 */
export type Audience = 'women' | 'men' | 'everyone';

export const audiences: Audience[] = ['women', 'men', 'everyone'];

const defaults: Record<Audience, ModuleId[]> = {
  women: ['water', 'mood', 'cycle', 'pregnancy', 'nutrition'],
  men: ['water', 'mood', 'nutrition'],
  everyone: ['water', 'mood', 'cycle', 'pregnancy', 'nutrition'],
};

export function defaultTrackers(audience: Audience): ModuleId[] {
  return [...defaults[audience]];
}

/** Keeps `ordered` items the user has chosen, preserving the app's configured order. */
export function filterByTrackers<T extends { id: ModuleId }>(
  ordered: T[],
  trackers: ModuleId[],
): T[] {
  const chosen = new Set(trackers);
  return ordered.filter((m) => chosen.has(m.id));
}

export function toggleTracker(trackers: ModuleId[], id: ModuleId): ModuleId[] {
  return trackers.includes(id) ? trackers.filter((t) => t !== id) : [...trackers, id];
}
