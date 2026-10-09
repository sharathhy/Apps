import { Button, Card, Screen, Text, TextField } from '@wellness/ui';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';

import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { SwitchRow } from '@/components/SwitchRow';
import { useSession } from '@/features/account/session';
import { formatDate, formatDateKey } from '@/lib/region';
import { isBackendConfigured } from '@/lib/supabase';
import { deviceTimeZone } from '@/lib/time/device';
import { localDateKey } from '@/lib/time/zoned';
import { useRegion } from '@/lib/useRegion';

import {
  acceptInvite,
  endLink,
  fetchShared,
  registerForPartnerUpdates,
  unregisterPartnerUpdates,
  type PartnerLink,
} from '../api';
import { sharedWeek, type Snapshots } from '../model';
import { usePartner } from '../store';
import { useLinks } from '../useLinks';

/** The partner's side: join with a code and see what has been shared with you. */
export function SharedWithMeScreen() {
  const { t } = useTranslation();
  const session = useSession((s) => s.session);
  return (
    <Screen edgeTop={false}>
      <Stack.Screen options={{ headerTitle: t('partner.title') }} />
      <Text tone="muted">{t('partner.partnerIntro')}</Text>
      {!isBackendConfigured ? (
        <Text tone="muted">{t('partner.noBackend')}</Text>
      ) : !session ? (
        <Card className="gap-3">
          <Text>{t('partner.needAccount')}</Text>
          <Button label={t('partner.signIn')} onPress={() => router.push('/account/sign-in')} />
        </Card>
      ) : (
        <Shared />
      )}
      <MedicalDisclaimer />
    </Screen>
  );
}

function Shared() {
  const { t } = useTranslation();
  const { withMe, loading, error, reload } = useLinks();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ tone: 'accent' | 'danger'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const join = () => {
    setBusy(true);
    setMessage(null);
    acceptInvite(code)
      .then(() => {
        setCode('');
        setMessage({ tone: 'accent', text: t('partner.join.joined') });
        reload();
      })
      .catch(() => setMessage({ tone: 'danger', text: t('partner.join.invalid') }))
      .finally(() => setBusy(false));
  };

  return (
    <>
      <Card className="gap-3">
        <Text variant="title3">{t('partner.join.title')}</Text>
        <TextField
          label={t('partner.join.label')}
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          maxLength={12}
        />
        <Button variant="primary" label={t('partner.join.button')} disabled={busy} onPress={join} />
        {message ? (
          <Text tone={message.tone} accessibilityLiveRegion="polite">
            {message.text}
          </Text>
        ) : null}
      </Card>
      {loading ? <Text tone="muted">{t('partner.links.loading')}</Text> : null}
      {error ? <Text tone="danger">{error}</Text> : null}
      {withMe.map((link) => (
        <SharedCard key={link.id} link={link} onEnded={reload} />
      ))}
      {withMe.length && Platform.OS !== 'web' ? <NotifyRow /> : null}
    </>
  );
}

function SharedCard({ link, onEnded }: { link: PartnerLink; onEnded: () => void }) {
  const { t, i18n } = useTranslation();
  const { dateOrder } = useRegion();
  const [data, setData] = useState<Partial<Snapshots> | null>(null);
  const today = localDateKey(new Date(), deviceTimeZone());

  useEffect(() => {
    let cancelled = false;
    fetchShared(link.user_id).then(
      (d) => {
        if (!cancelled) setData(d);
      },
      () => {
        if (!cancelled) setData({});
      },
    );
    return () => {
      cancelled = true;
    };
  }, [link.user_id]);

  const age = sharedWeek(data?.week ?? null, today);
  return (
    <Card className="gap-3">
      <Text variant="title3">
        {link.label ? t('partner.shared.from', { name: link.label }) : t('partner.shared.title')}
      </Text>
      {data === null ? <Text tone="muted">{t('partner.links.loading')}</Text> : null}
      {age && data?.week ? (
        <View className="gap-1">
          <Text variant="label">
            {t('pregnancy.week.weeksDays', { weeks: age.weeks, days: age.days })}
          </Text>
          <Text tone="muted">
            {t('pregnancy.week.due', {
              date: formatDateKey(data.week.dueDate, dateOrder),
              count: Math.max(0, age.daysToGo),
            })}
          </Text>
        </View>
      ) : null}
      {data?.appointments ? (
        <View className="gap-1">
          <Text variant="label">{t('partner.scopes.appointments')}</Text>
          {data.appointments.length ? (
            data.appointments.map((a) => (
              <Text key={a.at + a.title}>
                {a.title} · {formatDate(new Date(a.at), dateOrder)},{' '}
                {new Date(a.at).toLocaleTimeString(i18n.language, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            ))
          ) : (
            <Text tone="muted">{t('pregnancy.appointments.none')}</Text>
          )}
        </View>
      ) : null}
      {data?.kicks ? (
        <View className="gap-1">
          <Text variant="label">{t('partner.scopes.kicks')}</Text>
          {data.kicks.length ? (
            data.kicks.map((k) => (
              <Text key={k.startedAt}>
                {formatDate(new Date(k.startedAt), dateOrder)} ·{' '}
                {t('pregnancy.kicks.session', { count: k.count, minutes: k.minutes })}
              </Text>
            ))
          ) : (
            <Text tone="muted">{t('partner.shared.noKicks')}</Text>
          )}
        </View>
      ) : null}
      <Button
        variant="secondary"
        label={t('partner.shared.leave')}
        onPress={() => void endLink(link.id).then(onEnded)}
      />
    </Card>
  );
}

function NotifyRow() {
  const { t } = useTranslation();
  const on = usePartner((s) => s.notifyMe);
  const setOn = usePartner((s) => s.setNotifyMe);
  const [note, setNote] = useState<string | null>(null);
  return (
    <Card className="gap-1">
      <SwitchRow
        icon="bell"
        title={t('partner.notify.title')}
        description={t('partner.notify.description')}
        value={on}
        onChange={(value) => {
          setNote(null);
          if (!value) {
            setOn(false);
            void unregisterPartnerUpdates();
            return;
          }
          void registerForPartnerUpdates().then((result) => {
            if (result === 'ok') setOn(true);
            else setNote(t(`partner.notify.${result}`));
          });
        }}
      />
      {note ? (
        <Text variant="footnote" tone="muted">
          {note}
        </Text>
      ) : null}
    </Card>
  );
}
