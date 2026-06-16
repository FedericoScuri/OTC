import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0d9488",
          dark: "#0f766e",
          light: "#2dd4bf",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundSize: {
        "200": "200% 200%",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(13,148,136,0.25), 0 8px 30px -8px rgba(13,148,136,0.45)",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-22px)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(20px, -30px) scale(1.05)" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(13,148,136,0.35)" },
          "50%": { boxShadow: "0 0 0 8px rgba(13,148,136,0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(-6px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.6s ease-out both",
        "fade-in": "fadeIn 0.5s ease-out both",
        float: "float 7s ease-in-out infinite",
        "float-slow": "floatSlow 12s ease-in-out infinite",
        gradient: "gradientShift 6s ease infinite",
        shimmer: "shimmer 1.8s infinite",
        glow: "pulseGlow 2.5s ease-in-out infinite",
        "scale-in": "scaleIn 0.18s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
