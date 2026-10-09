import { Button, Card, Icon, Pressable, Text, TextField, useTheme } from '@wellness/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { toggleBagItem } from '../actions';
import { PregnancyPage } from '../components/PregnancyPage';
import { usePregnancy, type BagItem } from '../store';

export function BagScreen() {
  const { t } = useTranslation();
  const { accents, colors } = useTheme();
  const bag = usePregnancy((s) => s.bag);
  const add = usePregnancy((s) => s.addBagItem);
  const remove = usePregnancy((s) => s.removeBagItem);
  const [text, setText] = useState('');
  const packed = bag.filter((b) => b.done).length;
  const label = (b: BagItem) => (b.key ? t(`pregnancy.bag.items.${b.key}`) : b.label);

  return (
    <PregnancyPage title={t('pregnancy.tools.bag')}>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t('pregnancy.bag.progress', { packed, total: bag.length })}
      </Text>
      <Card className="gap-1">
        {bag.map((b) => (
          <View key={b.id} className="min-h-touch flex-row items-center gap-2">
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: b.done }}
              accessibilityLabel={label(b)}
              onPress={() => void toggleBagItem(b.id)}
              noScale
              className="min-h-touch flex-1 flex-row items-center gap-3"
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: b.done ? accents.pregnancy.accent : colors.borderStrong,
                  backgroundColor: b.done ? accents.pregnancy.accent : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {b.done ? <Text style={{ color: accents.pregnancy.onAccent }}>✓</Text> : null}
              </View>
              <Text
                className="flex-1"
                style={b.done ? { textDecorationLine: 'line-through' } : undefined}
                tone={b.done ? 'muted' : undefined}
              >
                {label(b)}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('pregnancy.bag.delete', { item: label(b) })}
              onPress={() => remove(b.id)}
              className="min-h-touch min-w-touch items-center justify-center"
            >
              <Icon name="trash" size={20} />
            </Pressable>
          </View>
        ))}
      </Card>
      <Card className="gap-3">
        <TextField
          label={t('pregnancy.bag.addLabel')}
          value={text}
          onChangeText={setText}
          maxLength={200}
        />
        <Button
          variant="secondary"
          label={t('pregnancy.bag.add')}
          onPress={() => {
            add(text);
            setText('');
          }}
        />
        <Text variant="footnote" tone="muted">
          {t('pregnancy.bag.source')}
        </Text>
      </Card>
    </PregnancyPage>
  );
}
