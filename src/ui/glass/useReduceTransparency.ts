import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Системная настройка «Уменьшить прозрачность» (iOS). На Android всегда false. */
export function useReduceTransparency(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((value) => mounted && setEnabled(value))
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setEnabled);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return enabled;
}
