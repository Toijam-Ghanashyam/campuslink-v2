// src/theme/tokens.js
// SINGLE SOURCE OF TRUTH for both themes. Edit hex values here only.
export const tokens = {
  day: {
    // "Ink & Highlighter": true-ink black on warm paper, with one highlighter-yellow accent. No pastel AI blobs.
    bg: '#EFEEE9', surface: '#FBFBF8', fg: '#0A0A0B', fgSoft: '#5A5A56', line: '#D6D5CE',
    accent: '#FFD23F', accentTint: '#FFF1B8', accentDeep: '#5A4300', accentInk: '#6B4E00',
    jade: '#0C6B47', jadeTint: '#DDF1E7', brick: '#B3261E', brickTint: '#F7E1DE',
    lagoon: '#1F1F21', lagoonLight: '#9A9A94',
    sidebar: '#0A0A0B', sidebarFg: '#F4F4F0', btn: '#0A0A0B', btnFg: '#F8F8F4', btnHover: '#FFD23F', btnHoverFg: '#0A0A0B',
    darkSection: '#0A0A0B', darkSectionFg: '#F4F4F0',
    glassBase: '#FFFFFF', glassAlpha: '0.78', glassBorderBase: '#0A0A0B', glassBorderAlpha: '0.10',
    blobA: '#FFFFFF', blobB: '#FFD23F', blobC: '#E4E2DA',
    markAlpha: '0.7',
    threeA: '#0A0A0B', threeB: '#5A5A56', threeDust: '#0A0A0B', threeEdge: '#0A0A0B', threeAdditive: '0',
    checkBackdrops: ['#EFEEE9', '#FFFFFF', '#FFF1B8'],
  },
  night: {
    bg: '#000000', surface: '#0A0A0E', fg: '#FFFFFF', fgSoft: '#A1A1AA', line: '#26262E',
    accent: '#F59E0B', accentTint: '#2A1E0B', accentDeep: '#FBBF24', accentInk: '#F59E0B',
    jade: '#3CCB8B', jadeTint: '#12251B', brick: '#FF6A55', brickTint: '#2D1714',
    lagoon: '#2DD4BF', lagoonLight: '#14B8A6',
    sidebar: '#050508', sidebarFg: '#FFFFFF', btn: '#F59E0B', btnFg: '#000000', btnHover: '#FFFFFF', btnHoverFg: '#000000',
    darkSection: '#050508', darkSectionFg: '#FFFFFF',
    glassBase: '#0A0A0E', glassAlpha: '0.78', glassBorderBase: '#FFFFFF', glassBorderAlpha: '0.09',
    blobA: '#000000', blobB: '#F59E0B', blobC: '#EA580C',
    markAlpha: '0.30',
    threeA: '#F59E0B', threeB: '#EA580C', threeDust: '#FDE68A', threeEdge: '#A1A1AA', threeAdditive: '1',
    checkBackdrops: ['#000000', '#0A0A0E', '#16161A'],
  },
};
