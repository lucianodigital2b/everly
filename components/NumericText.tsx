import { useEffect, useRef } from "react";
import { StyleSheet, Text, View, type TextStyle, type StyleProp } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useReducedMotion,
  withSpring,
  withTiming,
  type LayoutAnimation,
} from "react-native-reanimated";

/**
 * A number that changes the way SwiftUI's `.contentTransition(.numericText())`
 * does: only the digits that changed move. Going up, the new digit rises from
 * below while the old one leaves upward; going down, the reverse. Digits that
 * stay the same don't move at all.
 *
 * Each character sits in a slot keyed by its position from the right, so the
 * units digit is always the same slot whatever the length. An invisible copy
 * of the character sizes the slot; the visible one is absolute on top, so the
 * outgoing and incoming digit can overlap in the same spot.
 *
 * Use a font with tabular figures (Inter is): every digit is then the same
 * width and the number doesn't wobble while a slider drags it.
 */

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
// A new leading digit (9.000 → 10.000) eases into the row and the rest slide
// over to make room.
const SLOT_LAYOUT = LinearTransition.springify().damping(22).stiffness(260);
const SLOT_IN = FadeIn.duration(180);
const SLOT_OUT = FadeOut.duration(120);

const charIn = (dir: number, travel: number) => (): LayoutAnimation => {
  "worklet";
  return {
    initialValues: {
      opacity: 0,
      transform: [{ translateY: dir * travel }, { scale: 0.7 }],
    },
    animations: {
      opacity: withTiming(1, { duration: 200, easing: EASE_OUT }),
      transform: [
        { translateY: withSpring(0, { duration: 380, dampingRatio: 0.8 }) },
        { scale: withSpring(1, { duration: 380, dampingRatio: 0.8 }) },
      ],
    },
  };
};

const charOut = (dir: number, travel: number) => (): LayoutAnimation => {
  "worklet";
  return {
    initialValues: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
    animations: {
      opacity: withTiming(0, { duration: 160, easing: EASE_OUT }),
      transform: [
        { translateY: withTiming(-dir * travel, { duration: 240, easing: EASE_OUT }) },
        { scale: withTiming(0.7, { duration: 240, easing: EASE_OUT }) },
      ],
    },
  };
};

function Slot({
  char,
  dir,
  travel,
  reduced,
  style,
}: {
  char: string;
  dir: number;
  travel: number;
  reduced: boolean;
  style: StyleProp<TextStyle>;
}) {
  return (
    <Animated.View
      layout={reduced ? undefined : SLOT_LAYOUT}
      entering={reduced ? undefined : SLOT_IN}
      exiting={reduced ? undefined : SLOT_OUT}
    >
      {/* Sizer: gives the slot this character's width and the line height. */}
      <Text style={[style, styles.sizer]}>{char}</Text>
      <Animated.Text
        key={char}
        entering={reduced ? undefined : charIn(dir, travel)}
        exiting={reduced ? undefined : charOut(dir, travel)}
        style={[style, styles.glyph]}
      >
        {char}
      </Animated.Text>
    </Animated.View>
  );
}

export function NumericText({
  value,
  format,
  style,
  fontSize,
}: {
  value: number;
  /** Turns the number into the characters shown, e.g. 30000 → "30.000". */
  format: (n: number) => string;
  style?: StyleProp<TextStyle>;
  /** How far a digit travels, as a share of this. Match the text's size. */
  fontSize: number;
}) {
  const reduced = useReducedMotion();
  const previous = useRef(value);
  const dir = value >= previous.current ? 1 : -1;
  useEffect(() => {
    previous.current = value;
  }, [value]);

  const chars = format(value).split("");
  const travel = fontSize * 0.5;

  return (
    <View style={styles.row} accessible accessibilityLabel={format(value)}>
      {chars.map((char, i) => (
        <Slot
          key={`slot-${chars.length - 1 - i}`}
          char={char}
          dir={dir}
          travel={travel}
          reduced={reduced}
          style={style}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  sizer: {
    opacity: 0,
  },
  glyph: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    textAlign: "center",
  },
});
