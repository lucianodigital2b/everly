import { useEffect, useState, useCallback } from 'react';
import { revenueCat } from '../services/revenuecat';
import { t } from '../i18n';

type RCInfo = any;
type RCOfferings = any;

export const useRevenueCat = () => {
  const [customerInfo, setCustomerInfo] = useState<RCInfo | null>(null);
  const [offerings, setOfferings] = useState<RCOfferings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [guestPacks, setGuestPacks] = useState<any[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await revenueCat.configure();
      revenueCat.setLogLevel('info');
      const [info, offs, packs] = await Promise.all([
        revenueCat.getCustomerInfo(),
        revenueCat.getOfferings(),
        revenueCat.getGuestPacks(),
      ]);
      setCustomerInfo(info);
      setOfferings(offs);
      setGuestPacks(packs);
    } catch (e: any) {
      setError(e?.message ?? t('revenueCat.unknownError'));
    } finally {
      setLoading(false);
    }
  }, []);

  const presentPaywall = useCallback(async (placementId?: string) => {
    const res = await revenueCat.presentPaywall(placementId);
    if (res?.customerInfo) setCustomerInfo(res.customerInfo);
    return res;
  }, []);

  /**
   * Guest packs are consumables — the slots are credited to the event by the
   * RevenueCat webhook, not by the SDK. Callers must refetch the event
   * (`eventsApi.show`) after this resolves to read the new participant_limit.
   */
  const purchaseGuestPack = useCallback(
    async (pkg: any, eventId: string | number) => {
      return revenueCat.purchaseGuestPack(pkg, eventId);
    },
    [],
  );

  /** Identify the signed-in user to RevenueCat (app_user_id = users.id). */
  const identifyUser = useCallback(async (userId: string | number) => {
    return revenueCat.logIn(userId);
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

  return {
    customerInfo,
    offerings,
    guestPacks,
    loading,
    error,
    refresh,
    presentPaywall,
    purchaseGuestPack,
    identifyUser,
    openCustomerCenter,
    restore,
  };
};
