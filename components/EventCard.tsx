import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Users } from "lucide-react-native";
import { GlassSurface } from "./GlassSurface";
import { colors } from "../constants/colors";
import { eventCover } from "../constants/sampleImages";
import { t } from "../i18n";

interface EventCardProps {
  title: string;
  date: string;
  /** null/undefined = unlimited, shown as ∞ (matches the featured card). */
  participantCount?: number | null;
  status: "Draft" | "Live" | "Revealed";
  thumbnailUrl?: string;
  onPress: () => void;
}

// The same card as the featured hero on the events screen, one step down the
// hierarchy: shorter, with a lighter shadow and a single stat. Cover full-bleed
// under a gradient, everything else set on top of it — never a photo stacked on
// a white panel.
export const EventCard: React.FC<EventCardProps> = ({
  title,
  date,
  participantCount,
  status,
  thumbnailUrl,
  onPress,
}) => {
  const statusColor =
    status === "Revealed"
      ? colors.accent
      : status === "Live"
        ? colors.success
        : colors.textTertiary;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
      <Image
        source={{ uri: eventCover(thumbnailUrl) }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["rgba(20,12,8,0.05)", "rgba(20,12,8,0.78)"]}
        locations={[0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

      <GlassSurface
        tint="dark"
        shape="capsule"
        cornerRadius={999}
        style={styles.pill}
      >
        <View style={[styles.dot, { backgroundColor: statusColor }]} />
        <Text style={styles.pillText}>
          {status === "Revealed"
            ? t("eventCard.revealed")
            : status === "Live"
              ? t("eventCard.live")
              : t("eventCard.draft")}
        </Text>
      </GlassSurface>

      <View style={styles.body}>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.stat}>
          <Users size={14} color={colors.accentBright} strokeWidth={2} />
          <Text style={styles.statText}>
            {participantCount == null
              ? t("eventCard.unlimitedGuests")
              : t("eventCard.guestCount", { count: participantCount })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 200,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: colors.surface2,
    shadowColor: "#3A2E33",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  pill: {
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
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 11,
    color: "#fff",
  },
  body: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
  },
  date: {
    fontFamily: "Inter-Medium",
    fontSize: 12.5,
    color: "rgba(255,255,255,0.72)",
    marginBottom: 4,
  },
  title: {
    fontFamily: "Inter-ExtraBold",
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.6,
    color: "#fff",
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  statText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 12.5,
    color: "rgba(255,255,255,0.9)",
  },
});
