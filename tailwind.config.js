/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#16211F', paper: '#F6F7F3', sand: '#E8E4D8', mist: '#DDE5E3',
        peacock: { DEFAULT: '#0F5C6B', dark: '#0A4350' }, madder: '#B3374A',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
