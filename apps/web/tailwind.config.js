/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-light': 'var(--color-primary-light)',
        'primary-dark': 'var(--color-primary-dark)',
        accent: 'var(--color-accent)',
        'btn-bg': 'var(--color-btn-bg)',
        'btn-text': 'var(--color-btn-text)',
        'header-bg': 'var(--color-header-bg)',
        'card-bg': 'var(--color-card-bg)',
      },
      fontFamily: {
        sans: ['var(--font-family)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        theme: 'var(--border-radius)',
      },
    },
  },
  plugins: [],
}
