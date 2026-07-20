import React, { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  Pressable,
  View,
  Text,
  Image,
  StyleSheet,
} from "react-native";
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

interface TiltCardProps {
  type: string;
  index: number;
  selected: boolean;
  onPress: () => void;
}

const TiltCard: React.FC<TiltCardProps> = ({ type, index, selected, onPress }) => {
  const tilt = index % 2 === 0 ? -6 : 6;
  const sel = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      useNativeDriver: true,
      delay: index * 70,
      damping: 14,
      stiffness: 120,
      mass: 0.8,
    }).start();
  }, [enter, index]);

  useEffect(() => {
    Animated.spring(sel, {
      toValue: selected ? 1 : 0,
      useNativeDriver: true,
      damping: 13,
      stiffness: 160,
    }).start();
  }, [sel, selected]);

  const rotate = sel.interpolate({
    inputRange: [0, 1],
    outputRange: [`${tilt}deg`, "0deg"],
  });
  const translateY = Animated.add(
    sel.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }),
    enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] })
  );
  const scale = Animated.multiply(
    sel.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }),
    enter.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] })
  );

  return (
    <Pressable onPress={onPress} style={styles.slot} hitSlop={6}>
      <Animated.View
        style={[
          styles.cardAnim,
          {
            opacity: enter,
            transform: [{ perspective: 800 }, { translateY }, { rotate }, { scale }],
          },
        ]}
      >
        <View style={[styles.card, selected && styles.cardSelected]}>
          <Image
            source={{ uri: EVENT_TYPE_IMAGE[type] }}
            style={[StyleSheet.absoluteFill, { filter: VINTAGE_FILTER } as any]}
            resizeMode="cover"
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
};

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
