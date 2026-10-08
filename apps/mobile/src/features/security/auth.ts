import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

/** App lock uses the device's own fingerprint, face or PIN. Not available on the web. */
export const appLockSupported = Platform.OS !== 'web';

export async function canUseAppLock(): Promise<boolean> {
  if (!appLockSupported) return false;
  const [hardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  // Without biometrics, the device PIN or pattern still works as a fallback.
  return hardware ? enrolled : (await LocalAuthentication.getEnrolledLevelAsync()) > 0;
}

export async function unlock(promptMessage: string): Promise<boolean> {
  if (!appLockSupported) return true;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    disableDeviceFallback: false,
  });
  return result.success;
}
