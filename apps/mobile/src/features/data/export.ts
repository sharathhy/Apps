import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { persistedStores, type PersistedStoreKey } from './stores';

export const EXPORT_FORMAT_VERSION = 1;

export interface DataExport {
  format: 'wellness-export';
  formatVersion: number;
  exportedAt: string;
  appVersion: string;
  /** Everything stored on this device. */
  device: Record<PersistedStoreKey, unknown>;
  /** Everything stored in the account, when signed in. */
  account: Record<string, unknown[]> | null;
}

/** Plain data from each store, without functions. */
export function collectDeviceData(): Record<PersistedStoreKey, unknown> {
  const result = {} as Record<PersistedStoreKey, unknown>;
  for (const [key, store] of Object.entries(persistedStores) as [
    PersistedStoreKey,
    (typeof persistedStores)[PersistedStoreKey],
  ][]) {
    const state = store.getState() as unknown as Record<string, unknown>;
    result[key] = Object.fromEntries(
      Object.entries(state).filter(([, v]) => typeof v !== 'function'),
    );
  }
  return result;
}

export function buildExport(
  device: Record<PersistedStoreKey, unknown>,
  account: Record<string, unknown[]> | null,
  now = new Date(),
): DataExport {
  return {
    format: 'wellness-export',
    formatVersion: EXPORT_FORMAT_VERSION,
    exportedAt: now.toISOString(),
    appVersion: Constants.expoConfig?.version ?? '0.0.0',
    device,
    account,
  };
}

export function exportFileName(now = new Date()): string {
  return `wellness-export-${now.toISOString().slice(0, 10)}.json`;
}

/** Saves the export: a download on web, the share sheet on Android and iOS. */
export async function saveExport(data: DataExport): Promise<void> {
  await saveTextFile(
    exportFileName(new Date(data.exportedAt)),
    JSON.stringify(data, null, 2),
    'application/json',
  );
}

/** Saves a text file: a download on web, the share sheet on Android and iOS. */
export async function saveTextFile(name: string, text: string, mimeType: string): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob([text], { type: mimeType });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = name;
    link.click();
    URL.revokeObjectURL(href);
    return;
  }

  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(text);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name });
}
