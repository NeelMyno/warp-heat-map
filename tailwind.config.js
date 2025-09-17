/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: '#00ff33',
        dark: '#121212',
      },
      backgroundColor: {
        'dark': '#121212',
      }
    },
  },
  plugins: [],
}
