import { Platform } from "react-native";

// Lazily required so the app still runs where the native module is absent
// (Expo Go, web, or before a dev-client rebuild) — mirrors services/revenuecat.ts.
let appsFlyer: any = null as any;
try {
  appsFlyer = require("react-native-appsflyer").default;
} catch {}

// expo-tracking-transparency, lazily required. Used to show the iOS ATT prompt
// so AppsFlyer can access the IDFA when the user allows tracking.
let TrackingTransparency: any = null as any;
try {
  TrackingTransparency = require("expo-tracking-transparency");
} catch {}

// The dev key is a single value shared across platforms (AppsFlyer → Settings →
// App details). The App ID is the numeric Apple App Store id, iOS only; Android
// is keyed off the package name so it needs no id here.
const DEV_KEY = process.env.EXPO_PUBLIC_AF_DEV_KEY;
const IOS_APP_ID = process.env.EXPO_PUBLIC_AF_APPLE_APP_ID;

let configured = false;

/**
 * Show the iOS App Tracking Transparency prompt. iOS only; a no-op on Android,
 * web, or when the module is absent. AppsFlyer's initSdk waits up to
 * `timeToWaitForATTUserAuthorization` seconds for this decision before sending
 * the install event, so a granted IDFA is included in attribution.
 */
const requestATT = async () => {
  if (Platform.OS !== "ios" || !TrackingTransparency) return;
  try {
    await TrackingTransparency.requestTrackingPermissionsAsync();
  } catch (e) {
    console.warn("[AppsFlyer] ATT request failed", e);
  }
};

/**
 * Initialise the AppsFlyer SDK. Call once at app startup (see app/_layout.tsx),
 * alongside revenueCat.configure(). Safe to call more than once — subsequent
 * calls are ignored. No-ops (with a warning) when the dev key is missing so
 * builds without attribution configured still run.
 */
const configure = () => {
  if (!appsFlyer || configured) return;
  if (!DEV_KEY) {
    console.warn(
      "[AppsFlyer] No dev key configured — attribution is disabled. " +
        "Set EXPO_PUBLIC_AF_DEV_KEY (and EXPO_PUBLIC_AF_APPLE_APP_ID for iOS) in .env.local.",
    );
    return;
  }
  if (Platform.OS === "ios" && !IOS_APP_ID) {
    console.warn(
      "[AppsFlyer] EXPO_PUBLIC_AF_APPLE_APP_ID is not set — iOS installs cannot be attributed.",
    );
  }

  try {
    appsFlyer.initSdk(
      {
        devKey: DEV_KEY,
        isDebug: __DEV__,
        appId: IOS_APP_ID ?? "", // iOS only; ignored on Android
        onInstallConversionDataListener: true,
        // Give the ATT prompt time to resolve before the first launch is sent.
        // Harmless when ATT isn't requested. See the ATT note in CLAUDE.md.
        timeToWaitForATTUserAuthorization: 10,
      },
      () => {
        configured = true;
      },
      (err: any) => {
        console.warn("[AppsFlyer] initSdk failed", err);
      },
    );
    // Fire the ATT prompt right after init; the SDK holds the install event
    // until the user decides (up to timeToWaitForATTUserAuthorization seconds).
    requestATT();
  } catch (e) {
    console.warn("[AppsFlyer] initSdk threw", e);
  }
};

/**
 * Tie attribution to the signed-in user. Uses the same `users.id` RevenueCat is
 * identified with, so installs, in-app events and purchases line up across both.
 * Best set right after a successful login/register. Idempotent.
 */
const setUserId = (userId: string | number) => {
  if (!appsFlyer || userId == null || userId === "") return;
  try {
    appsFlyer.setCustomerUserId(String(userId), () => {});
  } catch (e) {
    console.warn("[AppsFlyer] setCustomerUserId failed", e);
  }
};

/**
 * The AppsFlyer device id (AppsFlyer UID). Hand this to
 * `revenueCat.linkAppsFlyer()` so RevenueCat can attribute the purchase events
 * it forwards to AppsFlyer server-side. Resolves null when the SDK is absent.
 */
const getUID = (): Promise<string | null> =>
  new Promise((resolve) => {
    if (!appsFlyer) return resolve(null);
    try {
      appsFlyer.getAppsFlyerUID((err: any, uid: string) => {
        resolve(err ? null : uid);
      });
    } catch {
      resolve(null);
    }
  });

/** Log a custom in-app event (e.g. the AppsFlyer `af_` events, or your own). */
const logEvent = async (
  eventName: string,
  values: Record<string, any> = {},
) => {
  if (!appsFlyer) return;
  try {
    await appsFlyer.logEvent(eventName, values);
  } catch (e) {
    console.warn(`[AppsFlyer] logEvent(${eventName}) failed`, e);
  }
};

// NOTE: purchase/revenue events are NOT logged here. RevenueCat forwards them to
// AppsFlyer server-side via its native integration (see revenueCat.linkAppsFlyer).
// Logging `af_purchase` from the client too would double-count the revenue.

export const appsFlyerService = {
  configure,
  setUserId,
  getUID,
  logEvent,
};
