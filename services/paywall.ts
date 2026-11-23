import { Platform } from 'react-native';
import { router } from 'expo-router';
import { revenueCat } from './revenuecat';

const PREMIUM_ENTITLEMENT_ID = 'premium';

/**
 * Paywall helpers: the single seam every caller goes through.
 *
 * The offer is `app/paywall.tsx`, a screen in this repo rather than
 * RevenueCat's hosted template, so that everything App Review guideline
 * 3.1.2(c) asks for lives in the binary and in version control: plan name and
 * exact duration, the price, what the subscriber receives, renewal terms and
 * working Terms/Privacy links.
 *
 * Whatever UI is active, the paywall comes before the account (asking to
 * register before a purchase gets rejected) and must never be shown to someone
 * who already owns the entitlement.
 */

export function isPurchasesConfigured(): boolean {
  return revenueCat.isReady();
}

/** True when the RevenueCat customer owns the premium entitlement. */
export async function hasActiveEntitlement(): Promise<boolean> {
  if (!isPurchasesConfigured()) return false;
  try {
    const info = await revenueCat.getCustomerInfo();
    return !!info?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID];
  } catch {
    return false;
  }
}

/** Re-reads purchases from the store. */
export async function restorePremiumPurchases(): Promise<boolean> {
  if (!isPurchasesConfigured()) return false;
  try {
    const res = await revenueCat.restorePurchases();
    return !!res?.customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID];
  } catch {
    return false;
  }
}

/** Loads the subscription packages from the `premium` offering. */
export function getPremiumPackages(): Promise<any[]> {
  return revenueCat.getPremiumPackages();
}

/** Purchases the given subscription package. */
export async function purchasePackage(pkg: any) {
  if (!isPurchasesConfigured()) {
    return { success: false, customerInfo: null };
  }
  return revenueCat.purchasePackage(pkg);
}

let paywallMounted = false;
let paywallClaimedAt = 0;

/** Called by the paywall screen on mount and unmount. */
export function setPaywallMounted(mounted: boolean): void {
  paywallMounted = mounted;
  if (!mounted) paywallClaimedAt = 0;
}

/**
 * Opens the subscription screen. `hard` has no close button and blocks
 * Android's back button: the only ways out are a purchase or a restore.
 * Refuses to stack a second paywall, so overlapping triggers are safe.
 */
export async function presentPaywall(mode: 'hard' | 'soft' = 'soft'): Promise<void> {
  if (paywallMounted || Date.now() - paywallClaimedAt < 2000) return;
  paywallClaimedAt = Date.now();
  router.push({ pathname: '/paywall', params: { mode } });
}

/** Opens it only for customers without the entitlement, and only when
 *  RevenueCat is configured in this build (otherwise no plan could load). */
export async function presentPaywallIfNotSubscribed(
  mode: 'hard' | 'soft' = 'soft',
): Promise<void> {
  if (!(await revenueCat.isConfigured())) return;
  if (await hasActiveEntitlement()) return;
  presentPaywall(mode);
}
