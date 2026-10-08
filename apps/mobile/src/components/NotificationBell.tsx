import { Icon, Pressable, Text } from '@wellness/ui';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { unreadCount, useInbox } from '@/features/notifications/inboxStore';

/** Opens the notification center; shows how many items are unread. */
export function NotificationBell() {
  const { t } = useTranslation();
  const count = useInbox((s) => unreadCount(s.items));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('notifications.open', { count })}
      onPress={() => router.push('/notifications')}
      className="min-h-touch min-w-touch items-center justify-center rounded-full bg-surface-muted"
    >
      <Icon name="bell" size={22} />
      {count > 0 ? (
        <View
          importantForAccessibility="no-hide-descendants"
          className="absolute right-0 top-0 min-w-[18px] items-center rounded-full bg-primary px-1"
        >
          <Text variant="caption" tone="onPrimary">
            {count > 9 ? '9+' : count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
