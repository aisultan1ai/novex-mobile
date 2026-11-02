import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type EntryExitAnimationFunction,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import type { Locale } from '@/api/client';
import { haptics } from '@/lib/haptics';
import { useSettingsStore } from '@/store/settings';
import {
  Button,
  GlassSurface,
  Text,
  Wordmark,
  fonts,
  lightColors,
  onDark,
  screenPadding,
  spacing,
  typography,
} from '@/ui';

import { BoxScene, PlaneScene, SCENE_H, SCENE_W, TruckScene } from './scenes';

const SLIDES = [
  { key: 'slide1', Scene: BoxScene },
  { key: 'slide2', Scene: TruckScene },
  { key: 'slide3', Scene: PlaneScene },
] as const;

const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);
const WHITE = onDark.text;

/** Смена слайда: текст появляется со сдвигом 12 pt (DESIGN-TZ 7). */
const textIn: EntryExitAnimationFunction = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 12 }] },
    animations: {
      opacity: withTiming(1, { duration: 350, easing: EASE }),
      transform: [{ translateY: withTiming(0, { duration: 350, easing: EASE }) }],
    },
  };
};

/**
 * Онбординг (DESIGN-TZ 6.1): navy на весь экран, переключатель языка и «Пропустить» — стекло,
 * сцена ≈360 pt, «novex.», заголовок hero 40, текст, три полоски прогресса, CTA «Далее / Начать».
 * Слайды листаются свайпом и кнопкой. После — сразу на главный экран (гостевой режим).
 */
export function OnboardingScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const safe = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const setSeen = useSettingsStore((s) => s.setOnboardingSeen);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;
  const slide = SLIDES[index]!;

  const finish = () => {
    setSeen();
    router.replace('/');
  };
  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, next));
    if (clamped === index) return;
    haptics.select();
    setIndex(clamped);
  };

  const swipe = usePanGesture({
    activeOffsetX: [-16, 16],
    failOffsetY: [-20, 20],
    onDeactivate: (e) => {
      'worklet';
      if (e.translationX < -48) scheduleOnRN(go, index + 1);
      else if (e.translationX > 48) scheduleOnRN(go, index - 1);
    },
  });

  const locale: Locale = i18n.language === 'kk' ? 'kk' : 'ru';
  const scale = Math.min(1, width / SCENE_W);

  return (
    <View style={[styles.root, { paddingTop: safe.top, paddingBottom: safe.bottom + spacing.lg }]}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <GlassSurface variant="onDark" style={styles.pill}>
          <View
            style={styles.langs}
            accessibilityRole="radiogroup"
            accessibilityLabel={t('onboarding.language')}
          >
            {(['ru', 'kk'] as const).map((l) => (
              <Pressable
                key={l}
                accessibilityRole="radio"
                accessibilityState={{ selected: locale === l }}
                accessibilityLabel={l === 'ru' ? 'Русский' : 'Қазақша'}
                onPress={() => setLocale(l)}
                style={[styles.lang, locale === l && styles.langOn]}
              >
                <Text style={[styles.pillText, { color: locale === l ? lightColors.navy : WHITE }]}>
                  {l === 'ru' ? 'Рус' : 'Қаз'}
                </Text>
              </Pressable>
            ))}
          </View>
        </GlassSurface>
        <GlassSurface variant="onDark" style={styles.pill}>
          <Pressable onPress={finish} accessibilityRole="button" style={styles.skip}>
            <Text style={[styles.pillText, { color: WHITE }]}>{t('onboarding.skip')}</Text>
          </Pressable>
        </GlassSurface>
      </View>

      <GestureDetector gesture={swipe}>
        <View style={styles.body}>
          <View
            style={[styles.scene, { height: SCENE_H * scale }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <View style={{ transform: [{ scale }] }}>
              <slide.Scene key={slide.key} />
            </View>
          </View>

          <View style={styles.text}>
            <Animated.View key={slide.key} entering={reduceMotion ? undefined : textIn}>
              <Wordmark size={22} onDark />
              <Text style={styles.title} accessibilityRole="header">
                {t(`onboarding.${slide.key}.title`)}
              </Text>
              <Text style={styles.subtitle}>{t(`onboarding.${slide.key}.text`)}</Text>
            </Animated.View>
            <View style={styles.bars}>
              {SLIDES.map((s, i) => (
                <ProgressBar
                  key={s.key}
                  state={i < index ? 'done' : i === index ? 'active' : 'todo'}
                  label={t('onboarding.slide', { n: i + 1 })}
                  onPress={() => go(i)}
                />
              ))}
            </View>
          </View>
        </View>
      </GestureDetector>

      <View style={styles.cta}>
        <Button
          size="large"
          title={last ? t('onboarding.start') : t('onboarding.next')}
          onPress={() => (last ? finish() : go(index + 1))}
        />
      </View>
    </View>
  );
}

/** Полоска прогресса: активная заполняется за 600 мс. */
function ProgressBar({
  state,
  label,
  onPress,
}: {
  state: 'done' | 'active' | 'todo';
  label: string;
  onPress: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const fill = useSharedValue(state === 'done' ? 1 : 0);
  useEffect(() => {
    const to = state === 'todo' ? 0 : 1;
    fill.set(state === 'active' && !reduceMotion ? 0 : to);
    if (state === 'active' && !reduceMotion)
      fill.set(withTiming(1, { duration: 600, easing: EASE }));
  }, [state, reduceMotion, fill]);
  const style = useAnimatedStyle(() => ({ width: `${fill.get() * 100}%` }));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: state === 'active' }}
      hitSlop={{ top: 16, bottom: 16 }}
      style={styles.bar}
    >
      <View style={styles.track}>
        <Animated.View style={[styles.fill, style]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: lightColors.navy },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  pill: { height: 40, borderRadius: 20 },
  langs: { flexDirection: 'row', padding: 3, gap: 2 },
  lang: {
    height: 34,
    minWidth: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  langOn: { backgroundColor: WHITE },
  skip: { height: 40, justifyContent: 'center', paddingHorizontal: spacing.md },
  pillText: { fontFamily: fonts.semibold, fontSize: 14 },
  body: { flex: 1 },
  scene: { alignItems: 'center', justifyContent: 'center', marginTop: spacing.xxs },
  text: { paddingHorizontal: 28, marginTop: spacing.md },
  title: { ...typography.hero, color: WHITE, marginTop: 14 },
  subtitle: {
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 25,
    color: onDark.textSecondary,
  },
  bars: { flexDirection: 'row', gap: spacing.xs, marginTop: 28 },
  bar: { flex: 1, paddingVertical: 4 },
  track: { height: 3, borderRadius: 2, backgroundColor: onDark.track, overflow: 'hidden' },
  fill: { height: 3, backgroundColor: WHITE },
  cta: { paddingHorizontal: screenPadding },
});
