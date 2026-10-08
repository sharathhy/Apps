import { accents, colors, moduleIds, type ColorScheme, type ModuleId } from './colors';

/** Converts `#RRGGBB` to the space-separated `R G B` form Tailwind alpha values need. */
export function hexToRgbChannels(hex: string): string {
  const value = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) {
    throw new Error(`Expected a #RRGGBB color, received "${hex}"`);
  }
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/**
 * CSS custom properties for one color scheme. The app applies these at the
 * root with NativeWind's `vars()`, so `bg-surface` etc. switch with the theme.
 * `accent` defaults to the brand color; module screens override it with
 * `accentVars(moduleId, scheme)`.
 */
export function themeVars(scheme: ColorScheme): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, hex] of Object.entries(colors[scheme])) {
    result[`--color-${kebab(name)}`] = hexToRgbChannels(hex);
  }
  for (const id of moduleIds) {
    const a = accents[scheme][id];
    result[`--color-${id}`] = hexToRgbChannels(a.accent);
    result[`--color-${id}-soft`] = hexToRgbChannels(a.soft);
    result[`--color-on-${id}`] = hexToRgbChannels(a.onAccent);
  }
  result['--color-accent'] = result['--color-primary']!;
  result['--color-accent-soft'] = result['--color-primary-soft']!;
  result['--color-on-accent'] = result['--color-on-primary']!;
  return result;
}

/** Points the generic `accent` color at one module's accent. */
export function accentVars(id: ModuleId, scheme: ColorScheme): Record<string, string> {
  const a = accents[scheme][id];
  return {
    '--color-accent': hexToRgbChannels(a.accent),
    '--color-accent-soft': hexToRgbChannels(a.soft),
    '--color-on-accent': hexToRgbChannels(a.onAccent),
  };
}
