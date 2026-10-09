/* eslint-disable @typescript-eslint/no-require-imports -- jest.mock factories run before imports */
import '@/i18n';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  // Not covered by Reanimated's mock; tests run with motion enabled.
  useReducedMotion: () => false,
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
// The OS notification APIs are replaced by an in-memory scheduler in every test.
jest.mock('expo-notifications', () => require('./src/test/fakeNotifications').fake);
// jest-expo stubs expo-crypto to return undefined; ids must be unique in tests too.
jest.mock('expo-crypto', () => {
  const crypto = require('node:crypto');
  return {
    randomUUID: () => crypto.randomUUID(),
    getRandomBytes: (n: number) => new Uint8Array(crypto.randomBytes(n)),
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digestStringAsync: async (_algorithm: string, data: string) =>
      crypto.createHash('sha256').update(data).digest('hex'),
  };
});
