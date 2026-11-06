# 🏆 CampusLink AI — BPUT Hackathon 2026 (PS10)

> **AI-Powered Placement Register & Semantic Engine**  
> *Domain: EdTech + Artificial Intelligence / Enterprise Placement Logistics Automation*  
> *Theme: Physical Executive Register · Frosted Glass Day ("Alabaster & Carbon Atelier") & Additive Obsidian Night ("Obsidian Slate & Solar Ember")*

---

## 🌟 Executive Summary

CampusLink AI digitizes, automates, and intelligently explains the campus placement lifecycle across universities, academic directorates, students, and corporate recruiters. Built around the concept of a single continuous recruitment thread, it solves problem statement 10 with mathematical explainability, conflict-free interval scheduling, and a real-time reactive cross-portal synchronized store.

---

## 🎨 Theme & Material System

### 1. Single Source of Truth
All colors and visual properties flow strictly from `src/theme/tokens.js`. A pre-build step (`scripts/gen-theme-css.mjs`) generates CSS variables (`src/styles/themes.generated.css`) ensuring 100% WCAG AAA certified contrast (lowest contrast ratio: 5.19).

- **Day: "Alabaster & Carbon Atelier"**
  - Base: `#F4F5F7`
  - Floating Glass Surfaces: `#FFFFFF` at 62% alpha with frosted backdrop blur & specular tilt highlights
  - Ink Typography: `#0E121B` (headings/body) and `#475569` (supporting)
  - UI Accent: `#D97706` (Solar Gold / Amber)
  - Semantic Status: `#0B6846` (Jade verified), `#A82A18` (Brick conflict/rejected), `#09645E` (Lagoon focus/secondary series)
- **Night: "Obsidian Slate & Solar Ember"**
  - Base: `#090D16`
  - Floating Glass Surfaces: `#111827` with edge-lit border highlights and additive lighting
  - Ink Typography: `#F8FAFC` (parchment white) and `#94A3B8` (slate)
  - UI Accent: `#F59E0B` (Turmeric Ember)
  - Glow Highlights: Needle drop-shadow, match bar halos, stamp luminescence

### 2. View Transitions Circular Reveal
The Day/Night toggle (`src/components/ui/ThemeToggle.jsx`) utilizes the native View Transitions API with a circular wipe originating dynamically from the toggle button coordinates (`ThemeProvider.jsx`).

### 3. How to Flip the Default Theme
To change the default theme from Day to Night:
1. In `index.html`: Update the inline fallback script from `var theme = ... || 'day'` to `var theme = ... || 'night'`.
2. In `src/theme/ThemeProvider.jsx`: Update the fallback state from `'day'` to `'night'`.

---

## 🌐 3D CatmullRom Thread & Pinned Stack

CampusLink features an interactive WebGL layer powered by:
- `three@0.170.0`
- `@react-three/fiber@8.18.0` (pinned for React 18 compatibility)
- `@react-three/drei@9.122.0`
- `lenis@1.3.27` (smooth-scrolling on landing page)

### Guard Rails & Performance:
1. **Zero Bundle Overhead for Portals**: All 3D canvases (`HeroCanvas.jsx`, `PipelineCanvas.jsx`, `LayersCanvas.jsx`) are dynamically imported via `React.lazy()` into a dedicated lazy bundle chunk (`Scenes.js` ~233 KB gzip). Data portals load 0 KB of 3D dependencies.
2. **Offline-Safe**: Zero external CDN dependencies (no CDN matcaps, no remote fonts, no external HDRIs). Local offline font packages (`@fontsource/plus-jakarta-sans` and `@fontsource/jetbrains-mono`) guarantee seamless presentation on venue Wi-Fi.
3. **Adaptive Frame Loop**: Canvases halt rendering when scrolled out of view (`frameloop={visible ? 'always' : 'never'}` via IntersectionObserver). Adaptive DPR scales dynamically from 1.5 to 1.0 via `PerformanceMonitor`.
4. **EFFECTS Toggle (FULL / LITE)**: A mono control in the landing footer allows switching between `FULL` (3D canvases + smooth scroll) and `LITE` (clean 2D fallback with zero WebGL).

---

## 🚀 The 8-Step Judge Walkthrough (Interactive Guide: `GUIDE 0/8`)

Open the persistent **`GUIDE 0/8`** pill in the lower-left corner of any screen to step through the 90-second evaluation checklist:

1. **Adjust Skill Gap Chip** (`/student/overview`): Watch the physical dial needle sweep & progression ladder advance in real-time.
2. **Apply (AI Match) on Microsoft SDE** (`/student/drives`): Trigger the laser scan line and review typewriter factor breakdowns.
3. **Audit & Stamp Student Verification** (`/admin/verification`): View transcript PDF and stamp Ananya Sharma as **VERIFIED**.
4. **Resolve Lab 4 Scheduling Clash** (`/admin/drives`): Slide Cognizant into Lab 2 on the interactive resource interval timeline.
5. **Schedule Slot from Candidate Pipeline** (`/recruiter/pipeline`): Select a conflict-free interview window with explainable bio analysis.
6. **Confirm Cross-Portal Synchronization** (`/student/interviews`): Verify that the newly booked interview instantly appears on the Student timeline.
7. **Switch Day / Night**: Witness the circular clip-path transition between Alabaster Glass and Obsidian Slate.
8. **Scroll the Landing Pipeline** (`/#pipeline`): Ride the CatmullRom spline through all 6 recruitment stages in real-time.

---

## 💻 Running the Application

### 1. Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 2. Contrast Certification
```bash
node scripts/check-contrast.mjs
```
Verifies WCAG AAA compliant contrast ratios across all semantic color tokens on both themes.

### 3. Production Build
```bash
npm run build
```

### 4. Production Preview
```bash
npm run preview
```
Open `http://localhost:4173` in your browser.
