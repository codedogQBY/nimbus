const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: "#fefdfb",
            foreground: "#556B2F",
            primary: {
              50: "#f4f8f4",
              100: "#e8f0e8",
              200: "#D4E2D4",
              300: "#c0d4c0",
              400: "#acc6ac",
              500: "#98b898",
              600: "#7a9e7a",
              700: "#5c7e5c",
              800: "#3e5e3e",
              900: "#203e20",
              DEFAULT: "#D4E2D4",
              foreground: "#556B2F",
            },
            secondary: {
              50: "#faf8f4",
              100: "#f5f1e9",
              200: "#E8E1D0",
              300: "#ddd2b7",
              400: "#d2c39e",
              500: "#c7b485",
              600: "#a3956c",
              700: "#7f7653",
              800: "#5b573a",
              900: "#373821",
              DEFAULT: "#E8E1D0",
              foreground: "#556B2F",
            },
            success: {
              DEFAULT: "#10b981",
              foreground: "#ffffff",
            },
            warning: {
              DEFAULT: "#f59e0b",
              foreground: "#ffffff",
            },
            danger: {
              DEFAULT: "#ef4444",
              foreground: "#ffffff",
            },
            content1: "#ffffff",
            content2: "#E8E1D0",
            content3: "#D4E2D4",
            content4: "#c7b485",
            divider: "rgba(85, 107, 47, 0.12)",
          },
        },
        dark: {
          colors: {
            background: "#1a1a18",
            foreground: "#e8f0e8",
            primary: {
              50: "#203e20",
              100: "#3e5e3e",
              200: "#5c7e5c",
              300: "#7a9e7a",
              400: "#98b898",
              500: "#acc6ac",
              600: "#c0d4c0",
              700: "#D4E2D4",
              800: "#e8f0e8",
              900: "#f4f8f4",
              DEFAULT: "#98b898",
              foreground: "#f4f8f4",
            },
            secondary: {
              DEFAULT: "#5b573a",
              foreground: "#faf8f4",
            },
            content1: "#252522",
            content2: "#2f2f2a",
            content3: "#3a3a32",
            content4: "#44443a",
            divider: "rgba(232, 240, 232, 0.12)",
          },
        },
      },
    }),
  ],
};
