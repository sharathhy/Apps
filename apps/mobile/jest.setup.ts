/* eslint-disable @typescript-eslint/no-require-imports -- jest.mock factories run before imports */
import '@/i18n';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  // Not covered by Reanimated's mock; tests run with motion enabled.
  useReducedMotion: () => false,
}));
