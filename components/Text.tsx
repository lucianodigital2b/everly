import React from "react";
import { Text, type TextProps } from "react-native";

// Serif variants (Playfair Display)
export const SerifText = ({ className = "", ...props }: TextProps) => (
  <Text className={`font-serif text-textPrimary ${className}`} {...props} />
);

export const SerifBoldText = ({ className = "", ...props }: TextProps) => (
  <Text className={`font-serifBold text-textPrimary ${className}`} {...props} />
);

// Sans variants (Outfit)
export const SansText = ({ className = "", ...props }: TextProps) => (
  <Text className={`font-sans text-textPrimary ${className}`} {...props} />
);

export const SansSemiText = ({ className = "", ...props }: TextProps) => (
  <Text className={`font-sansSemiBold text-textPrimary ${className}`} {...props} />
);

export const SansBoldText = ({ className = "", ...props }: TextProps) => (
  <Text className={`font-sansBold text-textPrimary ${className}`} {...props} />
);
