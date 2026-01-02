// UnoCSS Configuration for CV Manager
// Obsidian-inspired, seamless design system

export default {
  theme: {
    colors: {
      // Primary - Purple gradient (CV Manager brand)
      primary: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6',
        600: '#7c3aed',
        700: '#6d28d9',
        800: '#5b21b6',
        900: '#4c1d95',
      },
      // Accent - Teal (for highlights)
      accent: {
        50: '#f0fdfa',
        100: '#ccfbf1',
        200: '#99f6e4',
        300: '#5eead4',
        400: '#2dd4bf',
        500: '#14b8a6',
        600: '#0d9488',
        700: '#0f766e',
        800: '#115e59',
        900: '#134e4a',
      },
      // Semantic colors
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      // Dark mode palette (Obsidian-inspired)
      dark: {
        bg: '#0f172a',
        card: '#1e293b',
        hover: '#334155',
        border: '#475569',
        text: '#e2e8f0',
        muted: '#94a3b8',
      },
      // Light mode palette
      light: {
        bg: '#ffffff',
        card: '#f8fafc',
        hover: '#f1f5f9',
        border: '#e2e8f0',
        text: '#0f172a',
        muted: '#64748b',
      }
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
    spacing: {
      px: '1px',
      0: '0',
      0.5: '0.125rem',
      1: '0.25rem',
      1.5: '0.375rem',
      2: '0.5rem',
      2.5: '0.625rem',
      3: '0.75rem',
      3.5: '0.875rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      7: '1.75rem',
      8: '2rem',
      9: '2.25rem',
      10: '2.5rem',
      11: '2.75rem',
      12: '3rem',
      14: '3.5rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
      28: '7rem',
      32: '8rem',
      36: '9rem',
      40: '10rem',
      44: '11rem',
      48: '12rem',
      52: '13rem',
      56: '14rem',
      60: '15rem',
      64: '16rem',
      72: '18rem',
      80: '20rem',
      96: '24rem',
    },
    borderRadius: {
      none: '0',
      sm: '0.125rem',
      DEFAULT: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      full: '9999px',
    },
    boxShadow: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      none: 'none',
    }
  },
  shortcuts: {
    // Button styles
    'btn': 'px-4 py-2 rounded-lg font-medium transition-all duration-200 inline-flex items-center gap-2',
    'btn-primary': 'btn bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
    'btn-secondary': 'btn bg-dark-card dark:bg-dark-card text-dark-text dark:text-white hover:bg-dark-hover',
    'btn-success': 'btn bg-success text-white hover:bg-green-600',
    'btn-danger': 'btn bg-error text-white hover:bg-red-600',
    'btn-ghost': 'btn bg-transparent hover:bg-dark-hover dark:hover:bg-dark-hover text-dark-text dark:text-white',
    'btn-icon': 'p-2 rounded-lg hover:bg-dark-hover dark:hover:bg-dark-hover transition-colors',

    // Card styles
    'card': 'bg-white dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border shadow-md',
    'card-hover': 'card hover:shadow-lg transition-shadow duration-200',

    // Input styles
    'input': 'w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all',
    'input-sm': 'input text-sm py-1.5',
    'input-lg': 'input text-lg py-3',

    // Badge styles
    'badge': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    'badge-primary': 'badge bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300',
    'badge-success': 'badge bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    'badge-warning': 'badge bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    'badge-error': 'badge bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',

    // Layout helpers
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'flex-col-center': 'flex flex-col items-center justify-center',

    // Text styles
    'text-gradient': 'bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent',
    'heading-1': 'text-3xl md:text-4xl font-bold text-light-text dark:text-dark-text',
    'heading-2': 'text-2xl md:text-3xl font-bold text-light-text dark:text-dark-text',
    'heading-3': 'text-xl md:text-2xl font-semibold text-light-text dark:text-dark-text',
    'body': 'text-base text-light-text dark:text-dark-text',
    'body-sm': 'text-sm text-light-muted dark:text-dark-muted',
  },
  presets: [
    // You would normally import presets here
    // For now, we define them inline
  ],
  safelist: [
    // Status colors
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500',
    'text-blue-500', 'text-green-500', 'text-yellow-500', 'text-red-500', 'text-purple-500',
    // Dynamic classes
    'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4',
  ]
}
