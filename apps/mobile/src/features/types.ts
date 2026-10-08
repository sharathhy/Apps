import type { ModuleId } from '@wellness/design-tokens';
import type { IconName } from '@wellness/ui';
import type { Href } from 'expo-router';

export interface ModuleManifest {
  id: ModuleId;
  icon: IconName;
  href: Href;
  /** Build phase in which the module ships. */
  plannedPhase: number;
  /** True once the tracker is built and no longer a placeholder. */
  ready?: boolean;
}
