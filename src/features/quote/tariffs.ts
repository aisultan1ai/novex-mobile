import type { components } from '@/api/schema';

import { toNumber } from './quoteForm';

export type RateQuote = components['schemas']['RateQuoteItem'];
export type TariffSort = 'price' | 'eta';

export interface TariffBadges {
  cheapest: boolean;
  fastest: boolean;
}

/** «Дешевле всех» и «Быстрее всех» (ТЗ 6.4.4). При равенстве бейдж получают все лидеры. */
export function computeBadges(quotes: readonly RateQuote[]): Map<RateQuote, TariffBadges> {
  const prices = quotes.map((q) => toNumber(q.price)).filter(Number.isFinite);
  const minPrice = Math.min(...prices);
  const minEta = Math.min(...quotes.map((q) => q.eta_days_max));
  const result = new Map<RateQuote, TariffBadges>();
  for (const q of quotes) {
    result.set(q, {
      cheapest: quotes.length > 1 && toNumber(q.price) === minPrice,
      fastest: quotes.length > 1 && q.eta_days_max === minEta,
    });
  }
  return result;
}

export function sortTariffs(quotes: readonly RateQuote[], sort: TariffSort): RateQuote[] {
  const price = (q: RateQuote) => toNumber(q.price);
  return [...quotes].sort((a, b) =>
    sort === 'price'
      ? price(a) - price(b) || a.eta_days_max - b.eta_days_max
      : a.eta_days_max - b.eta_days_max || a.eta_days_min - b.eta_days_min || price(a) - price(b),
  );
}
