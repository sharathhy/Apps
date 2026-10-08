import { accents, colors, moduleIds, type ColorScheme } from './colors';

/** WCAG 2.x relative luminance. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;
const schemes: ColorScheme[] = ['light', 'dark'];

describe('contrast helper', () => {
  it('matches known WCAG values', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrast('#777777', '#FFFFFF')).toBeCloseTo(4.48, 1);
  });
});

describe.each(schemes)('%s theme meets WCAG AA', (scheme) => {
  const c = colors[scheme];
  const backgrounds = {
    background: c.background,
    surface: c.surface,
    surfaceMuted: c.surfaceMuted,
  };

  it.each(Object.entries(backgrounds))('text colors are readable on %s', (_name, bg) => {
    expect(contrast(c.text, bg)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast(c.textMuted, bg)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(['primary', 'danger', 'success', 'warning'] as const)(
    '%s is readable as text on surface and background',
    (name) => {
      expect(contrast(c[name], c.surface)).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrast(c[name], c.background)).toBeGreaterThanOrEqual(AA_TEXT);
    },
  );

  it.each(['danger', 'success', 'warning'] as const)('%s is readable on its soft tint', (name) => {
    expect(contrast(c[name], c[`${name}Soft`])).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('text on primary and danger buttons is readable', () => {
    expect(contrast(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast(c.onPrimary, c.danger)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast(c.primary, c.primarySoft)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('control borders and focus rings are visible (3:1)', () => {
    expect(contrast(c.borderStrong, c.surface)).toBeGreaterThanOrEqual(AA_NON_TEXT);
    expect(contrast(c.borderStrong, c.background)).toBeGreaterThanOrEqual(AA_NON_TEXT);
    expect(contrast(c.focus, c.background)).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it.each(moduleIds)('%s accent is readable everywhere it is used', (id) => {
    const a = accents[scheme][id];
    expect(contrast(a.accent, c.surface)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast(a.accent, c.background)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast(a.accent, a.soft)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast(a.onAccent, a.accent)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast(c.text, a.soft)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});
