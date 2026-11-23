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
import {
  Camera,
  Flower2,
  Gem,
  Landmark,
  Mail,
  MoreHorizontal,
  Music,
  Shirt,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react-native';
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
import { t, LOCALE_TAG } from '../i18n';
import { PremiumOnly } from '../components/paywall/PremiumOnly';
import { BudgetBar } from '../components/budget/BudgetBar';
import { DonutChart } from '../components/budget/DonutChart';
import { PressableScale } from '../components/home/PressableScale';

const MONTH_FORMATTER = new Intl.DateTimeFormat(LOCALE_TAG, { month: 'short' });

const TIGHT_COLOR = '#D9A35B';

type IconComponent = React.ComponentType<{
  color?: string;
  size?: number | string;
  strokeWidth?: number | string;
}>;

const CATEGORY_ICONS: Record<string, IconComponent> = {
  venue: Landmark,
  catering: UtensilsCrossed,
  photo: Camera,
  attire: Shirt,
  flowers: Flower2,
  music: Music,
  rings: Gem,
  paper: Mail,
  other: MoreHorizontal,
};

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatMonthDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTH_FORMATTER.format(new Date(y, m - 1, 1))} ${d}`;
}

function withAlpha(hex: string, alpha: string): string {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((char) => char + char)
          .join('')
      : clean;

  return /^[0-9A-Fa-f]{6}$/.test(full) ? `#${full}${alpha}` : hex;
}

function BudgetScreen() {
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
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(
    null,
  );
  const [paidExpanded, setPaidExpanded] = useState(false);

  const summary = useMemo(() => budgetSummary(budgetState), [budgetState]);

  const budgetStatus = useMemo(() => {
    if (total === null || total === 0) return null;

    if (summary.estimated > total) {
      return {
        text: t('budget.overBudget', {
          amount: formatUsd(summary.estimated - total),
        }),
        color: colors.error,
      };
    }

    if (summary.estimated >= total * 0.9) {
      return {
        text: t('budget.leftToPlan', {
          amount: formatUsd(total - summary.estimated),
        }),
        color: TIGHT_COLOR,
      };
    }

    return {
      text: `${formatUsd(total - summary.estimated)} left to plan`,
      color: colors.success,
    };
  }, [summary.estimated, total]);

  const isOverCap = total !== null && total > 0 && summary.estimated > total;

  const donutSlices = useMemo(
    () =>
      summary.byCategory
        .filter((cat) => cat.estimated > 0)
        .map((cat) => ({
          id: cat.category.id,
          value: cat.estimated,
          color: cat.category.color,
        })),
    [summary.byCategory],
  );

  const donutLegendSlices = useMemo(
    () => [...donutSlices].sort((a, b) => b.value - a.value),
    [donutSlices],
  );

  const donutTotal = summary.estimated;
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
      ? t('budget.noDueDate')
      : expense.dueDate < todayKey
        ? t('budget.overdueDate', {
            date: formatMonthDay(expense.dueDate),
          })
        : t('budget.dueDate', {
            date: formatMonthDay(expense.dueDate),
          });
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
          style={[
            styles.paymentDot,
            { backgroundColor: category?.color ?? colors.textTertiary },
          ]}
        />
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentGroupLabel}>{expense.label}</Text>
          <Text
            style={[styles.paymentDue, isOverdue && styles.paymentOverdueText]}
          >
            {t('budget.categoryDueText', {
              category: category?.name ?? t('budget.unknownCategory'),
              dueText,
            })}
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
            <Text style={styles.markPaidText}>{t('budget.markPaid')}</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderSetupBudget = () => (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 40 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.setupCard}>
        <Text style={styles.cardTitle}>{t('budget.setupTitle')}</Text>
        <Text style={styles.cardSubtitle}>
          {t('budget.setupSubtitle')}
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
          style={[
            styles.primaryButton,
            !totalDraft.trim() && styles.primaryButtonDisabled,
          ]}
          disabled={!totalDraft.trim()}
          onPress={handleSetInitialBudget}
        >
          <Text style={styles.primaryButtonText}>{t('budget.setBudget')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  const renderBudget = () => {
    if (total === null) {
      return renderSetupBudget();
    }

    const remainingDotColor = isOverCap ? colors.error : colors.accentBright;

    return (
      <>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 110 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <Text style={styles.eyebrow}>{t('budget.spent')}</Text>
              <PressableScale
                onPress={handleOpenTotalEditor}
                accessibilityRole="button"
                style={styles.editPill}
              >
                <Text style={styles.editPillText}>{t('budget.edit')}</Text>
              </PressableScale>
            </View>

            {editingTotal ? (
              <View style={styles.totalEditBox}>
                <TextInput
                  style={styles.input}
                  value={totalDraft}
                  onChangeText={setTotalDraft}
                  placeholder="$0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                />
                <View style={styles.editActions}>
                  <PressableScale
                    style={styles.saveButton}
                    onPress={handleSaveTotal}
                  >
                    <Text style={styles.saveButtonText}>{t('budget.save')}</Text>
                  </PressableScale>
                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => setEditingTotal(false)}
                  >
                    <Text style={styles.cancelButtonText}>{t('budget.cancel')}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <Text
                  style={styles.spentAmount}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                >
                  {formatUsd(summary.paid)}
                </Text>
                <Text style={styles.spentSubtitle}>
                  {t('budget.ofTotalBudget', {
                    amount: formatUsd(total),
                  })}
                </Text>
                <BudgetBar
                  paid={summary.paid}
                  planned={summary.estimated}
                  cap={total}
                  height={10}
                />
                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.dot, { backgroundColor: colors.accent }]}
                    />
                    <Text style={styles.legendText}>{t('budget.paid')}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: remainingDotColor },
                      ]}
                    />
                    <Text style={styles.legendText}>
                      {t('budget.stillToPayAmount', {
                        amount: formatUsd(summary.pending),
                      })}
                    </Text>
                  </View>
                </View>
                {budgetStatus ? (
                  <Text
                    style={[styles.statusText, { color: budgetStatus.color }]}
                  >
                    {budgetStatus.text}
                  </Text>
                ) : null}
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('budget.whereItGoes')}</Text>
            <View style={styles.chartCard}>
              <View style={styles.donutChartWrap}>
                <DonutChart slices={donutSlices} size={200} thickness={26}>
                  <Text
                    style={styles.donutTotal}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {formatUsd(donutTotal)}
                  </Text>
                  <Text style={styles.donutLabel}>{t('budget.planned')}</Text>
                </DonutChart>
              </View>

              {donutLegendSlices.length === 0 ? (
                <Text style={styles.emptyChart}>
                  {t('budget.addExpensesToSeeBreakdown')}
                </Text>
              ) : (
                <View style={styles.donutLegend}>
                  {donutLegendSlices.map((slice) => {
                    const category = categories.find((c) => c.id === slice.id);
                    const share =
                      donutTotal > 0
                        ? Math.round((slice.value / donutTotal) * 100)
                        : 0;

                    return (
                      <View key={slice.id} style={styles.donutLegendRow}>
                        <View
                          style={[
                            styles.legendDot,
                            { backgroundColor: slice.color },
                          ]}
                        />
                        <Text
                          style={styles.donutLegendName}
                          numberOfLines={1}
                        >
                          {category?.name ?? slice.id}
                        </Text>
                        <Text style={styles.donutLegendPercent}>
                          {`${share}%`}
                        </Text>
                        <Text style={styles.donutLegendValue}>
                          {formatUsd(slice.value)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('budget.categories')}</Text>
            {summary.byCategory.map((cat) => {
              const categoryExpenses = expenses.filter(
                (expense) => expense.categoryId === cat.category.id,
              );
              const expanded = expandedCategoryId === cat.category.id;
              // Each category gets a share of the total; going past it is the warning.
              const overShare = cat.estimated > cat.allocated;
              const usedLabels = new Set(
                categoryExpenses.map((e) => e.label.trim().toLowerCase()),
              );
              const suggestions = (
                BUDGET_ITEM_SUGGESTIONS[cat.category.id] ?? []
              ).filter((s) => !usedLabels.has(s.toLowerCase()));
              const CategoryIcon = CATEGORY_ICONS[cat.category.id] ?? Wallet;

              return (
                <View key={cat.category.id} style={styles.categoryCard}>
                  <Pressable
                    style={styles.categoryHeader}
                    onPress={() =>
                      setExpandedCategoryId(
                        expanded ? null : cat.category.id,
                      )
                    }
                    accessibilityRole="button"
                  >
                    <View
                      style={[
                        styles.categoryBadge,
                        {
                          backgroundColor: withAlpha(
                            cat.category.color,
                            '22',
                          ),
                        },
                      ]}
                    >
                      <CategoryIcon
                        color={cat.category.color}
                        size={20}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>
                        {cat.category.name}
                      </Text>
                      <Text style={styles.categoryMeta}>
                        {t('budget.categoryMeta', {
                          planned: formatUsd(cat.estimated),
                          allocated: formatUsd(cat.allocated),
                          paid: formatUsd(cat.paid),
                        })}
                      </Text>
                    </View>
                    <Text style={styles.categoryChevron}>
                      {expanded ? '-' : '+'}
                    </Text>
                  </Pressable>

                  <BudgetBar
                    paid={cat.paid}
                    planned={cat.estimated}
                    cap={cat.allocated}
                    height={8}
                    color={cat.category.color}
                  />

                  {overShare ? (
                    <Text style={styles.categoryOver}>
                      {t('budget.overShare', {
                        amount: formatUsd(cat.estimated - cat.allocated),
                      })}
                    </Text>
                  ) : null}

                  {expanded ? (
                    <View style={styles.expenseList}>
                      {categoryExpenses.length === 0 ? (
                        <Text style={styles.emptyExpenses}>
                          {t('budget.noExpensesInCategory')}
                        </Text>
                      ) : (
                        categoryExpenses.map((expense) =>
                          renderExpenseRow(expense),
                        )
                      )}

                      {suggestions.length > 0 ? (
                        <View style={styles.suggestionsSection}>
                          <Text style={styles.suggestionsTitle}>
                            {t('budget.suggestions')}
                          </Text>
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

        <PressableScale
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          onPress={() => router.push({ pathname: '/expense-edit' })}
        >
          <Text style={styles.fabText}>{t('budget.addExpense')}</Text>
        </PressableScale>
      </>
    );
  };

  const renderPayments = () => (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 40 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.paymentCardsRow}>
        <View style={styles.paymentCard}>
          <Text style={styles.paymentCardLabel}>{t('budget.paid')}</Text>
          <Text style={styles.paymentCardValue}>
            {formatUsd(summary.paid)}
          </Text>
        </View>
        <View style={styles.paymentCard}>
          <Text style={styles.paymentCardLabel}>{t('budget.stillToPay')}</Text>
          <Text style={styles.paymentCardValue}>
            {formatUsd(summary.pending)}
          </Text>
        </View>
      </View>

      {expenses.length === 0 ? (
        <View style={styles.emptyPaymentsCard}>
          <Text style={styles.emptyPaymentsText}>
            {t('budget.noPayments')}
          </Text>
        </View>
      ) : (
        <>
          {overdue.length > 0 ? (
            <View style={styles.paymentGroup}>
              <Text style={styles.paymentGroupTitle}>{t('budget.overdue')}</Text>
              {overdue.map((expense) => renderPaymentRow(expense))}
            </View>
          ) : null}

          {upcoming.length > 0 ? (
            <View style={styles.paymentGroup}>
              <Text style={styles.paymentGroupTitle}>{t('budget.upcoming')}</Text>
              {upcoming.map((expense) => renderPaymentRow(expense))}
            </View>
          ) : null}

          {noDueDate.length > 0 ? (
            <View style={styles.paymentGroup}>
              <Text style={styles.paymentGroupTitle}>{t('budget.noDueDate')}</Text>
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
                  {t('budget.paidInFullCount', { count: fullyPaid.length })}
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
                            {
                              backgroundColor:
                                category?.color ?? colors.textTertiary,
                            },
                          ]}
                        />
                        <View style={styles.paymentInfo}>
                          <Text style={styles.paymentGroupLabel}>
                            {expense.label}
                          </Text>
                          <Text style={styles.paymentDue}>
                            {t('budget.categoryPaidInFull', {
                              category: category?.name ?? t('budget.unknownCategory'),
                            })}
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
          <Text style={styles.title}>{t('budget.title')}</Text>
          <View style={styles.topBarRight} />
        </View>

        <View style={styles.segmentedControl}>
          <Pressable
            style={[
              styles.segment,
              activeTab === 'budget' && styles.segmentActive,
            ]}
            onPress={() => setActiveTab('budget')}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'budget' && styles.segmentTextActive,
              ]}
            >
              {t('budget.tabBudget')}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.segment,
              activeTab === 'payments' && styles.segmentActive,
            ]}
            onPress={() => setActiveTab('payments')}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'payments' && styles.segmentTextActive,
              ]}
            >
              {t('budget.tabPayments')}
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
    fontFamily: typography.fonts.title,
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
    fontFamily: typography.fonts.title,
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
  summaryCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: 20,
    gap: 10,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    letterSpacing: 1.2,
    color: colors.accentDeep,
    textTransform: 'uppercase',
  },
  editPill: {
    backgroundColor: colors.accentBright,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  editPillText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.accentDeep,
  },
  spentAmount: {
    fontFamily: typography.fonts.title,
    fontSize: 34,
    lineHeight: 40,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  spentSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    rowGap: 4,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  statusText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    lineHeight: 20,
    marginTop: 2,
  },
  totalEditBox: {
    gap: 10,
    marginTop: 2,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.caption,
    color: colors.textPrimary,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelButtonText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: typography.fonts.title,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: 20,
    gap: 18,
    alignItems: 'stretch',
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  donutChartWrap: {
    alignSelf: 'center',
  },
  donutTotal: {
    maxWidth: 140,
    fontFamily: typography.fonts.title,
    fontSize: 26,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  donutLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyChart: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  donutLegend: {
    gap: 10,
  },
  donutLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  donutLegendName: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  donutLegendPercent: {
    width: 44,
    textAlign: 'right',
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  donutLegendValue: {
    minWidth: 70,
    textAlign: 'right',
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
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
    gap: 12,
  },
  categoryBadge: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  categoryMeta: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoryChevron: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  categoryOver: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.error,
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

export default function BudgetScreenRoute() {
  return (
    <PremiumOnly title={t('budget.title')}>
      <BudgetScreen />
    </PremiumOnly>
  );
}
