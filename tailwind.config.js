/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'dark-blue': '#243576',
        'bold-blue': '#425FCC',
        'periwinkle': '#7894FF',
        'midnight-black': '#1D1D1D',
        'off-white': '#E8E8E8',
        'orange': '#F47126'
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        'league-spartan': ['League Spartan', 'system-ui', 'sans-serif'],
        'playfair': ['Playfair Display', 'serif']
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'nav-bounce': {
          '0%, 100%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.25)' },
          '70%': { transform: 'scale(0.92)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-once': {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(66,95,204,0.5)' },
          '50%': { transform: 'scale(1.03)', boxShadow: '0 0 0 8px rgba(66,95,204,0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.18s ease-out both',
        'nav-bounce': 'nav-bounce 0.35s ease-out',
        'slide-up': 'slide-up 0.22s ease-out both',
        'pulse-once': 'pulse-once 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
