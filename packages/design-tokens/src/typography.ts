/**
 * Type scale. Sizes are in density-independent points and scale with the
 * user's system font size (dynamic type) because React Native applies
 * `allowFontScaling` by default. `maxFontSizeMultiplier` caps extreme growth
 * on large display text so layouts do not break.
 */

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export type FontWeightToken = keyof typeof fontFamily;

export interface TypeStyle {
  fontSize: number;
  lineHeight: number;
  weight: FontWeightToken;
  letterSpacing?: number;
  maxFontSizeMultiplier?: number;
}

export const typeScale = {
  display: {
    fontSize: 34,
    lineHeight: 41,
    weight: 'bold',
    letterSpacing: -0.4,
    maxFontSizeMultiplier: 1.4,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    weight: 'bold',
    letterSpacing: -0.3,
    maxFontSizeMultiplier: 1.5,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    weight: 'semibold',
    letterSpacing: -0.2,
    maxFontSizeMultiplier: 1.6,
  },
  title3: { fontSize: 19, lineHeight: 25, weight: 'semibold', maxFontSizeMultiplier: 1.8 },
  bodyLarge: { fontSize: 18, lineHeight: 26, weight: 'regular' },
  body: { fontSize: 16, lineHeight: 24, weight: 'regular' },
  label: { fontSize: 15, lineHeight: 20, weight: 'medium' },
  footnote: { fontSize: 13, lineHeight: 18, weight: 'regular' },
  caption: { fontSize: 12, lineHeight: 16, weight: 'medium', letterSpacing: 0.2 },
} as const satisfies Record<string, TypeStyle>;

export type TypeVariant = keyof typeof typeScale;
