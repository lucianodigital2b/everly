// Everly typography — New Kansas titles, Lexend descriptions, Inter for chrome.
// Weight names map to the family strings registered in app/_layout.tsx.
export const typography = {
  fonts: {
    extraLight: "Inter-ExtraLight", // 200 — hero "thin" line
    regular: "Lexend-Regular", // 400 — body, descriptions, subtitles
    medium: "Inter-Medium", // 500
    semibold: "Inter-SemiBold", // 600 — labels, buttons
    bold: "Inter-Bold", // 700 — titles
    extraBold: "Inter-ExtraBold", // 800 — hero "bold" line, big headings
    // New Kansas carries every screen and card title. One weight only (500):
    // never pair it with fontWeight, iOS would fake a bold.
    title: "NewKansas-Medium",
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
