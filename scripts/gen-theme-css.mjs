// Generates src/styles/themes.generated.css from src/theme/tokens.js. Runs before dev and build.
import { writeFileSync, mkdirSync } from 'node:fs';
import { tokens } from '../src/theme/tokens.js';
const kebab = (s) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
const isHex = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
const triplet = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ');
const block = (name, t) => {
  const lines = [];
  for (const [k, v] of Object.entries(t)) {
    if (k === 'checkBackdrops') continue;
    if (k.startsWith('three')) lines.push(`  --${kebab(k)}: ${v};`);
    else if (isHex(v)) lines.push(`  --c-${kebab(k)}: ${triplet(v)};`);
    else lines.push(`  --${kebab(k)}: ${v};`);
  }
  return `:root[data-theme='${name}'] {\n  color-scheme: ${name === 'night' ? 'dark' : 'light'};\n${lines.join('\n')}\n}\n`;
};
mkdirSync('src/styles', { recursive: true });
writeFileSync('src/styles/themes.generated.css', `/* GENERATED from src/theme/tokens.js. Do not edit. */\n${block('day', tokens.day)}\n${block('night', tokens.night)}`);
console.log('themes.generated.css written');

