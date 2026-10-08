import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';

import { sendPasswordReset } from '@/features/account/api';
import { AuthForm } from '@/features/account/AuthForm';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  return (
    <AuthForm
      title={t('account.resetTitle')}
      message={t('account.resetMessage')}
      submitLabel={t('account.sendReset')}
      fields={['email']}
      onSubmit={async ({ email }) => {
        const result = await sendPasswordReset(
          email,
          Linking.createURL('/account/update-password'),
        );
        // Same message whether or not the account exists, so emails cannot be probed.
        return result.ok ? { ok: true, notice: t('account.resetSent') } : result;
      }}
    />
  );
}
