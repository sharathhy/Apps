import { AccentScope, Button, Card, Screen, Text, TextField } from '@wellness/ui';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { deviceTimeZone } from '@/lib/time/device';
import { localDateKey } from '@/lib/time/zoned';

import { saveJournalEntry } from '../actions';
import { SupportCard } from '../components/SupportCard';
import { mentionsSelfHarm } from '../crisis';
import { MAX_JOURNAL_LENGTH, promptForDay } from '../model';
import { useMood } from '../store';

/** Write or edit one journal entry. Support lines appear if the text mentions self-harm. */
export function JournalEntryScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const existing = useMood((s) => s.journal.find((j) => j.id === id));
  const removeJournal = useMood((s) => s.removeJournal);
  const promptKey = existing
    ? existing.promptKey
    : promptForDay(localDateKey(new Date(), deviceTimeZone()));
  const [body, setBody] = useState(existing?.body ?? '');
  const [saved, setSaved] = useState(false);
  const crisis = mentionsSelfHarm(body);

  const save = async () => {
    if (!body.trim()) return;
    await saveJournalEntry(body, promptKey, existing?.id);
    setSaved(true);
    if (!mentionsSelfHarm(body)) router.back();
  };

  return (
    <AccentScope module="mood">
      <Screen edgeTop={false}>
        <Stack.Screen
          options={{ headerTitle: existing ? t('mood.journal.edit') : t('mood.journal.new') }}
        />
        <Card className="gap-3">
          <TextField
            label={
              promptKey
                ? t(`mood.journal.prompts.${promptKey}` as 'mood.journal.prompts.goodThing')
                : t('mood.journal.title')
            }
            value={body}
            onChangeText={(v) => {
              setBody(v);
              setSaved(false);
            }}
            multiline
            maxLength={MAX_JOURNAL_LENGTH}
            style={{ minHeight: 180, textAlignVertical: 'top' }}
            hint={t('mood.checkIn.notePrivate')}
          />
          <Button
            variant="accent"
            label={t('mood.journal.save')}
            disabled={!body.trim()}
            onPress={() => void save()}
          />
          {saved ? (
            <Text tone="accent" accessibilityLiveRegion="polite">
              {t('mood.journal.saved')}
            </Text>
          ) : null}
          {existing ? (
            <Button
              variant="danger"
              label={t('mood.journal.delete')}
              onPress={() => {
                removeJournal(existing.id);
                router.back();
              }}
            />
          ) : null}
        </Card>
        {crisis ? <SupportCard prominent /> : null}
        <MedicalDisclaimer />
      </Screen>
    </AccentScope>
  );
}
