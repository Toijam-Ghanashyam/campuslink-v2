// src/theme/tokens.js
// SINGLE SOURCE OF TRUTH for both themes. Edit hex values here only.
export const tokens = {
  day: {
    // "Editorial Vermilion & Ink": Warm stone paper (#F6F5F0), crisp white surfaces (#FFFFFF), carbon ink (#111113), tactile vermilion accent (#EA580C)
    bg: '#F6F5F0', surface: '#FFFFFF', fg: '#111113', fgSoft: '#52525B', line: '#E2DFD7',
    accent: '#EA580C', accentTint: '#FFEDD5', accentDeep: '#7C2D12', accentInk: '#9A3412',
    jade: '#0D6E4B', jadeTint: '#DCFCE7', brick: '#B91C1C', brickTint: '#FEE2E2',
    lagoon: '#0F766E', lagoonLight: '#14B8A6',
    sidebar: '#111113', sidebarFg: '#F4F4F0', btn: '#111113', btnFg: '#FAF9F5', btnHover: '#EA580C', btnHoverFg: '#111113',
    darkSection: '#111113', darkSectionFg: '#F4F4F0',
    glassBase: '#FFFFFF', glassAlpha: '0.84', glassBorderBase: '#111113', glassBorderAlpha: '0.10',
    blobA: '#FFFFFF', blobB: '#EA580C', blobC: '#E2DFD7',
    markAlpha: '0.25',
    threeA: '#111113', threeB: '#EA580C', threeDust: '#111113', threeEdge: '#111113', threeAdditive: '0',
    checkBackdrops: ['#F6F5F0', '#FFFFFF', '#FFEDD5'],
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
