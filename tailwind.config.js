/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bone: '#F6F2E9',
        paper: '#FFFDF8',
        ink: '#14161C',
        'ink-soft': '#5B5F6B',
        line: '#E6DFCF',
        ochre: '#E8A33D',
        'ochre-tint': '#FBEFD5',
        'ochre-deep': '#8A5A0B',
        jade: '#1F8A63',
        'jade-tint': '#DDF1E8',
        brick: '#C4432F',
        'brick-tint': '#F8E1DC',
      },
      fontFamily: {
        display: ['Newsreader', 'Fraunces', 'Georgia', 'serif'],
        serif: ['Newsreader', 'Fraunces', 'Georgia', 'serif'],
        sans: ['Instrument Sans', 'Manrope', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
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
