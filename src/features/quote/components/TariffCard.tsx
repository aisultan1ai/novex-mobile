import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { formatMoney } from '@/lib/format';
import { CarrierLogo, SelectableCard, Text, fonts, spacing, useColors } from '@/ui';

import type { RateQuote, TariffBadges } from '../tariffs';

export interface TariffCardProps {
  quote: RateQuote;
  badges: TariffBadges;
  selected: boolean;
  onSelect: () => void;
}

/** «CSE Экспресс»: название перевозчика + тариф, без повтора, если тариф уже начинается с него. */
export function tariffTitle(q: RateQuote) {
  return q.tariff_name.toLowerCase().startsWith(q.carrier_name.toLowerCase())
    ? q.tariff_name
    : `${q.carrier_name} ${q.tariff_name}`;
}

/**
 * Тариф (DESIGN-TZ 6.4). iOS — карточка выбора: логотип 60, название 17/600, цена 17/700 navy, срок;
 * бейдж «Дешевле всех / Быстрее всех» справа внизу (у выбранной скрыт — там галочка).
 * Android — строка списка с радиокнопкой справа.
 */
export function TariffCard({ quote, badges, selected, onSelect }: TariffCardProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const title = tariffTitle(quote);
  const price = formatMoney(quote.price);
  const eta =
    quote.eta_days_min === quote.eta_days_max
      ? t('tariffs.days', { n: quote.eta_days_max })
      : t('tariffs.daysRange', { min: quote.eta_days_min, max: quote.eta_days_max });
  const badge = badges.cheapest
    ? t('tariffs.cheapest')
    : badges.fastest
      ? t('tariffs.fastest')
      : null;
  const a11y = [
    title,
    price,
    eta,
    badges.cheapest && t('tariffs.cheapest'),
    badges.fastest && t('tariffs.fastest'),
  ]
    .filter(Boolean)
    .join(', ');
  const disabled = quote.id == null;

  if (Platform.OS === 'android') {
    return (
      <Pressable
        onPress={onSelect}
        disabled={disabled}
        accessibilityRole="radio"
        accessibilityState={{ selected, disabled }}
        accessibilityLabel={a11y}
        style={({ pressed }) => [
          styles.row,
          { borderBottomColor: colors.line },
          pressed && styles.pressed,
        ]}
      >
        <CarrierLogo code={quote.carrier_code} name={quote.carrier_name} size={52} />
        <View style={styles.texts}>
          <Text style={styles.nameAndroid} numberOfLines={2}>
            {title}
          </Text>
          <Text variant="label" tone="muted" numberOfLines={1}>
            {eta}
            {badge ? (
              <Text style={[styles.badgeInline, { color: colors.strong }]}> · {badge}</Text>
            ) : null}
          </Text>
        </View>
        <Text style={[styles.price, { color: colors.strong }]}>{price}</Text>
        <View style={[styles.radio, { borderColor: selected ? colors.strong : colors.lineStrong }]}>
          {selected ? <View style={[styles.radioDot, { backgroundColor: colors.strong }]} /> : null}
        </View>
      </Pressable>
    );
  }

  return (
    <SelectableCard
      selected={selected}
      onPress={onSelect}
      disabled={disabled}
      accessibilityLabel={a11y}
      style={styles.card}
    >
      <CarrierLogo code={quote.carrier_code} name={quote.carrier_name} size={60} />
      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.price, { color: colors.strong }]}>{price}</Text>
        <Text variant="label" tone="muted" numberOfLines={1}>
          {eta}
        </Text>
      </View>
      {badge && !selected ? (
        <Text style={[styles.badge, { color: colors.strong }]} numberOfLines={1}>
          {badge}
        </Text>
      ) : null}
    </SelectableCard>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  texts: { flex: 1, gap: 3, paddingRight: spacing.lg },
  name: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22 },
  price: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, letterSpacing: -0.34 },
  badge: { position: 'absolute', right: 14, bottom: 14, fontFamily: fonts.semibold, fontSize: 12 },
  row: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
  },
  pressed: { opacity: 0.7 },
  nameAndroid: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  badgeInline: { fontFamily: fonts.bold },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
});
