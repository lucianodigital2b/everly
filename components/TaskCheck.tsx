import React from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type TaskState = 'done' | 'skipped' | 'pending';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

// The mark lands with a short pop: from 60% and transparent, slightly past 100%,
// then home. Under 200ms, because people tick dozens of these in a session.
const MARK_IN = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.6 }] },
  60: { opacity: 1, transform: [{ scale: 1.08 }], easing: EASE_OUT },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: EASE_OUT },
}).duration(180);

const MARK_OUT = FadeOut.duration(100);

type Props = {
  state: TaskState;
  onPress: () => void;
  onLongPress?: () => void;
  style: StyleProp<ViewStyle>;
  doneStyle: StyleProp<ViewStyle>;
  skippedStyle?: StyleProp<ViewStyle>;
  doneMark: React.ReactNode;
  skippedMark?: React.ReactNode;
  hitSlop?: number;
};

/**
 * A task's round checkbox. The fill crossfades (CSS transition), the mark pops
 * in on mount, and the circle dips on press-in so the tap registers before the
 * finger lifts. All of it runs on the UI thread.
 */
export function TaskCheck({
  state,
  onPress,
  onLongPress,
  style,
  doneStyle,
  skippedStyle,
  doneMark,
  skippedMark,
  hitSlop = 10,
}: Props) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      hitSlop={hitSlop}
      onPressIn={() => scale.set(withTiming(0.88, { duration: 110, easing: EASE_OUT }))}
      onPressOut={() => scale.set(withTiming(1, { duration: 160, easing: EASE_OUT }))}
    >
      <Animated.View
        style={[
          style,
          state === 'done' && doneStyle,
          state === 'skipped' && skippedStyle,
          {
            transitionProperty: ['backgroundColor', 'borderColor'],
            transitionDuration: 160,
            transitionTimingFunction: 'ease-out',
          },
          pressStyle,
        ]}
      >
        {state === 'done' && (
          <Animated.View key="done" entering={MARK_IN} exiting={MARK_OUT}>
            {doneMark}
          </Animated.View>
        )}
        {state === 'skipped' && skippedMark && (
          <Animated.View key="skipped" entering={MARK_IN} exiting={MARK_OUT}>
            {skippedMark}
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}
