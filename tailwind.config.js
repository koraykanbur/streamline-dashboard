/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        sidebar: '#00264E',
        'sidebar-active': '#75AAE7',
        teal: {
          DEFAULT: '#0D9488',
          dark: '#0F766E',
          light: '#F0FDFA',
          border: '#99F6E4',
        },
      },
    },
  },
  plugins: [],
}
