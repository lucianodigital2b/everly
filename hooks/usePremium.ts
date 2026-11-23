import { useEffect, useState } from 'react';
import { revenueCat } from '../services/revenuecat';

const PREMIUM_ENTITLEMENT_ID = 'premium';

/**
 * Whether the customer owns the premium entitlement, kept current as
 * RevenueCat reports changes. `null` while the first answer is on its way.
 */
export function usePremium(): boolean | null {
  const [premium, setPremium] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const checkEntitlement = async () => {
      const info = await revenueCat.getCustomerInfo();
      if (!cancelled) {
        setPremium(!!info?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID]);
      }
    };
    checkEntitlement();

    if (!revenueCat.isReady()) return () => { cancelled = true; };

    const listener = (info: any) => {
      if (!cancelled) {
        setPremium(!!info?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID]);
      }
    };
    const remove = revenueCat.addCustomerInfoUpdateListener(listener);
    return () => {
      cancelled = true;
      if (typeof remove === 'function') remove();
      else revenueCat.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  return premium;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function trialDaysLeft(info: any): number | null {
  const entitlement = info?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID];
  if (!entitlement || entitlement.periodType !== 'TRIAL' || !entitlement.expirationDate) return null;
  const left = new Date(entitlement.expirationDate).getTime() - Date.now();
  return left > 0 ? Math.max(1, Math.ceil(left / DAY_MS)) : null;
}

/**
 * Days left in the free trial (rounded up, at least 1), or null when not in a trial.
 */
export function useTrialDaysLeft(): number | null {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    if (!revenueCat.isReady()) return;
    let cancelled = false;
    const check = async () => {
      const info = await revenueCat.getCustomerInfo();
      if (!cancelled) setDays(trialDaysLeft(info));
    };
    check();

    const listener = (info: any) => {
      if (!cancelled) setDays(trialDaysLeft(info));
    };
    const remove = revenueCat.addCustomerInfoUpdateListener(listener);
    return () => {
      cancelled = true;
      if (typeof remove === 'function') remove();
      else revenueCat.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  return days;
}
