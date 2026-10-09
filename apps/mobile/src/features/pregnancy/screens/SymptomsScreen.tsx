import { Button, Card, Icon, Pressable, Text, TextField } from '@wellness/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Chip } from '@/components/Chip';
import { SupportCard } from '@/features/mood/components/SupportCard';
import { mentionsSelfHarm } from '@/features/mood/crisis';
import { formatDateKey } from '@/lib/region';
import { tapFeedback } from '@/lib/haptics';
import { useRegion } from '@/lib/useRegion';

import { logSymptoms } from '../actions';
import { PregnancyPage } from '../components/PregnancyPage';
import { isUrgent, pregnancySymptoms, urgentSymptoms, type PregnancySymptom } from '../model';
import { usePregnancy } from '../store';
import { usePregnancyView } from '../usePregnancyView';

const common = pregnancySymptoms.filter((s) => !urgentSymptoms.includes(s));

export function SymptomsScreen() {
  const { t } = useTranslation();
  const { dateOrder } = useRegion();
  const { today } = usePregnancyView();
  const entries = usePregnancy((s) => s.symptoms);
  const remove = usePregnancy((s) => s.removeSymptoms);
  const [selected, setSelected] = useState<PregnancySymptom[]>([]);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<{ urgent: boolean; support: boolean } | null>(null);

  const toggle = (s: PregnancySymptom) => {
    tapFeedback();
    setResult(null);
    setSelected((all) => (all.includes(s) ? all.filter((x) => x !== s) : [...all, s]));
  };

  const save = async () => {
    if (!selected.length && !note.trim()) return;
    const urgent = isUrgent(selected);
    const support = mentionsSelfHarm(note);
    await logSymptoms(today, selected, note);
    setSelected([]);
    setNote('');
    setResult({ urgent, support });
  };

  const chips = (list: readonly PregnancySymptom[]) => (
    <View className="flex-row flex-wrap gap-2">
      {list.map((s) => (
        <Chip
          key={s}
          role="checkbox"
          selected={selected.includes(s)}
          label={t(`pregnancy.symptoms.${s}`)}
          onPress={() => toggle(s)}
        />
      ))}
    </View>
  );

  return (
    <PregnancyPage title={t('pregnancy.tools.symptoms')}>
      <Card className="gap-3">
        <Text variant="title3">{t('pregnancy.symptomLog.title')}</Text>
        {chips(common)}
        <Text variant="label" tone="muted">
          {t('pregnancy.symptomLog.urgentGroup')}
        </Text>
        {chips(urgentSymptoms)}
        {isUrgent(selected) ? <UrgentAlert /> : null}
        <TextField
          label={t('pregnancy.symptomLog.note')}
          value={note}
          onChangeText={(v) => {
            setResult(null);
            setNote(v);
          }}
          multiline
          maxLength={2000}
        />
        <Button
          variant="accent"
          label={t('pregnancy.symptomLog.save')}
          onPress={() => void save()}
        />
        {result ? (
          <Text tone="accent" accessibilityLiveRegion="polite">
            {t('pregnancy.symptomLog.saved')}
          </Text>
        ) : null}
      </Card>
      {result?.urgent ? <UrgentAlert /> : null}
      {result?.support ? <SupportCard prominent /> : null}
      {entries.length ? (
        <Card className="gap-2">
          <Text variant="title3">{t('pregnancy.symptomLog.history')}</Text>
          {entries.slice(0, 20).map((e) => (
            <View key={e.id} className="min-h-touch flex-row items-center gap-3">
              <View className="flex-1">
                <Text variant="label">{formatDateKey(e.day, dateOrder)}</Text>
                <Text variant="footnote" tone="muted">
                  {e.symptoms.map((s) => t(`pregnancy.symptoms.${s}`)).join(', ')}
                  {e.note ? `${e.symptoms.length ? ' · ' : ''}${e.note}` : ''}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('pregnancy.symptomLog.delete', {
                  date: formatDateKey(e.day, dateOrder),
                })}
                onPress={() => remove(e.id)}
                className="min-h-touch min-w-touch items-center justify-center"
              >
                <Icon name="trash" size={20} />
              </Pressable>
            </View>
          ))}
        </Card>
      ) : null}
    </PregnancyPage>
  );
}

function UrgentAlert() {
  const { t } = useTranslation();
  return (
    <Card tone="accent" className="gap-2" accessibilityRole="alert">
      <Text variant="title3">{t('pregnancy.urgent.alertTitle')}</Text>
      <Text>{t('pregnancy.urgent.action')}</Text>
    </Card>
  );
}
