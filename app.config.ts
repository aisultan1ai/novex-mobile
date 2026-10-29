import type { ConfigContext, ExpoConfig } from 'expo/config';

// Окружение сборки: development | staging | production (см. eas.json и README).
// Адрес API сюда не попадает — он приходит в код через EXPO_PUBLIC_API_URL (src/config.ts).
const APP_ENV = process.env.APP_ENV ?? 'development';

// Bundle id / Android package подтверждены командой Novex. После публикации в сторах не менять.
const BUNDLE_ID = 'kz.novex.app';

const variants: Record<string, { name: string; idSuffix: string }> = {
  development: { name: 'Novex Dev', idSuffix: '.dev' },
  staging: { name: 'Novex Staging', idSuffix: '.staging' },
  production: { name: 'Novex', idSuffix: '' },
};

const variant = variants[APP_ENV] ?? variants.development!;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: variant.name,
  slug: 'novex-mobile',
  version: '1.0.0',
  scheme: 'novex',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  runtimeVersion: { policy: 'appVersion' },
  ios: {
    bundleIdentifier: BUNDLE_ID + variant.idSuffix,
    supportsTablet: false,
  },
  android: {
    package: BUNDLE_ID + variant.idSuffix,
    // Иконки генерирует scripts/generate-icons.js из assets/brand/novex-mark.svg.
    adaptiveIcon: {
      backgroundColor: '#FFFFFF',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    'expo-status-bar',
    'expo-secure-store',
    'expo-localization',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 160,
        backgroundColor: '#FAFAFA',
        dark: { backgroundColor: '#0E1826' },
      },
    ],
    '@sentry/react-native',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appEnv: APP_ENV,
  },
});
