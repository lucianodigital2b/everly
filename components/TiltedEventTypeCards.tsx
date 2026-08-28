import React, { useEffect } from "react";
import {
  ScrollView,
  Pressable,
  View,
  Text,
  Image,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../constants/colors";
import {
  EVENT_TYPE_IMAGE,
  VINTAGE_FILTER,
  VINTAGE_WASH,
} from "../constants/sampleImages";

// Tilted event cards as the event-type picker. Real vintage photos; selected
// card springs up straight. Pressable is the OUTER element with a stable
// rectangular hit area so taps register reliably on Android (transforms live
// on the inner Animated.View, visual only).
//
// Reanimated, not core Animated, for one reason: this list lives inside the
// create wizard, which re-renders on every keystroke. A core Animated style
// array is rebuilt on each of those renders and the native node re-attaches,
// which is what made the cards flicker. A `useAnimatedStyle` object is stable
// across renders and the motion never leaves the UI thread.

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

interface TiltCardProps {
  type: string;
  index: number;
  selected: boolean;
  onPress: () => void;
}

const TiltCard: React.FC<TiltCardProps> = React.memo(
  ({ type, index, selected, onPress }) => {
    const tilt = index % 2 === 0 ? -6 : 6;
    const reduced = useReducedMotion();

    // Split on purpose: opacity rides a timing curve (a spring overshoots past
    // 1 and dips below 0, and the clamp reads as a flash), the transform rides
    // a spring.
    const fade = useSharedValue(reduced ? 1 : 0);
    const enter = useSharedValue(reduced ? 1 : 0);
    const sel = useSharedValue(selected ? 1 : 0);

    useEffect(() => {
      if (reduced) return;
      // Capped: the list is long enough that an uncapped stagger would leave
      // the last card arriving a second after the first.
      const delay = Math.min(index, 6) * 70;
      fade.set(
        withDelay(delay, withTiming(1, { duration: 260, easing: EASE_OUT }))
      );
      enter.set(
        withDelay(delay, withSpring(1, { duration: 500, dampingRatio: 0.75 }))
      );
    }, [enter, fade, index, reduced]);

    useEffect(() => {
      sel.set(
        withSpring(selected ? 1 : 0, { duration: 400, dampingRatio: 0.7 })
      );
    }, [sel, selected]);

    const animated = useAnimatedStyle<ViewStyle>(() => {
      const s = sel.get();
      const e = enter.get();
      return {
        opacity: fade.get(),
        transform: [
          { perspective: 800 },
          { translateY: s * -12 + (1 - e) * 24 },
          { rotate: `${tilt * (1 - s)}deg` },
          { scale: (1 + s * 0.06) * (0.9 + e * 0.1) },
        ] as ViewStyle["transform"],
      };
    });

    return (
      <Pressable onPress={onPress} style={styles.slot} hitSlop={6}>
        <Animated.View style={[styles.cardAnim, animated]}>
          <View style={[styles.card, selected && styles.cardSelected]}>
            <Image
              source={{ uri: EVENT_TYPE_IMAGE[type] }}
              style={[StyleSheet.absoluteFill, { filter: VINTAGE_FILTER } as any]}
              resizeMode="cover"
              // Android's default 300ms image cross-fade lands mid-entrance and
              // reads as a flicker.
              fadeDuration={0}
            />
            <View style={styles.wash} />
            <View style={styles.scrim} />
            <Text style={styles.label} numberOfLines={1}>
              {type}
            </Text>
            {selected && <View style={styles.check} />}
          </View>
        </Animated.View>
      </Pressable>
    );
  }
);

TiltCard.displayName = "TiltCard";

interface TiltedEventTypeCardsProps {
  types: string[];
  selected: string;
  onSelect: (type: string) => void;
}

export const TiltedEventTypeCards: React.FC<TiltedEventTypeCardsProps> = ({
  types,
  selected,
  onSelect,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {types.map((type, i) => (
        <TiltCard
          key={type}
          type={type}
          index={i}
          selected={selected === type}
          onPress={() => onSelect(type)}
        />
      ))}
    </ScrollView>
  );
};

const CARD_W = 116;
const CARD_H = 150;

const styles = StyleSheet.create({
  row: {
    paddingVertical: 26,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  // Stable, non-transformed hit area. A little wider than the card so the
  // tilted corners stay tappable; a small gap keeps neighbours from stealing taps.
  slot: {
    width: CARD_W + 10,
    height: CARD_H + 28,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  cardAnim: {
    width: CARD_W,
    height: CARD_H,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 22,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 12,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.surface2,
    shadowColor: "#3A2E33",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  cardSelected: {
    borderColor: colors.accent,
    shadowOpacity: 0.4,
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: VINTAGE_WASH,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,12,8,0.22)",
  },
  label: {
    fontFamily: "Inter-Bold",
    fontSize: 15,
    color: "#fff",
    letterSpacing: -0.3,
  },
  check: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: "#fff",
  },
});
