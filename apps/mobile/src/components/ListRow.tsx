import { Icon, Pressable, Text, type IconName } from '@wellness/ui';
import { View } from 'react-native';

interface ListRowProps {
  icon: IconName;
  label: string;
  onPress: () => void;
}

export function ListRow({ icon, label, onPress }: ListRowProps) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      noScale
      className="flex-row items-center gap-3 py-2"
    >
      <Icon name={icon} size={22} />
      <Text className="flex-1">{label}</Text>
      <View importantForAccessibility="no-hide-descendants">
        <Icon name="chevronRight" size={18} />
      </View>
    </Pressable>
  );
}
