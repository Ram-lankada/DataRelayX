/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html', './src/**/*.{js,ts,jsx,tsx}',
    'node_modules/flowbite-react/lib/esm/**/*.js'],
  theme: {
    extend: {
      colors: {
        TK: {
          background: '#131921',
          default: '#131921',
        },
      },
    },
  },
  plugins: [
    require('flowbite/plugin'),
  ],
};
