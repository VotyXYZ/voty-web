/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      width: {
        18: '4.5rem',
      },
      height: {
        18: '4.5rem',
      },
      padding: {
        18: '4.5rem',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
