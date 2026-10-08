import { Button, Card, Pressable, Screen, Text } from '@wellness/ui';
import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking, Switch, View } from 'react-native';

import { ListRow } from '@/components/ListRow';
import { Section } from '@/components/Section';
import { Stepper } from '@/components/Stepper';
import { SwitchRow } from '@/components/SwitchRow';
import { useVisibleModules } from '@/features/profile/useVisibleModules';
import { clockLabel, shiftClock } from '@/lib/time/format';

import { supportsDeviceNotifications } from '../device';
import { useNotificationPrefs } from '../prefsStore';
import { useReminders } from '../remindersStore';
import { MAX_DAILY_LIMIT, MIN_DAILY_LIMIT, notificationTypes } from '../types';
import { usePermission } from '../usePermission';

/** Every notification control in one place: master switch, types, trackers, quiet hours, limit, privacy and reminders. */
export function NotificationSettingsScreen() {
  const { t, i18n } = useTranslation();
  const prefs = useNotificationPrefs();
  const reminders = useReminders((s) => s.reminders);
  const update = useReminders((s) => s.update);
  const modules = useVisibleModules();
  const permission = usePermission();
  const locale = i18n.language;

  const setMaster = async (on: boolean) => {
    prefs.setEnabled(on);
    // Asked only now: the person has turned it on and can see every type below.
    if (on && permission.state === 'undetermined') await permission.request();
  };

  const reminderModules = new Set(modules.map((m) => m.id));

  return (
    <Screen edgeTop={false}>
      <Stack.Screen options={{ headerTitle: t('notifications.settings') }} />

      <Card className="gap-1">
        <SwitchRow
          icon="bell"
          title={t('notifications.prefs.master')}
          description={t('notifications.prefs.masterHint')}
          value={prefs.enabled}
          onChange={(on) => void setMaster(on)}
        />
        {!prefs.enabled ? (
          <Text variant="footnote" tone="muted">
            {t('notifications.prefs.willReceive')}
          </Text>
        ) : null}
        {prefs.enabled && permission.state === 'denied' ? (
          <View className="gap-2">
            <Text variant="footnote" tone="danger" accessibilityRole="alert">
              {t('notifications.prefs.blocked')}
            </Text>
            <Button
              variant="secondary"
              label={t('notifications.prefs.openSettings')}
              onPress={() => void Linking.openSettings()}
            />
          </View>
        ) : null}
        {!supportsDeviceNotifications ? (
          <Text variant="footnote" tone="muted">
            {t('notifications.prefs.webNote')}
          </Text>
        ) : null}
      </Card>

      <Section title={t('notifications.prefs.typesTitle')}>
        {notificationTypes.map((type) => (
          <SwitchRow
            key={type}
            title={t(`notificationTypes.${type}.title`)}
            description={t(`notificationTypes.${type}.why`)}
            value={prefs.types[type]}
            disabled={!prefs.enabled}
            onChange={(on) => prefs.setType(type, on)}
          />
        ))}
        <SwitchRow
          title={t('notifications.prefs.systemTitle')}
          description={t('notifications.prefs.systemHint')}
          value
          disabled
          onChange={() => undefined}
        />
      </Section>

      {modules.length ? (
        <Section title={t('notifications.prefs.modulesTitle')}>
          {modules.map((m) => (
            <SwitchRow
              key={m.id}
              icon={m.icon}
              title={t(`modules.${m.id}.title`)}
              value={prefs.modules[m.id] !== false}
              disabled={!prefs.enabled}
              onChange={(on) => prefs.setModule(m.id, on)}
            />
          ))}
        </Section>
      ) : null}

      <Section
        title={t('notifications.reminders.title')}
        hint={
          !prefs.enabled || !prefs.types.scheduled
            ? t('notifications.reminders.offNote')
            : undefined
        }
      >
        {reminders.length === 0 ? (
          <Text tone="muted">{t('notifications.reminders.empty')}</Text>
        ) : null}
        {reminders.map((r) => {
          const title = r.module ? t(`modules.${r.module}.title`) : t('app.name');
          const days = r.weekdays.length
            ? r.weekdays
                .map((d) =>
                  t(
                    `notifications.reminders.weekdays.${d}` as 'notifications.reminders.weekdays.1',
                  ),
                )
                .join(', ')
            : t('notifications.reminders.everyDay');
          if (r.module && !reminderModules.has(r.module)) return null;
          return (
            <View key={r.id} className="min-h-touch flex-row items-center gap-3 py-1">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('notifications.reminders.edit')}: ${title}`}
                onPress={() =>
                  router.push({ pathname: '/notifications/reminder', params: { id: r.id } })
                }
                noScale
                className="flex-1 gap-0.5"
              >
                <Text variant="label">{title}</Text>
                <Text variant="footnote" tone="muted">
                  {r.times.map((time) => clockLabel(time, locale)).join(' · ')} — {days}
                </Text>
              </Pressable>
              <Switch
                accessibilityLabel={`${t('notifications.reminders.on')}: ${title}`}
                value={r.enabled}
                onValueChange={(enabled) => update(r.id, { enabled })}
              />
            </View>
          );
        })}
        <ListRow
          icon="plus"
          label={t('notifications.reminders.add')}
          onPress={() => router.push('/notifications/reminder')}
        />
      </Section>

      <Section
        title={t('notifications.prefs.quietTitle')}
        hint={t('notifications.prefs.quietHint')}
      >
        <Stepper
          label={t('notifications.prefs.from')}
          value={clockLabel(prefs.quietStart, locale)}
          decreaseLabel={t('notifications.prefs.earlier')}
          increaseLabel={t('notifications.prefs.later')}
          onDecrease={() => prefs.setQuietHours(shiftClock(prefs.quietStart, -30), prefs.quietEnd)}
          onIncrease={() => prefs.setQuietHours(shiftClock(prefs.quietStart, 30), prefs.quietEnd)}
        />
        <Stepper
          label={t('notifications.prefs.until')}
          value={clockLabel(prefs.quietEnd, locale)}
          decreaseLabel={t('notifications.prefs.earlier')}
          increaseLabel={t('notifications.prefs.later')}
          onDecrease={() => prefs.setQuietHours(prefs.quietStart, shiftClock(prefs.quietEnd, -30))}
          onIncrease={() => prefs.setQuietHours(prefs.quietStart, shiftClock(prefs.quietEnd, 30))}
        />
      </Section>

      <Section title={t('notifications.prefs.limitTitle')}>
        <Stepper
          label={t('notifications.prefs.limitTitle')}
          value={t('notifications.prefs.limitValue', { count: prefs.dailyLimit })}
          decreaseLabel={t('notifications.prefs.fewer')}
          increaseLabel={t('notifications.prefs.more')}
          canDecrease={prefs.dailyLimit > MIN_DAILY_LIMIT}
          canIncrease={prefs.dailyLimit < MAX_DAILY_LIMIT}
          onDecrease={() => prefs.setDailyLimit(prefs.dailyLimit - 1)}
          onIncrease={() => prefs.setDailyLimit(prefs.dailyLimit + 1)}
        />
      </Section>

      <Section title={t('notifications.prefs.privacyTitle')}>
        <SwitchRow
          icon="lock"
          title={t('notifications.prefs.privacyTitle')}
          description={t('notifications.prefs.privacyHint')}
          value={prefs.lockScreenPrivate}
          onChange={prefs.setLockScreenPrivate}
        />
      </Section>
    </Screen>
  );
}
