import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Clipboard,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import Transition from "react-native-screen-transitions";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import {
  SerifBoldText,
  SansText,
  SansSemiText,
} from "../../components/Text";
import { colors } from "../../constants/colors";
import { eventsApi } from "../../services/api";
import {
  QrCode,
  Clock,
  Users,
  Camera,
  ChevronLeft,
  Share2,
  Play,
  Copy,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PAD = 24; // matches ScreenWrapper px-6
const GAP = 6;
const COL_W = (SCREEN_WIDTH - H_PAD * 2 - GAP) / 2;
const RATIOS = [1.15, 1.5, 1.0, 1.65, 1.3, 1.1, 1.45, 1.25, 1.6, 1.0];
const EVENT_SCREEN_OPTIONS = {
  headerShown: false,
};

const statusConfig = (event) => {
  if (event.is_revealed)
    return { label: "Revealed", color: colors.accent };
  if (event.status === "active")
    return { label: "Live", color: "#4ade80" };
  return { label: "Draft", color: "rgba(255,255,255,0.4)" };
};

export default function EventDetailScreen() {
  const { id, sharedBoundTag } = useLocalSearchParams();
  const router = useRouter();
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
  const leftPhotos = photos.filter((_, i) => i % 2 === 0);
  const rightPhotos = photos.filter((_, i) => i % 2 === 1);

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
      <ScreenWrapper>
        <Stack.Screen options={EVENT_SCREEN_OPTIONS} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!event) {
    return (
      <ScreenWrapper>
        <Stack.Screen options={EVENT_SCREEN_OPTIONS} />
        <View className="flex-1 items-center justify-center">
          <SansSemiText className="text-textSecondary text-base">
            Event not found.
          </SansSemiText>
        </View>
      </ScreenWrapper>
    );
  }

  const status = statusConfig(event);

  const renderPhotoCell = (photo, colIndex, photoIndex) => {
    const ratioIdx = (colIndex * 3 + photoIndex) % RATIOS.length;
    const h = Math.round(COL_W * RATIOS[ratioIdx]);
    const duration = formatDuration(photo.duration_seconds);

    return (
      <TouchableOpacity
        key={photo.id}
        activeOpacity={0.88}
        className="rounded-2xl overflow-hidden bg-backgroundSecondary"
        style={{ height: h, marginBottom: GAP }}
      >
        <Image
          source={{ uri: photo.thumbnail_url ?? photo.url }}
          className="w-full h-full"
          resizeMode="cover"
        />
        {duration && (
          <View className="absolute bottom-2 right-2 flex-row items-center gap-1 bg-black/60 rounded-full px-2 py-1">
            <SansSemiText className="text-white text-xs">{duration}</SansSemiText>
            <Play size={9} color="#fff" fill="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      <Stack.Screen options={EVENT_SCREEN_OPTIONS} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Hero ── */}
        <Transition.View
          sharedBoundTag={coverSharedBoundTag}
          className="relative"
          style={{ height: 320, marginHorizontal: -H_PAD, marginTop: -8 }}
        >
          {event.cover_image_url ? (
            <Image
              source={{ uri: event.cover_image_url }}
              className="absolute inset-0 w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="absolute inset-0 bg-backgroundSecondary" />
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.28)", "transparent", "rgba(0,0,0,0.82)"]}
            locations={[0, 0.38, 1]}
            className="absolute inset-0"
          />

          {/* Back / Share */}
          <View className="flex-row justify-between px-6 pt-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center bg-black/30"
            >
              <ChevronLeft size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity className="w-10 h-10 rounded-full items-center justify-center bg-black/30">
              <Share2 size={19} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Event info */}
          <View className="px-6 pb-7 mt-auto">
            <View
              className="flex-row items-center self-start rounded-full px-3 py-1 mb-3 border"
              style={{
                backgroundColor: status.color + "28",
                borderColor: status.color + "55",
              }}
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
            </View>

            <SerifBoldText
              className="text-4xl leading-tight text-white mb-1"
              numberOfLines={2}
            >
              {event.name}
            </SerifBoldText>
            <SansText className="text-sm text-white/65">
              {formatDate(event.expires_at)}
            </SansText>
          </View>
        </Transition.View>

        {/* ── Body ── */}
        <View className="pt-5">

          {/* Stats */}
          <View className="flex-row items-center bg-backgroundSecondary rounded-3xl py-5 px-2 mb-3">
            <View className="flex-1 items-center gap-1">
              <Users size={15} color={colors.accent} />
              <SerifBoldText className="text-lg">{data.uploadCount}</SerifBoldText>
              <SansText className="text-xs text-textSecondary uppercase tracking-widest">Guests</SansText>
            </View>

            <View className="w-px h-8 bg-white/[0.07]" />

            <View className="flex-1 items-center gap-1">
              <Camera size={15} color={colors.accent} />
              <SerifBoldText className="text-lg">{event.shot_limit ?? "∞"}</SerifBoldText>
              <SansText className="text-xs text-textSecondary uppercase tracking-widest">Shots</SansText>
            </View>

            <View className="w-px h-8 bg-white/[0.07]" />

            <View className="flex-1 items-center gap-1">
              <Clock size={15} color={colors.accent} />
              <SerifBoldText className="text-lg" numberOfLines={1}>
                {event.reveal_time ?? "Instant"}
              </SerifBoldText>
              <SansText className="text-xs text-textSecondary uppercase tracking-widest">Reveal</SansText>
            </View>

            {event.plan && (
              <>
                <View className="w-px h-8 bg-white/[0.07]" />
                <View className="flex-1 items-center gap-1">
                  <SansSemiText className="text-accent text-sm">✦</SansSemiText>
                  <SerifBoldText className="text-lg" numberOfLines={1}>
                    {event.plan.name}
                  </SerifBoldText>
                  <SansText className="text-xs text-textSecondary uppercase tracking-widest">Plan</SansText>
                </View>
              </>
            )}
          </View>

          {/* QR card */}
          <View className="flex-row items-center bg-backgroundSecondary rounded-3xl p-4 mb-7 gap-4">
            <View className="w-14 h-14 rounded-2xl bg-backgroundPrimary items-center justify-center">
              <QrCode size={30} color={colors.textPrimary} />
            </View>
            <View className="flex-1">
              <SerifBoldText className="text-base mb-0.5">Scan to Join</SerifBoldText>
              <SansText className="text-xs text-textSecondary">Share with your guests</SansText>
            </View>
            <TouchableOpacity
              className="flex-row items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-full px-3 py-2"
              onPress={() => Clipboard.setString(event.qr_code_token ?? "")}
            >
              <Copy size={13} color={colors.accent} />
              <SansSemiText className="text-xs text-accent">Copy link</SansSemiText>
            </TouchableOpacity>
          </View>

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
            <View className="bg-backgroundSecondary rounded-3xl p-9 items-center">
              <SansText className="text-sm text-textSecondary text-center leading-6">
                No photos yet.{"\n"}Share the QR code to get started.
              </SansText>
            </View>
          ) : !event.is_revealed ? (
            <View className="bg-backgroundSecondary rounded-3xl p-10 items-center gap-3">
              <Clock size={30} color={colors.textSecondary} />
              <SerifBoldText className="text-xl">Not yet revealed</SerifBoldText>
              <SansText className="text-sm text-textSecondary text-center leading-5">
                Photos will appear here once the gallery is revealed.
              </SansText>
            </View>
          ) : photosLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <View className="flex-row">
              <View className="flex-1">
                {leftPhotos.map((p, i) => renderPhotoCell(p, 0, i))}
              </View>
              <View className="flex-1" style={{ marginLeft: GAP }}>
                {rightPhotos.map((p, i) => renderPhotoCell(p, 1, i))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
