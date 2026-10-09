import { Button, Card, Icon, Pressable, Text } from '@wellness/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { tapFeedback } from '@/lib/haptics';

import { finishKickSession } from '../actions';
import { PregnancyPage } from '../components/PregnancyPage';
import { KICK_TARGET, KICKS_FROM_WEEK, sessionMinutes } from '../model';
import { usePregnancy } from '../store';
import { usePregnancyView } from '../usePregnancyView';

/**
 * A simple kick counter. Getting to know the usual pattern matters more
 * than any number (NHS, "Your baby's movements"); reduced movement always
 * means contacting the maternity unit, never waiting.
 */
export function KicksScreen() {
  const { t, i18n } = useTranslation();
  const { age } = usePregnancyView();
  const kicks = usePregnancy((s) => s.kicks);
  const start = usePregnancy((s) => s.startKicks);
  const kick = usePregnancy((s) => s.kick);
  const remove = usePregnancy((s) => s.removeKicks);
  const active = kicks.find((k) => !k.endedAt);
  const done = kicks.filter((k) => k.endedAt);
  const [, setTick] = useState(0);

  // Refresh the running timer once a minute.
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [active]);

  return (
    <PregnancyPage title={t('pregnancy.tools.kicks')}>
      {age && age.weeks < KICKS_FROM_WEEK ? (
        <Text tone="muted">{t('pregnancy.kicks.early', { week: KICKS_FROM_WEEK })}</Text>
      ) : null}
      <Card className="items-center gap-4">
        {active ? (
          <>
            <Text variant="label" tone="muted" accessibilityLiveRegion="polite">
              {t('pregnancy.kicks.minutes', { count: sessionMinutes(active) })}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('pregnancy.kicks.tap', { count: active.count })}
              onPress={() => {
                tapFeedback();
                kick(active.id);
              }}
              className="h-40 w-40 items-center justify-center rounded-full bg-accent"
            >
              <Text variant="title1" tone="onAccent">
                {active.count}
              </Text>
              <Text variant="label" tone="onAccent">
                {t('pregnancy.kicks.tapLabel')}
              </Text>
            </Pressable>
            {active.count >= KICK_TARGET ? (
              <Text tone="accent" accessibilityLiveRegion="polite">
                {t('pregnancy.kicks.reached', { count: KICK_TARGET })}
              </Text>
            ) : null}
            <Button
              variant="secondary"
              label={t('pregnancy.kicks.finish')}
              onPress={() => void finishKickSession(active.id)}
            />
          </>
        ) : (
          <>
            <Icon name="tap" size={40} />
            <Text className="text-center">
              {t('pregnancy.kicks.intro', { count: KICK_TARGET })}
            </Text>
            <Button variant="accent" label={t('pregnancy.kicks.start')} onPress={() => start()} />
          </>
        )}
      </Card>
      <Card tone="muted" className="gap-2" accessibilityRole="alert">
        <Text variant="label">{t('pregnancy.kicks.fewerTitle')}</Text>
        <Text>{t('pregnancy.kicks.fewer')}</Text>
      </Card>
      {done.length ? (
        <Card className="gap-2">
          <Text variant="title3">{t('pregnancy.kicks.history')}</Text>
          {done.slice(0, 14).map((k) => (
            <View key={k.id} className="min-h-touch flex-row items-center gap-3">
              <View className="flex-1">
                <Text variant="label">
                  {t('pregnancy.kicks.session', { count: k.count, minutes: sessionMinutes(k) })}
                </Text>
                <Text variant="footnote" tone="muted">
                  {new Date(k.startedAt).toLocaleString(i18n.language, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('pregnancy.kicks.delete')}
                onPress={() => remove(k.id)}
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
