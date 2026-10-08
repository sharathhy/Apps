import { Appear, Button, Card, Icon, Screen, Text, useTheme, type IconName } from '@wellness/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { QuickToggles } from '@/components/QuickToggles';
import { SwitchRow } from '@/components/SwitchRow';
import { consentCategoriesFor } from '@/features/consent/categories';
import { ConsentList } from '@/features/consent/ConsentList';
import { useConsent } from '@/features/consent/store';
import { useNotificationPrefs } from '@/features/notifications/prefsStore';
import { notificationTypes } from '@/features/notifications/types';
import { useProfile } from '@/features/profile';
import { AudiencePicker } from '@/features/profile/components/AudiencePicker';
import { TrackerToggles } from '@/features/profile/components/TrackerToggles';
import { tapFeedback } from '@/lib/haptics';

const TOTAL_STEPS = 4;

/**
 * Four-step onboarding: who it is for, the privacy explainer, consent for
 * each data category, and notification choices (all off). Every step can be
 * skipped; skipping finishes with nothing consented and nothing switched on.
 */
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const audience = useProfile((s) => s.audience);
  const trackers = useProfile((s) => s.trackers);
  const chooseAudience = useProfile((s) => s.chooseAudience);
  const completeOnboarding = useProfile((s) => s.completeOnboarding);

  const finish = () => {
    completeOnboarding();
    router.replace('/');
  };
  const next = () => {
    tapFeedback();
    if (step < TOTAL_STEPS) setStep(step + 1);
    else finish();
  };
  const canContinue = step !== 1 || (!!audience && trackers.length > 0);

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <StepDots step={step} />
        <QuickToggles />
      </View>
      <Text variant="caption" tone="muted">
        {t('onboarding.step', { current: step, total: TOTAL_STEPS })}
      </Text>

      <Appear key={step}>
        <View className="gap-4">
          {step === 1 ? (
            <AudienceStep audienceChosen={!!audience} onChoose={chooseAudience} />
          ) : step === 2 ? (
            <PrivacyStep />
          ) : step === 3 ? (
            <ConsentStep />
          ) : (
            <NotificationStep />
          )}
        </View>
      </Appear>

      <View className="gap-2">
        <Button
          label={step === TOTAL_STEPS ? t('onboarding.finish') : t('onboarding.next')}
          disabled={!canContinue}
          onPress={next}
        />
        <View className="flex-row justify-between">
          {step > 1 ? (
            <Button
              label={t('onboarding.back')}
              variant="ghost"
              onPress={() => setStep(step - 1)}
            />
          ) : (
            <View />
          )}
          <Button label={t('onboarding.skip')} variant="ghost" onPress={finish} />
        </View>
      </View>
    </Screen>
  );
}

function StepDots({ step }: { step: number }) {
  return (
    <View
      className="flex-row gap-2"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <Dot key={i} active={i + 1 === step} done={i + 1 < step} />
      ))}
    </View>
  );
}

function Dot({ active, done }: { active: boolean; done: boolean }) {
  const { colors } = useTheme();
  const style = useAnimatedStyle(() => ({
    width: withTiming(active ? 28 : 10),
    backgroundColor: active || done ? colors.primary : colors.borderStrong,
  }));
  return <Animated.View style={[{ height: 10, borderRadius: 5 }, style]} />;
}

function AudienceStep({
  audienceChosen,
  onChoose,
}: {
  audienceChosen: boolean;
  onChoose: (a: 'women' | 'men' | 'everyone') => void;
}) {
  const { t } = useTranslation();
  const audience = useProfile((s) => s.audience);
  return (
    <>
      <View className="gap-2">
        <Text variant="display">{t('setup.title')}</Text>
        <Text variant="bodyLarge" tone="muted">
          {t('setup.subtitle')}
        </Text>
      </View>
      <AudiencePicker value={audience} onChange={onChoose} />
      {audienceChosen ? (
        <Appear key={audience} style={{ gap: 8 }}>
          <Text variant="label" tone="muted" accessibilityRole="header">
            {t('setup.trackersTitle')}
          </Text>
          <Card>
            <TrackerToggles />
          </Card>
        </Appear>
      ) : null}
      <Text variant="footnote" tone="muted">
        {t('setup.privacy')}
      </Text>
    </>
  );
}

const privacyPoints: { key: 'device' | 'account' | 'noAds' | 'control'; icon: IconName }[] = [
  { key: 'device', icon: 'install' },
  { key: 'account', icon: 'shield' },
  { key: 'noAds', icon: 'info' },
  { key: 'control', icon: 'download' },
];

function PrivacyStep() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <>
      <View className="gap-2">
        <Text variant="display">{t('onboarding.privacy.title')}</Text>
        <Text variant="bodyLarge" tone="muted">
          {t('onboarding.privacy.subtitle')}
        </Text>
      </View>
      {privacyPoints.map(({ key, icon }, i) => (
        <Appear key={key} index={i + 1}>
          <Card className="flex-row items-start gap-3">
            <View className="rounded-lg bg-primary-soft p-2">
              <Icon name={icon} size={22} color={colors.primary} />
            </View>
            <Text className="flex-1">{t(`onboarding.privacy.${key}`)}</Text>
          </Card>
        </Appear>
      ))}
      <Button
        label={t('onboarding.privacy.readPolicy')}
        variant="ghost"
        onPress={() => router.push('/legal/privacy')}
      />
    </>
  );
}

function ConsentStep() {
  const { t } = useTranslation();
  const trackers = useProfile((s) => s.trackers);
  const decide = useConsent((s) => s.decide);
  const categories = consentCategoriesFor(trackers);
  return (
    <>
      <View className="gap-2">
        <Text variant="display">{t('onboarding.consent.title')}</Text>
        <Text variant="bodyLarge" tone="muted">
          {t('onboarding.consent.subtitle')}
        </Text>
      </View>
      <Card>
        <ConsentList categories={categories} />
      </Card>
      <Button
        label={t('onboarding.consent.allowAll')}
        variant="secondary"
        onPress={() => trackers.forEach((m) => decide(m, true))}
      />
    </>
  );
}

function NotificationStep() {
  const { t } = useTranslation();
  const enabled = useNotificationPrefs((s) => s.enabled);
  const types = useNotificationPrefs((s) => s.types);
  const setEnabled = useNotificationPrefs((s) => s.setEnabled);
  const setType = useNotificationPrefs((s) => s.setType);
  return (
    <>
      <View className="gap-2">
        <Text variant="display">{t('onboarding.notifications.title')}</Text>
        <Text variant="bodyLarge" tone="muted">
          {t('onboarding.notifications.subtitle')}
        </Text>
      </View>
      <Card>
        <SwitchRow
          title={t('onboarding.notifications.master')}
          value={enabled}
          onChange={setEnabled}
        />
        {enabled
          ? notificationTypes.map((type) => (
              <SwitchRow
                key={type}
                title={t(`notificationTypes.${type}.title`)}
                description={t(`notificationTypes.${type}.why`)}
                value={types[type]}
                onChange={(on) => setType(type, on)}
              />
            ))
          : null}
      </Card>
      <Text variant="footnote" tone="muted">
        {t('onboarding.notifications.lockScreen')}
      </Text>
    </>
  );
}
