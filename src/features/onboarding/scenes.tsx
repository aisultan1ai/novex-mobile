import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { illustration, useColors } from '@/ui';

// Сцены онбординга (DESIGN-TZ 6.1, iOS-Onboarding). Холст 393×360: графитовые линии, тёплые заливки
// (абрикос, белая «бумага»), cyan — только точка назначения. Цвета линий и карточек — из темы.
// Единственное место с постоянной анимацией (DESIGN-TZ 1.8); при «уменьшить движение» — статично.

export const SCENE_W = 393;
export const SCENE_H = 360;
const CYCLE = 3600;
const WARM = illustration.apricot;
const WARM_SOFT = illustration.apricotSoft;
const CYAN = illustration.cyan;

/** Линии и «бумага» сцен — под тему: графит на светлом фоне, почти белый на тёмном. */
function usePalette() {
  const colors = useColors();
  return {
    line: colors.strong,
    paper: colors.card,
    faint: colors.dashed,
    ghost: colors.lineStrong,
  };
}
const AnimatedLine = Animated.createAnimatedComponent(Line);

type Pt = [number, number];
type Cubic = [Pt, Pt, Pt, Pt];

/** Точка кубической кривой Безье. */
function bezier([p0, p1, p2, p3]: Cubic, t: number): Pt {
  'worklet';
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  ];
}

/** Угол касательной (градусы) — для самолёта, который поворачивается по дуге. */
function tangent([p0, p1, p2, p3]: Cubic, t: number): number {
  'worklet';
  const u = 1 - t;
  const dx =
    3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
  const dy =
    3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/** Бесконечный прогресс 0→1 за цикл; при «уменьшить движение» — фиксированная точка. */
function useLoop(duration: number, still: number, easing = Easing.bezier(0.45, 0, 0.2, 1)) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? still : 0);
  useEffect(() => {
    if (reduceMotion) return;
    progress.set(withRepeat(withTiming(1, { duration, easing }), -1, false));
    return () => cancelAnimation(progress);
  }, [duration, easing, progress, reduceMotion]);
  return progress;
}

// Путь «M40 300 C 140 300, 130 150, 220 140 S 320 100, 350 70» — две кубические кривые
// (вторая контрольная точка S — отражение предыдущей относительно (220,140)).
const BOX_PATH: [Cubic, Cubic] = [
  [
    [40, 300],
    [140, 300],
    [130, 150],
    [220, 140],
  ],
  [
    [220, 140],
    [310, 130],
    [320, 100],
    [350, 70],
  ],
];

function pointOnPath(path: [Cubic, Cubic], p: number): Pt {
  'worklet';
  return p < 0.5 ? bezier(path[0], p * 2) : bezier(path[1], (p - 0.5) * 2);
}

function Pin() {
  const ink = usePalette();
  return (
    <>
      <Path
        d="M350 52 c-9 0 -16 7 -16 15 c0 11 16 25 16 25 s16 -14 16 -25 c0 -8 -7 -15 -16 -15 z"
        fill={CYAN}
        stroke={ink.line}
        strokeWidth={2}
      />
      <Circle cx={350} cy={67} r={5} fill={ink.paper} stroke={ink.line} strokeWidth={1.5} />
    </>
  );
}

/** 1. Коробка едет по пунктирной кривой к метке. */
export function BoxScene() {
  const ink = usePalette();
  const p = useLoop(CYCLE, 0.6);
  const box = useAnimatedStyle(() => {
    const [x, y] = pointOnPath(BOX_PATH, p.get());
    // Якорь 50% / 80%, как offset-anchor в макете.
    return { transform: [{ translateX: x - 36 }, { translateY: y - 58 }] };
  });
  return (
    <View style={styles.scene}>
      <Svg width={SCENE_W} height={SCENE_H} viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}>
        <Path
          d="M40 300 C 140 300, 130 150, 220 140 S 320 100, 350 70"
          stroke={ink.faint}
          strokeWidth={2}
          strokeDasharray="2 8"
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx={40} cy={300} r={7} fill={ink.paper} stroke={ink.line} strokeWidth={2} />
        <Pin />
      </Svg>
      <Animated.View style={[styles.mover, box]}>
        <Svg width={72} height={72} viewBox="0 0 48 48">
          <Path
            d="M24 6 L42 15 L24 24 L6 15 Z"
            fill={WARM}
            stroke={ink.line}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <Path
            d="M6 15 L6 33 L24 42 L24 24 Z"
            fill={ink.paper}
            stroke={ink.line}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <Path
            d="M42 15 L42 33 L24 42 L24 24 Z"
            fill={WARM_SOFT}
            stroke={ink.line}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <Path
            d="M15 10.5 L33 19.5 L33 25"
            stroke={ink.line}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

function Wheel({ spin, left }: { spin: SharedValue<number>; left: number }) {
  const ink = usePalette();
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.get() * 360}deg` }] }));
  return (
    <Animated.View style={[styles.wheel, { left }, style]}>
      <Svg width={34} height={34} viewBox="0 0 34 34">
        <Circle cx={17} cy={17} r={14} fill={ink.line} stroke={ink.paper} strokeWidth={2} />
        <Path d="M17 8v18M8 17h18" stroke={ink.paper} strokeWidth={1.5} />
      </Svg>
    </Animated.View>
  );
}

/** 2. Грузовик едет по дороге: крутятся колёса, бежит разметка. */
export function TruckScene() {
  const ink = usePalette();
  const linear = Easing.bezier(0, 0, 1, 1);
  const road = useLoop(800, 0, linear);
  const spin = useLoop(700, 0, linear);
  const dash = useAnimatedProps(() => ({ strokeDashoffset: -60 * road.get() }));
  return (
    <View style={styles.scene}>
      <Svg width={SCENE_W} height={SCENE_H} viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}>
        <Path
          d="M24 250 V 186 H 64 V 250 M 72 250 V 150 H 116 V 250 M 124 250 V 200 H 160 V 250 M 236 250 V 170 H 276 V 250 M 284 250 V 196 H 336 V 250"
          stroke={ink.ghost}
          strokeWidth={1.5}
          strokeLinejoin="round"
          fill="none"
        />
        <Line x1={0} y1={250} x2={SCENE_W} y2={250} stroke={ink.ghost} strokeWidth={1.5} />
        <AnimatedLine
          x1={0}
          y1={300}
          x2={SCENE_W}
          y2={300}
          stroke={ink.faint}
          strokeWidth={2}
          strokeDasharray="26 34"
          animatedProps={dash}
        />
        <Line x1={0} y1={344} x2={SCENE_W} y2={344} stroke={ink.ghost} strokeWidth={1.5} />
      </Svg>
      <View style={styles.truck}>
        <Svg width={190} height={110} viewBox="0 0 190 110">
          <Rect
            x={4}
            y={10}
            width={110}
            height={66}
            rx={8}
            fill={WARM}
            stroke={ink.line}
            strokeWidth={2}
          />
          <Path
            d="M118 30 H 152 L 178 58 V 76 H 118 Z"
            fill={ink.paper}
            stroke={ink.line}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <Path
            d="M126 37 H 148 L 164 54 H 126 Z"
            fill={CYAN}
            stroke={ink.line}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <Path d="M22 30 h40 M22 44 h24" stroke={ink.line} strokeWidth={2} strokeLinecap="round" />
          <Circle cx={92} cy={36} r={6} fill={ink.paper} stroke={ink.line} strokeWidth={1.5} />
        </Svg>
        <Wheel spin={spin} left={20} />
        <Wheel spin={spin} left={136} />
      </View>
    </View>
  );
}

const PLANE_PATH: Cubic = [
  [30, 320],
  [130, 320],
  [170, 150],
  [350, 70],
];

/** 3. Самолёт летит по дуге и поворачивается по касательной. */
export function PlaneScene() {
  const ink = usePalette();
  const p = useLoop(CYCLE, 0.55);
  const plane = useAnimatedStyle(() => {
    const t = p.get();
    const [x, y] = bezier(PLANE_PATH, t);
    return {
      transform: [
        { translateX: x - 42 },
        { translateY: y - 23 },
        { rotate: `${tangent(PLANE_PATH, t)}deg` },
      ],
    };
  });
  return (
    <View style={styles.scene}>
      <Svg width={SCENE_W} height={SCENE_H} viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}>
        <Path
          d="M250 104 a14 14 0 0 1 26 -6 a12 12 0 0 1 22 8 a10 10 0 0 1 -2 20 h-44 a11 11 0 0 1 -2 -22 z"
          stroke={ink.ghost}
          strokeWidth={1.5}
          fill="none"
        />
        <Path
          d="M50 190 a12 12 0 0 1 22 -5 a10 10 0 0 1 18 7 a9 9 0 0 1 -2 17 h-36 a9 9 0 0 1 -2 -19 z"
          stroke={ink.ghost}
          strokeWidth={1.5}
          fill="none"
        />
        <Path
          d="M30 320 C 130 320, 170 150, 350 70"
          stroke={ink.faint}
          strokeWidth={2}
          strokeDasharray="2 8"
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx={30} cy={320} r={7} fill={ink.paper} stroke={ink.line} strokeWidth={2} />
        <Pin />
      </Svg>
      <Animated.View style={[styles.mover, plane]}>
        <Svg width={84} height={46} viewBox="0 0 80 44">
          <Path
            d="M6 24 C 6 20, 12 18, 22 18 L 62 18 C 72 18, 78 21, 78 24 C 78 27, 72 29, 62 29 L 22 29 C 12 29, 6 27, 6 24 Z"
            fill={ink.paper}
            stroke={ink.line}
            strokeWidth={1.6}
          />
          <Path
            d="M36 24 L 46 40 L 53 40 L 50 24"
            fill={WARM}
            stroke={ink.line}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
          <Path
            d="M12 19 L 6 8 L 13 8 L 22 18"
            fill={WARM}
            stroke={ink.line}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
          <Path
            d="M28 23h2M34 23h2M40 23h2M58 23h2"
            stroke={ink.line}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { width: SCENE_W, height: SCENE_H },
  mover: { position: 'absolute', left: 0, top: 0 },
  truck: { position: 'absolute', left: 106, top: 162, width: 190, height: 110 },
  wheel: { position: 'absolute', top: 62, width: 34, height: 34 },
});
