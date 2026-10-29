// Мок Reanimated для Jest: официальный react-native-reanimated/mock в связке Reanimated 4.7 + jest-expo 58
// подтягивает нативный инициализатор и падает. Здесь — ровно те API, что использует приложение:
// анимации выполняются мгновенно, shared value — обычный объект с get/set.
import { View } from 'react-native';

type Layout = { duration: () => Layout; delay: () => Layout };
const layout = (): Layout => {
  const self: Layout = { duration: () => self, delay: () => self };
  return self;
};

// Gesture Handler оборачивает детектор через createAnimatedComponent.
export const createAnimatedComponent = <T,>(component: T) => component;

const Animated = { View, createAnimatedComponent };
export default Animated;
export { View };

export const useSharedValue = <T,>(initial: T) => {
  const sv = {
    value: initial,
    get: () => sv.value,
    set: (next: T) => {
      sv.value = next;
    },
  };
  return sv;
};
export const isSharedValue = (v: unknown) => typeof v === 'object' && v !== null && 'value' in v;
export const useAnimatedStyle = (fn: () => object) => fn();
export const useReducedMotion = () => false;
export const useEvent = () => () => undefined;
export const useHandler = () => ({ context: {}, doDependenciesDiffer: false, useWeb: false });
export const withTiming = <T,>(value: T) => value;
export const withRepeat = <T,>(value: T) => value;
export const interpolate = (_value: number, _input: number[], output: number[]) => output[0];
export const Extrapolation = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' };
export const FadeIn = layout();
export const FadeOut = layout();
export const FadeInDown = layout();
