/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#D4AF37',
        coal: '#0B0B0B',
        ink: '#141414',
        steel: '#1E1E1E',
        smoke: '#A3A3A3',
      },
      boxShadow: {
        industrial: '0 18px 40px -24px rgba(0, 0, 0, 0.85)',
      },
      letterSpacing: {
        brand: '0.2em',
      },
    },
  },
  plugins: [],
};