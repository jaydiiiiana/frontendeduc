
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e40af", // Oxford Blue
        "primary-dark": "#1e3a8a",
        "primary-light": "#dbeafe",
        secondary: "#3b82f6", // Educational Blue
        accent: "#f59e0b", // Pencil Yellow
        "accent-blue": "#0ea5e9",
        "bg-paper": "#fafaf9",
        "success-light": "#e6ffec",
        "error-light": "#fff5f5",
        "error-dark": "#ef4444",
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "sans-serif"],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'premium': '0 10px 30px -5px rgba(30, 64, 175, 0.05), 0 0px 10px -5px rgba(30, 64, 175, 0.03)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "0.1", transform: "scale(1)" },
          "50%": { opacity: "0.3", transform: "scale(1.05)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(5deg)" },
        },
        morph: {
          "0%, 100%": { borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%" },
          "34%": { borderRadius: "70% 30% 50% 50% / 30% 30% 70% 70%" },
          "67%": { borderRadius: "100% 60% 60% 100% / 100% 100% 60% 60%" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(40px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "pulse-soft": "pulse-soft 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 8s ease-in-out infinite",
        "float-slow": "float 12s ease-in-out infinite",
        "float-slower": "float 18s ease-in-out infinite reverse",
        "fade-in": "fadeIn 0.8s ease-out forwards",
        "slide-up": "slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        morph: "morph 8s ease-in-out infinite both alternate",
      },
    },
  },
  plugins: [],
}
