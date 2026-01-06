import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Genova Brand Colors
        primary: {
          DEFAULT: '#0d7377',
          50: '#e6f5f5',
          100: '#b3e3e4',
          200: '#80d1d3',
          300: '#4dbfc2',
          400: '#1aadb1',
          500: '#0d7377',
          600: '#0a5c5f',
          700: '#084547',
          800: '#052e2f',
          900: '#031717',
        },
        secondary: {
          DEFAULT: '#14FFEC',
          50: '#e6fffd',
          100: '#b3fff9',
          200: '#80fff5',
          300: '#4dfff1',
          400: '#1affed',
          500: '#14FFEC',
          600: '#10ccbd',
          700: '#0c998e',
          800: '#08665f',
          900: '#043330',
        },
        accent: {
          coral: '#ff6b6b',
          gold: '#ffd93d',
        },
        cream: {
          DEFAULT: '#fef9f3',
          dark: '#ffe4d6',
        },
        // Semantic Colors
        success: '#4ade80',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      boxShadow: {
        'sm': '0 2px 10px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'primary': '0 4px 20px rgba(13, 115, 119, 0.3)',
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};

export default config;
