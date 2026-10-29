import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '@/api';
import type { components } from '@/api/schema';

type ShippingQuoteRequest = components['schemas']['ShippingQuoteRequest'];

// Расчёт и выбор тарифа доступны без входа (гостевой режим): гость получает public_token
// и передаёт его в GET / select. После входа token нужен ещё раз — для создания черновика.

export const quoteKeys = {
  session: (id: number, token: string | null) => ['quote', id, token] as const,
};

export function useCalculateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ShippingQuoteRequest) =>
      unwrap(api.POST('/api/v1/shipping/quote', { body })),
    onSuccess: (data) => {
      // Экран тарифов откроется мгновенно, без повторного запроса.
      queryClient.setQueryData(
        quoteKeys.session(data.quote_session_id, data.public_token ?? null),
        data,
      );
    },
  });
}

export function useQuoteSession(id: number, token: string | null) {
  return useQuery({
    queryKey: quoteKeys.session(id, token),
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/shipping/quote/{quote_session_id}', {
          params: { path: { quote_session_id: id }, query: token ? { token } : {} },
        }),
      ),
    enabled: Number.isFinite(id),
  });
}

export function useSelectTariff(id: number, token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rateQuoteId: number) =>
      unwrap(
        api.POST('/api/v1/shipping/quote/{quote_session_id}/select', {
          params: { path: { quote_session_id: id }, query: token ? { token } : {} },
          body: { rate_quote_id: rateQuoteId },
        }),
      ),
    onSuccess: (data) => queryClient.setQueryData(quoteKeys.session(id, token), data),
  });
}

/** Требует входа: вызывается после Soft Wall. */
export function useCreateDraftFromQuote() {
  return useMutation({
    mutationFn: (input: { quoteSessionId: number; publicToken: string | null }) =>
      unwrap(
        api.POST('/api/v1/orders/drafts/from-quote', {
          body: { quote_session_id: input.quoteSessionId, public_token: input.publicToken },
        }),
      ),
  });
}
