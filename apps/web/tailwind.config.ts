import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdead7',
          200: '#f9d1ae',
          300: '#f5b17b',
          400: '#f08a46',
          500: '#ec6c21',
          600: '#dd5317',
          700: '#b73d15',
          800: '#923219',
          900: '#762b18',
          950: '#40130a',
        },
        accent: {
          50: '#f0fdf6',
          100: '#ddfbeb',
          200: '#bdf5d7',
          300: '#89ecb8',
          400: '#4eda91',
          500: '#27c070',
          600: '#1a9f5a',
          700: '#197d49',
          800: '#19633d',
          900: '#165134',
          950: '#062d1b',
        },
        rose: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
        warm: {
          50: '#fdfcfb',
          100: '#faf8f5',
          200: '#f5f0ea',
          300: '#ede5da',
          400: '#d9ccbc',
          500: '#c4b19e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.04)',
        'elevated': '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        'glow-primary': '0 0 20px rgba(236, 108, 33, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
