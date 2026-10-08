import { Pressable, Text } from '@wellness/ui';

import { tapFeedback } from '@/lib/haptics';

interface ChipProps {
  label: string;
  onPress: () => void;
  selected?: boolean;
  /** "radio" or "checkbox" for choices; a plain button otherwise. */
  role?: 'radio' | 'checkbox';
  accessibilityLabel?: string;
}

/** A compact, wrapping choice or action with a full-size touch target. Uses the screen's accent color. */
export function Chip({ label, onPress, selected = false, role, accessibilityLabel }: ChipProps) {
  return (
    <Pressable
      accessibilityRole={role ?? 'button'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={
        role === 'radio' ? { selected } : role ? { checked: selected } : undefined
      }
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      className={`min-h-touch min-w-touch items-center justify-center rounded-full px-4 ${
        selected ? 'bg-accent' : 'border border-border-strong bg-surface'
      }`}
    >
      <Text variant="label" tone={selected ? 'onAccent' : 'default'}>
        {label}
      </Text>
    </Pressable>
  );
}
