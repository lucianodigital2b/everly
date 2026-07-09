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
        backgroundPrimary: "#252423",
        backgroundSecondary: "#2e2c2b",
        accent: "#C6A96B",
        textPrimary: "#f6f4f2",
        textSecondary: "#d5d3d1",
        error: "#D8A7A0",
        ivory: "#2e2c2b",
      },
      fontFamily: {
        serif: ["PlayfairDisplay-Regular", "serif"],
        serifBold: ["PlayfairDisplay-Bold", "serif"],
        sans: ["Outfit-Regular", "sans-serif"],
        sansLight: ["Outfit-Light", "sans-serif"],
        sansMedium: ["Outfit-Medium", "sans-serif"],
        sansSemiBold: ["Outfit-SemiBold", "sans-serif"],
        sansBold: ["Outfit-Bold", "sans-serif"],
      },
    },
  },
  plugins: [],
};
