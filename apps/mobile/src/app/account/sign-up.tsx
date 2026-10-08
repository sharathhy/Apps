import { Button } from '@wellness/ui';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { signUp, syncAfterSignIn } from '@/features/account/api';
import { AuthForm } from '@/features/account/AuthForm';

export default function SignUpScreen() {
  const { t } = useTranslation();
  return (
    <AuthForm
      title={t('account.signUp')}
      message={t('account.optional')}
      submitLabel={t('account.signUp')}
      fields={['email', 'newPassword']}
      onSubmit={async ({ email, password }) => {
        const result = await signUp(email, password, Linking.createURL('/settings'));
        if (!result.ok) return result;
        if (result.needsConfirmation) return { ok: true, notice: t('account.confirmEmail') };
        await syncAfterSignIn();
        router.back();
        return result;
      }}
      footer={
        <Button
          label={t('account.haveAccount')}
          variant="ghost"
          onPress={() => router.replace('/account/sign-in')}
        />
      }
    />
  );
}
