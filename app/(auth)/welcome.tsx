import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { QrCode } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router";
import { Button } from "../../components/Button";
import { WelcomeAnimation } from "../../components/WelcomeAnimation";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { authStore } from "../../zustand/auth-store";
import { usePlannerStore } from "../../zustand/planner";
import actions from "../../zustand/auth-store/actions";
import { t } from "../../i18n";

// Apple's mark, which lucide doesn't carry.
const AppleIcon = ({ color = "#000" }: { color?: string }) => (
  <Svg width={19} height={22} viewBox="0 0 384 512">
    <Path
      fill={color}
      d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
    />
  </Svg>
);

// Same layout as Bebê Enxoval's welcome: the task animation on top, the
// promise under it, the actions at the bottom. Insets by hand, since the video
// runs edge to edge.
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

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
    if (!token) return;
    // First sign-in lands on the Plan tab, where the setup wizard builds the
    // wedding plan. Couples who already have a plan, or skipped it, go home.
    const { weddingDate, setupSkipped } = usePlannerStore.getState();
    router.replace(!weddingDate && !setupSkipped ? "/(tabs)/plan" : "/(tabs)");
  }, [token]);

  const handleApple = async () => {
    setSigningIn(true);
    try {
      await appleSignIn();
    } finally {
      setSigningIn(false);
    }
  };

  const enter = reduced ? undefined : FadeIn.duration(500).delay(250);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      {/* Starts below the status bar, with the wordmark above it. The
          animation takes only the height the copy and buttons leave. */}
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.wordmark} maxFontSizeMultiplier={1.2}>
          ever<Text style={{ color: colors.accent }}>ly</Text>
        </Text>
        <WelcomeAnimation />
      </View>

      <Animated.View entering={enter} style={styles.copy}>
        <Text style={styles.title} maxFontSizeMultiplier={1.25}>
          {t("welcome.title")}
        </Text>
        <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
          {t("welcome.subtitle")}
        </Text>
      </Animated.View>

      {/* Apple is the only account path; QR joins an event without one. */}
      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) + 4 }]}>
        {appleAvailable && (
          <Button
            title={t("welcome.continueWithApple")}
            variant="secondary"
            icon={<AppleIcon color={colors.textPrimary} />}
            isLoading={signingIn}
            disabled={isLoading && !signingIn}
            onPress={handleApple}
          />
        )}
        <Button
          title={t("welcome.scanQrToJoin")}
          variant="outline"
          icon={<QrCode size={20} color={colors.accentDeep} strokeWidth={2.2} />}
          onPress={() => router.push("/scan")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  wordmark: {
    fontFamily: "Script",
    fontSize: 40,
    lineHeight: 52,
    color: colors.textPrimary,
    textAlign: "center",
  },
  top: {
    flex: 1,
    minHeight: 0,
  },
  copy: {
    gap: 12,
    paddingHorizontal: 32,
    paddingTop: 12,
    paddingBottom: 24,
  },
  title: {
    fontFamily: typography.fonts.title,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
    textAlign: "center",
  },
  actions: {
    gap: 12,
    paddingHorizontal: 32,
  },
});
