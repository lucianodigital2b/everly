import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';

type BudgetBarProps = {
  paid: number;
  planned: number;
  cap?: number | null;
  height?: number;
  color?: string;
};

export function BudgetBar({
  paid,
  planned,
  cap,
  height = 8,
  color = colors.accent,
}: BudgetBarProps) {
  const normalize = (n: number) => {
    const safe = Number.isFinite(n) ? n : 0;
    return Math.max(0, safe);
  };

  const paidAmount = normalize(paid);
  const plannedAmount = Math.max(paidAmount, normalize(planned));
  const capAmount = cap == null ? null : normalize(cap);
  const scale = Math.max(plannedAmount, capAmount ?? 0, 1);

  const paidRatio = paidAmount / scale;
  const toPayRatio = Math.max(0, plannedAmount - paidAmount) / scale;
  const capRatio = capAmount != null ? capAmount / scale : null;
  const isOverCap = capAmount != null && plannedAmount > capAmount;
  const toPayColor = isOverCap ? colors.error : colors.accentBright;

  const paidWidth = useSharedValue(0);
  const toPayWidth = useSharedValue(0);
  const capLeft = useSharedValue(capRatio ?? 0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const duration = reduceMotion ? 0 : 260;
    const easing = Easing.out(Easing.quad);

    paidWidth.value = withTiming(paidRatio, { duration, easing });
    toPayWidth.value = withTiming(toPayRatio, { duration, easing });

    if (capRatio != null) {
      capLeft.value = withTiming(capRatio, { duration, easing });
    }
  }, [paidRatio, toPayRatio, capRatio, paidWidth, toPayWidth, capLeft, reduceMotion]);

  const paidStyle = useAnimatedStyle(() => ({
    width: `${Math.min(1, paidWidth.value) * 100}%`,
  }));

  const toPayStyle = useAnimatedStyle(() => ({
    width: `${Math.min(1, toPayWidth.value) * 100}%`,
  }));

  const capStyle = useAnimatedStyle(() => ({
    left: `${Math.min(1, capLeft.value) * 100}%`,
  }));

  return (
    <View style={[styles.track, { height }]}>
      <Animated.View
        style={[styles.segment, { backgroundColor: color }, paidStyle]}
      />
      <Animated.View
        style={[styles.segment, { backgroundColor: toPayColor }, toPayStyle]}
      />
      {capAmount != null ? (
        <Animated.View style={[styles.capTick, capStyle]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.surface2,
    position: 'relative',
  },
  segment: {
    height: '100%',
    overflow: 'hidden',
  },
  capTick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    borderRadius: 2,
    backgroundColor: colors.textPrimary,
  },
});
