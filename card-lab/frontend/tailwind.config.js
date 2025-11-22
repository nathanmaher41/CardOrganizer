/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#667eea",
          600: "#5a67d8",
          700: "#4c51bf",
        },
      },
    },
  },
  plugins: [],
}

