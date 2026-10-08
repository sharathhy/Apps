import { typeScale, type TypeVariant } from '@wellness/design-tokens';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

const variantClass: Record<TypeVariant, string> = {
  display: 'text-display font-bold',
  title1: 'text-title1 font-bold',
  title2: 'text-title2 font-semibold',
  title3: 'text-title3 font-semibold',
  bodyLarge: 'text-bodyLarge font-regular',
  body: 'text-body font-regular',
  label: 'text-label font-medium',
  footnote: 'text-footnote font-regular',
  caption: 'text-caption font-medium',
};

const toneClass = {
  default: 'text-text',
  muted: 'text-text-muted',
  accent: 'text-accent',
  primary: 'text-primary',
  danger: 'text-danger',
  onAccent: 'text-on-accent',
  onPrimary: 'text-on-primary',
} as const;

export type TextTone = keyof typeof toneClass;

export interface TextProps extends RNTextProps {
  variant?: TypeVariant;
  tone?: TextTone;
  className?: string;
}

const headingVariants: TypeVariant[] = ['display', 'title1', 'title2', 'title3'];

/** Token-driven text. Scales with the system font size, capped per variant. */
export function Text({
  variant = 'body',
  tone = 'default',
  className = '',
  accessibilityRole,
  ...rest
}: TextProps) {
  const style = typeScale[variant];
  return (
    <RNText
      accessibilityRole={
        accessibilityRole ?? (headingVariants.includes(variant) ? 'header' : undefined)
      }
      maxFontSizeMultiplier={'maxFontSizeMultiplier' in style ? style.maxFontSizeMultiplier : 2}
      className={`${variantClass[variant]} ${toneClass[tone]} ${className}`}
      {...rest}
    />
  );
}
