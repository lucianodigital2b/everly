import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "./Button";
import { colors } from "../constants/colors";

interface EmptyStateProps {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** "bare" drops the card chrome and icon — just the words, centered. */
  variant?: "card" | "bare";
}

// Reusable empty/placeholder state — soft card, icon chip, title, subtitle and
// an optional call to action. Used across Home, gallery, and guest upload.
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  variant = "card",
}) => (
  <View style={variant === "bare" ? styles.bare : styles.card}>
    {variant === "card" ? (
      <View style={styles.iconWrap}>
        <Icon size={26} color={colors.accentDeep} strokeWidth={1.8} />
      </View>
    ) : null}
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    {actionLabel && onAction ? (
      <View style={styles.action}>
        <Button title={actionLabel} onPress={onAction} />
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  bare: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 26,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#3A2E33",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 3,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Inter-Bold",
    fontSize: 18,
    letterSpacing: -0.3,
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 280,
  },
  action: {
    marginTop: 20,
    width: "100%",
    maxWidth: 260,
  },
});
