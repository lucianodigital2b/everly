import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { PressableScale } from '../../components/home/PressableScale';
import { t, LOCALE_TAG } from '../../i18n';
import { TaskCheck } from '../../components/TaskCheck';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
} from 'react-native-reanimated';
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
  ChevronDown,
  FileText,
  Plus,
  Palette,
  Leaf,
  Sparkles,
  Plane,
  CalendarDays,
  Heart,
  User,
  ClipboardList,
  HandHeart,
  Landmark,
  Church,
  FileSignature,
  Mountain,
  Clock,
  Store,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import {
  usePlanner,
  type PhaseProgress,
  type PhaseTaskEntry,
} from '../../hooks/usePlanner';
import { parseISODate, toISODate, usePlannerStore } from '../../zustand/planner';
import { guestStats, useGuestsStore } from '../../zustand/guests';
import { useBudgetStore, compactUsd, formatUsd, CURRENCY_SYMBOL } from '../../zustand/budget';
import { NumericText } from '../../components/NumericText';
import { StepSlider } from '../../components/StepSlider';
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
import { presentPaywallIfNotSubscribed } from '../../services/paywall';
import { revenueCat } from '../../services/revenuecat';
import { SourceLogo } from '../../components/SourceLogo';
import { usePostHog } from 'posthog-react-native';

// "How did you hear about Everly?" (ob_source in PostHog and RevenueCat).
// AppsFlyer files organic TikTok, Instagram and Pinterest all as "organic",
// so asking is the only way to tell them apart. App Store search is its own
// option: in DailyHair, without it, "Other" became the biggest answer.
const SOURCE_OPTIONS: { id: string; label: string }[] = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'app_store', label: t('plan.wizard.sourceAppStore') },
  { id: 'google', label: 'Google' },
  { id: 'friend', label: t('plan.wizard.sourceFriend') },
  { id: 'other', label: t('plan.wizard.sourceOther') },
];

const GUEST_ESTIMATES: [string, number][] = [
  [t('plan.guestEstimates.under50'), 40],
  [t('plan.guestEstimates.from50to100'), 80],
  [t('plan.guestEstimates.from100to150'), 125],
  [t('plan.guestEstimates.from150to200'), 175],
  [t('plan.guestEstimates.over200'), 220],
];

// The budget slider's stops: fine steps where most weddings land, coarser
// ones above. 5 mil-50 mil by 1 mil, to 150 mil by 5 mil, to 300 mil by 10 mil.
const BUDGET_STOPS: number[] = [
  ...Array.from({ length: 46 }, (_, i) => 5000 + i * 1000),
  ...Array.from({ length: 20 }, (_, i) => 55000 + i * 5000),
  ...Array.from({ length: 15 }, (_, i) => 160000 + i * 10000),
];
const DEFAULT_BUDGET = 30000;
const budgetStopIndex = (amount: number) => {
  let best = 0;
  BUDGET_STOPS.forEach((stop, i) => {
    if (Math.abs(stop - amount) < Math.abs(BUDGET_STOPS[best] - amount)) best = i;
  });
  return best;
};
// "R$ 30.000" → "30.000": the symbol sits apart, smaller, beside the number.
const budgetDigits = (n: number) => formatUsd(n).replace(CURRENCY_SYMBOL, '').trim();
const BUDGET_FONT = 56;
const NONE_BOOKED = 'none_booked';
const WIZARD_STEPS = [
  'role',
  'couple',
  'date',
  'type',
  'vibe',
  'season',
  'guests',
  'budget',
  'booked',
  'worry',
  'source',
] as const;
type WizardStep = typeof WIZARD_STEPS[number];

const ROLE_OPTIONS: {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}[] = [
  { id: 'bride', label: t('plan.wizard.roles.bride'), icon: Heart },
  { id: 'groom', label: t('plan.wizard.roles.groom'), icon: User },
  { id: 'both', label: t('plan.wizard.roles.both'), icon: Users },
  { id: 'planner', label: t('plan.wizard.roles.planner'), icon: ClipboardList },
  { id: 'family', label: t('plan.wizard.roles.family'), icon: HandHeart },
];

const WEDDING_TYPE_OPTIONS: {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}[] = [
  { id: 'civil_party', label: t('plan.wizard.types.civil_party'), icon: Landmark },
  { id: 'religious_party', label: t('plan.wizard.types.religious_party'), icon: Church },
  { id: 'mini', label: t('plan.wizard.types.mini'), icon: Sparkles },
  { id: 'civil_only', label: t('plan.wizard.types.civil_only'), icon: FileSignature },
  { id: 'destination', label: t('plan.wizard.types.destination'), icon: Plane },
  { id: 'elopement', label: t('plan.wizard.types.elopement'), icon: Mountain },
];

const WORRY_OPTIONS: {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}[] = [
  { id: 'budget', label: t('plan.wizard.worries.budget'), icon: Wallet },
  { id: 'forgetting', label: t('plan.wizard.worries.forgetting'), icon: ListChecks },
  { id: 'guests', label: t('plan.wizard.worries.guests'), icon: Users },
  { id: 'time', label: t('plan.wizard.worries.time'), icon: Clock },
  { id: 'photos', label: t('plan.wizard.worries.photos'), icon: Camera },
  { id: 'vendors', label: t('plan.wizard.worries.vendors'), icon: Store },
];
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
  const [dateEstimated, setDateEstimatedDraft] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showApproxPicker, setShowApproxPicker] = useState(false);
  const [approxYear, setApproxYear] = useState<number | null>(null);
  const [approxMonth, setApproxMonth] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(store.role);
  const [weddingType, setWeddingType] = useState<string | null>(store.weddingType);
  const [worry, setWorry] = useState<string | null>(store.worry);
  const [guestEstimate, setGuestEstimate] = useState<number | null>(null);
  const [budget, setBudget] = useState<number | null>(null);
  const [notSure, setNotSure] = useState(false);
  const [bookedIds, setBookedIds] = useState<string[]>([]);
  const [building, setBuilding] = useState(false);
  const [checks, setChecks] = useState<number[]>([]);
  const [vibe, setVibeDraft] = useState<Vibe>(store.vibe ?? EMPTY_VIBE);
  const [source, setSource] = useState<string | null>(null);
  const posthog = usePostHog();
  const pickVibe = (field: VibeField, id: string) =>
    setVibeDraft((prev) => ({ ...prev, [field]: prev[field] === id ? null : id }));

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const stepId = WIZARD_STEPS[step];
  const approxMonths = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: new Date(2000, i, 1, 12, 0, 0, 0).toLocaleDateString(LOCALE_TAG, {
      month: 'short',
    }),
  }));

  const valid =
    stepId === 'couple'
      ? partnerA.trim().length > 0 && partnerB.trim().length > 0
      : stepId === 'date'
        ? date !== null
        : stepId === 'role'
          ? role !== null
          : stepId === 'type'
            ? weddingType !== null
            : stepId === 'guests'
              ? guestEstimate !== null
              : stepId === 'budget'
                ? budget !== null || notSure
                : stepId === 'worry'
                  ? worry !== null
                  : stepId === 'source'
                    ? source !== null
                    : true;

  const buildingLines = useMemo(() => {
    const names = `${partnerA.trim()} & ${partnerB.trim()}`;
    return [
      t('plan.building.mappingTasks', { count: PLAN_TASKS.length }),
      budget !== null
        ? t('plan.building.splittingBudget')
        : t('plan.building.settingUpBudget'),
      t('plan.building.creatingGuestGroups', { names }),
      t('plan.building.markingBooked'),
      ...(vibe.color || vibe.style ? [t('plan.building.savingVibe')] : []),
    ];
  }, [budget, partnerA, partnerB, vibe.color, vibe.style]);

  const handleConfirmDate = (selected: Date) => {
    setShowDatePicker(false);
    const iso = toISODate(selected);
    setDate(iso);
    setDateEstimatedDraft(false);
    setShowApproxPicker(false);
    setApproxYear(null);
    setApproxMonth(null);
    // Pre-pick the season from the date; the couple can still change it.
    setVibeDraft((prev) => (prev.season ? prev : { ...prev, season: seasonFromDate(iso) }));
  };

  const handleNoDate = () => {
    Haptics.selectionAsync();
    setShowApproxPicker(true);
  };

  const applyApproxDate = (year: number, month: number) => {
    const iso = `${year}-${String(month).padStart(2, '0')}-15`;
    setDate(iso);
    setDateEstimatedDraft(true);
    setVibeDraft((prev) => (prev.season ? prev : { ...prev, season: seasonFromDate(iso) }));
  };

  const selectApproxYear = (year: number) => {
    Haptics.selectionAsync();
    setApproxYear(year);
    if (approxMonth === null) return;
    // A month already gone this year can't stay picked: clear it.
    if (year === currentYear && approxMonth <= currentMonth) {
      setApproxMonth(null);
      setDate(null);
      return;
    }
    applyApproxDate(year, approxMonth);
  };

  const selectApproxMonth = (month: number) => {
    Haptics.selectionAsync();
    setApproxMonth(month);
    if (approxYear !== null) applyApproxDate(approxYear, month);
  };

  const pickBudgetStop = (index: number) => {
    const amount = BUDGET_STOPS[index];
    if (amount !== budget) Haptics.selectionAsync();
    setBudget(amount);
    setNotSure(false);
  };

  const handleNotSure = () => {
    setNotSure(true);
    setBudget(null);
  };

  // The budget step opens on a value already, so the big number and the
  // slider have something to show and Continue works straight away.
  useEffect(() => {
    if (stepId === 'budget' && budget === null && !notSure) setBudget(DEFAULT_BUDGET);
  }, [stepId]);

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
    if (date) {
      store.setDate(date);
      store.setDateEstimated(dateEstimated);
    }
    store.setGuestEstimate(guestEstimate);
    store.setVibe(vibe);
    store.setProfile({ role, weddingType, worry });

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

    if (source) {
      // Event property always lands; the person property needs
      // setPersonProperties, since anonymous profiles drop $set in capture.
      posthog?.capture('onboarding_source', { ob_source: source });
      posthog?.setPersonProperties({ ob_source: source });
      revenueCat.setAttributes({ ob_source: source });
    }

    const profileAttrs: Record<string, string> = {
      ob_date_estimated: dateEstimated ? 'true' : 'false',
    };
    if (role) profileAttrs.ob_role = role;
    if (weddingType) profileAttrs.ob_wedding_type = weddingType;
    if (worry) profileAttrs.ob_worry = worry;
    posthog?.capture('onboarding_profile', profileAttrs);
    posthog?.setPersonProperties(profileAttrs);
    revenueCat.setAttributes(profileAttrs);
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
      // End of onboarding: the soft paywall (closable), once, right after the
      // plan is built. Subscribers and builds without RevenueCat skip it.
      presentPaywallIfNotSubscribed('soft');
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
        <Text style={styles.setupTitle}>{t('plan.building.title')}</Text>

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
          { flexGrow: 1, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 },
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
            {t('plan.wizard.stepLabel', { current: step + 1, total: WIZARD_STEPS.length })}
          </Text>
          <View style={styles.wizardHeaderSpacer} />
        </View>

        <View style={styles.wizardProgressTrack}>
          <View
            style={[
              styles.wizardProgressFill,
              { width: `${((step + 1) / WIZARD_STEPS.length) * 100}%` },
            ]}
          />
        </View>

        {/* Each step is centred vertically between the progress bar and
            the button, which sits at the bottom. */}
        <View style={styles.wizardBody}>
        {stepId === 'role' && (
          <View style={styles.setup}>
            <Text style={styles.setupTitle}>{t('plan.wizard.roleTitle')}</Text>
            <Text style={styles.setupSubtitle}>{t('plan.wizard.roleSubtitle')}</Text>

            <View style={styles.optionList}>
              {ROLE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  icon={option.icon}
                  label={option.label}
                  selected={role === option.id}
                  onPress={() => setRole(option.id)}
                />
              ))}
            </View>
          </View>
        )}

        {stepId === 'couple' && (
          <View style={styles.setup}>
            <Text style={styles.setupTitle}>{t('plan.wizard.step0Title')}</Text>
            <Text style={styles.setupSubtitle}>{t('plan.wizard.step0Subtitle')}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('plan.wizard.yourName')}</Text>
              <TextInput
                style={styles.input}
                value={partnerA}
                onChangeText={setPartnerA}
                placeholder={t('plan.wizard.yourFirstNamePlaceholder')}
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('plan.wizard.partnerName')}</Text>
              <TextInput
                style={styles.input}
                value={partnerB}
                onChangeText={setPartnerB}
                placeholder={t('plan.wizard.partnerFirstNamePlaceholder')}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>
        )}

        {stepId === 'date' && (
          <View style={styles.setup}>
            <Text style={styles.setupTitle}>{t('plan.wizard.step1Title')}</Text>
            <Text style={styles.setupSubtitle}>
              {t('plan.wizard.step1Subtitle')}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('plan.wizard.weddingDate')}</Text>
              <Pressable style={styles.dateField} onPress={() => setShowDatePicker(true)}>
                <Text style={date ? styles.dateText : styles.datePlaceholder}>
                  {date
                    ? dateEstimated
                      ? `~ ${parseISODate(date).toLocaleDateString(LOCALE_TAG, {
                          month: 'short',
                          year: 'numeric',
                        })}`
                      : formatDate(parseISODate(date))
                    : t('plan.wizard.selectDate')}
                </Text>
              </Pressable>
            </View>

            <Pressable style={styles.noDateButton} onPress={handleNoDate}>
              <Text style={styles.noDateText}>{t('plan.wizard.noDateYet')}</Text>
            </Pressable>

            {showApproxPicker && (
              <View style={styles.approxDate}>
                <Text style={styles.inputLabel}>{t('plan.wizard.approxDateHint')}</Text>
                <View style={styles.chipGrid}>
                  {[0, 1, 2, 3].map((offset) => {
                    const year = currentYear + offset;
                    return (
                      <Chip
                        key={year}
                        label={String(year)}
                        selected={approxYear === year}
                        onPress={() => selectApproxYear(year)}
                      />
                    );
                  })}
                </View>
                <View style={styles.chipGrid}>
                  {approxMonths.map(({ month, label }) => {
                    const disabled =
                      (approxYear ?? currentYear) === currentYear && month <= currentMonth;
                    return (
                      <Pressable
                        key={month}
                        disabled={disabled}
                        onPress={() => selectApproxMonth(month)}
                        style={[
                          styles.chip,
                          approxMonth === month && styles.chipSelected,
                          disabled && styles.chipDisabled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            approxMonth === month && styles.chipTextSelected,
                            disabled && styles.chipTextDisabled,
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

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

        {stepId === 'type' && (
          <View style={styles.setup}>
            <Text style={styles.setupTitle}>{t('plan.wizard.typeTitle')}</Text>
            <Text style={styles.setupSubtitle}>{t('plan.wizard.typeSubtitle')}</Text>

            <View style={styles.optionList}>
              {WEDDING_TYPE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  icon={option.icon}
                  label={option.label}
                  selected={weddingType === option.id}
                  onPress={() => setWeddingType(option.id)}
                />
              ))}
            </View>
          </View>
        )}

        {stepId === 'vibe' && (
          <View style={styles.setup}>
            <Text style={styles.setupTitle}>{t('plan.wizard.step2Title')}</Text>
            <Text style={styles.setupSubtitle}>
              {t('plan.wizard.step2Subtitle')}
            </Text>

            <Text style={styles.inputLabel}>{t('plan.wizard.mainColor')}</Text>
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

            <Text style={styles.inputLabel}>{t('plan.wizard.style')}</Text>
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

        {stepId === 'season' && (
          <View style={styles.setup}>
            <Text style={styles.setupTitle}>{t('plan.wizard.step3Title')}</Text>
            <Text style={styles.setupSubtitle}>
              {t('plan.wizard.step3Subtitle')}
            </Text>

            <Text style={styles.inputLabel}>{t('plan.wizard.season')}</Text>
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

            <Text style={styles.inputLabel}>{t('plan.wizard.dreamHoneymoon')}</Text>
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

        {stepId === 'guests' && (
          <View style={styles.setup}>
            <Text style={styles.setupTitle}>{t('plan.wizard.step4Title')}</Text>
            <Text style={styles.setupSubtitle}>
              {t('plan.wizard.step4Subtitle')}
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

        {stepId === 'budget' && (
          <View style={styles.setup}>
            <Text style={styles.setupTitle}>{t('plan.wizard.step5Title')}</Text>
            <Text style={styles.setupSubtitle}>
              {t('plan.wizard.step5Subtitle')}
            </Text>

            {/* The amount is the subject of the step: big and centred, with
                the slider right under it. Digits roll as it changes. */}
            <View style={[styles.budgetHero, notSure && styles.budgetHeroDimmed]}>
              <Text style={styles.budgetSymbol}>{CURRENCY_SYMBOL}</Text>
              <NumericText
                value={budget ?? DEFAULT_BUDGET}
                format={budgetDigits}
                fontSize={BUDGET_FONT}
                style={styles.budgetValue}
              />
            </View>

            <View style={styles.budgetSlider}>
              <StepSlider
                count={BUDGET_STOPS.length}
                index={budgetStopIndex(budget ?? DEFAULT_BUDGET)}
                onChange={pickBudgetStop}
                dimmed={notSure}
              />
              <View style={styles.budgetRange}>
                <Text style={styles.budgetRangeText}>{compactUsd(BUDGET_STOPS[0])}</Text>
                <Text style={styles.budgetRangeText}>
                  {compactUsd(BUDGET_STOPS[BUDGET_STOPS.length - 1])}+
                </Text>
              </View>
            </View>

            <Pressable onPress={handleNotSure} style={styles.notSureButton}>
              <Text style={styles.notSureText}>{t('plan.wizard.notSureYet')}</Text>
            </Pressable>
          </View>
        )}

        {stepId === 'booked' && (
          <View style={styles.setup}>
            <Text style={styles.setupTitle}>{t('plan.wizard.step6Title')}</Text>
            <Text style={styles.setupSubtitle}>
              {t('plan.wizard.step6Subtitle')}
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
                label={t('plan.wizard.nothingYet')}
                selected={bookedIds.includes(NONE_BOOKED)}
                onPress={() => toggleBooked(NONE_BOOKED)}
              />
            </View>
          </View>
        )}

        {stepId === 'worry' && (
          <View style={styles.setup}>
            <Text style={styles.setupTitle}>{t('plan.wizard.worryTitle')}</Text>
            <Text style={styles.setupSubtitle}>{t('plan.wizard.worrySubtitle')}</Text>

            <View style={styles.optionList}>
              {WORRY_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  icon={option.icon}
                  label={option.label}
                  selected={worry === option.id}
                  onPress={() => setWorry(option.id)}
                />
              ))}
            </View>
          </View>
        )}

        {stepId === 'source' && (
          <View style={styles.setup}>
            <Text style={styles.setupTitle}>{t('plan.wizard.step7Title')}</Text>
            <Text style={styles.setupSubtitle}>
              {t('plan.wizard.step7Subtitle')}
            </Text>

            <View style={styles.sourceList}>
              {SOURCE_OPTIONS.map((option) => {
                const selected = source === option.id;
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.sourceRow, selected && styles.sourceRowSelected]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSource(option.id);
                    }}
                  >
                    <SourceLogo option={option.id} />
                    <Text
                      style={[styles.sourceLabel, selected && styles.sourceLabelSelected]}
                    >
                      {option.label}
                    </Text>
                    {selected && (
                      <View style={styles.sourceCheck}>
                        <Check size={14} color={colors.white} strokeWidth={3} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        </View>

        <Pressable
          style={[styles.primaryButton, !valid && styles.primaryButtonDisabled]}
          onPress={step < WIZARD_STEPS.length - 1 ? () => setStep((prev) => prev + 1) : startBuild}
          disabled={!valid}
        >
          <Text style={styles.primaryButtonText}>
            {step < WIZARD_STEPS.length - 1
              ? t('plan.wizard.continue')
              : t('plan.wizard.buildMyPlan')}
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

function OptionCard({
  icon: Icon,
  label,
  selected,
  onPress,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
    >
      <Icon
        size={22}
        color={selected ? colors.accentDeep : colors.textSecondary}
        strokeWidth={2}
      />
      <Text style={[styles.optionCardText, selected && styles.optionCardTextSelected]}>
        {label}
      </Text>
      {selected && <Check size={16} color={colors.accentDeep} strokeWidth={3} />}
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
          <Text style={styles.cancelText}>{t('plan.cancel')}</Text>
        </Pressable>
      )}
      <Text style={styles.setupTitle}>{t('plan.form.title')}</Text>
      <Text style={styles.setupSubtitle}>{t('plan.form.subtitle')}</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('plan.wizard.yourName')}</Text>
        <TextInput
          style={styles.input}
          value={partnerA}
          onChangeText={setPartnerA}
          placeholder={t('plan.wizard.yourFirstNamePlaceholder')}
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('plan.wizard.partnerName')}</Text>
        <TextInput
          style={styles.input}
          value={partnerB}
          onChangeText={setPartnerB}
          placeholder={t('plan.wizard.partnerFirstNamePlaceholder')}
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('plan.wizard.weddingDate')}</Text>
        <Pressable style={styles.dateField} onPress={() => setShowDatePicker(true)}>
          <Text style={date ? styles.dateText : styles.datePlaceholder}>
            {date ? formatDate(parseISODate(date)) : t('plan.wizard.selectDate')}
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
        <Text style={styles.primaryButtonText}>{t('plan.form.saveChanges')}</Text>
      </Pressable>
    </View>
  );
}

// ---------- Plan View ----------

function PlanView({ onEdit }: { onEdit: () => void }) {
  const store = usePlannerStore();
  const plannerData = usePlanner();
  const weddingDate = store.weddingDate!;
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
    const phase = plannerData?.phases.find((p) =>
      p.tasks.some((entry) => entry.task.id === id),
    );
    const entry = phase?.tasks.find((e) => e.task.id === id);
    if (entry?.state === 'pending') {
      const finishesPhase = phase && phase.done + 1 === phase.total;
      if (finishesPhase) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      Haptics.selectionAsync();
    }
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
    Alert.alert(t('plan.resetAlert.title'), t('plan.resetAlert.message'), [
      { text: t('plan.cancel'), style: 'cancel' },
      {
        text: t('plan.reset'),
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
      ? t('plan.progress.essentialsLeft', { count: planner.essentialsLeft })
      : t('plan.progress.noEssentialsLeft');

  const guestEstimate = store.guestEstimate;
  const guestSub = !guests.invited
    ? t('plan.progress.yourList')
    : guestEstimate !== null && guests.invited < guestEstimate
      ? t('plan.progress.ofPlanned', { count: guestEstimate })
      : t('plan.progress.attending');

  const nextPhase = planner.next
    ? planner.phases.find((phase) =>
        phase.tasks.some((entry) => entry.task.id === planner.next!.id),
      )
    : undefined;

  return (
    <View style={styles.plan}>
      {/* Header: the couple, the date and the two wedding-level actions */}
      <View style={styles.planHeader}>
        <View style={styles.planHeaderCopy}>
          <Text style={styles.planHeaderNames} numberOfLines={1}>
            {store.partnerA} & {store.partnerB}
          </Text>
          <Text style={styles.planHeaderDate}>
            {store.dateEstimated
              ? `~ ${parseISODate(weddingDate).toLocaleDateString(LOCALE_TAG, {
                  month: 'short',
                  year: 'numeric',
                })}`
              : formatDate(parseISODate(weddingDate))}
          </Text>
        </View>
        <PressableScale style={styles.planHeaderButton} onPress={pickCover} hitSlop={6}>
          <Camera size={18} color={colors.accentDeep} />
        </PressableScale>
        <PressableScale style={styles.planHeaderButton} onPress={onEdit} hitSlop={6}>
          <Pencil size={18} color={colors.accentDeep} />
        </PressableScale>
      </View>

      {/* Progress row */}
      <View style={styles.progressRow}>
        <ProgressCard
          icon={ListChecks}
          label={t('plan.progress.tasks')}
          value={`${planner.doneCount}/${planner.total}`}
          sub={tasksSub}
        />
        <ProgressCard
          icon={Users}
          label={t('plan.progress.guests')}
          value={guests.invited ? `${guests.attending}/${guests.invited}` : t('plan.progress.add')}
          sub={guestSub}
          onPress={() => router.push('/guests')}
        />
        <ProgressCard
          icon={Wallet}
          label={t('plan.progress.budget')}
          value={budgetTotal ? compactUsd(budgetSpent) : t('plan.progress.set')}
          sub={budgetTotal ? t('plan.progress.ofTotal', { total: compactUsd(budgetTotal) }) : t('plan.progress.yourBudget')}
          onPress={() => router.push('/budget')}
        />
      </View>

      {/* Overdue */}
      {planner.overdue > 0 && (
        <View style={styles.overdueBanner}>
          <Text style={styles.overdueText}>
            {t('plan.overdueText', { count: planner.overdue })}
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
            <Text style={styles.nextLabel}>{t('plan.next.upNextLabel')}</Text>
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
              <Text style={styles.nextMarkDoneText}>{t('plan.next.markDone')}</Text>
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
          <Text style={styles.timelineTitle}>{t('plan.timelineCard.title')}</Text>
          <Text style={styles.timelineSubtitle}>
            {t('plan.timelineCard.subtitle')}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.textTertiary} />
      </Pressable>

      {/* Phases */}
      <LayoutAnimationConfig skipEntering>
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
      </LayoutAnimationConfig>

      {/* Reset */}
      <Animated.View layout={REFLOW}>
        <Pressable onPress={handleReset} style={styles.resetButton}>
          <Text style={styles.resetText}>{t('plan.reset')}</Text>
        </Pressable>
      </Animated.View>
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
      <Text style={styles.aboutTitle}>{t('plan.about.title')}</Text>
      <View style={styles.aboutGrid}>
        {VIBE_FIELDS.map(({ field, label }) => {
          const Icon = VIBE_ICONS[field];
          const option = vibeOption(field, vibe[field]);
          return (
            <PressableScale
              key={field}
              style={styles.aboutTile}
              onPress={() => setEditing(field)}
            >
              {field === 'color' && option?.hex ? (
                <View style={[styles.aboutSwatch, { backgroundColor: option.hex }]} />
              ) : (
                <Icon size={20} color={colors.accentDeep} strokeWidth={2} />
              )}
              <Text style={styles.aboutLabel} numberOfLines={1} adjustsFontSizeToFit>
                {label.toUpperCase()}
              </Text>
              <Text
                style={[styles.aboutValue, !option && styles.aboutValueEmpty]}
                numberOfLines={1}
              >
                {option?.label ?? t('plan.about.add')}
              </Text>
            </PressableScale>
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
                <Text style={styles.notSureText}>{t('plan.about.clear')}</Text>
              </Pressable>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
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
    <PressableScale style={styles.progressCard} onPress={onPress} disabled={!onPress}>
      <Icon size={18} color={colors.accentDeep} strokeWidth={2.2} />
      <Text style={styles.progressLabel}>{label}</Text>
      <Text style={styles.progressValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.progressSub} numberOfLines={2}>
        {sub}
      </Text>
    </PressableScale>
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
    <Animated.View style={styles.phaseSection} layout={REFLOW}>
      <Pressable
        style={styles.phaseHeader}
        onPress={() => {
          Haptics.selectionAsync();
          onToggleCollapse();
        }}
      >
        <View style={styles.phaseHeaderLeft}>
          <View style={styles.phaseTitleLine}>
            <Text style={styles.phaseTitle}>
              {phase.phase.title}
              {phase.isCurrent && <Text style={styles.phaseNow}>  {t('plan.phase.now')}</Text>}
            </Text>
            {phase.isPast && pending > 0 && (
              <View style={styles.overdueTag}>
                <Text style={styles.overdueTagText}>{t('plan.phase.overdueTag', { count: pending })}</Text>
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
          <Animated.View
            style={{
              transform: [{ rotate: collapsed ? '-90deg' : '0deg' }],
              transitionProperty: 'transform',
              transitionDuration: 200,
              transitionTimingFunction: 'ease-out',
            }}
          >
            <ChevronDown size={18} color={colors.textSecondary} />
          </Animated.View>
        </View>
      </Pressable>

      <View style={styles.phaseProgressBar}>
        <Animated.View
          style={[
            styles.phaseProgressFill,
            {
              width: `${phase.percent}%`,
              transitionProperty: 'width',
              transitionDuration: 260,
              transitionTimingFunction: 'ease-out',
            },
          ]}
        />
      </View>

      {!collapsed && (
        <Animated.View entering={ROWS_IN} exiting={ROWS_OUT} style={styles.phaseRows}>
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
            <Text style={styles.addTaskText}>{t('plan.phase.addTask')}</Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// Expanding or collapsing a phase: the rows fade in a few points down, and
// everything below glides to its new place instead of jumping.
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const REFLOW = LinearTransition.duration(240).easing(EASE_OUT);
const ROWS_IN = FadeIn.duration(200).easing(EASE_OUT).withInitialValues({
  opacity: 0,
  transform: [{ translateY: -6 }],
});
const ROWS_OUT = FadeOut.duration(120);

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
      <TaskCheck
        state={state}
        onPress={() => onToggleDone(task.id)}
        onLongPress={() => onLongPress(task.id, state)}
        style={styles.checkbox}
        doneStyle={styles.checkboxDone}
        skippedStyle={styles.checkboxSkipped}
        doneMark={<Check size={16} color={colors.white} strokeWidth={3} />}
        skippedMark={<View style={styles.skipMark} />}
      />

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
              <Text style={styles.essentialTagText}>{t('plan.taskRow.essential')}</Text>
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

        {isSkipped && <Text style={styles.taskSkippedLabel}>{t('plan.taskRow.skipped')}</Text>}
      </Pressable>

      <ChevronRight size={18} color={colors.textTertiary} style={styles.taskChevron} />
    </View>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(LOCALE_TAG, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ---------- Styles ----------

// Every block's content starts INSET in from the page padding: the cards'
// inner padding, and the same inset on the free-standing rows (header, phases,
// tasks), so all text and icons line up on one left edge.
const INSET = 16;

const styles = StyleSheet.create({
  // Opaque: with the keyboard up, KeyboardAvoidingView pads the bottom and that
  // strip showed whatever sat behind the tab (the welcome screen's headline).
  flex: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
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
  wizardBody: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  setup: {
    gap: 16,
  },
  setupTitle: {
    fontFamily: typography.fonts.title,
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
    padding: INSET,
    gap: 12,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  aboutTitle: {
    fontFamily: typography.fonts.title,
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
    paddingVertical: 12,
    paddingHorizontal: 4,
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
    fontFamily: typography.fonts.title,
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
  chipDisabled: {
    opacity: 0.35,
  },
  chipTextDisabled: {
    color: colors.textTertiary,
  },
  noDateButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  noDateText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    color: colors.accentDeep,
  },
  approxDate: {
    gap: 10,
  },
  optionList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionCardSelected: {
    backgroundColor: '#FBEEF0',
    borderColor: colors.accentDeep,
  },
  optionCardText: {
    flex: 1,
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  optionCardTextSelected: {
    fontFamily: typography.fonts.semibold,
    color: colors.accentDeep,
  },
  sourceList: {
    gap: 10,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  sourceRowSelected: {
    backgroundColor: '#FBEEF0',
    borderColor: colors.accentDeep,
  },
  sourceLabel: {
    flex: 1,
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.h3,
    color: colors.textPrimary,
  },
  sourceLabelSelected: {
    fontFamily: typography.fonts.semibold,
    color: colors.accentDeep,
  },
  sourceCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accentDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetHero: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 24,
  },
  budgetHeroDimmed: {
    opacity: 0.35,
  },
  budgetSymbol: {
    fontFamily: typography.fonts.semibold,
    fontSize: 24,
    color: colors.textSecondary,
    marginTop: 10,
  },
  budgetValue: {
    fontFamily: typography.fonts.bold,
    fontSize: BUDGET_FONT,
    lineHeight: BUDGET_FONT * 1.15,
    letterSpacing: -1.5,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  budgetSlider: {
    gap: 8,
    marginTop: 8,
  },
  budgetRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetRangeText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
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
  planHeader: {
    flexDirection: 'row',
    paddingHorizontal: INSET,
    alignItems: 'center',
    gap: 10,
  },
  planHeaderCopy: {
    flex: 1,
  },
  planHeaderNames: {
    fontFamily: typography.fonts.title,
    fontSize: 28,
    color: colors.textPrimary,
  },
  planHeaderDate: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  planHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 10,
  },
  progressCard: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: INSET,
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
    padding: INSET,
  },
  overdueText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.body,
    color: colors.error,
  },
  nextCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: INSET,
    gap: 14,
    shadowColor: '#2E2429',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  nextInfo: {},
  nextLabel: {
    fontFamily: typography.fonts.semibold,
    fontSize: 11,
    color: colors.accentDeep,
    letterSpacing: 1,
    marginBottom: 4,
  },
  nextTitle: {
    fontFamily: typography.fonts.title,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
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
    padding: INSET,
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
    fontFamily: typography.fonts.title,
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
    paddingHorizontal: INSET,
  },
  phaseRows: {
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
    fontFamily: typography.fonts.title,
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
