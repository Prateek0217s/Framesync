/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // FrameSync palette is theme-aware: every token resolves to an RGB
        // CSS variable defined in index.css (`html.light` = Coral & Cream
        // neobrutalism default, `:root` = Dark Brut variant). Alpha modifiers
        // (/50 etc.) keep working via <alpha-value>.
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
        // light: dark greys on cream). Untouched higher shades keep defaults.
        slate: {
          100: 'rgb(var(--slate-100) / <alpha-value>)',
          200: 'rgb(var(--slate-200) / <alpha-value>)',
          300: 'rgb(var(--slate-300) / <alpha-value>)',
          400: 'rgb(var(--slate-400) / <alpha-value>)',
          500: 'rgb(var(--slate-500) / <alpha-value>)',
          600: 'rgb(var(--slate-600) / <alpha-value>)',
          700: 'rgb(var(--slate-700) / <alpha-value>)',
        },
        // Neobrutalism Coral & Cream palette (skill §3/§8): coral primary,
        // pastel-adjacent accents, #111 lines (via --line/--nb-line vars).
        primary: {
          DEFAULT: '#E8635A',
          hover: '#C74A42',
          soft: '#F08A82',
          faint: 'rgba(232, 99, 90, 0.14)',
        },
        accent: '#4ECDC4',
        // Neobrutalism accent pool for icon boxes / badges / decor.
        lav: '#C4B5FD',
        sun: '#FFE566',
        bloom: '#F9A8B8',
        // Kanban stage accents.
        stage: {
          pre: '#64748B',
          rough: '#F59E0B',
          review: '#3B82F6',
          approved: '#10B981',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // Neobrutalism: 2px lines are the default border weight everywhere.
      borderWidth: {
        DEFAULT: '2px',
      },
      boxShadow: {
        // Zero blur, always (skill §3 shadow rule — never break).
        card: '4px 4px 0 0 rgb(var(--nb-line) / 0.9)',
        'card-sm': '3px 3px 0 0 rgb(var(--nb-line) / 0.9)',
        'card-lg': '6px 6px 0 0 rgb(var(--nb-line) / 0.9)',
        // Formerly the purple glow — now a hard coral offset for CTAs.
        glow: '4px 4px 0 0 rgb(var(--nb-line) / 0.9)',
        'glow-hover': '2px 2px 0 0 rgb(var(--nb-line) / 0.9)',
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
