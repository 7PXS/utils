/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        "primary-dark": "var(--primary-dark)",
        secondary: "var(--secondary)",
        "secondary-dark": "var(--secondary-dark)",
        "text-light": "var(--text-light)",
        "text-dark": "var(--text-dark)",
      },
      boxShadow: {
        glow: "var(--glow)",
        custom: "var(--shadow)",
      },
    },
  },
  plugins: [],
};
