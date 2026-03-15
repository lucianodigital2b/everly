import { Platform } from "react-native";

let Purchases: any = null as any;
let PurchasesUI: any = null as any;
try {
  Purchases = require("react-native-purchases").default;
} catch {}
try {
  PurchasesUI = require("react-native-purchases-ui");
} catch {}

const ENTITLEMENT_ID = "healthlyst_pro";

type InitOptions = {
  apiKey?: string;
  appUserID?: string | null;
};

export type RevenueCatOffering = any;
export type RevenueCatCustomerInfo = any;
export type RevenueCatPackage = any;

const getApiKeyForPlatform = (explicit?: string) => {
  if (explicit) return explicit;
  if (Platform.OS === "ios") return process.env.EXPO_PUBLIC_RC_IOS;
  if (Platform.OS === "android") return process.env.EXPO_PUBLIC_RC_ANDROID;
  return undefined;
};

const configure = async (opts?: InitOptions) => {
  if (!Purchases) return;
  const apiKey = getApiKeyForPlatform(opts?.apiKey);
  if (!apiKey) return;
  if (opts?.appUserID) {
    await Purchases.configure({ apiKey, appUserID: opts.appUserID });
  } else {
    await Purchases.configure({ apiKey });
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

const hasActiveEntitlement = (
  info: any,
  entitlementId: string = ENTITLEMENT_ID
) => {
  if (!info || !info.entitlements || !info.entitlements.active) return false;
  const active = info.entitlements.active[entitlementId];
  return !!active;
};

export const revenueCat = {
  configure,
  setLogLevel,
  getOfferings,
  purchasePackage,
  presentPaywall,
  presentCustomerCenter,
  restorePurchases,
  getCustomerInfo,
  hasActiveEntitlement,
  ENTITLEMENT_ID,
};
