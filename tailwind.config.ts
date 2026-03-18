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
        sans: ["'DotGothic16'", "monospace"],
        mono: ["'DotGothic16'", "monospace"],
        pixel: ["'Press Start 2P'", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
