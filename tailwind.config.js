/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#E8DDD8',
        'bg-secondary': '#F5E6E8',
        'surface': '#FFFFFF',
        'surface-dim': '#F9F5F3',
        'accent-primary': '#D4A5A5',
        'accent-dark': '#B88B8B',
        'accent-success': '#7FB069',
        'accent-error': '#E07A5F',
        'accent-warning': '#F2A65A',
        'text-primary': '#2D2D2D',
        'text-secondary': '#6B6B6B',
        'text-tertiary': '#9B9B9B',
        'chart-bars': '#2D2D2D',
        'chart-outline': '#E8DDD8',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'pill': '24px',
        'card': '16px',
        'input': '12px',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'md': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}

