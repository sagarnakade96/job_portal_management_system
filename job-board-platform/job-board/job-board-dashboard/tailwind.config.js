/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0b1120',
          panel: '#0f172a',
          border: '#1e293b',
          accent: '#38bdf8',
          'accent-strong': '#0ea5e9',
          success: '#22c55e',
          danger: '#f87171',
          warning: '#f59e0b',
          muted: '#94a3b8',
          text: '#e2e8f0',
        }
      }
    },
  },
  plugins: [],
}
