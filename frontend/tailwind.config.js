
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f8f5",
          100: "#e9f0ea",
          200: "#cfe0d2",
          300: "#b5d1ba",
          400: "#8fbf99",
          500: "#6aac78",
          600: "#4f935f",
          700: "#3f754c",
          800: "#325c3d",
          900: "#2a4b33"
        }
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)"
      },
      borderRadius: {
        xl2: "1rem"
      }
    },
  },
  plugins: [],
}
