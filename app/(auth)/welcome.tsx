import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  Dimensions,
  StyleSheet,
  Platform,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { QrCode } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router";
import { Button } from "../../components/Button";
import { colors } from "../../constants/colors";
import { authStore } from "../../zustand/auth-store";
import actions from "../../zustand/auth-store/actions";

// Apple's mark, which lucide doesn't carry.
const AppleIcon = ({ color = "#000" }: { color?: string }) => (
  <Svg width={19} height={22} viewBox="0 0 384 512">
    <Path
      fill={color}
      d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
    />
  </Svg>
);

import {
  WELCOME_HERO_IMAGES,
  VINTAGE_FILTER,
  VINTAGE_WASH,
} from "../../constants/sampleImages";

const { width: SCREEN_W } = Dimensions.get("window");

// ── Auto-sliding arc of hero cards ───────────────────────────────────────────
// The photos ride an endless conveyor: each one enters off the top-left, flows
// down through the arc's five cascade slots, and exits off the bottom-right,
// looping seamlessly so it reads as an automatic slideshow.
const CARD_W = SCREEN_W * 0.44;
const CARD_H = CARD_W * 1.3;
const TOP_INSET = 6; // gap between the highest card and the arc's top edge
const LOOP_MS = 24000; // time for one photo to travel the whole path

// Five resting slots along the asymmetric cascade: peak just left of centre,
// then tumbling down to the right, the last curling back lowest. `cx` = centre
// X as a fraction of the screen; `top` in px (0 = peak); `rot` in degrees.
const SLOT_LAYOUT = [
  { cx: 0.04, top: 44, rot: -10 },
  { cx: 0.33, top: 0, rot: -6 }, //  peak
  { cx: 0.62, top: 40, rot: 7 },
  { cx: 0.92, top: 74, rot: 15 },
  { cx: 0.8, top: 95, rot: 20 }, //  lowest
];
const SLOTS = SLOT_LAYOUT.map((c) => ({
  x: c.cx * SCREEN_W - CARD_W / 2,
  y: c.top + TOP_INSET,
  rot: c.rot,
}));
const ARC_H = Math.max(...SLOTS.map((s) => s.y + CARD_H)) + 8;

// Off-screen points that bookend the conveyor path.
const ENTRY = { x: -SCREEN_W * 0.5, y: -CARD_H * 0.35, rot: -18 };
const EXIT = { x: SCREEN_W * 1.15, y: ARC_H + CARD_H * 0.2, rot: 30 };

// One period of the path as keyframes (u ∈ [0,1]); the trailing entry keyframe
// at u = 1 closes the loop, so f(1) === f(0). Both ENTRY and EXIT sit fully
// off-screen, so the exit→entry hop is never seen and the cards stay fully
// opaque the whole way — they slide in and out like a carousel rather than
// fading. Each card samples the path at `(driver + its own phase) mod 1`;
// because the path closes on itself, that wrap is invisible. The modulo is what
// the old core-Animated version had to fake by doubling every keyframe array —
// a worklet can just do the arithmetic.
const U = [0, 0.08, 0.28, 0.48, 0.68, 0.86, 0.999, 1];
const PATH_X = [ENTRY.x, SLOTS[0].x, SLOTS[1].x, SLOTS[2].x, SLOTS[3].x, SLOTS[4].x, EXIT.x, ENTRY.x];
const PATH_Y = [ENTRY.y, SLOTS[0].y, SLOTS[1].y, SLOTS[2].y, SLOTS[3].y, SLOTS[4].y, EXIT.y, ENTRY.y];
const PATH_ROT = [ENTRY.rot, SLOTS[0].rot, SLOTS[1].rot, SLOTS[2].rot, SLOTS[3].rot, SLOTS[4].rot, EXIT.rot, ENTRY.rot];
const PATH_SCALE = [0.82, 1, 1, 1, 1, 1, 0.82, 0.82];

const CARD_COUNT = WELCOME_HERO_IMAGES.length; // phases evenly spaced → conveyor

// One card on the conveyor. Memoised and driven entirely from the UI thread, so
// nothing in this subtree re-renders while the loop runs — which is what keeps
// the photos from flickering when the text above them updates.
const HeroCard = React.memo(function HeroCard({
  uri,
  phase,
  driver,
  frozen,
}: {
  uri: string;
  phase: number;
  driver: SharedValue<number>;
  frozen: { x: number; y: number; rot: number } | null;
}) {
  const animated = useAnimatedStyle<ViewStyle>(() => {
    if (frozen) {
      return {
        transform: [
          { translateX: frozen.x },
          { translateY: frozen.y },
          { rotate: `${frozen.rot}deg` },
          { scale: 1 },
        ] as ViewStyle["transform"],
      };
    }
    const u = (driver.get() + phase) % 1;
    return {
      transform: [
        { translateX: interpolate(u, U, PATH_X) },
        { translateY: interpolate(u, U, PATH_Y) },
        { rotate: `${interpolate(u, U, PATH_ROT)}deg` },
        { scale: interpolate(u, U, PATH_SCALE) },
      ] as ViewStyle["transform"],
    };
  });

  return (
    <Animated.View
      style={[styles.arcCard, animated]}
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
    >
      <Image
        source={{ uri }}
        style={[StyleSheet.absoluteFill, { filter: VINTAGE_FILTER } as any]}
        resizeMode="cover"
        // Android cross-fades a decoded image in over 300ms by default; on a
        // card that is already moving, that reads as a flicker.
        fadeDuration={0}
      />
      <View style={styles.wash} />
    </Animated.View>
  );
});

// Typewriter title
const LINE1 = "beautiful";
const LINE2 = "moments";
const TOTAL = LINE1.length + 1 + LINE2.length; // +1 for the space

// The reveal ticks ~19 times in the first 1.3s. It lives in its own component so
// those re-renders stop here and never reach the conveyor above — a parent
// re-render rebuilds every card's style array, and that was the flicker.
const TypewriterTitle = React.memo(function TypewriterTitle() {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(reduced ? TOTAL : 0);

  useEffect(() => {
    if (reduced) {
      setCount(TOTAL);
      return;
    }
    const type = setInterval(() => {
      setCount((v) => {
        if (v >= TOTAL) {
          clearInterval(type);
          return v;
        }
        return v + 1;
      });
    }, 68);
    return () => clearInterval(type);
  }, [reduced]);

  // Every character stays mounted and is revealed by opacity alone, so the line
  // never re-measures and the centring never jitters.
  const chars = (word: string, offset: number) =>
    [...word].map((ch, i) => (
      <Text key={i} style={{ opacity: count > offset + i ? 1 : 0 }}>
        {ch}
      </Text>
    ));

  return (
    <Text style={styles.title}>
      <Text style={styles.titleThin}>{chars(LINE1, 0)}</Text>
      <Text> </Text>
      <Text style={styles.titleBold}>{chars(LINE2, LINE1.length + 1)}</Text>
    </Text>
  );
});

export default function Welcome() {
  const reduced = useReducedMotion();

  // Single shared driver (0 → 1, looping) powers the conveyor, on the UI thread.
  const t = useSharedValue(0);
  const sub = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    t.set(
      withRepeat(
        withTiming(1, { duration: LOOP_MS, easing: Easing.linear }),
        -1,
        false
      )
    );
    return () => cancelAnimation(t);
  }, [reduced, t]);

  useEffect(() => {
    sub.set(withDelay(900, withTiming(1, { duration: 600 })));
    return () => cancelAnimation(sub);
  }, [sub]);

  const subtitleStyle = useAnimatedStyle(() => ({ opacity: sub.get() }));

  // Social auth — handlers already live in the auth store.
  const dispatch = authStore((s) => s.dispatch);
  const { appleSignIn } = actions(dispatch);
  const isLoading = authStore((s) => s.isLoading);
  const token = authStore((s) => s.data?.token);
  const [signingIn, setSigningIn] = useState(false);
  // Apple Sign In is iOS-only; hide the button where it isn't offered.
  const [appleAvailable, setAppleAvailable] = useState(Platform.OS === "ios");

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  useEffect(() => {
    if (token) router.replace("/(tabs)");
  }, [token]);

  const handleApple = async () => {
    setSigningIn(true);
    try {
      await appleSignIn();
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundPrimary" edges={["top", "bottom"]}>
      <StatusBar style="dark" />

      <View className="flex-1 px-8">
        {/* Wordmark */}
        <View className="items-center pt-2">
          <Text style={styles.wordmark}>
            ever<Text style={{ color: colors.accent }}>ly</Text>
          </Text>
        </View>

        {/* Card stage: photos ride an endless conveyor through the arc.
            Under Reduce Motion the arc simply sits still, filled. */}
        <View style={styles.arcStage} pointerEvents="none">
          {WELCOME_HERO_IMAGES.map((uri, i) => (
            <HeroCard
              key={uri}
              uri={uri}
              phase={i / CARD_COUNT}
              driver={t}
              frozen={reduced ? SLOTS[i % SLOTS.length] : null}
            />
          ))}
        </View>

        {/* Title + subtitle — below the cards */}
        <View style={styles.textBlock}>
          <TypewriterTitle />
          <Animated.Text style={[styles.subtitle, subtitleStyle]}>
            Create an event, gather everyone's photos, and reveal the album
            together.
          </Animated.Text>
        </View>

        {/* Push the actions to the bottom */}
        <View style={{ flex: 1 }} />

        {/* Actions — Apple is the only account path; QR joins without one. */}
        <View className="gap-3 pb-4">
          {appleAvailable && (
            <>
              <Button
                title="Continue with Apple"
                variant="secondary"
                icon={<AppleIcon color={colors.textPrimary} />}
                isLoading={signingIn}
                disabled={isLoading && !signingIn}
                onPress={handleApple}
              />

              {/* Divider. Hidden with the Apple button: off iOS there is nothing
                  above the guest path for it to separate. */}
              <View className="flex-row items-center gap-3 my-1">
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                <Text style={styles.orLabel}>or</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              </View>
            </>
          )}

          {/* Guest — scan a QR to join an event, no account needed */}
          <Button
            title="Scan a QR to join"
            variant="outline"
            icon={<QrCode size={20} color={colors.accentDeep} strokeWidth={2.2} />}
            onPress={() => router.push("/scan")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    fontFamily: "Script",
    fontSize: 44,
    lineHeight: 56,
    color: colors.textPrimary,
  },
  orLabel: {
    fontFamily: "Inter-Medium",
    fontSize: 12,
    color: colors.textTertiary,
  },
  // Full-bleed arc layer. Negative margin cancels the parent's px-8 so the
  // cards can run off the true screen edges; overflow stays visible.
  arcStage: {
    width: SCREEN_W,
    height: ARC_H,
    marginLeft: -32,
    overflow: "visible",
  },
  arcCard: {
    position: "absolute",
    left: 0,
    top: 0,
    width: CARD_W,
    height: CARD_H,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 5,
    borderColor: "#FFFFFF",
    backgroundColor: colors.surface2,
    shadowColor: "#3A2E33",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 8,
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: VINTAGE_WASH,
  },
  textBlock: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 22,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1,
    color: colors.textPrimary,
    textAlign: "center",
  },
  titleThin: { fontFamily: "Inter-ExtraLight" },
  titleBold: { fontFamily: "Inter-ExtraBold" },
  subtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 12,
    paddingHorizontal: 8,
  },
});
