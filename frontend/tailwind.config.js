/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        canvas: '#09090b',
      },
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px color-mix(in srgb, var(--color-primary) 22%, transparent)',
        cyan: '0 0 28px color-mix(in srgb, var(--color-secondary) 45%, transparent)',
        violet:
          '0 0 28px color-mix(in srgb, var(--color-primary) 45%, transparent)',
      },
    },
  },
  plugins: [],
}
