import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Trash2 } from 'lucide-react-native';
import { BackButton } from '../components/BackButton';
import { t } from '../i18n';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import {
  PHASES,
  TASK_CATEGORY_LABEL,
  phaseById,
  phaseDeadlineLabel,
} from '../data/weddingPlan';
import { findTask } from '../hooks/usePlanner';
import { usePlannerStore } from '../zustand/planner';
import {
  budgetSummary,
  compactUsd,
  formatUsd,
  useBudgetStore,
} from '../zustand/budget';

export default function TaskScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const taskId = Array.isArray(params.id) ? params.id[0] : params.id;

  const weddingDate = usePlannerStore((state) => state.weddingDate);
  const marks = usePlannerStore((state) => state.marks);
  const notes = usePlannerStore((state) => state.notes);
  const customTasks = usePlannerStore((state) => state.customTasks);
  const toggleDone = usePlannerStore((state) => state.toggleDone);
  const skip = usePlannerStore((state) => state.skip);
  const undo = usePlannerStore((state) => state.undo);
  const setNote = usePlannerStore((state) => state.setNote);
  const updateCustomTask = usePlannerStore((state) => state.updateCustomTask);
  const removeCustomTask = usePlannerStore((state) => state.removeCustomTask);

  const budgetState = useBudgetStore();
  const summary = useMemo(() => budgetSummary(budgetState), [budgetState]);

  const task = useMemo(
    () => (taskId ? findTask(taskId, customTasks) : null),
    [taskId, customTasks],
  );

  const [noteDraft, setNoteDraft] = useState('');
  const [titleDraft, setTitleDraft] = useState('');

  const taskExpenses = useMemo(
    () => (task ? budgetState.expenses.filter((expense) => expense.taskId === task.id) : []),
    [budgetState.expenses, task],
  );

  // Seed the drafts once per task; re-seeding on every note change would fight
  // the user's typing (setNote drops whitespace-only notes).
  useEffect(() => {
    setNoteDraft(task ? notes[task.id] ?? '' : '');
    setTitleDraft(task?.title ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  if (!task) {
    return (
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <BackButton fallback="/(tabs)/plan" />
          <Text style={styles.headerTitle}>{t('task.headerTitle')}</Text>
          <View style={styles.topBarRight} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t('task.notFound')}</Text>
        </View>
      </View>
    );
  }

  const mark = marks[task.id];
  const phase = phaseById(task.phase);
  const deadlineLabel = weddingDate
    ? phaseDeadlineLabel(weddingDate, phase)
    : '';

  const handleToggleDone = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleDone(task.id);
  };

  const handleSkip = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (mark?.state === 'skipped') {
      undo(task.id);
    } else {
      skip(task.id);
    }
  };

  const handleTitleBlur = () => {
    const trimmed = titleDraft.trim();
    if (task.custom && trimmed && trimmed !== task.title) {
      updateCustomTask(task.id, { title: trimmed });
    }
  };

  const handleRemove = () => {
    Alert.alert(t('task.removeAlert.title'), t('task.removeAlert.message'), [
      { text: t('task.removeAlert.cancel'), style: 'cancel' },
      {
        text: t('task.removeAlert.remove'),
        style: 'destructive',
        onPress: () => {
          removeCustomTask(task.id);
          router.back();
        },
      },
    ]);
  };

  const allocated =
    task.budgetCategoryId && budgetState.total !== null
      ? summary.byCategory.find(
          (line) => line.category.id === task.budgetCategoryId,
        )?.allocated
      : undefined;

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <BackButton fallback="/(tabs)/plan" />
        <Text style={styles.headerTitle}>{t('task.headerTitle')}</Text>
        <View style={styles.topBarRight}>
          {task.custom ? (
            <Pressable onPress={handleRemove} hitSlop={8}>
              <Trash2 color={colors.error} size={20} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{TASK_CATEGORY_LABEL[task.category]}</Text>
          </View>
          {task.essential ? (
            <View style={[styles.pill, styles.essentialPill]}>
              <Text style={[styles.pillText, styles.essentialText]}>{t('task.essential')}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.title}>{task.title}</Text>

        {weddingDate ? (
          <Text style={styles.deadlineLine}>
            {deadlineLabel} · {phase.title}
          </Text>
        ) : null}

        <View style={styles.statusRow}>
          <Pressable
            style={[
              styles.statusButton,
              mark?.state === 'done' && styles.statusButtonDone,
            ]}
            onPress={handleToggleDone}
          >
            <Text
              style={[
                styles.statusButtonText,
                mark?.state === 'done' && styles.statusButtonTextDone,
              ]}
            >
              {mark?.state === 'done' ? t('task.status.done') : t('task.status.markDone')}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.statusButton,
              mark?.state === 'skipped' && styles.statusButtonSkipped,
            ]}
            onPress={handleSkip}
          >
            <Text
              style={[
                styles.statusButtonText,
                mark?.state === 'skipped' && styles.statusButtonTextSkipped,
              ]}
            >
              {mark?.state === 'skipped' ? t('task.status.unskip') : t('task.status.skip')}
            </Text>
          </Pressable>
        </View>

        {task.action ? (
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push(task.action!.route as any)}
          >
            <Text style={styles.primaryButtonText}>{task.action.label}</Text>
          </Pressable>
        ) : null}

        {task.tip ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('task.tip')}</Text>
            <Text style={styles.tipText}>{task.tip}</Text>
          </View>
        ) : null}

        {task.custom ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('task.custom.taskTitle')}</Text>
            <TextInput
              style={styles.input}
              value={titleDraft}
              onChangeText={setTitleDraft}
              onBlur={handleTitleBlur}
              placeholder={t('task.custom.taskTitlePlaceholder')}
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.cardLabel}>{t('task.custom.phase')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {PHASES.map((phaseOption) => {
                const selected = phaseOption.id === task.phase;
                return (
                  <Pressable
                    key={phaseOption.id}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() =>
                      updateCustomTask(task.id, { phase: phaseOption.id })
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {phaseOption.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('task.notes')}</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={noteDraft}
            onChangeText={(text) => {
              setNoteDraft(text);
              setNote(task.id, text);
            }}
            placeholder={t('task.notesPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            multiline
          />
        </View>

        {task.budgetCategoryId || taskExpenses.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('task.costs.title')}</Text>
            {allocated !== undefined ? (
              <Text style={styles.allocatedText}>
                {t('task.costs.planned', { amount: compactUsd(allocated) })}
              </Text>
            ) : null}
            {taskExpenses.map((expense) => (
              <Pressable
                key={expense.id}
                style={styles.expenseRow}
                onPress={() => router.push(`/expense-edit?id=${expense.id}` as any)}
              >
                <Text style={styles.expenseLabel}>{expense.label}</Text>
                <Text style={styles.expenseAmount}>
                  {t('task.costs.expenseAmount', {
                    estimated: formatUsd(expense.estimated),
                    paid: formatUsd(expense.paid),
                  })}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.addCostButton}
              onPress={() =>
                router.push(
                  `/expense-edit?categoryId=${task.budgetCategoryId ?? 'other'}&label=${encodeURIComponent(
                    task.title,
                  )}&taskId=${task.id}` as any,
                )
              }
            >
              <Text style={styles.addCostText}>{t('task.costs.addCost')}</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: colors.backgroundPrimary,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.fonts.title,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  topBarRight: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: typography.fonts.title,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  essentialPill: {
    backgroundColor: colors.accentBright,
    borderColor: colors.accentBright,
  },
  pillText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  essentialText: {
    color: colors.accentDeep,
    fontFamily: typography.fonts.semibold,
  },
  title: {
    fontFamily: typography.fonts.title,
    fontSize: 28,
    lineHeight: 34,
    color: colors.textPrimary,
  },
  deadlineLine: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusButtonDone: {
    backgroundColor: colors.accentBright,
    borderColor: colors.accentDeep,
  },
  statusButtonSkipped: {
    backgroundColor: colors.surface2,
    borderColor: colors.textTertiary,
  },
  statusButtonText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  statusButtonTextDone: {
    color: colors.accentDeep,
  },
  statusButtonTextSkipped: {
    color: colors.textSecondary,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.accentDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.button,
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
    gap: 12,
  },
  cardLabel: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tipText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  noteInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  chipRow: {
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.accentDeep,
    borderColor: colors.accentDeep,
  },
  chipText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.white,
  },
  allocatedText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  expenseLabel: {
    flex: 1,
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  expenseAmount: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  addCostButton: {
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: colors.surface2,
  },
  addCostText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.accentDeep,
  },
});
