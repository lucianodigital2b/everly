import React from "react";
import {
  Clipboard,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import Reanimated, {
  Easing as ReEasing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Copy, Share2 } from "lucide-react-native";
import { colors } from "../constants/colors";
import { t } from '../i18n';
import { Button } from "./Button";

interface SuccessSheetProps {
  visible: boolean;
  title: string;
  subtitle: string;
  actionLabel: string;
  /** Guest join link. Shown, copyable and shareable when given. */
  link?: string;
  /** Fires on the button, the scrim and the hardware back — dismissal is one path. */
  onDismiss: () => void;
}

/**
 * A confirmation sheet that slides up over the screen it was raised from.
 *
 * Built on the RN `Modal` rather than @gorhom/bottom-sheet: this only ever
 * shows a title, a subtitle and one button, so it needs no snap points, no
 * scrolling and no provider mounted above it — and the wizard underneath keeps
 * its state, which a pushed route wouldn't guarantee.
 *
 * There is exactly one way out, so the caller can treat `onDismiss` as
 * "acknowledged" and move the flow on.
 */
export const SuccessSheet: React.FC<SuccessSheetProps> = ({
  visible,
  title,
  subtitle,
  actionLabel,
  link,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  // "Copiado" replaces the link's own label for a beat, then goes back — the
  // row is the only feedback surface the sheet has room for.
  const [copied, setCopied] = React.useState(false);
  // Press feedback is driven from state rather than Pressable's function-form
  // `style`: that form silently rendered *unstyled* here — no pill, no row —
  // and a confirmation sheet is the last place to find that out.
  const [pressing, setPressing] = React.useState<"copy" | "share" | null>(null);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  const copyLink = () => {
    if (!link) return;
    Clipboard.setString(link);
    Haptics.selectionAsync().catch(() => {});
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1800);
  };

  const shareLink = () => {
    if (!link) return;
    // A share sheet raised over a Modal is fine on both platforms; the sheet
    // stays up behind it so the flow doesn't move on until it's dismissed.
    //
    // `url` is only passed for an http(s) link. iOS hands that field to the
    // target as a real URL, and a custom scheme (`everly://…`) is one many
    // targets quietly drop — the share then arrives with no link in it at all.
    // As plain `message` text it always survives.
    const isWebLink = /^https?:\/\//i.test(link);
    Share.share(isWebLink ? { message: link, url: link } : { message: link }).catch(
      () => {},
    );
  };

  React.useEffect(() => {
    if (!visible) {
      progress.value = 0;
      setCopied(false);
      setPressing(null);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    progress.value = withTiming(1, {
      duration: reducedMotion ? 0 : 320,
      easing: ReEasing.out(ReEasing.cubic),
    });
  }, [visible, reducedMotion]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 320 }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Reanimated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(46,36,41,0.32)" },
            scrimStyle,
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={onDismiss} />
        </Reanimated.View>

        <Reanimated.View
          style={[
            {
              backgroundColor: colors.backgroundSecondary,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 24,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 20) + 12,
              shadowColor: colors.textPrimary,
              shadowOffset: { width: 0, height: -12 },
              shadowOpacity: 0.14,
              shadowRadius: 32,
              elevation: 20,
            },
            sheetStyle,
          ]}
        >
          {/* Grabber — the sheet isn't draggable, but it reads as dismissible. */}
          <View
            style={{
              alignSelf: "center",
              width: 40,
              height: 4,
              borderRadius: 999,
              backgroundColor: colors.border,
              marginBottom: 24,
            }}
          />

          <View
            style={{
              alignSelf: "center",
              width: 64,
              height: 64,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.accentBright,
              marginBottom: 20,
            }}
          >
            <Check size={30} color={colors.accentDeep} strokeWidth={2.5} />
          </View>

          <Text
            style={{
              fontFamily: "Inter-ExtraBold",
              fontSize: 28,
              letterSpacing: -1,
              textAlign: "center",
              color: colors.textPrimary,
            }}
          >
            {title}
          </Text>

          <Text
            style={{
              fontFamily: "Inter-Regular",
              fontSize: 16,
              lineHeight: 22,
              textAlign: "center",
              color: colors.textSecondary,
              marginTop: 8,
              marginBottom: link ? 20 : 28,
            }}
          >
            {subtitle}
          </Text>

          {link ? (
            <View style={{ marginBottom: 16 }}>
              <Pressable
                onPress={copyLink}
                onPressIn={() => setPressing("copy")}
                onPressOut={() => setPressing(null)}
                style={[styles.linkRow, pressing === "copy" && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={t('success.copyInviteAccessibility')}
              >
                {copied ? (
                  <Check size={18} color={colors.accentDeep} strokeWidth={2.5} />
                ) : (
                  <Copy size={18} color={colors.accentDeep} strokeWidth={2} />
                )}
                <Text
                  numberOfLines={1}
                  ellipsizeMode="middle"
                  style={[
                    styles.linkText,
                    copied && { color: colors.accentDeep },
                  ]}
                >
                  {copied ? t('success.linkCopied') : link}
                </Text>
              </Pressable>

              <Pressable
                onPress={shareLink}
                onPressIn={() => setPressing("share")}
                onPressOut={() => setPressing(null)}
                style={[styles.shareRow, pressing === "share" && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={t('success.sendToGuests')}
              >
                <Share2 size={17} color={colors.accentDeep} strokeWidth={2} />
                <Text style={styles.shareLabel}>{t('success.sendToGuests')}</Text>
              </Pressable>
            </View>
          ) : null}

          <Button title={actionLabel} onPress={onDismiss} />
        </Reanimated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  linkText: {
    // `flex: 1` rather than `flexShrink`, so a long join link truncates inside
    // the pill instead of stretching it past the sheet.
    flex: 1,
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: colors.textSecondary,
  },
  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 4,
  },
  shareLabel: {
    fontFamily: "Inter-SemiBold",
    fontSize: 15,
    color: colors.accentDeep,
  },
  pressed: {
    opacity: 0.7,
  },
});
