/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7f9',
          100: '#e4e9ed',
          200: '#cdd5dd',
          300: '#aab8c5',
          400: '#788fa5',
          500: '#4f6d87',
          600: '#39526c',
          700: '#2f4359',
          800: '#293947',
          900: '#212e39'
        }
      }
    }
  },
  plugins: []
};