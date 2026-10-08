import type { ModuleId } from '@wellness/design-tokens';
import { AccentScope, Button, Card, EmptyState, Screen } from '@wellness/ui';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { allModules } from '@/features/registry';

import { useConsent } from './store';

/** Shows a module only after the person has consented to its data category. */
export function ConsentGate({ module, children }: { module: ModuleId; children: ReactNode }) {
  const { t } = useTranslation();
  const granted = useConsent((s) => s.isGranted(module));
  const decide = useConsent((s) => s.decide);
  if (granted) return <>{children}</>;

  const title = t(`modules.${module}.title`);
  return (
    <AccentScope module={module}>
      <Screen>
        <Card>
          <EmptyState
            icon={allModules[module].icon}
            title={t('consent.gateTitle', { module: title })}
            message={`${t('consent.gateMessage')} ${t(`consent.categories.${module}.why`)}`}
          />
          <Button
            label={t('consent.allow')}
            variant="accent"
            onPress={() => decide(module, true)}
          />
          <Button
            label={t('consent.manage')}
            variant="ghost"
            onPress={() => router.push('/privacy/consents')}
          />
        </Card>
        <MedicalDisclaimer />
      </Screen>
    </AccentScope>
  );
}
