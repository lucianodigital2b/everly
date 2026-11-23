import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { usePathname } from 'expo-router';

import { revenueCat } from '../services/revenuecat';
import { hasActiveEntitlement, presentPaywall } from '../services/paywall';
import { usePlannerStore } from '../zustand/planner';

const PREMIUM_ENTITLEMENT_ID = 'premium';

/**
 * NOT MOUNTED (17/11/2026): Everly runs a soft paywall for now, opened once
 * when the Plan tab's setup wizard commits (`app/(tabs)/plan.tsx`). To go
 * hard, call this hook in `app/(tabs)/_layout.tsx`.
 *
 * Hard paywall at the end of onboarding, ported from Bebê Enxoval. Mounted in
 * the tabs layout, so it only ever runs for a signed-in couple: guests who
 * join an event by QR never reach the tabs and never see it.
 *
 * Onboarding ends when the Plan tab's setup wizard commits (it sets the
 * wedding date) or setup was skipped. From then on, every customer without
 * the `premium` entitlement gets the paywall in hard mode, re-checked on every
 * return to the tabs (a purchase that closes the paywall lets them in, nothing
 * else does), whenever RevenueCat reports a change, and when the app comes
 * back to the foreground (a subscription that lapsed in the background locks
 * again).
 *
 * Never goes up when RevenueCat isn't configured (no API key in this build):
 * no plan could load, so the wall would leave nothing on screen that works.
 */
export function useHardPaywallGate() {
  const pathname = usePathname();
  const onboarded = usePlannerStore((s) => !!s.weddingDate || s.setupSkipped);
  // Null until the first answer; a known subscriber is not re-asked on every
  // tab switch (that is how RevenueCat got hammered in DailyHair).
  const entitled = useRef<boolean | null>(null);
  const onboardedRef = useRef(onboarded);
  onboardedRef.current = onboarded;

  async function enforce(force: boolean) {
    if (!onboardedRef.current) return;
    if (!force && entitled.current === true) return;
    if (!(await revenueCat.isConfigured())) return;
    const ok = await hasActiveEntitlement();
    entitled.current = ok;
    if (!ok) presentPaywall('hard');
  }

  // Tab changes, and the moment the setup wizard finishes.
  useEffect(() => {
    if (pathname === '/paywall') return;
    enforce(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, onboarded]);

  useEffect(() => {
    const removeListener = revenueCat.addCustomerInfoUpdateListener((info: any) => {
      entitled.current = !!info?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID];
      if (!entitled.current && onboardedRef.current) enforce(true);
    });

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') enforce(true);
    });

    return () => {
      removeListener?.();
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
