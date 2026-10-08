import type { ModuleId } from '@wellness/design-tokens';

import { modulesConfig } from '@/config/modules.config';

import { cycleModule } from './cycle/manifest';
import { moodModule } from './mood/manifest';
import { nutritionModule } from './nutrition/manifest';
import { pregnancyModule } from './pregnancy/manifest';
import type { ModuleManifest } from './types';
import { waterModule } from './water/manifest';

export const allModules: Record<ModuleId, ModuleManifest> = {
  water: waterModule,
  mood: moodModule,
  cycle: cycleModule,
  pregnancy: pregnancyModule,
  nutrition: nutritionModule,
};

type ModulesConfig = typeof modulesConfig;

/** Enabled modules in configured order. Unknown or duplicate ids are ignored. */
export function getEnabledModules(config: ModulesConfig = modulesConfig): ModuleManifest[] {
  const seen = new Set<ModuleId>();
  const result: ModuleManifest[] = [];
  for (const id of config.order) {
    if (seen.has(id) || !(id in allModules) || !config.enabled[id]) continue;
    seen.add(id);
    result.push(allModules[id]);
  }
  return result;
}

export function isModuleEnabled(id: ModuleId, config: ModulesConfig = modulesConfig): boolean {
  return getEnabledModules(config).some((m) => m.id === id);
}

/** Bottom-bar modules on phones: the first `max` enabled modules. */
export function phoneTabModules(max = 3, config: ModulesConfig = modulesConfig): ModuleManifest[] {
  return getEnabledModules(config).slice(0, max);
}
