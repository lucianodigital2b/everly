import "react-native-gesture-handler";
import { withLayoutContext } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useEffect } from "react";

import {
  Inter_200ExtraLight,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { Sacramento_400Regular } from "@expo-google-fonts/sacramento";
import "react-native-url-polyfill/auto";
import "../assets/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Updates from "expo-updates";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { revenueCat } from "../services/revenuecat";
import { appsFlyerService } from "../services/appsflyer";
import { useAppleCredentialWatch } from "../hooks/useAppleCredentialWatch";
import { SlideFromRight } from "../constants/transitions";
import ThemeProvider from "../components/ThemeProvider";
import GlobalNotifications from "../components/GlobalNotifications";
import { PostHogProvider } from "posthog-react-native";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const Transition = require("react-native-screen-transitions").default;
const {
  createBlankStackNavigator,
} = require("react-native-screen-transitions/blank-stack");
const { Navigator } = createBlankStackNavigator();
const Stack = withLayoutContext(Navigator);

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
  });

  // Signs the user out if they revoke Sign in with Apple from iOS Settings.
  useAppleCredentialWatch();

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
            <Stack screenOptions={{ headerShown: false }}>
              {/* Roots of the app — nothing to swipe back to. */}
              <Stack.Screen name="index" options={{ gestureEnabled: false }} />
              <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
              <Stack.Screen name="(auth)" options={{ gestureEnabled: false }} />

              {/* Pushed screens: iOS push in, left-edge swipe back out. */}
              <Stack.Screen name="onboarding" options={SlideFromRight()} />
              <Stack.Screen name="camera" options={SlideFromRight()} />
              <Stack.Screen name="qr" options={SlideFromRight()} />
              <Stack.Screen name="photo" options={SlideFromRight()} />
              <Stack.Screen name="scan" options={SlideFromRight()} />
              <Stack.Screen name="upload/[token]" options={SlideFromRight()} />
              <Stack.Screen
                name="event/[id]"
                options={({ route }: any) => {
                  const sharedBoundTag = route?.params?.sharedBoundTag;
                  if (
                    typeof sharedBoundTag === "string" &&
                    sharedBoundTag.length > 0
                  ) {
                    return {
                      ...Transition.Presets.SharedAppleMusic({
                        sharedBoundTag,
                      }),
                    };
                  }
                  // No shared element to fly from (opened from the list or
                  // straight after creating) — plain push, so the left-edge
                  // swipe goes back the way the chevron does.
                  return SlideFromRight();
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
