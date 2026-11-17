import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {
  Check,
  Pencil,
  Camera,
  ListChecks,
  Users,
  Wallet,
  ChevronRight,
  ChevronLeft,
  FileText,
  Plus,
  Palette,
  Leaf,
  Sparkles,
  Plane,
  CalendarDays,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import {
  usePlanner,
  useCountdown,
  type PhaseProgress,
  type PhaseTaskEntry,
} from '../../hooks/usePlanner';
import { parseISODate, toISODate, usePlannerStore } from '../../zustand/planner';
import { guestStats, useGuestsStore } from '../../zustand/guests';
import { useBudgetStore, compactUsd } from '../../zustand/budget';
import { BOOKED_OPTIONS, PLAN_TASKS, TASK_CATEGORY_LABEL } from '../../data/weddingPlan';
import {
  VIBE_COLORS,
  VIBE_FIELDS,
  VIBE_HONEYMOONS,
  VIBE_SEASONS,
  VIBE_STYLES,
  seasonFromDate,
  vibeOption,
  type VibeField,
} from '../../data/weddingVibe';
import type { Vibe } from '../../zustand/planner';

const GUEST_ESTIMATES: [string, number][] = [
  ['Under 50', 40],
  ['50-100', 80],
  ['100-150', 125],
  ['150-200', 175],
  ['200+', 220],
];

const BUDGET_CHIPS = [10000, 20000, 30000, 50000];
const NONE_BOOKED = 'none_booked';
const TOTAL_STEPS = 7;
const EMPTY_VIBE: Vibe = { color: null, season: null, style: null, honeymoon: null };

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const weddingDate = usePlannerStore((s) => s.weddingDate);
  const [editing, setEditing] = useState(false);

  if (!weddingDate) {
    return <SetupWizard />;
  }

  if (editing) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <SetupForm onCancel={() => setEditing(false)} onSuccess={() => setEditing(false)} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <PlanView onEdit={() => setEditing(true)} />
    </ScrollView>
  );
}

// ---------- Initial setup wizard ----------

function SetupWizard() {
  const insets = useSafeAreaInsets();
  const store = usePlannerStore();

  const [step, setStep] = useState(0);
  const [partnerA, setPartnerA] = useState(store.partnerA);
  const [partnerB, setPartnerB] = useState(store.partnerB);
  const [date, setDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [guestEstimate, setGuestEstimate] = useState<number | null>(null);
  const [budgetText, setBudgetText] = useState('');
  const [budget, setBudget] = useState<number | null>(null);
  const [notSure, setNotSure] = useState(false);
  const [bookedIds, setBookedIds] = useState<string[]>([]);
  const [building, setBuilding] = useState(false);
  const [checks, setChecks] = useState<number[]>([]);
  const [vibe, setVibeDraft] = useState<Vibe>(store.vibe ?? EMPTY_VIBE);
  const pickVibe = (field: VibeField, id: string) =>
    setVibeDraft((prev) => ({ ...prev, [field]: prev[field] === id ? null : id }));

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const valid =
    step === 0
      ? partnerA.trim().length > 0 && partnerB.trim().length > 0
      : step === 1
        ? date !== null
        : step === 4
          ? guestEstimate !== null
          : step === 5
            ? budget !== null || notSure
            : true;

  const buildingLines = useMemo(() => {
    const names = `${partnerA.trim()} & ${partnerB.trim()}`;
    return [
      `Mapping ${PLAN_TASKS.length} tasks to your date`,
      budget !== null
        ? 'Splitting your budget into 9 categories'
        : 'Setting up your budget',
      `Creating guest groups for ${names}`,
      "Marking what you've already booked",
      ...(vibe.color || vibe.style ? ['Saving your wedding vibe'] : []),
    ];
  }, [budget, partnerA, partnerB, vibe.color, vibe.style]);

  const handleConfirmDate = (selected: Date) => {
    setShowDatePicker(false);
    const iso = toISODate(selected);
    setDate(iso);
    // Pre-pick the season from the date; the couple can still change it.
    setVibeDraft((prev) => (prev.season ? prev : { ...prev, season: seasonFromDate(iso) }));
  };

  const selectBudgetChip = (amount: number) => {
    setBudget(amount);
    setBudgetText('');
    setNotSure(false);
  };

  const handleNotSure = () => {
    setNotSure(true);
    setBudget(null);
    setBudgetText('');
  };

  const toggleBooked = (id: string) => {
    setBookedIds((prev) => {
      if (id === NONE_BOOKED) {
        return prev.includes(NONE_BOOKED) ? [] : [NONE_BOOKED];
      }
      const next = prev.filter((x) => x !== NONE_BOOKED);
      return next.includes(id) ? next.filter((x) => x !== id) : [...next, id];
    });
  };

  const commitWizard = () => {
    const a = partnerA.trim();
    const b = partnerB.trim();

    store.setCouple(a, b);
    if (date) store.setDate(date);
    store.setGuestEstimate(guestEstimate);
    store.setVibe(vibe);

    if (budget !== null) {
      useBudgetStore.getState().setTotal(budget);
    }

    useGuestsStore.getState().seedCoupleGroups(a, b);

    const ids = ['choose_wedding_date'];
    if (budget !== null) ids.push('set_budget');

    const bookedTaskIds = BOOKED_OPTIONS.filter((option) =>
      bookedIds.includes(option.id),
    ).flatMap((option) => option.taskIds);

    store.markDoneMany([...ids, ...bookedTaskIds]);
  };

  const startBuild = () => {
    setBuilding(true);

    const stepDelay = 370;
    buildingLines.forEach((_, index) => {
      setTimeout(() => {
        setChecks((prev) => [...prev, index]);
      }, index * stepDelay);
    });

    setTimeout(() => {
      commitWizard();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, buildingLines.length * stepDelay + 250);
  };

  if (building) {
    return (
      <View
        style={[
          styles.container,
          styles.buildingContainer,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 80 },
        ]}
      >
        <Text style={styles.setupTitle}>Building your plan…</Text>

        {buildingLines.map((line, index) => {
          const checked = checks.includes(index);
          return (
            <View key={line} style={styles.buildingRow}>
              <View
                style={[
                  styles.buildingCheck,
                  checked && styles.buildingCheckDone,
                ]}
              >
                {checked && <Check size={16} color={colors.white} strokeWidth={3} />}
              </View>
              <Text
                style={[
                  styles.buildingLine,
                  checked && styles.buildingLineDone,
                ]}
              >
                {line}
              </Text>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 64}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.wizardHeaderRow}>
          {step > 0 ? (
            <Pressable onPress={() => setStep((prev) => prev - 1)} hitSlop={8}>
              <ChevronLeft size={26} color={colors.textPrimary} />
            </Pressable>
          ) : (
            <View style={styles.wizardHeaderSpacer} />
          )}
          <Text style={styles.wizardStepLabel}>
            Step {step + 1} of {TOTAL_STEPS}
          </Text>
          <View style={styles.wizardHeaderSpacer} />
        </View>

        <View style={styles.wizardProgressTrack}>
          <View
            style={[
              styles.wizardProgressFill,
              { width: `${((step + 1) / TOTAL_STEPS) * 100}%` },
            ]}
          />
        </View>

        {step === 0 && (
          <View style={styles.setup}>
            <Text style={styles.setupTitle}>Who's getting married?</Text>
            <Text style={styles.setupSubtitle}>Add the couple.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your name</Text>
              <TextInput
                style={styles.input}
                value={partnerA}
                onChangeText={setPartnerA}
                placeholder="Your first name"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Partner's name</Text>
              <TextInput
                style={styles.input}
                value={partnerB}
                onChangeText={setPartnerB}
                placeholder="Partner's first name"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <Pressable
              onPress={() => {
                store.skipSetup();
                router.replace('/(tabs)');
              }}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          </View>
        )}

        {step === 1 && (
          <View style={styles.setup}>
            <Text style={styles.setupTitle}>When is the big day?</Text>
            <Text style={styles.setupSubtitle}>
              Choose the date for your countdown and timeline.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Wedding date</Text>
              <Pressable style={styles.dateField} onPress={() => setShowDatePicker(true)}>
                <Text style={date ? styles.dateText : styles.datePlaceholder}>
                  {date ? formatDate(parseISODate(date)) : 'Select a date'}
                </Text>
              </Pressable>
            </View>

            <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              date={date ? parseISODate(date) : today}
              minimumDate={today}
              onConfirm={handleConfirmDate}
              onCancel={() => setShowDatePicker(false)}
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              themeVariant="light"
              isDarkModeEnabled={false}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.setup}>
            <Text style={styles.setupTitle}>What's the vibe?</Text>
            <Text style={styles.setupSubtitle}>
              Pick a main color and a style. You can change them anytime.
            </Text>

            <Text style={styles.inputLabel}>Main color</Text>
            <View style={styles.swatchGrid}>
              {VIBE_COLORS.map((option) => {
                const selected = vibe.color === option.id;
                return (
                  <Pressable
                    key={option.id}
                    style={styles.swatch}
                    onPress={() => pickVibe('color', option.id)}
                  >
                    <View style={[styles.swatchRing, selected && styles.swatchRingSelected]}>
                      <View style={[styles.swatchDot, { backgroundColor: option.hex }]}>
                        {selected && <Check size={16} color={colors.white} strokeWidth={3} />}
                      </View>
                    </View>
                    <Text style={styles.swatchLabel} numberOfLines={1}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Style</Text>
            <View style={styles.chipGrid}>
              {VIBE_STYLES.map((option) => (
                <Chip
                  key={option.id}
                  label={option.label}
                  selected={vibe.style === option.id}
                  onPress={() => pickVibe('style', option.id)}
                />
              ))}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.setup}>
            <Text style={styles.setupTitle}>Season and honeymoon</Text>
            <Text style={styles.setupSubtitle}>
              We guessed the season from your date.
            </Text>

            <Text style={styles.inputLabel}>Season</Text>
            <View style={styles.chipGrid}>
              {VIBE_SEASONS.map((option) => (
                <Chip
                  key={option.id}
                  label={option.label}
                  selected={vibe.season === option.id}
                  onPress={() => pickVibe('season', option.id)}
                />
              ))}
            </View>

            <Text style={styles.inputLabel}>Dream honeymoon</Text>
            <View style={styles.chipGrid}>
              {VIBE_HONEYMOONS.map((option) => (
                <Chip
                  key={option.id}
                  label={option.label}
                  selected={vibe.honeymoon === option.id}
                  onPress={() => pickVibe('honeymoon', option.id)}
                />
              ))}
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.setup}>
            <Text style={styles.setupTitle}>How many guests, roughly?</Text>
            <Text style={styles.setupSubtitle}>
              This helps you keep an eye on your list headroom.
            </Text>

            <View style={styles.chipGrid}>
              {GUEST_ESTIMATES.map(([label, value]) => (
                <Chip
                  key={label}
                  label={label}
                  selected={guestEstimate === value}
                  onPress={() => setGuestEstimate(value)}
                />
              ))}
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={styles.setup}>
            <Text style={styles.setupTitle}>What's your total budget?</Text>
            <Text style={styles.setupSubtitle}>
              You can change this later in Budget.
            </Text>

            <View style={styles.moneyInput}>
              <Text style={styles.moneyPrefix}>$</Text>
              <TextInput
                style={styles.moneyTextInput}
                value={budgetText}
                onChangeText={(value) => {
                  const clean = value.replace(/[^0-9]/g, '');
                  setBudgetText(clean);
                  setBudget(clean ? Number(clean) : null);
                  setNotSure(false);
                }}
                placeholder="e.g. 15000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.chipGrid}>
              {BUDGET_CHIPS.map((amount) => (
                <Chip
                  key={amount}
                  label={compactUsd(amount)}
                  selected={budget === amount}
                  onPress={() => selectBudgetChip(amount)}
                />
              ))}
            </View>

            <Pressable onPress={handleNotSure} style={styles.notSureButton}>
              <Text style={styles.notSureText}>Not sure yet</Text>
            </Pressable>
          </View>
        )}

        {step === 6 && (
          <View style={styles.setup}>
            <Text style={styles.setupTitle}>Already booked anything?</Text>
            <Text style={styles.setupSubtitle}>
              Select anything already locked in — we'll mark those tasks done.
            </Text>

            <View style={styles.chipGrid}>
              {BOOKED_OPTIONS.map((option) => (
                <Chip
                  key={option.id}
                  label={option.label}
                  selected={bookedIds.includes(option.id)}
                  onPress={() => toggleBooked(option.id)}
                />
              ))}

              <Chip
                label="Nothing yet"
                selected={bookedIds.includes(NONE_BOOKED)}
                onPress={() => toggleBooked(NONE_BOOKED)}
              />
            </View>
          </View>
        )}

        <Pressable
          style={[styles.primaryButton, !valid && styles.primaryButtonDisabled]}
          onPress={step < TOTAL_STEPS - 1 ? () => setStep((prev) => prev + 1) : startBuild}
          disabled={!valid}
        >
          <Text style={styles.primaryButtonText}>
            {step < TOTAL_STEPS - 1 ? 'Continue' : 'Build my plan'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------- Editing form kept from the current plan screen ----------

function SetupForm({
  onCancel,
  onSuccess,
}: {
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  const store = usePlannerStore();
  const [partnerA, setPartnerA] = useState(store.partnerA);
  const [partnerB, setPartnerB] = useState(store.partnerB);
  const [date, setDate] = useState<string | null>(store.weddingDate);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const valid = partnerA.trim().length > 0 && partnerB.trim().length > 0 && date !== null;

  const handleConfirmDate = (selected: Date) => {
    setShowDatePicker(false);
    setDate(toISODate(selected));
  };

  const handleSubmit = async () => {
    if (!valid) return;
    store.setCouple(partnerA, partnerB);
    if (date) store.setDate(date);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSuccess?.();
  };

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  return (
    <View style={styles.setup}>
      {onCancel && (
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      )}
      <Text style={styles.setupTitle}>Plan your wedding</Text>
      <Text style={styles.setupSubtitle}>Add the couple and the big day.</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Your name</Text>
        <TextInput
          style={styles.input}
          value={partnerA}
          onChangeText={setPartnerA}
          placeholder="Your first name"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Partner's name</Text>
        <TextInput
          style={styles.input}
          value={partnerB}
          onChangeText={setPartnerB}
          placeholder="Partner's first name"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Wedding date</Text>
        <Pressable style={styles.dateField} onPress={() => setShowDatePicker(true)}>
          <Text style={date ? styles.dateText : styles.datePlaceholder}>
            {date ? formatDate(parseISODate(date)) : 'Select a date'}
          </Text>
        </Pressable>
      </View>

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={date ? parseISODate(date) : today}
        minimumDate={today}
        onConfirm={handleConfirmDate}
        onCancel={() => setShowDatePicker(false)}
        display={Platform.OS === 'ios' ? 'inline' : 'default'}
        themeVariant="light"
        isDarkModeEnabled={false}
      />

      <Pressable
        style={[styles.primaryButton, !valid && styles.primaryButtonDisabled]}
        onPress={handleSubmit}
        disabled={!valid}
      >
        <Text style={styles.primaryButtonText}>Save changes</Text>
      </Pressable>
    </View>
  );
}

// ---------- Plan View ----------

function PlanView({ onEdit }: { onEdit: () => void }) {
  const store = usePlannerStore();
  const plannerData = usePlanner();
  const weddingDate = store.weddingDate!;
  const countdown = useCountdown(weddingDate);
  const guestList = useGuestsStore((s) => s.guests);
  const guests = useMemo(() => guestStats(guestList), [guestList]);
  const budgetTotal = useBudgetStore((s) => s.total);
  const expenses = useBudgetStore((s) => s.expenses);
  const budgetSpent = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.estimated, 0),
    [expenses],
  );

  const initialCollapsed = useMemo(() => {
    if (!plannerData) return new Set<string>();
    return new Set(
      plannerData.phases
        .filter((phase) => !phase.isCurrent)
        .map((phase) => phase.phase.id),
    );
  }, []);

  const [collapsed, setCollapsed] = useState<Set<string>>(initialCollapsed);

  const coverUri = store.coverUri;
  const vibeHex = vibeOption('color', store.vibe?.color ?? null)?.hex;

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      store.setCover(result.assets[0].uri);
    }
  };

  const togglePhaseCollapse = (phaseId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  };

  const handleToggleDone = (id: string) => {
    Haptics.selectionAsync();
    store.toggleDone(id);
  };

  const handleLongPress = (
    id: string,
    currentState: 'done' | 'skipped' | 'pending',
  ) => {
    if (currentState === 'skipped') {
      store.undo(id);
    } else {
      store.skip(id);
    }
  };

  const handleReset = () => {
    Alert.alert('Reset plan?', 'This will erase all planning progress and details.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          store.reset();
          setCollapsed(new Set());
        },
      },
    ]);
  };

  if (!plannerData) return null;

  const planner = plannerData;
  const tasksSub =
    planner.essentialsLeft > 0
      ? `${planner.essentialsLeft} essentials left`
      : 'no essentials left';

  const guestEstimate = store.guestEstimate;
  const guestSub = !guests.invited
    ? 'your list'
    : guestEstimate !== null && guests.invited < guestEstimate
      ? `of ~${guestEstimate} planned`
      : 'attending';

  const nextPhase = planner.next
    ? planner.phases.find((phase) =>
        phase.tasks.some((entry) => entry.task.id === planner.next!.id),
      )
    : undefined;

  return (
    <View style={styles.plan}>
      {/* Hero */}
      <View style={styles.hero}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} />
        ) : (
          <LinearGradient
            colors={vibeHex ? [`${vibeHex}99`, vibeHex] : [colors.accentBright, colors.accent]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          style={styles.heroGradient}
          pointerEvents="none"
        />
        <View style={styles.heroTopActions}>
          <Pressable style={styles.heroIconButton} onPress={pickCover}>
            <Camera size={20} color={colors.white} />
          </Pressable>
          <Pressable style={styles.heroIconButton} onPress={onEdit}>
            <Pencil size={20} color={colors.white} />
          </Pressable>
        </View>
        <View style={styles.heroBottom}>
          <Text style={styles.heroNames}>
            {store.partnerA} & {store.partnerB}
          </Text>
          <Text style={styles.heroDate}>
            {formatDate(parseISODate(weddingDate))}
          </Text>
          {countdown.isPast ? (
            <Text style={styles.justMarried}>Just married</Text>
          ) : (
            <View style={styles.countdownRow}>
              <CountdownBox label="DAYS" value={countdown.days} />
              <CountdownBox label="HRS" value={countdown.hours} />
              <CountdownBox label="MIN" value={countdown.minutes} />
              <CountdownBox label="SEC" value={countdown.seconds} />
            </View>
          )}
        </View>
      </View>

      {/* Progress row */}
      <View style={styles.progressRow}>
        <ProgressCard
          icon={ListChecks}
          label="Tasks"
          value={`${planner.doneCount}/${planner.total}`}
          sub={tasksSub}
        />
        <ProgressCard
          icon={Users}
          label="Guests"
          value={guests.invited ? `${guests.attending}/${guests.invited}` : 'Add'}
          sub={guestSub}
          onPress={() => router.push('/guests')}
        />
        <ProgressCard
          icon={Wallet}
          label="Budget"
          value={budgetTotal ? compactUsd(budgetSpent) : 'Set'}
          sub={budgetTotal ? `of ${compactUsd(budgetTotal)}` : 'your budget'}
          onPress={() => router.push('/budget')}
        />
      </View>

      {/* Overdue */}
      {planner.overdue > 0 && (
        <View style={styles.overdueBanner}>
          <Text style={styles.overdueText}>
            {planner.overdue} {planner.overdue === 1 ? 'task' : 'tasks'} from
            earlier phases are still open
          </Text>
        </View>
      )}

      {/* Up next */}
      {planner.next && nextPhase && (
        <View style={styles.nextCard}>
          <Pressable
            style={styles.nextInfo}
            onPress={() => router.push(`/task?id=${planner.next!.id}`)}
          >
            <Text style={styles.nextLabel}>UP NEXT</Text>
            <Text style={styles.nextTitle}>{planner.next.title}</Text>
            <Text style={styles.nextDeadline}>{nextPhase.deadlineLabel}</Text>
            <Text style={styles.nextTip}>{planner.next.tip}</Text>
          </Pressable>

          <View style={styles.nextActions}>
            {planner.next.action && (
              <Pressable
                style={styles.nextActionButton}
                onPress={() => router.push(planner.next!.action!.route as any)}
                hitSlop={6}
              >
                <Text style={styles.nextActionText}>
                  {planner.next.action.label}
                </Text>
              </Pressable>
            )}
            <Pressable
              style={styles.nextMarkDone}
              onPress={() => handleToggleDone(planner.next!.id)}
              hitSlop={6}
            >
              <Check size={16} color={colors.textPrimary} />
              <Text style={styles.nextMarkDoneText}>Mark done</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* About our wedding */}
      <AboutCard />

      {/* Timeline */}
      <Pressable style={styles.timelineCard} onPress={() => router.push('/timeline')}>
        <View style={styles.timelineIcon}>
          <CalendarDays size={20} color={colors.accentDeep} />
        </View>
        <View style={styles.timelineCopy}>
          <Text style={styles.timelineTitle}>Timeline</Text>
          <Text style={styles.timelineSubtitle}>
            Every task by date, filter by status
          </Text>
        </View>
        <ChevronRight size={18} color={colors.textTertiary} />
      </Pressable>

      {/* Phases */}
      <View style={styles.phases}>
        {planner.phases.map((phase) => (
          <PhaseSection
            key={phase.phase.id}
            phase={phase}
            collapsed={collapsed.has(phase.phase.id)}
            onToggleCollapse={() => togglePhaseCollapse(phase.phase.id)}
            onToggleDone={handleToggleDone}
            onLongPress={handleLongPress}
          />
        ))}
      </View>

      {/* Reset */}
      <Pressable onPress={handleReset} style={styles.resetButton}>
        <Text style={styles.resetText}>Reset plan</Text>
      </Pressable>
    </View>
  );
}

const VIBE_ICONS: Record<VibeField, typeof Palette> = {
  color: Palette,
  season: Leaf,
  style: Sparkles,
  honeymoon: Plane,
};

// The answers from the wizard's vibe steps, editable in place.
function AboutCard() {
  const insets = useSafeAreaInsets();
  const vibe = usePlannerStore((s) => s.vibe) ?? EMPTY_VIBE;
  const setVibe = usePlannerStore((s) => s.setVibe);
  const [editing, setEditing] = useState<VibeField | null>(null);
  const editingField = VIBE_FIELDS.find((f) => f.field === editing) ?? null;

  const choose = (id: string | null) => {
    if (!editing) return;
    Haptics.selectionAsync();
    setVibe({ [editing]: id });
    setEditing(null);
  };

  return (
    <View style={styles.aboutCard}>
      <Text style={styles.aboutTitle}>About our wedding</Text>
      <View style={styles.aboutGrid}>
        {VIBE_FIELDS.map(({ field, label }) => {
          const Icon = VIBE_ICONS[field];
          const option = vibeOption(field, vibe[field]);
          return (
            <Pressable
              key={field}
              style={({ pressed }) => [styles.aboutTile, pressed && { opacity: 0.7 }]}
              onPress={() => setEditing(field)}
            >
              {field === 'color' && option?.hex ? (
                <View style={[styles.aboutSwatch, { backgroundColor: option.hex }]} />
              ) : (
                <Icon size={20} color={colors.accentDeep} strokeWidth={2} />
              )}
              <Text style={styles.aboutLabel}>{label.toUpperCase()}</Text>
              <Text
                style={[styles.aboutValue, !option && styles.aboutValueEmpty]}
                numberOfLines={1}
              >
                {option?.label ?? 'Add'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Modal
        visible={editing !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditing(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setEditing(null)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
            onPress={() => {}}
          >
            <Text style={styles.sheetTitle}>{editingField?.label}</Text>
            <View style={styles.chipGrid}>
              {editingField?.options.map((option) => (
                <Chip
                  key={option.id}
                  label={option.label}
                  selected={editing !== null && vibe[editing] === option.id}
                  onPress={() => choose(option.id)}
                />
              ))}
            </View>
            {editing !== null && vibe[editing] ? (
              <Pressable onPress={() => choose(null)} style={styles.notSureButton}>
                <Text style={styles.notSureText}>Clear</Text>
              </Pressable>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function CountdownBox({ label, value }: { label: string; value: number }) {
  const display = value.toString().padStart(2, '0');
  return (
    <View style={styles.countdownBox}>
      <Text style={styles.countdownNumber}>{display}</Text>
      <Text style={styles.countdownLabel}>{label}</Text>
    </View>
  );
}

function ProgressCard({
  icon: Icon,
  label,
  value,
  sub,
  onPress,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  sub: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.progressCard,
        pressed && onPress && { opacity: 0.7 },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Icon size={18} color={colors.accentDeep} strokeWidth={2.2} />
      <Text style={styles.progressLabel}>{label}</Text>
      <Text style={styles.progressValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.progressSub} numberOfLines={1}>
        {sub}
      </Text>
    </Pressable>
  );
}

function PhaseSection({
  phase,
  collapsed,
  onToggleCollapse,
  onToggleDone,
  onLongPress,
}: {
  phase: PhaseProgress;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onToggleDone: (id: string) => void;
  onLongPress: (id: string, state: 'done' | 'skipped' | 'pending') => void;
}) {
  const pending = phase.tasks.filter((entry) => entry.state === 'pending').length;

  return (
    <View style={styles.phaseSection}>
      <Pressable style={styles.phaseHeader} onPress={onToggleCollapse}>
        <View style={styles.phaseHeaderLeft}>
          <View style={styles.phaseTitleLine}>
            <Text style={styles.phaseTitle}>
              {phase.phase.title}
              {phase.isCurrent && <Text style={styles.phaseNow}>  Now</Text>}
            </Text>
            {phase.isPast && pending > 0 && (
              <View style={styles.overdueTag}>
                <Text style={styles.overdueTagText}>{pending} overdue</Text>
              </View>
            )}
          </View>
          <Text style={styles.phaseDeadline}>{phase.deadlineLabel}</Text>
          <Text style={styles.phaseSubtitle}>{phase.phase.subtitle}</Text>
        </View>
        <View style={styles.phaseHeaderRight}>
          <Text style={styles.phaseCount}>
            {phase.done}/{phase.total}
          </Text>
          <Text style={styles.phaseToggle}>{collapsed ? '+' : '-'}</Text>
        </View>
      </Pressable>

      <View style={styles.phaseProgressBar}>
        <View style={[styles.phaseProgressFill, { width: `${phase.percent}%` }]} />
      </View>

      {!collapsed && (
        <>
          {phase.tasks.map((entry) => (
            <TaskRow
              key={entry.task.id}
              entry={entry}
              onToggleDone={onToggleDone}
              onLongPress={onLongPress}
            />
          ))}

          <Pressable
            style={styles.addTaskRow}
            onPress={() => router.push(`/task-new?phase=${phase.phase.id}`)}
          >
            <Plus size={16} color={colors.accentDeep} />
            <Text style={styles.addTaskText}>Add task</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

function TaskRow({
  entry,
  onToggleDone,
  onLongPress,
}: {
  entry: PhaseTaskEntry;
  onToggleDone: (id: string) => void;
  onLongPress: (id: string, state: 'done' | 'skipped' | 'pending') => void;
}) {
  const { task, state } = entry;
  const isDone = state === 'done';
  const isSkipped = state === 'skipped';
  const isPending = state === 'pending';

  const openTask = () => router.push(`/task?id=${task.id}`);

  const openAction = () => {
    if (task.action) {
      router.push(task.action.route as any);
    }
  };

  return (
    <View style={styles.taskRow}>
      <Pressable
        style={[
          styles.checkbox,
          isDone && styles.checkboxDone,
          isSkipped && styles.checkboxSkipped,
        ]}
        onPress={() => onToggleDone(task.id)}
        onLongPress={() => onLongPress(task.id, state)}
        delayLongPress={300}
        hitSlop={10}
      >
        {isDone && <Check size={16} color={colors.white} strokeWidth={3} />}
        {isSkipped && <View style={styles.skipMark} />}
      </Pressable>

      <Pressable
        style={styles.taskContent}
        onPress={openTask}
        onLongPress={() => onLongPress(task.id, state)}
        delayLongPress={300}
      >
        <Text
          style={[
            styles.taskTitle,
            isDone && styles.taskTitleDone,
            (isSkipped || isDone) && styles.taskTitleMuted,
          ]}
        >
          {task.title}
        </Text>

        <View style={styles.taskMetaLine}>
          <Text style={styles.taskCategory}>
            {TASK_CATEGORY_LABEL[task.category]}
          </Text>

          {isPending && task.essential && (
            <View style={styles.essentialTag}>
              <Text style={styles.essentialTagText}>Essential</Text>
            </View>
          )}

          {(entry.note?.trim().length ?? 0) > 0 && (
            <FileText size={12} color={colors.textTertiary} />
          )}

          {task.action && (
            <Pressable onPress={openAction} hitSlop={4}>
              <Text style={styles.taskAction}>{task.action.label}</Text>
            </Pressable>
          )}
        </View>

        {isPending && task.tip ? (
          <Text style={styles.taskTip}>{task.tip}</Text>
        ) : null}

        {isSkipped && <Text style={styles.taskSkippedLabel}>Skipped</Text>}
      </Pressable>

      <ChevronRight size={18} color={colors.textTertiary} style={styles.taskChevron} />
    </View>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  // Setup / Wizard
  setup: {
    gap: 16,
  },
  setupTitle: {
    fontFamily: typography.fonts.extraBold,
    fontSize: typography.sizes.h1,
    color: colors.textPrimary,
    marginTop: 8,
  },
  setupSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  cancelButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    color: colors.accentDeep,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  dateField: {
    backgroundColor: colors.surface2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  dateText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  datePlaceholder: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textTertiary,
  },
  primaryButton: {
    marginTop: 24,
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
  skipButton: {
    alignSelf: 'center',
    paddingVertical: 11,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  skipText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    color: colors.accentDeep,
  },
  wizardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  wizardHeaderSpacer: {
    width: 26,
  },
  wizardStepLabel: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  wizardProgressTrack: {
    height: 4,
    backgroundColor: colors.surface2,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  wizardProgressFill: {
    height: '100%',
    backgroundColor: colors.accentDeep,
    borderRadius: 2,
  },
  aboutCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  aboutTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  aboutGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  aboutTile: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.surface2,
  },
  aboutSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aboutLabel: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.textSecondary,
  },
  aboutValue: {
    fontFamily: typography.fonts.semibold,
    fontSize: 12,
    color: colors.textPrimary,
    paddingHorizontal: 4,
  },
  aboutValueEmpty: {
    color: colors.accentDeep,
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(46,36,41,0.35)',
  },
  sheet: {
    backgroundColor: colors.backgroundPrimary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  sheetTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h2,
    color: colors.textPrimary,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
  },
  swatch: {
    width: '20%',
    alignItems: 'center',
    gap: 6,
  },
  swatchRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchRingSelected: {
    borderColor: colors.accentDeep,
  },
  swatchDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
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
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  chipTextSelected: {
    color: colors.white,
  },
  moneyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moneyPrefix: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.h3,
    color: colors.textSecondary,
    marginRight: 8,
  },
  moneyTextInput: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
  },
  notSureButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  notSureText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    color: colors.accentDeep,
  },
  buildingContainer: {
    paddingHorizontal: 20,
    gap: 18,
  },
  buildingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buildingCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buildingCheckDone: {
    backgroundColor: colors.accentDeep,
    borderColor: colors.accentDeep,
  },
  buildingLine: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
  },
  buildingLineDone: {
    color: colors.textPrimary,
    fontFamily: typography.fonts.semibold,
  },
  // Plan
  plan: {
    gap: 20,
  },
  hero: {
    height: 300,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.accentBright,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTopActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 2,
  },
  heroIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBottom: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 2,
  },
  heroNames: {
    fontFamily: typography.fonts.extraBold,
    fontSize: 30,
    color: colors.white,
    marginBottom: 4,
  },
  heroDate: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.accentBright,
    marginBottom: 12,
  },
  justMarried: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h2,
    color: colors.white,
  },
  countdownRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countdownBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  countdownNumber: {
    fontFamily: typography.fonts.bold,
    fontSize: 22,
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  countdownLabel: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 10,
  },
  progressCard: {
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
  progressLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  progressValue: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  progressSub: {
    fontFamily: typography.fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  overdueBanner: {
    backgroundColor: 'rgba(208,138,131,0.1)',
    borderRadius: 14,
    padding: 14,
  },
  overdueText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    color: colors.error,
  },
  nextCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextInfo: {
    flex: 1,
  },
  nextLabel: {
    fontFamily: typography.fonts.semibold,
    fontSize: 11,
    color: colors.accentDeep,
    letterSpacing: 1,
    marginBottom: 4,
  },
  nextTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  nextDeadline: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  nextTip: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  nextActions: {
    gap: 8,
    alignItems: 'flex-end',
  },
  nextActionButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  nextActionText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.caption,
    color: colors.textPrimary,
  },
  nextMarkDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  nextMarkDoneText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textPrimary,
  },
  phases: {
    gap: 20,
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCopy: {
    flex: 1,
  },
  timelineTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  timelineSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  phaseSection: {
    gap: 8,
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phaseHeaderLeft: {
    flex: 1,
  },
  phaseTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  phaseTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  phaseNow: {
    color: colors.accentDeep,
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
  },
  phaseDeadline: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 3,
  },
  phaseSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  overdueTag: {
    backgroundColor: 'rgba(208,138,131,0.15)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  overdueTagText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 11,
    color: colors.error,
  },
  phaseHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  phaseCount: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  phaseToggle: {
    fontFamily: typography.fonts.bold,
    fontSize: 18,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  phaseProgressBar: {
    height: 4,
    backgroundColor: colors.surface2,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  phaseProgressFill: {
    height: '100%',
    backgroundColor: colors.accentDeep,
    borderRadius: 2,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxDone: {
    backgroundColor: colors.accentDeep,
    borderColor: colors.accentDeep,
  },
  checkboxSkipped: {
    borderStyle: 'dashed',
    borderColor: colors.textTertiary,
  },
  skipMark: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textTertiary,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
  },
  taskTitleMuted: {
    color: colors.textTertiary,
  },
  taskMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  taskCategory: {
    fontFamily: typography.fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  essentialTag: {
    backgroundColor: 'rgba(208,138,131,0.15)',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  essentialTagText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    color: colors.error,
  },
  taskAction: {
    fontFamily: typography.fonts.semibold,
    fontSize: 12,
    color: colors.accentDeep,
  },
  taskTip: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  taskSkippedLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textTertiary,
    marginTop: 4,
  },
  taskChevron: {
    marginTop: 4,
  },
  addTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  addTaskText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.body,
    color: colors.accentDeep,
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  resetText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    color: colors.error,
  },
});
