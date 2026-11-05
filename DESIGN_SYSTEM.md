# CampusLink AI — Design System & Engineering Rules

Stack: Vite + React 18 (JavaScript, no TypeScript), Tailwind CSS v3.4, react-router-dom v6, framer-motion, recharts, lucide-react.
Fonts from Google Fonts: Fraunces (headings, big numbers) and Manrope (UI text).

## 1. Design Tokens
- `bone`: `#F6F2E9` (page background)
- `paper`: `#FFFDF8` (cards, surfaces)
- `ink`: `#14161C` (sidebar, headings, primary buttons)
- `ink-soft`: `#5B5F6B` (secondary text, subheadings, labels)
- `line`: `#E6DFCF` (borders, subtle dividers)
- `ochre`: `#E8A33D` (the ONE accent: active nav marker, score dial, AI sparkle, highlights)
- `ochre-tint`: `#FBEFD5` (accent backgrounds, pending badges)
- `ochre-deep`: `#8A5A0B` (accent badge text, dark ochre)
- `jade`: `#1F8A63` (verified, approved, success states)
- `jade-tint`: `#DDF1E8` (verified/approved background)
- `brick`: `#C4432F` (rejected, conflict, alert states)
- `brick-tint`: `#F8E1DC` (rejected/conflict background)

Rules:
- Pending status = ochre-tint background with ochre-deep text.
- Text that sits on ochre is always ink, never white.
- Never use blue, purple, gradients (except one faint ochre glow on landing hero), glassmorphism, neon, emoji, or stock illustrations.
- Use Lucide icons with stroke width 1.75.

## 2. Layout & Typography
- 8px spacing scale.
- Cards: paper background, 1px line border, radius 16px (rounded-2xl), padding 24px (p-6), subtle shadow `0 1px 2px rgba(20,22,28,0.04)`.
- Page content max width 1200px, 32px gaps (gap-8) between sections. Max 4 metric cards per row.
- Headings: Fraunces 600 (`font-display`). Body: Manrope (`font-sans`).
- Numbers: tabular figures (`tabular-nums`).

## 3. Motion (framer-motion)
- Easing: `[0.22, 1, 0.36, 1]`.
- Durations: micro 150ms, standard 350ms, scene 700ms.
- Every page enters with fade + 8px rise.
- Animate only transform and opacity and SVG stroke.
- Respect `prefers-reduced-motion`.
- Only ONE signature animation per screen; everything else subtle.

## 4. Architecture & Data
- Shared in-memory reactive store (`src/lib/store.js`).
- Mock API layer (`src/api/*.js`) simulating 400-700ms delay.
- Error boundary on each portal to keep runtime rock-solid.

