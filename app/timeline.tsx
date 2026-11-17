import React, { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Check, Minus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '../components/BackButton';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { TASK_CATEGORY_LABEL } from '../data/weddingPlan';
import { usePlanner, type PhaseProgress } from '../hooks/usePlanner';
import { usePlannerStore } from '../zustand/planner';

type StatusFilter = 'todo' | 'done' | 'all';

export default function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const planner = usePlanner();
  const scrollRef = useRef<ScrollView>(null);
  const didInitialScroll = useRef(false);
  const blockPositionsRef = useRef<Record<string, number>>({});

  const toggleDone = usePlannerStore((state) => state.toggleDone);
  const skip = usePlannerStore((state) => state.skip);
  const undo = usePlannerStore((state) => state.undo);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todo');
  const [essentialsOnly, setEssentialsOnly] = useState(false);

  const pendingCount = planner ? planner.total - planner.doneCount : 0;
  const doneCount = planner?.doneCount ?? 0;
  const totalCount = planner?.total ?? 0;

  const filteredPhases = useMemo(() => {
    if (!planner) return [];
    return planner.phases.map((phase) => {
      let tasks = phase.tasks;
      if (essentialsOnly) {
        tasks = tasks.filter((entry) => entry.task.essential);
      }
      if (statusFilter === 'todo') {
        tasks = tasks.filter((entry) => entry.state === 'pending');
      } else if (statusFilter === 'done') {
        tasks = tasks.filter((entry) => entry.state !== 'pending');
      }
      return { ...phase, tasks };
    });
  }, [planner, statusFilter, essentialsOnly]);

  const handleCheck = (taskId: string, currentState: 'done' | 'skipped' | 'pending') => {
    void Haptics.selectionAsync();
    if (currentState === 'skipped') {
      undo(taskId);
    } else {
      toggleDone(taskId);
    }
  };

  const handleLongPress = (taskId: string, currentState: 'done' | 'skipped' | 'pending') => {
    void Haptics.selectionAsync();
    if (currentState === 'skipped') {
      undo(taskId);
    } else {
      skip(taskId);
    }
  };

  const goToPlan = () => {
    router.replace('/(tabs)/plan');
  };

  const jumpToPhase = (phaseId: string) => {
    const y = blockPositionsRef.current[phaseId];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y: y - 24, animated: true });
    }
  };

  if (!planner) {
    return (
      <View
        style={[
          styles.container,
          styles.emptyContainer,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <View style={styles.topBar}>
          <BackButton fallback="/(tabs)/plan" />
          <Text style={styles.headerTitle}>Timeline</Text>
          <View style={styles.topBarRight} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Set your wedding date first</Text>
          <Pressable style={styles.emptyButton} onPress={goToPlan}>
            <Text style={styles.emptyButtonText}>Go to plan</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* Header */}
        <View style={styles.topBar}>
          <BackButton fallback="/(tabs)/plan" />
          <Text style={styles.headerTitle}>Timeline</Text>
          <View style={styles.topBarRight} />
        </View>

        {/* Summary */}
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryText}>
            {`${planner.doneCount} of ${planner.total} done`}
            {planner.essentialsLeft > 0
              ? ` · ${planner.essentialsLeft} essentials left`
              : ''}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, Math.max(0, planner.percent))}%` },
              ]}
            />
          </View>
        </View>

        {/* Status filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <Pressable
            style={[
              styles.chip,
              statusFilter === 'todo' && styles.chipSelected,
            ]}
            onPress={() => setStatusFilter('todo')}
          >
            <Text
              style={[
                styles.chipText,
                statusFilter === 'todo' && styles.chipTextSelected,
              ]}
            >
              To do ({pendingCount})
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.chip,
              statusFilter === 'done' && styles.chipSelected,
            ]}
            onPress={() => setStatusFilter('done')}
          >
            <Text
              style={[
                styles.chipText,
                statusFilter === 'done' && styles.chipTextSelected,
              ]}
            >
              Done ({doneCount})
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.chip,
              statusFilter === 'all' && styles.chipSelected,
            ]}
            onPress={() => setStatusFilter('all')}
          >
            <Text
              style={[
                styles.chipText,
                statusFilter === 'all' && styles.chipTextSelected,
              ]}
            >
              All ({totalCount})
            </Text>
          </Pressable>
        </ScrollView>

        {/* Essentials toggle */}
        <Pressable
          style={[styles.essentialToggle, essentialsOnly && styles.essentialToggleOn]}
          onPress={() => setEssentialsOnly((v) => !v)}
        >
          <Text
            style={[
              styles.essentialToggleText,
              essentialsOnly && styles.essentialToggleTextOn,
            ]}
          >
            Essentials
          </Text>
        </Pressable>

        {/* Jump to chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.jumpRow}
        >
          {filteredPhases.map((phase) => {
            const isCurrent = phase.phase.id === planner.currentPhase;
            return (
              <Pressable
                key={phase.phase.id}
                style={[
                  styles.jumpChip,
                  isCurrent && styles.jumpChipCurrent,
                ]}
                onPress={() => jumpToPhase(phase.phase.id)}
              >
                {isCurrent ? <View style={styles.jumpDot} /> : null}
                <Text
                  style={[
                    styles.jumpChipText,
                    isCurrent && styles.jumpChipTextCurrent,
                  ]}
                >
                  {`${phase.phase.title} · ${phase.tasks.length}`}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Timeline */}
        {filteredPhases.map((phase, index) => {
          const pendingInPhase = phase.tasks.filter(
            (entry) => entry.state === 'pending',
          ).length;
          const nextEntry = planner.next
            ? phase.tasks.find((entry) => entry.task.id === planner.next!.id)
            : undefined;

          const dotStyle =
            phase.isCurrent
              ? styles.dotCurrent
              : phase.isPast && pendingInPhase === 0
                ? styles.dotPast
                : styles.dotFuture;

          return (
            <View
              key={phase.phase.id}
              style={styles.phaseRow}
              onLayout={(event) => {
                const y = event.nativeEvent.layout.y;
                blockPositionsRef.current[phase.phase.id] = y;
                if (
                  !didInitialScroll.current &&
                  phase.phase.id === planner.currentPhase
                ) {
                  didInitialScroll.current = true;
                  requestAnimationFrame(() => {
                    scrollRef.current?.scrollTo({
                      y: Math.max(0, y - 24),
                      animated: false,
                    });
                  });
                }
              }}
            >
              {/* Rail column */}
              <View style={styles.railColumn}>
                <View style={[styles.dot, dotStyle]} />
                {index < filteredPhases.length - 1 ? (
                  <View style={styles.railLine} />
                ) : null}
              </View>

              {/* Content */}
              <View style={styles.phaseContent}>
                <View style={styles.phaseHeader}>
                  <Text style={styles.phaseTitle}>{phase.phase.title}</Text>
                  {phase.isCurrent ? (
                    <View style={styles.nowPill}>
                      <Text style={styles.nowPillText}>Now</Text>
                    </View>
                  ) : null}
                  {phase.isPast && pendingInPhase > 0 ? (
                    <View style={styles.overduePill}>
                      <Text style={styles.overduePillText}>
                        {pendingInPhase} overdue
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.flex} />
                  <Text style={styles.deadlineLabel}>{phase.deadlineLabel}</Text>
                </View>
                <Text style={styles.phaseSubtitle}>{phase.phase.subtitle}</Text>

                {/* Card */}
                <View style={styles.card}>
                  {nextEntry ? (
                    <View style={styles.nextHighlight}>
                      <Text style={styles.nextEyebrow}>UP NEXT</Text>
                      <Text style={styles.nextTitle}>{nextEntry.task.title}</Text>
                      {nextEntry.task.category ? (
                        <View style={styles.categoryTag}>
                          <Text style={styles.categoryTagText}>
                            {TASK_CATEGORY_LABEL[nextEntry.task.category]}
                          </Text>
                        </View>
                      ) : null}
                      <View style={styles.nextActions}>
                        <Pressable
                          style={styles.nextButton}
                          onPress={() => {
                            void Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Medium,
                            );
                            toggleDone(nextEntry.task.id);
                          }}
                        >
                          <Text style={styles.nextButtonText}>Mark done</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.nextButton, styles.nextSkipButton]}
                          onPress={() => {
                            void Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Medium,
                            );
                            skip(nextEntry.task.id);
                          }}
                        >
                          <Text style={[styles.nextButtonText, styles.nextSkipText]}>
                            Skip
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  {phase.tasks.length === 0 ? (
                    <Text style={styles.emptyPhaseText}>
                      {statusFilter === 'todo' ? 'All done here' : 'Nothing here'}
                    </Text>
                  ) : (
                    phase.tasks
                      .filter((entry) => !nextEntry || entry.task.id !== nextEntry.task.id)
                      .map((entry) => (
                        <View key={entry.task.id} style={styles.taskRow}>
                          <Pressable
                            style={[
                              styles.checkButton,
                              entry.state === 'done' && styles.checkButtonDone,
                              entry.state === 'skipped' && styles.checkButtonSkipped,
                            ]}
                            onPress={() => handleCheck(entry.task.id, entry.state)}
                            onLongPress={() => handleLongPress(entry.task.id, entry.state)}
                            delayLongPress={300}
                          >
                            {entry.state === 'done' ? (
                              <Check size={16} color={colors.white} />
                            ) : entry.state === 'skipped' ? (
                              <Minus size={16} color={colors.white} />
                            ) : null}
                          </Pressable>
                          <Pressable
                            style={styles.taskBody}
                            onPress={() => router.push(`/task?id=${entry.task.id}`)}
                          >
                            <Text
                              style={[
                                styles.taskTitle,
                                entry.state !== 'pending' && styles.taskTitleMuted,
                              ]}
                              numberOfLines={2}
                            >
                              {entry.task.title}
                            </Text>
                            <View style={styles.taskMeta}>
                              {entry.task.category ? (
                                <View style={styles.categoryTag}>
                                  <Text style={styles.categoryTagText}>
                                    {TASK_CATEGORY_LABEL[entry.task.category]}
                                  </Text>
                                </View>
                              ) : null}
                              {entry.task.essential && entry.state === 'pending' ? (
                                <View style={styles.essentialTag}>
                                  <Text style={styles.essentialTagText}>
                                    Essential
                                  </Text>
                                </View>
                              ) : null}
                              {entry.task.action && entry.state === 'pending' ? (
                                <Pressable
                                  onPress={() =>
                                    router.push(entry.task.action!.route as any)
                                  }
                                >
                                  <Text style={styles.actionLink}>
                                    {entry.task.action.label}
                                  </Text>
                                </Pressable>
                              ) : null}
                            </View>
                            {entry.note ? (
                              <Text style={styles.taskNote} numberOfLines={1}>
                                {entry.note}
                              </Text>
                            ) : null}
                          </Pressable>
                        </View>
                      ))
                  )}
                </View>

                {/* Add task */}
                <Pressable
                  style={styles.addTaskButton}
                  onPress={() =>
                    router.push(`/task-new?phase=${phase.phase.id}` as any)
                  }
                >
                  <Text style={styles.addTaskText}>+ Add task</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  content: {
    paddingHorizontal: 20,
    gap: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
    backgroundColor: colors.backgroundPrimary,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  topBarRight: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  summaryBlock: {
    gap: 8,
  },
  summaryText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.accent,
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
  essentialToggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  essentialToggleOn: {
    backgroundColor: colors.accentBright,
    borderColor: colors.accentDeep,
  },
  essentialToggleText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  essentialToggleTextOn: {
    color: colors.accentDeep,
    fontFamily: typography.fonts.semibold,
  },
  jumpRow: {
    gap: 8,
    paddingRight: 20,
  },
  jumpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jumpChipCurrent: {
    backgroundColor: colors.accentBright,
    borderColor: colors.accentDeep,
  },
  jumpDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentDeep,
  },
  jumpChipText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  jumpChipTextCurrent: {
    color: colors.accentDeep,
  },
  phaseRow: {
    flexDirection: 'row',
  },
  railColumn: {
    width: 28,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 8,
    zIndex: 1,
  },
  dotPast: {
    backgroundColor: colors.textTertiary,
  },
  dotCurrent: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 6,
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: colors.accentBright,
  },
  dotFuture: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  railLine: {
    position: 'absolute',
    top: 20,
    bottom: -8,
    width: 2,
    backgroundColor: colors.border,
  },
  phaseContent: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 24,
    gap: 4,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 28,
  },
  phaseTitle: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  nowPill: {
    backgroundColor: colors.accentBright,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  nowPillText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.accentDeep,
  },
  overduePill: {
    backgroundColor: 'rgba(208,138,131,0.14)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  overduePillText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.error,
  },
  flex: {
    flex: 1,
  },
  deadlineLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
  },
  phaseSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  card: {
    marginTop: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 0,
  },
  nextHighlight: {
    backgroundColor: colors.accentBright,
    borderRadius: 14,
    padding: 12,
    marginVertical: 8,
    gap: 8,
  },
  nextEyebrow: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    letterSpacing: 0.8,
    color: colors.accentDeep,
    textTransform: 'uppercase',
  },
  nextTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  nextActions: {
    flexDirection: 'row',
    gap: 8,
  },
  nextButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  nextSkipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accentDeep,
  },
  nextButtonText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textPrimary,
  },
  nextSkipText: {
    color: colors.accentDeep,
  },
  emptyPhaseText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: 12,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  checkButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  checkButtonDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkButtonSkipped: {
    backgroundColor: colors.textTertiary,
    borderColor: colors.textTertiary,
  },
  taskBody: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  taskTitleMuted: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: colors.surface2,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryTagText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  essentialTag: {
    backgroundColor: colors.accentBright,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  essentialTagText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.accentDeep,
  },
  actionLink: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.accentDeep,
  },
  taskNote: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
  },
  addTaskButton: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addTaskText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.accentDeep,
  },
  emptyContainer: {
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: colors.accent,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.button,
    color: colors.textPrimary,
  },
});
