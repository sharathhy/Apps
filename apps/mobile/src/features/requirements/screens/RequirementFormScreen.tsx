import { AccentScope, Button, Card, Screen, Text, TextField } from '@wellness/ui';
import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { dateFormatPattern, formatDateKey, ML_PER_FL_OZ } from '@/lib/region';
import { deviceTimeZone } from '@/lib/time/device';
import { toLocal } from '@/lib/time/zoned';
import { useRegion } from '@/lib/useRegion';

import { requirements, type Requirement } from '../definitions';
import { useRequirements } from '../store';
import { validateRequirement, waterBounds } from '../validate';

/** Asks for one missing detail and explains why it is needed. */
export function RequirementFormScreen() {
  const { requirement: id } = useLocalSearchParams<{ requirement: string }>();
  const def = requirements.find((r) => r.id === id);
  if (!def) return <Redirect href="/" />;
  return <RequirementForm def={def} />;
}

function RequirementForm({ def }: { def: Requirement }) {
  const { t } = useTranslation();
  const region = useRegion();
  const pattern = dateFormatPattern(region.dateOrder);
  const stored = useRequirements((s) => s[def.field]);
  const setValue = useRequirements((s) => s.setValue);
  const bounds = waterBounds(region.units);

  const initial =
    stored === null
      ? ''
      : typeof stored === 'number'
        ? String(region.units === 'imperial' ? Math.round(stored / ML_PER_FL_OZ) : stored)
        : formatDateKey(stored, region.dateOrder);
  const [text, setText] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const result = validateRequirement(def.id, text, {
      units: region.units,
      dateOrder: region.dateOrder,
      today: toLocal(new Date(), deviceTimeZone()),
    });
    if (!result.ok) {
      setError(
        t(`requirements.errors.${result.error}`, { pattern, min: bounds.min, max: bounds.max }),
      );
      return;
    }
    setValue(def.field, result.value as never);
    router.back();
  };

  const isWater = def.id === 'waterGoal';
  return (
    <AccentScope module={def.module}>
      <Screen edgeTop={false}>
        <Stack.Screen options={{ headerTitle: t(`modules.${def.module}.title`) }} />
        <Text variant="title1">{t(`requirements.${def.id}.title`)}</Text>
        <Card tone="muted" className="gap-1">
          <Text variant="label">{t('requirements.whyTitle')}</Text>
          <Text>{t(`requirements.${def.id}.why`)}</Text>
        </Card>
        <Card className="gap-3">
          <TextField
            label={t(`requirements.${def.id}.label`, { unit: bounds.unit, pattern })}
            value={text}
            onChangeText={(v) => {
              setText(v);
              setError(null);
            }}
            keyboardType={isWater ? 'number-pad' : 'numbers-and-punctuation'}
            placeholder={isWater ? String(region.units === 'imperial' ? 64 : 2000) : pattern}
            hint={
              isWater
                ? t('requirements.errors.range', { min: bounds.min, max: bounds.max })
                : undefined
            }
            error={error}
            onSubmitEditing={save}
          />
          {def.id === 'waterGoal' ? (
            <Text variant="footnote" tone="muted">
              {t('requirements.waterGoal.guidance')} {t('requirements.waterGoal.source')}
            </Text>
          ) : null}
          {def.id === 'dueDate' ? (
            <Text variant="footnote" tone="muted">
              {t('requirements.dueDate.guidance')} {t('requirements.estimate')}
            </Text>
          ) : null}
          <Button variant="accent" label={t('requirements.save')} onPress={save} />
        </Card>
        <MedicalDisclaimer />
      </Screen>
    </AccentScope>
  );
}
