import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import {
  type PurchasesPackage,
  PACKAGE_TYPE,
} from 'react-native-purchases';
import { colors as Colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { t, LOCALE_TAG } from '../../i18n';
import { PREMIUM_FEATURES } from '../../constants/premium';
import { TrialTimeline } from './TrialTimeline';
import { PlanCard } from './PlanCard';


type Props = {
  packages: PurchasesPackage[];
  selectedId: string | null;
  selected: PurchasesPackage | null;
  loading: boolean;
  onSelect: (pkg: PurchasesPackage) => void;
  getTrialDays: (pkg: PurchasesPackage) => number | null;
};

export function PaywallPlans({
  packages,
  selectedId,
  selected,
  loading,
  onSelect,
  getTrialDays,
}: Props) {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('paywallPlans.everlyPremium')}</Text>
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.accent} />
          <Text style={styles.loadingText}>{t('paywallPlans.loadingPlans')}</Text>
        </View>
      </View>
    );
  }

  const active =
    selected ??
    packages.find((p) => p.identifier === selectedId) ??
    packages[0] ??
    null;

  if (!active) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>{t('paywallPlans.loadFailed')}</Text>
      </View>
    );
  }

  const selectedTrial = getTrialDays(active);
  const annual = packages.find(
    (p) => p.packageType === PACKAGE_TYPE.ANNUAL,
  );
  const annualTrial = annual ? getTrialDays(annual) : null;
  const timelineDays = selectedTrial ?? annualTrial;
  const timelinePackage = selectedTrial ? active : annual ?? active;
  const timelinePrice = timelinePackage?.product.priceString ?? '';
  const timelineDate = timelineDays ? dateInDays(timelineDays) : '';

  const title = t('paywallPlans.everlyPremium');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {timelineDays ? (
        <TrialTimeline
          trialDays={timelineDays}
          price={timelinePrice}
          date={timelineDate}
        />
      ) : (
        <View style={styles.benefits}>
          {PREMIUM_FEATURES.map((feature) => (
            <View key={feature} style={styles.benefitRow}>
              <View style={styles.benefitCheck}>
                <Check size={14} color={Colors.textPrimary} strokeWidth={3} />
              </View>
              <Text style={styles.benefitText}>{feature}</Text>
            </View>
          ))}
        </View>
      )}

      <View accessibilityRole="radiogroup" style={styles.plansRow}>
        {packages.map((pkg) => (
          <PlanCard
            key={pkg.identifier}
            pkg={pkg}
            selected={pkg.identifier === active.identifier}
            onPress={() => onSelect(pkg)}
            getTrialDays={getTrialDays}
          />
        ))}
      </View>
    </View>
  );

  function dateInDays(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return new Intl.DateTimeFormat(LOCALE_TAG, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  }
}

const styles = StyleSheet.create({
  // Kept tight so the plan cards are on screen without scrolling on a 6.1"
  // phone: they are what this step sells.
  container: {
    gap: 16,
  },
  title: {
    fontFamily: typography.fonts.title,
    fontSize: typography.sizes.h2,
    lineHeight: 28,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  loading: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  benefits: {
    gap: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  benefitCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  benefitText: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    lineHeight: 20,
    color: Colors.textPrimary,
  },
  plansRow: {
    flexDirection: 'column',
    gap: 18,
    marginTop: 4,
  },
});
