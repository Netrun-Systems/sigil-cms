/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        poppies: {
          terracotta: '#c67a4b',
          clay: '#a86038',
          sage: '#8a9a7b',
          sand: '#d4c4a8',
          cream: '#f5f0e8',
          bark: '#5c3d2e',
          moss: '#6b7a5e',
          linen: '#faf7f2',
        },
      },
    },
  },
  plugins: [],
};
