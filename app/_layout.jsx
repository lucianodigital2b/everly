import 'react-native-gesture-handler';
import { useEffect } from "react";
import { useFonts } from "expo-font";
import "react-native-url-polyfill/auto";
import "../assets/global.css";
import { SplashScreen, Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authStore } from '../zustand/auth-store';
import Purchases from 'react-native-purchases';
import * as Updates from 'expo-updates';

import { GestureHandlerRootView } from "react-native-gesture-handler";
import ThemeProvider from "../components/ThemeProvider";
import GlobalProvider from "../context/GlobalProvider";
import GlobalNotifications from "../components/GlobalNotifications";
import '../localization/i18n';
import { PostHogProvider } from 'posthog-react-native'
import { Platform } from 'react-native';

// Purchases.setLogLevel(Purchases.LOG_LEVEL.VERBOSE);
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const [fontsLoaded, error] = useFonts({
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
    // Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

    console.log(process.env.EXPO_PUBLIC_RC_IOS)
    if (Platform.OS === 'ios') {
    	Purchases.configure({ apiKey:  process.env.EXPO_PUBLIC_RC_IOS });
      

    } else if (Platform.OS === 'android') {
    	// Purchases.configure({ apiKey: <public_google_api_key> });

      // OR: if building for Amazon, be sure to follow the installation instructions then:
    	// Purchases.configure({ apiKey: <public_amazon_api_key>, useAmazon: true });
    }


  }, []);

  // EAS Updates functionality
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        if (__DEV__) return; // Skip in development
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log('Error checking for updates:', error);
      }
    };

    checkForUpdates();
   }, []);

  useEffect(() => {
    if (error) throw error;

    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded) {
    
    return null;
  }

  if (!fontsLoaded && !error) {
    return null;
  }

  const queryClient = new QueryClient();
  


  return (
    <GlobalProvider>
      <PostHogProvider apiKey="phc_JqPDRS6CSbUKx1UCw2ov870xYvU6R4ySMJGfWVDm3zt" options={{
            host: "https://us.i.posthog.com",
            
        }}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>

            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="folders/index" options={{ headerShown: false }} />
              <Stack.Screen 
                name="folders/create" 
                options={{ 
                  headerShown: false,
                  presentation: "modal",
                  animation: "slide_from_bottom"
                }} 
              />

              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="category/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="scanner" options={{ headerShown: false }} />
              
              <Stack.Screen
                name="(bottomSheet)"
                options={{
                  presentation: "transparentModal",
                  headerShown: false,
                  contentStyle: {backgroundColor: "transparent"},
                  animation: "none"
                }}
              />
            </Stack>

            <GlobalNotifications />
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ThemeProvider>
      </PostHogProvider>
    </GlobalProvider>
  );
};

export default RootLayout;
