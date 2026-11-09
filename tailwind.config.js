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
        // Base backgrounds & surfaces
        bg: c('bg'),
        'bg-elevated': c('surface'),
        'bg-subtle': c('bg'),
        surface: c('surface'),
        surface2: 'rgb(var(--c-fg) / 0.05)',

        // Foreground / Typography
        fg: c('fg'),
        'fg-soft': c('fg-soft'),
        'fg-muted': c('fg-soft'),
        'fg-subtle': 'rgb(var(--c-fg-soft) / 0.75)',
        'fg-on-accent': c('btn-fg'),

        // Borders & Lines
        line: c('line'),
        'line-strong': 'rgb(var(--c-fg) / 0.25)',
        border: c('line'),
        'border-strong': 'rgb(var(--c-fg) / 0.3)',

        // Accent / Editorial Vermilion / Ochre
        accent: c('accent'),
        'accent-hover': c('btn-hover'),
        'accent-tint': c('accent-tint'),
        'accent-deep': c('accent-deep'),
        'accent-ink': c('accent-ink'),
        'accent-soft': c('accent-tint'),

        // Jade / Success
        jade: c('jade'),
        'jade-tint': c('jade-tint'),
        success: c('jade'),
        'success-soft': c('jade-tint'),

        // Amber / Warning
        amber: c('accent'),
        'amber-tint': c('accent-tint'),
        warning: c('accent'),
        'warning-soft': c('accent-tint'),

        // Brick / Danger
        brick: c('brick'),
        'brick-tint': c('brick-tint'),
        danger: c('brick'),
        'danger-soft': c('brick-tint'),

        // Lagoon / Cyan / Info
        lagoon: c('lagoon'),
        'lagoon-light': c('lagoon-light'),
        focus: c('lagoon'),
        info: c('lagoon'),
        'info-soft': c('jade-tint'),

        // Shell & Chrome
        sidebar: c('sidebar'),
        'sidebar-fg': c('sidebar-fg'),
        'sidebar-muted': 'rgb(var(--c-sidebar-fg) / 0.65)',
        'sidebar-line': 'rgb(var(--c-sidebar-fg) / 0.12)',

        // Buttons
        btn: c('btn'),
        'btn-fg': c('btn-fg'),
        'btn-hover': c('btn-hover'),
        'btn-hover-fg': c('btn-hover-fg'),

        // Sections
        'dark-section': c('dark-section'),
        'dark-section-fg': c('dark-section-fg'),

        // Glass & Translucent surfaces
        glass: 'rgb(var(--c-glass-base) / var(--glass-alpha))',
        'glass-border': 'rgb(var(--c-glass-border-base) / var(--glass-border-alpha))',

        // Editorial Legacy Token Aliases
        bone: c('bg'),
        paper: c('surface'),
        ink: c('fg'),
        'ink-soft': c('fg-soft'),
        ochre: c('accent'),
        'ochre-tint': c('accent-tint'),
        'ochre-deep': c('accent-deep'),
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
        hover: '0 16px 40px -12px rgba(20, 22, 28, 0.18), 0 4px 12px -2px rgba(20, 22, 28, 0.06)',
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
