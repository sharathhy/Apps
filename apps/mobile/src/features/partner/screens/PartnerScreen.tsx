import { Button, Card, Text, TextField } from '@wellness/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { useSession } from '@/features/account/session';
import { useConsent } from '@/features/consent/store';
import { PregnancyPage } from '@/features/pregnancy/components/PregnancyPage';
import { formatDate } from '@/lib/region';
import { isBackendConfigured } from '@/lib/supabase';
import { useRegion } from '@/lib/useRegion';

import { createInvite, endLink, grantSharingConsent, withdrawSharingConsent } from '../api';
import { shareScopes, type ShareScope } from '../model';
import { usePartner } from '../store';
import { useLinks } from '../useLinks';

/** The owner's side of partner sharing: consent, invite codes and who can see what. */
export function PartnerScreen() {
  const { t } = useTranslation();
  const session = useSession((s) => s.session);
  const granted = useConsent((s) => s.isGranted('partner_sharing'));

  return (
    <PregnancyPage title={t('pregnancy.tools.partner')}>
      <Card className="gap-2">
        <Text variant="title3">{t('partner.owner.title')}</Text>
        <Text>{t('partner.owner.intro')}</Text>
        <Text variant="label">{t('partner.owner.sharedTitle')}</Text>
        {shareScopes.map((s) => (
          <Text key={s}>• {t(`partner.scopes.${s}`)}</Text>
        ))}
        <Text variant="label">{t('partner.owner.neverTitle')}</Text>
        <Text>{t('partner.owner.never')}</Text>
      </Card>
      {!isBackendConfigured ? (
        <Text tone="muted">{t('partner.noBackend')}</Text>
      ) : !session ? (
        <Card className="gap-3">
          <Text>{t('partner.needAccount')}</Text>
          <Button label={t('partner.signIn')} onPress={() => router.push('/account/sign-in')} />
        </Card>
      ) : !granted ? (
        <ConsentCard />
      ) : (
        <SharingControls />
      )}
    </PregnancyPage>
  );
}

function ConsentCard() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Card className="gap-3">
      <Text variant="title3">{t('partner.consent.title')}</Text>
      <Text>{t('partner.consent.body')}</Text>
      <Button
        variant="accent"
        label={t('partner.consent.agree')}
        disabled={busy}
        onPress={() => {
          setBusy(true);
          grantSharingConsent()
            .catch((e: Error) => setError(e.message))
            .finally(() => setBusy(false));
        }}
      />
      {error ? <Text tone="danger">{error}</Text> : null}
    </Card>
  );
}

function SharingControls() {
  const { t } = useTranslation();
  const { dateOrder } = useRegion();
  const scopes = usePartner((s) => s.scopes);
  const setScopes = usePartner((s) => s.setScopes);
  const { mine, loading, error, reload } = useLinks();
  const [label, setLabel] = useState('');
  const [invite, setInvite] = useState<{ code: string; expiresAt: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = (scope: ShareScope) => {
    const next = scopes.includes(scope) ? scopes.filter((s) => s !== scope) : [...scopes, scope];
    if (next.length) setScopes(shareScopes.filter((s) => next.includes(s)));
  };

  const run = (task: () => Promise<void>) => {
    setBusy(true);
    setMessage(null);
    task()
      .catch((e: Error) => setMessage(e.message))
      .finally(() => setBusy(false));
  };

  const expires = invite ? formatDate(new Date(invite.expiresAt), dateOrder) : '';

  return (
    <>
      <Card className="gap-3">
        <Text variant="title3">{t('partner.invite.title')}</Text>
        <Text variant="label" tone="muted">
          {t('partner.invite.choose')}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {shareScopes.map((s) => (
            <Chip
              key={s}
              role="checkbox"
              selected={scopes.includes(s)}
              label={t(`partner.scopes.${s}`)}
              onPress={() => toggle(s)}
            />
          ))}
        </View>
        <TextField
          label={t('partner.invite.label')}
          value={label}
          onChangeText={setLabel}
          maxLength={60}
        />
        <Button
          variant="accent"
          label={t('partner.invite.create')}
          disabled={busy}
          onPress={() =>
            run(async () => {
              setInvite(await createInvite(scopes, label));
            })
          }
        />
        {invite ? (
          <View className="gap-2 rounded-lg bg-accent-soft p-4" accessibilityLiveRegion="polite">
            <Text variant="label">{t('partner.invite.codeTitle')}</Text>
            <Text
              variant="title1"
              selectable
              accessibilityLabel={invite.code.split('').join(' ')}
              style={{ letterSpacing: 4, fontVariant: ['tabular-nums'] }}
            >
              {invite.code}
            </Text>
            <Text variant="footnote">{t('partner.invite.expires', { date: expires })}</Text>
            <Button
              variant="secondary"
              label={t('partner.invite.share')}
              onPress={() =>
                void Share.share({
                  message: t('partner.invite.message', { code: invite.code, date: expires }),
                })
              }
            />
          </View>
        ) : null}
      </Card>

      <Card className="gap-2">
        <Text variant="title3">{t('partner.links.title')}</Text>
        {loading ? <Text tone="muted">{t('partner.links.loading')}</Text> : null}
        {error ? <Text tone="danger">{error}</Text> : null}
        {!loading && !mine.length ? <Text tone="muted">{t('partner.links.none')}</Text> : null}
        {mine.map((l) => (
          <View key={l.id} className="gap-2 border-b border-border pb-3">
            <Text variant="label">
              {t('partner.links.since', {
                date: formatDate(new Date(l.created_at), dateOrder),
              })}
            </Text>
            <Text variant="footnote" tone="muted">
              {l.scopes.map((s) => t(`partner.scopes.${s}`)).join(', ')}
            </Text>
            <Button
              variant="secondary"
              label={t('partner.links.stop')}
              disabled={busy}
              onPress={() =>
                run(async () => {
                  await endLink(l.id);
                  reload();
                  setMessage(t('partner.links.stopped'));
                })
              }
            />
          </View>
        ))}
        {message ? (
          <Text tone="muted" accessibilityLiveRegion="polite">
            {message}
          </Text>
        ) : null}
      </Card>

      <Card tone="muted" className="gap-2">
        <Text variant="label">{t('partner.withdraw.title')}</Text>
        <Text variant="footnote">{t('partner.withdraw.body')}</Text>
        <Button
          variant="danger"
          label={t('partner.withdraw.button')}
          disabled={busy}
          onPress={() =>
            run(async () => {
              await withdrawSharingConsent();
              setInvite(null);
              reload();
            })
          }
        />
      </Card>
    </>
  );
}
