import {
  Button,
  Card,
  EmptyState,
  Icon,
  Pressable,
  Screen,
  Text,
  type IconName,
} from '@wellness/ui';
import { router, Stack, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { allModules } from '@/features/registry';
import { tapFeedback } from '@/lib/haptics';

import { useInbox, type InboxItem } from '../inboxStore';
import { useReminders } from '../remindersStore';
import { snoozeReminder } from '../service';
import { snoozeOptions } from '../snooze';

const typeIcon: Record<InboxItem['type'], IconName> = {
  scheduled: 'clock',
  smart: 'clock',
  achievement: 'trophy',
  requirement: 'info',
  insight: 'sparkles',
  system: 'shield',
};

/** Everything the app has told the person: reminders, badges, missing-data notices and system notices. */
export function NotificationCenterScreen() {
  const { t, i18n } = useTranslation();
  const items = useInbox((s) => s.items);
  const { markRead, markAllRead, remove } = useInbox.getState();
  const reminders = useReminders((s) => s.reminders);

  const open = (item: InboxItem) => {
    markRead(item.id);
    if (item.href) router.push(item.href as Href);
  };

  return (
    <Screen edgeTop={false}>
      <Stack.Screen
        options={{
          headerTitle: t('notifications.title'),
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('notifications.settings')}
              onPress={() => router.push('/notifications/settings')}
              className="min-h-touch min-w-touch items-center justify-center"
            >
              <Icon name="settings" size={22} />
            </Pressable>
          ),
        }}
      />
      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon="bell"
            title={t('notifications.emptyTitle')}
            message={t('notifications.emptyMessage')}
          />
          <Button
            variant="secondary"
            label={t('notifications.settings')}
            onPress={() => router.push('/notifications/settings')}
          />
        </Card>
      ) : (
        <>
          <View className="flex-row justify-end">
            <Button
              variant="ghost"
              label={t('notifications.markAllRead')}
              onPress={() => markAllRead()}
            />
          </View>
          {items.map((item) => {
            const reminder = item.reminderId
              ? reminders.find((r) => r.id === item.reminderId)
              : undefined;
            const title = t(item.titleKey as 'app.name', { defaultValue: '', ...item.params });
            const body = t(item.bodyKey as 'app.name', { defaultValue: '', ...item.params });
            const when = new Date(item.createdAt).toLocaleString(i18n.language, {
              dateStyle: 'medium',
              timeStyle: 'short',
            });
            return (
              <Card key={item.id} className="gap-2">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.readAt ? '' : `${t('notifications.unread')}, `}${title}. ${body}`}
                  onPress={() => {
                    tapFeedback();
                    open(item);
                  }}
                  noScale
                  className="flex-row items-start gap-3"
                >
                  <Icon name={item.module ? allModules[item.module].icon : typeIcon[item.type]} />
                  <View className="flex-1 gap-0.5">
                    <View className="flex-row items-center gap-2">
                      {!item.readAt ? (
                        <View
                          className="h-2 w-2 rounded-full bg-primary"
                          importantForAccessibility="no"
                        />
                      ) : null}
                      <Text variant="label" className="flex-1">
                        {title}
                      </Text>
                    </View>
                    <Text>{body}</Text>
                    <Text variant="caption" tone="muted">
                      {when}
                    </Text>
                  </View>
                </Pressable>
                <View className="flex-row flex-wrap justify-end gap-1">
                  {reminder ? (
                    <>
                      {snoozeOptions.map((option) => (
                        <Button
                          key={option}
                          variant="ghost"
                          label={`${t('notifications.snooze.title')}: ${t(`notifications.snooze.${option}`)}`}
                          onPress={() => {
                            snoozeReminder(reminder.id, option);
                            markRead(item.id);
                          }}
                        />
                      ))}
                    </>
                  ) : null}
                  <Button
                    variant="ghost"
                    label={t('notifications.dismiss')}
                    onPress={() => remove(item.id)}
                  />
                </View>
                {reminder?.snoozedUntil && new Date(reminder.snoozedUntil) > new Date() ? (
                  <Text variant="footnote" tone="muted">
                    {t('notifications.snoozed', {
                      time: new Date(reminder.snoozedUntil).toLocaleString(i18n.language, {
                        weekday: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      }),
                    })}
                  </Text>
                ) : null}
              </Card>
            );
          })}
        </>
      )}
    </Screen>
  );
}
