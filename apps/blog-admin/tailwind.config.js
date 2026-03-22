/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        editorial: {
          cream: '#faf8f5',
          warm: '#f5f0ea',
          ink: '#1a1a2e',
          muted: '#6b6b80',
          accent: '#c85a2e',
          border: '#e8e2d8',
        },
      },
      fontFamily: {
        editorial: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      },
    },
  },
  plugins: [],
};
