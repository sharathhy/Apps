import { useTranslation } from 'react-i18next';

import { updatePassword } from '@/features/account/api';
import { AuthForm } from '@/features/account/AuthForm';

/** Opened from the password reset email; Supabase signs the person in from the link. */
export default function UpdatePasswordScreen() {
  const { t } = useTranslation();
  return (
    <AuthForm
      title={t('account.updateTitle')}
      submitLabel={t('account.save')}
      fields={['newPassword']}
      onSubmit={async ({ password }) => {
        const result = await updatePassword(password);
        return result.ok ? { ok: true, notice: t('account.updateDone') } : result;
      }}
    />
  );
}
