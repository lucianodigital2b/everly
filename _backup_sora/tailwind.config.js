module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#f9f7fa",
        'primary-dark': "#13181c",
        'secondary-dark': "#2A2F33",
        background: {
          light: "#f9f7fa",
          dark: "#161819",
        },
        text: {
          light: "#1E1E2D",
          dark: "#f9f7fa",
        },
        secondary: {
          DEFAULT: "#7239EA",
          50: '#f4f3ff',
          100: '#ece9fe',
          200: '#dbd7fd',
          300: '#c2b6fc',
          400: '#a38df8',
          500: '#855ef4',
          600: '#7239ea',
          700: '#662bd6',
          800: '#5423b4',
          900: '#471f93',
          950: '#2a1164',
        },
        black: {
          DEFAULT: "#000",
          100: "#1E1E2D",
          200: "#232533",
        },
        gray: {
          100: "#CDCDE0",
          200: "#2a2a2a",
          300: "#3a3a3a",
        },
      },
      fontFamily: {
        pthin: ["Poppins-Thin", "sans-serif"],
        pextralight: ["Poppins-ExtraLight", "sans-serif"],
        plight: ["Poppins-Light", "sans-serif"],
        pregular: ["Poppins-Regular", "sans-serif"],
        pmedium: ["Poppins-Medium", "sans-serif"],
        psemibold: ["Poppins-SemiBold", "sans-serif"],
        pbold: ["Poppins-Bold", "sans-serif"],
        pextrabold: ["Poppins-ExtraBold", "sans-serif"],
        pblack: ["Poppins-Black", "sans-serif"],
      },
    },
  },
  plugins: [],
};
