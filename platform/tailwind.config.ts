import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141414",
        paper: "#fbfaf7",
        mint: "#d9f4df",
        coral: "#ff715b",
        steel: "#355070"
      }
    }
  },
  plugins: []
};

export default config;
