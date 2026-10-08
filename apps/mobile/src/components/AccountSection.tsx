import { Text } from '@wellness/ui';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { signOut } from '@/features/account/api';
import { useSession } from '@/features/account/session';
import { isBackendConfigured } from '@/lib/supabase';

import { ListRow } from './ListRow';

export function AccountSection() {
  const { t } = useTranslation();
  const session = useSession((s) => s.session);

  if (!isBackendConfigured) {
    return (
      <Text variant="footnote" tone="muted">
        {t('account.notConfigured')}
      </Text>
    );
  }
  if (session) {
    return (
      <>
        <Text>{t('account.signedInAs', { email: session.user.email ?? '' })}</Text>
        <ListRow icon="shield" label={t('account.signOut')} onPress={() => void signOut()} />
      </>
    );
  }
  return (
    <>
      <Text variant="footnote" tone="muted">
        {t('account.optional')}
      </Text>
      <ListRow
        icon="shield"
        label={t('account.signUp')}
        onPress={() => router.push('/account/sign-up')}
      />
      <ListRow
        icon="info"
        label={t('account.signIn')}
        onPress={() => router.push('/account/sign-in')}
      />
    </>
  );
}
