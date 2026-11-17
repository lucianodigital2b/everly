import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { BackButton } from '../components/BackButton';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { useBudgetStore } from '../zustand/budget';

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDue(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export default function ExpenseEditScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string | string[];
    categoryId?: string | string[];
    label?: string | string[];
    taskId?: string | string[];
  }>();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const preselectedCategoryId = Array.isArray(params.categoryId)
    ? params.categoryId[0]
    : params.categoryId;
  const labelParam = Array.isArray(params.label) ? params.label[0] : params.label;
  const taskIdParam = Array.isArray(params.taskId) ? params.taskId[0] : params.taskId;

  const addExpense = useBudgetStore((state) => state.addExpense);
  const updateExpense = useBudgetStore((state) => state.updateExpense);
  const removeExpense = useBudgetStore((state) => state.removeExpense);
  const categories = useBudgetStore((state) => state.categories);
  const existing = useBudgetStore((state) =>
    state.expenses.find((expense) => expense.id === id),
  );

  const [label, setLabel] = useState(existing?.label ?? labelParam ?? '');
  const [categoryId, setCategoryId] = useState(
    existing?.categoryId ?? preselectedCategoryId ?? categories[0]?.id ?? 'venue',
  );
  const [estimated, setEstimated] = useState(
    existing ? String(existing.estimated) : '',
  );
  const [paid, setPaid] = useState(existing ? String(existing.paid) : '');
  const [dueDate, setDueDate] = useState<string | null>(existing?.dueDate ?? null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (existing) {
      setLabel(existing.label);
      setCategoryId(existing.categoryId);
      setEstimated(String(existing.estimated));
      setPaid(String(existing.paid));
      setDueDate(existing.dueDate ?? null);
    } else {
      setLabel(labelParam ?? '');
      setCategoryId(
        preselectedCategoryId && categories.some((cat) => cat.id === preselectedCategoryId)
          ? preselectedCategoryId
          : categories[0]?.id ?? 'venue',
      );
      setEstimated('');
      setPaid('');
      setDueDate(null);
    }
  }, [existing, preselectedCategoryId, categories, labelParam]);

  const linkedTaskId = existing?.taskId ?? taskIdParam ?? null;

  const handleSave = () => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;

    const parsedEstimated = Math.max(0, Number(estimated) || 0);
    const parsedPaid = Math.max(0, Number(paid) || 0);
    const common = {
      label: trimmedLabel,
      categoryId,
      estimated: parsedEstimated,
      paid: parsedPaid,
      dueDate,
    };

    if (id) {
      updateExpense(id, common);
    } else {
      addExpense({
        ...common,
        taskId: taskIdParam || null,
      });
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleRemove = () => {
    Alert.alert('Remove expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          if (id) {
            removeExpense(id);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          router.back();
        },
      },
    ]);
  };

  const handlePaidInFull = () => {
    const parsedEstimated = Math.max(0, Number(estimated) || 0);
    setPaid(parsedEstimated > 0 ? String(parsedEstimated) : '');
  };

  const canSave = label.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <BackButton fallback="/(tabs)/plan" />
          <Text style={styles.title}>{id ? 'Edit expense' : 'Add expense'}</Text>
          <View style={styles.topBarRight} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Label</Text>
            <TextInput
              style={styles.input}
              autoFocus={!id}
              value={label}
              onChangeText={setLabel}
              placeholder="Cake tasting, venue deposit, etc."
              placeholderTextColor={colors.textTertiary}
            />
            {linkedTaskId ? (
              <Text style={styles.linkedTaskCaption}>Linked to a plan task</Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {categories.map((category) => {
                const selected = category.id === categoryId;
                return (
                  <Pressable
                    key={category.id}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setCategoryId(category.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Estimated cost</Text>
            <TextInput
              style={styles.input}
              value={estimated}
              onChangeText={setEstimated}
              placeholder="$0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Amount paid</Text>
            <TextInput
              style={styles.input}
              value={paid}
              onChangeText={setPaid}
              placeholder="$0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
            />
            <Pressable style={styles.quickPaidButton} onPress={handlePaidInFull}>
              <Text style={styles.quickPaidText}>Mark as paid in full</Text>
            </Pressable>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Due date</Text>
            <Pressable
              style={styles.dueDateRow}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={dueDate ? styles.dueDateText : styles.dueDatePlaceholder}>
                {dueDate ? formatDue(dueDate) : 'Set a due date'}
              </Text>
              {dueDate ? (
                <Pressable
                  style={styles.clearDateButton}
                  hitSlop={8}
                  onPress={(event) => {
                    event.stopPropagation?.();
                    setDueDate(null);
                  }}
                >
                  <Text style={styles.clearDateButtonText}>✕</Text>
                </Pressable>
              ) : null}
            </Pressable>
          </View>

          <Pressable
            style={[styles.primaryButton, !canSave && styles.primaryButtonDisabled]}
            disabled={!canSave}
            onPress={handleSave}
          >
            <Text style={styles.primaryButtonText}>Save</Text>
          </Pressable>

          {id ? (
            <Pressable style={styles.removeButton} onPress={handleRemove}>
              <Text style={styles.removeButtonText}>Remove expense</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          date={dueDate ? parseISODate(dueDate) : new Date()}
          onConfirm={(date) => {
            setDueDate(toISODate(date));
            setShowDatePicker(false);
          }}
          onCancel={() => setShowDatePicker(false)}
        />
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  linkedTaskCaption: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  chipRow: {
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  quickPaidButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface2,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
  },
  quickPaidText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textPrimary,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  dueDateText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  dueDatePlaceholder: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textTertiary,
  },
  clearDateButton: {
    backgroundColor: colors.surface2,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearDateButtonText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
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
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.button,
    color: colors.textPrimary,
  },
  removeButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  removeButtonText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    color: colors.error,
  },
});
