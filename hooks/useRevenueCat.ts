import { useEffect, useState, useCallback } from 'react';
import { revenueCat } from '../services/revenuecat';

type RCInfo = any;
type RCOfferings = any;

export const useRevenueCat = () => {
  const [customerInfo, setCustomerInfo] = useState<RCInfo | null>(null);
  const [offerings, setOfferings] = useState<RCOfferings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await revenueCat.configure();
      revenueCat.setLogLevel('info');
      const [info, offs] = await Promise.all([revenueCat.getCustomerInfo(), revenueCat.getOfferings()]);
      setCustomerInfo(info);
      setOfferings(offs);
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const presentPaywall = useCallback(async (placementId?: string) => {
    const res = await revenueCat.presentPaywall(placementId);
    if (res?.customerInfo) setCustomerInfo(res.customerInfo);
    return res;
  }, []);

  const openCustomerCenter = useCallback(async () => {
    return revenueCat.presentCustomerCenter();
  }, []);

  const restore = useCallback(async () => {
    const res = await revenueCat.restorePurchases();
    if (res?.customerInfo) setCustomerInfo(res.customerInfo);
    return res;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isPro = revenueCat.hasActiveEntitlement(customerInfo, revenueCat.ENTITLEMENT_ID);

  return {
    isPro,
    customerInfo,
    offerings,
    loading,
    error,
    refresh,
    presentPaywall,
    openCustomerCenter,
    restore,
  };
};
