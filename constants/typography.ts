// Everly typography — Inter (SF Pro stand-in), cross-platform.
// Weight names map to the family strings registered in app/_layout.tsx.
export const typography = {
  fonts: {
    extraLight: "Inter-ExtraLight", // 200 — hero "thin" line
    regular: "Inter-Regular", // 400 — body
    medium: "Inter-Medium", // 500
    semibold: "Inter-SemiBold", // 600 — labels, buttons
    bold: "Inter-Bold", // 700 — titles
    extraBold: "Inter-ExtraBold", // 800 — hero "bold" line, big headings
  },
  sizes: {
    hero: 48,
    h1: 30,
    h2: 22,
    h3: 17,
    body: 15,
    caption: 12,
    button: 16,
  },
  weights: {
    extraLight: "200",
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extraBold: "800",
  },
} as const;
