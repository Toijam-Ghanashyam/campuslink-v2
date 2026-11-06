import fs from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const targets = ['bg-ink', 'text-ink', 'border-ink', 'text-bone', 'bg-bone', 'bg-paper', 'text-paper', 'ring-ink', 'stroke-ink', 'fill-ink'];

function walk(dir) {
  let files = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist') files = files.concat(walk(full));
    } else if (/\.(jsx?|css)$/.test(f)) {
      files.push(full);
    }
  }
  return files;
}

const allFiles = walk('src');
const occurrences = {};
const hexList = [];

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  for (const t of targets) {
    const regex = new RegExp('\\b' + t + '\\b', 'g');
    const matches = content.match(regex);
    if (matches) {
      if (!occurrences[file]) occurrences[file] = {};
      occurrences[file][t] = matches.length;
    }
  }

  lines.forEach((line, idx) => {
    const hexMatches = line.match(/#[0-9a-fA-F]{6}\b/g);
    if (hexMatches) {
      hexMatches.forEach(h => {
        hexList.push({ file: path.relative(process.cwd(), file).replace(/\\/g, '/'), line: idx + 1, hex: h, snippet: line.trim() });
      });
    }
  });
}

let md = '# Preflight Report (P0)\n\n';
md += '## (a) Core Package Versions\n\n';
md += '- **react**: ' + (pkg.dependencies.react || 'N/A') + '\n';
md += '- **react-dom**: ' + (pkg.dependencies['react-dom'] || 'N/A') + '\n';
md += '- **framer-motion**: ' + (pkg.dependencies['framer-motion'] || 'N/A') + '\n';
md += '- **tailwindcss**: ' + (pkg.devDependencies.tailwindcss || 'N/A') + '\n';
md += '- **vite**: ' + (pkg.devDependencies.vite || 'N/A') + '\n\n';

md += '## (b) Font Imports & Google Fonts URLs\n\n';
md += '### index.html\n';
md += '```html\n';
md += '<link rel="preconnect" href="https://fonts.googleapis.com">\n';
md += '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n';
md += '<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Manrope:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&display=swap" rel="stylesheet">\n';
md += '```\n\n';
md += '### src/main.jsx\n';
md += '- `import "./index.css";`\n\n';
md += '### src/index.css\n';
md += '- Referenced fonts: `Instrument Sans`, `Manrope`, `Newsreader`, `Fraunces`, `IBM Plex Mono`\n\n';

md += '## (c) Color Class Occurrences per File\n\n';
md += '| File | bg-ink | text-ink | border-ink | text-bone | bg-bone | bg-paper | text-paper | ring-ink | stroke-ink | fill-ink |\n';
md += '| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n';

for (const [file, counts] of Object.entries(occurrences)) {
  const rel = file.replace(/\\/g, '/');
  const row = [
    rel,
    counts['bg-ink'] || 0,
    counts['text-ink'] || 0,
    counts['border-ink'] || 0,
    counts['text-bone'] || 0,
    counts['bg-bone'] || 0,
    counts['bg-paper'] || 0,
    counts['text-paper'] || 0,
    counts['ring-ink'] || 0,
    counts['stroke-ink'] || 0,
    counts['fill-ink'] || 0,
  ];
  md += '| `' + row[0] + '` | ' + row.slice(1).join(' | ') + ' |\n';
}

md += '\n## (d) Hex Color Literals in Source Code\n\n';
md += '| File:Line | Hex | Snippet |\n';
md += '| :--- | :---: | :--- |\n';
for (const h of hexList) {
  md += '| `' + h.file + ':' + h.line + '` | `' + h.hex + '` | `' + h.snippet.replace(/\|/g, '\\|').slice(0, 70) + '` |\n';
}

md += '\n## (e) PS Deliverables Route & Switcher Audit\n\n';
md += '- **Route `/admin/ai-engine`**: **Does NOT exist** in `src/App.jsx` (to be added in future step).\n';
md += '- **Admin Campus Switcher**: **Does NOT exist** in `src/components/layout/AppShell.jsx` (to be added in future step).\n';

fs.mkdirSync('_reports', { recursive: true });
fs.writeFileSync('_reports/preflight.md', md);
console.log('_reports/preflight.md generated successfully');

