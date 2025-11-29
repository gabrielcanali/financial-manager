export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        midnight: "#0b1224",
        ink: "#0f172a",
        accent: "#5eead4",
        accentSoft: "#93c5fd",
      },
      boxShadow: {
        card: "0 18px 45px rgba(0, 0, 0, 0.35)",
      },
      borderRadius: {
        xl: "14px",
      },
    },
  },
  plugins: [],
};
