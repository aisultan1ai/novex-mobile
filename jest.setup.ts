import 'react-native-gesture-handler/jestSetup';

process.env.EXPO_PUBLIC_API_URL = 'https://api.test/api/v1';
process.env.EXPO_PUBLIC_APP_ENV = 'development';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Нативных модулей анимаций в Jest нет: официальный мок Worklets и свой мок Reanimated.
// 'react-native-reanimated/mock' указывает на __tests__/mocks/reanimated.tsx (package.json, moduleNameMapper),
// чтобы тот же мок получала и тестовая обвязка expo-router, которая мокает Reanimated сама.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Safe area в Jest: официальный мок пакета (нулевые отступы, кадр 390×844).
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
