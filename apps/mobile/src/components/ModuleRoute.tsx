import type { ModuleId } from '@wellness/design-tokens';
import { Redirect } from 'expo-router';
import type { ComponentType } from 'react';

import { useVisibleModules } from '@/features/profile';

/** Renders a module screen, or sends the user home if it is turned off in config or by the user. */
export function ModuleRoute({
  id,
  screen: ScreenComponent,
}: {
  id: ModuleId;
  screen: ComponentType;
}) {
  const visible = useVisibleModules();
  if (!visible.some((m) => m.id === id)) {
    return <Redirect href="/" />;
  }
  return <ScreenComponent />;
}
