import { accentVars, type ModuleId } from '@wellness/design-tokens';
import { vars } from 'nativewind';
import { useMemo, type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { useTheme } from './ThemeProvider';

interface AccentScopeProps extends ViewProps {
  module: ModuleId;
  children: ReactNode;
}

/** Points `bg-accent`, `text-accent` etc. at one module's accent color for its subtree. */
export function AccentScope({ module, style, children, ...rest }: AccentScopeProps) {
  const { scheme } = useTheme();
  const scoped = useMemo(() => vars(accentVars(module, scheme)), [module, scheme]);
  return (
    <View style={[{ flex: 1 }, scoped, style]} {...rest}>
      {children}
    </View>
  );
}
