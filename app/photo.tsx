import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  View,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { File, Paths } from "expo-file-system";
import { Share2, X } from "lucide-react-native";

const { width: W, height: H } = Dimensions.get("window");

// Fullscreen photo viewer (lightbox). Tap anywhere or the X to close.
export default function PhotoViewer() {
  const { url } = useLocalSearchParams<{ url?: string }>();
  const [sharing, setSharing] = useState(false);

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
      Alert.alert("Couldn't share", e?.message ?? "Please try again.");
    } finally {
      setSharing(false);
    }
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

      <SafeAreaView
        style={styles.topBar}
        edges={["top"]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.roundBtn}
          hitSlop={10}
        >
          <X size={22} color="#fff" />
        </Pressable>

        {url ? (
          <Pressable
            onPress={handleShare}
            disabled={sharing}
            style={styles.roundBtn}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Share photo"
          >
            {sharing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Share2 size={20} color="#fff" />
            )}
          </Pressable>
        ) : null}
      </SafeAreaView>
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
    paddingTop: 8,
  },
  roundBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
