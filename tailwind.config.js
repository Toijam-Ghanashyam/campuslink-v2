const c = (n) => `rgb(var(--c-${n}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: c('bg'), surface: c('surface'), fg: c('fg'), 'fg-soft': c('fg-soft'), line: c('line'),
        accent: c('accent'), 'accent-tint': c('accent-tint'), 'accent-deep': c('accent-deep'), 'accent-ink': c('accent-ink'),
        jade: c('jade'), 'jade-tint': c('jade-tint'), brick: c('brick'), 'brick-tint': c('brick-tint'),
        lagoon: c('lagoon'), sidebar: c('sidebar'), 'sidebar-fg': c('sidebar-fg'),
        btn: c('btn'), 'btn-fg': c('btn-fg'), 'btn-hover': c('btn-hover'), 'btn-hover-fg': c('btn-hover-fg'),
        'dark-section': c('dark-section'), 'dark-section-fg': c('dark-section-fg'),
        glass: 'rgb(var(--c-glass-base) / var(--glass-alpha))',
        'glass-border': 'rgb(var(--c-glass-border-base) / var(--glass-border-alpha))',
        bone: c('bg'), paper: c('surface'), ink: c('fg'), 'ink-soft': c('fg-soft'),
        ochre: c('accent'), 'ochre-tint': c('accent-tint'), 'ochre-deep': c('accent-deep'),
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', '-apple-system', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        serif: ["'Newsreader Variable'", 'Newsreader', 'Georgia', 'serif'],
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(20, 22, 28, 0.04)',
        object: '0 12px 32px -12px rgba(20, 22, 28, 0.14), 0 2px 6px -1px rgba(20, 22, 28, 0.04)',
      },
      borderRadius: {
        control: '6px',
        object: '10px',
        stamp: '3px',
        '2xl': '14px',
      }
    },
  },
  plugins: [],
};
