import { AccentScope, Button, Card, Screen, Text, useMotion, useTheme } from '@wellness/ui';
import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { Chip } from '@/components/Chip';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { tapFeedback } from '@/lib/haptics';

import { finishBreathing } from '../actions';
import { breathingPatterns, breathingStep, type BreathingPatternId } from '../model';

const durations = [1, 3, 5] as const;
const SMALL = 0.55;

/** Guided breathing. Calm pacing only, no exercise content. */
export function BreatheScreen() {
  const { t } = useTranslation();
  const { accents } = useTheme();
  const { reduceMotion } = useMotion();
  const [pattern, setPattern] = useState<BreathingPatternId>('box');
  const [minutes, setMinutes] = useState<(typeof durations)[number]>(3);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const scale = useSharedValue(SMALL);
  const lastPhase = useRef<string | null>(null);
  const running = elapsed !== null;
  const total = minutes * 60;

  const elapsedRef = useRef(0);
  useEffect(() => {
    if (!running) return;
    elapsedRef.current = 0;
    const timer = setInterval(() => {
      elapsedRef.current += 1;
      if (elapsedRef.current < total) {
        setElapsed(elapsedRef.current);
        return;
      }
      clearInterval(timer);
      void finishBreathing(pattern, total);
      setElapsed(null);
      setDone(true);
      lastPhase.current = null;
      scale.set(withTiming(SMALL, { duration: 600 }));
    }, 1000);
    return () => clearInterval(timer);
  }, [running, total, pattern, scale]);

  const step = running ? breathingStep(pattern, elapsed) : null;

  useEffect(() => {
    if (elapsed === null) return;
    const current = breathingStep(pattern, elapsed);
    const key = `${current.cycle}-${current.phase}`;
    if (key === lastPhase.current) return;
    lastPhase.current = key;
    tapFeedback();
    if (reduceMotion) return;
    if (current.phase === 'inhale') {
      scale.set(
        withTiming(1, {
          duration: current.remaining * 1000,
          easing: Easing.inOut(Easing.ease),
        }),
      );
    } else if (current.phase === 'exhale') {
      scale.set(
        withTiming(SMALL, {
          duration: current.remaining * 1000,
          easing: Easing.inOut(Easing.ease),
        }),
      );
    }
  }, [elapsed, pattern, reduceMotion, scale]);

  const circle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const stop = () => {
    if (elapsed !== null) void finishBreathing(pattern, elapsed);
    setElapsed(null);
    lastPhase.current = null;
    scale.set(withTiming(SMALL, { duration: 400 }));
  };

  return (
    <AccentScope module="mood">
      <Screen edgeTop={false}>
        <Stack.Screen options={{ headerTitle: t('mood.breathe.title') }} />
        <View className="items-center justify-center py-6" style={{ minHeight: 280 }}>
          <Animated.View
            style={[
              {
                width: 220,
                height: 220,
                borderRadius: 110,
                backgroundColor: accents.mood.soft,
                alignItems: 'center',
                justifyContent: 'center',
              },
              circle,
            ]}
          >
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: accents.mood.accent,
              }}
              className="items-center justify-center"
            >
              <Text variant="title1" tone="onAccent">
                {step ? step.remaining : ''}
              </Text>
            </View>
          </Animated.View>
          <Text variant="title2" className="mt-4 text-center" accessibilityLiveRegion="polite">
            {step
              ? t(`mood.breathe.phases.${step.phase}`)
              : done
                ? t('mood.breathe.done')
                : t('mood.breathe.ready')}
          </Text>
          {running ? (
            <Text tone="muted">
              {t('mood.breathe.left', { minutes: Math.ceil((total - (elapsed ?? 0)) / 60) })}
            </Text>
          ) : null}
        </View>

        {running ? (
          <Button variant="secondary" label={t('mood.breathe.stop')} onPress={stop} />
        ) : (
          <Card className="gap-3">
            <Text variant="label" tone="muted">
              {t('mood.breathe.pattern')}
            </Text>
            <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
              {(Object.keys(breathingPatterns) as BreathingPatternId[]).map((id) => (
                <Chip
                  key={id}
                  role="radio"
                  selected={pattern === id}
                  label={t(`mood.breathe.patterns.${id}`)}
                  onPress={() => setPattern(id)}
                />
              ))}
            </View>
            <Text variant="footnote" tone="muted">
              {t(`mood.breathe.patternHints.${pattern}`)}
            </Text>
            <Text variant="label" tone="muted">
              {t('mood.breathe.length')}
            </Text>
            <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
              {durations.map((m) => (
                <Chip
                  key={m}
                  role="radio"
                  selected={minutes === m}
                  label={t('mood.breathe.minutes', { count: m })}
                  onPress={() => setMinutes(m)}
                />
              ))}
            </View>
            <Button
              variant="accent"
              label={t('mood.breathe.start')}
              onPress={() => {
                setDone(false);
                setElapsed(0);
              }}
            />
          </Card>
        )}
        <Text variant="footnote" tone="muted">
          {t('mood.breathe.safety')}
        </Text>
        <MedicalDisclaimer />
      </Screen>
    </AccentScope>
  );
}
