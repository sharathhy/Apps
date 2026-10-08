import {
  AccentScope,
  Appear,
  Button,
  Card,
  Icon,
  Pressable,
  Screen,
  Text,
  TextField,
  useTheme,
} from '@wellness/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Chip } from '@/components/Chip';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { currentStreakWithGrace } from '@/features/achievements/engine';
import { deviceTimeZone } from '@/lib/time/device';
import { localDateKey } from '@/lib/time/zoned';
import { tapFeedback } from '@/lib/haptics';

import { checkIn } from '../actions';
import { SupportCard } from '../components/SupportCard';
import { mentionsSelfHarm } from '../crisis';
import { moodModule } from '../manifest';
import {
  activityTags,
  daysOfMonth,
  feelingTags,
  MAX_NOTE_LENGTH,
  moodByDay,
  moodEmoji,
  moodLevels,
  monthInsights,
  type MoodLevel,
  type MoodTag,
} from '../model';
import { useMood } from '../store';

export function MoodScreen() {
  const { t } = useTranslation();
  const { accents } = useTheme();
  return (
    <AccentScope module="mood">
      <Screen>
        <View className="flex-row items-center gap-3">
          <View className="rounded-lg bg-accent-soft p-2">
            <Icon name={moodModule.icon} size={28} color={accents.mood.accent} />
          </View>
          <View className="flex-1">
            <Text variant="title1">{t('modules.mood.title')}</Text>
            <Text tone="muted">{t('mood.subtitle')}</Text>
          </View>
        </View>
        <Appear>
          <CheckInCard />
        </Appear>
        <Appear index={1}>
          <View className="flex-row gap-3">
            <ShortcutCard
              icon="wind"
              title={t('mood.breathe.title')}
              hint={t('mood.breathe.short')}
              href="/breathe"
            />
            <ShortcutCard
              icon="book"
              title={t('mood.journal.title')}
              hint={t('mood.journal.short')}
              href="/journal"
            />
          </View>
        </Appear>
        <Appear index={2}>
          <InsightsCard />
        </Appear>
        <RecentCard />
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/support')}
          noScale
          className="min-h-touch flex-row items-center gap-2"
        >
          <Icon name="info" size={20} />
          <Text tone="primary" variant="label">
            {t('support.link')}
          </Text>
        </Pressable>
        <MedicalDisclaimer />
      </Screen>
    </AccentScope>
  );
}

function ShortcutCard({
  icon,
  title,
  hint,
  href,
}: {
  icon: 'wind' | 'book';
  title: string;
  hint: string;
  href: '/breathe' | '/journal';
}) {
  const { accents } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${title}. ${hint}`}
      onPress={() => router.push(href)}
      className="flex-1"
    >
      <Card tone="accent" className="gap-2">
        <Icon name={icon} size={26} color={accents.mood.accent} />
        <Text variant="label">{title}</Text>
        <Text variant="footnote">{hint}</Text>
      </Card>
    </Pressable>
  );
}

function CheckInCard() {
  const { t } = useTranslation();
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [tags, setTags] = useState<MoodTag[]>([]);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState<{ crisis: boolean } | null>(null);

  const toggle = (tag: MoodTag) =>
    setTags((all) => (all.includes(tag) ? all.filter((x) => x !== tag) : [...all, tag]));

  const save = async () => {
    if (!mood) return;
    const crisis = mentionsSelfHarm(note);
    await checkIn(mood, tags, note);
    setSaved({ crisis });
    setMood(null);
    setTags([]);
    setNote('');
  };

  return (
    <View className="gap-3">
      <Card className="gap-3">
        <Text variant="title3">{t('mood.checkIn.title')}</Text>
        <View className="flex-row justify-between" accessibilityRole="radiogroup">
          {moodLevels.map((level) => (
            <Pressable
              key={level}
              accessibilityRole="radio"
              accessibilityLabel={t(`mood.levels.${level}`)}
              accessibilityState={{ selected: mood === level }}
              onPress={() => {
                tapFeedback();
                setSaved(null);
                setMood(level);
              }}
              className={`min-h-touch min-w-touch items-center gap-1 rounded-lg p-2 ${mood === level ? 'bg-accent-soft' : ''}`}
            >
              <Text style={{ fontSize: 30, lineHeight: 38 }} importantForAccessibility="no">
                {moodEmoji[level]}
              </Text>
              <Text variant="caption" tone={mood === level ? 'accent' : 'muted'}>
                {t(`mood.levels.${level}`)}
              </Text>
            </Pressable>
          ))}
        </View>
        {mood ? (
          <>
            <TagGroup
              title={t('mood.checkIn.feelings')}
              tags={feelingTags}
              selected={tags}
              onToggle={toggle}
            />
            <TagGroup
              title={t('mood.checkIn.activities')}
              tags={activityTags}
              selected={tags}
              onToggle={toggle}
            />
            <TextField
              label={t('mood.checkIn.note')}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={MAX_NOTE_LENGTH}
              hint={t('mood.checkIn.notePrivate')}
            />
            <Button variant="accent" label={t('mood.checkIn.save')} onPress={() => void save()} />
          </>
        ) : null}
        {saved ? (
          <Text tone="accent" accessibilityLiveRegion="polite">
            {t('mood.checkIn.saved')}
          </Text>
        ) : null}
      </Card>
      {saved?.crisis ? <SupportCard prominent /> : null}
    </View>
  );
}

function TagGroup({
  title,
  tags,
  selected,
  onToggle,
}: {
  title: string;
  tags: readonly MoodTag[];
  selected: MoodTag[];
  onToggle: (tag: MoodTag) => void;
}) {
  const { t } = useTranslation();
  return (
    <View className="gap-2">
      <Text variant="label" tone="muted">
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {tags.map((tag) => (
          <Chip
            key={tag}
            role="checkbox"
            selected={selected.includes(tag)}
            label={t(`mood.tags.${tag}`)}
            onPress={() => onToggle(tag)}
          />
        ))}
      </View>
    </View>
  );
}

function InsightsCard() {
  const { t, i18n } = useTranslation();
  const { accents, colors } = useTheme();
  const entries = useMood((s) => s.entries);
  const today = localDateKey(new Date(), deviceTimeZone());
  const month = today.slice(0, 7);
  const insights = monthInsights(entries, month);
  const byDay = moodByDay(entries);
  const streak = currentStreakWithGrace(
    entries.map((e) => e.day),
    today,
  );
  const days = daysOfMonth(month);
  const firstWeekday = (new Date(`${days[0]}T12:00:00Z`).getUTCDay() + 6) % 7; // Monday first
  const total = Object.values(insights.distribution).reduce((a, b) => a + b, 0);
  const monthName = new Date(`${month}-15T12:00:00Z`).toLocaleDateString(i18n.language, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <Card className="gap-3">
      <Text variant="title3">{t('mood.insights.title', { month: monthName })}</Text>
      <View className="flex-row gap-4">
        <Stat value={String(insights.daysCheckedIn)} label={t('mood.insights.daysCheckedIn')} />
        <Stat value={String(streak)} label={t('mood.insights.streak')} />
      </View>

      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={t('mood.insights.calendarSummary', {
          count: insights.daysCheckedIn,
          month: monthName,
        })}
        className="gap-1"
      >
        <View className="flex-row flex-wrap">
          {Array.from({ length: firstWeekday }, (_, i) => (
            <View key={`pad-${i}`} style={{ width: `${100 / 7}%` }} />
          ))}
          {days.map((day) => {
            const level = byDay.get(day);
            return (
              <View key={day} style={{ width: `${100 / 7}%` }} className="items-center py-1">
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: level ? accents.mood.accent : colors.surfaceMuted,
                    opacity: level ? 0.35 + level * 0.13 : 1,
                  }}
                  className="items-center justify-center"
                >
                  <Text variant="caption" tone={level ? 'onAccent' : 'muted'}>
                    {Number(day.slice(8))}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {total > 0 ? (
        <View className="gap-1">
          {[...moodLevels].reverse().map((level) => (
            <View key={level} className="flex-row items-center gap-2">
              <Text variant="footnote" className="w-24">
                {moodEmoji[level]} {t(`mood.levels.${level}`)}
              </Text>
              <View className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                <View
                  style={{
                    width: `${(insights.distribution[level] / total) * 100}%`,
                    height: '100%',
                    backgroundColor: accents.mood.accent,
                  }}
                />
              </View>
              <Text variant="footnote" tone="muted" className="w-6 text-right">
                {insights.distribution[level]}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text tone="muted">{t('mood.insights.empty')}</Text>
      )}

      {insights.brighterDayTags.length ? (
        <Text>
          {t('mood.insights.brighterDays', {
            tags: insights.brighterDayTags.map((tag) => t(`mood.tags.${tag}`)).join(', '),
          })}
        </Text>
      ) : null}
      <Text variant="footnote" tone="muted">
        {t('mood.insights.patternsNote')}
      </Text>
    </Card>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View
      className="flex-1 rounded-md bg-surface-muted p-3"
      accessible
      accessibilityLabel={`${value} ${label}`}
    >
      <Text variant="title2">{value}</Text>
      <Text variant="footnote" tone="muted">
        {label}
      </Text>
    </View>
  );
}

function RecentCard() {
  const { t, i18n } = useTranslation();
  const entries = useMood((s) => s.entries).slice(0, 5);
  const removeEntry = useMood((s) => s.removeEntry);
  if (!entries.length) return null;
  return (
    <Card className="gap-2">
      <Text variant="title3">{t('mood.recent')}</Text>
      {entries.map((e) => (
        <View key={e.id} className="min-h-touch flex-row items-center gap-3">
          <Text style={{ fontSize: 22, lineHeight: 28 }} importantForAccessibility="no">
            {moodEmoji[e.mood]}
          </Text>
          <View className="flex-1">
            <Text variant="label">{t(`mood.levels.${e.mood}`)}</Text>
            <Text variant="footnote" tone="muted" numberOfLines={1}>
              {new Date(e.at).toLocaleString(i18n.language, {
                weekday: 'short',
                hour: 'numeric',
                minute: '2-digit',
              })}
              {e.tags.length ? ` · ${e.tags.map((tag) => t(`mood.tags.${tag}`)).join(', ')}` : ''}
            </Text>
          </View>
          <Button
            variant="ghost"
            label={t('water.delete')}
            accessibilityLabel={t('mood.deleteEntry', { mood: t(`mood.levels.${e.mood}`) })}
            onPress={() => removeEntry(e.id)}
          />
        </View>
      ))}
    </Card>
  );
}
