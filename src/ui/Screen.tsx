import { BlurTargetView } from 'expo-blur';
import { useFocusEffect } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { BlurTargetContext, useActiveBlurTarget, type BlurTargetRef } from './glass/blurTarget';
import { useTabBarInset } from './tabBarInset';
import { useColors } from './theme';
import { screenPadding } from './tokens';

export interface ScreenProps {
  children: ReactNode;
  /**
   * Нижняя панель (CTA, BottomBar). Лежит поверх контента — контент прокручивается под ней;
   * ScrollView экрана добавляет снизу отступ из useScreenInsets().bottom.
   */
  footer?: ReactNode;
  /** Слой поверх контента сверху (стеклянная шапка при прокрутке, кнопки на карте). */
  overlay?: ReactNode;
  /** Экран — вкладка: снизу плавающий таб-бар, футер встаёт над ним. */
  withTabBar?: boolean;
  /** Боковые поля iOS 20 / Android 16. false — экран сам управляет полями (карта во всю ширину). */
  padded?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
  /** Фон экрана, если не стандартный (navy онбординга). */
  background?: string;
}

interface ScreenInsets {
  /** Отступ снизу для прокручиваемого контента: футер + таб-бар + safe area. */
  bottom: number;
}

const ScreenInsetsContext = createContext<ScreenInsets>({ bottom: 0 });

/** Нижний отступ, чтобы последний элемент списка не прятался под футером и таб-баром. */
export const useScreenInsets = () => useContext(ScreenInsetsContext);

export function Screen({
  children,
  footer,
  overlay,
  withTabBar = false,
  padded = true,
  edges = ['top'],
  contentStyle,
  background,
}: ScreenProps) {
  const colors = useColors();
  const safe = useSafeAreaInsets();
  const tabInset = useTabBarInset();
  const targetRef = useRef<ComponentRef<typeof View>>(null);
  const [footerHeight, setFooterHeight] = useState(0);

  const tabBarSpace = withTabBar ? tabInset : 0;
  // Без таб-бара нижнюю safe area забирает футер (или сам контент, если футера нет).
  const bottomSafe = withTabBar ? 0 : safe.bottom;
  const insets = useMemo<ScreenInsets>(
    () => ({ bottom: tabBarSpace + (footer ? footerHeight : bottomSafe) }),
    [tabBarSpace, footer, footerHeight, bottomSafe],
  );

  const safeEdges = edges.filter((e) => e !== 'bottom');

  return (
    <SafeAreaView
      edges={safeEdges}
      style={[styles.root, { backgroundColor: background ?? colors.background }]}
    >
      <ScreenInsetsContext.Provider value={insets}>
        <BlurTargetView ref={targetRef} style={styles.fill}>
          <BlurTargetContext.Provider value={INSIDE_TARGET}>
            <View style={[styles.fill, padded && styles.padded, contentStyle]}>{children}</View>
          </BlurTargetContext.Provider>
        </BlurTargetView>

        <BlurTargetContext.Provider value={{ target: targetRef, insideTarget: false }}>
          {footer ? (
            <View
              style={[styles.footer, { bottom: tabBarSpace, paddingBottom: bottomSafe }]}
              onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
            >
              {footer}
            </View>
          ) : null}
          {overlay}
        </BlurTargetContext.Provider>
      </ScreenInsetsContext.Provider>
      {Platform.OS === 'android' ? <ActiveBlurTarget target={targetRef} /> : null}
    </SafeAreaView>
  );
}

const INSIDE_TARGET = { target: null, insideTarget: true };

/** Android: таб-бар размывает экран, открытый сейчас. */
function ActiveBlurTarget({ target }: { target: BlurTargetRef }) {
  const setTarget = useActiveBlurTarget((s) => s.setTarget);
  useFocusEffect(
    useCallback(() => {
      setTarget(target);
      return () => {
        if (useActiveBlurTarget.getState().target === target) setTarget(null);
      };
    }, [setTarget, target]),
  );
  return null;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  padded: { paddingHorizontal: screenPadding },
  footer: { position: 'absolute', left: 0, right: 0 },
});
