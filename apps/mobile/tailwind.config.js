/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{tsx,js,ts,jsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./shared/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0d7377',
          light: 'rgba(13, 115, 119, 0.1)',
        },
        secondary: '#14FFEC',
        accent: {
          coral: '#ff6b6b',
          gold: '#ffd93d',
          peach: '#ffe4d6',
        },
        cream: '#fef9f3',
        text: {
          primary: '#333333',
          secondary: '#666666',
          tertiary: '#999999',
        },
        bg: {
          primary: '#FFFFFF',
          secondary: '#f5f7fa',
          cream: '#fef9f3',
        },
      },
      borderRadius: {
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        'xxl': '48px',
        'xxxl': '64px',
      }
    },
  },
  plugins: [],
}
