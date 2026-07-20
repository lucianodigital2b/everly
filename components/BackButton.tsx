import React from "react";
import { TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { colors } from "../constants/colors";

interface BackButtonProps {
  onPress?: () => void;
  /** Where to go when there's no screen to pop back to. */
  fallback?: string;
}

// Circular back button for stacked screens (auth, modals). Falls back safely
// when the current screen is the root of the stack (nothing to pop).
export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  fallback = "/(auth)/welcome",
}) => (
  <TouchableOpacity
    onPress={
      onPress ??
      (() => {
        if (router.canGoBack()) router.back();
        else router.replace(fallback as any);
      })
    }
    activeOpacity={0.7}
    hitSlop={8}
    style={{
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface2,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    }}
  >
    <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={2.2} />
  </TouchableOpacity>
);
