/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        arena: {
          950: "#140f0b",
          900: "#1d1711",
          700: "#473221",
          500: "#c36b2d",
          400: "#f08d49",
          300: "#f6c56a",
          100: "#fff0d5",
        },
      },
      fontFamily: {
        display: ["Bebas Neue", "sans-serif"],
        body: ["Archivo", "sans-serif"],
      },
      boxShadow: {
        glow: "0 20px 60px rgba(240, 141, 73, 0.25)",
      },
    },
  },
  plugins: [],
};

