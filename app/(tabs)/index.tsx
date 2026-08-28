import React from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Users,
  Images as ImagesIcon,
  Clock,
  ChevronRight,
  QrCode,
  PartyPopper,
} from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { EmptyState } from "../../components/EmptyState";
import { GlassSurface } from "../../components/GlassSurface";
import { eventsApi, type Event, type EventPhoto } from "../../services/api";
import { colors } from "../../constants/colors";
import { eventCover, VINTAGE_FILTER } from "../../constants/sampleImages";

// Home is split in two: what is happening now (a 9:16 hero carousel, one card
// per live event) and what already happened (compact rows, each with a strip of
// tilted photo prints). The size gap between the two is the hierarchy — a
// memory print is a fraction of an active card on purpose.

const SCREEN_PAD = 24; // ScreenWrapper's px-6, undone so carousels bleed edge to edge
const CARD_GAP = 14;
const CARD_ASPECT = 0.72; // width ÷ height of an active card
const PRINT_W = 76;
const PRINT_H = 100;

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "No date set";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return "morning,";
  if (h < 18) return "afternoon,";
  return "evening,";
};

/** "1h 34m" / "3d" / "12m" — null once the window has closed. */
const timeLeft = (iso: string | null): string | null => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return mins % 60 ? `${hours}h ${mins % 60}m` : `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

/** Revealed, or past its window — either way it belongs in Memories. */
const isPast = (e: Event): boolean => {
  if (e.is_revealed) return true;
  if (e.expires_at && new Date(e.expires_at).getTime() <= Date.now()) return true;
  return false;
};

const eventTime = (e: Event): number =>
  new Date(e.event_date ?? e.expires_at ?? e.created_at).getTime();

// ─── Active: 9:16 hero card ─────────────────────────────────────────────────
const ActiveCard = ({
  event,
  width,
  height,
  onPress,
}: {
  event: Event;
  width: number;
  height: number;
  onPress: () => void;
}) => {
  const left = timeLeft(event.expires_at);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[styles.card, { width, height }]}
    >
      <Image
        source={{ uri: eventCover(event.cover_image_url) }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["rgba(20,12,8,0.02)", "rgba(20,12,8,0.74)"]}
        locations={[0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      {left && (
        <GlassSurface
          tint="dark"
          shape="capsule"
          cornerRadius={999}
          style={styles.cardPill}
        >
          <Clock size={12} color="#fff" strokeWidth={2.2} />
          <Text style={styles.cardPillText}>{left}</Text>
        </GlassSurface>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {event.name}
        </Text>
        {/* Icon + count only — no labels. */}
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Users size={13} color="rgba(255,255,255,0.9)" strokeWidth={2.2} />
            <Text style={styles.statText}>{event.participant_limit ?? "∞"}</Text>
          </View>
          <View style={styles.stat}>
            <ImagesIcon size={13} color="rgba(255,255,255,0.9)" strokeWidth={2.2} />
            <Text style={styles.statText}>{event.shot_limit ?? "∞"}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Memories: tilted print strip ───────────────────────────────────────────
const PhotoStrip = ({
  eventId,
  onPress,
}: {
  eventId: number;
  onPress: () => void;
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ["event-photos", eventId],
    queryFn: () => eventsApi.photos(eventId),
    staleTime: 5 * 60 * 1000,
  });

  const photos: EventPhoto[] = (data?.photos ?? []).slice(0, 12);

  if (isLoading) {
    return (
      <View style={styles.stripRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.print,
              styles.printSkeleton,
              { transform: [{ rotate: `${i % 2 === 0 ? -4 : 4}deg` }] },
            ]}
          />
        ))}
      </View>
    );
  }

  if (photos.length === 0) {
    return <Text style={styles.stripEmpty}>No photos in this gallery</Text>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.stripRow}
    >
      {photos.map((photo, i) => (
        <TouchableOpacity
          key={photo.id}
          activeOpacity={0.85}
          onPress={onPress}
          style={[
            styles.print,
            { transform: [{ rotate: `${i % 2 === 0 ? -4.5 : 4.5}deg` }] },
          ]}
        >
          <Image
            source={{ uri: photo.thumbnail_url ?? photo.url }}
            style={[StyleSheet.absoluteFill, { filter: VINTAGE_FILTER } as any]}
            resizeMode="cover"
            fadeDuration={0}
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const MemoryRow = ({
  event,
  onPress,
}: {
  event: Event;
  onPress: () => void;
}) => (
  <View style={styles.memory}>
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.memoryHead}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.memoryTitle} numberOfLines={1}>
          {event.name}
        </Text>
        <Text style={styles.memoryDate}>
          {formatDate(event.event_date ?? event.expires_at)}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.textTertiary} />
    </TouchableOpacity>
    <PhotoStrip eventId={event.id} onPress={onPress} />
  </View>
);

export default function EventsScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: eventsApi.index,
  });

  const list = events ?? [];
  // Soonest to close first; memories newest first.
  const active = list
    .filter((e) => !isPast(e))
    .sort((a, b) => eventTime(a) - eventTime(b));
  const past = list.filter(isPast).sort((a, b) => eventTime(b) - eventTime(a));

  // Portrait but chunky (wider than 9:16 so the cover reads as a photo, not a
  // story frame), capped by screen height so the card never eats the whole
  // viewport. The 56px it leaves behind is the peek that says "swipe".
  const cardH = Math.min((width - SCREEN_PAD * 2 - 56) / CARD_ASPECT, height * 0.5);
  const cardW = Math.round(cardH * CARD_ASPECT);

  const openEvent = (id: number) => router.push(`/event/${id}`);

  return (
    <ScreenWrapper>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Wordmark + scan QR */}
          <View style={styles.topRow}>
            <Text style={styles.wordmark}>
              ever<Text style={{ color: colors.accent }}>ly</Text>
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/scan")}
              style={styles.scanBtn}
            >
              <QrCode size={20} color={colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Greeting — the big stacked type would push the active carousel
              below the fold, so it only shows when there is nothing live. */}
          {active.length === 0 ? (
            <View style={{ marginTop: 18, marginBottom: 26 }}>
              <Text style={styles.greetThin}>Good</Text>
              <Text style={styles.greetBold}>{greeting()}</Text>
              <Text style={styles.greetSub}>
                {list.length === 0
                  ? "Start your first gallery below."
                  : `You have ${list.length} ${
                      list.length === 1 ? "event" : "events"
                    }.`}
              </Text>
            </View>
          ) : (
            <View style={{ height: 22 }} />
          )}

          {list.length === 0 && (
            <EmptyState
              icon={PartyPopper}
              title="No events yet"
              subtitle="Create your first gallery and start collecting everyone's moments."
              actionLabel="Create Event"
              onAction={() => router.push("/(tabs)/create")}
            />
          )}

          {/* ── Active ── */}
          {active.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Active</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={cardW + CARD_GAP}
                decelerationRate="fast"
                snapToAlignment="start"
                style={styles.bleed}
                contentContainerStyle={styles.carousel}
              >
                {active.map((event) => (
                  <ActiveCard
                    key={event.id}
                    event={event}
                    width={cardW}
                    height={cardH}
                    onPress={() => openEvent(event.id)}
                  />
                ))}
              </ScrollView>
            </>
          )}

          {/* ── Memories ── */}
          {past.length > 0 && (
            <>
              {active.length > 0 && <View style={styles.divider} />}
              <Text style={styles.sectionLabel}>Memories</Text>
              {past.map((event) => (
                <MemoryRow
                  key={event.id}
                  event={event}
                  onPress={() => openEvent(event.id)}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  wordmark: {
    // Script runs small for its point size and sits on a slanted baseline, so it
    // needs a bigger size, natural letterspacing and a little vertical room.
    fontFamily: "Script",
    fontSize: 48,
    lineHeight: 60,
    color: colors.textPrimary,
  },
  scanBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  greetThin: {
    fontFamily: "Inter-ExtraLight",
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -1.5,
    color: colors.textPrimary,
  },
  greetBold: {
    fontFamily: "Inter-ExtraBold",
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.5,
    color: colors.textPrimary,
  },
  greetSub: {
    fontFamily: "Inter-Regular",
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 10,
  },

  sectionLabel: {
    fontFamily: "Inter-SemiBold",
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.textTertiary,
    marginBottom: 14,
  },

  // Carousels run edge to edge; ScreenWrapper's padding is repaid as content inset.
  bleed: { marginHorizontal: -SCREEN_PAD },
  carousel: {
    paddingHorizontal: SCREEN_PAD,
    paddingBottom: 26,
    gap: CARD_GAP,
  },

  card: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: colors.surface2,
    shadowColor: "#3A2E33",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 8,
  },
  cardPill: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cardPillText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 11.5,
    color: "#fff",
  },
  cardBody: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
  },
  cardTitle: {
    fontFamily: "Inter-ExtraBold",
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.7,
    color: "#fff",
  },
  statRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
  },
  stat: { flexDirection: "row", alignItems: "center", gap: 5 },
  statText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 12.5,
    color: "rgba(255,255,255,0.9)",
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 26,
  },

  memory: { marginBottom: 22 },
  memoryHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memoryTitle: {
    fontFamily: "Inter-Bold",
    fontSize: 18,
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  memoryDate: {
    fontFamily: "Inter-Regular",
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Tilted prints need vertical room for their corners, hence the padding.
  stripRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 14,
    paddingBottom: 6,
    paddingHorizontal: 2,
  },
  print: {
    width: PRINT_W,
    height: PRINT_H,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surface2,
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: "#3A2E33",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  printSkeleton: { borderColor: colors.border },
  stripEmpty: {
    fontFamily: "Inter-Regular",
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 12,
  },
});
