import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { formatMoney } from '@/lib/format';
import { Card, Text, radii, spacing, useColors } from '@/ui';

import type { RateQuote, TariffBadges } from '../tariffs';

export interface TariffCardProps {
  quote: RateQuote;
  badges: TariffBadges;
  selected: boolean;
  onSelect: () => void;
}

/** Карточка тарифа: перевозчик, тариф, цена крупно, срок; выбранная — рамка cyan. */
export function TariffCard({ quote, badges, selected, onSelect }: TariffCardProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const price = formatMoney(quote.price);
  const eta =
    quote.eta_days_min === quote.eta_days_max
      ? t('tariffs.days', { n: quote.eta_days_max })
      : t('tariffs.daysRange', { min: quote.eta_days_min, max: quote.eta_days_max });

  return (
    <Card
      selected={selected}
      onPress={quote.id != null ? onSelect : undefined}
      accessibilityLabel={[
        quote.carrier_name,
        quote.tariff_name,
        price,
        eta,
        badges.cheapest && t('tariffs.cheapest'),
        badges.fastest && t('tariffs.fastest'),
      ]
        .filter(Boolean)
        .join(', ')}
    >
      <View style={styles.row}>
        {/* Логотипы перевозчиков выдаёт команда Novex; до тех пор — монограмма. */}
        <View style={[styles.logo, { backgroundColor: colors.subtle }]}>
          <Text variant="bodyStrong" style={{ color: colors.icon }}>
            {monogram(quote.carrier_name)}
          </Text>
        </View>
        <View style={styles.names}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {quote.carrier_name}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {quote.tariff_name}
          </Text>
        </View>
        <View style={styles.price}>
          <Text variant="title">{price}</Text>
          <Text variant="caption" tone="muted">
            {eta}
          </Text>
        </View>
      </View>
      {badges.cheapest || badges.fastest ? (
        <View style={styles.badges}>
          {badges.cheapest ? <Badge label={t('tariffs.cheapest')} color={colors.primary} /> : null}
          {badges.fastest ? <Badge label={t('tariffs.fastest')} color={colors.icon} /> : null}
        </View>
      ) : null}
    </Card>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text variant="caption" style={{ color }}>
        {label}
      </Text>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  names: { flex: 1, gap: 2 },
  price: { alignItems: 'flex-end' },
  badges: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  badge: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
});
