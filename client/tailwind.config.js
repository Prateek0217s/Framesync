/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // FrameSync palette is theme-aware: every token resolves to an RGB
        // CSS variable defined in index.css (`:root` = Dark Brut over the
        // ice ripple, `html.light` = Ice Light — the cool mirror of the dark
        // theme). Alpha modifiers (/50 etc.) keep working via <alpha-value>.
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
        // Light Ripple palette (skill: light-ripple) — primary is the Ice
        // tint's own cyan (tint [0.3, 0.8, 1.0] → #4DCCFF) so buttons and
        // focus states echo the shader glow instead of fighting it.
        primary: {
          DEFAULT: '#4DCCFF',
          hover: '#7AD9FF',
          soft: '#A8E4FF',
          faint: 'rgba(77, 204, 255, 0.14)',
        },
        accent: '#4ECDC4',
        // Accent pool for icon boxes / badges / decor.
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
        // App font — Magneto Bold via @font-face in index.css.
        sans: ['Magneto', 'DM Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // Light Ripple: hairline borders everywhere (the neobrutalist 2px
      // lines and zero-blur offset shadows are retired).
      borderWidth: {
        DEFAULT: '1px',
      },
      boxShadow: {
        // Soft ambient depth for glass panels floating on the shader.
        card: '0 8px 30px rgb(0 0 0 / 0.35)',
        'card-sm': '0 4px 16px rgb(0 0 0 / 0.3)',
        'card-lg': '0 16px 50px rgb(0 0 0 / 0.45)',
        // Ice glow — echoes the shader's cyan for CTAs and active states.
        glow: '0 0 24px rgb(77 204 255 / 0.35)',
        'glow-hover': '0 0 44px rgb(77 204 255 / 0.55)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Terminal loader cursor blink (prompt-kit "terminal" variant).
        'terminal-cursor': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        // Kanban stack entrance (motion-primitives AnimatedGroup variant):
        // cards drop in from above, blurred and edge-on (rotateX 90°), then
        // spring-settle with a bounce. Overshoot keyframes approximate the
        // demo's spring (bounce 0.3, duration 1).
        'stack-in': {
          '0%': {
            opacity: '0',
            filter: 'blur(12px)',
            transform: 'translateY(-60px) rotateX(90deg)',
          },
          '55%': {
            opacity: '1',
            filter: 'blur(0px)',
            transform: 'translateY(10px) rotateX(-10deg)',
          },
          '75%': {
            transform: 'translateY(-5px) rotateX(4deg)',
          },
          '100%': {
            opacity: '1',
            filter: 'blur(0px)',
            transform: 'translateY(0) rotateX(0deg)',
          },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'terminal-cursor': 'terminal-cursor 1s step-end infinite',
        'stack-in': 'stack-in 0.9s ease-out both',
      },
    },
  },
  plugins: [],
};
