import { ArrowUpDown, CircleDot, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { CityField } from '@/features/cities/CityField';
import { haptics } from '@/lib/haptics';
import { Card, sizes, spacing, useColors } from '@/ui';

export interface RouteCardProps {
  from: string;
  to: string;
  onChangeFrom: (city: string) => void;
  onChangeTo: (city: string) => void;
  onSwap: () => void;
  fromError?: string;
  toError?: string;
}

/** «Откуда → Куда» одной карточкой; кнопка справа меняет города местами. */
export function RouteCard(props: RouteCardProps) {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <Card style={styles.card}>
      <View style={styles.fields}>
        <CityField
          bare
          icon={CircleDot}
          label={t('quote.from')}
          placeholder={t('quote.fromPlaceholder')}
          value={props.from}
          onChange={props.onChangeFrom}
          error={props.fromError}
        />
        <View style={[styles.divider, { backgroundColor: colors.line }]} />
        <CityField
          bare
          icon={MapPin}
          label={t('quote.to')}
          placeholder={t('quote.toPlaceholder')}
          value={props.to}
          onChange={props.onChangeTo}
          error={props.toError}
        />
      </View>
      <Pressable
        onPress={() => {
          haptics.select();
          props.onSwap();
        }}
        accessibilityRole="button"
        accessibilityLabel={t('quote.swap')}
        style={[styles.swap, { backgroundColor: colors.subtle, borderColor: colors.line }]}
      >
        <ArrowUpDown color={colors.primary} size={20} strokeWidth={1.75} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  fields: { flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.xl },
  swap: {
    width: sizes.hitTarget,
    height: sizes.hitTarget,
    borderRadius: sizes.hitTarget / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
});
