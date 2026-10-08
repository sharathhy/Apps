import { Card, Text } from '@wellness/ui';
import type { ReactNode } from 'react';
import { View } from 'react-native';

/** A titled group of rows, as used on the settings screens. */
export function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text variant="label" tone="muted" accessibilityRole="header">
        {title}
      </Text>
      <Card className="gap-1">{children}</Card>
      {hint ? (
        <Text variant="footnote" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
