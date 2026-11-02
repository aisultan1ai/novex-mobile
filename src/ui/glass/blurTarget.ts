import { createContext, useContext, type ComponentRef, type RefObject } from 'react';
import type { View } from 'react-native';
import { create } from 'zustand';

// Android размывает не «то, что под окном», а содержимое конкретного BlurTargetView (expo-blur, SDK 58).
// Поэтому каждый экран заворачивает свою прокручиваемую часть в BlurTargetView, а стеклянные панели
// (таб-бар, нижняя панель, шапка) лежат вне его и получают ссылку отсюда. На iOS всё это не нужно.

export type BlurTargetRef = RefObject<ComponentRef<typeof View> | null>;

interface BlurTargetScope {
  /** Цель размытия для стекла над экраном (нижняя панель, шапка). */
  target: BlurTargetRef | null;
  /**
   * Стекло само лежит внутри цели — размывать её нельзя (Android нарисует рекурсию),
   * поэтому такое стекло на Android рисуется фолбэком.
   */
  insideTarget: boolean;
}

export const BlurTargetContext = createContext<BlurTargetScope>({
  target: null,
  insideTarget: false,
});

export const useBlurTargetScope = () => useContext(BlurTargetContext);

/** Цель размытия экрана, открытого сейчас, — для таб-бара, который лежит над всеми вкладками. */
export const useActiveBlurTarget = create<{
  target: BlurTargetRef | null;
  setTarget: (target: BlurTargetRef | null) => void;
}>()((set) => ({
  target: null,
  setTarget: (target) => set({ target }),
}));
