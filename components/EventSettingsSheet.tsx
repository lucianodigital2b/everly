import React from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Reanimated, {
  Easing as ReEasing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import {
  Aperture,
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Hourglass,
  Image as ImageIcon,
  Trash2,
  Unlock,
  Users,
} from "lucide-react-native";
import { colors } from "../constants/colors";
import { FILTERS, type FilterKey } from "../constants/filters";
import { GUEST_TIERS, tierForParticipants } from "../constants/guestTiers";
import { coverUploadFile, isHostedCover } from "../constants/sampleImages";
import { eventsApi, type Event, type EventUpdateBody } from "../services/api";
import { revenueCat } from "../services/revenuecat";
import { appsFlyerService } from "../services/appsflyer";
import { authStore } from "../zustand/auth-store";
import { CoverPicker } from "./CoverPicker";

// The wizard's own wording, so an event reads the same in the sheet that edits
// it as it did on the step that created it.
const REVEAL_OPTIONS = [
  {
    mode: "Instant",
    label: "During the event",
    hint: "Every photo appears the moment it's taken.",
  },
  {
    mode: "End of Event",
    label: "After the event",
    hint: "The whole gallery opens at once when the event ends.",
  },
  {
    mode: "Scheduled",
    label: "At a set time",
    hint: "The gallery opens at the time you choose.",
  },
] as const;

// Matches the create wizard's dial (components/ShotsPerPerson), minus the
// scrolling deck — a settings row wants a list, not a toy.
const SHOT_STOPS: (number | null)[] = [3, 5, 10, 15, 20, 25, 30, 40, 50, null];

// RevenueCat reports a dismissed store sheet as a *failed* purchase carrying a
// cancel flag; older SDK versions nest it under userInfo, so check both.
const isUserCancelled = (e: any) =>
  !!(e?.userCancelled ?? e?.userInfo?.userCancelled);

type Panel =
  | "root"
  | "name"
  | "expires"
  | "reveal"
  | "filter"
  | "guests"
  | "shots";

interface EventSettingsSheetProps {
  visible: boolean;
  event: Event;
  onClose: () => void;
  /** Fired after the event is deleted, so the screen can leave. */
  onDeleted: () => void;
}

const formatDate = (value?: string | null) => {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const guestLabel = (limit: number | null | undefined) =>
  limit == null ? "Unlimited" : `Up to ${limit} guests`;

const shotLabel = (limit: number | null | undefined) =>
  limit == null ? "Unlimited" : `${limit} photo${limit === 1 ? "" : "s"}`;

// ─── Rows ─────────────────────────────────────────────────────────────────────

const Row = ({
  icon: Icon,
  label,
  value,
  onPress,
  danger,
  last,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) => {
  const [pressing, setPressing] = React.useState(false);
  const ink = danger ? colors.error : colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressing(true)}
      onPressOut={() => setPressing(false)}
      style={[
        styles.row,
        !last && styles.rowDivider,
        pressing && styles.rowPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
    >
      <Icon size={20} color={danger ? colors.error : colors.textSecondary} />
      <Text style={[styles.rowLabel, { color: ink }]} numberOfLines={1}>
        {label}
      </Text>
      {value ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      <ChevronRight size={18} color={colors.textTertiary} />
    </Pressable>
  );
};

const ToggleRow = ({
  icon: Icon,
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  icon: React.ComponentType<any>;
  label: string;
  hint: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) => (
  <View style={[styles.row, styles.rowDivider, { alignItems: "flex-start" }]}>
    <Icon size={20} color={colors.textSecondary} style={{ marginTop: 2 }} />
    <View style={{ flex: 1 }}>
      <Text style={[styles.rowLabel, { flex: 0 }]}>{label}</Text>
      <Text style={styles.rowHint}>{hint}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      trackColor={{ false: colors.surface2, true: colors.accent }}
      thumbColor={colors.white}
      ios_backgroundColor={colors.surface2}
    />
  </View>
);

/** A choice inside an editor panel. */
const Option = ({
  label,
  hint,
  selected,
  onPress,
  trailing,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
  trailing?: string;
}) => (
  <Pressable
    onPress={onPress}
    style={[styles.option, selected && styles.optionOn]}
    accessibilityRole="button"
    accessibilityState={{ selected }}
  >
    <View style={{ flex: 1 }}>
      <Text style={styles.optionLabel}>{label}</Text>
      {hint ? <Text style={styles.optionHint}>{hint}</Text> : null}
    </View>
    {trailing ? <Text style={styles.optionTrailing}>{trailing}</Text> : null}
    {selected ? (
      <Check size={18} color={colors.accentDeep} strokeWidth={2.5} />
    ) : null}
  </Pressable>
);

// ─── Sheet ────────────────────────────────────────────────────────────────────

/**
 * Everything about an event that can still be changed after it exists, in one
 * sheet raised from the event detail header.
 *
 * Every edit is a PATCH followed by a refetch rather than a local mutation:
 * `participant_limit` in particular is a *paid* entitlement the server credits
 * from a verified purchase, so the client is never the one that decides what an
 * event is worth.
 */
export const EventSettingsSheet: React.FC<EventSettingsSheetProps> = ({
  visible,
  event,
  onClose,
  onDeleted,
}) => {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  const user = authStore((s: any) => s.data?.user);

  const [panel, setPanel] = React.useState<Panel>("root");
  // Real store prices, keyed by lookupKey. The tier table's `price` is only a
  // fallback for the moment before these land (or if the store is unreachable).
  const [packPrices, setPackPrices] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [datePicker, setDatePicker] = React.useState<null | "expires" | "reveal">(
    null,
  );

  // Draft state for the panels that edit free-form values. Seeded from the
  // event each time the sheet opens, so a dismissed edit is genuinely dropped.
  const [name, setName] = React.useState(event.name);
  const [cover, setCover] = React.useState<string | null>(event.cover_image_url);

  React.useEffect(() => {
    if (!visible) return;
    setPanel("root");
    setName(event.name);
    setCover(event.cover_image_url);
    progress.value = withTiming(1, {
      duration: reducedMotion ? 0 : 320,
      easing: ReEasing.out(ReEasing.cubic),
    });
  }, [visible, reducedMotion]);

  React.useEffect(() => {
    if (!visible) progress.value = 0;
  }, [visible]);

  // Only fetched when the panel that shows prices is actually opened.
  React.useEffect(() => {
    if (panel !== "guests") return;
    let cancelled = false;
    (async () => {
      try {
        await revenueCat.configure();
        const packs = await revenueCat.getGuestPacks();
        if (cancelled) return;
        setPackPrices(
          Object.fromEntries(
            packs
              .filter((p: any) => p.priceString)
              .map((p: any) => [p.lookupKey, p.priceString]),
          ),
        );
      } catch {
        // The fallback prices in GUEST_TIERS still render.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [panel]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 340 }],
  }));

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["event", String(event.id)],
    });
    await queryClient.invalidateQueries({ queryKey: ["events"] });
  };

  /**
   * One save path for every panel. `back` returns to the list on success —
   * a failed save keeps the panel open with the user's input still in it.
   */
  const save = async (
    body: EventUpdateBody,
    options: { coverUri?: string | null; back?: boolean } = {},
  ) => {
    if (saving) return;
    setSaving(true);
    try {
      // A cover already hosted is just a URL; a preset or a library photo has
      // to go up as a file.
      const coverFile = options.coverUri
        ? await coverUploadFile(options.coverUri)
        : undefined;

      await eventsApi.update(event.id, body, coverFile);
      await refresh();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      if (options.back !== false) setPanel("root");
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Couldn't save that change.";
      Alert.alert("Change not saved", message);
    } finally {
      setSaving(false);
    }
  };

  const pickOwnCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photo access needed",
        "Allow photo access to use one of your own pictures as the cover.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setCover(result.assets[0].uri);
    }
  };

  const saveNameAndCover = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Name required", "An event needs a name.");
      return;
    }
    const changedCover = cover !== event.cover_image_url;
    save(
      {
        name: trimmed,
        // A hosted URL can ride in the body; anything else goes up as a file.
        ...(changedCover && isHostedCover(cover)
          ? { cover_image_url: cover ?? undefined }
          : {}),
      },
      { coverUri: changedCover && !isHostedCover(cover) ? cover : null },
    );
  };

  /**
   * Guest packs are consumables: the purchase is attributed to this event and
   * the RevenueCat webhook credits `participant_limit` server-side. Nothing is
   * granted here — the sheet just refetches and shows what the server says.
   *
   * `logIn` before the purchase matters: it makes the transaction's
   * `app_user_id` the API user id, which is what the backend cross-checks
   * ownership against before crediting anything.
   */
  const buyTier = async (tier: (typeof GUEST_TIERS)[number]) => {
    if (!tier.lookupKey || saving) return;
    setSaving(true);
    try {
      await revenueCat.configure();
      if (user?.id != null) {
        await revenueCat.logIn(user.id);
        appsFlyerService.setUserId(user.id);
      }

      const packs = await revenueCat.getGuestPacks();
      const match = packs.find((p: any) => p.lookupKey === tier.lookupKey);
      if (!match) {
        Alert.alert(
          "Guest pack unavailable",
          "We couldn't load this pack from the store. Try again in a moment.",
        );
        return;
      }

      const res = await revenueCat.purchaseGuestPack(match.pkg, event.id);
      if (!res.success) {
        // A dismissed store sheet is not an error worth a dialog.
        if (isUserCancelled(res.error)) return;
        Alert.alert(
          "Purchase didn't complete",
          "The store couldn't finish the purchase. You weren't charged.",
        );
        return;
      }

      // Revenue reaches AppsFlyer through RevenueCat's server-side integration
      // — never log a purchase event here, it would double-count.
      await refresh();
      setPanel("root");
      Alert.alert(
        "Guests added",
        "The new allowance appears as soon as the store confirms the purchase.",
      );
    } catch (e: any) {
      if (isUserCancelled(e)) return;
      Alert.alert(
        "Purchase didn't complete",
        e?.message ?? "The store couldn't finish the purchase.",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete event?",
      "The event and every photo in it are removed for good. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await eventsApi.destroy(event.id);
              await queryClient.invalidateQueries({ queryKey: ["events"] });
              onDeleted();
            } catch (e: any) {
              Alert.alert(
                "Couldn't delete",
                e?.response?.data?.message ?? e?.message ?? "Try again.",
              );
            }
          },
        },
      ],
    );
  };

  const currentTier = tierForParticipants(event.participant_limit);
  const currentFilter =
    FILTERS.find((f) => f.key === (event.filter ?? "none")) ?? FILTERS[0];
  const revealLabel =
    REVEAL_OPTIONS.find((o) => o.mode === event.reveal_time)?.label ??
    "After the event";

  // ── Panels ──
  const panels: Record<Panel, { title: string; body: React.ReactNode }> = {
    root: {
      title: "Event settings",
      body: (
        <>
          <Row
            icon={ImageIcon}
            label="Name & cover"
            value={event.name}
            onPress={() => setPanel("name")}
          />
          <Row
            icon={Calendar}
            label="End date"
            value={formatDate(event.expires_at)}
            onPress={() => setPanel("expires")}
          />
          <Row
            icon={Hourglass}
            label="Reveal time"
            value={revealLabel}
            onPress={() => setPanel("reveal")}
          />
          <Row
            icon={Aperture}
            label="Camera style"
            value={currentFilter.label}
            onPress={() => setPanel("filter")}
          />
          <Row
            icon={Users}
            label="Participants"
            value={guestLabel(event.participant_limit)}
            onPress={() => setPanel("guests")}
          />
          <Row
            icon={Camera}
            label="Shots per person"
            value={shotLabel(event.shot_limit)}
            onPress={() => setPanel("shots")}
          />
          <ToggleRow
            icon={Unlock}
            label="Everyone sees every photo"
            hint={
              event.public
                ? "Guests browse the whole gallery."
                : "Guests only see the photos they took."
            }
            value={!!event.public}
            disabled={saving}
            onChange={(next) => save({ public: next }, { back: false })}
          />
          <Row
            icon={Trash2}
            label="Delete event"
            onPress={confirmDelete}
            danger
            last
          />
        </>
      ),
    },

    name: {
      title: "Name & cover",
      body: (
        <View style={styles.panelBody}>
          <Text style={styles.fieldLabel}>Event name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Sarah & James"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            maxLength={255}
            returnKeyType="done"
          />

          <View style={{ height: 20 }} />
          <CoverPicker value={cover} onSelect={setCover} onPickOwn={pickOwnCover} />

          <Pressable
            onPress={saveNameAndCover}
            disabled={saving}
            style={[styles.primary, saving && { opacity: 0.6 }]}
          >
            {saving ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.primaryLabel}>Save</Text>
            )}
          </Pressable>
        </View>
      ),
    },

    expires: {
      title: "End date",
      body: (
        <View style={styles.panelBody}>
          <Text style={styles.panelHint}>
            When the event closes. Guests can't upload after it, and an
            "after the event" reveal opens the gallery at this moment.
          </Text>
          <Pressable
            onPress={() => setDatePicker("expires")}
            style={styles.bigValue}
          >
            <Calendar size={20} color={colors.accentDeep} />
            <Text style={styles.bigValueText}>
              {formatDate(event.expires_at)}
            </Text>
          </Pressable>
        </View>
      ),
    },

    reveal: {
      title: "Reveal time",
      body: (
        <View style={styles.panelBody}>
          {REVEAL_OPTIONS.map((option) => (
            <Option
              key={option.mode}
              label={option.label}
              hint={option.hint}
              selected={event.reveal_time === option.mode}
              onPress={() => {
                // A scheduled reveal is invalid without a time, so picking it
                // asks for one instead of sending a body the API will reject.
                if (option.mode === "Scheduled") {
                  setDatePicker("reveal");
                  return;
                }
                save({ reveal_time: option.mode });
              }}
            />
          ))}
          {event.reveal_time === "Scheduled" ? (
            <Pressable
              onPress={() => setDatePicker("reveal")}
              style={styles.bigValue}
            >
              <Calendar size={20} color={colors.accentDeep} />
              <Text style={styles.bigValueText}>
                {formatDate(event.reveal_at)}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ),
    },

    filter: {
      title: "Camera style",
      body: (
        <View style={styles.panelBody}>
          <Text style={styles.panelHint}>
            Every guest shoots in this look, so the album stays of a piece.
          </Text>
          {FILTERS.map((preset) => (
            <Option
              key={preset.key}
              label={preset.label}
              selected={(event.filter ?? "none") === preset.key}
              onPress={() => save({ filter: preset.key as FilterKey })}
            />
          ))}
        </View>
      ),
    },

    guests: {
      title: "Participants",
      body: (
        <View style={styles.panelBody}>
          <Text style={styles.panelHint}>
            Guest packs add slots to this event. They're a one-off purchase, not
            a subscription — and the allowance only moves up.
          </Text>
          {GUEST_TIERS.map((tier) => {
            const isCurrent = currentTier?.planId === tier.planId;
            // A null limit is *unlimited*, not zero — there is nothing above it
            // to sell. Only a paid pack can move the allowance, and only up.
            const unlimited = event.participant_limit == null;
            const bigger =
              !!tier.lookupKey &&
              !unlimited &&
              (tier.participants === "custom" ||
                (typeof tier.participants === "number" &&
                  tier.participants > (event.participant_limit ?? 0)));
            return (
              <Option
                key={tier.planId}
                label={
                  tier.participants === "custom"
                    ? "Unlimited guests"
                    : `${tier.participants} guests`
                }
                hint={isCurrent ? "Current allowance" : tier.title}
                trailing={
                  isCurrent || !bigger
                    ? undefined
                    : (tier.lookupKey ? packPrices[tier.lookupKey] : undefined) ??
                      `$${tier.price.toFixed(2)}`
                }
                selected={isCurrent}
                onPress={() => {
                  if (isCurrent || !bigger) return;
                  buyTier(tier);
                }}
              />
            );
          })}
        </View>
      ),
    },

    shots: {
      title: "Shots per person",
      body: (
        <View style={styles.panelBody}>
          <Text style={styles.panelHint}>
            How many photos each guest may take. Lower limits make people choose
            their moment.
          </Text>
          {SHOT_STOPS.map((stop) => (
            <Option
              key={String(stop)}
              label={stop === null ? "Unlimited" : `${stop} photos`}
              selected={(event.shot_limit ?? null) === stop}
              // `stop` is sent as-is: null is what clears the limit, and
              // `undefined` would drop the key and leave the old one in place.
              onPress={() => save({ shot_limit: stop })}
            />
          ))}
        </View>
      ),
    },
  };

  const current = panels[panel];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => (panel === "root" ? onClose() : setPanel("root"))}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Reanimated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(46,36,41,0.36)" },
            scrimStyle,
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Reanimated.View>

        <Reanimated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
            sheetStyle,
          ]}
        >
          <View style={styles.grabber} />

          <View style={styles.header}>
            {panel === "root" ? (
              <View style={styles.headerSide} />
            ) : (
              <Pressable
                onPress={() => setPanel("root")}
                style={styles.headerSide}
                accessibilityRole="button"
                accessibilityLabel="Back to settings"
              >
                <ChevronLeft size={22} color={colors.textPrimary} />
              </Pressable>
            )}
            <Text style={styles.headerTitle} numberOfLines={1}>
              {current.title}
            </Text>
            <View style={styles.headerSide}>
              {saving ? <ActivityIndicator color={colors.accentDeep} /> : null}
            </View>
          </View>

          <ScrollView
            style={{ maxHeight: 520 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {current.body}
          </ScrollView>
        </Reanimated.View>
      </View>

      {/* One picker, two jobs — which field it writes back to is `datePicker`. */}
      <DateTimePickerModal
        isVisible={datePicker !== null}
        mode="datetime"
        date={
          new Date(
            (datePicker === "reveal" ? event.reveal_at : event.expires_at) ??
              Date.now(),
          )
        }
        minimumDate={new Date()}
        onConfirm={(picked) => {
          const target = datePicker;
          setDatePicker(null);
          if (target === "expires") {
            save({ expires_at: picked.toISOString() });
          } else if (target === "reveal") {
            save({
              reveal_time: "Scheduled",
              reveal_at: picked.toISOString(),
            });
          }
        }}
        onCancel={() => setDatePicker(null)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.backgroundSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 20,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  headerSide: {
    width: 44,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Inter-ExtraBold",
    fontSize: 18,
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.surface2 },
  rowLabel: {
    flex: 1,
    fontFamily: "Inter-Medium",
    fontSize: 16,
    color: colors.textPrimary,
  },
  rowValue: {
    maxWidth: "42%",
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: colors.textTertiary,
  },
  rowHint: {
    fontFamily: "Inter-Regular",
    fontSize: 13,
    lineHeight: 18,
    color: colors.textTertiary,
    marginTop: 2,
  },

  panelBody: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 20 },
  panelHint: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: "Inter-SemiBold",
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.textTertiary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Inter-Medium",
    fontSize: 16,
    color: colors.textPrimary,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface2,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  optionOn: { borderColor: colors.accent, backgroundColor: colors.white },
  optionLabel: {
    fontFamily: "Inter-SemiBold",
    fontSize: 15,
    color: colors.textPrimary,
  },
  optionHint: {
    fontFamily: "Inter-Regular",
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 2,
  },
  optionTrailing: {
    fontFamily: "Inter-SemiBold",
    fontSize: 14,
    color: colors.accentDeep,
  },

  bigValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface2,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  bigValueText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 15,
    color: colors.textPrimary,
  },

  primary: {
    height: 56,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  primaryLabel: {
    fontFamily: "Inter-SemiBold",
    fontSize: 17,
    color: colors.textPrimary,
  },
});
