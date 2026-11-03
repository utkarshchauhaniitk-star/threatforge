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
          bg: '#070A0F',          // Deepest midnight void
          card: '#0D1322',        // Tactical dark panel
          cardHover: '#121B2F',   // Hover elevated panel
          surface: '#152037',     // Interactive surface
          border: '#1A263D',      // Muted border
          borderLight: '#263756', // Active border
          accent: '#38BDF8',      // Cyber Sky / Cyan
          accentBlue: '#2563EB',  // Electric Cobalt
          emerald: '#10B981',     // Sentinel Emerald
          amber: '#F59E0B',       // Warning Amber
          rose: '#F43F5E',        // Threat Crimson
          muted: '#8B9BB4',       // Soft slate text
          text: '#F8FAFC',        // Crisp white text
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
