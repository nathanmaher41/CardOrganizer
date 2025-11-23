/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          1: "#667eea",
          2: "oklch(62.7% 0.265 303.9)",
          3: "oklch(58.5% 0.233 277.117)",
          500: "#667eea",
          600: "#5a67d8",
          700: "#4c51bf",
          800: "#ff0000"
        },
      },
    },
  },
  plugins: [],
};
