import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Check, Lock } from 'lucide-react-native';

import { BackButton } from '../BackButton';
import { Button } from '../Button';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { PREMIUM_FEATURES } from '../../constants/premium';
import { usePremium } from '../../hooks/usePremium';
import { revenueCat } from '../../services/revenuecat';
import { presentPaywall } from '../../services/paywall';
import { t } from '../../i18n';

type Props = {
  /** Shown as the locked screen's title, e.g. "Guest list". */
  title: string;
  children: ReactNode;
};

/**
 * Renders a planner screen only for Premium subscribers. Everyone else gets a
 * locked page with a button that opens the (soft) paywall; the screen unlocks
 * on its own once the purchase lands, since usePremium listens to RevenueCat.
 *
 * Builds without RevenueCat configured (dev without .env.local) pass straight
 * through: nothing could be bought there, so a lock would only get in the way.
 */
export function PremiumOnly({ title, children }: Props) {
  const premium = usePremium();
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    revenueCat.isConfigured().then((ok) => {
      if (!cancelled) setConfigured(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (configured === false || premium === true) return <>{children}</>;
  if (configured === null || premium === null) return <Loading />;
  return <Locked title={title} />;
}

function Loading() {
  return (
    <View style={[styles.screen, styles.center]}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

function Locked({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <BackButton fallback="/(tabs)/plan" />
      </View>

      <View style={styles.body}>
        <View style={styles.lock}>
          <Lock size={28} color={colors.accentDeep} strokeWidth={2} />
        </View>
        <Text style={styles.title}>
          {t('premiumOnly.isPartOfPremium', { title })}
        </Text>
        <Text style={styles.subtitle}>
          {t('premiumOnly.subtitle')}
        </Text>
        <View style={styles.features}>
          {PREMIUM_FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <View style={styles.featureCheck}>
                <Check size={14} color={colors.textPrimary} strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button title={t('premiumOnly.seePlans')} onPress={() => presentPaywall('soft')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 14,
  },
  lock: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 6,
  },
  title: {
    fontFamily: typography.fonts.title,
    fontSize: typography.sizes.h2,
    lineHeight: 28,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  features: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  featureText: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
});
