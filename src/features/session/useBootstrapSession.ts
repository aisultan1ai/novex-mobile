import { useEffect } from 'react';

import { tokens } from '@/api';
import { useSessionStore } from '@/store/session';

/**
 * При старте: есть сохранённый токен — считаем, что вошли (истёкший обновит клиент API),
 * нет — гость. Экран входа сам по себе не показываем: гостевой режим со старта.
 */
export function useBootstrapSession() {
  useEffect(() => {
    tokens
      .getAccessToken()
      .then((token) => useSessionStore.getState().setStatus(token ? 'signedIn' : 'signedOut'))
      .catch(() => useSessionStore.getState().setStatus('signedOut'));
  }, []);
}
