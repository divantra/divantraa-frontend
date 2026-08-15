import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Divantraa-style earthy farm palette
        cream: "#FBF6EE",
        forest: "#1F3D2B",
        leaf: "#3D6B45",
        clay: "#C77B45",
        gold: "#D3A24A",
        ink: "#241F1B",
        white: "#FFFFFF",
        black: "#000000",
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
