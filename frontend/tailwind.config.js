/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lovable: {
          dark: '#0e0f12',
          card: '#16181d',
          border: '#262931',
          accent: '#ec4899',
          purple: '#8b5cf6',
        }
      }
    },
  },
  plugins: [],
}
