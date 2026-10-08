import { Pressable, Text } from '@wellness/ui';
import { View } from 'react-native';

import { tapFeedback } from '@/lib/haptics';

interface StepperProps {
  label: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
  canDecrease?: boolean;
  canIncrease?: boolean;
}

/**
 * A value with − and + buttons. Screen readers get one adjustable control
 * (swipe up or down) instead of two separate buttons.
 */
export function Stepper({
  label,
  value,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
  canDecrease = true,
  canIncrease = true,
}: StepperProps) {
  const press = (fn: () => void) => () => {
    tapFeedback();
    fn();
  };
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment' && canIncrease) onIncrease();
        if (e.nativeEvent.actionName === 'decrement' && canDecrease) onDecrease();
      }}
      className="min-h-touch flex-row items-center gap-3"
    >
      <Text variant="label" className="flex-1">
        {label}
      </Text>
      <StepButton
        symbol="−"
        label={decreaseLabel}
        disabled={!canDecrease}
        onPress={press(onDecrease)}
      />
      <Text variant="label" className="min-w-[72px] text-center" testID={`${label}-value`}>
        {value}
      </Text>
      <StepButton
        symbol="+"
        label={increaseLabel}
        disabled={!canIncrease}
        onPress={press(onIncrease)}
      />
    </View>
  );
}

function StepButton({
  symbol,
  label,
  disabled,
  onPress,
}: {
  symbol: string;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-touch min-w-touch items-center justify-center rounded-full bg-surface-muted ${disabled ? 'opacity-40' : ''}`}
    >
      <Text variant="title3">{symbol}</Text>
    </Pressable>
  );
}
