/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.html",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-dark': 'var(--primary-dark)',
        background: 'var(--background)',
        'background-dark': 'var(--background-dark)',
        text: 'var(--text)',
        'text-dark': 'var(--text-dark)',
        secondary: 'var(--secondary)',
        'secondary-dark': 'var(--secondary-dark)',
      },
    },
  },
  plugins: [],
} 