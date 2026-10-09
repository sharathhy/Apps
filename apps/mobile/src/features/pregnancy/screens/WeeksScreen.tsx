import { Card, Pressable, Text } from '@wellness/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { trackActivity } from '@/features/achievements/award';
import type { Language } from '@/i18n';

import { PregnancyPage } from '../components/PregnancyPage';
import { contentWeek } from '../model';
import { usePregnancyView } from '../usePregnancyView';
import { weekContent, weekNumbers } from '../weeks';

/** Every week from 4 to 42. The current week starts open. */
export function WeeksScreen() {
  const { t, i18n } = useTranslation();
  const { age } = usePregnancyView();
  const current = age ? contentWeek(age.weeks) : null;
  const [open, setOpen] = useState<number | null>(current);

  return (
    <PregnancyPage title={t('pregnancy.tools.weeks')}>
      <Text tone="muted">{t('pregnancy.weeks.intro')}</Text>
      {weekNumbers.map((week) => {
        const content = weekContent(week, i18n.language as Language)!;
        const expanded = open === week;
        return (
          <Card key={week} tone={week === current ? 'accent' : 'surface'} className="gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() => {
                setOpen(expanded ? null : week);
                if (!expanded) void trackActivity('article_read', 'pregnancy');
              }}
              noScale
              className="min-h-touch flex-row items-center justify-between"
            >
              <Text variant="title3">{t('pregnancy.weeks.week', { week })}</Text>
              {week === current ? (
                <Text variant="label" tone="accent">
                  {t('pregnancy.weeks.current')}
                </Text>
              ) : null}
            </Pressable>
            {expanded ? (
              <View className="gap-2">
                <Text variant="label">{t('pregnancy.weeks.baby')}</Text>
                <Text>{content.baby}</Text>
                <Text variant="label">{t('pregnancy.weeks.you')}</Text>
                <Text>{content.you}</Text>
                <Text variant="footnote" tone="muted">
                  {t('pregnancy.weeks.sources', { sources: content.sources.join(', ') })}
                </Text>
              </View>
            ) : null}
          </Card>
        );
      })}
    </PregnancyPage>
  );
}
