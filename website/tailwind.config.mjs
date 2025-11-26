import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,svelte,ts,tsx,vue}", "./public/**/*.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 25px 55px rgba(15, 23, 42, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
