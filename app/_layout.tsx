import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/i18n';
import { useBootstrapSession } from '@/features/session/useBootstrapSession';
import { useSyncLocale } from '@/i18n/useSyncLocale';
import { createQueryClient } from '@/lib/queryClient';
import { initSentry, Sentry } from '@/lib/sentry';
import { useColors, useIsDark } from '@/ui';

initSentry();
void SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });
  const colors = useColors();
  const isDark = useIsDark();
  useSyncLocale();
  useBootstrapSession();

  // Шрифт не загрузился — показываем приложение на системном, а не висим на сплэше.
  const ready = fontsLoaded || !!fontError;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            {/* Гостевой режим: приложение открывается сразу на вкладках, вход — только по требованию. */}
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="quote/[id]" />
            <Stack.Screen name="checkout/[draftId]" />
            <Stack.Screen name="tracking/[number]" />
            {/* Soft Wall поверх тарифов: после входа экран под ним продолжает оформление. */}
            <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });

export default Sentry.wrap(RootLayout);
