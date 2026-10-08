import { Icon, Text, useTheme, type IconName } from '@wellness/ui';
import { Switch, View } from 'react-native';

import { tapFeedback } from '@/lib/haptics';

interface SwitchRowProps {
  title: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon?: IconName;
  iconColor?: string;
  disabled?: boolean;
}

/** A labelled switch with an explanation line; the whole row is one accessible control. */
export function SwitchRow({
  title,
  description,
  value,
  onChange,
  icon,
  iconColor,
  disabled,
}: SwitchRowProps) {
  const { colors } = useTheme();
  return (
    <View className="min-h-touch flex-row items-center gap-3 py-2">
      {icon ? <Icon name={icon} size={22} color={iconColor} /> : null}
      <View className="flex-1 gap-0.5">
        <Text variant="label">{title}</Text>
        {description ? (
          <Text variant="footnote" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={title}
        accessibilityHint={description}
        value={value}
        disabled={disabled}
        onValueChange={(next) => {
          tapFeedback();
          onChange(next);
        }}
        trackColor={{ false: colors.borderStrong, true: colors.primary }}
        thumbColor={colors.surface}
      />
    </View>
  );
}
