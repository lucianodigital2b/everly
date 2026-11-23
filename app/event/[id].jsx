import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  StyleSheet,
  Text,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { GlassSurface } from "../../components/GlassSurface";
import { SerifBoldText, SansText, SansSemiText } from "../../components/Text";
import { EmptyState } from "../../components/EmptyState";
import { colors } from "../../constants/colors";
import { eventCover } from "../../constants/sampleImages";
import { eventsApi } from "../../services/api";
import { useEventLiveActivity } from "../../hooks/useEventLiveActivity";
import { EventSettingsSheet } from "../../components/EventSettingsSheet";
import {
  QrCode,
  Clock,
  ChevronLeft,
  Play,
  Images,
  ArrowUpRight,
  Settings2,
} from "lucide-react-native";
import { t, LOCALE_TAG } from "../../i18n";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const H_PAD = 24; // matches ScreenWrapper px-6
const GAP = 6;
// Two-column masonry: each tile keeps its own aspect ratio, and every photo
// lands in whichever column is currently shorter.
const CONTENT_W = SCREEN_WIDTH - H_PAD * 2;
const COL_W = (CONTENT_W - GAP) / 2;
// Ratios are clamped so one panorama (or one very tall shot) can't leave the
// other column stranded metres behind.
const MIN_RATIO = 0.7;
const MAX_RATIO = 1.6;
const DEFAULT_RATIO = 1.25; // what a photo with no stored size gets
// A photo carries its own dimensions when the backend stored them; anything
// missing or extreme falls back to a portrait-ish tile.
const tileRatio = (photo) => {
  const w = photo.width;
  const h = photo.height;
  if (!w || !h) return DEFAULT_RATIO;
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, h / w));
};

// Who took the shot. Every photo reaches an event through the guest upload
// route — the host's own shots included — so an unnamed uploader is still
// truthfully credited as a guest.
const photoCredit = (photo) =>
  photo.guest_name?.trim() || photo.guest?.name?.trim() || t("event.guest");

const EVENT_SCREEN_OPTIONS = {
  headerShown: false,
};

// The hero card. Wide margins, a little taller than square — enough room for a
// plate number up top and the look credit along the bottom.
const CARD_W = SCREEN_WIDTH - H_PAD * 2;
const CARD_H = Math.min(Math.round(SCREEN_HEIGHT * 0.46), Math.round(CARD_W * 1.2));

const REVEAL_TAG = {
  Instant: t("event.revealInstant"),
  "End of Event": t("event.revealEndOfEvent"),
  Scheduled: t("event.revealScheduled"),
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: () => eventsApi.show(id),
    enabled: !!id,
  });

  const { data: photosData, isLoading: photosLoading } = useQuery({
    queryKey: ["event-photos", id],
    queryFn: () => eventsApi.photos(id),
    enabled: !!id,
  });

  const event = data?.event;
  const photos = photosData?.photos ?? [];

  const [settingsOpen, setSettingsOpen] = React.useState(false);

  // Lock Screen / Dynamic Island card, but only for an event that has actually
  // started — it ends itself the moment the event closes.
  useEventLiveActivity(event, data?.uploadCount ?? 0);

  // The hero fills the screen; "View gallery" scrolls the sheet below into view.
  const scrollRef = React.useRef(null);
  const galleryY = React.useRef(0);

  const scrollToGallery = () => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, galleryY.current - insets.top - 8),
      animated: true,
    });
  };

  const openQr = () => {
    router.push(
      `/qr?token=${encodeURIComponent(
        event?.qr_code_token ?? "",
      )}&name=${encodeURIComponent(event?.name ?? "")}`,
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return t("event.noDate");
    return new Date(dateStr).toLocaleDateString(LOCALE_TAG, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (secs) => {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.backgroundPrimary }}
        className="items-center justify-center"
      >
        <Stack.Screen options={EVENT_SCREEN_OPTIONS} />
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!event) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.backgroundPrimary }}
        className="items-center justify-center"
      >
        <Stack.Screen options={EVENT_SCREEN_OPTIONS} />
        <SansSemiText className="text-textSecondary text-base">
          {t("event.notFound")}
        </SansSemiText>
      </View>
    );
  }

  const PhotoTile = ({ photo, width, height }) => {
    const duration = formatDuration(photo.duration_seconds);
    const credit = photoCredit(photo);
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          // The ids let the viewer offer the host's moderation actions.
          router.push(
            `/photo?url=${encodeURIComponent(photo.url)}&eventId=${id}&photoId=${
              photo.id
            }&guest=${encodeURIComponent(credit)}`,
          )
        }
        style={{
          width,
          height,
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: colors.surface2,
        }}
      >
        <Image
          source={{ uri: photo.thumbnail_url ?? photo.url }}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* The credit sits directly on the photo, so it needs its own ground:
            a scrim rather than a pill, which would read as a second control
            next to the duration badge. */}
        {credit ? (
          <>
            <LinearGradient
              colors={["transparent", "rgba(12,8,6,0.62)"]}
              locations={[0.45, 1]}
              style={styles.creditScrim}
              pointerEvents="none"
            />
            <SansSemiText style={styles.creditText} numberOfLines={1}>
              {credit}
            </SansSemiText>
          </>
        ) : null}

        {duration && (
          <View className="absolute bottom-2 right-2 flex-row items-center gap-1 bg-black/60 rounded-full px-2 py-1">
            <SansSemiText className="text-white text-xs">
              {duration}
            </SansSemiText>
            <Play size={9} color="#fff" fill="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Two columns, Pinterest-style: each photo keeps its own proportions and goes
  // to whichever column is shorter, so the two sides stay level without any
  // measuring pass.
  const renderMasonry = (all) => {
    const cols = [[], []];
    const heights = [0, 0];

    all.forEach((photo, i) => {
      const target = heights[0] <= heights[1] ? 0 : 1;
      const height = Math.round(COL_W * tileRatio(photo));
      cols[target].push(
        <View key={photo.id ?? i} style={{ marginBottom: GAP }}>
          <PhotoTile photo={photo} width={COL_W} height={height} />
        </View>,
      );
      heights[target] += height + GAP;
    });

    return (
      <View style={{ flexDirection: "row", gap: GAP }}>
        <View style={{ width: COL_W }}>{cols[0]}</View>
        <View style={{ width: COL_W }}>{cols[1]}</View>
      </View>
    );
  };

  // uploadCount is the *photo* count (BACKEND.md), which the card now states —
  // so the subtitle carries the guest allowance instead of repeating it under
  // the wrong noun.
  const guestLabel = event.participant_limit == null
    ? t("event.unlimitedGuests")
    : t("event.guestCount", { count: event.participant_limit });

  const revealTag = REVEAL_TAG[event.reveal_time] ?? t("event.revealEndOfEvent");

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundPrimary }}>
      <Stack.Screen options={EVENT_SCREEN_OPTIONS} />

      {/* ── Backdrop: the cover again, blown up and frosted, so the card in
             front of it reads as the one sharp thing on the screen. ── */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: SCREEN_HEIGHT,
        }}
      >
        <Image
          source={{ uri: eventCover(event.cover_image_url) }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <BlurView
          intensity={70}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        {/* Light veil up top for the back button, deep shade below for the text. */}
        <LinearGradient
          colors={["rgba(0,0,0,0.32)", "rgba(0,0,0,0)", "rgba(0,0,0,0.78)"]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* No bottom padding: the cover is pinned behind this ScrollView, so any
          gap under the sheet shows a strip of photo below it. The sheet runs to
          the bottom itself. */}
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        {/* ── Hero: fills the screen, editorial and minimal ── */}
        <View
          style={{
            height: SCREEN_HEIGHT,
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: H_PAD,
          }}
        >
          {/* Back and settings frame the hero; the QR lives in the action row
              below, where the invite actually belongs. */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.75}>
              <GlassSurface tint="dark" shape="circle" style={styles.glassButton}>
                <ChevronLeft size={24} color="#fff" />
              </GlassSurface>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSettingsOpen(true)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t("event.eventSettings")}
            >
              <GlassSurface tint="dark" shape="circle" style={styles.glassButton}>
                <Settings2 size={22} color="#fff" />
              </GlassSurface>
            </TouchableOpacity>
          </View>

          {/* ── The card: cover held sharp above its own frosted blow-up ── */}
          <View style={styles.cardWrap}>
            {/* Oversized ghost of the name, bleeding off both edges behind it */}
            <Text style={styles.ghostType} numberOfLines={1}>
              {event.name}
            </Text>

            <TouchableOpacity
              activeOpacity={0.92}
              onPress={scrollToGallery}
              style={styles.card}
            >
              <Image
                source={{ uri: eventCover(event.cover_image_url) }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
              {/* Photos go pale at either end — scrims keep the type legible. */}
              <LinearGradient
                colors={["rgba(12,8,6,0.5)", "transparent"]}
                locations={[0, 0.32]}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={["transparent", "rgba(12,8,6,0.72)"]}
                locations={[0.55, 1]}
                style={StyleSheet.absoluteFill}
              />

              {/* Top: the count, set like a plate number */}
              <View style={styles.cardTop}>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <Text style={styles.cardNumeral}>
                    {String(Math.min(data.uploadCount, 99)).padStart(2, "0")}
                  </Text>
                  <View style={{ marginLeft: 8, marginTop: 6 }}>
                    <Text style={styles.cardCaption}>
                      {t("event.photoWord", { count: data.uploadCount })}
                    </Text>
                    <Text style={styles.cardCaption}>{t("event.sofar")}</Text>
                  </View>
                </View>
                <Text style={styles.cardEyebrow}>{revealTag}</Text>
              </View>

            </TouchableOpacity>
          </View>

          {/* Title block + actions, anchored to the bottom */}
          <View>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {event.name}
            </Text>
            <SansText className="text-white/70" style={styles.heroSubtitle}>
              {formatDate(event.expires_at)} · {guestLabel}
            </SansText>

            {/* Action row: QR (invite) + View gallery */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={openQr}
                activeOpacity={0.85}
                style={styles.circleAction}
                accessibilityRole="button"
                accessibilityLabel={t("event.shareQrCode")}
              >
                <QrCode size={24} color={colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={scrollToGallery}
                activeOpacity={0.85}
                style={styles.pillCta}
              >
                <SansSemiText style={styles.pillCtaText}>
                  {t("event.viewGallery")}
                </SansSemiText>
                <ArrowUpRight size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Gallery sheet — below the fold, rises over the photo on scroll ── */}
        <View
          onLayout={(e) => {
            galleryY.current = e.nativeEvent.layout.y;
          }}
          // A full screen tall, so scrolling it up always covers the pinned
          // cover edge to edge — anything shorter leaves the photo showing
          // under it.
          style={[styles.sheet, { minHeight: SCREEN_HEIGHT }]}
        >
          <View
            style={{
              flexGrow: 1,
              paddingHorizontal: H_PAD,
              paddingTop: 28,
              paddingBottom: insets.bottom + 32,
            }}
          >
            {/* Gallery header */}
            <View className="flex-row justify-between items-baseline mb-4">
              <SerifBoldText className="text-2xl">{t("event.gallery")}</SerifBoldText>
              {/* Silent when empty — the placeholder below already says it. */}
              <SansText className="text-sm text-textSecondary">
                {photosLoading
                  ? t("event.loading")
                  : data.uploadCount === 0
                    ? ""
                    : t("event.photoCount", { count: data.uploadCount })}
              </SansText>
            </View>

            {/* Gallery body — placeholders centre in the sheet instead of
                clinging to the top of an empty screen. */}
            {data.uploadCount === 0 ? (
              <View style={styles.placeholder}>
                <EmptyState
                  variant="bare"
                  icon={Images}
                  title={t("event.noPhotosTitle")}
                  subtitle={t("event.noPhotosSubtitle")}
                  actionLabel={t("event.shareQrCode")}
                  onAction={openQr}
                />
              </View>
            ) : !event.is_revealed ? (
              <View style={styles.placeholder}>
                <EmptyState
                  variant="bare"
                  icon={Clock}
                  title={t("event.notRevealedTitle")}
                  subtitle={t("event.notRevealedSubtitle")}
                />
              </View>
            ) : photosLoading ? (
              <View style={styles.placeholder}>
                <ActivityIndicator
                  color={colors.accent}
                  style={{ alignSelf: "center" }}
                />
              </View>
            ) : (
              renderMasonry(photos)
            )}
          </View>
        </View>
      </ScrollView>

      {/* Mounted only while open: the sheet seeds its drafts from the event on
          mount, so a stale copy can never outlive an edit made elsewhere. */}
      {settingsOpen ? (
        <EventSettingsSheet
          visible
          event={event}
          onClose={() => setSettingsOpen(false)}
          onDeleted={() => {
            setSettingsOpen(false);
            router.back();
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  creditScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
  },
  creditText: {
    position: "absolute",
    left: 10,
    bottom: 8,
    maxWidth: "72%",
    fontSize: 12,
    color: "#fff",
    // The scrim carries most of the contrast; the shadow covers the rare shot
    // that is bright all the way into its bottom corner.
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: colors.backgroundPrimary,
  },
  placeholder: {
    flexGrow: 1,
    minHeight: 260,
    justifyContent: "center",
    paddingBottom: 24,
    // Deliberately no alignItems: "center" — EmptyState already centres its own
    // content, and shrink-wrapping it here leaves its button with no definite
    // parent width, so the button's `w-full` collapses onto the label.
  },
  glassButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  cardWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostType: {
    position: "absolute",
    // Wider than the screen so it runs off both edges, like a masthead.
    width: SCREEN_WIDTH * 2,
    textAlign: "center",
    fontFamily: "NewKansas-Medium",
    fontSize: 96,
    lineHeight: 108,
    letterSpacing: -2,
    color: "rgba(255,255,255,0.07)",
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: colors.surface2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 12,
  },
  cardTop: {
    position: "absolute",
    top: 18,
    left: 20,
    right: 20,
  },
  cardNumeral: {
    fontFamily: "Inter-ExtraBold",
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -1.5,
    color: "#fff",
  },
  cardCaption: {
    fontFamily: "Lexend-Regular",
    fontSize: 12,
    lineHeight: 15,
    color: "rgba(255,255,255,0.82)",
  },
  cardEyebrow: {
    marginTop: 8,
    fontFamily: "Inter-SemiBold",
    fontSize: 10,
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.72)",
  },
  heroTitle: {
    fontFamily: "NewKansas-Medium",
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: -0.6,
    color: "#fff",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: "Lexend-Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 26,
  },
  // Solid white, same as the pill beside it — a light glass surface disappears
  // against a bright cover and takes the dark icon with it.
  circleAction: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  // Solid frosted-white pill — stays legible over any cover, unlike glass.
  pillCta: {
    flex: 1,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.94)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  pillCtaText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
});
