import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        // System-adaptiv: Hell
        light: {
          "bg-primary": "#FFFFFF",
          "bg-secondary": "#F5F5F7",
          "text-primary": "#1D1D1F",
          "text-secondary": "#86868B",
          accent: "#007AFF",
          border: "#D2D2D7",
        },
        // System-adaptiv: Dunkel
        dark: {
          "bg-primary": "#1C1C1E",
          "bg-secondary": "#2C2C2E",
          "text-primary": "#F5F5F7",
          "text-secondary": "#98989D",
          accent: "#0A84FF",
          border: "#38383A",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        title: ["20px", { lineHeight: "1.3", fontWeight: "600" }],
        body: ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        label: ["12px", { lineHeight: "1.4", fontWeight: "500" }],
        button: ["14px", { lineHeight: "1.4", fontWeight: "500" }],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
