/**
 * Color tokens.
 *
 * Primitives are raw palette values. Components never use primitives directly;
 * they use semantic tokens (`light` / `dark`) so both themes stay in sync.
 * Contrast for every text/background pair is enforced in `colors.test.ts` (WCAG AA).
 */

export const palette = {
  neutral: {
    0: '#FFFFFF',
    25: '#FBFAF8',
    50: '#F6F4F1',
    100: '#ECE9E4',
    200: '#DDD8D1',
    300: '#C4BEB5',
    400: '#9E978C',
    500: '#78716A',
    600: '#5C564F',
    700: '#45403A',
    800: '#2F2C27',
    850: '#24221E',
    900: '#1B1916',
    950: '#12110F',
  },
  teal: { 100: '#DDF1EE', 300: '#7FCFC3', 600: '#0F766E', 900: '#11302C' },
  red: { 100: '#FDECEA', 300: '#F59A90', 600: '#B42318', 900: '#3D1714' },
  green: { 100: '#E5F4EA', 300: '#7FD39B', 600: '#14743A', 900: '#16301F' },
  amber: { 100: '#FEF0DC', 300: '#F5B862', 600: '#8F4A06', 900: '#3A2810' },
  blue: { 100: '#E3EEFC', 300: '#86B8F5', 600: '#1D5FC0', 900: '#15253B' },
  violet: { 100: '#EEEAFB', 300: '#B9A9F0', 600: '#6447B5', 900: '#241E38' },
  rose: { 100: '#FBE8EF', 300: '#F293B6', 600: '#AE2257', 900: '#3A1A26' },
  coral: { 100: '#FCEBE3', 300: '#F5A383', 600: '#A8401C', 900: '#3A2118' },
  leaf: { 100: '#E6F3E6', 300: '#8BCF94', 600: '#2D7537', 900: '#1B2E1E' },
  indigo: { 100: '#E8EAFB', 300: '#9FA9F2', 600: '#3949AB', 900: '#1C2140' },
} as const;

export type ColorScheme = 'light' | 'dark';

export const moduleIds = ['water', 'mood', 'sleep', 'cycle', 'pregnancy', 'nutrition'] as const;
export type ModuleId = (typeof moduleIds)[number];

export interface SemanticColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  focus: string;
}

export interface AccentColors {
  /** Used for icons, text and filled controls. */
  accent: string;
  /** Tinted background for cards and chips. */
  soft: string;
  /** Text/icon color placed on top of `accent`. */
  onAccent: string;
}

const n = palette.neutral;

export const light: SemanticColors = {
  background: n[50],
  surface: n[0],
  surfaceMuted: n[100],
  border: n[200],
  borderStrong: n[500],
  text: n[900],
  textMuted: n[600],
  primary: palette.teal[600],
  primarySoft: palette.teal[100],
  onPrimary: n[0],
  danger: palette.red[600],
  dangerSoft: palette.red[100],
  success: palette.green[600],
  successSoft: palette.green[100],
  warning: palette.amber[600],
  warningSoft: palette.amber[100],
  focus: palette.blue[600],
};

export const dark: SemanticColors = {
  background: n[950],
  surface: n[900],
  surfaceMuted: n[850],
  border: n[800],
  borderStrong: n[500],
  text: n[50],
  textMuted: n[300],
  primary: palette.teal[300],
  primarySoft: palette.teal[900],
  onPrimary: n[950],
  danger: palette.red[300],
  dangerSoft: palette.red[900],
  success: palette.green[300],
  successSoft: palette.green[900],
  warning: palette.amber[300],
  warningSoft: palette.amber[900],
  focus: palette.blue[300],
};

const accentRamp = {
  water: palette.blue,
  mood: palette.violet,
  cycle: palette.rose,
  pregnancy: palette.coral,
  nutrition: palette.leaf,
  sleep: palette.indigo,
} as const;

function accentsFor(scheme: ColorScheme): Record<ModuleId, AccentColors> {
  const result = {} as Record<ModuleId, AccentColors>;
  for (const id of moduleIds) {
    const ramp = accentRamp[id];
    result[id] =
      scheme === 'light'
        ? { accent: ramp[600], soft: ramp[100], onAccent: n[0] }
        : { accent: ramp[300], soft: ramp[900], onAccent: n[950] };
  }
  return result;
}

export const accents: Record<ColorScheme, Record<ModuleId, AccentColors>> = {
  light: accentsFor('light'),
  dark: accentsFor('dark'),
};

export const colors: Record<ColorScheme, SemanticColors> = { light, dark };
