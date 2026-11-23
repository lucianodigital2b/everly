import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import {
  type PurchasesPackage,
  PACKAGE_TYPE,
} from 'react-native-purchases';
import { colors as Colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { t, LOCALE_TAG } from '../../i18n';

type Props = {
  pkg: PurchasesPackage;
  selected: boolean;
  onPress: () => void;
  getTrialDays: (pkg: PurchasesPackage) => number | null;
};

export function PlanCard({ pkg, selected, onPress, getTrialDays }: Props) {
  const days = getTrialDays(pkg);
  const isAnnual = pkg.packageType === PACKAGE_TYPE.ANNUAL;

  const priceLabel = isAnnual
    ? t('planCard.priceYearly', { price: pkg.product.priceString })
    : t('planCard.priceMonthly', { price: pkg.product.priceString });

  const monthlyEquivalent = isAnnual
    ? t('planCard.monthlyEquivalent', {
        monthly: formatCurrency(pkg.product.price / 12, pkg.product.currencyCode),
      })
    : null;

  const title = isAnnual ? t('planCard.yearly') : t('planCard.monthly');

  const badge = days
    ? t('planCard.trialBadge', { count: days, days })
    : isAnnual
      ? t('planCard.bestPrice')
      : null;

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

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={[styles.card, selected && styles.cardSelected]}
    >
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge.toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.copy}>
        <Text style={[styles.title, selected && styles.textSelected]} numberOfLines={1}>
          {title}
        </Text>
        <Text
          style={[styles.price, selected && styles.textSelected]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {priceLabel}
        </Text>
        {monthlyEquivalent && (
          <Text style={styles.equivalent} numberOfLines={1}>
            {monthlyEquivalent}
          </Text>
        )}
      </View>

      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && (
          <Check size={14} color={Colors.white} strokeWidth={3} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 76,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.surface2,
  },
  badge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    zIndex: 1,
  },
  badgeText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: Colors.textPrimary,
    letterSpacing: 0.6,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.h3,
    color: Colors.textPrimary,
  },
  price: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.h2,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  equivalent: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  textSelected: {
    color: Colors.accentDeep,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: Colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
});
