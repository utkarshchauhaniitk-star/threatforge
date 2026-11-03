/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forge: {
          bg: '#080C14',
          card: '#0F172A',
          cardHover: '#131F37',
          surface: '#1E293B',
          border: '#1E293B',
          borderLight: '#334155',
          accent: '#06B6D4',
          accentGlow: 'rgba(6, 182, 212, 0.15)',
          emerald: '#10B981',
          emeraldGlow: 'rgba(16, 185, 129, 0.15)',
          amber: '#F59E0B',
          rose: '#EF4444',
          muted: '#94A3B8',
          text: '#F1F5F9',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
