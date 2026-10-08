import { AccentScope, Button, Card, EmptyState, Pressable, Screen, Text } from '@wellness/ui';
import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { deviceTimeZone } from '@/lib/time/device';
import { localDateKey } from '@/lib/time/zoned';

import { promptForDay } from '../model';
import { useMood } from '../store';

/** Today's prompt and past journal entries. Entries stay private to this person. */
export function JournalScreen() {
  const { t, i18n } = useTranslation();
  const journal = useMood((s) => s.journal);
  const prompt = promptForDay(localDateKey(new Date(), deviceTimeZone()));
  return (
    <AccentScope module="mood">
      <Screen edgeTop={false}>
        <Stack.Screen options={{ headerTitle: t('mood.journal.title') }} />
        <Card tone="accent" className="gap-3">
          <Text variant="label" tone="accent">
            {t('mood.journal.todaysPrompt')}
          </Text>
          <Text variant="title3">{t(`mood.journal.prompts.${prompt}`)}</Text>
          <Button
            variant="accent"
            label={t('mood.journal.write')}
            onPress={() => router.push({ pathname: '/journal/[id]', params: { id: 'new' } })}
          />
        </Card>
        {journal.length === 0 ? (
          <Card>
            <EmptyState
              icon="book"
              title={t('mood.journal.emptyTitle')}
              message={t('mood.journal.emptyMessage')}
            />
          </Card>
        ) : (
          journal.map((j) => (
            <Pressable
              key={j.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/journal/[id]', params: { id: j.id } })}
            >
              <Card className="gap-1">
                <Text variant="caption" tone="muted">
                  {new Date(j.createdAt).toLocaleDateString(i18n.language, { dateStyle: 'medium' })}
                  {j.promptKey
                    ? ` · ${t(`mood.journal.prompts.${j.promptKey}` as 'mood.journal.prompts.goodThing')}`
                    : ''}
                </Text>
                <Text numberOfLines={3}>{j.body}</Text>
              </Card>
            </Pressable>
          ))
        )}
        <MedicalDisclaimer />
      </Screen>
    </AccentScope>
  );
}
