import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Users,
  Camera,
  Clock,
  ChevronRight,
  QrCode,
  PartyPopper,
} from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { EventCard } from "../../components/EventCard";
import { EmptyState } from "../../components/EmptyState";
import { GlassSurface } from "../../components/GlassSurface";
import { eventsApi, type Event } from "../../services/api";
import { colors } from "../../constants/colors";
import { eventCover } from "../../constants/sampleImages";

const mapStatus = (event: Event): "Draft" | "Live" | "Revealed" => {
  if (event.is_revealed) return "Revealed";
  if (event.status === "active") return "Live";
  return "Draft";
};

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

// ─── Featured hero card ─────────────────────────────────────────────────────
const FeaturedCard = ({
  event,
  onPress,
}: {
  event: Event;
  onPress: () => void;
}) => {
  const status = mapStatus(event);
  const statusColor =
    status === "Revealed"
      ? colors.accent
      : status === "Live"
      ? colors.success
      : colors.textTertiary;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.hero}>
      <Image
        source={{ uri: eventCover(event.cover_image_url) }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["rgba(20,12,8,0.05)", "rgba(20,12,8,0.78)"]}
        locations={[0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <GlassSurface
        tint="dark"
        shape="capsule"
        cornerRadius={999}
        style={styles.heroPill}
      >
        <View style={[styles.heroDot, { backgroundColor: statusColor }]} />
        <Text style={styles.heroPillText}>{status}</Text>
      </GlassSurface>

      <View style={styles.heroBody}>
        <Text style={styles.heroDate}>{formatDate(event.expires_at)}</Text>
        <Text style={styles.heroTitle} numberOfLines={2}>
          {event.name}
        </Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Users size={14} color={colors.accentBright} strokeWidth={2} />
            <Text style={styles.heroStatText}>
              {event.participant_limit ?? "∞"} guests
            </Text>
          </View>
          <View style={styles.heroStat}>
            <Camera size={14} color={colors.accentBright} strokeWidth={2} />
            <Text style={styles.heroStatText}>{event.shot_limit ?? "∞"} shots</Text>
          </View>
          <View style={styles.heroStat}>
            <Clock size={14} color={colors.accentBright} strokeWidth={2} />
            <Text style={styles.heroStatText}>
              {event.reveal_time ?? "Instant"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function EventsScreen() {
  const router = useRouter();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: eventsApi.index,
  });

  const list = events ?? [];
  const featured =
    list.find((e) => e.status === "active" && !!e.cover_image_url) ??
    list.find((e) => !!e.cover_image_url) ??
    list[0];
  const rest = featured ? list.filter((e) => e.id !== featured.id) : list;

  const renderItem = ({ item }: { item: Event }) => (
    <EventCard
      title={item.name}
      date={formatDate(item.expires_at)}
      participantCount={item.participant_limit}
      status={mapStatus(item)}
      thumbnailUrl={eventCover(item.cover_image_url)}
      onPress={() => router.push(`/event/${item.id}`)}
    />
  );

  return (
    <ScreenWrapper>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={rest}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
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

              {/* Greeting */}
              <View style={{ marginTop: 18, marginBottom: 22 }}>
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

              {/* Featured */}
              {featured && (
                <FeaturedCard
                  event={featured}
                  onPress={() => router.push(`/event/${featured.id}`)}
                />
              )}

              {rest.length > 0 && (
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>Your events</Text>
                  <ChevronRight size={18} color={colors.textTertiary} />
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            !featured ? (
              <View style={{ marginTop: 20 }}>
                <EmptyState
                  icon={PartyPopper}
                  title="No events yet"
                  subtitle="Create your first gallery and start collecting everyone's moments."
                  actionLabel="Create Event"
                  onAction={() => router.push("/(tabs)/create")}
                />
              </View>
            ) : null
          }
        />
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
  hero: {
    height: 300,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: colors.surface2,
    shadowColor: "#3A2E33",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 26,
    elevation: 8,
  },
  heroPill: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  heroDot: { width: 6, height: 6, borderRadius: 3 },
  heroPillText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 11,
    color: "#fff",
  },
  heroBody: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
  },
  heroDate: {
    fontFamily: "Inter-Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: "Inter-ExtraBold",
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.8,
    color: "#fff",
  },
  heroStats: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
  },
  heroStat: { flexDirection: "row", alignItems: "center", gap: 5 },
  heroStatText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 12.5,
    color: "rgba(255,255,255,0.9)",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "Inter-Bold",
    fontSize: 19,
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
});
