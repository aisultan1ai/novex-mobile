import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { Text } from './Text';
import { useColors } from './theme';
import { fonts, lightColors } from './tokens';

interface CarrierAsset {
  source: ImageSourcePropType;
  /** Ширина логотипа внутри плитки, доля от её стороны. */
  fit: number;
  /** Логотип с белым текстом — нужна тёмная плитка. */
  dark?: boolean;
}

// Логотипы с сайта Novex (frontend/public/carriers). Права на использование в приложении — подтвердить.
const ASSETS: Record<string, CarrierAsset> = {
  cse: { source: require('../../assets/carriers/cse.png'), fit: 0.78 },
  exline: { source: require('../../assets/carriers/exline.png'), fit: 0.86 },
  azimuth: { source: require('../../assets/carriers/azimuth.png'), fit: 0.8, dark: true },
};

// Синонимы кодов: сайт (kse, ex, az) и макеты (EXL, AZM).
const ALIASES: Record<string, string> = {
  kse: 'cse',
  ex: 'exline',
  exl: 'exline',
  az: 'azimuth',
  azm: 'azimuth',
};

export function carrierAsset(code: string): CarrierAsset | null {
  const key = code.trim().toLowerCase();
  return ASSETS[ALIASES[key] ?? key] ?? null;
}

export interface CarrierLogoProps {
  code: string;
  /** Название — для экранного диктора и монограммы. */
  name: string;
  /** Сторона плитки: 52–60 pt. */
  size?: number;
  /** Без рамки (корешок билета). */
  bare?: boolean;
}

/** Плитка с логотипом перевозчика по carrier_code; неизвестный — монограмма (DESIGN-TZ 4). */
export function CarrierLogo({ code, name, size = 52, bare = false }: CarrierLogoProps) {
  const colors = useColors();
  const asset = carrierAsset(code);
  const radius = size >= 56 ? 14 : 12;
  // Плитка под белым логотипом всегда тёмно-синяя, в обеих темах.
  const background = asset?.dark ? lightColors.navy : colors.card;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: asset ? background : colors.subtle,
          borderWidth: bare || asset?.dark ? 0 : 1,
          borderColor: colors.line,
        },
      ]}
    >
      {asset ? (
        <Image
          source={asset.source}
          resizeMode="contain"
          style={{ width: size * asset.fit, height: size * asset.fit }}
        />
      ) : (
        <Text style={[styles.monogram, { color: colors.icon, fontSize: size * 0.32 }]}>
          {monogram(name)}
        </Text>
      )}
    </View>
  );
}

function monogram(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  monogram: { fontFamily: fonts.bold },
});
