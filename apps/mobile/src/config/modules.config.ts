import type { ModuleId } from '@wellness/design-tokens';

/**
 * Turn any module on or off here. A disabled module disappears from
 * navigation and the home screen, and its routes redirect to home.
 *
 * Order controls how modules appear in navigation. On phones the bottom bar
 * shows the first three enabled modules; the rest are reachable from home.
 */
export const modulesConfig: { order: ModuleId[]; enabled: Record<ModuleId, boolean> } = {
  order: ['water', 'mood', 'cycle', 'pregnancy', 'nutrition'],
  enabled: {
    water: true,
    mood: true,
    cycle: true,
    pregnancy: true,
    nutrition: true,
  },
};
