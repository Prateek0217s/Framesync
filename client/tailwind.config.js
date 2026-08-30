/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // FrameSync dark-first palette.
        ink: {
          950: '#08080B',
          900: '#0B0B12',
          850: '#101019',
          800: '#15151F',
          700: '#1D1D2A',
          600: '#272736',
        },
        line: '#2A2A3A',
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
