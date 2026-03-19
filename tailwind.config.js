/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'dark-blue': '#243576',
        'bold-blue': '#425FCC',
        'electric-blue': '#425FCC',
        'periwinkle': '#7894FF',
        'midnight-black': '#1D1D1D',
        'off-white': '#E8E8E8',
        'orange': '#F47126'
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        'league-spartan': ['League Spartan', 'system-ui', 'sans-serif'],
        'playfair': ['Playfair Display', 'serif']
      }
    },
  },
  plugins: [],
};
