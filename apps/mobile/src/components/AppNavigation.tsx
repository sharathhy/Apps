import { Icon, Text, useBounce, useTheme, type IconName } from '@wellness/ui';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View, type View as RNView } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVisibleModules } from '@/features/profile';
import { useLayout, type LayoutSize } from '@/hooks/useLayout';
import { tapFeedback } from '@/lib/haptics';

interface NavEntry {
  name: string;
  href: '/' | '/settings' | `/${string}`;
  icon: IconName;
  label: string;
  /** Hidden on phones to keep the bottom bar to five items (still reachable from home). */
  phone: boolean;
  color?: string;
}

/**
 * Responsive app navigation. Phones get a bottom tab bar (home, up to three
 * modules, settings); tablets and desktop web get a side rail with every
 * module the user has chosen. Every chosen module is registered as a tab so
 * links from the home screen work on all sizes.
 */
export function AppNavigation() {
  const layout = useLayout();
  const { t } = useTranslation();
  const { accents } = useTheme();
  const modules = useVisibleModules();
  const phoneIds = new Set(modules.slice(0, 3).map((m) => m.id));

  const entries: NavEntry[] = [
    { name: 'index', href: '/', icon: 'home', label: t('nav.home'), phone: true },
    ...modules.map((m) => ({
      name: m.id,
      href: `/${m.id}` as const,
      icon: m.icon,
      label: t(`modules.${m.id}.title`),
      phone: phoneIds.has(m.id),
      color: accents[m.id].accent,
    })),
    {
      name: 'settings',
      href: '/settings',
      icon: 'settings',
      label: t('nav.settings'),
      phone: true,
    },
  ];

  const isPhone = layout === 'phone';
  const list = (
    <TabList asChild>
      <NavContainer layout={layout} label={t('nav.primary')}>
        {entries.map((entry) => (
          <TabTrigger key={entry.name} name={entry.name} href={entry.href} asChild>
            <NavItem entry={entry} layout={layout} hidden={isPhone && !entry.phone} />
          </TabTrigger>
        ))}
      </NavContainer>
    </TabList>
  );
  const slot = <TabSlot style={{ flex: 1 }} />;

  return (
    <Tabs style={{ flex: 1, flexDirection: isPhone ? 'column' : 'row' }}>
      {isPhone ? slot : list}
      {isPhone ? list : slot}
    </Tabs>
  );
}

const NavContainer = forwardRef<
  RNView,
  { layout: LayoutSize; label: string; children?: React.ReactNode }
>(function NavContainer({ layout, label, children, ...rest }, ref) {
  const insets = useSafeAreaInsets();
  if (layout === 'phone') {
    return (
      <View
        ref={ref}
        {...rest}
        accessibilityRole="tablist"
        accessibilityLabel={label}
        className="flex-row border-t border-border bg-surface px-2 pt-1"
        style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      >
        {children}
      </View>
    );
  }
  return (
    <View
      ref={ref}
      {...rest}
      accessibilityRole="tablist"
      accessibilityLabel={label}
      className={`gap-1 border-r border-border bg-surface px-3 ${layout === 'desktop' ? 'w-[240px]' : 'w-[88px] items-center'}`}
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      {children}
    </View>
  );
});

type NavItemProps = TabTriggerSlotProps & { entry: NavEntry; layout: LayoutSize; hidden: boolean };

const NavItem = forwardRef<RNView, NavItemProps>(function NavItem(
  // TabTrigger injects a default row style; drop it so the token classes control layout.
  { entry, layout, hidden, isFocused, style: _ignoredStyle, ...props },
  ref,
) {
  const { colors } = useTheme();
  const bounce = useBounce(!!isFocused);
  if (hidden) return null;

  const onPress: typeof props.onPress = (e) => {
    if (!isFocused) tapFeedback();
    props.onPress?.(e);
  };

  const iconColor = isFocused ? (entry.color ?? colors.primary) : colors.textMuted;
  const a11y = {
    accessibilityRole: 'tab' as const,
    accessibilityLabel: entry.label,
    accessibilityState: { selected: !!isFocused },
  };

  if (layout === 'desktop') {
    return (
      <Pressable
        ref={ref}
        {...props}
        {...a11y}
        onPress={onPress}
        className={`min-h-touch flex-row items-center gap-3 rounded-md px-3 ${isFocused ? 'bg-surface-muted' : ''}`}
      >
        <Animated.View style={bounce}>
          <Icon name={entry.icon} size={22} color={iconColor} />
        </Animated.View>
        <Text variant="label" tone={isFocused ? 'default' : 'muted'}>
          {entry.label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      ref={ref}
      {...props}
      {...a11y}
      onPress={onPress}
      className={`min-h-touch flex-col items-center justify-center gap-1 rounded-md py-1 ${layout === 'phone' ? 'flex-1' : 'w-[72px] py-2'} ${isFocused && layout === 'tablet' ? 'bg-surface-muted' : ''}`}
    >
      <View
        className={`rounded-full px-4 py-1 ${isFocused && layout === 'phone' ? 'bg-surface-muted' : ''}`}
      >
        <Animated.View style={bounce}>
          <Icon name={entry.icon} size={24} color={iconColor} />
        </Animated.View>
      </View>
      <Text variant="caption" tone={isFocused ? 'default' : 'muted'} numberOfLines={1}>
        {entry.label}
      </Text>
    </Pressable>
  );
});
