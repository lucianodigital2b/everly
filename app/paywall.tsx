/**
 * Subscription screen.
 *
 * A screen in the repo rather than RevenueCat's hosted template, so that
 * everything App Review guideline 3.1.2(c) requires lives in the binary: the
 * plan name, its exact duration, the price, what the subscriber receives, the
 * renewal terms in plain language, and working Terms / Privacy links.
 *
 * The first open after onboarding runs three steps: the intro ("we want you
 * to try it for free"), the trial reminder (the bell), then the plans. Later
 * opens (including the hard gate) start on the plans. A default plan without
 * a free trial skips the reminder: it would promise a reminder for a trial
 * that does not exist.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

// PermissionResponse (expo-modules-core) doesn't resolve for tsc here.
type Perm = { granted: boolean; canAskAgain: boolean };
import Animated, {
  FadeIn,
  FadeOut,
  useReducedMotion,
} from 'react-native-reanimated';
import { PACKAGE_TYPE, type PurchasesPackage } from 'react-native-purchases';
import { ChevronLeft, X } from 'lucide-react-native';

import { Button } from '../components/Button';
import { colors as Colors } from '../constants/colors';
import { typography } from '../constants/typography';
import {
  getPremiumPackages,
  purchasePackage,
  restorePremiumPurchases,
  setPaywallMounted,
} from '../services/paywall';
import { PaywallIntro } from '../components/paywall/PaywallIntro';
import { PaywallReminder } from '../components/paywall/PaywallReminder';
import { PaywallPlans } from '../components/paywall/PaywallPlans';
import { PaywallLinks } from '../components/paywall/PaywallLinks';
import { NoPaymentDue } from '../components/paywall/NoPaymentDue';
import { PriceLine } from '../components/paywall/PriceLine';
import { scheduleTrialReminder } from '../services/trialReminder';
import { t, LOCALE_TAG } from '../i18n';

/** The plans this screen sells, in display order. */
const PLAN_TYPES = [PACKAGE_TYPE.MONTHLY, PACKAGE_TYPE.ANNUAL];

/** Free-trial length in days, or null when the product has no free intro offer. */
function trialDays(pkg: PurchasesPackage): number | null {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const units = intro.periodNumberOfUnits;
  switch (intro.periodUnit) {
    case 'DAY':
      return units;
    case 'WEEK':
      return units * 7;
    case 'MONTH':
      return units * 30;
    case 'YEAR':
      return units * 365;
    default:
      return null;
  }
}

type Step = 0 | 1 | 2;

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { mode, source } = useLocalSearchParams<{ mode?: string; source?: string }>();
  // Never hard without a configured SDK: no plan can load, so a wall would
  // leave nothing on screen that works.
  const hard = mode === 'hard';
  const reducedMotion = useReducedMotion();

  // Persisted "intro seen" without an onboarding store. AsyncStorage is enough.
  const [introSeen, setIntroSeen] = useState<boolean | null>(null);
  const [initialStep, setInitialStep] = useState<Step>(() => 0); // will adjust after load
  const [step, setStep] = useState<Step>(0);

  const [packages, setPackages] = useState<PurchasesPackage[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState<null | 'purchase' | 'restore'>(null);
  const loadAttempt = useRef(0);

  useEffect(() => {
    setPaywallMounted(true);
    return () => setPaywallMounted(false);
  }, []);

  // Hard mode: Android's back button must not dismiss the wall either.
  useEffect(() => {
    if (!hard) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [hard]);

  useEffect(() => {
    // Load introSeen from AsyncStorage
    let cancelled = false;
    (async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const value = await AsyncStorage.getItem('paywall_intro_seen');
        if (!cancelled) {
          const seen = value === '1';
          setIntroSeen(seen);
          setInitialStep(seen ? 2 : 0);
          setStep(seen ? 2 : 0);
        }
      } catch (e) {
        console.warn('[Paywall] could not read intro flag', e);
        if (!cancelled) {
          setIntroSeen(false);
          setInitialStep(0);
          setStep(0);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (step === 2 && introSeen === false) {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.setItem('paywall_intro_seen', '1').catch(() => {});
      setIntroSeen(true);
    }
  }, [step, introSeen]);

  const loadOfferings = useCallback(async () => {
    loadAttempt.current += 1;
    setLoadFailed(false);
    setPackages(null);

    try {
      const all = await getPremiumPackages();
      const plans = PLAN_TYPES.flatMap((type) =>
        all.filter((p) => p.packageType === type),
      );
      if (plans.length === 0) {
        setLoadFailed(true);
        return;
      }
      setPackages(plans);
      setSelectedId(
        (plans.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ??
          plans[0]).identifier,
      );
    } catch (e: any) {
      console.error('[Paywall] getPremiumPackages failed', e);
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    if (introSeen === null) return; // wait for intro flag
    loadOfferings();
  }, [loadOfferings, introSeen]);

  const selected = useMemo(
    () => packages?.find((p) => p.identifier === selectedId) ?? null,
    [packages, selectedId],
  );
  const annual =
    packages?.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ?? null;
  const annualTrial = annual ? trialDays(annual) : null;
  const selectedTrial = selected ? trialDays(selected) : null;

  useEffect(() => {
    if (packages && step === 1 && !selectedTrial) setStep(2);
  }, [packages, selectedTrial, step]);

  function closeAfterSuccess() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  async function handlePurchase() {
    if (!selected || busy) return;
    setBusy('purchase');
    try {
      // services/revenuecat.ts never throws: a failure comes back as `error`.
      const result: any = await purchasePackage(selected);
      const entitled = !!result?.customerInfo?.entitlements?.active?.['premium'];
      if (entitled) {
        if (selectedTrial) {
          // The reminder the timeline promised. Fire and forget.
          scheduleTrialReminder({
            trialDays: selectedTrial,
            price: selected.product.priceString,
          });
        }
        closeAfterSuccess();
      } else if (!result?.error?.userCancelled) {
        if (result?.error) console.error('[Paywall] purchase failed', result.error);
        Alert.alert(
          t('paywall.purchaseFailedTitle'),
          t('paywall.purchaseFailedBody'),
        );
      }
    } catch (e: any) {
      console.error('[Paywall] purchase failed', e);
      Alert.alert(t('paywall.purchaseFailedTitle'), t('paywall.purchaseFailedBody'));
    } finally {
      setBusy(null);
    }
  }

  async function handleRestore() {
    if (busy) return;
    setBusy('restore');
    try {
      const restored = await restorePremiumPurchases();
      if (restored) {
        Alert.alert(
          t('paywall.restoredTitle'),
          t('paywall.restoredBody'),
          [{ text: t('paywall.ok'), onPress: closeAfterSuccess }],
        );
      } else {
        Alert.alert(t('paywall.nothingToRestoreTitle'), t('paywall.nothingToRestoreBody'));
      }
    } catch (e) {
      console.error('[Paywall] restore failed', e);
      Alert.alert(t('paywall.nothingToRestoreTitle'), t('paywall.restoreFailedBody'));
    } finally {
      setBusy(null);
    }
  }

  function formatCurrency(amount: number, currencyCode: string): string {
    try {
      return new Intl.NumberFormat(LOCALE_TAG, {
        style: 'currency',
        currency: currencyCode,
      }).format(amount);
    } catch {
      return `${amount}`;
    }
  }

  async function handleReminderPermission() {
    try {
      const perm = (await Notifications.getPermissionsAsync()) as Perm;
      if (!perm.granted && perm.canAskAgain) {
        await Notifications.requestPermissionsAsync();
      }
    } catch (e) {
      console.warn('[Paywall] reminder permission failed', e);
    }
  }

  function handleSelectPlan(pkg: PurchasesPackage) {
    if (pkg.identifier === selectedId) return;
    Haptics.selectionAsync();
    setSelectedId(pkg.identifier);
  }

  function goBack() {
    if (step === 2 && selectedTrial) setStep(1);
    else setStep(0);
  }

  async function handlePrimaryPress() {
    if (step === 0) {
      Haptics.selectionAsync();
      setStep(selectedTrial ? 1 : 2);
    } else if (step === 1) {
      await handleReminderPermission();
      setStep(2);
    } else {
      await handlePurchase();
    }
  }

  const priceLineText = useMemo(() => {
    if (!selected) return null;
    const price = selected.product.priceString;
    const period =
      selected.packageType === PACKAGE_TYPE.ANNUAL
        ? t('paywall.periodYear')
        : t('paywall.periodMonth');
    const days = selectedTrial;
    const monthly =
      selected.packageType === PACKAGE_TYPE.ANNUAL
        ? formatCurrency(selected.product.price / 12, selected.product.currencyCode)
        : null;

    if (days) {
      return monthly
        ? t('paywall.priceLineTrialMonthly', {
            count: days,
            days,
            price,
            period,
            monthly,
          })
        : t('paywall.priceLineTrial', {
            count: days,
            days,
            price,
            period,
          });
    }
    if (monthly) {
      return t('paywall.priceLineAnnualMonthly', { price, period, monthly });
    }
    return t('paywall.priceLine', { price, period });
  }, [selected, selectedTrial]);

  let ctaLabel = t('paywall.ctaContinue');
  if (step === 1) {
    ctaLabel = t('paywall.ctaContinueFree');
  } else if (step === 2 && selected) {
    if (selected.packageType === PACKAGE_TYPE.MONTHLY) {
      ctaLabel = t('paywall.ctaSubscribeMonthly', {
        price: selected.product.priceString,
      });
    } else if (selectedTrial) {
      ctaLabel = t('paywall.ctaStartTrial', {
        count: selectedTrial,
        days: selectedTrial,
      });
    } else {
      ctaLabel = t('paywall.ctaSubscribe');
    }
  }

  const hasPlans = !!packages && packages.length > 0;
  const loading = packages === null && !loadFailed;
  const showBack = step > initialStep;
  // The intro photo runs edge to edge up to the top of the screen, with the
  // close and restore buttons floating over it.
  const introBleed = step === 0 && !loadFailed && packages?.length !== 0;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8 },
          introBleed && styles.headerOverlay,
        ]}
      >
        <View style={styles.headerSide}>
          {showBack ? (
            <Pressable
              onPress={goBack}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('paywall.back')}
              style={styles.headerIconButton}
            >
              <ChevronLeft size={26} color={Colors.textPrimary} strokeWidth={1.5} />
            </Pressable>
          ) : step !== 2 && !hard ? (
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('paywall.close')}
              style={styles.headerIconButton}
            >
              <X size={26} color={Colors.textPrimary} strokeWidth={1.5} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.headerSide}>
          {step !== 2 ? (
            <Pressable
              onPress={handleRestore}
              disabled={busy === 'restore'}
              hitSlop={12}
              accessibilityRole="button"
              style={[styles.restorePressable, introBleed && styles.restoreOnPhoto]}
            >
              {busy === 'restore' ? (
                <ActivityIndicator size="small" color={Colors.accent} />
              ) : (
                <Text style={styles.restoreText}>{t('paywall.restore')}</Text>
              )}
            </Pressable>
          ) : (
            !hard && (
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={t('paywall.close')}
                style={styles.headerIconButton}
              >
                <X size={26} color={Colors.textPrimary} strokeWidth={1.5} />
              </Pressable>
            )
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, introBleed && styles.contentIntro]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
        {loadFailed ? (
          <View style={styles.stateBlock}>
            <Text style={styles.stateTitle}>{t('paywall.loadFailedTitle')}</Text>
            <Text style={styles.stateText}>{t('paywall.checkConnection')}</Text>
            <Button title={t('paywall.tryAgain')} variant="secondary" onPress={loadOfferings} />
          </View>
        ) : packages?.length === 0 ? (
          <View style={styles.stateBlock}>
            <Text style={styles.stateText}>{t('paywall.loadFailedBody')}</Text>
            <Button title={t('paywall.tryAgain')} variant="secondary" onPress={loadOfferings} />
          </View>
        ) : (
          <>
            {step === 0 && introSeen !== null && (
              <Animated.View
                key="intro"
                entering={reducedMotion ? undefined : FadeIn.duration(250)}
                exiting={reducedMotion ? undefined : FadeOut.duration(180)}
                style={styles.stepAnimated}
              >
                <PaywallIntro
                  titleFirst={t('paywall.introTitleFirst')}
                  titleSecond={t('paywall.introTitleSecond')}
                  subtitle={t('paywall.introSubtitle')}
                />
              </Animated.View>
            )}

            {step === 1 && packages !== null && (
              <Animated.View
                key="reminder"
                entering={reducedMotion ? undefined : FadeIn.duration(250)}
                exiting={reducedMotion ? undefined : FadeOut.duration(180)}
                style={styles.stepAnimated}
              >
                <PaywallReminder title={t('paywall.reminderTitle')} />
              </Animated.View>
            )}

            {step === 2 && (
              <Animated.View
                key="plans"
                entering={reducedMotion ? undefined : FadeIn.duration(250)}
                exiting={reducedMotion ? undefined : FadeOut.duration(180)}
                style={styles.stepAnimated}
              >
                <PaywallPlans
                  packages={packages ?? []}
                  selectedId={selectedId}
                  selected={selected}
                  loading={loading}
                  onSelect={handleSelectPlan}
                  getTrialDays={trialDays}
                />
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <NoPaymentDue
          visible={!!selectedTrial}
          label={t('paywall.noPaymentDue')}
        />
        <Button
          title={ctaLabel}
          onPress={handlePrimaryPress}
          isLoading={busy === 'purchase'}
          disabled={!selected || !!busy}
        />
        <PriceLine label={hasPlans ? priceLineText : null} loading={loading} />
        {step === 2 && (
          <PaywallLinks
            restoreLoading={busy === 'restore'}
            onRestore={handleRestore}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 12,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  headerSide: {
    minWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restorePressable: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  restoreOnPhoto: {
    backgroundColor: Colors.surface2,
    borderRadius: 22,
    paddingHorizontal: 16,
  },
  restoreText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: Colors.accentDeep,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 24,
  },
  contentIntro: {
    paddingTop: 0,
  },
  stateBlock: {
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  stateTitle: {
    fontFamily: typography.fonts.title,
    fontSize: typography.sizes.h2,
    color: Colors.textPrimary,
  },
  stateText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  stepAnimated: {
    width: '100%',
  },
  footer: {
    backgroundColor: Colors.backgroundPrimary,
    paddingTop: 8,
    paddingHorizontal: 24,
    gap: 8,
  },
});
