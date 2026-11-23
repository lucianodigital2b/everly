/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./assets/**/*.{css}",
  ],
  theme: {
    extend: {
      colors: {
        backgroundPrimary: "#FBF8F5",
        backgroundSecondary: "#FFFFFF",
        surface2: "#F5EDEA",
        ivory: "#FFFFFF",
        accent: "#E6A9B4",
        accentBright: "#F4CED5",
        accentDeep: "#C77E8D",
        textPrimary: "#2E2429",
        textSecondary: "#8B7C82",
        textTertiary: "#B9AAB0",
        error: "#D08A83",
        success: "#7FA88C",
      },
      fontFamily: {
        // Editorial pair: New Kansas titles, Lexend descriptions. The legacy
        // "serif" keys mean serif again, so every DisplayText/TitleText in the
        // app picks New Kansas up with no edits; "sans" carries the body copy.
        serif: ["NewKansas-Medium"],
        serifBold: ["NewKansas-Medium"],
        sans: ["Lexend-Regular"],
        sansLight: ["Inter-ExtraLight"],
        sansMedium: ["Inter-Medium"],
        sansSemiBold: ["Inter-SemiBold"],
        sansBold: ["Inter-Bold"],
        // Preferred semantic names going forward.
        interThin: ["Inter-ExtraLight"],
        interRegular: ["Inter-Regular"],
        interMedium: ["Inter-Medium"],
        interSemibold: ["Inter-SemiBold"],
        interBold: ["Inter-Bold"],
        interExtrabold: ["Inter-ExtraBold"],
        // Sacramento — the wordmark hand only.
        script: ["Script"],
        // New Kansas (under the old lora* keys) / Lexend (under the old amiri* keys), addressable directly.
        loraMedium: ["NewKansas-Medium"],
        loraSemibold: ["NewKansas-Medium"],
        loraBold: ["NewKansas-Medium"],
        amiri: ["Lexend-Regular"],
        amiriBold: ["Lexend-Bold"],
      },
    },
  },
  plugins: [],
};
