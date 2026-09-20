import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Divantraa × Anveshan aligned palette
        cream:  "#F5F0E8",   // warm off-white — section backgrounds
        forest: "#00584B", // Anveshan primary brand green — footer, promo bar, key accents
        leaf:   "#007A6B",   // interactive teal — buttons, links, focus rings
        clay:   "#C77B45",   // earthy warm accent — badges, CTAs
        gold:   "#D3A24A",   // earthy gold — highlights, footer headings
        ink:    "#242424",   // Anveshan foreground — headings and dark text
        white:  "#FFFFFF",
        black:  "#000000",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
