import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0D10",
        card: "#0F1217",
        border: "rgba(255,255,255,0.08)",
        muted: "rgba(255,255,255,0.65)",
        accent: "#E28517",
      },
      boxShadow: {
        soft: "0 12px 40px rgba(0,0,0,0.55)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
