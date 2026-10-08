import {
  accents,
  colors,
  themeVars,
  type AccentColors,
  type ColorScheme,
  type ModuleId,
  type SemanticColors,
} from '@wellness/design-tokens';
import { vars } from 'nativewind';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme, View } from 'react-native';

export type ThemePreference = 'system' | ColorScheme;

interface ThemeContextValue {
  scheme: ColorScheme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  colors: SemanticColors;
  accents: Record<ModuleId, AccentColors>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const schemeVars = { light: vars(themeVars('light')), dark: vars(themeVars('dark')) };

interface ThemeProviderProps {
  children: ReactNode;
  /** Controlled preference. When omitted the provider keeps its own state. */
  preference?: ThemePreference;
  onPreferenceChange?: (preference: ThemePreference) => void;
}

/**
 * Resolves light/dark from the user's preference or the OS, and exposes the
 * token values as CSS variables so NativeWind classes (`bg-surface`,
 * `text-text-muted`, `bg-water`) follow the active theme.
 */
export function ThemeProvider({
  children,
  preference: controlled,
  onPreferenceChange,
}: ThemeProviderProps) {
  const system = useColorScheme();
  const [internal, setInternal] = useState<ThemePreference>('system');
  const preference = controlled ?? internal;
  const setPreference = onPreferenceChange ?? setInternal;
  const scheme: ColorScheme =
    preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      preference,
      setPreference,
      colors: colors[scheme],
      accents: accents[scheme],
    }),
    [scheme, preference, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, schemeVars[scheme]]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return value;
}
