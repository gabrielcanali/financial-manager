/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          900: "#0f172a",
          700: "#1f2937",
          500: "#4b5563",
          300: "#94a3b8",
        },
        mint: {
          500: "#2dd4bf",
          400: "#5eead4",
          200: "#ccfbf1",
        },
      },
    },
  },
  plugins: [],
}
