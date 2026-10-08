import { Button, Card, Screen, Text, TextField } from '@wellness/ui';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { validateEmail, validatePassword } from './validation';

interface AuthFormProps {
  title: string;
  message?: string;
  submitLabel: string;
  fields: ('email' | 'password' | 'newPassword')[];
  onSubmit: (values: {
    email: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string; notice?: string }>;
  footer?: ReactNode;
}

/** Shared layout and validation for the sign-in, sign-up and password screens. */
export function AuthForm({ title, message, submitLabel, fields, onSubmit, footer }: AuthFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const needsEmail = fields.includes('email');
  const passwordField = fields.find((f) => f !== 'email');
  const emailError = needsEmail ? validateEmail(email) : null;
  const passwordError = passwordField ? validatePassword(password) : null;

  const submit = async () => {
    setTouched(true);
    setServerError(null);
    setNotice(null);
    if (emailError || passwordError) return;
    setBusy(true);
    try {
      const result = await onSubmit({ email, password });
      if (!result.ok) setServerError(result.error ?? t('states.errorMessage'));
      else if (result.notice) setNotice(result.notice);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edgeTop={false}>
      <View className="gap-2">
        <Text variant="title1">{title}</Text>
        {message ? <Text tone="muted">{message}</Text> : null}
      </View>
      <Card className="gap-4">
        {needsEmail ? (
          <TextField
            label={t('account.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            error={touched && emailError ? t(`account.errors.${emailError}`) : null}
          />
        ) : null}
        {passwordField ? (
          <TextField
            label={t(`account.${passwordField}`)}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={passwordField === 'newPassword' ? 'new-password' : 'current-password'}
            textContentType={passwordField === 'newPassword' ? 'newPassword' : 'password'}
            error={touched && passwordError ? t(`account.errors.${passwordError}`) : null}
            onSubmitEditing={() => void submit()}
          />
        ) : null}
        {serverError ? (
          <Text tone="danger" accessibilityRole="alert">
            {serverError}
          </Text>
        ) : null}
        {notice ? (
          <Text tone="primary" accessibilityRole="alert">
            {notice}
          </Text>
        ) : null}
        <Button label={submitLabel} loading={busy} onPress={() => void submit()} />
      </Card>
      {footer}
    </Screen>
  );
}
