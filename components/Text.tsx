import React from "react";
import { Text, type TextProps } from "react-native";

// Everly text primitives — all Inter now (no serif). Legacy names kept as
// aliases so existing screens migrate without edits; prefer the Display/Title/
// Body/Label names in new code.

export const DisplayText = ({ className = "", ...props }: TextProps) => (
  <Text className={`font-serifBold text-textPrimary ${className}`} {...props} />
);

export const TitleText = ({ className = "", ...props }: TextProps) => (
  <Text className={`font-serif text-textPrimary ${className}`} {...props} />
);

export const BodyText = ({ className = "", ...props }: TextProps) => (
  <Text className={`font-sans text-textPrimary ${className}`} {...props} />
);

export const LabelText = ({ className = "", ...props }: TextProps) => (
  <Text className={`font-sansSemiBold text-textSecondary ${className}`} {...props} />
);

export const ThinText = ({ className = "", ...props }: TextProps) => (
  <Text className={`font-sansLight text-textPrimary ${className}`} {...props} />
);

// ── Legacy aliases (map onto the Inter scale) ──────────────────────────────
export const SerifText = TitleText;
export const SerifBoldText = DisplayText;
export const SansText = BodyText;
export const SansSemiText = ({ className = "", ...props }: TextProps) => (
  <Text className={`font-sansSemiBold text-textPrimary ${className}`} {...props} />
);
export const SansBoldText = ({ className = "", ...props }: TextProps) => (
  <Text className={`font-sansBold text-textPrimary ${className}`} {...props} />
);
