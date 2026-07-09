import "react-native-gesture-handler";
import { withLayoutContext } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useEffect } from "react";

import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import "react-native-url-polyfill/auto";
import "../assets/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Purchases from "react-native-purchases";
import * as Updates from "expo-updates";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ThemeProvider from "../components/ThemeProvider";
import GlobalNotifications from "../components/GlobalNotifications";
import "../localization/i18n";
import { PostHogProvider } from "posthog-react-native";
import { Platform } from "react-native";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const REVENUECAT_API_KEY = "sk_zcczUwcmVakcFjjNowtDjrBBgzIig";
const Transition = require("react-native-screen-transitions").default;
const {
  createBlankStackNavigator,
} = require("react-native-screen-transitions/blank-stack");
const { Navigator } = createBlankStackNavigator();
const Stack = withLayoutContext(Navigator);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "PlayfairDisplay-Regular": PlayfairDisplay_400Regular,
    "PlayfairDisplay-Bold": PlayfairDisplay_700Bold,
    "Outfit-Light": Outfit_300Light,
    "Outfit-Regular": Outfit_400Regular,
    "Outfit-Medium": Outfit_500Medium,
    "Outfit-SemiBold": Outfit_600SemiBold,
    "Outfit-Bold": Outfit_700Bold,
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
  });

  useEffect(() => {
    if (Platform.OS === "ios") {
      Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
      });
    }
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
