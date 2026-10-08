import { Card, Icon, Pressable, Text, useBounce, useTheme, type IconName } from '@wellness/ui';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { tapFeedback } from '@/lib/haptics';

import { audiences, type Audience } from '../audience';

const audienceIcon: Record<Audience, IconName> = {
  women: 'women',
  men: 'men',
  everyone: 'sparkles',
};

interface AudiencePickerProps {
  value: Audience | null;
  onChange: (audience: Audience) => void;
}

export function AudiencePicker({ value, onChange }: AudiencePickerProps) {
  const { t } = useTranslation();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t('setup.title')} className="gap-3">
      {audiences.map((audience) => (
        <AudienceOption
          key={audience}
          audience={audience}
          selected={value === audience}
          onPress={() => {
            tapFeedback();
            onChange(audience);
          }}
        />
      ))}
    </View>
  );
}

function AudienceOption({
  audience,
  selected,
  onPress,
}: {
  audience: Audience;
  selected: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const bounce = useBounce(selected, 1.12);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={t(`setup.audience.${audience}.title`)}
      accessibilityHint={t(`setup.audience.${audience}.description`)}
      onPress={onPress}
    >
      <Card className={`flex-row items-center gap-4 ${selected ? 'border-2 border-primary' : ''}`}>
        <View className={`rounded-lg p-3 ${selected ? 'bg-primary-soft' : 'bg-surface-muted'}`}>
          <Animated.View style={bounce}>
            <Icon
              name={audienceIcon[audience]}
              size={26}
              color={selected ? colors.primary : colors.textMuted}
            />
          </Animated.View>
        </View>
        <View className="flex-1 gap-1">
          <Text variant="title3">{t(`setup.audience.${audience}.title`)}</Text>
          <Text variant="footnote" tone="muted">
            {t(`setup.audience.${audience}.description`)}
          </Text>
        </View>
        <View
          className={`h-6 w-6 items-center justify-center rounded-full border-2 ${selected ? 'border-primary' : 'border-border-strong'}`}
        >
          {selected ? <View className="h-3 w-3 rounded-full bg-primary" /> : null}
        </View>
      </Card>
    </Pressable>
  );
}
