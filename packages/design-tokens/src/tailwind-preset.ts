import { colors, moduleIds } from './colors';
import { radii, spacing } from './layout';
import { fontFamily, typeScale } from './typography';

const rgbVar = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;
const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const semanticColors: Record<string, string> = {};
for (const name of Object.keys(colors.light)) {
  semanticColors[kebab(name)] = rgbVar(kebab(name));
}

const moduleColors: Record<string, Record<string, string>> = {};
for (const id of moduleIds) {
  moduleColors[id] = { DEFAULT: rgbVar(id), soft: rgbVar(`${id}-soft`) };
  semanticColors[`on-${id}`] = rgbVar(`on-${id}`);
}

const fontSize: Record<string, [string, { lineHeight: string; letterSpacing?: string }]> = {};
for (const [name, style] of Object.entries(typeScale)) {
  const letterSpacing = 'letterSpacing' in style ? style.letterSpacing : undefined;
  fontSize[name] = [
    `${style.fontSize}px`,
    {
      lineHeight: `${style.lineHeight}px`,
      ...(letterSpacing !== undefined ? { letterSpacing: `${letterSpacing}px` } : {}),
    },
  ];
}

const px = (record: Record<string | number, number>) =>
  Object.fromEntries(Object.entries(record).map(([k, v]) => [k, `${v}px`]));

/**
 * Tailwind preset generated from the tokens. The theme is *replaced*, not
 * extended, for colors, spacing, radii and font sizes so that arbitrary
 * Tailwind defaults (e.g. `bg-red-500`, `p-7`) are not available.
 */
const preset = {
  theme: {
    colors: {
      transparent: 'transparent',
      ...semanticColors,
      ...moduleColors,
      accent: { DEFAULT: rgbVar('accent'), soft: rgbVar('accent-soft') },
      'on-accent': rgbVar('on-accent'),
    },
    spacing: px(spacing),
    borderRadius: px(radii),
    fontSize,
    fontFamily: {
      sans: [fontFamily.regular],
      regular: [fontFamily.regular],
      medium: [fontFamily.medium],
      semibold: [fontFamily.semibold],
      bold: [fontFamily.bold],
    },
    extend: {
      minHeight: { touch: '44px' },
      minWidth: { touch: '44px' },
    },
  },
};

export default preset;
