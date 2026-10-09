import { useLocalSearchParams } from 'expo-router';
import type { ComponentType } from 'react';

import { ModuleRoute } from '@/components/ModuleRoute';
import { PartnerScreen } from '@/features/partner/screens/PartnerScreen';
import { AppointmentsScreen } from '@/features/pregnancy/screens/AppointmentsScreen';
import { BagScreen } from '@/features/pregnancy/screens/BagScreen';
import { KicksScreen } from '@/features/pregnancy/screens/KicksScreen';
import { NamesScreen } from '@/features/pregnancy/screens/NamesScreen';
import { SymptomsScreen } from '@/features/pregnancy/screens/SymptomsScreen';
import { WeeksScreen } from '@/features/pregnancy/screens/WeeksScreen';
import { WeightScreen } from '@/features/pregnancy/screens/WeightScreen';
import { pregnancyTools, type PregnancyToolId } from '@/features/pregnancy/tools';

const screens: Record<PregnancyToolId, ComponentType> = {
  weeks: WeeksScreen,
  appointments: AppointmentsScreen,
  symptoms: SymptomsScreen,
  kicks: KicksScreen,
  weight: WeightScreen,
  names: NamesScreen,
  bag: BagScreen,
  partner: PartnerScreen,
};

export function generateStaticParams() {
  return pregnancyTools.map((tool) => ({ tool: tool.id }));
}

export default function PregnancyToolRoute() {
  const { tool } = useLocalSearchParams<{ tool: PregnancyToolId }>();
  return <ModuleRoute id="pregnancy" screen={screens[tool] ?? WeeksScreen} />;
}
