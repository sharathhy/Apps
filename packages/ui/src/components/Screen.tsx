import { contentMaxWidth } from '@wellness/design-tokens';
import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeProvider';

export interface ScreenProps {
  children: ReactNode;
  /** Adds pull-to-refresh when provided. */
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Set false for screens that manage their own scrolling (lists). */
  scroll?: boolean;
  /** Skip the top safe-area inset, e.g. when a header already handles it. */
  edgeTop?: boolean;
}

/**
 * Standard screen container: theme background, safe areas, a centred column
 * capped at a readable width on tablets and desktop, and optional
 * pull-to-refresh.
 */
export function Screen({
  children,
  onRefresh,
  refreshing = false,
  scroll = true,
  edgeTop = true,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const column = (
    <View
      className="w-full gap-4 self-center px-4 pb-8"
      style={{ maxWidth: contentMaxWidth, paddingTop: (edgeTop ? insets.top : 0) + 16 }}
    >
      {children}
    </View>
  );

  if (!scroll) {
    return <View className="flex-1 bg-background">{column}</View>;
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: insets.bottom }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      {column}
    </ScrollView>
  );
}
