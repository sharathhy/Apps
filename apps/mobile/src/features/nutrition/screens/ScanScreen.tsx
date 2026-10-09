import { Button, Card, Text, TextField } from '@wellness/ui';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { NutritionPage } from '../components/NutritionPage';
import { cleanBarcode, lookupBarcode, useFoodDraft } from '../openFoodFacts';
import { useNutrition } from '../store';

type State =
  | { kind: 'idle' }
  | { kind: 'looking'; code: string }
  | { kind: 'notFound'; code: string }
  | { kind: 'failed'; code: string };

/**
 * Barcode scan. The camera is only asked for after the person reads what
 * it is used for and taps the button; typing the number works without it.
 */
export function ScanScreen() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOn, setCameraOn] = useState(false);
  const [typed, setTyped] = useState('');
  const [typedError, setTypedError] = useState<string | null>(null);
  const [state, setState] = useState<State>({ kind: 'idle' });
  const busy = useRef(false);

  const look = async (code: string) => {
    if (busy.current) return;
    busy.current = true;
    setCameraOn(false);
    const saved = useNutrition.getState().customFoods.find((f) => f.barcode === code);
    if (saved) {
      busy.current = false;
      router.replace({
        pathname: '/nutrition-tools/[tool]',
        params: { tool: 'food', id: saved.id },
      });
      return;
    }
    setState({ kind: 'looking', code });
    try {
      const draft = await lookupBarcode(code);
      if (!draft) {
        setState({ kind: 'notFound', code });
        return;
      }
      useFoodDraft.setState({ draft });
      router.replace({ pathname: '/nutrition-tools/[tool]', params: { tool: 'food', draft: '1' } });
    } catch {
      setState({ kind: 'failed', code });
    } finally {
      busy.current = false;
    }
  };

  const addYourself = (code: string) => {
    useFoodDraft.setState({ draft: { barcode: code, source: 'manual' } });
    router.replace({ pathname: '/nutrition-tools/[tool]', params: { tool: 'food', draft: '1' } });
  };

  const startCamera = async () => {
    const result = permission?.granted ? permission : await requestPermission();
    if (result.granted) setCameraOn(true);
  };

  return (
    <NutritionPage title={t('nutrition.scan.title')}>
      <Card className="gap-3">
        <Text>{t('nutrition.scan.intro')}</Text>
        <Text variant="footnote" tone="muted">
          {t('nutrition.scan.privacy')}
        </Text>
        {cameraOn ? (
          <View className="overflow-hidden rounded-lg" style={{ height: 280 }}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
              onBarcodeScanned={({ data }) => {
                const code = cleanBarcode(data);
                if (code) void look(code);
              }}
            />
          </View>
        ) : (
          <Button
            variant="accent"
            label={t('nutrition.scan.start')}
            onPress={() => void startCamera()}
          />
        )}
        {permission && !permission.granted && !permission.canAskAgain ? (
          <View className="gap-2">
            <Text tone="muted">{t('nutrition.scan.denied')}</Text>
            <Button
              variant="secondary"
              label={t('nutrition.scan.openSettings')}
              onPress={() => void Linking.openSettings()}
            />
          </View>
        ) : null}
      </Card>

      <Card className="gap-3">
        <TextField
          label={t('nutrition.scan.typeLabel')}
          value={typed}
          onChangeText={setTyped}
          keyboardType="number-pad"
          maxLength={18}
          error={typedError}
        />
        <Button
          variant="secondary"
          label={t('nutrition.scan.lookUp')}
          disabled={state.kind === 'looking'}
          onPress={() => {
            const code = cleanBarcode(typed);
            setTypedError(code ? null : t('nutrition.scan.badCode'));
            if (code) void look(code);
          }}
        />
      </Card>

      {state.kind === 'looking' ? (
        <Text tone="muted" accessibilityLiveRegion="polite">
          {t('nutrition.scan.looking')}
        </Text>
      ) : null}
      {state.kind === 'notFound' || state.kind === 'failed' ? (
        <Card className="gap-2">
          <Text accessibilityLiveRegion="polite">
            {t(state.kind === 'notFound' ? 'nutrition.scan.notFound' : 'nutrition.scan.failed')}
          </Text>
          <Button
            variant="secondary"
            label={t('nutrition.scan.addYourself')}
            onPress={() => addYourself(state.code)}
          />
        </Card>
      ) : null}
    </NutritionPage>
  );
}
