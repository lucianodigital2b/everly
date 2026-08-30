import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Reanimated, {
  Easing as ReEasing,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useQueryClient } from "@tanstack/react-query";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { PhonePreview } from "../../components/PhonePreview";
import { ShotsPerPerson } from "../../components/ShotsPerPerson";
import { CoverPicker } from "../../components/CoverPicker";
import { SuccessSheet } from "../../components/SuccessSheet";
import { Input } from "../../components/Input";
import { useIsFocused, useRouter } from "expo-router";
import { colors } from "../../constants/colors";
import { joinLink } from "../../constants/links";
import { FILTERS, getFilterMatrix, type FilterKey } from "../../constants/filters";
import { FilteredImage } from "../../components/FilteredImage";
import { TiltedEventTypeCards } from "../../components/TiltedEventTypeCards";
import { eventsApi } from "../../services/api";
import { revenueCat } from "../../services/revenuecat";
import { appsFlyerService } from "../../services/appsflyer";
import { captureStore } from "../../zustand/capture-store";
import { retryFailedUploads } from "../../zustand/capture-store/uploader";
import { authStore } from "../../zustand/auth-store";
import {
  COVER_PRESETS,
  coverUploadFile,
  FILTER_PREVIEW_IMAGE,
  isHostedCover,
  REVEAL_PREVIEW_IMAGES,
} from "../../constants/sampleImages";
import { suggestEventNames } from "../../constants/nameSuggestions";
import {
  GUEST_TIERS,
  type GuestTier as GuestTierShape,
} from "../../constants/guestTiers";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarClock,
  Hourglass,
  Lock,
  Minus,
  Plus,
  Zap,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  {
    title: "What's the\noccasion?",
    subtitle: "Give your moment a name and type.",
  },
  {
    title: "Choose the\nreveal moment.",
    // Replaced at render time by the copy for the selected mode — see REVEAL_COPY.
    subtitle: "Decide when guests get to see the gallery.",
  },
  {
    title: "How many\nshots?",
    subtitle: "Limit photos per guest, or leave blank for unlimited.",
  },
  {
    title: "Set\nthe mood.",
    subtitle: "All guests will shoot with this filter for a cohesive album.",
  },
  {
    title: "Add a\ncover photo.",
    subtitle: "This is how your event will look to guests.",
  },
  {
    title: "Who's\ninvited?",
    subtitle: "Choose how many guests can join your event.",
  },
];

// Ordered roughly by how often people actually create them. Every entry needs a
// photo in EVENT_TYPE_IMAGE and, ideally, a suggestion pack in
// constants/nameSuggestions.ts — a type with neither still works, it just falls
// back to a blank card and the generic names.
const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Party",
  "Trip",
  "Anniversary",
  "Graduation",
  "Engagement",
  "Baby Shower",
  "Sweet 15",
  "Reunion",
  "Corporate",
  "Holiday",
  "Other",
];
// `mode` is sent to the API as `reveal_time`, so those strings are fixed.
const REVEAL_OPTIONS = [
  { mode: "Instant", icon: Zap, line1: "During", line2: "the event" },
  { mode: "End of Event", icon: Hourglass, line1: "After", line2: "the event" },
  { mode: "Scheduled", icon: CalendarClock, line1: "At a set", line2: "time" },
] as const;

// The subtitle under the step heading describes the choice that's selected,
// so the preview above and the words below always say the same thing.
const REVEAL_COPY: Record<string, string> = {
  "": "Pick when the photos become visible. Until then, nobody sees a thing.",
  Instant:
    "Every photo appears the moment it's taken — guests watch the album fill up live.",
  "End of Event":
    "Photos stay hidden until the event ends. Then the whole gallery opens at once.",
  Scheduled:
    "Photos stay hidden until the time you set. Then the whole gallery opens at once.",
};

// ─── Name-idea motion ─────────────────────────────────────────────────────────

const IDEA_EASE = ReEasing.bezier(0.23, 1, 0.32, 1);
/** The row sits just under the name field, so it comes from and leaves upward. */
const IDEA_SLIDE = 14;

// Taking a suggestion fills the field and the row has no reason to exist any
// more — but vanishing on the same frame as the tap reads as a glitch. It slides
// back up behind the field instead.
const ideasIn = (reduced: boolean) => () => {
  "worklet";
  return {
    initialValues: {
      opacity: 0,
      transform: [{ translateY: reduced ? 0 : -IDEA_SLIDE }],
    },
    animations: {
      opacity: withTiming(1, { duration: 200, easing: IDEA_EASE }),
      transform: [
        { translateY: withSpring(0, { duration: 400, dampingRatio: 0.85 }) },
      ],
    },
  };
};

const ideasOut = (reduced: boolean) => () => {
  "worklet";
  return {
    initialValues: { opacity: 1, transform: [{ translateY: 0 }] },
    animations: {
      opacity: withTiming(0, { duration: 160, easing: IDEA_EASE }),
      transform: [
        {
          translateY: withTiming(reduced ? 0 : -IDEA_SLIDE, {
            duration: 200,
            easing: IDEA_EASE,
          }),
        },
      ],
    },
  };
};

// A step block leaves the tree the instant the wizard commits the next step —
// but any descendant still running an `exiting` animation (the shot counter's
// rolling digits on step 2, the name-idea chips on step 0) makes Reanimated
// hold the *whole* outgoing block in the tree until that finishes. The step
// content all shares one animated container, so the incoming step's fade-in
// then fades the leftover back in with it: the camera deck from "How many
// shots?" reappears over "Set the mood" for a beat and pops away. Zeroing the
// block's own opacity as it leaves makes that tail invisible no matter what its
// children are still animating.
const stepBlockOut = () => {
  "worklet";
  return {
    initialValues: { opacity: 0 },
    animations: { opacity: withTiming(0, { duration: 1 }) },
  };
};

// ─── Reusable sub-components ──────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: string }) => (
  <Text
    style={{
      fontFamily: "Inter-ExtraBold",
      fontSize: 11,
      color: colors.textSecondary,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 10,
    }}
  >
    {children}
  </Text>
);

const HintText = ({ children }: { children: string }) => (
  <Text
    style={{
      fontFamily: "Inter-Regular",
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 14,
      lineHeight: 20,
      opacity: 0.7,
    }}
  >
    {children}
  </Text>
);

const DatePickerRow = ({
  value,
  placeholder,
  onPress,
}: {
  value: string | null;
  placeholder: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: value ? colors.accent : "rgba(30,24,16,0.08)",
      paddingHorizontal: 16,
      height: 56,
      marginBottom: 24,
    }}
  >
    <Calendar
      size={18}
      color={value ? colors.accent : colors.textSecondary}
      style={{ marginRight: 12 }}
    />
    <Text
      style={{
        fontFamily: "Inter-Regular",
        fontSize: 15,
        color: value ? colors.textPrimary : colors.textSecondary,
        flex: 1,
      }}
    >
      {value ?? placeholder}
    </Text>
  </TouchableOpacity>
);

// ─── Reveal preview ───────────────────────────────────────────────────────────

// Two stand-in guest shots. Showing the *effect* of the choice — frosted and
// locked, or open — says more than three buttons ever could.
const REVEAL_PREVIEW = [
  { uri: REVEAL_PREVIEW_IMAGES[0], name: "Emma L." },
  { uri: REVEAL_PREVIEW_IMAGES[1], name: "James W." },
];

const RevealPreview = ({ mode }: { mode: string }) => {
  // Anything but "Instant" — including nothing chosen yet — keeps them hidden.
  const hidden = mode !== "Instant";

  // 0 = photos open, 1 = withheld. Both layers stay mounted and cross-fade, so
  // the frost lands on the photo instead of replacing it.
  const veil = useSharedValue(hidden ? 1 : 0);
  // Fires on every mode change — including one hidden mode to another, where
  // the frost doesn't move — so a tap always registers on the photos.
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    veil.set(
      withTiming(hidden ? 1 : 0, { duration: 340, easing: IDEA_EASE })
    );
  }, [hidden, veil]);

  React.useEffect(() => {
    pulse.set(0.97);
    pulse.set(withSpring(1, { duration: 350, dampingRatio: 0.6 }));
  }, [mode, pulse]);

  // One animated style object per role, created once and shared by all three
  // preview cards. Because these are stable across renders, the wizard
  // re-rendering on every keystroke no longer re-attaches the animated nodes —
  // that re-attach was the flicker.
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.get() }],
  }));
  const openStyle = useAnimatedStyle(() => ({ opacity: 1 - veil.get() }));
  const veilStyle = useAnimatedStyle(() => ({ opacity: veil.get() }));
  const lockStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.55 + veil.get() * 0.45 }],
  }));

  return (
    <View style={{ flexDirection: "row", gap: 12, marginBottom: 26 }}>
      {REVEAL_PREVIEW.map((p) => (
        <Reanimated.View
          key={p.name}
          style={[previewStyles.card, pulseStyle]}
        >
          <Image
            source={{ uri: p.uri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            fadeDuration={0}
          />

          {/* Open: scrim under the name */}
          <Reanimated.View
            style={[StyleSheet.absoluteFill, openStyle]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={["transparent", "rgba(20,12,8,0.6)"]}
              locations={[0.55, 1]}
              style={StyleSheet.absoluteFill}
            />
          </Reanimated.View>

          {/* Withheld: frost + lock */}
          <Reanimated.View
            style={[StyleSheet.absoluteFill, veilStyle]}
            pointerEvents="none"
          >
            <BlurView
              intensity={48}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            {/* expo-blur is thin on some Android builds; the wash guarantees
                the shot reads as withheld either way. */}
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(251,248,245,0.42)" },
              ]}
            />
            <Reanimated.View style={[previewStyles.lock, lockStyle]}>
              <Lock size={15} color={colors.accentDeep} strokeWidth={2.2} />
            </Reanimated.View>
          </Reanimated.View>

          {/* Two colourways of the name, cross-faded with the frost. */}
          <Reanimated.Text
            style={[previewStyles.name, previewStyles.nameOpen, openStyle]}
          >
            {p.name}
          </Reanimated.Text>
          <Reanimated.Text
            style={[previewStyles.name, previewStyles.nameHidden, veilStyle]}
          >
            {p.name}
          </Reanimated.Text>
        </Reanimated.View>
      ))}
    </View>
  );
};

const previewStyles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 0.8,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: colors.surface2,
  },
  lock: {
    position: "absolute",
    top: "50%",
    alignSelf: "center",
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    position: "absolute",
    left: 12,
    bottom: 11,
    fontFamily: "Inter-SemiBold",
    fontSize: 13,
  },
  nameOpen: { color: "#fff" },
  nameHidden: { color: colors.textSecondary },
});

// ─── Reveal option tile ───────────────────────────────────────────────────────

const RevealTile = ({
  option,
  selected,
  onPress,
}: {
  option: (typeof REVEAL_OPTIONS)[number];
  selected: boolean;
  onPress: () => void;
}) => {
  const Icon = option.icon;
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ scale: scale.get() }],
  }));

  // Press-in dents it, press-out springs it home — the feedback lands on the
  // touch instead of after it, and there is no two-stage sequence to interrupt.
  const pressIn = () => {
    scale.set(withTiming(0.94, { duration: 110, easing: IDEA_EASE }));
  };
  const pressOut = () => {
    scale.set(withSpring(1, { duration: 350, dampingRatio: 0.7 }));
  };

  return (
    <Reanimated.View style={animated}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        style={[tileStyles.tile, selected && tileStyles.tileOn]}
      >
        <Icon
          size={20}
          color={selected ? colors.accentDeep : colors.textSecondary}
          strokeWidth={2}
        />
        <Text style={[tileStyles.label, selected && tileStyles.labelOn]}>
          {option.line1}
          {"\n"}
          {option.line2}
        </Text>
      </TouchableOpacity>
    </Reanimated.View>
  );
};

const tileStyles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 104,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(30,24,16,0.08)",
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: "space-between",
  },
  tileOn: {
    borderColor: colors.accent,
    backgroundColor: "rgba(230,169,180,0.12)",
  },
  label: {
    fontFamily: "Inter-SemiBold",
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  labelOn: { color: colors.textPrimary },
});

// The mood step's photo is the subject of the step, so it gets the room: one
// large centred card, with the presets reduced to swatches of that same photo
// underneath. Declared here because `styles` below reads them at module init.
const FILTER_HERO_W = Math.min(SCREEN_WIDTH - 88, 300);
const FILTER_HERO_H = Math.round(FILTER_HERO_W * 1.24);
const FILTER_THUMB = 60;

const styles = StyleSheet.create({
  ideaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: -14,
    marginBottom: 24,
  },
  idea: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: "rgba(46,36,41,0.06)",
  },
  ideaText: {
    fontFamily: "Inter-Medium",
    fontSize: 13,
    color: colors.accentDeep,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(30,24,16,0.07)",
    marginTop: 28,
    marginBottom: 22,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  toggleText: {
    flex: 1,
    fontFamily: "Inter-Regular",
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  filterHero: {
    alignSelf: "center",
    width: FILTER_HERO_W,
    height: FILTER_HERO_H,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: colors.surface2,
    shadowColor: "#7A4450",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 8,
  },
  filterThumbRing: {
    padding: 3,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "transparent",
  },
  filterThumb: {
    width: FILTER_THUMB,
    height: FILTER_THUMB,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.surface2,
  },
});

// ─── Filter hero + thumbnails ─────────────────────────────────────────────────

// Fallback for the rare case the cover has been cleared by the time the mood
// step is reached — the step is about a photo, so it always needs one.
const FILTER_PREVIEW_URI = FILTER_PREVIEW_IMAGE;

const FilterHero = ({
  uri,
  filter,
}: {
  uri: string;
  filter: FilterKey;
}) => {
  return (
    <View style={styles.filterHero}>
      <FilteredImage
        uri={uri}
        matrix={getFilterMatrix(filter)}
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
};

const FilterThumb = ({
  item,
  uri,
  selected,
  onPress,
}: {
  item: (typeof FILTERS)[number];
  uri: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={{ alignItems: "center" }}
  >
    {/* The ring sits outside the thumbnail, so selecting never nudges the
        image's own framing. */}
    <View
      style={[
        styles.filterThumbRing,
        selected && { borderColor: colors.accent },
      ]}
    >
      <View style={styles.filterThumb}>
        <FilteredImage
          uri={uri}
          matrix={item.matrix}
          style={{ width: "100%", height: "100%" }}
        />
      </View>
    </View>
    <Text
      style={{
        marginTop: 7,
        fontFamily: selected ? "Inter-ExtraBold" : "Inter-Medium",
        fontSize: 12,
        color: selected ? colors.accent : colors.textSecondary,
      }}
    >
      {item.label}
    </Text>
  </TouchableOpacity>
);

// The tier table itself lives in constants/guestTiers so the event settings
// sheet can sell the same packs against an event that already exists.
type GuestTier = GuestTierShape;

/** An event created by this wizard run, held until the flow actually finishes. */
type PendingCreatedEvent = {
  id: number;
  token: string;
  shotLimit?: number;
  /** Serialized body last sent for it, so a retry only PATCHes real edits. */
  sentBody: string;
};

type PurchaseFailure = "cancelled" | "unavailable" | "failed";
type PurchaseOutcome = { purchased: boolean; reason?: PurchaseFailure };

type WizardForm = {
  name: string;
  type: string;
  expires_at: Date | null;
  revealMode: string;
  revealDate: Date | null;
  shotLimit: string;
  participantLimit: string;
  filter: FilterKey;
  coverImage: string | null;
  /** Sent as the event's `public` flag — everyone sees every photo. */
  publicGallery: boolean;
};

const emptyForm = (): WizardForm => ({
  name: "",
  type: "",
  expires_at: null,
  revealMode: "",
  revealDate: null,
  // A roll of 10 — enough for a night out, few enough that guests aim. "" is
  // unlimited, so the default has to be spelled out.
  shotLimit: "10",
  participantLimit: "",
  filter: "none",
  // The mock is never shown empty: it opens on the first stock cover so the
  // step reads as "swap this photo" rather than "figure out what goes here".
  coverImage: COVER_PRESETS[0].uri,
  publicGallery: true,
});

// The wizard's answers, held outside the component.
//
// `useState` only keeps them for as long as the screen stays mounted, and that
// isn't guaranteed across a store purchase: presenting the StoreKit sheet takes
// the app through inactive/background, and anything that tears this route down
// while it's away (a re-render at the router root, a dev reload) takes the whole
// form with it — which is how a cancelled purchase lands the user back on step 1
// with an empty form. This draft outlives the component; the screen seeds its
// state from it on mount and mirrors every change back into it. Cleared only by
// resetForm(), once a create actually completes.
const draft: {
  step: number;
  tierIndex: number;
  form: WizardForm;
  createdEvent: PendingCreatedEvent | null;
} = {
  step: 0,
  tierIndex: 0,
  form: emptyForm(),
  createdEvent: null,
};

// RevenueCat flags a dismissed store sheet on the thrown error. Older SDK
// versions nest it under userInfo, so check both — misreading a cancel as a
// hard failure only changes the wording of the prompt, but it's free to get right.
const isUserCancelled = (e: any) =>
  !!(e?.userCancelled ?? e?.userInfo?.userCancelled);

// ─── GuestStepper component ───────────────────────────────────────────────────

const GuestStepper = ({
  index,
  onChange,
}: {
  index: number;
  onChange: (index: number, tier: GuestTier) => void;
}) => {
  const tier = GUEST_TIERS[index];
  const canDec = index > 0;
  const canInc = index < GUEST_TIERS.length - 1;

  const reduced = useReducedMotion();

  // All four values live on the UI thread. The old version swapped the tier in
  // the *completion callback* of a 100ms fade-out, so the parent re-rendered
  // mid-flight and the whole block flashed. The tier now changes on the tap and
  // the new number simply slides in — instant feedback, one animation, no
  // render racing it.
  const titleOpacity = useSharedValue(1);
  const titleTranslate = useSharedValue(0);
  const priceScale = useSharedValue(1);
  const track = useSharedValue(index);

  const animateChange = (nextIndex: number, direction: 1 | -1) => {
    onChange(nextIndex, GUEST_TIERS[nextIndex]);

    if (!reduced) {
      titleTranslate.set(direction * 12);
      titleTranslate.set(withSpring(0, { duration: 400, dampingRatio: 0.8 }));
      priceScale.set(1.08);
      priceScale.set(withSpring(1, { duration: 400, dampingRatio: 0.55 }));
    }
    titleOpacity.set(0);
    titleOpacity.set(withTiming(1, { duration: 180, easing: IDEA_EASE }));

    track.set(withSpring(nextIndex, { duration: 500, dampingRatio: 0.9 }));
  };

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.get(),
    transform: [{ translateY: titleTranslate.get() }],
  }));
  const priceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: priceScale.get() }],
  }));
  // The fill is a childless view inside an `overflow: hidden` track, so nothing
  // else re-lays-out — and animating width rather than scaleX keeps the rounded
  // cap from smearing. On the UI thread it costs nothing; the old version drove
  // it from JS with `useNativeDriver: false`, one React frame at a time.
  const trackStyle = useAnimatedStyle(() => {
    const p = Math.min(Math.max(track.get() / (GUEST_TIERS.length - 1), 0), 1);
    return { width: `${p * 100}%` };
  });

  return (
    <View style={{ alignItems: "center" }}>
      {/* Main stepper row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          marginBottom: 32,
        }}
      >
        {/* Decrement */}
        <TouchableOpacity
          onPress={() => canDec && animateChange(index - 1, -1)}
          activeOpacity={canDec ? 0.7 : 1}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: canDec
              ? colors.backgroundSecondary
              : "rgba(30,24,16,0.03)",
            borderWidth: 1,
            borderColor: canDec ? "rgba(30,24,16,0.1)" : "rgba(30,24,16,0.04)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Minus
            size={20}
            color={canDec ? colors.textPrimary : "rgba(30,24,16,0.15)"}
            strokeWidth={2}
          />
        </TouchableOpacity>

        {/* Center display */}
        <Reanimated.View
          style={[
            { flex: 1, alignItems: "center", marginHorizontal: 16 },
            titleStyle,
          ]}
        >
          <Text
            style={{
              fontFamily: "Inter-ExtraBold",
              fontSize: 13,
              color: colors.accent,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            {tier.title}
          </Text>
          <Text
            style={{
              fontFamily: "Inter-ExtraBold",
              fontSize: 52,
              lineHeight: 56,
              color: colors.textPrimary,
              textAlign: "center",
            }}
          >
            {tier.participants === "custom" ? "∞" : String(tier.participants)}
          </Text>
          <Text
            style={{
              fontFamily: "Inter-Regular",
              fontSize: 13,
              color: colors.textSecondary,
              marginTop: 4,
            }}
          >
            {tier.participants === "custom" ? "custom guests" : "guests"}
          </Text>
        </Reanimated.View>

        {/* Increment */}
        <TouchableOpacity
          onPress={() => canInc && animateChange(index + 1, 1)}
          activeOpacity={canInc ? 0.7 : 1}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: canInc ? colors.accent : "rgba(30,24,16,0.03)",
            borderWidth: 1,
            borderColor: canInc ? colors.accent : "rgba(30,24,16,0.04)",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: canInc ? colors.accent : "transparent",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: canInc ? 0.35 : 0,
            shadowRadius: 10,
            elevation: canInc ? 6 : 0,
          }}
        >
          <Plus
            size={20}
            color={canInc ? "#fff" : "rgba(30,24,16,0.15)"}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      {/* Track */}
      <View
        style={{
          width: "100%",
          height: 3,
          backgroundColor: "rgba(30,24,16,0.06)",
          borderRadius: 2,
          marginBottom: 10,
          overflow: "hidden",
        }}
      >
        <Reanimated.View
          style={[
            { height: "100%", backgroundColor: colors.accent, borderRadius: 2 },
            trackStyle,
          ]}
        />
      </View>

      {/* Tier labels */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
          marginBottom: 28,
        }}
      >
        {GUEST_TIERS.map((t, i) => (
          <View
            key={t.title}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor:
                i <= index ? colors.accent : "rgba(30,24,16,0.12)",
            }}
          />
        ))}
      </View>

      {/* Price pill */}
      <Reanimated.View
        style={[
          {
            backgroundColor:
              tier.price === 0
                ? "rgba(30,24,16,0.05)"
                : "rgba(198,169,107,0.12)",
            borderRadius: 100,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor:
              tier.price === 0
                ? "rgba(30,24,16,0.08)"
                : "rgba(198,169,107,0.3)",
          },
          priceStyle,
        ]}
      >
        <Text
          style={{
            fontFamily: "Inter-SemiBold",
            fontSize: 15,
            color: tier.price === 0 ? colors.textSecondary : colors.accent,
            textAlign: "center",
          }}
        >
          {tier.price === 0 ? "Free" : `$${tier.price.toFixed(2)} one-time`}
        </Text>
      </Reanimated.View>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CreateScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  // This screen stays mounted behind the camera it pushes, so an autoFocus'd
  // field must never fire while it's in the background — that's a keyboard on
  // top of the viewfinder.
  const isFocused = useIsFocused();
  // Seeded from the module-level draft so a remount picks up where the user was.
  const [step, setStep] = useState(draft.step);
  const [tierIndex, setTierIndex] = useState(draft.tierIndex);
  const [isCreating, setIsCreating] = useState(false);
  const user = authStore((s) => s.data?.user);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // The camera pops back here with its captures in the store, and the event
  // they belong to sits in that same store.
  //
  // It used to live in `useState` here, which is what lost the photos: this
  // screen calls `resetForm()` the instant the camera is pushed and is free to
  // be torn down while it's in the background, so the roll came back to a
  // screen that no longer knew which event had just been created — the upload
  // effect below simply never fired and the shots were dropped on the floor.
  // The store outlives the component, so a remount picks the handoff back up.
  const pendingEvent = captureStore((s) => s.target);
  // The event created by the current wizard run, if any. It exists before the
  // guest pack is bought (the purchase has to be attributed to its id), so when
  // a purchase is cancelled it lives here until the flow completes — a retry
  // reuses it rather than creating a duplicate. Cleared by resetForm().
  const createdEventRef = useRef<PendingCreatedEvent | null>(draft.createdEvent);

  // The event that just landed, held while its confirmation sheet is up.
  const [successEvent, setSuccessEvent] = useState<PendingCreatedEvent | null>(
    null,
  );
  // Progress of the roll the camera is uploading in the background. Read only
  // to report failures — nothing in this screen waits on it.
  const uploads = captureStore((s) => s.uploads);
  const pendingUploads = uploads.filter((u) => u.status === "pending").length;
  const [formData, setFormData] = useState<WizardForm>(draft.form);

  // Mirror the answers into the draft on every change, so whatever the screen
  // survives — or doesn't — the next mount restores them.
  React.useEffect(() => {
    draft.step = step;
    draft.tierIndex = tierIndex;
    draft.form = formData;
  }, [step, tierIndex, formData]);

  const setCreatedEvent = (event: PendingCreatedEvent | null) => {
    createdEventRef.current = event;
    draft.createdEvent = event;
  };

  const [datePickerOpen, setDatePickerOpen] = useState<
    "expires_at" | "reveal" | null
  >(null);

  const reducedMotion = useReducedMotion();

  const slideAnim = useSharedValue(0);
  const fadeAnim = useSharedValue(1);
  const headerAnim = useSharedValue(0);
  // Which way the incoming step should fly in from, handed to the effect that
  // runs once React has actually committed that step.
  const enterDir = useRef(1);
  const firstStepRender = useRef(true);

  const stepContentStyle = useAnimatedStyle(() => ({
    flexGrow: 1,
    opacity: fadeAnim.get(),
    transform: [{ translateX: slideAnim.get() }],
  }));
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerAnim.get(),
    transform: [{ translateY: (1 - headerAnim.get()) * -8 }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: headerAnim.get(),
    transform: [{ translateY: (1 - headerAnim.get()) * 16 }],
  }));

  // Dev-only. If the wizard ever appears to "reset itself", this says whether
  // the screen was torn down (draft restores it) or something called resetForm.
  React.useEffect(() => {
    if (__DEV__) console.log("[create] wizard mounted at step", draft.step);
    return () => {
      if (__DEV__) console.log("[create] wizard unmounted");
    };
  }, []);

  React.useEffect(() => {
    headerAnim.set(
      withDelay(100, withSpring(1, { duration: 600, dampingRatio: 0.9 }))
    );
  }, [headerAnim]);

  // Track the keyboard so the floating CTA never hides behind it.
  React.useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const show = Keyboard.addListener(showEvent, (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // ─── Navigation ─────────────────────────────────────────────────────────────

  const commitStep = (nextStep: number, direction: number) => {
    enterDir.current = direction;
    setStep(nextStep);
  };

  const animateToStep = (nextStep: number) => {
    const direction = nextStep > step ? 1 : -1;

    if (reducedMotion) {
      commitStep(nextStep, direction);
      return;
    }

    slideAnim.set(
      withTiming(direction * -SCREEN_WIDTH * 0.25, {
        duration: 180,
        easing: IDEA_EASE,
      })
    );
    fadeAnim.set(
      withTiming(0, { duration: 150, easing: IDEA_EASE }, (finished) => {
        "worklet";
        if (finished) scheduleOnRN(commitStep, nextStep, direction);
      })
    );
  };

  // The step swap is a heavy re-render — a whole new form, its images and the
  // tilted card row. Starting the entrance from the fade-out's completion
  // callback meant it ran *while* React was still rendering that tree, and the
  // first frames were simply dropped: the step appeared to blink in.
  // Driving it from an effect instead starts the motion after the commit, with
  // the incoming content already laid out behind an opacity of 0.
  React.useEffect(() => {
    if (firstStepRender.current) {
      firstStepRender.current = false;
      return;
    }
    if (reducedMotion) {
      slideAnim.set(0);
      fadeAnim.set(withTiming(1, { duration: 150 }));
      return;
    }
    slideAnim.set(enterDir.current * SCREEN_WIDTH * 0.25);
    slideAnim.set(withSpring(0, { duration: 420, dampingRatio: 0.85 }));
    fadeAnim.set(withTiming(1, { duration: 220, easing: IDEA_EASE }));
  }, [step, reducedMotion, slideAnim, fadeAnim]);

  const goNext = () => {
    if (step < STEPS.length - 1) animateToStep(step + 1);
    else handleCreate();
  };

  const goBack = () => {
    if (step === 0) {
      // Create is a tab root — nothing to pop. Fall back to the events tab.
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)");
    } else animateToStep(step - 1);
  };

  // Rebuilt only when the account name or the chosen type changes.
  const nameIdeas = React.useMemo(
    () => suggestEventNames(user?.name, formData.type),
    [user?.name, formData.type]
  );

  const canContinue = () => {
    if (step === 0)
      return formData.name.trim().length > 0 && formData.type.length > 0;
    if (step === 1)
      return (
        formData.revealMode.length > 0 &&
        (formData.revealMode !== "Scheduled" || formData.revealDate !== null)
      );
    return true;
  };

  // ─── Image picker ────────────────────────────────────────────────────────────

  const pickCoverImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    // Portrait 9:16 — the cover fills a phone screen (in the step-4 mock and in
    // the guest's event view), so a landscape crop would be letterboxed away.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.85,
    });

    if (!result.canceled) {
      setFormData((prev) => ({ ...prev, coverImage: result.assets[0].uri }));
    }
  };

  // ─── Back from the camera ──────────────────────────────────

  // Nothing is uploaded here any more. The camera queues each shot the moment
  // it's taken (`capture-store/uploader`), so by the time the user is done the
  // roll is usually already on the server — and whatever is left finishes in
  // the background while they look at the event. That replaced a full-screen
  // "Adding your photos" spinner that made the user wait, after the fact, for
  // work that could have happened while they were shooting.
  //
  // So all this does is open the event. It runs for an empty roll too (the X,
  // or "Not now" on the permission prompt): the event is real and the user was
  // last watching it being created, so landing back on a blank wizard would
  // read as if it had been thrown away.
  //
  // Only after this screen has actually been backgrounded: `pendingEvent` is set
  // in the same tick the camera is pushed, so without the flag this would fire
  // before focus ever moves and hijack the navigation to the camera.
  const wentToCameraRef = useRef(false);

  React.useEffect(() => {
    if (!isFocused) {
      wentToCameraRef.current = true;
      return;
    }
    if (!wentToCameraRef.current) return;
    wentToCameraRef.current = false;

    if (!pendingEvent) return;

    const eventId = pendingEvent.eventId;
    // Drops the handoff, not the upload progress — the queue holds its own
    // copy of the destination and keeps going.
    captureStore.getState().clear();
    router.push(`/event/${eventId}`);
  }, [isFocused, pendingEvent]);

  // Report a roll that didn't fully make it. Deliberately *not* a blocking
  // screen: the photos that did land are already visible in the event behind
  // this, and the ones that didn't can be retried without reshooting them.
  const failedUploads = uploads.filter((u) => u.status === "failed");
  const reportedFailures = useRef(0);

  React.useEffect(() => {
    if (pendingUploads > 0) return;
    if (failedUploads.length === 0) {
      reportedFailures.current = 0;
      return;
    }
    if (reportedFailures.current === failedUploads.length) return;
    reportedFailures.current = failedUploads.length;

    Alert.alert(
      failedUploads.length === uploads.length
        ? "Your photos didn't upload"
        : "Some photos didn't upload",
      `${failedUploads.length} of ${uploads.length} failed${
        failedUploads[0]?.error ? ` — ${failedUploads[0].error}` : ""
      }.`,
      [
        { text: "Not now", style: "cancel" },
        { text: "Try again", onPress: () => retryFailedUploads() },
      ],
    );
  }, [pendingUploads, failedUploads.length, uploads.length]);

  // ─── Submit ──────────────────────────────────────────────────────────────────

  // Create is a tab, so it never unmounts — leaving the screen doesn't clear it.
  // The camera pops back here when it's done, so the form has to be reset by hand.
  const resetForm = () => {
    setStep(0);
    setTierIndex(0);
    setCreatedEvent(null);
    setFormData(emptyForm());
  };

  const buildEventBody = () => ({
    name: formData.name,
    plan_id: GUEST_TIERS[tierIndex].planId,
    reveal_time: formData.revealMode || undefined,
    expires_at: formData.expires_at?.toISOString() ?? undefined,
    shot_limit: formData.shotLimit
      ? parseInt(formData.shotLimit, 10)
      : undefined,
    public: formData.publicGallery,
    // Only a cover that's already a remote URL can ride along in the JSON body.
    // Stock covers ship with the app and, like a photo from the picker, go up
    // as an upload instead.
    cover_image_url: isHostedCover(formData.coverImage)
      ? formData.coverImage ?? undefined
      : undefined,
    // participant_limit is NOT sent from the client — it's the paid entitlement
    // and would be forgeable here. The server sets it: free baseline (5) on
    // create, then the verified guest-pack purchase credits the tier total via
    // the RevenueCat webhook. The tier picker is intent/display only.
    filter: formData.filter !== "none" ? formData.filter : undefined,
  });

  // Creates the event on the first attempt and reuses it on every later one.
  //
  // The event must exist *before* the guest pack can be bought — the purchase is
  // attributed to its id. A cancelled purchase leaves the user on this screen to
  // retry, so pressing Create again has to land on the same event instead of
  // spawning a duplicate. Edits made in between are PATCHed onto it — except
  // fields the user *cleared*, since an omitted key leaves the old value. An
  // cover is the one thing PATCH can't carry (it takes a hosted URL, not a
  // file), and stock covers are bundled files too — so changing the cover
  // between attempts doesn't stick to an event that already exists.
  const ensureEvent = async () => {
    const body = buildEventBody();
    const signature = JSON.stringify(body);
    const existing = createdEventRef.current;

    if (existing) {
      if (existing.sentBody === signature) return existing;
      const updated = await eventsApi.update(existing.id, body);
      const synced = {
        ...existing,
        shotLimit: updated?.shot_limit ?? existing.shotLimit,
        sentBody: signature,
      };
      setCreatedEvent(synced);
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      return synced;
    }

    const created = await eventsApi.store(
      body,
      // Stock covers are bundled files now, so they upload just like a picture
      // from the library — only a cover that's already hosted skips this.
      await coverUploadFile(formData.coverImage),
    );
    // `public` is only documented on PATCH, so a store endpoint that validates
    // strictly would drop it and silently ignore the visibility toggle. Cheap to
    // verify against the response and correct it.
    if (
      typeof created?.public === "boolean" &&
      created.public !== body.public
    ) {
      try {
        await eventsApi.update(created.id, { public: body.public });
      } catch (e) {
        console.warn("[create] couldn't apply the visibility setting", e);
      }
    }

    // Home is a tab — it stays mounted, so it never refetches on its own.
    await queryClient.invalidateQueries({ queryKey: ["events"] });

    const event = {
      id: created.id,
      token: created.qr_code_token,
      shotLimit: created?.shot_limit ?? undefined,
      sentBody: signature,
    };
    setCreatedEvent(event);
    return event;
  };

  // Done — confirm the event landed, then hand it over to the camera.
  //
  // The sheet is the only acknowledgement step: the wizard stays mounted behind
  // it (it's a tab), so nothing is torn down while it's up, and dismissing it
  // by any route — the button, the scrim, Android back — continues to the
  // camera. Going straight there would give the user no sign the event was
  // actually created.
  const proceedToCamera = (event: PendingCreatedEvent) => {
    Keyboard.dismiss();
    setSuccessEvent(event);
  };

  const goToCamera = (event: PendingCreatedEvent) => {
    const limit = event.shotLimit;
    // Clear first — `clear()` drops any stale target with the stale photos, so
    // the order matters.
    captureStore.getState().clear();
    captureStore.getState().setTarget({ eventId: event.id, token: event.token });
    router.push(limit ? `/camera?limit=${limit}` : "/camera");
    // Rewind only once the camera is up. Resetting first re-mounts step 1's
    // autoFocus'd name field while this screen is still frontmost, and the
    // keyboard it raises then sits on top of the camera.
    requestAnimationFrame(resetForm);
  };

  const dismissSuccessSheet = () => {
    const event = successEvent;
    setSuccessEvent(null);
    if (event) goToCamera(event);
  };

  // The user backed out of the store. Nothing was charged, so drop the event
  // back to Starter — it was created carrying the paid tier's plan_id in
  // anticipation of a purchase that never happened.
  const continueWithFreeTier = async (event: PendingCreatedEvent) => {
    const freeTier = GUEST_TIERS[0];
    if (GUEST_TIERS[tierIndex].planId !== freeTier.planId) {
      try {
        await eventsApi.update(event.id, { plan_id: freeTier.planId });
        await queryClient.invalidateQueries({ queryKey: ["events"] });
      } catch (e) {
        console.warn("[create] couldn't drop the event back to Starter", e);
      }
    }
    proceedToCamera(event);
  };

  // Buys the guest pack whose RevenueCat package identifier matches the tier's
  // lookupKey, attributing it to `eventId`. Never throws and never alerts — the
  // caller decides what to do with the outcome, so the user gets one prompt
  // instead of two stacked ones.
  const purchaseGuestPackForEvent = async (
    eventId: number,
    lookupKey: string,
  ): Promise<PurchaseOutcome> => {
    try {
      await revenueCat.configure();
      if (user?.id != null) {
        await revenueCat.logIn(user.id);
        appsFlyerService.setUserId(user.id);
      }

      const packs = await revenueCat.getGuestPacks();
      const match = packs.find((p) => p.lookupKey === lookupKey);
      if (!match) return { purchased: false, reason: "unavailable" };

      const res = await revenueCat.purchaseGuestPack(match.pkg, eventId);
      if (!res.success) {
        return {
          purchased: false,
          reason: isUserCancelled(res.error) ? "cancelled" : "failed",
        };
      }

      // Revenue is reported to AppsFlyer by RevenueCat's server-side integration
      // (see revenueCat.linkAppsFlyer) — do not log af_purchase here.

      // Slots are credited by the webhook — refetch so the event reflects the
      // new participant_limit once it lands.
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      await queryClient.invalidateQueries({
        queryKey: ["event", String(eventId)],
      });
      return { purchased: true };
    } catch (e) {
      console.warn("[create] guest pack purchase failed", e);
      return {
        purchased: false,
        reason: isUserCancelled(e) ? "cancelled" : "failed",
      };
    }
  };

  // Nothing was bought. The wizard stays exactly where it is — same step, same
  // answers, same tier — so the user can retry, pick a different pack, or take
  // the free baseline. `createdEventRef` keeps the already-created event so none
  // of those paths creates a second one.
  const promptPurchaseFallback = (
    event: PendingCreatedEvent,
    reason: PurchaseFailure = "failed",
  ) => {
    const copy = {
      cancelled: [
        "Purchase cancelled",
        "You weren't charged. Your event is saved with the free 5-guest limit — try again, choose another pack, or continue and upgrade later.",
      ],
      unavailable: [
        "Guest pack unavailable",
        "We couldn't load this pack from the store. Your event is saved with the free 5-guest limit — try again, choose another pack, or continue and upgrade later.",
      ],
      failed: [
        "Purchase didn't complete",
        "The store couldn't finish the purchase. Your event is saved with the free 5-guest limit — try again, choose another pack, or continue and upgrade later.",
      ],
    }[reason];

    Alert.alert(copy[0], copy[1], [
      { text: "Try again", onPress: () => void handleCreate() },
      {
        text: "Continue with 5 guests",
        onPress: () => void continueWithFreeTier(event),
      },
      { text: "Choose another pack", style: "cancel" },
    ]);
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const event = await ensureEvent();

      // Paid tier → buy the matching guest pack for THIS event. The slots are
      // credited server-side by the RevenueCat webhook (attributed via the
      // everly_event_id we set on the purchase), so we just kick off the buy and
      // refetch. If it doesn't go through we stop here and leave the wizard
      // untouched — resetting the form would throw away everything the user
      // just filled in over the cancellation of a $1.99 purchase.
      const tier = GUEST_TIERS[tierIndex];
      if (tier.lookupKey) {
        const outcome = await purchaseGuestPackForEvent(
          event.id,
          tier.lookupKey,
        );
        if (!outcome.purchased) {
          promptPurchaseFallback(event, outcome.reason);
          return;
        }
      }

      // Straight into shooting for the event we just created. The camera pops
      // back here and the effect above uploads whatever it captured.
      proceedToCamera(event);
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Something went wrong. Please try again.";
      Alert.alert("Couldn't create event", message);
    } finally {
      setIsCreating(false);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  // The caption under the title on the cover mock. Always today's date, set
  // like a plate — day, month spelled out, year, parted by hairline dots — and
  // uppercased by the preview's own style. Stand-in dressing for the preview,
  // the same way the mock's status bar wears the current time; the event's real
  // dates are its own fields.
  const coverDateLabel = React.useMemo(() => {
    const now = new Date();
    const month = now.toLocaleString("en-US", { month: "long" });
    return `${now.getDate()} · ${month} · ${now.getFullYear()}`;
  }, []);

  const expiresAtLabel = formData.expires_at
    ? formData.expires_at.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const revealDateLabel = formData.revealDate
    ? formData.revealDate.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // Measured from the screen bottom; the layout sits inside the safe area, so
  // this slightly overshoots — which just leaves a little air above the keyboard.
  const keyboardOverlap = keyboardHeight;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper>
      <View style={{ flex: 1 }}>
        {/* Top bar */}
        <Reanimated.View style={headerStyle}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 24,
              marginBottom: 34,
            }}
          >
            <TouchableOpacity
              onPress={goBack}
              activeOpacity={0.7}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.backgroundSecondary,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <ArrowLeft size={18} color={colors.textPrimary} />
            </TouchableOpacity>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              {STEPS.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor:
                      i === step ? colors.accent : "rgba(30,24,16,0.15)",
                  }}
                />
              ))}
            </View>

            <Text
              style={{
                marginLeft: "auto",
                fontFamily: "Inter-Regular",
                fontSize: 12,
                color: colors.textSecondary,
              }}
            >
              {step + 1} / {STEPS.length}
            </Text>
          </View>
        </Reanimated.View>

        {/* Step content — scrolls instead of being squeezed by the keyboard */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: keyboardOverlap + 96,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Reanimated.View style={stepContentStyle}>
            {/* Heading */}
            <Text
              style={{
                fontFamily: "Inter-ExtraBold",
                fontSize: 36,
                lineHeight: 44,
                color: colors.textPrimary,
                marginBottom: 8,
              }}
            >
              {STEPS[step].title}
            </Text>
            <Text
              style={{
                fontFamily: "Inter-Regular",
                fontSize: 15,
                color: colors.textSecondary,
                marginBottom: 32,
              }}
            >
              {step === 1
                ? (REVEAL_COPY[formData.revealMode] ?? STEPS[1].subtitle)
                : STEPS[step].subtitle}
            </Text>

            {/* ── Step 0: Basics ── */}
            {step === 0 && (
              <Reanimated.View exiting={stepBlockOut}>
                <Input
                  label="Event Name"
                  placeholder="e.g. Sarah & James's Wedding"
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  onClear={() => setFormData({ ...formData, name: "" })}
                  containerStyle="mb-6"
                  autoFocus={isFocused}
                />

                {/* Starter names, in the phone's language. They sharpen once a
                    type is picked, and step aside the moment anything is typed. */}
                {formData.name.trim().length === 0 && nameIdeas.length > 0 && (
                  <Reanimated.View
                    style={styles.ideaRow}
                    entering={ideasIn(reducedMotion)}
                    exiting={ideasOut(reducedMotion)}
                  >
                    {nameIdeas.map((idea) => (
                      <TouchableOpacity
                        key={idea}
                        activeOpacity={0.75}
                        onPress={() => setFormData({ ...formData, name: idea })}
                        style={styles.idea}
                      >
                        <Text style={styles.ideaText}>{idea}</Text>
                      </TouchableOpacity>
                    ))}
                  </Reanimated.View>
                )}

                {/* Closes the gap the row leaves behind, instead of snapping up
                    the moment it's gone. */}
                <Reanimated.View
                  layout={
                    reducedMotion ? undefined : LinearTransition.duration(260)
                  }
                >
                  <SectionLabel>Event Type</SectionLabel>
                  <TiltedEventTypeCards
                    types={EVENT_TYPES}
                    selected={formData.type}
                    onSelect={(type) => setFormData({ ...formData, type })}
                  />
                </Reanimated.View>
              </Reanimated.View>
            )}

            {/* ── Step 1: Reveal ── */}
            {step === 1 && (
              <View>
                <RevealPreview mode={formData.revealMode} />

                <View style={{ flexDirection: "row", gap: 8 }}>
                  {REVEAL_OPTIONS.map((option) => (
                    <RevealTile
                      key={option.mode}
                      option={option}
                      selected={formData.revealMode === option.mode}
                      onPress={() =>
                        setFormData({ ...formData, revealMode: option.mode })
                      }
                    />
                  ))}
                </View>

                {formData.revealMode === "Scheduled" && (
                  <View style={{ marginTop: 26 }}>
                    <SectionLabel>Reveal Date & Time</SectionLabel>
                    <DatePickerRow
                      value={revealDateLabel}
                      placeholder="Select reveal date & time"
                      onPress={() => setDatePickerOpen("reveal")}
                    />
                  </View>
                )}

                <View style={styles.divider} />

                <SectionLabel>Event Ends</SectionLabel>
                <DatePickerRow
                  value={expiresAtLabel}
                  placeholder="Select an end date & time"
                  onPress={() => setDatePickerOpen("expires_at")}
                />

                <View style={styles.divider} />

                <SectionLabel>Who can see the photos</SectionLabel>
                <View style={styles.toggleRow}>
                  <Switch
                    value={formData.publicGallery}
                    onValueChange={(v) =>
                      setFormData({ ...formData, publicGallery: v })
                    }
                    trackColor={{
                      false: "rgba(30,24,16,0.12)",
                      true: colors.accent,
                    }}
                    thumbColor="#fff"
                    ios_backgroundColor="rgba(30,24,16,0.12)"
                  />
                  <Text style={styles.toggleText}>
                    {formData.publicGallery
                      ? "Everyone can see every photo."
                      : "Guests only see the photos they took."}
                  </Text>
                </View>
              </View>
            )}

            {/* ── Step 2: Shot limit ── */}
            {step === 2 && (
              <Reanimated.View exiting={stepBlockOut}>
                <SectionLabel>Shots per person</SectionLabel>
                <ShotsPerPerson
                  value={formData.shotLimit}
                  onChange={(shotLimit) =>
                    setFormData({ ...formData, shotLimit })
                  }
                />
                <HintText>
                  {formData.shotLimit
                    ? `Every guest gets ${formData.shotLimit} shots. Scarcity is the point — they'll make each one count.`
                    : "Guests can shoot as much as they like. Pick a limit if you'd rather they made each frame count."}
                </HintText>
              </Reanimated.View>
            )}

            {/* ── Step 3: Filter ── */}
            {/* The cover leads and the presets follow: the big card shows the
                chosen look on the actual event photo, the row under it is just
                swatches of the same frame. */}
            {step === 3 && (
              <View style={{ alignItems: "center" }}>
                <FilterHero
                  uri={formData.coverImage ?? FILTER_PREVIEW_URI}
                  filter={formData.filter}
                />
                {/* Centred until the presets outgrow the width, then it scrolls
                    rather than clipping the last one off-screen. */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  style={{ alignSelf: "stretch", marginTop: 26 }}
                  contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: "center",
                    gap: 14,
                    paddingBottom: 4,
                  }}
                >
                  {FILTERS.map((f) => (
                    <FilterThumb
                      key={f.key}
                      item={f}
                      uri={formData.coverImage ?? FILTER_PREVIEW_URI}
                      selected={formData.filter === f.key}
                      onPress={() =>
                        setFormData({ ...formData, filter: f.key })
                      }
                    />
                  ))}
                </ScrollView>
                <HintText>
                  Guests won't be able to override this. Choose wisely.
                </HintText>
              </View>
            )}

            {/* ── Step 4: Cover photo + Preview ── */}
            {/* The picker and the preview are the same object: the device mock
                *is* the tap target, so the photo lands where it will live. */}
            {step === 4 && (
              <View style={{ flex: 1, justifyContent: "center" }}>
                <PhonePreview
                  title={formData.name}
                  date={coverDateLabel}
                  coverUri={formData.coverImage}
                  filter={formData.filter}
                  onPress={pickCoverImage}
                />
                <View style={{ marginTop: 22 }}>
                  <CoverPicker
                    value={formData.coverImage}
                    onSelect={(coverImage) =>
                      setFormData({ ...formData, coverImage })
                    }
                    onPickOwn={pickCoverImage}
                  />
                </View>
              </View>
            )}

            {/* ── Step 5: Who's invited (stepper) ── */}
            {step === 5 && (
              <View
                style={{ flex: 1, justifyContent: "center", paddingBottom: 80 }}
              >
                <GuestStepper
                  index={tierIndex}
                  onChange={(i, tier) => {
                    setTierIndex(i);
                    setFormData({
                      ...formData,
                      participantLimit:
                        tier.participants === "custom"
                          ? ""
                          : String(tier.participants),
                    });
                  }}
                />
                <HintText>
                  {GUEST_TIERS[tierIndex].price === 0
                    ? "Starter is free — upgrade anytime after creating your event."
                    : "One-time charge. No subscription required."}
                </HintText>
              </View>
            )}
          </Reanimated.View>
        </ScrollView>

        {/* Date pickers */}
        <DateTimePickerModal
          isVisible={datePickerOpen === "expires_at"}
          mode="datetime"
          minimumDate={new Date()}
          date={formData.expires_at ?? new Date()}
          onConfirm={(date) => {
            setFormData({ ...formData, expires_at: date });
            setDatePickerOpen(null);
          }}
          onCancel={() => setDatePickerOpen(null)}
          display={Platform.OS === "ios" ? "inline" : "default"}
          themeVariant="light"
          isDarkModeEnabled={false}
          accentColor={colors.accent}
          buttonTextColorIOS={colors.accentDeep}
          pickerContainerStyleIOS={{
            backgroundColor: colors.backgroundPrimary,
          }}
          pickerStyleIOS={{ backgroundColor: colors.backgroundPrimary }}
        />
        <DateTimePickerModal
          isVisible={datePickerOpen === "reveal"}
          mode="datetime"
          minimumDate={formData.expires_at ?? new Date()}
          date={formData.revealDate ?? formData.expires_at ?? new Date()}
          onConfirm={(date) => {
            setFormData({ ...formData, revealDate: date });
            setDatePickerOpen(null);
          }}
          onCancel={() => setDatePickerOpen(null)}
          display={Platform.OS === "ios" ? "inline" : "default"}
          themeVariant="light"
          isDarkModeEnabled={false}
          accentColor={colors.accent}
          buttonTextColorIOS={colors.accentDeep}
          pickerContainerStyleIOS={{
            backgroundColor: colors.backgroundPrimary,
          }}
          pickerStyleIOS={{ backgroundColor: colors.backgroundPrimary }}
        />
      </View>

      {/* Floating CTA */}
      <Reanimated.View
        style={[
          {
            position: "absolute",
            // No tab bar on this screen, so the CTA sits just above the safe area.
            bottom: keyboardOverlap > 0 ? keyboardOverlap + 20 : 28,
            right: 24,
          },
          ctaStyle,
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          onPress={goNext}
          disabled={!canContinue() || isCreating}
          activeOpacity={0.85}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor: canContinue()
              ? colors.accent
              : colors.backgroundSecondary,
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 100,
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: canContinue() ? 0.35 : 0,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text
                style={{
                  fontFamily: "Inter-SemiBold",
                  fontSize: 15,
                  color: canContinue() ? "#fff" : colors.textSecondary,
                }}
              >
                {step === STEPS.length - 1 ? "Create" : "Continue"}
              </Text>
              <ArrowRight
                size={18}
                color={canContinue() ? "#fff" : colors.textSecondary}
                strokeWidth={2.5}
              />
            </>
          )}
        </TouchableOpacity>
      </Reanimated.View>

      <SuccessSheet
        visible={successEvent !== null}
        title="Parabéns"
        subtitle="Seu evento foi criado. Envie o link abaixo para os convidados."
        actionLabel="Continuar"
        link={successEvent?.token ? joinLink(successEvent.token) : undefined}
        onDismiss={dismissSuccessSheet}
      />
    </ScreenWrapper>
  );
}
