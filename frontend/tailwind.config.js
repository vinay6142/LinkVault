/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#10b981',
        accent: '#8b5cf6',
        dark: '#1f2937',
      },
      boxShadow: {
        glow: '0 0 15px rgba(37, 99, 235, 0.4)',
        'glow-sm': '0 0 8px rgba(37, 99, 235, 0.2)',
        elevated: '0 20px 40px rgba(0, 0, 0, 0.15)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        'gradient-accent': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      }
    },
  },
  plugins: [],
}
