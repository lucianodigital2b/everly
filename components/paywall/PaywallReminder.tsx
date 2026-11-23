import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Bell } from 'lucide-react-native';
import { colors as Colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

type Props = {
  title: string;
};

const BELL = 132;
const BADGE = 42;

function ring(amplitude: number) {
  const step = (deg: number, duration: number) =>
    withTiming(deg, { duration, easing: Easing.inOut(Easing.sin) });
  return withSequence(
    step(amplitude, 140),
    step(-amplitude * 0.8, 180),
    step(amplitude * 0.55, 170),
    step(-amplitude * 0.35, 160),
    step(amplitude * 0.15, 150),
    step(0, 140),
  );
}

export function PaywallReminder({ title }: Props) {
  const reducedMotion = useReducedMotion();
  const drop = useSharedValue(reducedMotion ? 0 : -70);
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const swing = useSharedValue(0);
  const badge = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    drop.value = withSpring(0, { damping: 11, stiffness: 120, mass: 0.9 });
    opacity.value = withTiming(1, { duration: 260 });
    swing.value = withSequence(
      ring(22),
      withRepeat(withSequence(withDelay(2200, ring(14))), -1),
    );
    badge.value = withDelay(650, withSpring(1, { damping: 9, stiffness: 220 }));
    return () => {
      cancelAnimation(drop);
      cancelAnimation(opacity);
      cancelAnimation(swing);
      cancelAnimation(badge);
    };
  }, [badge, drop, opacity, reducedMotion, swing]);

  const bellStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: drop.value },
      { rotate: `${swing.value}deg` },
    ] as { translateY: number }[] & { rotate: string }[],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badge.value > 0.05 ? 1 : 0,
    transform: [{ scale: badge.value }],
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>

      <Animated.View style={[styles.bell, bellStyle]}>
        <Bell size={BELL} color={Colors.accent} />
        <Animated.View style={[styles.badge, badgeStyle]}>
          <Text style={styles.badgeText}>1</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 48,
    paddingTop: 64,
  },
  title: {
    fontFamily: typography.fonts.title,
    fontSize: typography.sizes.h2,
    lineHeight: 28,
    color: Colors.textPrimary,
    textAlign: 'center',
    maxWidth: 340,
  },
  bell: {
    width: BELL,
    height: BELL,
    transformOrigin: '50% 8%',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: -10,
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.backgroundPrimary,
  },
  badgeText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 22,
    lineHeight: 26,
    color: Colors.white,
  },
});
