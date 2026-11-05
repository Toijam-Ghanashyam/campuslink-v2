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
        display: ['Fraunces', 'serif'],
        sans: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(20, 22, 28, 0.04)',
        hover: '0 8px 24px -4px rgba(20, 22, 28, 0.08), 0 2px 6px -1px rgba(20, 22, 28, 0.04)',
      },
      borderRadius: {
        '2xl': '16px',
      }
    },
  },
  plugins: [],
};

