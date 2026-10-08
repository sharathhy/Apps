import { Icon, Text } from '@wellness/ui';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/** Required on every screen that shows health information. */
export function MedicalDisclaimer() {
  const { t } = useTranslation();
  return (
    <View
      className="flex-row items-start gap-2 rounded-md bg-surface-muted p-3"
      accessible
      accessibilityRole="text"
    >
      <Icon name="info" size={18} />
      <Text variant="footnote" tone="muted" className="flex-1">
        {t('disclaimer.text')}
      </Text>
    </View>
  );
}
