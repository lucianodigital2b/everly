import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { SectionHeading } from './SectionHeading';
import { PressableScale } from './PressableScale';
import type { PlannerData } from '../../hooks/usePlanner';
import { colors } from '../../constants/colors';
import { cardSurface } from '../../constants/cardSurface';
import { typography } from '../../constants/typography';
import { t } from '../../i18n';

type Props = {
  planner: PlannerData;
};

export function WhatsLeft({ planner }: Props) {
  const router = useRouter();

  const rows = planner.phases
    .filter((p) => p.tasks.some((t) => t.state === 'pending'))
    .map((p) => ({
      phase: p.phase,
      pending: p.tasks.filter((t) => t.state === 'pending').length,
      deadlineLabel: p.deadlineLabel,
    }))
    .sort((a, b) => a.phase.dueDays - b.phase.dueDays)
    .slice(0, 4);

  if (rows.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeading title={t('whatsLeft.title')} />
      <View style={styles.card}>
        {rows.map((row, index) => (
          <React.Fragment key={row.phase.id}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <PressableScale
              onPress={() => router.push('/(tabs)/plan')}
              style={styles.row}
            >
              <View style={styles.rowText}>
                <Text style={styles.phaseTitle} numberOfLines={1}>
                  {row.phase.title}
                </Text>
                <Text style={styles.deadline}>{row.deadlineLabel}</Text>
              </View>
              <View style={styles.countPill}>
                <Text style={styles.countText}>
                  {t('whatsLeft.itemsLeft', { count: row.pending })}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textTertiary} />
            </PressableScale>
          </React.Fragment>
        ))}
      </View>

      <PressableScale
        onPress={() => router.push('/(tabs)/plan')}
        style={styles.seeAll}
      >
        <Text style={styles.seeAllText}>{t('whatsLeft.seeFullPlan')}</Text>
        <ChevronRight size={18} color={colors.accentDeep} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  card: {
    ...cardSurface,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    minHeight: 56,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 48,
  },
  rowText: {
    flex: 1,
  },
  phaseTitle: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  deadline: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  countPill: {
    backgroundColor: colors.surface2,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.accentDeep,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: colors.accentBright,
    paddingHorizontal: 20,
  },
  seeAllText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.accentDeep,
  },
});
