import 'react-native-gesture-handler/jestSetup';

process.env.EXPO_PUBLIC_API_URL = 'https://api.test/api/v1';
process.env.EXPO_PUBLIC_APP_ENV = 'development';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Нативных модулей анимаций в Jest нет: официальный мок Worklets и свой мок Reanimated (см. файл).
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('./__tests__/mocks/reanimated'));
