import { Redirect } from 'expo-router';

import { AppNavigation } from '@/components/AppNavigation';
import { useProfile } from '@/features/profile';

export default function TabsLayout() {
  const audience = useProfile((s) => s.audience);
  // First run: ask who the app is for before showing any trackers.
  if (!audience) return <Redirect href="/welcome" />;
  return <AppNavigation />;
}
