import { Redirect } from 'expo-router';

import { AppNavigation } from '@/components/AppNavigation';
import { useProfile } from '@/features/profile';

export default function TabsLayout() {
  const onboarded = useProfile((s) => !!s.onboardingCompletedAt && !!s.audience);
  // First run: onboarding (who it is for, privacy, consent, notifications).
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <AppNavigation />;
}
