/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          300: '#f0c040',
          400: '#d4af37',
          500: '#c9a84c',
          600: '#b8962e',
        },
        dark: {
          900: '#0a0a0a',
          800: '#111111',
          700: '#1a1a1a',
          600: '#222222',
          500: '#2a2a2a',
          400: '#333333',
        }
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: []
}
