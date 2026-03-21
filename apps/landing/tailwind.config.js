/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zima: {
          50: "#e6f4ff",
          100: "#b3dfff",
          200: "#80caff",
          300: "#4db5ff",
          400: "#1a9fff",
          500: "#0090EE",
          600: "#0077c2",
          700: "#005e99",
          800: "#004570",
          900: "#002c47",
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-subtle": "pulseSubtle 4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
    },
  },
  plugins: [],
}
