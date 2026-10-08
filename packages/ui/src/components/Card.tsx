import { shadows } from '@wellness/design-tokens';
import { View, type ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  className?: string;
  tone?: 'surface' | 'accent' | 'muted';
}

const toneClass = {
  surface: 'bg-surface border border-border',
  accent: 'bg-accent-soft',
  muted: 'bg-surface-muted',
} as const;

export function Card({ className = '', tone = 'surface', style, ...rest }: CardProps) {
  return (
    <View
      className={`rounded-xl p-4 ${toneClass[tone]} ${className}`}
      style={[tone === 'surface' ? { boxShadow: shadows.sm } : null, style]}
      {...rest}
    />
  );
}
