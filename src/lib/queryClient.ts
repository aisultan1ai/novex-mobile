import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/api/errors';

export function shouldRetry(failureCount: number, error: unknown): boolean {
  // 4xx и 429 не повторяем (ТЗ 5.4): повтор не поможет, а лимит только усугубит.
  if (error instanceof ApiError && !error.isRetryable) return false;
  return failureCount < 2;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        staleTime: 30_000,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
