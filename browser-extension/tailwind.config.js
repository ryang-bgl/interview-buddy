/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'SF Pro Text',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        dialog: '0px 25px 60px -15px rgba(15, 23, 42, 0.25)',
      },
    },
  },
  plugins: [],
}
