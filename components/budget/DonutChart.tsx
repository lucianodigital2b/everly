import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Slice = { id: string; value: number; color: string };
type Segment = {
  id: string;
  color: string;
  start: number;
  length: number;
  gradientId: string;
};

function hexTint(hex: string, amount: number): string {
  const cleaned = hex.replace('#', '');
  const expanded =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((char) => char + char)
          .join('')
      : cleaned;

  if (!/^[0-9A-Fa-f]{6}$/.test(expanded)) {
    return hex;
  }

  const toTinted = (value: string) =>
    Math.min(
      255,
      Math.round(parseInt(value, 16) + (255 - parseInt(value, 16)) * amount),
    );

  const r = toTinted(expanded.slice(0, 2));
  const g = toTinted(expanded.slice(2, 4));
  const b = toTinted(expanded.slice(4, 6));

  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`;
}

type AnimatedSliceProps = {
  segment: Segment;
  center: number;
  radius: number;
  thickness: number;
  circumference: number;
  gap: number;
  progress: SharedValue<number>;
};

function AnimatedSlice({
  segment,
  center,
  radius,
  thickness,
  circumference,
  gap,
  progress,
}: AnimatedSliceProps) {
  const animatedProps = useAnimatedProps(() => {
    const dash = Math.max(0, segment.length * progress.value - gap);
    return {
      strokeDasharray: `${dash} ${circumference - dash}`,
      strokeDashoffset: -segment.start,
    };
  });

  return (
    <AnimatedCircle
      animatedProps={animatedProps}
      cx={center}
      cy={center}
      r={radius}
      stroke={`url(#${segment.gradientId})`}
      strokeWidth={thickness}
      fill="none"
      strokeLinecap="butt"
    />
  );
}

export function DonutChart({
  slices,
  size,
  thickness,
  children,
}: {
  slices: Slice[];
  size: number;
  thickness: number;
  children?: ReactNode;
}) {
  const radius = (size - thickness) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const visible = slices.filter((slice) => slice.value > 0);
  const total = visible.reduce((sum, slice) => sum + slice.value, 0);
  const gap = visible.length > 1 ? 2 : 0;

  const progress = useSharedValue(0);
  const wrapperOpacity = useSharedValue(0);
  const wrapperScale = useSharedValue(0.96);
  const reduceMotion = useReducedMotion();
  const valuesKey = visible
    .map((slice) => `${slice.id}:${slice.value}`)
    .join('|');

  useEffect(() => {
    const duration = reduceMotion ? 0 : 300;

    if (reduceMotion) {
      progress.value = 1;
      wrapperOpacity.value = 1;
      wrapperScale.value = 1;
      return;
    }

    progress.value = 0;
    wrapperOpacity.value = 0;
    wrapperScale.value = 0.96;

    progress.value = withTiming(1, {
      duration: 500,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    wrapperOpacity.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
    wrapperScale.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [valuesKey, reduceMotion, progress, wrapperOpacity, wrapperScale]);

  const wrapperStyle = useAnimatedStyle(() => ({
    opacity: wrapperOpacity.value,
    transform: [{ scale: wrapperScale.value }],
  }));

  const segments: Segment[] = [];
  let start = 0;

  for (const slice of visible) {
    const length = total > 0 ? (slice.value / total) * circumference : 0;
    segments.push({
      id: slice.id,
      color: slice.color,
      start,
      length,
      gradientId: `slice-${segments.length}-${slice.id.replace(
        /[^a-zA-Z0-9]/g,
        '',
      )}`,
    });
    start += length;
  }

  return (
    <Animated.View
      style={[styles.wrapper, { width: size, height: size }, wrapperStyle]}
    >
      <Svg
        width={size}
        height={size}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Defs>
          {segments.map((segment) => (
            <LinearGradient
              key={segment.gradientId}
              id={segment.gradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0" stopColor={segment.color} />
              <Stop offset="1" stopColor={hexTint(segment.color, 0.42)} />
            </LinearGradient>
          ))}
        </Defs>

        <G rotation={-90} origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.surface2}
            strokeWidth={thickness}
            fill="none"
          />
          {segments.map((segment) => (
            <AnimatedSlice
              key={segment.id}
              segment={segment}
              center={center}
              radius={radius}
              thickness={thickness}
              circumference={circumference}
              gap={gap}
              progress={progress}
            />
          ))}
        </G>
      </Svg>

      {children ? (
        <View style={styles.center} pointerEvents="none">
          {children}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
