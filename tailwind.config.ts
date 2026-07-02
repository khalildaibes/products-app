import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        surface: "#F7F6F3",
        card: "#FFFFFF",
        line: "#E6E4DE",
        accent: "#0F6B5C",
        accentSoft: "#E3F0ED",
        profit: "#12805C",
        loss: "#C0392B",
        gold: "#B98A2E",
      },
      fontFamily: {
        sans: ["var(--font-main)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.05), 0 1px 8px rgba(16,24,40,.04)",
      },
    },
  },
  plugins: [],
};
export default config;
