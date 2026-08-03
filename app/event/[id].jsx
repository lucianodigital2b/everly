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
import Transition from "react-native-screen-transitions";
import { GlassSurface } from "../../components/GlassSurface";
import { SerifBoldText, SansText, SansSemiText } from "../../components/Text";
import { EmptyState } from "../../components/EmptyState";
import { colors } from "../../constants/colors";
import { eventCover } from "../../constants/sampleImages";
import { eventsApi } from "../../services/api";
import {
  QrCode,
  Clock,
  ChevronLeft,
  Play,
  Images,
  ArrowUpRight,
} from "lucide-react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const H_PAD = 24; // matches ScreenWrapper px-6
const GAP = 6;
// Bento layout: a wide/tall feature tile beside two stacked small tiles.
const CONTENT_W = SCREEN_WIDTH - H_PAD * 2;
const BENTO_BIG_W = Math.round((CONTENT_W - GAP) * 0.6);
const BENTO_SMALL_W = CONTENT_W - GAP - BENTO_BIG_W;
const BENTO_ROW_H = 232;
const BENTO_SMALL_H = (BENTO_ROW_H - GAP) / 2;
const BENTO_HALF_W = (CONTENT_W - GAP) / 2;
const EVENT_SCREEN_OPTIONS = {
  headerShown: false,
};

// The hero card. Wide margins, a little taller than square — enough room for a
// plate number up top and the look credit along the bottom.
const CARD_W = SCREEN_WIDTH - H_PAD * 2;
const CARD_H = Math.min(Math.round(SCREEN_HEIGHT * 0.46), Math.round(CARD_W * 1.2));

// Every guest shoots the event's filter, so the card credits it like a film
// stock. Codes are decorative; the label and blurb are the real information.
const FILTER_TAG = {
  none: { code: "N0", label: "Natural", blurb: "No filter — true colours." },
  warm: { code: "W2", label: "Warm", blurb: "Every guest shoots this look." },
  film: { code: "F4", label: "Film", blurb: "Every guest shoots this look." },
  mono: { code: "M1", label: "Mono", blurb: "Every guest shoots this look." },
};

const REVEAL_TAG = {
  Instant: "REVEALS AS THEY SHOOT",
  "End of Event": "REVEALS WHEN IT ENDS",
  Scheduled: "REVEALS AT A SET TIME",
};

const statusConfig = (event) => {
  if (event.is_revealed) return { label: "Revealed", color: colors.accent };
  if (event.status === "active")
    return { label: "Live", color: colors.success };
  return { label: "Draft", color: "rgba(255,255,255,0.8)" };
};

export default function EventDetailScreen() {
  const { id, sharedBoundTag } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const coverSharedBoundTag =
    typeof sharedBoundTag === "string" && sharedBoundTag.length > 0
      ? sharedBoundTag
      : `event-cover-${id}`;

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
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
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
          Event not found.
        </SansSemiText>
      </View>
    );
  }

  const status = statusConfig(event);

  const PhotoTile = ({ photo, width, height }) => {
    const duration = formatDuration(photo.duration_seconds);
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          router.push(`/photo?url=${encodeURIComponent(photo.url)}`)
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

  // Lay photos into a bento: groups of 3 (feature + two stacked, alternating
  // sides), with graceful fallbacks for 1–2 leftover photos.
  const renderBento = (all) => {
    const rows = [];
    let i = 0;
    let g = 0;
    while (i < all.length) {
      const remaining = all.length - i;
      if (remaining >= 3) {
        const a = all[i];
        const b = all[i + 1];
        const c = all[i + 2];
        const bigLeft = g % 2 === 0;
        const big = (
          <PhotoTile photo={a} width={BENTO_BIG_W} height={BENTO_ROW_H} />
        );
        const stack = (
          <View style={{ gap: GAP }}>
            <PhotoTile photo={b} width={BENTO_SMALL_W} height={BENTO_SMALL_H} />
            <PhotoTile photo={c} width={BENTO_SMALL_W} height={BENTO_SMALL_H} />
          </View>
        );
        rows.push(
          <View
            key={`row-${g}`}
            style={{ flexDirection: "row", gap: GAP, marginBottom: GAP }}
          >
            {bigLeft ? big : stack}
            {bigLeft ? stack : big}
          </View>,
        );
        i += 3;
      } else if (remaining === 2) {
        rows.push(
          <View
            key={`row-${g}`}
            style={{ flexDirection: "row", gap: GAP, marginBottom: GAP }}
          >
            <PhotoTile
              photo={all[i]}
              width={BENTO_HALF_W}
              height={BENTO_HALF_W}
            />
            <PhotoTile
              photo={all[i + 1]}
              width={BENTO_HALF_W}
              height={BENTO_HALF_W}
            />
          </View>,
        );
        i += 2;
      } else {
        rows.push(
          <View key={`row-${g}`} style={{ marginBottom: GAP }}>
            <PhotoTile photo={all[i]} width={CONTENT_W} height={200} />
          </View>,
        );
        i += 1;
      }
      g += 1;
    }
    return <View>{rows}</View>;
  };

  // uploadCount is the *photo* count (BACKEND.md), which the card now states —
  // so the subtitle carries the guest allowance instead of repeating it under
  // the wrong noun.
  const guestLabel = `${event.participant_limit ?? "∞"} guests`;

  const filterTag = FILTER_TAG[event.filter] ?? FILTER_TAG.none;
  const revealTag = REVEAL_TAG[event.reveal_time] ?? "REVEALS WHEN IT ENDS";

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundPrimary }}>
      <Stack.Screen options={EVENT_SCREEN_OPTIONS} />

      {/* ── Backdrop: the cover again, blown up and frosted, so the card in
             front of it reads as the one sharp thing on the screen. Keeps the
             shared-element bound tag — this is what flies in from the list. ── */}
      <Transition.View
        sharedBoundTag={coverSharedBoundTag}
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
      </Transition.View>

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
          {/* Back only — the QR lives in the action row below */}
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.75}>
            <GlassSurface tint="dark" shape="circle" style={styles.glassButton}>
              <ChevronLeft size={24} color="#fff" />
            </GlassSurface>
          </TouchableOpacity>

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
                      {data.uploadCount === 1 ? "photo" : "photos"}
                    </Text>
                    <Text style={styles.cardCaption}>so far</Text>
                  </View>
                </View>
                <Text style={styles.cardEyebrow}>{revealTag}</Text>
              </View>

              {/* Bottom: the look every guest shoots in */}
              <View style={styles.cardBottom}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>{filterTag.code}</Text>
                  </View>
                  <Text style={styles.cardBadgeLabel}>{filterTag.label}</Text>
                </View>
                <Text style={styles.cardFine}>{filterTag.blurb}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Title block + actions, anchored to the bottom */}
          <View>
            <GlassSurface
              tint="dark"
              shape="capsule"
              cornerRadius={999}
              style={styles.statusPill}
            >
              <View
                className="w-1.5 h-1.5 rounded-full mr-2"
                style={{ backgroundColor: status.color }}
              />
              <SansSemiText
                className="text-xs tracking-widest"
                style={{ color: status.color }}
              >
                {status.label}
              </SansSemiText>
            </GlassSurface>

            <SerifBoldText
              className="text-white"
              style={styles.heroTitle}
              numberOfLines={2}
            >
              {event.name}
            </SerifBoldText>
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
                accessibilityLabel="Share QR code"
              >
                <QrCode size={24} color={colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={scrollToGallery}
                activeOpacity={0.85}
                style={styles.pillCta}
              >
                <SansSemiText style={styles.pillCtaText}>
                  View gallery
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
              <SerifBoldText className="text-2xl">Gallery</SerifBoldText>
              {/* Silent when empty — the placeholder below already says it. */}
              <SansText className="text-sm text-textSecondary">
                {photosLoading
                  ? "Loading…"
                  : data.uploadCount === 0
                    ? ""
                    : `${data.uploadCount} photo${data.uploadCount === 1 ? "" : "s"}`}
              </SansText>
            </View>

            {/* Gallery body — placeholders centre in the sheet instead of
                clinging to the top of an empty screen. */}
            {data.uploadCount === 0 ? (
              <View style={styles.placeholder}>
                <EmptyState
                  variant="bare"
                  icon={Images}
                  title="No photos yet"
                  subtitle="Share the QR code so guests can start adding their shots."
                  actionLabel="Share QR code"
                  onAction={openQr}
                />
              </View>
            ) : !event.is_revealed ? (
              <View style={styles.placeholder}>
                <EmptyState
                  variant="bare"
                  icon={Clock}
                  title="Not yet revealed"
                  subtitle="Photos will appear here once the gallery is revealed."
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
              renderBento(photos)
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontFamily: "Inter-ExtraBold",
    fontSize: 96,
    lineHeight: 104,
    letterSpacing: -4,
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
    fontFamily: "Inter-Medium",
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
  cardBottom: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 18,
  },
  cardBadge: {
    backgroundColor: colors.accent,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginRight: 9,
  },
  cardBadgeText: {
    fontFamily: "Inter-ExtraBold",
    fontSize: 14,
    color: "#2E2429",
  },
  cardBadgeLabel: {
    fontFamily: "Inter-ExtraBold",
    fontSize: 22,
    letterSpacing: -0.5,
    color: "#fff",
  },
  cardFine: {
    marginTop: 5,
    fontFamily: "Inter-Medium",
    fontSize: 12.5,
    color: "rgba(255,255,255,0.75)",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 46,
    lineHeight: 50,
    letterSpacing: -1,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 21,
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
