/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./packages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // macOS-inspired color palette
        'macos-blue': '#007AFF',
        'macos-gray': {
          50: '#F5F5F7',
          100: '#E8E8ED',
          200: '#D2D2D7',
          300: '#B0B0B8',
          400: '#86868B',
          500: '#6E6E73',
          600: '#48484A',
          700: '#3A3A3C',
          800: '#2C2C2E',
          900: '#1C1C1E',
        },
        'window-bg': '#FFFFFF',
        'window-border': '#D2D2D7',
        'dock-bg': 'rgba(255, 255, 255, 0.3)',
        'menu-bg': 'rgba(255, 255, 255, 0.8)',
      },
      fontFamily: {
        'system': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'window': '0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
        'dock': '0 5px 20px rgba(0, 0, 0, 0.2)',
        'menu': '0 2px 10px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'window-open': 'windowOpen 0.2s ease-out',
        'window-close': 'windowClose 0.2s ease-in',
        'window-minimize': 'windowMinimize 0.3s ease-in-out',
        'dock-bounce': 'dockBounce 0.5s ease-in-out',
      },
      keyframes: {
        windowOpen: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        windowClose: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.8)', opacity: '0' },
        },
        windowMinimize: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.1) translateY(500px)', opacity: '0' },
        },
        dockBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
