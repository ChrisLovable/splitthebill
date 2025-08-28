/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1.1)', boxShadow: '0 0 15px currentColor, 0 0 30px currentColor' },
          '50%': { transform: 'scale(1.2)', boxShadow: '0 0 25px currentColor, 0 0 50px currentColor' },
        },
      },
      animation: {
        pulseGlow: 'pulseGlow 1.5s infinite',
      },
    },
  },
  plugins: [],
};
