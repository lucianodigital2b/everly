import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  View,
  Text,
  Image,
  Dimensions,
  StyleSheet,
  Platform,
  Easing,
} from "react-native";
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

// Brand marks for the auth buttons (lucide has no Google logo).
const AppleIcon = ({ color = "#000" }: { color?: string }) => (
  <Svg width={19} height={22} viewBox="0 0 384 512">
    <Path
      fill={color}
      d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
    />
  </Svg>
);

const GoogleIcon = () => (
  <Svg width={19} height={19} viewBox="0 0 48 48">
    <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
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
// at u = 1 closes the loop, and the exit→entry hop sits at opacity 0 so the wrap
// is invisible. Each card reads this path offset by its phase.
const U_BASE = [0, 0.08, 0.28, 0.48, 0.68, 0.86, 0.999, 1];
const PATH = {
  x: [ENTRY.x, SLOTS[0].x, SLOTS[1].x, SLOTS[2].x, SLOTS[3].x, SLOTS[4].x, EXIT.x, ENTRY.x],
  y: [ENTRY.y, SLOTS[0].y, SLOTS[1].y, SLOTS[2].y, SLOTS[3].y, SLOTS[4].y, EXIT.y, ENTRY.y],
  rot: [ENTRY.rot, SLOTS[0].rot, SLOTS[1].rot, SLOTS[2].rot, SLOTS[3].rot, SLOTS[4].rot, EXIT.rot, ENTRY.rot],
  scale: [0.82, 1, 1, 1, 1, 1, 0.82, 0.82],
  opacity: [0, 1, 1, 1, 1, 1, 0, 0],
};
// Double each array over u ∈ [0,2]. The second copy repeats the first, so
// f(u) === f(u + 1): when the shared driver resets 1→0 the output is unchanged,
// making the loop seamless while every card keeps a strictly-ordered depth.
const dbl = (a: number[]) => [...a, ...a.slice(1)];
const U2 = [...U_BASE, ...U_BASE.slice(1).map((u) => u + 1)];
const PATH2 = {
  x: dbl(PATH.x),
  y: dbl(PATH.y),
  rot: dbl(PATH.rot).map((r) => `${r}deg`),
  scale: dbl(PATH.scale),
  opacity: dbl(PATH.opacity),
};
const CARD_COUNT = WELCOME_HERO_IMAGES.length; // phases evenly spaced → conveyor

// Typewriter title
const LINE1 = "beautiful";
const LINE2 = "moments";
const TOTAL = LINE1.length + 1 + LINE2.length; // +1 for the space

export default function Welcome() {
  // Single shared driver (0 → 1, looping) powers the conveyor; subtitle fade.
  const t = useRef(new Animated.Value(0)).current;
  const subA = useRef(new Animated.Value(0)).current;

  // Each card reads the path offset by its evenly-spaced phase, so together they
  // fill the arc and flow through it continuously.
  const cards = React.useMemo(
    () =>
      WELCOME_HERO_IMAGES.map((uri, k) => {
        const u = Animated.add(t, k / CARD_COUNT);
        const at = (outputRange: any) => u.interpolate({ inputRange: U2, outputRange });
        return {
          uri,
          translateX: at(PATH2.x),
          translateY: at(PATH2.y),
          rotate: at(PATH2.rot),
          scale: at(PATH2.scale),
          opacity: at(PATH2.opacity),
        };
      }),
    [t]
  );

  // Typewriter
  const [count, setCount] = useState(0);

  // Social auth — handlers already live in the auth store.
  const dispatch = authStore((s) => s.dispatch);
  const { appleSignIn, googleSignIn } = actions(dispatch);
  const isLoading = authStore((s) => s.isLoading);
  const token = authStore((s) => s.data?.token);
  const [pending, setPending] = useState<null | "apple" | "google">(null);
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
    setPending("apple");
    try {
      await appleSignIn();
    } finally {
      setPending(null);
    }
  };

  const handleGoogle = async () => {
    setPending("google");
    try {
      await googleSignIn();
    } finally {
      setPending(null);
    }
  };

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: LOOP_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    Animated.timing(subA, {
      toValue: 1,
      delay: 900,
      duration: 600,
      useNativeDriver: true,
    }).start();
    return () => loop.stop();
  }, [t, subA]);

  // Render each character, reserving full width so centering never jitters.
  const chars = (word: string, offset: number) =>
    [...word].map((ch, i) => (
      <Text key={i} style={{ opacity: count > offset + i ? 1 : 0 }}>
        {ch}
      </Text>
    ));

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

        {/* Card stage: photos ride an endless conveyor through the arc */}
        <View style={styles.arcStage} pointerEvents="none">
          {cards.map((c, i) => (
            <Animated.View
              key={i}
              style={[
                styles.arcCard,
                {
                  opacity: c.opacity,
                  transform: [
                    { translateX: c.translateX },
                    { translateY: c.translateY },
                    { rotate: c.rotate },
                    { scale: c.scale },
                  ],
                },
              ]}
            >
              <Image
                source={{ uri: c.uri }}
                style={[StyleSheet.absoluteFill, { filter: VINTAGE_FILTER } as any]}
                resizeMode="cover"
              />
              <View style={styles.wash} />
            </Animated.View>
          ))}
        </View>

        {/* Title + subtitle — below the cards */}
        <View style={styles.textBlock}>
          <Text style={styles.title}>
            <Text style={styles.titleThin}>{chars(LINE1, 0)}</Text>
            <Text> </Text>
            <Text style={styles.titleBold}>{chars(LINE2, LINE1.length + 1)}</Text>
          </Text>
          <Animated.Text style={[styles.subtitle, { opacity: subA }]}>
            Create an event, gather everyone's photos, and reveal the album
            together.
          </Animated.Text>
        </View>

        {/* Push the actions to the bottom */}
        <View style={{ flex: 1 }} />

        {/* Actions */}
        <View className="gap-3 pb-4">
          {appleAvailable && (
            <Button
              title="Continue with Apple"
              variant="secondary"
              icon={<AppleIcon color={colors.textPrimary} />}
              isLoading={pending === "apple"}
              disabled={isLoading && pending !== "apple"}
              onPress={handleApple}
            />
          )}

          <Button
            title="Continue with Google"
            variant="outline"
            icon={<GoogleIcon />}
            isLoading={pending === "google"}
            disabled={isLoading && pending !== "google"}
            onPress={handleGoogle}
          />

          {/* Divider */}
          <View className="flex-row items-center gap-3 my-1">
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text style={styles.orLabel}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

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
