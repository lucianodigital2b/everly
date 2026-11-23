import "react-native-gesture-handler";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { Platform } from "react-native";

import {
  Inter_200ExtraLight,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { Sacramento_400Regular } from "@expo-google-fonts/sacramento";
import {
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_700Bold,
} from "@expo-google-fonts/lexend";
import "react-native-url-polyfill/auto";
import "../assets/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Updates from "expo-updates";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { revenueCat } from "../services/revenuecat";
import { authStore } from "../zustand/auth-store";
import { appsFlyerService } from "../services/appsflyer";
import { useAppleCredentialWatch } from "../hooks/useAppleCredentialWatch";
import { useWidgetSync } from "../hooks/useWidgetSync";
import ThemeProvider from "../components/ThemeProvider";
import { colors } from "../constants/colors";
import GlobalNotifications from "../components/GlobalNotifications";
import { PostHogProvider } from "posthog-react-native";
import { queryClient } from "../services/queryClient";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "Inter-ExtraLight": Inter_200ExtraLight,
    "Inter-Regular": Inter_400Regular,
    "Inter-Medium": Inter_500Medium,
    "Inter-SemiBold": Inter_600SemiBold,
    "Inter-Bold": Inter_700Bold,
    "Inter-ExtraBold": Inter_800ExtraBold,
    // Wordmark only — the cursive signature, never for UI text.
    Script: Sacramento_400Regular,
    // Editorial pair: New Kansas carries every title, Lexend every
    // description. Inter stays for chrome — pills, counters, buttons,
    // micro-labels.
    "NewKansas-Medium": require("../assets/fonts/NewKansas-Medium.ttf"),
    "Lexend-Regular": Lexend_400Regular,
    "Lexend-Medium": Lexend_500Medium,
    "Lexend-Bold": Lexend_700Bold,
  });

  // Signs the user out if they revoke Sign in with Apple from iOS Settings.
  useAppleCredentialWatch();

  // Home Screen widget: mirrors the plan into the shared App Group.
  useWidgetSync();

  useEffect(() => {
    (async () => {
      await revenueCat.configure();
      appsFlyerService.configure();
      // Hand the AppsFlyer device id to RevenueCat so its server-side integration
      // can attribute and forward purchase events to AppsFlyer.
      const afUid = await appsFlyerService.getUID();
      await revenueCat.linkAppsFlyer(afUid);
    })();
  }, []);

  // Identify the signed-in account to RevenueCat as soon as it is known, not
  // only at purchase time: the premium subscription has to follow the account
  // (restore on another device, grants, webhook) instead of an anonymous id.
  const userId = authStore((s: any) => s.data?.user?.id);
  useEffect(() => {
    if (userId == null) return;
    (async () => {
      await revenueCat.configure();
      await revenueCat.logIn(userId);
    })();
  }, [userId]);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        if (__DEV__) return;
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log("Error checking for updates:", error);
      }
    };
    checkForUpdates();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <PostHogProvider
      apiKey="phc_JqPDRS6CSbUKx1UCw2ov870xYvU6R4ySMJGfWVDm3zt"
      options={{
        host: "https://us.i.posthog.com",
      }}
    >
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            {/* iOS keeps its native push ("default"). Android's default is a
                fade, so it gets the slide explicitly. */}
            <Stack
              screenOptions={{
                headerShown: false,
                animation: Platform.OS === "android" ? "slide_from_right" : "default",
                // Every screen opaque, so nothing below ever shows through a
                // gap (keyboard padding, short content). The bottom sheet
                // group overrides this with transparent.
                contentStyle: { backgroundColor: colors.backgroundPrimary },
              }}
            >
              {/* Roots of the app — nothing to swipe back to. */}
              <Stack.Screen name="index" options={{ gestureEnabled: false }} />
              <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
              <Stack.Screen name="(auth)" options={{ gestureEnabled: false }} />

              {/* Native stack, as in DailyHair: every other screen (qr, photo,
                  scan, upload, event, guests, budget, timeline, task…) gets the
                  iOS push and the native swipe-back by default. The JS stack
                  from react-native-screen-transitions it replaced came out
                  stiff on device. */}

              {/* Full screen from the bottom, like DailyHair's product scan.
                  No swipe: the camera holds an unsaved roll of photos, and the
                  X and Android's back button hand them over. */}
              <Stack.Screen
                name="camera"
                options={{
                  presentation: "fullScreenModal",
                  animation: "slide_from_bottom",
                  gestureEnabled: false,
                }}
              />
              {/* Wedding assistant chat, opened from the FAB on Home and Plan. */}
              <Stack.Screen
                name="assistant"
                options={{
                  presentation: "fullScreenModal",
                  animation: "slide_from_bottom",
                }}
              />
              {/* Premium subscription paywall (3 steps), ported from Bebê Enxoval. */}
              <Stack.Screen
                name="paywall"
                options={{
                  presentation: "fullScreenModal",
                  animation: "slide_from_bottom",
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen
                name="(bottomSheet)"
                options={{
                  presentation: "transparentModal",
                  contentStyle: { backgroundColor: "transparent" },
                  animation: "none",
                }}
              />
            </Stack>
            <GlobalNotifications />
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ThemeProvider>
    </PostHogProvider>
  );
}
