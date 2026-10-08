import { Card, Icon, Pressable, Text, useTheme, type IconName } from '@wellness/ui';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { audiences, type Audience } from '../audience';

const audienceIcon: Record<Audience, IconName> = {
  women: 'cycle',
  men: 'mood',
  everyone: 'sparkles',
};

interface AudiencePickerProps {
  value: Audience | null;
  onChange: (audience: Audience) => void;
}

export function AudiencePicker({ value, onChange }: AudiencePickerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t('setup.title')} className="gap-3">
      {audiences.map((audience) => {
        const selected = value === audience;
        return (
          <Pressable
            key={audience}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={t(`setup.audience.${audience}.title`)}
            accessibilityHint={t(`setup.audience.${audience}.description`)}
            onPress={() => onChange(audience)}
          >
            <Card
              className={`flex-row items-center gap-4 ${selected ? 'border-2 border-primary' : ''}`}
            >
              <View
                className={`rounded-lg p-3 ${selected ? 'bg-primary-soft' : 'bg-surface-muted'}`}
              >
                <Icon
                  name={audienceIcon[audience]}
                  size={26}
                  color={selected ? colors.primary : colors.textMuted}
                />
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
      })}
    </View>
  );
}
