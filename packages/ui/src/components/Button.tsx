import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { Pressable, type PressableProps } from './Pressable';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';

const containerClass: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  secondary: 'bg-surface border border-border-strong',
  ghost: 'bg-transparent',
  danger: 'bg-danger',
};

const labelTone = {
  primary: 'onPrimary',
  accent: 'onAccent',
  secondary: 'default',
  ghost: 'primary',
  danger: 'onPrimary',
} as const;

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  icon,
  className = '',
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`flex-row items-center justify-center gap-2 rounded-lg px-5 py-3 ${containerClass[variant]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.onPrimary : colors.primary}
          accessibilityElementsHidden
        />
      ) : (
        icon && <View importantForAccessibility="no-hide-descendants">{icon}</View>
      )}
      <Text variant="label" tone={labelTone[variant]}>
        {label}
      </Text>
    </Pressable>
  );
}
