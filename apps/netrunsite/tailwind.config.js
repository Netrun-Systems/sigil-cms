/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        netrun: {
          navy: '#1a2332',
          deep: '#0f1720',
          steel: '#2a3a4e',
          slate: '#3d5068',
          sage: '#90b9ab',
          mist: '#b8d4ca',
          ice: '#e8f0ed',
          cloud: '#f4f8f6',
          accent: '#4ca1e0',
          highlight: '#6bb8f0',
        },
      },
    },
  },
  plugins: [],
};
