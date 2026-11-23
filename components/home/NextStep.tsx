import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { PressableScale } from './PressableScale';
import type { PlannerData } from '../../hooks/usePlanner';
import { usePlannerStore } from '../../zustand/planner';
import { colors } from '../../constants/colors';
import { cardSurface } from '../../constants/cardSurface';
import { typography } from '../../constants/typography';
import { t } from '../../i18n';

type Props = {
  planner: PlannerData;
};

export function NextStep({ planner }: Props) {
  const router = useRouter();
  const toggleDone = usePlannerStore((s) => s.toggleDone);
  const next = planner.next;

  if (!next) return null;

  const phase = planner.phases.find((p) =>
    p.tasks.some((entry) => entry.task.id === next.id),
  );
  const deadlineLabel = phase?.deadlineLabel ?? '';

  const handlePress = () => router.push(`/task?id=${next.id}`);
  const handleActionPress = () => {
    if (next.action) {
      router.push(next.action.route as any);
    }
  };
  const handleMarkDone = () => {
    toggleDone(next.id);
  };

  return (
    <PressableScale onPress={handlePress} style={styles.card}>
      <Text style={styles.eyebrow}>{t('nextStep.upNext')}</Text>
      <Text style={styles.title}>{next.title}</Text>
      {deadlineLabel ? <Text style={styles.deadline}>{deadlineLabel}</Text> : null}
      {next.tip ? <Text style={styles.tip}>{next.tip}</Text> : null}

      <View style={styles.actionsRow}>
        {next.action && (
          <PressableScale onPress={handleActionPress} style={styles.actionButton}>
            <Text style={styles.actionText}>{next.action.label}</Text>
          </PressableScale>
        )}
        <PressableScale onPress={handleMarkDone} style={styles.markDone}>
          <Check size={16} color={colors.textPrimary} />
          <Text style={styles.markDoneText}>{t('nextStep.markDone')}</Text>
        </PressableScale>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSurface,
    padding: 18,
    gap: 10,
  },
  eyebrow: {
    fontFamily: typography.fonts.semibold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.accentDeep,
  },
  title: {
    fontFamily: typography.fonts.title,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  deadline: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  tip: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: colors.accent,
    borderRadius: 18,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  actionText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.caption,
    color: colors.textPrimary,
  },
  markDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  markDoneText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textPrimary,
  },
});
