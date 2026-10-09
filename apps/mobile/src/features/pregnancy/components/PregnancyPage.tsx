import { AccentScope, Screen } from '@wellness/ui';
import { Stack } from 'expo-router';
import type { ReactNode } from 'react';

import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';

/** A pregnancy tool page: accent colour, header title and the disclaimer at the bottom. */
export function PregnancyPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <AccentScope module="pregnancy">
      <Screen edgeTop={false}>
        <Stack.Screen options={{ headerTitle: title }} />
        {children}
        <MedicalDisclaimer />
      </Screen>
    </AccentScope>
  );
}
