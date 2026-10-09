import { Button, Card, Icon, Pressable, Text, TextField, useTheme } from '@wellness/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BarChart } from '@/components/BarChart';
import { formatDateKey } from '@/lib/region';
import { useRegion } from '@/lib/useRegion';

import { logWeight } from '../actions';
import { PregnancyPage } from '../components/PregnancyPage';
import { gestationalAge, iomGainRangesKg } from '../model';
import { usePregnancy } from '../store';
import { usePregnancyView } from '../usePregnancyView';

export const KG_PER_LB = 0.45359237;
/** Plausible weights, to catch typing mistakes. */
const WEIGHT_KG = { min: 30, max: 250 } as const;

/**
 * A private weight record. There are no targets, goals, streaks or
 * achievements for weight; the IOM ranges are reference text only.
 */
export function WeightScreen() {
  const { t } = useTranslation();
  const { accents } = useTheme();
  const { units, dateOrder } = useRegion();
  const imperial = units === 'imperial';
  const unit = imperial ? 'lb' : 'kg';
  const { today, dueDate } = usePregnancyView();
  const weights = usePregnancy((s) => s.weights);
  const remove = usePregnancy((s) => s.removeWeight);
  const [text, setText] = useState('');
  const [message, setMessage] = useState<{ tone: 'accent' | 'danger'; text: string } | null>(null);
  const [showRanges, setShowRanges] = useState(false);

  const show = (kg: number) => (imperial ? kg / KG_PER_LB : kg).toFixed(1);

  const save = async () => {
    const n = Number(text.replace(',', '.'));
    const kg = imperial ? n * KG_PER_LB : n;
    if (!Number.isFinite(n) || kg < WEIGHT_KG.min || kg > WEIGHT_KG.max) {
      setMessage({
        tone: 'danger',
        text: t('requirements.errors.range', {
          min: Math.ceil(imperial ? WEIGHT_KG.min / KG_PER_LB : WEIGHT_KG.min),
          max: Math.floor(imperial ? WEIGHT_KG.max / KG_PER_LB : WEIGHT_KG.max),
        }),
      });
      return;
    }
    await logWeight(today, kg);
    setText('');
    setMessage({ tone: 'accent', text: t('pregnancy.weight.saved') });
  };

  const recent = weights.slice(-12);
  const summary = recent.length
    ? t('pregnancy.weight.summary', {
        count: recent.length,
        first: `${show(recent[0]!.kg)} ${unit}`,
        last: `${show(recent.at(-1)!.kg)} ${unit}`,
      })
    : t('pregnancy.weight.empty');

  return (
    <PregnancyPage title={t('pregnancy.tools.weight')}>
      <Card className="gap-3">
        <Text>{t('pregnancy.weight.intro')}</Text>
        <TextField
          label={t('pregnancy.weight.label', { unit })}
          value={text}
          onChangeText={(v) => {
            setText(v);
            setMessage(null);
          }}
          inputMode="decimal"
        />
        <Button variant="accent" label={t('pregnancy.weight.save')} onPress={() => void save()} />
        {message ? (
          <Text tone={message.tone} accessibilityLiveRegion="polite">
            {message.text}
          </Text>
        ) : null}
      </Card>
      <Card className="gap-3">
        <BarChart
          data={recent.map((w) => ({
            key: w.id,
            value: Number(show(w.kg)),
            label: dueDate ? String(gestationalAge(dueDate, w.day)?.weeks ?? '') : undefined,
          }))}
          color={accents.pregnancy.accent}
          summary={summary}
        />
        <Text tone="muted">{summary}</Text>
        {[...weights]
          .reverse()
          .slice(0, 10)
          .map((w) => (
            <View key={w.id} className="min-h-touch flex-row items-center gap-3">
              <View className="flex-1">
                <Text variant="label">
                  {show(w.kg)} {unit}
                </Text>
                <Text variant="footnote" tone="muted">
                  {formatDateKey(w.day, dateOrder)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('pregnancy.weight.delete', {
                  date: formatDateKey(w.day, dateOrder),
                })}
                onPress={() => remove(w.id)}
                className="min-h-touch min-w-touch items-center justify-center"
              >
                <Icon name="trash" size={20} />
              </Pressable>
            </View>
          ))}
      </Card>
      <Card tone="muted" className="gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showRanges }}
          onPress={() => setShowRanges(!showRanges)}
          noScale
          className="min-h-touch justify-center"
        >
          <Text variant="label">{t('pregnancy.weight.rangesTitle')}</Text>
        </Pressable>
        {showRanges ? (
          <>
            <Text variant="footnote">{t('pregnancy.weight.rangesIntro')}</Text>
            {iomGainRangesKg.map((r) => (
              <Text key={r.bmi} variant="footnote">
                {t(`pregnancy.weight.bmi.${r.bmi}`)}:{' '}
                {imperial
                  ? `${Math.round(r.min / KG_PER_LB)}–${Math.round(r.max / KG_PER_LB)} lb`
                  : `${r.min}–${r.max} kg`}
              </Text>
            ))}
            <Text variant="footnote" tone="muted">
              {t('pregnancy.weight.rangesSource')}
            </Text>
          </>
        ) : null}
      </Card>
    </PregnancyPage>
  );
}
