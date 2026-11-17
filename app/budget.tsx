import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, G } from 'react-native-svg';
import { BackButton } from '../components/BackButton';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import {
  BUDGET_ITEM_SUGGESTIONS,
  budgetSummary,
  formatUsd,
  useBudgetStore,
  type Expense,
} from '../zustand/budget';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatMonthDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string | string[] }>();
  const tabParam = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const [activeTab, setActiveTab] = useState<'budget' | 'payments'>(
    tabParam === 'payments' ? 'payments' : 'budget',
  );

  const budgetState = useBudgetStore();
  const { total, categories, expenses, setTotal, markPaid } = budgetState;

  const [editingTotal, setEditingTotal] = useState(false);
  const [totalDraft, setTotalDraft] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [paidExpanded, setPaidExpanded] = useState(false);

  const summary = useMemo(() => budgetSummary(budgetState), [budgetState]);

  const chartSize = 200;
  const strokeWidth = 22;
  const radius = (chartSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const chartMax = Math.max(total ?? 0, summary.estimated) || 1;

  const chartArcs = useMemo(() => {
    let offset = 0;
    return summary.byCategory
      .filter((cat) => cat.estimated > 0)
      .map((cat) => {
        const arc = {
          id: cat.category.id,
          color: cat.category.color,
          length: (cat.estimated / chartMax) * circumference,
          offset,
        };
        offset += arc.length;
        return arc;
      });
  }, [summary.byCategory, chartMax, circumference]);

  const todayKey = toISODate(new Date());

  const pendingExpenses = useMemo(() => {
    return expenses
      .filter((expense) => expense.estimated - expense.paid > 0)
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [expenses]);

  const overdue = useMemo(
    () => pendingExpenses.filter((e) => e.dueDate && e.dueDate < todayKey),
    [pendingExpenses, todayKey],
  );
  const upcoming = useMemo(
    () => pendingExpenses.filter((e) => e.dueDate && e.dueDate >= todayKey),
    [pendingExpenses, todayKey],
  );
  const noDueDate = useMemo(
    () => pendingExpenses.filter((e) => !e.dueDate),
    [pendingExpenses],
  );
  const fullyPaid = useMemo(
    () => expenses.filter((e) => e.paid >= e.estimated),
    [expenses],
  );

  const handleSetInitialBudget = () => {
    const value = Number(totalDraft);
    if (!Number.isFinite(value) || value < 0) return;
    setTotal(value);
    setEditingTotal(false);
  };

  const handleSaveTotal = () => {
    const value = Number(totalDraft);
    if (!Number.isFinite(value) || value < 0) return;
    setTotal(value);
    setEditingTotal(false);
  };

  const handleOpenTotalEditor = () => {
    setTotalDraft(String(total ?? ''));
    setEditingTotal(true);
  };

  const renderExpenseRow = (expense: Expense) => {
    return (
      <Pressable
        key={expense.id}
        style={styles.expenseRow}
        onPress={() =>
          router.push({ pathname: '/expense-edit', params: { id: expense.id } })
        }
      >
        <Text style={styles.expenseLabel}>{expense.label}</Text>
        <Text style={styles.expenseAmounts}>
          {formatUsd(expense.estimated)} - Paid {formatUsd(expense.paid)}
        </Text>
      </Pressable>
    );
  };

  const renderPaymentRow = (expense: Expense) => {
    const category = categories.find((c) => c.id === expense.categoryId);
    const dueText = !expense.dueDate
      ? 'No due date'
      : expense.dueDate < todayKey
        ? `Overdue · ${formatMonthDay(expense.dueDate)}`
        : `Due ${formatMonthDay(expense.dueDate)}`;
    const isOverdue = !!expense.dueDate && expense.dueDate < todayKey;
    const left = expense.estimated - expense.paid;

    return (
      <Pressable
        key={expense.id}
        style={styles.paymentRow}
        onPress={() =>
          router.push({ pathname: '/expense-edit', params: { id: expense.id } })
        }
      >
        <View
          style={[styles.paymentDot, { backgroundColor: category?.color ?? colors.textTertiary }]}
        />
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentGroupLabel}>{expense.label}</Text>
          <Text style={[styles.paymentDue, isOverdue && styles.paymentOverdueText]}>
            {category?.name ?? 'Unknown'}{` · ${dueText}`}
          </Text>
        </View>
        <View style={styles.paymentAmountBox}>
          <Text style={styles.paymentGroupAmount}>{formatUsd(left)}</Text>
          <Pressable
            style={styles.markPaidButton}
            hitSlop={6}
            onPress={(event) => {
              event.stopPropagation?.();
              markPaid(expense.id);
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}
          >
            <Text style={styles.markPaidText}>Mark paid</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderSetupBudget = () => (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.setupCard}>
        <Text style={styles.cardTitle}>What&apos;s your total budget?</Text>
        <Text style={styles.cardSubtitle}>
          You can adjust this later as planning evolves.
        </Text>
        <TextInput
          style={styles.input}
          value={totalDraft}
          onChangeText={setTotalDraft}
          placeholder="$0"
          placeholderTextColor={colors.textTertiary}
          keyboardType="number-pad"
        />
        <Pressable
          style={[styles.primaryButton, !totalDraft.trim() && styles.primaryButtonDisabled]}
          disabled={!totalDraft.trim()}
          onPress={handleSetInitialBudget}
        >
          <Text style={styles.primaryButtonText}>Set budget</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  const renderBudget = () => {
    if (total === null) {
      return renderSetupBudget();
    }

    return (
      <>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.donutCard}>
            <View style={styles.donutWrapper}>
              <Svg width={chartSize} height={chartSize}>
                <G transform={`rotate(-90 ${chartSize / 2} ${chartSize / 2})`}>
                  <Circle
                    cx={chartSize / 2}
                    cy={chartSize / 2}
                    r={radius}
                    stroke={colors.surface2}
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
                  {chartArcs.map((arc) => (
                    <Circle
                      key={arc.id}
                      cx={chartSize / 2}
                      cy={chartSize / 2}
                      r={radius}
                      stroke={arc.color}
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeDasharray={`${arc.length} ${circumference - arc.length}`}
                      strokeDashoffset={-arc.offset}
                    />
                  ))}
                </G>
              </Svg>
              <View style={styles.donutCenter} pointerEvents="box-none">
                {editingTotal ? (
                  <View style={styles.centerEditBox}>
                    <TextInput
                      style={styles.centerInput}
                      value={totalDraft}
                      onChangeText={setTotalDraft}
                      placeholder="$0"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="number-pad"
                    />
                    <Pressable style={styles.centerSave} onPress={handleSaveTotal}>
                      <Text style={styles.centerSaveText}>Save</Text>
                    </Pressable>
                    <Pressable
                      style={styles.centerCancel}
                      onPress={() => setEditingTotal(false)}
                    >
                      <Text style={styles.centerCancelText}>Cancel</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable style={styles.centerPressable} onPress={handleOpenTotalEditor}>
                    <Text style={styles.remainingAmount}>
                      {formatUsd(summary.remaining)}
                    </Text>
                    <Text
                      style={[
                        styles.remainingLabel,
                        summary.remaining < 0 && styles.overBudgetLabel,
                      ]}
                    >
                      {summary.remaining < 0
                        ? 'over budget'
                        : `left of ${formatUsd(total)}`}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Estimated</Text>
                <Text style={styles.summaryValue}>{formatUsd(summary.estimated)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Paid</Text>
                <Text style={styles.summaryValue}>{formatUsd(summary.paid)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Pending</Text>
                <Text style={styles.summaryValue}>{formatUsd(summary.pending)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.legendSection}>
            {summary.byCategory.map((cat) => {
              const categoryExpenses = expenses.filter(
                (expense) => expense.categoryId === cat.category.id,
              );
              const expanded = expandedCategoryId === cat.category.id;
              const ratio =
                cat.allocated > 0 ? Math.min(cat.estimated / cat.allocated, 1) : 0;
              const overAllocated = cat.estimated > cat.allocated;
              const usedLabels = new Set(
                categoryExpenses.map((e) => e.label.trim().toLowerCase()),
              );
              const suggestions = (BUDGET_ITEM_SUGGESTIONS[cat.category.id] ?? []).filter(
                (s) => !usedLabels.has(s.toLowerCase()),
              );

              return (
                <View key={cat.category.id} style={styles.categoryCard}>
                  <Pressable
                    style={styles.categoryHeader}
                    onPress={() =>
                      setExpandedCategoryId(expanded ? null : cat.category.id)
                    }
                  >
                    <View
                      style={[styles.categoryDot, { backgroundColor: cat.category.color }]}
                    />
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{cat.category.name}</Text>
                      <Text style={styles.categoryAmounts}>
                        {formatUsd(cat.estimated)} estimated · {formatUsd(cat.allocated)} planned
                      </Text>
                    </View>
                    <Text style={styles.categoryChevron}>
                      {expanded ? '-' : '+'}
                    </Text>
                  </Pressable>

                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${ratio * 100}%`,
                          backgroundColor: overAllocated
                            ? colors.error
                            : cat.category.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.paidText}>Paid {formatUsd(cat.paid)}</Text>

                  {expanded ? (
                    <View style={styles.expenseList}>
                      {categoryExpenses.length === 0 ? (
                        <Text style={styles.emptyExpenses}>
                          No expenses in this category.
                        </Text>
                      ) : (
                        categoryExpenses.map((expense) => renderExpenseRow(expense))
                      )}

                      {suggestions.length > 0 ? (
                        <View style={styles.suggestionsSection}>
                          <Text style={styles.suggestionsTitle}>Suggestions</Text>
                          <View style={styles.suggestionsWrap}>
                            {suggestions.map((suggestion) => (
                              <Pressable
                                key={suggestion}
                                style={styles.suggestionChip}
                                onPress={() =>
                                  router.push({
                                    pathname: '/expense-edit',
                                    params: {
                                      categoryId: cat.category.id,
                                      label: suggestion,
                                    },
                                  })
                                }
                              >
                                <Text style={styles.suggestionChipText}>
                                  {suggestion}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>

        <Pressable
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          onPress={() => router.push({ pathname: '/expense-edit' })}
        >
          <Text style={styles.fabText}>+ Add expense</Text>
        </Pressable>
      </>
    );
  };

  const renderPayments = () => (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.paymentCardsRow}>
        <View style={styles.paymentCard}>
          <Text style={styles.paymentCardLabel}>Paid</Text>
          <Text style={styles.paymentCardValue}>{formatUsd(summary.paid)}</Text>
        </View>
        <View style={styles.paymentCard}>
          <Text style={styles.paymentCardLabel}>Still to pay</Text>
          <Text style={styles.paymentCardValue}>{formatUsd(summary.pending)}</Text>
        </View>
      </View>

      {expenses.length === 0 ? (
        <View style={styles.emptyPaymentsCard}>
          <Text style={styles.emptyPaymentsText}>
            No payments yet. Add costs with a due date to track them here.
          </Text>
        </View>
      ) : (
        <>
          {overdue.length > 0 ? (
            <View style={styles.paymentGroup}>
              <Text style={styles.paymentGroupTitle}>Overdue</Text>
              {overdue.map((expense) => renderPaymentRow(expense))}
            </View>
          ) : null}

          {upcoming.length > 0 ? (
            <View style={styles.paymentGroup}>
              <Text style={styles.paymentGroupTitle}>Upcoming</Text>
              {upcoming.map((expense) => renderPaymentRow(expense))}
            </View>
          ) : null}

          {noDueDate.length > 0 ? (
            <View style={styles.paymentGroup}>
              <Text style={styles.paymentGroupTitle}>No due date</Text>
              {noDueDate.map((expense) => renderPaymentRow(expense))}
            </View>
          ) : null}

          {fullyPaid.length > 0 ? (
            <View style={styles.paidSection}>
              <Pressable
                style={styles.paidSectionHeader}
                onPress={() => setPaidExpanded((v) => !v)}
              >
                <Text style={styles.paidSectionTitle}>
                  Paid in full ({fullyPaid.length})
                </Text>
                <Text style={styles.paidSectionChevron}>
                  {paidExpanded ? '-' : '+'}
                </Text>
              </Pressable>
              {paidExpanded
                ? fullyPaid.map((expense) => {
                    const category = categories.find(
                      (c) => c.id === expense.categoryId,
                    );
                    return (
                      <Pressable
                        key={expense.id}
                        style={styles.paymentRow}
                        onPress={() =>
                          router.push({
                            pathname: '/expense-edit',
                            params: { id: expense.id },
                          })
                        }
                      >
                        <View
                          style={[
                            styles.paymentDot,
                            { backgroundColor: category?.color ?? colors.textTertiary },
                          ]}
                        />
                        <View style={styles.paymentInfo}>
                          <Text style={styles.paymentGroupLabel}>{expense.label}</Text>
                          <Text style={styles.paymentDue}>
                            {category?.name ?? 'Unknown'} · Paid in full
                          </Text>
                        </View>
                        <Text style={styles.paymentGroupAmount}>
                          {formatUsd(expense.paid)}
                        </Text>
                      </Pressable>
                    );
                  })
                : null}
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <BackButton fallback="/(tabs)/plan" />
          <Text style={styles.title}>Budget</Text>
          <View style={styles.topBarRight} />
        </View>

        <View style={styles.segmentedControl}>
          <Pressable
            style={[styles.segment, activeTab === 'budget' && styles.segmentActive]}
            onPress={() => setActiveTab('budget')}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'budget' && styles.segmentTextActive,
              ]}
            >
              Budget
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segment, activeTab === 'payments' && styles.segmentActive]}
            onPress={() => setActiveTab('payments')}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'payments' && styles.segmentTextActive,
              ]}
            >
              Payments
            </Text>
          </Pressable>
        </View>

        {activeTab === 'budget' ? renderBudget() : renderPayments()}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  topBarRight: {
    width: 44,
    height: 44,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: colors.surface2,
    borderRadius: 18,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.backgroundSecondary,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.textPrimary,
    fontFamily: typography.fonts.bold,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  setupCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  input: {
    backgroundColor: colors.surface2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
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
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.button,
    color: colors.textPrimary,
  },
  donutCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  donutWrapper: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerEditBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  centerInput: {
    width: 110,
    textAlign: 'center',
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  centerSave: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 6,
  },
  centerSaveText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textPrimary,
  },
  centerCancel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  centerCancelText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  remainingAmount: {
    fontFamily: typography.fonts.extraBold,
    fontSize: typography.sizes.h2,
    color: colors.textPrimary,
  },
  remainingLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  overBudgetLabel: {
    color: colors.error,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignSelf: 'stretch',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
    marginTop: 4,
  },
  legendSection: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  categoryAmounts: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoryChevron: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.textSecondary,
  },
  barTrack: {
    height: 6,
    backgroundColor: colors.surface2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  paidText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  expenseList: {
    gap: 8,
    paddingTop: 8,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  expenseLabel: {
    flex: 1,
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    paddingRight: 8,
  },
  expenseAmounts: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  emptyExpenses: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
  },
  suggestionsSection: {
    gap: 8,
    marginTop: 4,
  },
  suggestionsTitle: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionChipText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textPrimary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    backgroundColor: colors.accent,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: colors.accentDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
  fabText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.button,
    color: colors.textPrimary,
  },
  paymentCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentCard: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  paymentCardLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  paymentCardValue: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
    marginTop: 6,
  },
  emptyPaymentsCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  emptyPaymentsText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  paymentGroup: {
    gap: 8,
  },
  paymentGroupTitle: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  paymentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentGroupLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  paymentDue: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  paymentOverdueText: {
    color: colors.error,
  },
  paymentAmountBox: {
    alignItems: 'flex-end',
    gap: 6,
  },
  paymentGroupAmount: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  markPaidButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markPaidText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textPrimary,
  },
  paidSection: {
    gap: 8,
  },
  paidSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  paidSectionTitle: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  paidSectionChevron: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.textSecondary,
  },
});
