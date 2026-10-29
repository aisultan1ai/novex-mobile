import { useColorScheme } from 'react-native';

import { useSettingsStore } from '@/store/settings';

import { darkColors, lightColors, type ColorScheme } from './tokens';

export function useIsDark(): boolean {
  const preference = useSettingsStore((s) => s.theme);
  const system = useColorScheme();
  return preference === 'system' ? system === 'dark' : preference === 'dark';
}

export function useColors(): ColorScheme {
  return useIsDark() ? darkColors : lightColors;
}
