import type { ModuleId } from '@wellness/design-tokens';
import type { TFunction } from 'i18next';

import type { ReminderKind } from './reminders';

/**
 * Text for a notification. Wording is neutral on purpose. With lock-screen
 * privacy on (the default) the title and body say nothing about health:
 * "Wellness" and "Time for your check-in".
 */
export function notificationContent(
  item: { kind: ReminderKind | 'system'; module: ModuleId | null; templateKey: string },
  lockScreenPrivate: boolean,
  t: TFunction,
): { title: string; body: string } {
  if (lockScreenPrivate) {
    const body =
      item.kind === 'scheduled' ? 'notificationText.private' : 'notificationText.privateUpdate';
    return { title: t('app.name'), body: t(body) };
  }
  if (item.kind === 'achievement') {
    return {
      title: t('achievements.newBadge'),
      body: t(`achievements.items.${item.templateKey}.name`, { defaultValue: '' }),
    };
  }
  const title = item.module ? t(`modules.${item.module}.title`) : t('app.name');
  const key = `notificationText.templates.${item.templateKey}`;
  const body = t(key, { defaultValue: t('notificationText.private') });
  return { title, body };
}
