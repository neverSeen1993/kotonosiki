/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdf9f3',
          100: '#faf1e4',
          200: '#f5e4cc',
        },
        teal: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        coral: {
          400: '#fb7185',
          500: '#f43f5e',
        }
      }
    },
  },
  plugins: [],
}
