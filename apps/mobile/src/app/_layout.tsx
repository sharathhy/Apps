import '../global.css';
import i18n, { detectLanguage } from '@/i18n';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { ThemeProvider, useTheme } from '@wellness/ui';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  Stack,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { watchSession } from '@/features/account/session';
import { rehydrateAll } from '@/features/data/stores';
import { startNotificationService } from '@/features/notifications/service';
import { AppLockGate } from '@/features/security/AppLockGate';
import { useProfile } from '@/features/profile';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [profileReady, setProfileReady] = useState(false);
  const ready = (fontsLoaded || !!fontError) && profileReady;
  const theme = useProfile((s) => s.theme);
  const setTheme = useProfile((s) => s.setTheme);

  const language = useProfile((s) => s.language);

  useEffect(() => {
    // Every on-device store is loaded before the first screen renders.
    void rehydrateAll().finally(() => setProfileReady(true));
    return watchSession();
  }, []);

  useEffect(() => {
    if (profileReady) void i18n.changeLanguage(language ?? detectLanguage());
  }, [language, profileReady]);

  // Re-registers reminders on every start (also after a reinstall or restart).
  useEffect(() => (profileReady ? startNotificationService() : undefined), [profileReady]);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider preference={theme} onPreferenceChange={setTheme}>
          <AppLockGate>
            <ThemedNavigation />
          </AppLockGate>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedNavigation() {
  const { scheme, colors } = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavigationThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="account/sign-in" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen name="account/sign-up" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen
          name="account/reset-password"
          options={{ headerShown: true, headerTitle: '' }}
        />
        <Stack.Screen
          name="account/update-password"
          options={{ headerShown: true, headerTitle: '' }}
        />
        <Stack.Screen name="privacy/consents" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen
          name="privacy/delete"
          options={{ headerShown: true, headerTitle: '', presentation: 'modal' }}
        />
        <Stack.Screen name="notifications/index" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen
          name="notifications/settings"
          options={{ headerShown: true, headerTitle: '' }}
        />
        <Stack.Screen
          name="notifications/reminder"
          options={{ headerShown: true, headerTitle: '', presentation: 'modal' }}
        />
        <Stack.Screen name="achievements" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen name="breathe" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen name="journal/index" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen name="journal/[id]" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen
          name="support"
          options={{ headerShown: true, headerTitle: '', presentation: 'modal' }}
        />
        <Stack.Screen
          name="setup/[requirement]"
          options={{ headerShown: true, headerTitle: '', presentation: 'modal' }}
        />
        <Stack.Screen
          name="legal/[doc]"
          options={{ headerShown: true, presentation: 'modal', headerTitle: '' }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}
