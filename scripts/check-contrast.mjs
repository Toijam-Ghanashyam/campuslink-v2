// WCAG contrast check for both themes, including worst-case backdrops under glass. Exit code 1 on failure.
import { tokens } from '../src/theme/tokens.js';
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const over = (fg, alpha, bg) => fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)));
let fail = 0, lowest = 99;
for (const [name, t] of Object.entries(tokens)) {
  console.log(`\n== ${name.toUpperCase()} ==`);
  const check = (label, a, b, min = 4.5) => {
    const r = ratio(a, b); lowest = Math.min(lowest, r);
    if (r < min) { fail++; console.log(`FAIL ${r.toFixed(2)} (min ${min}) ${label}`); }
  };
  for (const bd of t.checkBackdrops) {
    const glass = over(hex(t.glassBase), parseFloat(t.glassAlpha), hex(bd));
    const mark = over(hex(t.accent), parseFloat(t.markAlpha), glass);
    for (const k of ['fg', 'fgSoft', 'jade', 'brick', 'lagoon']) check(`${k} on glass over ${bd}`, hex(t[k]), glass);
    check(`fg on highlighter mark over ${bd}`, hex(t.fg), mark);
    if (name === 'night') check(`accent text on glass over ${bd}`, hex(t.accent), glass);
  }
  check('accentDeep on accentTint', hex(t.accentDeep), hex(t.accentTint));
  check('jade on jadeTint', hex(t.jade), hex(t.jadeTint));
  check('brick on brickTint', hex(t.brick), hex(t.brickTint));
  check('btnFg on btn', hex(t.btnFg), hex(t.btn));
  check('btnHoverFg on btnHover', hex(t.btnHoverFg), hex(t.btnHover));
  check('sidebarFg on sidebar', hex(t.sidebarFg), hex(t.sidebar));
  check('darkSectionFg on darkSection', hex(t.darkSectionFg), hex(t.darkSection));
  check('fg on surface', hex(t.fg), hex(t.surface));
  check('fg on accent (text on solid accent)', name === 'day' ? hex(t.fg) : hex(t.btnFg), hex(t.accent));
}
console.log(fail ? `\n${fail} contrast check(s) FAILED` : `\nALL CONTRAST CHECKS PASSED (lowest ratio ${lowest.toFixed(2)})`);
process.exit(fail ? 1 : 0);

