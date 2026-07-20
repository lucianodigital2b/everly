import React from "react";
import { TouchableOpacity, View, Text, ActivityIndicator } from "react-native";
import { colors } from "../constants/colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  isLoading = false,
  disabled = false,
  className = "",
  icon,
}) => {
  const baseStyle = "h-16 rounded-3xl items-center justify-center w-full";
  const variantStyles = {
    primary: "bg-accent",
    secondary: "bg-surface2",
    outline: "border border-accent bg-transparent",
  };
  const textStyles = {
    primary: "text-[#2E2429] text-lg",
    secondary: "text-textPrimary text-lg",
    outline: "text-accentDeep text-lg",
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.85}
      style={
        variant === "primary"
          ? {
              shadowColor: colors.accentDeep,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.35,
              shadowRadius: 18,
              elevation: 6,
            }
          : undefined
      }
      className={`${baseStyle} ${variantStyles[variant]} ${disabled ? "opacity-50" : ""} ${className}`}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#2E2429" : colors.accent}
        />
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {icon}
          <Text
            className={textStyles[variant]}
            style={{ fontFamily: "Inter-SemiBold" }}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
