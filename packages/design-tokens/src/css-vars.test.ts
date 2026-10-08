import { colors, moduleIds } from './colors';
import { accentVars, hexToRgbChannels, themeVars } from './css-vars';

describe('hexToRgbChannels', () => {
  it('converts hex colors to space-separated channels', () => {
    expect(hexToRgbChannels('#FFFFFF')).toBe('255 255 255');
    expect(hexToRgbChannels('#0f766e')).toBe('15 118 110');
  });

  it('rejects malformed colors', () => {
    expect(() => hexToRgbChannels('#FFF')).toThrow();
    expect(() => hexToRgbChannels('teal')).toThrow();
  });
});

describe('themeVars', () => {
  it('defines the same variables in light and dark', () => {
    expect(Object.keys(themeVars('dark')).sort()).toEqual(Object.keys(themeVars('light')).sort());
  });

  it('exposes every semantic color and module accent', () => {
    const vars = themeVars('light');
    expect(vars['--color-text-muted']).toBe(hexToRgbChannels(colors.light.textMuted));
    for (const id of moduleIds) {
      expect(vars[`--color-${id}`]).toBeDefined();
      expect(vars[`--color-${id}-soft`]).toBeDefined();
    }
    expect(vars['--color-accent']).toBe(vars['--color-primary']);
  });

  it('accentVars overrides only the accent variables', () => {
    expect(Object.keys(accentVars('water', 'dark')).sort()).toEqual([
      '--color-accent',
      '--color-accent-soft',
      '--color-on-accent',
    ]);
  });
});
