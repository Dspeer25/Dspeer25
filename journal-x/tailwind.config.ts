import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: '#0c0c14', raised: '#111119', glass: 'rgba(18, 18, 26, 0.7)' },
        accent: { DEFAULT: '#6366f1', glow: 'rgba(99, 102, 241, 0.15)', light: '#818cf8' },
        tx: { primary: '#f0f0f5', secondary: '#8b8b9e', muted: '#55556a' },
        green: { DEFAULT: '#34d399', dim: 'rgba(52, 211, 153, 0.1)' },
        red: { DEFAULT: '#f87171', dim: 'rgba(248, 113, 113, 0.1)' },
        yellow: { DEFAULT: '#fbbf24', dim: 'rgba(251, 191, 36, 0.1)' },
        border: { DEFAULT: 'rgba(255, 255, 255, 0.06)', light: 'rgba(255, 255, 255, 0.1)' },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
};

export default config;
