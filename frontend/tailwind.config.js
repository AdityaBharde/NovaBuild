/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        background: '#101114',
        surface: {
          DEFAULT: '#17181D',
          elevated: '#1D1E24',
        },
        border: {
          DEFAULT: '#2A2B33',
        },
        text: {
          primary: '#F0F0F2',
          secondary: '#9698A5',
        },
        accent: {
          DEFAULT: '#7C7CF8',
          hover: '#9595F9',
        },
        success: {
          DEFAULT: '#4ade80', // muted green
        },
        error: {
          DEFAULT: '#ef4444', // restrained red
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
