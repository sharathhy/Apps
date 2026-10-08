import type { ModuleId } from '@wellness/design-tokens';
import { Redirect } from 'expo-router';
import type { ComponentType } from 'react';

import { isModuleEnabled } from '@/features/registry';

/** Renders a module screen, or sends the user home if the module is turned off in config. */
export function ModuleRoute({
  id,
  screen: ScreenComponent,
}: {
  id: ModuleId;
  screen: ComponentType;
}) {
  if (!isModuleEnabled(id)) {
    return <Redirect href="/" />;
  }
  return <ScreenComponent />;
}
