/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        red: {
          50: "#fff0f0",
          500: "#e74c3c",
          600: "#c0392b",
        },
        purple: {
          50: "#f5f0ff",
          500: "#9b59b6",
          600: "#8e44ad",
        },
        yellow: {
          400: "#fbbf24",
          500: "#f39c12",
        },
        blue: {
          400: "#3498db",
        },
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          400: "#9ca3af",
          500: "#6b7280",
          700: "#374151",
        },
        pitch: {
          100: "#e8f5e9",
          200: "#c8e6c9",
          300: "#a5d6a7",
          400: "#81c784",
          500: "#66bb6a",
          600: "#4caf50",
          700: "#388e3c",
          800: "#2e7d32",
          900: "#1b5e20",
        },
      },
      backgroundColor: {
        field: "#1e5128",
        "field-light": "#2d7738",
        "field-dark": "#143d1e",
      },
    },
  },
  plugins: [],
};
