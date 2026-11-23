import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { SectionHeading } from './SectionHeading';
import { PressableScale } from './PressableScale';
import { StackedBar } from './StackedBar';
import { useBudgetStore, budgetSummary, formatUsd, compactUsd } from '../../zustand/budget';
import { usePremium } from '../../hooks/usePremium';
import { colors } from '../../constants/colors';
import { cardSurface } from '../../constants/cardSurface';
import { typography } from '../../constants/typography';
import { t } from '../../i18n';

type LegendItemProps = {
  color: string;
  label: string;
};

function LegendItem({ color, label }: LegendItemProps) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function BudgetCard() {
  const router = useRouter();
  const premium = usePremium();
  const expenses = useBudgetStore((state) => state.expenses);
  const categories = useBudgetStore((state) => state.categories);
  const total = useBudgetStore((state) => state.total);
  const summary = useMemo(
    () => budgetSummary({ total, categories, expenses }),
    [total, categories, expenses],
  );

  const isPremium = premium === true;
  const handlePress = () => router.push('/budget');

  if (!isPremium) {
    return (
      <View style={styles.section}>
        <SectionHeading
          title={t('budgetCard.title')}
          rightText={t('budgetCard.premium')}
          onRightPress={handlePress}
        />
        <PressableScale onPress={handlePress} style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.amountBlock}>
              <Text style={styles.label}>{t('budgetCard.label')}</Text>
              <Text style={[styles.bigNumber, styles.muted]}>—</Text>
            </View>
            <View style={styles.premiumPill}>
              <Lock size={12} color={colors.accentDeep} />
              <Text style={styles.premiumText}>{t('budgetCard.premium')}</Text>
            </View>
          </View>

          <View style={styles.fadedBar}>
            <StackedBar
              height={10}
              trackColor={colors.surface2}
              segments={[
                { value: 57, color: colors.accentDeep },
                { value: 28, color: colors.accent },
                { value: 15, color: colors.accentBright },
              ]}
            />
          </View>

          <Text style={styles.teaserLegend}>{t('budgetCard.unlockLegend')}</Text>
        </PressableScale>
      </View>
    );
  }

  if (total === null) {
    return (
      <View style={styles.section}>
        <SectionHeading
          title={t('budgetCard.title')}
          rightText={t('budgetCard.set')}
          onRightPress={handlePress}
        />
        <PressableScale onPress={handlePress} style={styles.card}>
          <Text style={styles.promptTitle}>{t('budgetCard.setTotalBudget')}</Text>
          <Text style={styles.promptSubtitle}>{t('budgetCard.planSpending')}</Text>
          <PressableScale onPress={handlePress} style={styles.setBudgetButton}>
            <Text style={styles.setBudgetText}>{t('budgetCard.setBudget')}</Text>
          </PressableScale>
        </PressableScale>
      </View>
    );
  }

  const estimated = summary.estimated;
  const paid = summary.paid;
  const pending = summary.pending;
  const over = estimated > total;
  const free = over ? 0 : Math.max(0, total - estimated);

  const allocatedPct = total > 0 ? Math.round((estimated / total) * 100) : 0;
  const paidPct = total > 0 ? Math.round((paid / total) * 100) : 0;
  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;
  const freePct = total > 0 ? Math.round((free / total) * 100) : 0;
  const overAmount = Math.max(0, estimated - total);
  const overAmountText = compactUsd(overAmount);

  const segments = over
    ? [
        { value: paid, color: colors.accentDeep },
        { value: pending, color: colors.accent },
      ]
    : [
        { value: paid, color: colors.accentDeep },
        { value: pending, color: colors.accent },
        { value: free, color: colors.accentBright },
      ];

  return (
    <View style={styles.section}>
      <SectionHeading
        title={t('budgetCard.title')}
        rightText={t('budgetCard.edit')}
        onRightPress={handlePress}
      />
      <PressableScale onPress={handlePress} style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.amountBlock}>
            <Text style={styles.label}>{t('budgetCard.label')}</Text>
            <Text style={styles.bigNumber} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {formatUsd(total)}
            </Text>
          </View>

          <View style={[styles.allocatedPill, over && styles.overPill]}>
            <Text style={[styles.allocatedText, over && styles.overPillText]}>
              {over
                ? t('budgetCard.overPill', { amount: overAmountText })
                : t('budgetCard.allocatedPill', { percent: allocatedPct })}
            </Text>
          </View>
        </View>

        <StackedBar height={10} trackColor={colors.surface2} segments={segments} />

        <View style={styles.legendRow}>
          {over ? (
            <LegendItem
              color={colors.error}
              label={t('budgetCard.overLegend', { amount: overAmountText })}
            />
          ) : (
            <>
              <LegendItem
                color={colors.accentDeep}
                label={t('budgetCard.legendPaid', { percent: paidPct })}
              />
              <LegendItem
                color={colors.accent}
                label={t('budgetCard.legendPending', { percent: pendingPct })}
              />
              <LegendItem
                color={colors.accentBright}
                label={t('budgetCard.legendFree', { percent: freePct })}
              />
            </>
          )}
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  card: {
    ...cardSurface,
    padding: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  amountBlock: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontFamily: typography.fonts.medium,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  bigNumber: {
    fontFamily: typography.fonts.title,
    fontSize: 30,
    lineHeight: 36,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  muted: {
    opacity: 0.45,
  },
  premiumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentBright,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  premiumText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    color: colors.accentDeep,
    letterSpacing: 0.5,
  },
  allocatedPill: {
    backgroundColor: colors.accentBright,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  allocatedText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.accentDeep,
  },
  overPill: {
    backgroundColor: colors.error,
  },
  overPillText: {
    color: colors.white,
  },
  fadedBar: {
    opacity: 0.55,
  },
  teaserLegend: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 10,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  promptTitle: {
    fontFamily: typography.fonts.title,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  promptSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  setBudgetButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 18,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  setBudgetText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.caption,
    color: colors.textPrimary,
  },
});
