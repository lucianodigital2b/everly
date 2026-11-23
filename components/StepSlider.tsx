import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { colors } from "../constants/colors";

/**
 * A stepper over a fixed list of stops (index 0 … count-1), drawn as a row of
 * small bars that light up to the value — a level meter rather than a track and
 * a thumb. Drag or tap anywhere on the row.
 *
 * Runs on the UI thread: the bars follow the finger, and only a change of stop
 * crosses to JS (`onChange`), where the caller fires its haptic and re-renders.
 * On release it springs onto the stop it landed on.
 */

const SEGMENTS = 30;
const BAR_H = 26;
const SNAP = { duration: 320, dampingRatio: 0.85 };

/**
 * One bar. Lit in proportion to how far the value has passed it, so the
 * leading bar fades in under the finger instead of snapping on; the bar at the
 * value stands a little taller, more so while held.
 */
function Segment({
  i,
  progress,
  pressed,
}: {
  i: number;
  progress: SharedValue<number>;
  pressed: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const at = progress.get() * (SEGMENTS - 1);
    const lit = Math.min(Math.max(at - i + 1, 0), 1);
    const near = Math.max(0, 1 - Math.abs(at - i));
    return {
      backgroundColor: interpolateColor(lit, [0, 1], [colors.surface2, colors.accentDeep]),
      transform: [{ scaleY: 1 + near * (0.18 + pressed.get() * 0.22) }],
    };
  });
  return <Animated.View style={[styles.bar, style]} />;
}

export function StepSlider({
  count,
  index,
  onChange,
  dimmed = false,
}: {
  count: number;
  index: number;
  onChange: (index: number) => void;
  /** Greyed out (e.g. "not sure yet" picked); still draggable. */
  dimmed?: boolean;
}) {
  const [width, setWidth] = useState(0);
  const span = useSharedValue(0);
  // 0…1 along the row.
  const progress = useSharedValue(count > 1 ? index / (count - 1) : 0);
  const current = useSharedValue(index);
  const pressed = useSharedValue(0);

  useEffect(() => {
    span.set(width);
  }, [width]);

  // Follow an index set from outside (not by dragging).
  useEffect(() => {
    if (current.get() === index) return;
    current.set(index);
    progress.set(withSpring(count > 1 ? index / (count - 1) : 0, SNAP));
  }, [index, count]);

  const pan = Gesture.Pan()
    .minDistance(0)
    .hitSlop({ top: 16, bottom: 16 })
    .onBegin((e) => {
      pressed.set(withSpring(1, { duration: 200, dampingRatio: 0.7 }));
      const s = span.get();
      if (s <= 0) return;
      const f = Math.min(Math.max(e.x / s, 0), 1);
      progress.set(f);
      const next = Math.round(f * (count - 1));
      current.set(next);
      // Always report on touch, even if the stop didn't change: touching the
      // stepper is itself a choice (it clears "not sure yet").
      scheduleOnRN(onChange, next);
    })
    .onUpdate((e) => {
      const s = span.get();
      if (s <= 0) return;
      const f = Math.min(Math.max(e.x / s, 0), 1);
      progress.set(f);
      const next = Math.round(f * (count - 1));
      if (next !== current.get()) {
        current.set(next);
        scheduleOnRN(onChange, next);
      }
    })
    .onFinalize(() => {
      pressed.set(withSpring(0, { duration: 260, dampingRatio: 0.8 }));
      progress.set(withSpring(count > 1 ? current.get() / (count - 1) : 0, SNAP));
    });

  return (
    <GestureDetector gesture={pan}>
      <View
        style={[styles.row, dimmed && styles.dimmed]}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessibilityRole="adjustable"
      >
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <Segment key={i} i={i} progress={progress} pressed={pressed} />
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: BAR_H * 1.5,
  },
  dimmed: {
    opacity: 0.45,
  },
  bar: {
    flex: 1,
    height: BAR_H,
    borderRadius: 3,
  },
});
