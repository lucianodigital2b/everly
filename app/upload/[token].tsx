import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { File, Paths } from "expo-file-system";
import { useImage, useCanvasRef, ImageFormat } from "@shopify/react-native-skia";
import { Camera, Check, ImageUp, X, CalendarX } from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { EmptyState } from "../../components/EmptyState";
import { FilteredPhoto } from "../../components/FilteredPhoto";
import { colors } from "../../constants/colors";
import {
  ANALOG_FILTERS,
  getAnalogFilter,
  type AnalogFilterKey,
} from "../../constants/analogFilters";
import { uploadApi, type UploadToken } from "../../services/api";
import { captureStore } from "../../zustand/capture-store";
import * as StorageHelper from "../../utils/StorageHelper";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PREVIEW_WIDTH = SCREEN_WIDTH - 48;
const THUMB_WIDTH = 72;
const THUMB_HEIGHT = 92;

export default function GuestUploadScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();

  const [status, setStatus] = useState<"loading" | "ready" | "invalid">(
    "loading"
  );
  const [tokenInfo, setTokenInfo] = useState<UploadToken | null>(null);
  const [guestToken, setGuestToken] = useState<string | undefined>();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoSize, setPhotoSize] = useState({ width: 0, height: 0 });
  const [filterKey, setFilterKey] = useState<AnalogFilterKey>("kodak");
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [queue, setQueue] = useState<string[]>([]); // photos waiting to review

  const shotLimit = tokenInfo?.event.shotLimit;
  const remaining =
    shotLimit == null ? 20 : Math.max(0, shotLimit - uploadedCount);

  // Load a photo (by uri) into the review canvas, fetching its dimensions.
  const loadUri = useCallback((uri: string) => {
    setFilterKey("kodak");
    setPhotoUri(uri);
    Image.getSize(
      uri,
      (w, h) => setPhotoSize({ width: w || 1, height: h || 1 }),
      () => setPhotoSize({ width: 1, height: 1 })
    );
  }, []);

  // When we return from the in-app camera, pull the captured batch in.
  useFocusEffect(
    useCallback(() => {
      const pending = captureStore.getState().photos;
      if (pending.length > 0 && !photoUri) {
        captureStore.getState().clear();
        const [first, ...rest] = pending;
        setQueue(rest);
        loadUri(first);
      }
    }, [photoUri, loadUri])
  );

  const seed = useRef(Math.random() * 1000).current;
  const canvasRef = useCanvasRef();
  const skImage = useImage(photoUri ?? undefined);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const stored = await StorageHelper.getItem(`guestToken:${token}`);
        if (stored) setGuestToken(JSON.parse(stored));
      } catch {
        // no stored guest token yet
      }
      try {
        const info = await uploadApi.show(String(token));
        setTokenInfo(info);
        setStatus(info.active ? "ready" : "invalid");
      } catch {
        setStatus("invalid");
      }
    })();
  }, [token]);

  const canvasSize = useMemo(() => {
    if (!photoSize.width || !photoSize.height) {
      return { width: PREVIEW_WIDTH, height: PREVIEW_WIDTH };
    }
    const ratio = photoSize.height / photoSize.width;
    return { width: PREVIEW_WIDTH, height: Math.min(PREVIEW_WIDTH * ratio, PREVIEW_WIDTH * 1.4) };
  }, [photoSize]);

  const pickFrom = async (source: "camera" | "library") => {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 0.9 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.9,
          });

    if (result.canceled) return;
    const asset = result.assets[0];
    setFilterKey("kodak");
    setPhotoUri(asset.uri);
    setPhotoSize({ width: asset.width ?? 1, height: asset.height ?? 1 });
  };

  const reset = () => {
    setPhotoUri(null);
    setPhotoSize({ width: 0, height: 0 });
    setQueue([]);
  };

  const handleUpload = async () => {
    if (!canvasRef.current || uploading) return;
    setUploading(true);
    try {
      const snapshot = canvasRef.current.makeImageSnapshot();
      const bytes = snapshot.encodeToBytes(ImageFormat.JPEG, 90);

      const file = new File(Paths.cache, `everly-${Date.now()}.jpg`);
      file.create();
      file.write(bytes);

      const formData = new FormData();
      // NOTE: assumes the Laravel guest upload endpoint reads the file
      // from a "photo" field — confirm against the backend route.
      formData.append("photo", {
        uri: file.uri,
        name: file.name,
        type: "image/jpeg",
      } as any);

      const res = await uploadApi.store(String(token), formData, guestToken);
      if (res.guest_token && res.guest_token !== guestToken) {
        setGuestToken(res.guest_token);
        await StorageHelper.setItem(`guestToken:${token}`, res.guest_token);
      }

      setUploadedCount((c) => c + 1);
      // advance to the next queued capture, or finish
      if (queue.length > 0) {
        const [next, ...rest] = queue;
        setQueue(rest);
        loadUri(next);
      } else {
        reset();
      }
    } catch (err: any) {
      Alert.alert(
        "Upload failed",
        err?.response?.data?.message ?? "Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  if (status === "loading") {
    return (
      <ScreenWrapper>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={colors.accent} />
        </View>
      </ScreenWrapper>
    );
  }

  if (status === "invalid") {
    return (
      <ScreenWrapper>
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 8 }}>
          <EmptyState
            icon={CalendarX}
            title="Not accepting photos"
            subtitle="This event may have ended or reached its upload limit."
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={{ paddingTop: 16, paddingBottom: 24, alignItems: "center" }}>
        <Text
          style={{
            fontFamily: "Inter-ExtraBold",
            fontSize: 20,
            color: colors.textPrimary,
          }}
        >
          {tokenInfo?.event.title ?? tokenInfo?.event.name}
        </Text>
        {uploadedCount > 0 && (
          <Text
            style={{
              fontFamily: "Inter-Regular",
              fontSize: 13,
              color: colors.accent,
              marginTop: 4,
            }}
          >
            {uploadedCount} photo{uploadedCount === 1 ? "" : "s"} shared
          </Text>
        )}
      </View>

      {!photoUri ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => router.push(`/camera?limit=${remaining}`)}
            activeOpacity={0.85}
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Camera size={36} color={colors.white} strokeWidth={1.5} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => pickFrom("library")} activeOpacity={0.7}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <ImageUp size={16} color={colors.textSecondary} />
              <Text
                style={{
                  fontFamily: "Inter-Regular",
                  fontSize: 14,
                  color: colors.textSecondary,
                }}
              >
                Choose from library
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ alignItems: "center" }}>
            {skImage ? (
              <FilteredPhoto
                canvasRef={canvasRef}
                image={skImage}
                width={canvasSize.width}
                height={canvasSize.height}
                preset={getAnalogFilter(filterKey)}
                seed={seed}
              />
            ) : (
              <View
                style={{
                  width: canvasSize.width,
                  height: canvasSize.height,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator color={colors.accent} />
              </View>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 4 }}
          >
            {ANALOG_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilterKey(f.key)}
                activeOpacity={0.8}
                style={{ alignItems: "center", marginRight: 14 }}
              >
                <View
                  style={{
                    width: THUMB_WIDTH,
                    height: THUMB_HEIGHT,
                    borderRadius: 12,
                    overflow: "hidden",
                    borderWidth: 2,
                    borderColor:
                      filterKey === f.key ? colors.accent : "transparent",
                  }}
                >
                  {skImage && (
                    <FilteredPhoto
                      image={skImage}
                      width={THUMB_WIDTH}
                      height={THUMB_HEIGHT}
                      preset={f}
                      seed={seed}
                    />
                  )}
                </View>
                <Text
                  style={{
                    marginTop: 6,
                    fontFamily: "Inter-Medium",
                    fontSize: 11,
                    color: filterKey === f.key ? colors.accent : colors.textSecondary,
                  }}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 24,
              paddingBottom: 24,
            }}
          >
            <TouchableOpacity
              onPress={reset}
              disabled={uploading}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.backgroundSecondary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleUpload}
              disabled={uploading || !skImage}
              activeOpacity={0.85}
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
                opacity: uploading || !skImage ? 0.6 : 1,
              }}
            >
              {uploading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Check size={28} color={colors.white} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
}
