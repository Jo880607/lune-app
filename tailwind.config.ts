import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["'Galmuri11'", "monospace"],
        mono: ["'Galmuri11'", "monospace"],
        galmuri: ["'Galmuri11'", "monospace"],
        pixel: ["'Press Start 2P'", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
