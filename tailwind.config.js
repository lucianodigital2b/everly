/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        backgroundPrimary: "#F6F1EB",
        backgroundSecondary: "#EFE6E1",
        accent: "#C6A96B",
        textPrimary: "#2B2B2B",
        textSecondary: "#6F6A66",
        error: "#D8A7A0",
        ivory: "#FFFFF0",
      },
      fontFamily: {
        serif: ["PlayfairDisplay-Regular", "serif"],
        serifBold: ["PlayfairDisplay-Bold", "serif"],
        sans: ["Inter-Regular", "sans-serif"],
        sansLight: ["Inter-Light", "sans-serif"],
        sansMedium: ["Inter-Medium", "sans-serif"],
        sansBold: ["Inter-Bold", "sans-serif"],
      },
    },
  },
  plugins: [],
};
