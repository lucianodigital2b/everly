import { Platform } from "react-native";

let Purchases: any = null as any;
let PurchasesUI: any = null as any;
try {
  Purchases = require("react-native-purchases").default;
} catch {}
try {
  PurchasesUI = require("react-native-purchases-ui");
} catch {}

const ENTITLEMENT_ID = "everly_guests";

/**
 * Guest packs are **consumables**: one purchase adds N guest slots to a single
 * event. RevenueCat does not keep consumables in `customerInfo.entitlements`,
 * so the client can never derive a guest allowance from the SDK.
 *
 * Source of truth is `Event.participant_limit`, incremented server-side by the
 * RevenueCat webhook. After a purchase, refetch the event — do not optimistically
 * add slots on the client.
 */
const GUEST_PACKS: Record<string, number | null> = {
  guests_10: 10,
  guests_25: 25,
  guests_50: 50,
  guests_100: 100,
  guests_150: 150,
  guests_unlimited: null, // null = unlimited, matches Event.participant_limit
};

const PACK_ORDER = [
  "guests_10",
  "guests_25",
  "guests_50",
  "guests_100",
  "guests_150",
  "guests_unlimited",
];

type InitOptions = {
  apiKey?: string;
  appUserID?: string | null;
};

export type RevenueCatOffering = any;
export type RevenueCatCustomerInfo = any;
export type RevenueCatPackage = any;

// Dev and preview builds run under suffixed bundle ids (com.get.everly.dev,
// see app.config.js). StoreKit resolves products against the *running* id and
// no store record exists for `.dev`, so every product comes back invalid and
// the paywall / guest packs show no plans.
//
// Debug bundles therefore use RevenueCat's Test Store (EXPO_PUBLIC_RC_TEST, a
// `test_` key): same offerings, same package ids, purchases simulated by a
// RevenueCat dialog. Debug only on purpose: the SDK refuses a Test Store key in
// a release build. Never add it to an EAS environment.
const TEST_STORE_KEY = process.env.EXPO_PUBLIC_RC_TEST;
export const USING_TEST_STORE = __DEV__ && !!TEST_STORE_KEY;

// Only public SDK keys belong in the app: appl_… (iOS), goog_… (Android) and
// test_… (Test Store, debug only). A secret key (sk_…) must never ship.
const getApiKeyForPlatform = (explicit?: string) => {
  const key =
    explicit ??
    (USING_TEST_STORE ? TEST_STORE_KEY : undefined) ??
    (Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_RC_IOS
      : Platform.OS === "android"
        ? process.env.EXPO_PUBLIC_RC_ANDROID
        : undefined);

  if (!key) return undefined;

  if (key.startsWith("sk_")) {
    console.warn(
      "[RevenueCat] Refusing to configure with a secret key (sk_…). Use the public SDK key for this platform.",
    );
    return undefined;
  }

  return key;
};

// configure() is called from several places (root layout, useRevenueCat, the
// create flow) and must stay a no-op after the first one. Re-running
// Purchases.configure() re-initialises the native SDK mid-session and re-sends
// the cached device attributes, which the backend then rejects with
// "$idfv: IDFV cannot be modified".
let configuring: Promise<void> | null = null;

const configure = async (opts?: InitOptions) => {
  if (!Purchases) return;
  if (configuring) return configuring;

  configuring = (async () => {
    const apiKey = getApiKeyForPlatform(opts?.apiKey);
    if (!apiKey) {
      console.warn(
        "[RevenueCat] No public API key configured — purchases are disabled. " +
          "Set EXPO_PUBLIC_RC_IOS / EXPO_PUBLIC_RC_ANDROID in .env.local.",
      );
      return;
    }
    // Survives a JS reload in dev, where the module flag resets but the native
    // SDK is still configured from the previous bundle.
    if (await Purchases.isConfigured?.()) return;

    if (opts?.appUserID) {
      await Purchases.configure({ apiKey, appUserID: opts.appUserID });
    } else {
      await Purchases.configure({ apiKey });
    }
  })();

  try {
    await configuring;
  } catch (e) {
    // Let the next caller retry rather than latching a failed init.
    configuring = null;
    console.warn("[RevenueCat] configure failed", e);
  }
};

/**
 * Identify the signed-in user to RevenueCat so purchases carry
 * `app_user_id = users.id`. The backend cross-checks event ownership against
 * this on the webhook, so it must match the API user id. Idempotent.
 */
const logIn = async (appUserID: string | number) => {
  if (!Purchases || appUserID == null || appUserID === "") return;
  try {
    // Already this user — skip. A redundant logIn re-runs the alias/attribute
    // sync on every purchase attempt, which is what makes the "$idfv cannot be
    // modified" warning repeat each time the user retries.
    const current = await Purchases.getAppUserID();
    if (current === String(appUserID)) return;

    await Purchases.logIn(String(appUserID));
  } catch (e) {
    console.warn("[RevenueCat] logIn failed", e);
  }
};

const logOut = async () => {
  if (!Purchases) return;
  try {
    await Purchases.logOut();
  } catch {}
};

/**
 * Wire the RevenueCat → AppsFlyer integration. RevenueCat forwards purchase and
 * subscription events to AppsFlyer server-side, but only if it knows the device's
 * AppsFlyer ID and identifiers — otherwise the events land unattributed.
 *
 * Call once after both SDKs are configured (see app/_layout.tsx). Because RC
 * sends `non_renewing_purchase` for consumables, this is what reports guest-pack
 * revenue to AppsFlyer — do NOT also log `af_purchase` from the client or the
 * revenue is double-counted.
 */
const linkAppsFlyer = async (appsFlyerId?: string | null) => {
  if (!Purchases) return;
  try {
    // Grabs IDFA/IDFV (iOS) / GAID (Android) + the RC device id so AppsFlyer can
    // match. IDFA is only non-zero once ATT is granted; matching still works
    // off the AppsFlyer ID without it.
    await Purchases.collectDeviceIdentifiers();
    if (appsFlyerId) {
      await Purchases.setAppsflyerID(appsFlyerId);
    }
  } catch (e) {
    console.warn("[RevenueCat] linkAppsFlyer failed", e);
  }
};

const setLogLevel = (level: "debug" | "info" | "warn" | "error") => {
  if (!Purchases) return;
  const map: any = {
    debug: Purchases.LOG_LEVEL.DEBUG,
    info: Purchases.LOG_LEVEL.INFO,
    warn: Purchases.LOG_LEVEL.WARN,
    error: Purchases.LOG_LEVEL.ERROR,
  };
  Purchases.setLogLevel(map[level] ?? Purchases.LOG_LEVEL.INFO);
};

const getOfferings = async (): Promise<RevenueCatOffering | null> => {
  if (!Purchases) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch {
    return null;
  }
};

const purchasePackage = async (pkg: RevenueCatPackage) => {
  if (!Purchases) return { success: false, customerInfo: null as any };
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, customerInfo };
  } catch (e: any) {
    return { success: false, customerInfo: null as any, error: e };
  }
};

const presentPaywall = async (placementId?: string) => {
  if (!PurchasesUI || !PurchasesUI.presentPaywall)
    return { success: false, customerInfo: null as any };
  try {
    const result = await PurchasesUI.presentPaywall({
      placementId: placementId ?? "default",
    });
    return { success: true, customerInfo: result?.customerInfo ?? null };
  } catch (e: any) {
    return { success: false, customerInfo: null as any, error: e };
  }
};

const presentCustomerCenter = async () => {
  if (!PurchasesUI || !PurchasesUI.presentCustomerCenter)
    return { success: false };
  try {
    await PurchasesUI.presentCustomerCenter();
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e };
  }
};

const restorePurchases = async () => {
  if (!Purchases) return { success: false, customerInfo: null as any };
  try {
    const info = await Purchases.restorePurchases();
    return { success: true, customerInfo: info };
  } catch (e: any) {
    return { success: false, customerInfo: null as any, error: e };
  }
};

const getCustomerInfo = async (): Promise<RevenueCatCustomerInfo | null> => {
  if (!Purchases) return null;
  try {
    const info = await Purchases.getCustomerInfo();
    return info;
  } catch {
    return null;
  }
};

/**
 * Packages from the current offering that map to a known guest pack, ordered
 * smallest to largest. Anything unrecognised is dropped rather than shown with
 * an unknown guest count.
 */
const getGuestPacks = async () => {
  const offerings = await getOfferings();
  const packages = offerings?.current?.availablePackages ?? [];

  return packages
    .filter((pkg: any) => pkg?.identifier in GUEST_PACKS)
    .map((pkg: any) => ({
      pkg,
      lookupKey: pkg.identifier as string,
      guests: GUEST_PACKS[pkg.identifier],
      priceString: pkg?.product?.priceString ?? "",
    }))
    .sort(
      (a: any, b: any) =>
        PACK_ORDER.indexOf(a.lookupKey) - PACK_ORDER.indexOf(b.lookupKey),
    );
};

/**
 * Buys a guest pack for a specific event. On success the RevenueCat webhook
 * credits the slots to that event server-side, so callers must refetch the
 * event to see the new limit — the returned customerInfo will NOT contain the
 * entitlement (consumable).
 *
 * `eventId` is attached as the `everly_event_id` subscriber attribute so the
 * webhook knows which event to credit. Without it the purchase lands
 * `unattributed` on the backend and no slots are granted — so it is required.
 */
const purchaseGuestPack = async (
  pkg: RevenueCatPackage,
  eventId: string | number,
) => {
  if (!Purchases) return { success: false, customerInfo: null as any };
  if (eventId == null || eventId === "") {
    console.warn(
      "[RevenueCat] purchaseGuestPack called without an eventId — the webhook cannot attribute this purchase. Aborting.",
    );
    return { success: false, customerInfo: null as any };
  }
  try {
    // Must be set BEFORE the purchase so the transaction carries the attribute.
    await Purchases.setAttributes({ everly_event_id: String(eventId) });
  } catch (e) {
    console.warn("[RevenueCat] Failed to set everly_event_id attribute", e);
  }
  const res = await purchasePackage(pkg);
  if (!res.success) return res;
  return { ...res, needsEventRefetch: true };
};

/**
 * Only meaningful for non-consumable / subscription entitlements. Guest packs
 * are consumables and will never appear here — use `Event.participant_limit`
 * from the API instead. Kept for future subscription products.
 */
const hasActiveEntitlement = (
  info: any,
  entitlementId: string = ENTITLEMENT_ID,
) => {
  if (!info || !info.entitlements || !info.entitlements.active) return false;
  const active = info.entitlements.active[entitlementId];
  return !!active;
};

// ── Premium subscription (offering "premium", entitlement "premium") ─────────
// Separate from the guest packs, which stay in the current `default` offering
// and are sold as a one-off upsell on top of the subscription.
const PREMIUM_OFFERING_ID = "premium";

const isReady = () => !!Purchases;

/** True only once `configure()` actually ran with an API key. A hard paywall
 *  must never go up without it: no plan could load, so the wall would leave
 *  nothing on screen that works (dev builds without .env.local, Expo Go). */
const isConfigured = async (): Promise<boolean> => {
  if (!Purchases) return false;
  try {
    return !!(await Purchases.isConfigured?.());
  } catch {
    return false;
  }
};

const getPremiumPackages = async (): Promise<RevenueCatPackage[]> => {
  if (!Purchases) return [];
  try {
    const offerings = await Purchases.getOfferings();
    return offerings?.all?.[PREMIUM_OFFERING_ID]?.availablePackages ?? [];
  } catch (e) {
    console.warn("[RevenueCat] getPremiumPackages failed", e);
    return [];
  }
};

/**
 * Subscriber attributes (e.g. ob_source from the plan wizard), so a purchase
 * in RevenueCat can be traced back to where the couple heard about Everly.
 * No-op when the SDK is missing or not configured yet.
 */
const setAttributes = async (attributes: Record<string, string | null>) => {
  if (!Purchases) return;
  try {
    if (!(await Purchases.isConfigured?.())) return;
    await Purchases.setAttributes(attributes);
  } catch (e) {
    console.warn("[RevenueCat] setAttributes failed", e);
  }
};

const addCustomerInfoUpdateListener = (listener: (info: any) => void) => {
  if (!Purchases) return () => {};
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases?.removeCustomerInfoUpdateListener?.(listener);
};

const removeCustomerInfoUpdateListener = (listener: (info: any) => void) => {
  if (!Purchases) return;
  Purchases.removeCustomerInfoUpdateListener(listener);
};

export const revenueCat = {
  configure,
  isReady,
  isConfigured,
  getPremiumPackages,
  setAttributes,
  addCustomerInfoUpdateListener,
  removeCustomerInfoUpdateListener,
  logIn,
  logOut,
  linkAppsFlyer,
  setLogLevel,
  getOfferings,
  purchasePackage,
  presentPaywall,
  presentCustomerCenter,
  restorePurchases,
  getCustomerInfo,
  getGuestPacks,
  purchaseGuestPack,
  hasActiveEntitlement,
  ENTITLEMENT_ID,
  GUEST_PACKS,
};
