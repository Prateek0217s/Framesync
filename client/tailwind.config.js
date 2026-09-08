/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // FrameSync palette is theme-aware: every token resolves to an RGB
        // CSS variable defined in index.css (`:root` = dark defaults,
        // `html.light` = light overrides). Alpha modifiers (/50 etc.) keep
        // working via <alpha-value>.
        ink: {
          950: 'rgb(var(--ink-950) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          850: 'rgb(var(--ink-850) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
        },
        line: 'rgb(var(--line) / <alpha-value>)',
        // Slate text shades flip with the theme (dark: light greys on ink,
        // light: dark greys on white). Untouched higher shades keep defaults.
        slate: {
          100: 'rgb(var(--slate-100) / <alpha-value>)',
          200: 'rgb(var(--slate-200) / <alpha-value>)',
          300: 'rgb(var(--slate-300) / <alpha-value>)',
          400: 'rgb(var(--slate-400) / <alpha-value>)',
          500: 'rgb(var(--slate-500) / <alpha-value>)',
          600: 'rgb(var(--slate-600) / <alpha-value>)',
          700: 'rgb(var(--slate-700) / <alpha-value>)',
        },
        primary: {
          DEFAULT: '#7C3AED',
          hover: '#6D28D9',
          soft: '#A78BFA',
          faint: 'rgba(124,58,237,0.14)',
        },
        accent: '#22D3EE',
        // Kanban stage accents.
        stage: {
          pre: '#64748B',
          rough: '#F59E0B',
          review: '#3B82F6',
          approved: '#10B981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -12px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(124,58,237,0.4), 0 8px 30px -8px rgba(124,58,237,0.5)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
