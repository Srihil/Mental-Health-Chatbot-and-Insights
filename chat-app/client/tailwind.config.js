// tailwind.config.js
import { fontFamily } from "tailwindcss/defaultTheme"

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // ✅ Very important
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

