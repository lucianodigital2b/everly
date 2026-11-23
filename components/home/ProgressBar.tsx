import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';

type Props = {
  value: number; // 0 to 1
  height: number;
  delay?: number;
  color?: string;
};

export function ProgressBar({
  value,
  height,
  delay = 0,
  color = colors.accentDeep,
}: Props) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const safeValue = Math.min(1, Math.max(0, value));

  React.useEffect(() => {
    if (reduced) {
      progress.value = safeValue;
      return;
    }
    progress.value = withDelay(
      delay,
      withTiming(safeValue, {
        duration: 700,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
    );
  }, [delay, reduced, safeValue, progress]);

  const animatedWidth = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <Animated.View style={[styles.fill, { backgroundColor: color }, animatedWidth]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
