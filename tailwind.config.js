/** @type {import('tailwindcss').Config} */
     module.exports = {
       content: [
         './app/**/*.{js,ts,jsx,tsx}',
       ],
       theme: {
         extend: {
           colors: {
             'custom-dark': '#1a1a1a',
             'custom-gray': '#e5e7eb',
           },
         },
       },
       plugins: [],
     }