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
        // YouTube-inspired color palette
        primary: '#FF0000', // YouTube Red
        'primary-dark': '#CC0000',
        'background-light': '#FFFFFF',
        'background-dark': '#181818',
        'secondary-light': '#EDEDED',
        'secondary-dark': '#212121',
        'tertiary-dark': '#3d3d3d',
        'text-light': '#212121',
        'text-dark': '#FFFFFF',
        'text-secondary-light': '#808080',
        'text-secondary-dark': '#AAAAAA',
      },
    },
  },
  plugins: [],
} 