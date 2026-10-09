import { Button, Card, Icon, Pressable, Text, TextField, useTheme } from '@wellness/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { PregnancyPage } from '../components/PregnancyPage';
import { usePregnancy } from '../store';

export function NamesScreen() {
  const { t } = useTranslation();
  const { accents } = useTheme();
  const names = usePregnancy((s) => s.names);
  const add = usePregnancy((s) => s.addName);
  const toggle = usePregnancy((s) => s.toggleFavorite);
  const remove = usePregnancy((s) => s.removeName);
  const [text, setText] = useState('');
  const sorted = [...names].sort((a, b) => Number(b.favorite) - Number(a.favorite));

  return (
    <PregnancyPage title={t('pregnancy.tools.names')}>
      <Card className="gap-3">
        <TextField
          label={t('pregnancy.names.label')}
          value={text}
          onChangeText={setText}
          maxLength={100}
          onSubmitEditing={() => {
            add(text);
            setText('');
          }}
        />
        <Button
          variant="accent"
          label={t('pregnancy.names.add')}
          onPress={() => {
            add(text);
            setText('');
          }}
        />
      </Card>
      <Card className="gap-1">
        {sorted.length ? (
          sorted.map((n) => (
            <View key={n.id} className="min-h-touch flex-row items-center gap-2">
              <Text variant="title3" className="flex-1">
                {n.name}
              </Text>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: n.favorite }}
                accessibilityLabel={t('pregnancy.names.favorite', { name: n.name })}
                onPress={() => toggle(n.id)}
                className="min-h-touch min-w-touch items-center justify-center"
              >
                <Icon
                  name={n.favorite ? 'starFilled' : 'star'}
                  size={22}
                  color={n.favorite ? accents.pregnancy.accent : undefined}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('pregnancy.names.delete', { name: n.name })}
                onPress={() => remove(n.id)}
                className="min-h-touch min-w-touch items-center justify-center"
              >
                <Icon name="trash" size={20} />
              </Pressable>
            </View>
          ))
        ) : (
          <Text tone="muted">{t('pregnancy.names.empty')}</Text>
        )}
      </Card>
    </PregnancyPage>
  );
}
