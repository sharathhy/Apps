import { useTheme } from '@wellness/ui';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SwitchRow } from '@/components/SwitchRow';
import { allModules } from '@/features/registry';

import { type ListedConsentCategory } from './categories';
import { useConsent } from './store';

/** One switch per data category, each explaining what is stored and why. */
export function ConsentList({ categories }: { categories: ListedConsentCategory[] }) {
  const { t } = useTranslation();
  const { accents, colors } = useTheme();
  const records = useConsent((s) => s.records);
  const decide = useConsent((s) => s.decide);
  const granted = useConsent((s) => s.isGranted);
  void records; // subscribe so switches update after each decision

  return (
    <View className="gap-1">
      {categories.map((category) => {
        const isModule = category !== 'anonymous_analytics';
        return (
          <SwitchRow
            key={category}
            icon={isModule ? allModules[category].icon : 'info'}
            iconColor={isModule ? accents[category].accent : colors.textMuted}
            title={t(`consent.categories.${category}.title`)}
            description={t(`consent.categories.${category}.why`)}
            value={granted(category)}
            onChange={(on) => decide(category, on)}
          />
        );
      })}
    </View>
  );
}
