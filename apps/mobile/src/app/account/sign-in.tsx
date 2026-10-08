import { Button } from '@wellness/ui';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { signIn } from '@/features/account/api';
import { AuthForm } from '@/features/account/AuthForm';

export default function SignInScreen() {
  const { t } = useTranslation();
  return (
    <AuthForm
      title={t('account.signIn')}
      message={t('account.optional')}
      submitLabel={t('account.signIn')}
      fields={['email', 'password']}
      onSubmit={async ({ email, password }) => {
        const result = await signIn(email, password);
        if (result.ok) router.back();
        return result;
      }}
      footer={
        <>
          <Button
            label={t('account.forgot')}
            variant="ghost"
            onPress={() => router.push('/account/reset-password')}
          />
          <Button
            label={t('account.noAccount')}
            variant="ghost"
            onPress={() => router.replace('/account/sign-up')}
          />
        </>
      }
    />
  );
}
