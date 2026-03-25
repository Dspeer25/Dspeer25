import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: { primary: "#0a0a0f", secondary: "#12121a", tertiary: "#1a1a2e" },
        border: { primary: "#2a2a3e", secondary: "#3a3a4e" },
        text: { primary: "#e4e4e7", secondary: "#a1a1aa", muted: "#71717a" },
        accent: { green: "#22c55e", red: "#ef4444", blue: "#3b82f6", yellow: "#eab308", purple: "#a855f7" },
      },
    },
  },
  plugins: [],
};

export default config;
