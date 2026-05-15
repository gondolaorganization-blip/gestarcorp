/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c3d4fd',
          300: '#9ab5fb',
          400: '#6b8ef7',
          500: '#4166f1',
          600: '#2a48e6',
          700: '#2236cf',
          800: '#1e2ea6',
          900: '#1e2c83',
        },
      },
    },
  },
  plugins: [],
};
