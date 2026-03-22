/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        meridian: {
          navy: '#1e3a5f',
          deep: '#162d4a',
          indigo: '#3b5998',
          sky: '#4f8cdb',
          ice: '#e8f0fe',
          slate: '#2c3e50',
          mist: '#f0f4f8',
          steel: '#6b7b8d',
          midnight: '#0f1f33',
          accent: '#5b7fdb',
        },
      },
    },
  },
  plugins: [],
};
