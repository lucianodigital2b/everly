import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
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

  const guestLabel = `${data.uploadCount} ${
    data.uploadCount === 1 ? "guest" : "guests"
  }`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundPrimary }}>
      <Stack.Screen options={EVENT_SCREEN_OPTIONS} />

      {/* ── Cover: full-bleed photo, pinned behind the hero ── */}
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
        {/* Light veil up top for the back button, deep shade below for the text. */}
        <LinearGradient
          colors={["rgba(0,0,0,0.32)", "rgba(0,0,0,0)", "rgba(0,0,0,0.78)"]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Transition.View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
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

          {/* Title block + actions, anchored to the bottom */}
          <View style={{ marginTop: "auto" }}>
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
              <TouchableOpacity onPress={openQr} activeOpacity={0.8}>
                <GlassSurface
                  tint="light"
                  shape="circle"
                  intensity={60}
                  style={styles.circleAction}
                >
                  <QrCode size={24} color={colors.textPrimary} />
                </GlassSurface>
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
          style={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            backgroundColor: colors.backgroundPrimary,
            minHeight: SCREEN_HEIGHT * 0.6,
          }}
        >
          <View style={{ paddingHorizontal: H_PAD, paddingTop: 28 }}>
            {/* Gallery header */}
            <View className="flex-row justify-between items-baseline mb-4">
              <SerifBoldText className="text-2xl">Gallery</SerifBoldText>
              <SansText className="text-sm text-textSecondary">
                {photosLoading
                  ? "Loading…"
                  : data.uploadCount === 0
                    ? "No photos yet"
                    : `${data.uploadCount} photo${data.uploadCount === 1 ? "" : "s"}`}
              </SansText>
            </View>

            {/* Gallery body */}
            {data.uploadCount === 0 ? (
              <EmptyState
                variant="bare"
                icon={Images}
                title="No photos yet"
                subtitle="Share the QR code so guests can start adding their shots."
              />
            ) : !event.is_revealed ? (
              <EmptyState
                variant="bare"
                icon={Clock}
                title="Not yet revealed"
                subtitle="Photos will appear here once the gallery is revealed."
              />
            ) : photosLoading ? (
              <View className="items-center py-12">
                <ActivityIndicator color={colors.accent} />
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
  glassButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
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
  circleAction: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
