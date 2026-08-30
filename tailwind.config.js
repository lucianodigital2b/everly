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
        // Editorial pair on trial: Lora titles, Amiri descriptions. The legacy
        // "serif" keys mean serif again, so every DisplayText/TitleText in the
        // app picks Lora up with no edits; "sans" carries the body copy.
        serif: ["Lora-SemiBold"],
        serifBold: ["Lora-Bold"],
        sans: ["Amiri-Regular"],
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
        // Lora / Amiri, addressable directly.
        loraMedium: ["Lora-Medium"],
        loraSemibold: ["Lora-SemiBold"],
        loraBold: ["Lora-Bold"],
        amiri: ["Amiri-Regular"],
        amiriBold: ["Amiri-Bold"],
      },
    },
  },
  plugins: [],
};
