/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{tsx,js,ts,jsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./shared/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Couleurs Principales
        primary: '#0d7377',
        secondary: '#14FFEC',
        
        // Couleurs Complémentaires
        accent1: '#ff6b6b',
        accent2: '#ffd93d',
        cream: '#fef9f3',
        peach: '#ffe4d6',
        
        // Couleurs Utilitaires
        'text-primary': '#333333',
        'text-secondary': '#666666',
        'text-tertiary': '#999999',
        success: '#4ade80',
        warning: '#f59e0b',
        error: '#ef4444',
        
        // Backgrounds
        'bg-primary': '#FFFFFF',
        'bg-secondary': '#f5f7fa',
        'bg-cream': '#fef9f3',
        
        // Borders
        border: '#e0e0e0',
        'border-light': 'rgba(13, 115, 119, 0.1)',
      },
      fontFamily: {
        // Vous pouvez ajouter vos polices personnalisées ici
        sans: ['System'],
      },
      fontSize: {
        'xs': '12px',
        'sm': '13px',
        'base': '15px',
        'lg': '16px',
        'xl': '18px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
        '5xl': '42px',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        'full': '9999px',
      },
    },
  },
  plugins: [],
}


