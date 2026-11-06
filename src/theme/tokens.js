// SINGLE SOURCE OF TRUTH for both themes. Edit hex values here only.
// Everything else (CSS variables, contrast check, charts, 3D) is derived from this file.
export const tokens = {
  day: {
    bg: '#F4F5F7', surface: '#FFFFFF', fg: '#0E121B', fgSoft: '#475569', line: '#E2E8F0',
    accent: '#D97706', accentTint: '#FEF3C7', accentDeep: '#92400E',
    jade: '#0B6846', jadeTint: '#E1F6ED', brick: '#A82A18', brickTint: '#FBE8E5',
    lagoon: '#09645E', lagoonLight: '#5EEAD4',
    sidebar: '#0E121B', sidebarFg: '#F8FAFC', btn: '#0E121B', btnFg: '#F8FAFC', btnHover: '#D97706', btnHoverFg: '#0E121B',
    darkSection: '#0E121B', darkSectionFg: '#F8FAFC',
    glassBase: '#FFFFFF', glassAlpha: '0.72', glassBorderBase: '#FFFFFF', glassBorderAlpha: '0.85',
    blobA: '#CBD5E1', blobB: '#FDE68A', blobC: '#FECDD3',
    markAlpha: '0.55',
    threeA: '#D97706', threeB: '#09645E', threeDust: '#D97706', threeEdge: '#09645E', threeAdditive: '0',
    checkBackdrops: ['#F4F5F7', '#CBD5E1', '#FDE68A', '#FECDD3'],
  },
  night: {
    bg: '#000000', surface: '#0A0A0E', fg: '#FFFFFF', fgSoft: '#A1A1AA', line: '#26262E',
    accent: '#F59E0B', accentTint: '#2A1E0B', accentDeep: '#FBBF24',
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
