/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Enables the `.dark` class strategy — applied to <html> by ThemeContext
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // All tokens reference CSS custom properties so a single `.dark` class
        // on <html> swaps the entire palette without touching any component.
        'bg-primary':      'var(--color-bg-primary)',
        'bg-secondary':    'var(--color-bg-secondary)',
        'surface':         'var(--color-surface)',
        'surface-dim':     'var(--color-surface-dim)',
        'accent-primary':  'var(--color-accent-primary)',
        'accent-dark':     'var(--color-accent-dark)',
        'accent-success':  'var(--color-accent-success)',
        'accent-error':    'var(--color-accent-error)',
        'accent-warning':  'var(--color-accent-warning)',
        'text-primary':    'var(--color-text-primary)',
        'text-secondary':  'var(--color-text-secondary)',
        'text-tertiary':   'var(--color-text-tertiary)',
        'chart-bars':      'var(--color-chart-bars)',
        'chart-outline':   'var(--color-chart-outline)',
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
