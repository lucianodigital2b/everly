import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Lightbulb } from 'lucide-react-native';
import type { PlannerData } from '../../hooks/usePlanner';
import { colors } from '../../constants/colors';
import { CARD_RADIUS } from '../../constants/cardSurface';
import { typography } from '../../constants/typography';
import { t } from '../../i18n';

type Props = {
  planner: PlannerData;
};

const TIPS: { test: (p: PlannerData) => boolean; text: string }[] = [
  { test: (p) => p.monthsLeft >= 10, text: t('smartTip.tipVenue') },
  { test: (p) => p.monthsLeft >= 7, text: t('smartTip.tipVendors') },
  { test: (p) => p.monthsLeft >= 4, text: t('smartTip.tipInvitations') },
  { test: (p) => p.monthsLeft >= 2, text: t('smartTip.tipLicense') },
  { test: (p) => p.monthsLeft >= 1, text: t('smartTip.tipHeadcount') },
  { test: (p) => p.monthsLeft === 0 && p.daysLeft > 14, text: t('smartTip.tipTimeline') },
  { test: (p) => p.daysLeft <= 14 && p.daysLeft > 0, text: t('smartTip.tipEmergencyKit') },
  { test: (p) => p.daysLeft === 0, text: t('smartTip.tipEnjoy') },
];

export function SmartTip({ planner }: Props) {
  const tip = useMemo(() => {
    return TIPS.find((t) => t.test(planner))?.text ?? TIPS[0].text;
  }, [planner]);

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Lightbulb size={18} color={colors.accentDeep} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.eyebrow}>{t('smartTip.eyebrow')}</Text>
        <Text style={styles.text}>{tip}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.accentBright,
    borderRadius: CARD_RADIUS,
    borderCurve: 'continuous',
    padding: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.accentDeep,
  },
  text: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textPrimary,
    lineHeight: 18,
  },
});
