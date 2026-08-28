import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import * as Haptics from "expo-haptics";
import { colors } from "../constants/colors";
import { unsplash } from "../constants/sampleImages";

// ─── Stops ────────────────────────────────────────────────────────────────────

// `null` is unlimited, and lives at the end so the dial reads as "more and more
// shots" all the way to no limit at all.
const STOPS: (number | null)[] = [3, 5, 10, 15, 20, 25, 30, 40, 50, null];
const LAST = STOPS.length - 1;

const label = (stop: number | null) => (stop === null ? "∞" : String(stop));

/** Nearest stop to whatever the form is carrying — "" means unlimited. */
const indexForValue = (raw: string) => {
  const parsed = parseInt(raw, 10);
  if (!raw || !Number.isFinite(parsed)) return LAST;

  let best = 0;
  let closest = Infinity;
  STOPS.forEach((stop, i) => {
    if (stop === null) return;
    const distance = Math.abs(stop - parsed);
    if (distance < closest) {
      closest = distance;
      best = i;
    }
  });
  return best;
};

// ─── Geometry ─────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get("window");
// The wizard pads its content by 24 on each side.
const STRIP_W = SCREEN_W - 48;
const ITEM_W = 78;
// Half a strip minus half an item, so the first and last stops can still reach
// the pointer in the middle.
const SIDE_PAD = (STRIP_W - ITEM_W) / 2;

// Sprocket holes are laid out on a fixed pitch across the strip — they're the
// film gate, so they stay put while the numbers run past them.
const HOLE_PITCH = 17;
const HOLE_COUNT = Math.floor((STRIP_W - 10) / HOLE_PITCH);

// ─── Motion ───────────────────────────────────────────────────────────────────

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/** How far a digit travels through its window. Roughly one line. */
const ROLL = 15;

/**
 * A counter wheel turning. The incoming digit rises from below the window when
 * the limit goes up and drops in from above when it goes down, so the direction
 * of the change is legible without reading either number.
 */
const rollIn = (dir: number, delay: number, reduced: boolean) => () => {
  "worklet";
  return {
    initialValues: {
      opacity: 0,
      transform: [{ translateY: reduced ? 0 : dir * ROLL }],
    },
    animations: {
      opacity: withDelay(
        delay,
        withTiming(1, { duration: 190, easing: EASE_OUT })
      ),
      transform: [
        {
          translateY: withDelay(
            delay,
            withSpring(0, { duration: 340, dampingRatio: 0.78 })
          ),
        },
      ],
    },
  };
};

const rollOut = (dir: number, delay: number, reduced: boolean) => () => {
  "worklet";
  return {
    initialValues: { opacity: 1, transform: [{ translateY: 0 }] },
    animations: {
      opacity: withDelay(
        delay,
        withTiming(0, { duration: 150, easing: EASE_OUT })
      ),
      transform: [
        {
          translateY: withDelay(
            delay,
            withTiming(reduced ? 0 : -dir * ROLL, {
              duration: 200,
              easing: EASE_OUT,
            })
          ),
        },
      ],
    },
  };
};

// ─── Camera deck ──────────────────────────────────────────────────────────────

const SAMPLE_SHOTS = [
  unsplash("1533174072545-7a4b6ad7a6c3", 200),
  unsplash("1519741497674-611481863552", 200),
];

/**
 * One digit in its window. `overflow: hidden` on the frame is what makes the
 * roll read as mechanical — the number is clipped by the counter housing rather
 * than fading against the deck.
 */
const Digit = ({
  text,
  dir,
  delay,
  reduced,
  frame,
  textStyle,
}: {
  text: string;
  dir: number;
  delay: number;
  reduced: boolean;
  frame: object;
  textStyle: object;
}) => (
  <View style={[styles.digitFrame, frame]}>
    <Animated.Text
      key={text}
      entering={rollIn(dir, delay, reduced)}
      exiting={rollOut(dir, delay, reduced)}
      style={[styles.digit, textStyle]}
    >
      {text}
    </Animated.Text>
  </View>
);

/**
 * The bottom of a phone running the camera — the counter a guest actually sees
 * ticking down, the shutter, and the shots they've already taken. It shows what
 * the number *means* far better than a text field does.
 */
const CameraDeck = ({
  remaining,
  dir,
  reduced,
}: {
  remaining: number | null;
  dir: number;
  reduced: boolean;
}) => (
  <View style={styles.deck}>
    <View style={styles.deckRow}>
      {/* Remaining-shots counter, mid-countdown. The neighbours lag the centre
          digit slightly, so the three read as one mechanism turning. */}
      <View style={styles.counter}>
        {remaining === null ? (
          <Digit
            text="∞"
            dir={dir}
            delay={0}
            reduced={reduced}
            frame={styles.frameNow}
            textStyle={styles.digitNow}
          />
        ) : (
          <>
            <Digit
              text={String(remaining + 1)}
              dir={dir}
              delay={55}
              reduced={reduced}
              frame={styles.frameSide}
              textStyle={styles.digitSide}
            />
            <Digit
              text={String(remaining)}
              dir={dir}
              delay={0}
              reduced={reduced}
              frame={styles.frameNow}
              textStyle={styles.digitNow}
            />
            <Digit
              text={String(Math.max(0, remaining - 1))}
              dir={dir}
              delay={55}
              reduced={reduced}
              frame={styles.frameSide}
              textStyle={styles.digitSide}
            />
          </>
        )}
      </View>

      {/* Shutter */}
      <View style={styles.shutterRing}>
        <View style={styles.shutterCore} />
      </View>

      {/* Roll so far */}
      <View style={styles.roll}>
        {SAMPLE_SHOTS.map((uri, i) => (
          <Image
            key={uri}
            source={{ uri }}
            style={[
              styles.rollShot,
              {
                transform: [
                  { rotate: i === 0 ? "-7deg" : "5deg" },
                  { translateX: i === 0 ? -4 : 4 },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  </View>
);

// ─── Film strip stop ──────────────────────────────────────────────────────────

/**
 * One frame of film. Focus is a continuous function of how far the stop sits
 * from the gate, read straight off the scroll offset — so a number grows and
 * darkens as it arrives instead of flipping once it crosses the middle.
 *
 * The weight change is two stacked layers cross-fading, because `fontFamily`
 * can't be animated and a colour can't be driven from the UI thread.
 */
const Stop = ({
  index,
  text,
  scrollX,
  reduced,
  onPress,
}: {
  index: number;
  text: string;
  scrollX: SharedValue<number>;
  reduced: boolean;
  onPress: () => void;
}) => {
  const distance = () => {
    "worklet";
    return Math.abs(scrollX.get() / ITEM_W - index);
  };

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: reduced
          ? 1
          : interpolate(
              distance(),
              [0, 1, 2],
              [1.35, 1, 0.92],
              Extrapolation.CLAMP
            ),
      },
    ],
  }));

  const onStyle = useAnimatedStyle(() => ({
    opacity: interpolate(distance(), [0, 0.6], [1, 0], Extrapolation.CLAMP),
  }));

  const offStyle = useAnimatedStyle(() => {
    const d = distance();
    const focus = interpolate(d, [0, 0.6], [1, 0], Extrapolation.CLAMP);
    // Fades in as focus leaves, then falls away with distance from the gate.
    return {
      opacity:
        (1 - focus) *
        interpolate(d, [0.6, 2.4], [1, 0.34], Extrapolation.CLAMP),
    };
  });

  const dotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(distance(), [0, 0.6], [1, 0.18], Extrapolation.CLAMP),
    transform: [
      {
        scale: reduced
          ? 1
          : interpolate(distance(), [0, 0.6], [1, 0.7], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.item}>
      <Animated.View style={[styles.stopBox, scaleStyle]}>
        <Animated.Text style={[styles.stop, styles.stopOff, offStyle]}>
          {text}
        </Animated.Text>
        <Animated.Text style={[styles.stop, styles.stopOn, onStyle]}>
          {text}
        </Animated.Text>
      </Animated.View>
      <Animated.View style={[styles.frameDot, dotStyle]} />
    </TouchableOpacity>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ShotsPerPersonProps {
  /** The form's raw value — a number as a string, or "" for unlimited. */
  value: string;
  onChange: (value: string) => void;
}

export const ShotsPerPerson = ({ value, onChange }: ShotsPerPersonProps) => {
  const reduced = useReducedMotion();
  const scrollRef = useRef<Animated.ScrollView>(null);

  // `dir` rides along with the index so the counter knows which way to roll.
  const [dial, setDial] = useState(() => ({
    index: indexForValue(value),
    dir: 1,
  }));

  const scrollX = useSharedValue(indexForValue(value) * ITEM_W);
  const detent = useSharedValue(0);

  // Line the dial up under the pointer on first paint. The step unmounts when
  // the wizard moves on, so this runs again on every visit.
  useEffect(() => {
    const target = indexForValue(value);
    scrollX.set(target * ITEM_W);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ x: target * ITEM_W, animated: false })
    );
  }, []);

  // Runs once per stop crossed, never once per frame.
  const commit = (next: number) => {
    setDial((prev) =>
      prev.index === next
        ? prev
        : { index: next, dir: next > prev.index ? 1 : -1 }
    );
    Haptics.selectionAsync().catch(() => {});
    if (!reduced) {
      // The gate catching the frame — a nudge down, then a spring home.
      detent.set(
        withSequence(
          withTiming(3, { duration: 80, easing: EASE_OUT }),
          withSpring(0, { duration: 420, dampingRatio: 0.45 })
        )
      );
    }
    const stop = STOPS[next];
    onChange(stop === null ? "" : String(stop));
  };

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.set(e.contentOffset.x);
  });

  // A threshold crossing, so the RN runtime is woken only when the value really
  // changes — never from inside the scroll handler itself.
  useAnimatedReaction(
    () => {
      const raw = Math.round(scrollX.get() / ITEM_W);
      return Math.min(LAST, Math.max(0, raw));
    },
    (next, previous) => {
      if (previous !== null && next !== previous) scheduleOnRN(commit, next);
    }
  );

  const pointerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: detent.get() }],
  }));

  return (
    <View>
      <CameraDeck
        remaining={STOPS[dial.index]}
        dir={dial.dir}
        reduced={reduced}
      />

      {/* Film strip dial */}
      <View style={styles.strip}>
        <View style={[styles.edge, { top: 0 }]} pointerEvents="none" />
        <View style={[styles.edge, { bottom: 0 }]} pointerEvents="none" />
        <Sprockets top />
        <Sprockets />

        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_W}
          decelerationRate="fast"
          disableIntervalMomentum
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingHorizontal: SIDE_PAD,
            alignItems: "center",
          }}
        >
          {STOPS.map((stop, i) => (
            <Stop
              key={label(stop)}
              index={i}
              text={label(stop)}
              scrollX={scrollX}
              reduced={reduced}
              onPress={() =>
                scrollRef.current?.scrollTo({ x: i * ITEM_W, animated: true })
              }
            />
          ))}
        </Animated.ScrollView>

        {/* The frame currently in the gate. Drawn last so a tall selected
            number can't paint over it. */}
        <Animated.View
          style={[styles.pointer, pointerStyle]}
          pointerEvents="none"
        />
      </View>
    </View>
  );
};

/** One perforated edge of the film. */
const Sprockets = ({ top }: { top?: boolean }) => (
  <View
    style={[styles.sprockets, top ? { top: 9 } : { bottom: 9 }]}
    pointerEvents="none"
  >
    {Array.from({ length: HOLE_COUNT }).map((_, i) => (
      <View key={i} style={styles.hole} />
    ))}
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const DECK_BG = "#131114";

// Film stock — a developed colour negative. Warm dark brown base, a slightly
// deeper edge under the perforations, and holes punched clean through to a
// paper-white so the strip reads as film rather than a brown pill.
const FILM_BASE = "#4A3327";
const FILM_EDGE = "rgba(30,18,12,0.34)";
const FILM_PERF = "#FAF3EC";

const styles = StyleSheet.create({
  deck: {
    height: 132,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    backgroundColor: DECK_BG,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "rgba(255,255,255,0.14)",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
    marginBottom: 22,
    overflow: "hidden",
  },
  deckRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  counter: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  digitFrame: {
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  frameSide: { width: 18, height: 17 },
  frameNow: { width: 30, height: 25 },
  digit: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  digitSide: {
    bottom: 1,
    fontFamily: "Inter-Medium",
    fontSize: 12,
    lineHeight: 15,
    color: "rgba(255,255,255,0.35)",
  },
  digitNow: {
    bottom: 0,
    fontFamily: "Inter-ExtraBold",
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.6,
    color: "#fff",
  },
  shutterRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#fff",
    padding: 3.5,
  },
  shutterCore: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  roll: {
    width: 62,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  rollShot: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
  },
  strip: {
    height: 92,
    borderRadius: 20,
    backgroundColor: FILM_BASE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(30,18,12,0.45)",
    justifyContent: "center",
    overflow: "hidden",
  },
  // Darker band the perforations sit in — the unexposed edge of the stock.
  edge: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 22,
    backgroundColor: FILM_EDGE,
  },
  sprockets: {
    position: "absolute",
    left: 5,
    right: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hole: {
    width: 8,
    height: 6,
    borderRadius: 1.5,
    backgroundColor: FILM_PERF,
  },
  pointer: {
    position: "absolute",
    top: 17,
    alignSelf: "center",
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.accentBright,
  },
  item: {
    width: ITEM_W,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  stopBox: {
    width: ITEM_W,
    height: 28,
    justifyContent: "center",
  },
  stop: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 20,
    lineHeight: 26,
  },
  stopOff: {
    fontFamily: "Inter-Medium",
    letterSpacing: -0.4,
    color: "rgba(250,243,236,0.40)",
  },
  stopOn: {
    fontFamily: "Inter-ExtraBold",
    letterSpacing: -0.7,
    color: colors.accentBright,
  },
  frameDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accentBright,
  },
});
