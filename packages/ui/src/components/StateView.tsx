import { View } from 'react-native';

import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export interface StateViewProps {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'default' | 'danger';
}

/** Shared layout for empty, error and offline states. */
export function StateView({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  tone = 'default',
}: StateViewProps) {
  return (
    <View
      className="items-center justify-center gap-3 px-6 py-10"
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
    >
      <View
        className={`rounded-full p-4 ${tone === 'danger' ? 'bg-danger-soft' : 'bg-accent-soft'}`}
      >
        <Icon name={icon} size={32} />
      </View>
      <Text variant="title3" className="text-center">
        {title}
      </Text>
      {message ? (
        <Text tone="muted" className="max-w-sm text-center">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="secondary" onPress={onAction} className="mt-2" />
      ) : null}
    </View>
  );
}

export const EmptyState = (props: Omit<StateViewProps, 'tone'>) => <StateView {...props} />;
export const ErrorState = (props: Omit<StateViewProps, 'tone' | 'icon'> & { icon?: IconName }) => (
  <StateView icon="error" tone="danger" {...props} />
);
export const OfflineState = (props: Omit<StateViewProps, 'tone' | 'icon'>) => (
  <StateView icon="cloudOff" {...props} />
);
