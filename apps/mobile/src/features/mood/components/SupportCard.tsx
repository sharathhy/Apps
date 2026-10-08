import { Button, Card, Text } from '@wellness/ui';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { supportLines } from '../crisis';

/**
 * Free, confidential support lines. Shown when something written mentions
 * self-harm, and always reachable from the Mood screen.
 */
export function SupportCard({ prominent = false }: { prominent?: boolean }) {
  const { t } = useTranslation();
  return (
    <Card
      tone={prominent ? 'accent' : 'muted'}
      className="gap-3"
      accessibilityRole={prominent ? 'alert' : undefined}
    >
      <Text variant="title3">{t('support.title')}</Text>
      <Text>{t('support.message')}</Text>
      {supportLines.map((line) => (
        <View key={line.id} className="gap-1">
          <Text variant="label">{t(`support.lines.${line.id}.name`)}</Text>
          <Text variant="footnote" tone="muted">
            {t(`support.lines.${line.id}.detail`)}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <Button
              variant="primary"
              label={t('support.call', { number: line.number })}
              onPress={() => void Linking.openURL(line.tel)}
            />
            {'sms' in line ? (
              <Button
                variant="secondary"
                label={t('support.text', { number: line.number })}
                onPress={() => void Linking.openURL(line.sms)}
              />
            ) : null}
          </View>
        </View>
      ))}
      <Text variant="footnote" tone="muted">
        {t('support.emergency')}
      </Text>
    </Card>
  );
}
