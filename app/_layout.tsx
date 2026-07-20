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
import ThemeProvider from "../components/ThemeProvider";
import GlobalNotifications from "../components/GlobalNotifications";
import "../localization/i18n";
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

  useEffect(() => {
    revenueCat.configure();
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
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="onboarding" />
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
                  return {
                    ...Transition.Presets.SlideFromBottom(),
                  };
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
