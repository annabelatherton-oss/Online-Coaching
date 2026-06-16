/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff0f5',
          100: '#ffe0ed',
          200: '#ffc2dc',
          300: '#ff9cc4',
          400: '#f472b6',
          500: '#e8559a',
          600: '#d03d84',
          700: '#b02d6e',
          800: '#8f1f58',
          900: '#6e1545',
        },
        blush: {
          50:  '#fdf8f5',
          100: '#faeee8',
          200: '#f5ddd0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
