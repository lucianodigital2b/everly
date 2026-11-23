import React, { useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  View,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { File, Paths } from "expo-file-system";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Share2, X } from "lucide-react-native";
import { eventsApi } from "../services/api";
import { t } from "../i18n";

const { width: W, height: H } = Dimensions.get("window");

const SUPPORT_EMAIL = "luciano@getclevernote.app";

// Fullscreen photo viewer (lightbox). Tap anywhere or the X to close.
//
// Opened from the host's gallery with the event and photo ids, which turns on
// the moderation menu: remove the photo, remove everything a guest sent and
// block them, or report it to us. App Review requires all three for an app
// whose users see each other's photos (guideline 1.2).
export default function PhotoViewer() {
  const { url, eventId, photoId, guest } = useLocalSearchParams<{
    url?: string;
    eventId?: string;
    photoId?: string;
    guest?: string;
  }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [sharing, setSharing] = useState(false);
  const [removing, setRemoving] = useState(false);

  const canModerate = !!eventId && !!photoId;
  const guestLabel = guest?.trim() || t("photo.thisGuest");

  const handleShare = async () => {
    if (!url || sharing) return;
    setSharing(true);
    try {
      // The sheet needs a local file: handed a remote URL, iOS shares it as a
      // link, so Instagram & co. would receive a link instead of the photo.
      const name =
        url.split("/").pop()?.split("?")[0] || `everly-${Date.now()}.jpg`;
      const file = await File.downloadFileAsync(url, new File(Paths.cache, name));

      await Share.share(
        Platform.OS === "ios"
          ? { url: file.uri }
          : { message: url, url: file.uri },
      );
    } catch (e: any) {
      Alert.alert(t("photo.couldntShare"), e?.message ?? t("photo.pleaseTryAgain"));
    } finally {
      setSharing(false);
    }
  };

  const remove = async (blockGuest: boolean) => {
    if (!eventId || !photoId) return;
    setRemoving(true);
    try {
      await eventsApi.removePhoto(eventId, photoId, { blockGuest });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["event-photos", eventId] }),
        queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
      ]);
      router.back();
    } catch (e: any) {
      setRemoving(false);
      Alert.alert(t("photo.couldntRemove"), e?.message ?? t("photo.pleaseTryAgain"));
    }
  };

  const confirmRemove = () =>
    Alert.alert(t("photo.removeConfirmTitle"), t("photo.removeConfirmMessage"), [
      { text: t("photo.cancel"), style: "cancel" },
      { text: t("photo.remove"), style: "destructive", onPress: () => remove(false) },
    ]);

  const confirmBlock = () =>
    Alert.alert(
      t("photo.removeBlockConfirmTitle", { guest: guestLabel }),
      t("photo.removeBlockConfirmMessage"),
      [
        { text: t("photo.cancel"), style: "cancel" },
        { text: t("photo.removeBlock"), style: "destructive", onPress: () => remove(true) },
      ],
    );

  const report = async () => {
    const subject = encodeURIComponent(t("photo.reportSubject"));
    const body = encodeURIComponent(
      t("photo.reportBody", { eventId, photoId }),
    );
    const mail = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    if (await Linking.canOpenURL(mail)) {
      Linking.openURL(mail);
    } else {
      Alert.alert(
        t("photo.noMailApp"),
        t("photo.reportFallback", { email: SUPPORT_EMAIL, eventId, photoId }),
      );
    }
  };

  const openMenu = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            t("photo.removePhoto"),
            t("photo.removeAllFromGuest", { guest: guestLabel }),
            t("photo.reportPhoto"),
            t("photo.cancel"),
          ],
          destructiveButtonIndex: [0, 1],
          cancelButtonIndex: 3,
        },
        (index) => {
          if (index === 0) confirmRemove();
          else if (index === 1) confirmBlock();
          else if (index === 2) report();
        },
      );
      return;
    }
    // Android alerts hold three buttons at most, so the cancel is the scrim.
    Alert.alert(
      t("photo.menuTitle"),
      undefined,
      [
        { text: t("photo.report"), onPress: report },
        { text: t("photo.removeBlock"), style: "destructive", onPress: confirmBlock },
        { text: t("photo.remove"), style: "destructive", onPress: confirmRemove },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={styles.black}>
      <StatusBar style="light" />
      <Pressable style={styles.fill} onPress={() => router.back()}>
        {url ? (
          <Image
            source={{ uri: url }}
            style={{ width: W, height: H }}
            resizeMode="contain"
          />
        ) : null}
      </Pressable>

      {/* Absolutely positioned over full-bleed content, so the top inset is
          applied by hand rather than through SafeAreaView. */}
      <View
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.roundBtn}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t("photo.close")}
        >
          <X size={22} color="#fff" />
        </Pressable>

        <View style={styles.actions} pointerEvents="box-none">
          {url ? (
            <Pressable
              onPress={handleShare}
              disabled={sharing}
              style={styles.roundBtn}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t("photo.sharePhoto")}
            >
              {sharing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Share2 size={20} color="#fff" />
              )}
            </Pressable>
          ) : null}

          {canModerate ? (
            <Pressable
              onPress={openMenu}
              disabled={removing}
              style={styles.roundBtn}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t("photo.removeOrReport")}
            >
              {removing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MoreHorizontal size={22} color="#fff" />
              )}
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: "#000" },
  fill: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  actions: { flexDirection: "row", gap: 10 },
  roundBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
