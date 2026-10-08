import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Light tap feedback for selections and toggles. No-op on web. */
export function tapFeedback() {
  if (Platform.OS === 'web') return;
  void Haptics.selectionAsync().catch(() => undefined);
}
