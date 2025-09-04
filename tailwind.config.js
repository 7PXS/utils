/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3b82f6",
          dark: "#2563eb",
          light: "#60a5fa",
        },
        secondary: {
          DEFAULT: "#1e293b",
          dark: "#0f172a",
          light: "#334155",
        },
        background: "#0a0a0a",
        foreground: "#ffffff",
        card: {
          DEFAULT: "#1e1e1e",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#6b7280",
          foreground: "#9ca3af",
        },
        "text-light": "#f8fafc",
        "text-dark": "#1e293b",
      },
      fontFamily: {
        inter: ["Inter", "Inter Fallback", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.3)",
        "glow-lg": "0 0 40px rgba(59, 130, 246, 0.5)",
        custom: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "gradient-shift": "gradientShift 3s ease infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "particle-float": "particleFloat 8s linear infinite",
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-in-left": "slideInFromLeft 0.6s ease-out forwards",
      },
      keyframes: {
        gradientShift: {
          "0%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
          "100%": { "background-position": "0% 50%" },
        },
        glowPulse: {
          "0%": { "box-shadow": "0 0 20px rgba(59, 130, 246, 0.4)" },
          "50%": { "box-shadow": "0 0 40px rgba(59, 130, 246, 0.8)" },
          "100%": { "box-shadow": "0 0 20px rgba(59, 130, 246, 0.4)" },
        },
        particleFloat: {
          "0%": { 
            transform: "translateY(0) translateX(0)",
            opacity: "0.3"
          },
          "50%": { opacity: "0.6" },
          "100%": { 
            transform: "translateY(-100vh) translateX(10px)",
            opacity: "0"
          },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideInFromLeft: {
          from: { opacity: "0", transform: "translateX(-50px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
