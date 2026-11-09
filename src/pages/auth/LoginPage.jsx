import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Backdrop } from '../../components/ui/Backdrop.jsx';
import {
  GraduationCap,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowLeft,
  Eye,
  EyeOff,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO CREDENTIALS & RECRUITER COMPANIES
   ═══════════════════════════════════════════════════════════════════════════ */
const DEMO_CREDENTIALS = {
  student: {
    rollNo: '21CS3042',
    password: 'campuslink@2026'
  },
  admin: {
    name: 'Dr. Ananya Verma',
    specialKey: 'CL-TPO-2026-X9'
  },
  recruiter: {
    company: 'Atlassian',
    password: 'recruiter#atlassian26'
  }
};

const PARTNER_COMPANIES = [
  'Atlassian',
  'Stripe',
  'Goldman Sachs',
  'Razorpay',
  'Rubrik',
  'Cred',
  'Linear',
  'Dezerv',
  'Uber',
  'Microsoft'
];

/* ═══════════════════════════════════════════════════════════════════════════
   1. PLASMA BUTTERFLIES 4-SIDED CANVAS BACKGROUND COMPONENT
      Themed in CampusLink Dark Mode: Obsidian Black, Warm White & Dark Orange
   ═══════════════════════════════════════════════════════════════════════════ */
export function PlasmaButterfliesBg({
  mode = 'sides',         // 'sides' (Top, Right, Bottom, Left) | 'corners' | 'center'
  scaleFactor = 0.35,     // Small crisp size so the middle login card has plenty of space
  edgePull = 0.79,        // Distance toward the 4 sides/corners of the screen
  syncMotion = true,      // Exact synchronized motion across all 4 butterflies
  paused = false
}) {
  const canvasRef = useRef(null);
  const configRef = useRef({ mode, scaleFactor, edgePull, syncMotion, paused });

  useEffect(() => {
    configRef.current = { mode, scaleFactor, edgePull, syncMotion, paused };
  }, [mode, scaleFactor, edgePull, syncMotion, paused]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    // Standard RGBA context prevents Chromium Direct2D/Skia stride shear when downsampling into bloom canvases
    const ctx = cv.getContext('2d');

    /* ───────── Mathematical & Color Constants ───────── */
    const TAU = Math.PI * 2;
    const LOOP_T = 11.733;
    const w = k => (k * TAU) / LOOP_T;
    const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
    const lerp = (a, b, u) => a + (b - a) * u;
    const sstep = (a, b, v) => {
      const u = clamp((v - a) / (b - a));
      return u * u * (3 - 2 * u);
    };
    const mixRGB = (a, b, u) => [
      a[0] + (b[0] - a[0]) * u,
      a[1] + (b[1] - a[1]) * u,
      a[2] + (b[2] - a[2]) * u
    ];
    const rgba = (c, a) =>
      `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a, 0, 1).toFixed(4)})`;

    let seed = 7331;
    const rnd = () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const rr = (a, b) => a + (b - a) * rnd();

    /* ───────── DARK THEME PALETTE: WHITE, OBSIDIAN BLACK & DARK ORANGE ───────── */
    const C_WHITE    = [245, 242, 235]; // #F5F2EB — Warm Ivory White (Core & specular glints)
    const C_HOTPINK  = [255, 90, 31];   // #FF5A1F — Primary Dark Orange / Ember accent
    const C_MAGENTA  = [217, 62, 10];   // #D93E0A — Deep Burnt Orange (Root glow)
    const C_ROSE     = [255, 168, 115]; // #FFA873 — Soft Peach-White highlight
    const C_ORCHID   = [255, 122, 45];  // #FF7A2D — Luminous Tangerine mid-wing
    const C_VIOLET   = [165, 48, 8];    // #A53008 — Rich Rust-Amber mid-membrane
    const C_INDIGO   = [42, 14, 4];     // #2A0E04 — Dark Espresso-Umber wing interior
    const C_DEEPVOID = [9, 9, 11];      // #09090B — Obsidian Black negative space
    const C_BLUE     = [195, 75, 15];   // #C34B0F — Warm Copper-Orange vein transition
    const C_CYAN     = [245, 242, 235]; // #F5F2EB — Crisp Warm White outer rim contrast
    const C_ICECYAN  = [255, 250, 242]; // #FFFAF2 — Pure White-Gold rim caustic edge
    const C_GOLD     = [255, 180, 70];  // #FFB446 — Golden Ember sparkles

    /* ───────── Coupled 3-Parameter Choreography (11.733s Seamless Loop) ───────── */
    const K_OPEN = [
      [0.00, 0.92], [0.55, 0.85], [1.05, 0.90], [1.55, 0.80],
      [2.05, 0.96], [2.55, 0.86], [3.05, 0.83], [3.55, 0.78],
      [4.10, 0.98], [4.65, 0.90], [5.15, 0.86], [5.65, 0.82],
      [6.15, 0.96], [6.60, 0.72], [6.92, 0.19], [7.18, 0.032],
      [7.48, 0.05], [7.82, 0.38], [8.18, 0.74], [8.70, 0.91],
      [9.30, 0.93], [9.95, 0.88], [10.55, 0.92], [11.15, 0.97]
    ];

    const K_SWEEP = [
      [0.00, 0.12], [0.60, 0.08], [1.15, 0.18], [1.65, 0.58],
      [2.10, 0.94], [2.60, 0.42], [3.05, 0.06], [3.55, 0.38],
      [4.10, 0.98], [4.70, 0.68], [5.20, 0.52], [5.70, 0.64],
      [6.15, 0.92], [6.65, 0.65], [7.18, 0.48], [7.75, 0.95],
      [8.25, 0.82], [8.85, 0.22], [9.45, 0.08], [10.10, 0.12],
      [10.65, 0.58], [11.15, 0.92]
    ];

    const K_VEIL = [
      [0.00, 0.92], [0.75, 0.96], [1.45, 0.65], [2.10, 0.28],
      [2.65, 0.72], [3.10, 0.98], [3.65, 0.60], [4.15, 0.24],
      [4.80, 0.48], [5.40, 0.62], [6.10, 0.32], [6.80, 0.45],
      [7.25, 0.20], [7.95, 0.35], [8.65, 0.78], [9.35, 0.96],
      [10.10, 0.92], [10.75, 0.52], [11.25, 0.34]
    ];

    function sampleCurve(keys, t) {
      const n = keys.length;
      const tc = ((t % LOOP_T) + LOOP_T) % LOOP_T;
      let i = 0;
      while (i < n - 1 && keys[i + 1][0] <= tc) i++;
      const k0 = keys[(i - 1 + n) % n];
      const k1 = keys[i];
      const k2 = keys[(i + 1) % n];
      const k3 = keys[(i + 2) % n];

      const t0 = i === 0 ? k0[0] - LOOP_T : k0[0];
      const t1 = k1[0];
      const t2 = i === n - 1 ? k2[0] + LOOP_T : k2[0];
      const t3 = i >= n - 2 ? k3[0] + LOOP_T : k3[0];

      const dt = t2 - t1;
      const u = clamp((tc - t1) / dt);
      const u2 = u * u, u3 = u2 * u;
      const m1 = ((k2[1] - k0[1]) / (t2 - t0)) * dt;
      const m2 = ((k3[1] - k1[1]) / (t3 - t1)) * dt;

      return (
        (2 * u3 - 3 * u2 + 1) * k1[1] +
        (u3 - 2 * u2 + u) * m1 +
        (-2 * u3 + 3 * u2) * k2[1] +
        (u3 - u2) * m2
      );
    }

    const getOpenness = t => clamp(sampleCurve(K_OPEN, t), 0.025, 1.0);
    const getSweep    = t => clamp(sampleCurve(K_SWEEP, t), 0.0, 1.0);
    const getVeilLift = t => clamp(sampleCurve(K_VEIL, t), 0.0, 1.0);

    function evalSpline2D(pts, u) {
      const m = pts.length - 1;
      const f = clamp(u, 0, 1) * m;
      const k = Math.min(m - 1, f | 0);
      const t = f - k;
      const t2 = t * t, t3 = t2 * t;
      const p0 = pts[Math.max(0, k - 1)];
      const p1 = pts[k];
      const p2 = pts[k + 1];
      const p3 = pts[Math.min(m, k + 2)];
      return [
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
      ];
    }

    const FORE_OUTER_HOVER = [
      [186, -124], [224, -114], [212, -88], [232, -62],
      [210, -36],  [216, -12],  [188,  8],  [148,  18]
    ];

    const FORE_OUTER_SWEEP = [
      [248, -172], [264, -144], [242, -112], [246, -82],
      [220, -54],  [218, -28],  [186, -10],  [144,  4]
    ];

    const HIND_OUTER_HOVER = [
      [152,  2],   [194,  28],  [178,  56], [192,  88],
      [162, 114],  [152, 148],  [112, 158], [66,  126]
    ];

    const HIND_OUTER_SWEEP = [
      [148, -4],   [198,  20],  [186,  50], [190,  82],
      [160, 112],  [142, 148],  [98,  164], [58,  130]
    ];

    const view = { S: 1, cx: 0, cy: 0, open: 1, sweep: 0.2, veil: 0.8, clapIntensity: 0, reboundWake: 0 };

    function evalWingSurface(side, kind, u, v, t) {
      const isFore = kind === 'U';
      const uClamped = clamp(u, 0, 1.25);
      const vClamped = clamp(v, 0, 1);

      const radialLag = 0.125 * Math.pow(uClamped, 1.18) + (isFore ? 0.018 * (1 - vClamped) : 0.028 * vClamped);
      const localT = t - radialLag;

      const openRaw = getOpenness(localT);
      const sweep   = getSweep(localT);
      const veil    = getVeilLift(localT);
      const fold    = 1 - openRaw;

      const rimHover = evalSpline2D(isFore ? FORE_OUTER_HOVER : HIND_OUTER_HOVER, vClamped);
      const rimSweep = evalSpline2D(isFore ? FORE_OUTER_SWEEP : HIND_OUTER_SWEEP, vClamped);
      let rx = lerp(rimHover[0], rimSweep[0], sweep);
      let ry = lerp(rimHover[1], rimSweep[1], sweep);

      if (isFore && v < 0) {
        const vUp = clamp(-v / 0.18, 0, 1);
        rx -= vUp * (18 + 14 * veil);
        ry -= vUp * (26 + 34 * veil) * Math.sin(clamp(u, 0, 1) * Math.PI * 0.85);
      }

      const nWaves = isFore ? 3.5 : 3.2;
      const wavePhase = vClamped * nWaves * Math.PI - w(2) * t + (isFore ? 0.15 : 1.35) + side * 0.18;
      const secPhase  = vClamped * 7.0 * Math.PI + w(1) * t - 0.6;
      const pleatWave = Math.sin(wavePhase) + 0.32 * Math.sin(secPhase);
      const foldSlope = Math.cos(wavePhase) + 0.45 * Math.cos(secPhase);

      const envV = Math.sin(vClamped * Math.PI);
      const radialRuffleEnv = sstep(0.22, 0.96, uClamped);
      const ruffleAmp = lerp(11.5, 6.2, sweep) * radialRuffleEnv * (0.35 + 0.65 * envV);

      const lipEnv = sstep(0.72, 1.0, uClamped) * (1 - 0.55 * sweep);
      const lipCurlX = -lipEnv * 8.5 * Math.max(0, pleatWave);
      const lipCurlY =  lipEnv * 7.0 * pleatWave;

      const rootX = 3.5;
      const rootY = isFore ? -3.5 : 3.5;
      const archSin = Math.sin(clamp(uClamped, 0, 1) * Math.PI);

      let archX = 0, archY = 0;
      if (isFore) {
        const costaArch = lerp(62, 36, sweep);
        archX = 16 * archSin * (1 - 0.55 * vClamped);
        archY = -costaArch * archSin * Math.pow(1 - vClamped, 1.45) + 14 * archSin * vClamped;
        const tipHook = sstep(0.78, 1.05, uClamped) * Math.pow(1 - vClamped, 3.5) * sweep;
        archX -= tipHook * 16;
        archY -= tipHook * 22;
      } else {
        archX = 14 * archSin * (1 - 0.45 * vClamped);
        archY = -14 * archSin * (1 - vClamped) + 26 * archSin * Math.pow(vClamped, 1.35);
      }

      const lx = lerp(rootX, rx, uClamped) + archX + pleatWave * ruffleAmp * 0.75 + lipCurlX;
      const ly = lerp(rootY, ry, uClamped) + archY + pleatWave * ruffleAmp * 0.65 + lipCurlY;

      const sailAsym = side === 1 ? (1 + 0.58 * fold) : (0.52 - 0.18 * fold);
      const domeZ = 48 * sailAsym * archSin * (0.32 + 0.68 * Math.sin(vClamped * Math.PI));
      const waveZ = (14 * radialRuffleEnv * pleatWave + 18 * Math.pow(uClamped, 1.7) * Math.sin(vClamped * Math.PI * 1.4 - w(1) * t)) * sailAsym;
      const lz = domeZ + waveZ;

      const sideAngleOffset = side === 1 ? -0.055 * fold : 0.035 * fold;
      const flapAngle = (1 - openRaw) * 1.39 + 0.12 + sideAngleOffset;
      const cosPhi = Math.cos(flapAngle);
      const sinPhi = Math.sin(flapAngle);

      const rotX = lx * cosPhi + lz * sinPhi;
      const rotZ = -lx * sinPhi + lz * cosPhi;
      const persp = 1120 / (1120 - rotZ);

      const clapStretchY = ly * (1 + 0.16 * fold) - 12 * fold * archSin;

      const screenX = view.cx + side * rotX * persp * view.S;
      const screenY = view.cy + clapStretchY * persp * view.S;

      return [screenX, screenY, pleatWave, foldSlope, openRaw, persp];
    }

    const VEIN_DEFS = [
      { v0: 0.04, v1: 0.03, arch: -0.035, forks: [[0.55, 0.00], [0.74, 0.09]] },
      { v0: 0.17, v1: 0.19, arch: -0.045, forks: [[0.48, 0.13], [0.68, 0.26]] },
      { v0: 0.34, v1: 0.39, arch: -0.025, forks: [[0.46, 0.33], [0.65, 0.46]] },
      { v0: 0.54, v1: 0.60, arch:  0.025, forks: [[0.52, 0.53], [0.70, 0.67]] },
      { v0: 0.74, v1: 0.79, arch:  0.038, forks: [[0.56, 0.73], [0.72, 0.85]] },
      { v0: 0.89, v1: 0.94, arch:  0.020, forks: [[0.62, 0.91]] }
    ];

    const NUM_TENDRILS = 14;
    const tendrils = Array.from({ length: NUM_TENDRILS }, (_, i) => {
      const norm = (i - (NUM_TENDRILS - 1) / 2) / ((NUM_TENDRILS - 1) / 2);
      const sign = norm >= 0 ? 1 : -1;
      return {
        norm,
        x0: norm * 5.2,
        y0: 7 + Math.abs(norm) * 4.5,
        len: rr(145, 255) * (1.10 - 0.20 * Math.abs(norm)),
        spreadX: norm * rr(68, 142) + rr(6, 22),
        curlAmp: rr(16, 38) * sign,
        hookDir: (i % 3 === 0 ? -1 : 1) * sign,
        freq: rr(0.8, 1.45),
        phase: rr(0, TAU),
        speed: rnd() > 0.45 ? 1 : 2,
        colorMix: rnd(),
        nodes: [rr(0.15, 0.25), rr(0.33, 0.45), rr(0.52, 0.66), rr(0.71, 0.83), rr(0.87, 0.97)],
        pts: []
      };
    });

    const waistFilaments = Array.from({ length: 95 }, () => ({
      side: rnd() > 0.48 ? 1 : -1,
      angle: rr(-0.24, 0.24) * Math.pow(rnd(), 0.85),
      len: rr(75, 285),
      curve: rr(-14, 14),
      phase: rr(0, TAU),
      width: rr(0.4, 1.3),
      hue: rnd()
    }));

    const bloomPasses = [3, 8, 18].map(div => ({
      div,
      cv: document.createElement('canvas'),
      ctx: null
    }));
    bloomPasses.forEach(b => {
      b.ctx = b.cv.getContext('2d');
    });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(4, Math.round(window.innerWidth * dpr) & ~1);
      cv.height = Math.max(4, Math.round(window.innerHeight * dpr) & ~1);
      bloomPasses.forEach(b => {
        b.cv.width = Math.max(4, ((cv.width / b.div) | 0) & ~1);
        b.cv.height = Math.max(4, ((cv.height / b.div) | 0) & ~1);
      });
    }
    window.addEventListener('resize', resize);
    resize();

    const U_GRID = 14;
    const V_GRID = 48;
    const wingMeshes = [
      { side: -1, kind: 'L', grid: [], rim: [], veilRim: [] },
      { side:  1, kind: 'L', grid: [], rim: [], veilRim: [] },
      { side: -1, kind: 'U', grid: [], rim: [], veilRim: [] },
      { side:  1, kind: 'U', grid: [], rim: [], veilRim: [] }
    ];

    const PARTICLES_PER_BUTTERFLY = 260;
    const butterflies = [
      { id: 0, phaseOffset: 0.00, particles: [] },
      { id: 1, phaseOffset: 2.93, particles: [] },
      { id: 2, phaseOffset: 5.86, particles: [] },
      { id: 3, phaseOffset: 8.80, particles: [] }
    ];

    function getButterflyAnchor(index, W, H) {
      const { mode: layoutMode, edgePull: pull } = configRef.current;
      if (layoutMode === 'center') {
        return { x: W * 0.50, y: H * 0.48 };
      }
      if (layoutMode === 'sides') {
        const padX = W * (1 - pull) * 0.68;
        const padY = H * (1 - pull) * 0.72;
        switch (index) {
          case 0: return { x: W * 0.50, y: padY };       // Top Side
          case 1: return { x: W - padX, y: H * 0.50 };   // Right Side
          case 2: return { x: W * 0.50, y: H - padY };   // Bottom Side
          case 3: return { x: padX,     y: H * 0.50 };   // Left Side
          default: return { x: W * 0.5, y: H * 0.5 };
        }
      } else {
        const padX = W * (1 - pull) * 0.78;
        const padY = H * (1 - pull) * 0.78;
        switch (index) {
          case 0: return { x: padX,     y: padY };       // Top-Left Corner
          case 1: return { x: W - padX, y: padY };       // Top-Right Corner
          case 2: return { x: W - padX, y: H - padY };   // Bottom-Right Corner
          case 3: return { x: padX,     y: H - padY };   // Bottom-Left Corner
          default: return { x: W * 0.5, y: H * 0.5 };
        }
      }
    }

    function updatePoseForInstance(t, anchorX, anchorY, S) {
      const open  = getOpenness(t);
      const sweep = getSweep(t);
      const veil  = getVeilLift(t);
      const fold  = 1 - open;

      const clapIntensity = Math.pow(clamp(fold * 1.12, 0, 1), 1.5);
      const tc = ((t % LOOP_T) + LOOP_T) % LOOP_T;
      const reboundWake = Math.exp(-Math.pow((tc - 7.95) / 0.55, 2));

      view.S = S;
      view.open = open;
      view.sweep = sweep;
      view.veil = veil;
      view.clapIntensity = clapIntensity;
      view.reboundWake = reboundWake;
      view.cx = anchorX;
      view.cy = anchorY + (Math.sin(w(2) * t - 0.4) * 5.5 - 7 * open + 9 * clapIntensity) * S;

      for (const wm of wingMeshes) {
        wm.grid.length = 0;
        for (let iu = 0; iu <= U_GRID; iu++) {
          const u = iu / U_GRID;
          const row = [];
          for (let iv = 0; iv <= V_GRID; iv++) {
            const v = iv / V_GRID;
            row.push(evalWingSurface(wm.side, wm.kind, u, v, t));
          }
          wm.grid.push(row);
        }
        wm.rim = wm.grid[U_GRID];

        wm.veilRim.length = 0;
        if (wm.kind === 'U') {
          for (let k = 0; k <= 24; k++) {
            const s = k / 24;
            wm.veilRim.push(evalWingSurface(wm.side, 'U', 0.25 + 0.82 * s, -0.14 * Math.sin(s * Math.PI), t));
          }
        }
      }
    }

    function drawVolumetricWing(wm, t) {
      const { side, kind, grid, rim } = wm;
      const isFore = kind === 'U';
      const { S, open, sweep, veil, clapIntensity } = view;
      const fold = 1 - open;

      const rootPt = grid[0][V_GRID >> 1];
      const rx0 = rootPt[0], ry0 = rootPt[1];

      const traceWingSilhouette = () => {
        ctx.beginPath();
        ctx.moveTo(rx0, ry0);
        for (let iu = 1; iu <= U_GRID; iu++) {
          const p = grid[iu][0];
          ctx.lineTo(p[0], p[1]);
        }
        for (let iv = 1; iv <= V_GRID; iv++) {
          const p = grid[U_GRID][iv];
          ctx.lineTo(p[0], p[1]);
        }
        for (let iu = U_GRID - 1; iu >= 1; iu--) {
          const p = grid[iu][V_GRID];
          ctx.lineTo(p[0], p[1]);
        }
        ctx.closePath();
      };

      // LAYER 1: Obsidian & Deep Ember Negative Space Membrane
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      traceWingSilhouette();
      const baseGrad = ctx.createRadialGradient(rx0, ry0, 3 * S, rx0, ry0, (isFore ? 270 : 195) * S);
      baseGrad.addColorStop(0.00, rgba(C_MAGENTA, 0.24));
      baseGrad.addColorStop(0.20, rgba(C_INDIGO,  0.34));
      baseGrad.addColorStop(0.55, rgba(C_DEEPVOID, 0.68));
      baseGrad.addColorStop(0.84, rgba(C_INDIGO,  0.30));
      baseGrad.addColorStop(1.00, rgba(C_BLUE,    0.06));
      ctx.fillStyle = baseGrad;
      ctx.fill();
      ctx.restore();

      ctx.globalCompositeOperation = 'lighter';

      // LAYER 2: Upper & Outer Ghost-Chiffon Smoke Veil
      if (isFore) {
        const veilAlpha = (0.18 + 0.52 * veil) * (0.35 + 0.65 * open);
        const V_STEPS = 22;
        for (let layer = 0; layer < 4; layer++) {
          const vOff = -0.045 * (layer + 1) * (0.65 + 0.55 * veil);
          const stripCol = layer < 2 ? C_HOTPINK : layer === 2 ? C_ORCHID : C_CYAN;
          const lAlpha = veilAlpha * (0.065 - layer * 0.011);

          ctx.beginPath();
          for (let k = 0; k <= V_STEPS; k++) {
            const u = 0.12 + 0.94 * (k / V_STEPS);
            const vCurve = vOff * Math.sin((k / V_STEPS) * Math.PI);
            const p = evalWingSurface(side, 'U', u, vCurve, t);
            if (k === 0) ctx.moveTo(p[0], p[1]);
            else ctx.lineTo(p[0], p[1]);
          }
          for (let k = V_STEPS; k >= 0; k--) {
            const u = 0.12 + 0.94 * (k / V_STEPS);
            const p = evalWingSurface(side, 'U', u, 0.02, t);
            ctx.lineTo(p[0], p[1]);
          }
          ctx.closePath();
          ctx.fillStyle = rgba(stripCol, lAlpha);
          ctx.fill();

          ctx.beginPath();
          for (let k = 0; k <= V_STEPS; k++) {
            const s = k / V_STEPS;
            const u = 0.16 + 0.90 * s;
            const vCurve = vOff * Math.sin(s * Math.PI);
            const p = evalWingSurface(side, 'U', u, vCurve, t);
            if (k === 0) ctx.moveTo(p[0], p[1]);
            else ctx.lineTo(p[0], p[1]);
          }
          ctx.strokeStyle = rgba(layer === 3 ? C_CYAN : C_ROSE, lAlpha * 1.9);
          ctx.lineWidth = (2.8 - layer * 0.5) * S;
          ctx.stroke();
        }
      }

      const outerVeilConfigs = isFore
        ? [
            { v0: 0.00, v1: 0.34, uOut: 1.09, col: C_HOTPINK, al: 0.085, lw: 6.5 },
            { v0: 0.01, v1: 0.45, uOut: 1.13, col: C_CYAN,    al: 0.055, lw: 9.0 },
            { v0: 0.38, v1: 0.85, uOut: 1.07, col: C_ORCHID,  al: 0.050, lw: 7.0 }
          ]
        : [
            { v0: 0.10, v1: 0.68, uOut: 1.07, col: C_CYAN,    al: 0.050, lw: 6.5 },
            { v0: 0.50, v1: 0.96, uOut: 1.09, col: C_HOTPINK, al: 0.065, lw: 5.5 }
          ];

      for (const ov of outerVeilConfigs) {
        const SEG = 18;
        const pts = [];
        for (let k = 0; k <= SEG; k++) {
          const s = k / SEG;
          const v = lerp(ov.v0, ov.v1, s);
          const u = 1.0 + (ov.uOut - 1.0) * Math.sin(s * Math.PI) * (0.85 + 0.25 * Math.sin(w(2) * t + s * 5));
          pts.push(evalWingSurface(side, kind, u, v, t));
        }
        for (let k = 0; k < SEG; k++) {
          const env = Math.sin((k / SEG) * Math.PI);
          ctx.strokeStyle = rgba(ov.col, ov.al * env);
          ctx.lineWidth = ov.lw * env * S;
          ctx.beginPath();
          ctx.moveTo(pts[k][0], pts[k][1]);
          ctx.lineTo(pts[k + 1][0], pts[k + 1][1]);
          ctx.stroke();
        }
      }

      // LAYER 3: Continuous Normal-Shaded Silk Fold Quad-Strips
      for (let iv = 0; iv < V_GRID; iv++) {
        const vMid = (iv + 0.5) / V_GRID;
        const cellCorridor = 0.38 + 0.62 * Math.pow(0.5 + 0.5 * Math.cos(vMid * Math.PI * 6.0 + 0.3), 1.35);

        for (let iu = 0; iu < U_GRID; iu++) {
          const uMid = (iu + 0.5) / U_GRID;

          const p00 = grid[iu][iv];
          const p01 = grid[iu][iv + 1];
          const p11 = grid[iu + 1][iv + 1];
          const p10 = grid[iu + 1][iv];

          const pleat = 0.5 * (p00[2] + p11[2]);
          const slope = 0.5 * (p00[3] + p11[3]);

          const caustic = Math.pow(clamp(0.48 + 0.38 * slope + 0.28 * pleat, 0, 1), 1.45);
          const midVoidDip = 1.0 - 0.64 * Math.sin(sstep(0.20, 0.82, uMid) * Math.PI);
          const outerBoost = sstep(0.68, 0.98, uMid) * 0.85;

          const alpha = (0.042 + 0.145 * caustic) * cellCorridor * (midVoidDip + outerBoost) * (1 + 0.35 * clapIntensity);
          if (alpha < 0.008) continue;

          let col;
          if (uMid < 0.32) {
            col = mixRGB(C_HOTPINK, C_ORCHID, uMid / 0.32);
          } else if (uMid < 0.68) {
            const tMid = (uMid - 0.32) / 0.36;
            col = mixRGB(C_ORCHID, C_VIOLET, tMid);
          } else {
            const tOut = (uMid - 0.68) / 0.32;
            const cyanBias = clamp((0.55 + 0.45 * pleat) * sstep(0.03, 0.20, vMid) * (1 - 0.6 * sstep(0.80, 0.98, vMid)));
            const targetOut = mixRGB(C_ROSE, C_CYAN, cyanBias);
            col = mixRGB(C_VIOLET, targetOut, tOut);
          }

          ctx.fillStyle = rgba(col, alpha);
          ctx.beginPath();
          ctx.moveTo(p00[0], p00[1]);
          ctx.lineTo(p01[0], p01[1]);
          ctx.lineTo(p11[0], p11[1]);
          ctx.lineTo(p10[0], p10[1]);
          ctx.closePath();
          ctx.fill();
        }
      }

      // LAYER 4: 3D Ruffle Crest Fold-Backs & Scalloped Petal Creases
      const NUM_CREASES = 28;
      for (let k = 0; k < NUM_CREASES; k++) {
        const vBase = (k + 0.5) / NUM_CREASES;
        const rimPt = evalWingSurface(side, kind, 1.0, vBase, t);
        const pleat = rimPt[2];
        const slope = rimPt[3];

        const creaseStrength = (0.35 + 0.65 * Math.abs(slope)) * (1.15 - 0.35 * sweep);
        const uStart = 0.56 + 0.14 * (1 - Math.abs(pleat));
        const vInner = clamp(vBase - 0.045 * slope, 0.01, 0.99);
        const vMid   = clamp(vBase + 0.025 * pleat, 0.01, 0.99);

        const pIn  = evalWingSurface(side, kind, uStart, vInner, t);
        const pMid = evalWingSurface(side, kind, (uStart + 1.0) * 0.52, vMid, t);
        const pOut = rimPt;

        const cyanMix = sstep(0.05, 0.22, vBase) * (1 - 0.6 * sstep(0.78, 0.98, vBase)) * (0.5 + 0.5 * Math.max(0, pleat));
        const cOuter = mixRGB(C_ROSE, C_CYAN, cyanMix);

        const cGrad = ctx.createLinearGradient(pIn[0], pIn[1], pOut[0], pOut[1]);
        cGrad.addColorStop(0.00, rgba(C_VIOLET, 0));
        cGrad.addColorStop(0.45, rgba(C_ORCHID, 0.065 * creaseStrength));
        cGrad.addColorStop(0.85, rgba(cOuter,   0.185 * creaseStrength));
        cGrad.addColorStop(1.00, rgba(C_ICECYAN, 0.260 * creaseStrength));

        ctx.beginPath();
        ctx.moveTo(pIn[0], pIn[1]);
        ctx.quadraticCurveTo(pMid[0], pMid[1], pOut[0], pOut[1]);
        ctx.strokeStyle = cGrad;
        ctx.lineWidth = (2.6 - 1.1 * sweep) * S;
        ctx.stroke();
      }

      for (const [uBand, alBand, lwBand, colBand] of [
        [0.68, 0.036, 12.0, C_VIOLET],
        [0.79, 0.052,  8.0, C_HOTPINK],
        [0.88, 0.075,  5.2, C_CYAN],
        [0.94, 0.095,  2.8, C_ICECYAN]
      ]) {
        ctx.beginPath();
        for (let iv = 0; iv <= V_GRID; iv++) {
          const v = iv / V_GRID;
          const uWobble = uBand + 0.032 * Math.sin(v * Math.PI * 6.5 - w(2) * t + iv * 0.15);
          const p = evalWingSurface(side, kind, uWobble, v, t);
          if (iv === 0) ctx.moveTo(p[0], p[1]);
          else ctx.lineTo(p[0], p[1]);
        }
        ctx.strokeStyle = rgba(colBand, alBand * (0.85 + 0.35 * fold));
        ctx.lineWidth = lwBand * S;
        ctx.stroke();
      }

      // LAYER 5: Anatomical Curved & Bifurcating Bioluminescent Veins
      for (let vk = 0; vk < VEIN_DEFS.length; vk++) {
        const vd = VEIN_DEFS[vk];
        const V_SEG = 12;
        const vPts = [];
        for (let j = 0; j <= V_SEG; j++) {
          const u = (j / V_SEG) * 0.96;
          const v = clamp(lerp(vd.v0, vd.v1, u) + vd.arch * Math.sin(u * Math.PI), 0.01, 0.99);
          vPts.push(evalWingSurface(side, kind, u, v, t));
        }

        for (let j = 0; j < V_SEG; j++) {
          const u = j / V_SEG;
          const fade = Math.pow(1 - u * 0.72, 1.2) * (0.72 + 0.28 * open);
          const vCol = u < 0.42
            ? mixRGB(C_ROSE, C_ORCHID, u / 0.42)
            : mixRGB(C_ORCHID, C_CYAN, (u - 0.42) / 0.58);

          ctx.beginPath();
          ctx.moveTo(vPts[j][0], vPts[j][1]);
          ctx.lineTo(vPts[j + 1][0], vPts[j + 1][1]);

          ctx.strokeStyle = rgba(vCol, 0.11 * fade);
          ctx.lineWidth = (4.5 - 2.8 * u) * S;
          ctx.stroke();

          ctx.strokeStyle = rgba(mixRGB(vCol, C_WHITE, 0.42), 0.28 * fade);
          ctx.lineWidth = (1.35 - 0.75 * u) * S;
          ctx.stroke();
        }

        for (const [uFork, vTarget] of vd.forks) {
          const vFork = clamp(lerp(vd.v0, vd.v1, uFork) + vd.arch * Math.sin(uFork * Math.PI), 0.01, 0.99);
          const p0 = evalWingSurface(side, kind, uFork, vFork, t);
          const pMid = evalWingSurface(side, kind, (uFork + 0.97) * 0.5, lerp(vFork, vTarget, 0.54) + 0.018, t);
          const p1 = evalWingSurface(side, kind, 0.97, vTarget, t);

          const bGrad = ctx.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
          bGrad.addColorStop(0.0, rgba(C_ROSE, 0.25));
          bGrad.addColorStop(0.55, rgba(C_BLUE, 0.16));
          bGrad.addColorStop(1.0, rgba(C_CYAN, 0.06));

          ctx.beginPath();
          ctx.moveTo(p0[0], p0[1]);
          ctx.quadraticCurveTo(pMid[0], pMid[1], p1[0], p1[1]);
          ctx.strokeStyle = bGrad;
          ctx.lineWidth = 0.9 * S;
          ctx.stroke();
        }
      }

      // LAYER 6: Clipped Luminous Ruffled Rim & Leading Costa Caustic Lip
      ctx.save();
      traceWingSilhouette();
      ctx.clip();

      for (const [lw, al] of [
        [36.0, 0.034],
        [17.0, 0.072],
        [7.5,  0.145],
        [2.8,  0.265]
      ]) {
        ctx.lineWidth = lw * S;
        for (let iv = 0; iv < V_GRID; iv++) {
          const v = iv / V_GRID;
          const p0 = rim[iv], p1 = rim[iv + 1];
          const pleat = p0[2];
          const crestBoost = 0.52 + 0.48 * Math.max(-0.4, pleat);
          const cyanWeight = isFore
            ? sstep(0.03, 0.20, v) * (1 - 0.65 * sstep(0.78, 0.98, v))
            : sstep(0.02, 0.16, v) * (1 - 0.55 * sstep(0.76, 0.96, v));
          const rimCol = mixRGB(C_HOTPINK, C_CYAN, clamp(cyanWeight * (0.78 + 0.22 * crestBoost)));

          ctx.strokeStyle = rgba(rimCol, al * crestBoost * (0.85 + 0.4 * fold));
          ctx.beginPath();
          ctx.moveTo(p0[0], p0[1]);
          ctx.lineTo(p1[0], p1[1]);
          ctx.stroke();
        }
      }
      ctx.restore();

      if (isFore) {
        ctx.beginPath();
        for (let iu = 0; iu <= U_GRID; iu++) {
          const p = grid[iu][0];
          if (iu === 0) ctx.moveTo(p[0], p[1]);
          else ctx.lineTo(p[0], p[1]);
        }
        const tipPt = grid[U_GRID][0];
        const costaGrad = ctx.createLinearGradient(rx0, ry0, tipPt[0], tipPt[1]);
        costaGrad.addColorStop(0.00, rgba(C_HOTPINK, 0.42));
        costaGrad.addColorStop(0.38, rgba(C_ROSE,    0.32));
        costaGrad.addColorStop(0.75, rgba(C_CYAN,    0.38));
        costaGrad.addColorStop(1.00, rgba(C_ICECYAN, 0.48));
        ctx.strokeStyle = costaGrad;
        ctx.lineWidth = 2.6 * S;
        ctx.stroke();
      }

      for (let iv = 0; iv < V_GRID; iv++) {
        const v = iv / V_GRID;
        const p0 = rim[iv], p1 = rim[iv + 1];
        const crest = Math.pow(clamp(0.55 + 0.45 * p0[2], 0, 1), 1.5);
        if (crest < 0.12) continue;
        const cyanWeight = isFore
          ? sstep(0.04, 0.20, v) * (1 - 0.65 * sstep(0.80, 0.98, v))
          : sstep(0.03, 0.18, v) * (1 - 0.55 * sstep(0.78, 0.96, v));
        const c = mixRGB(C_ROSE, C_ICECYAN, cyanWeight);
        ctx.strokeStyle = rgba(c, 0.42 * crest * (0.85 + 0.3 * fold));
        ctx.lineWidth = (0.65 + 1.25 * crest) * S;
        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
        ctx.stroke();
      }
    }

    function spawnParticle(p, prewarm = false) {
      const { S, cx, cy, clapIntensity, reboundWake } = view;
      const r = rnd();

      let worldX = cx, worldY = cy, vx = 0, vy = 0;

      if (reboundWake > 0.25 && r < 0.35) {
        const ws = wingMeshes[rnd() > 0.35 ? 3 : 1];
        const pt = ws.rim[(rnd() * ws.rim.length) | 0] || [cx, cy];
        worldX = pt[0] + rr(-12, 18) * S;
        worldY = pt[1] + rr(-12, 18) * S;
        vx = rr(22, 78);
        vy = rr(-14, 42);
      } else if (r < 0.64) {
        const wm = wingMeshes[(rnd() * 4) | 0];
        const rim = wm.rim;
        if (rim.length > 0) {
          const idx = Math.min(rim.length - 1, Math.floor(Math.pow(rnd(), 0.84) * rim.length));
          const pt = rim[idx];
          const dx = pt[0] - cx, dy = pt[1] - cy;
          const dist = Math.hypot(dx, dy) || 1;
          const jit = rr(-6, 15) * S;
          worldX = pt[0] + (dx / dist) * jit + rr(-4, 4) * S;
          worldY = pt[1] + (dy / dist) * jit + rr(-4, 4) * S;
          const spd = rr(4, 22) * (1 + 1.2 * clapIntensity);
          vx = (dx / dist) * spd + rr(-6, 8);
          vy = (dy / dist) * spd - rr(1, 8);
        }
      } else if (r < 0.80) {
        const wm = wingMeshes[rnd() > 0.5 ? 3 : 2];
        const vRim = wm.veilRim;
        const pt = vRim.length ? vRim[(rnd() * vRim.length) | 0] : [cx, cy - 110 * S];
        worldX = pt[0] + rr(-10, 10) * S;
        worldY = pt[1] + rr(-10, 10) * S;
        vx = wm.side * rr(4, 20);
        vy = rr(-16, 4);
      } else if (r < 0.93) {
        const td = tendrils[(rnd() * tendrils.length) | 0];
        const pt = td.pts.length ? td.pts[(rnd() * td.pts.length) | 0] : [cx, cy + 100 * S];
        worldX = pt[0] + rr(-7, 7) * S;
        worldY = pt[1] + rr(-7, 7) * S;
        vx = rr(-8, 15);
        vy = rr(2, 16);
      } else {
        const side = rnd() > 0.48 ? 1 : -1;
        const spread = rr(10, 95) * S;
        worldX = cx + side * spread;
        worldY = cy + rr(-14, 14) * S;
        vx = side * rr(24, 85) * (0.45 + 1.35 * clapIntensity);
        vy = rr(-11, 11);
      }

      const invS = 1 / Math.max(0.0001, S);
      p.lx = (worldX - cx) * invS;
      p.ly = (worldY - cy) * invS;
      p.vx = vx;
      p.vy = vy;

      p.life = rr(1.2, 3.5);
      p.age = prewarm ? rnd() * p.life : 0;
      p.size = Math.pow(rnd(), 2.2) * 1.75 + 0.38;
      p.twinklePhase = rr(0, TAU);
      p.twinkleSpeed = 2 + ((rnd() * 6) | 0);

      const cr = rnd();
      if (cr < 0.36) p.col = C_CYAN;
      else if (cr < 0.68) p.col = C_HOTPINK;
      else if (cr < 0.84) p.col = C_ROSE;
      else if (cr < 0.93) p.col = C_GOLD;
      else p.col = C_WHITE;
    }

    function stepAndDrawParticles(pList, dt, t) {
      const { S, cx, cy } = view;
      const drag = Math.pow(0.56, dt);
      const maxLocalRadius = 325;

      for (let i = 0; i < pList.length; i++) {
        const p = pList[i];
        p.age += dt;
        const distLocal = Math.hypot(p.lx, p.ly);
        if (p.age >= p.life || distLocal > maxLocalRadius) {
          spawnParticle(p, false);
          continue;
        }

        const nx = p.lx / 110 + 0.35 * Math.sin(w(1) * t);
        const ny = p.ly / 110 - 0.35 * Math.cos(w(1) * t);
        const curlVx = (Math.sin(ny * 2.4 + t * 0.95) + 0.5 * Math.cos(nx * 3.8 - t * 1.25)) * 14.5;
        const curlVy = (Math.cos(nx * 2.4 - t * 0.85) - 0.5 * Math.sin(ny * 3.8 + t * 1.15)) * 14.5;

        p.vx *= drag;
        p.vy *= drag;
        p.lx += (p.vx + curlVx) * dt;
        p.ly += (p.vy + curlVy) * dt;

        const u = p.age / p.life;
        const distFade = 1 - sstep(175, 320, distLocal);
        const lifeEnv = Math.sin(u * Math.PI);
        const twinkle = 0.32 + 0.68 * Math.pow(0.5 + 0.5 * Math.sin(w(p.twinkleSpeed) * t + p.twinklePhase), 1.9);
        const alpha = lifeEnv * twinkle * distFade;
        if (alpha <= 0.01) continue;

        const sx = cx + p.lx * S;
        const sy = cy + p.ly * S;
        const r = p.size * S;

        if (p.size > 1.3) {
          ctx.fillStyle = rgba(p.col, alpha * 0.25);
          ctx.beginPath();
          ctx.arc(sx, sy, r * 2.1, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = rgba(p.col, alpha * 0.94);
        ctx.beginPath();
        ctx.arc(sx, sy, r * 0.65, 0, TAU);
        ctx.fill();
      }
    }

    function drawLowerTendrils(t) {
      const { S, cx, cy, open, reboundWake } = view;
      const STEPS = 30;

      for (let i = 0; i < tendrils.length; i++) {
        const td = tendrils[i];
        td.pts.length = 0;

        const rootX = cx + td.x0 * (0.42 + 0.58 * open) * S;
        const rootY = cy + td.y0 * S;

        for (let j = 0; j <= STEPS; j++) {
          const u = j / STEPS;
          const u2 = u * u;
          const wave1 = Math.sin(u * td.freq * TAU - w(td.speed) * t + td.phase) * (5 + 25 * u);
          const wave2 = Math.cos(u * 1.9 * TAU + w(1) * t - td.phase) * (9 * u2);
          const hookCurlX = Math.pow(clamp((u - 0.68) / 0.32, 0, 1), 2.0) * td.hookDir * 22;
          const hookCurlY = -Math.pow(clamp((u - 0.78) / 0.22, 0, 1), 2.2) * 14;
          const wakeShiftX = reboundWake * 18 * u2;

          const sFan = td.spreadX * Math.pow(u, 1.32) * (0.52 + 0.48 * open) + td.curlAmp * Math.sin(u * Math.PI * 1.4);
          const px = rootX + (sFan + wave1 + wave2 + hookCurlX + wakeShiftX) * S;
          const py = rootY + (u * td.len + Math.sin(u * Math.PI) * 11 + hookCurlY) * S;
          td.pts.push([px, py, u]);
        }

        for (let j = 0; j < STEPS; j++) {
          const p0 = td.pts[j], p1 = td.pts[j + 1];
          const u = p0[2];
          const alpha = 0.40 * Math.pow(1 - u, 1.12) * (0.72 + 0.28 * Math.sin(u * 9 - w(2) * t + td.phase));
          const col = u < 0.32
            ? mixRGB(C_HOTPINK, C_VIOLET, u / 0.32)
            : mixRGB(C_VIOLET, td.colorMix > 0.42 ? C_CYAN : C_ROSE, (u - 0.32) / 0.68);

          ctx.strokeStyle = rgba(col, alpha);
          ctx.lineWidth = (1.35 * (1 - 0.68 * u)) * S;
          ctx.beginPath();
          ctx.moveTo(p0[0], p0[1]);
          ctx.lineTo(p1[0], p1[1]);
          ctx.stroke();
        }

        for (let nk = 0; nk < td.nodes.length; nk++) {
          const uNode = td.nodes[nk];
          const idx = Math.min(STEPS, Math.round(uNode * STEPS));
          const pt = td.pts[idx];
          const pulse = 0.32 + 0.68 * Math.pow(0.5 + 0.5 * Math.sin(w(3) * t + nk * 1.7 + td.phase), 2.2);
          const nodeAlpha = (1 - uNode * 0.70) * pulse;
          const rNode = (1.25 + (1 - uNode) * 0.85) * S;
          const nCol = nk % 3 === 0 ? C_CYAN : nk % 3 === 1 ? C_ROSE : C_GOLD;

          ctx.fillStyle = rgba(nCol, nodeAlpha * 0.36);
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], rNode * 2.2, 0, TAU);
          ctx.fill();

          ctx.fillStyle = rgba(C_WHITE, nodeAlpha * 0.92);
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], rNode * 0.62, 0, TAU);
          ctx.fill();
        }
      }
    }

    function drawWaistFilaments(t) {
      const { S, cx, cy, clapIntensity } = view;
      const baseVis = 0.022 + 0.32 * clapIntensity;
      const reachScale = 0.42 + 0.68 * clapIntensity;

      for (let i = 0; i < waistFilaments.length; i++) {
        const f = waistFilaments[i];
        const len = f.len * reachScale * S;
        const ang = f.angle * (1 - 0.42 * clapIntensity);
        const ex = cx + f.side * Math.cos(ang) * len;
        const ey = cy + Math.sin(ang) * len * 0.50;
        const ctrlX = cx + (ex - cx) * 0.5;
        const ctrlY = cy + (ey - cy) * 0.5 + Math.sin(w(2) * t + f.phase) * f.curve * S * 0.45;

        const grad = ctx.createLinearGradient(cx, cy, ex, ey);
        const cMid = f.hue > 0.28 ? C_HOTPINK : C_ORCHID;
        grad.addColorStop(0.00, rgba(C_ROSE, baseVis * 1.25));
        grad.addColorStop(0.42, rgba(cMid, baseVis * 0.90));
        grad.addColorStop(1.00, rgba(C_VIOLET, 0));

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(ctrlX, ctrlY, ex, ey);
        ctx.strokeStyle = grad;
        ctx.lineWidth = f.width * S;
        ctx.stroke();
      }
    }

    function drawThoraxCoreAndAntennae(t) {
      const { S, cx, cy, open, clapIntensity } = view;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2 * S, 2.5 * S, 21 * S, 0, 0, TAU);
      ctx.fillStyle = rgba(C_HOTPINK, 0.25);
      ctx.fill();
      ctx.restore();

      for (const side of [-1, 1]) {
        const sway = Math.sin(w(2) * t + side * 0.8) * 2.2;
        const ax0 = cx + side * 2.0 * S;
        const ay0 = cy - 9 * S;
        const axCtrl = cx + side * (7 + 6 * open) * S;
        const ayCtrl = cy - 46 * S;
        const axTip = cx + side * (15 + 14 * open + sway) * S;
        const ayTip = cy - (72 - 4 * open) * S;

        const antGrad = ctx.createLinearGradient(ax0, ay0, axTip, ayTip);
        antGrad.addColorStop(0.0, rgba(C_ROSE, 0.70));
        antGrad.addColorStop(0.6, rgba(C_ORCHID, 0.46));
        antGrad.addColorStop(1.0, rgba(C_CYAN, 0.62));

        ctx.beginPath();
        ctx.moveTo(ax0, ay0);
        ctx.quadraticCurveTo(axCtrl, ayCtrl, axTip, ayTip);
        ctx.strokeStyle = antGrad;
        ctx.lineWidth = 1.0 * S;
        ctx.stroke();

        ctx.fillStyle = rgba(C_ICECYAN, 0.78);
        ctx.beginPath();
        ctx.arc(axTip, ayTip, 1.2 * S, 0, TAU);
        ctx.fill();
      }

      const pulse = 1 + 0.08 * Math.sin(w(4) * t) + 0.15 * clapIntensity;

      const auraR = 23 * S * pulse;
      const auraGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, auraR);
      auraGrad.addColorStop(0.00, rgba(C_WHITE, 0.96));
      auraGrad.addColorStop(0.14, rgba(C_ROSE, 0.80));
      auraGrad.addColorStop(0.42, rgba(C_HOTPINK, 0.28));
      auraGrad.addColorStop(1.00, rgba(C_VIOLET, 0));
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, auraR, 0, TAU);
      ctx.fill();

      const glintLen = (12 + 7 * clapIntensity) * S * pulse;
      ctx.strokeStyle = rgba(C_WHITE, 0.50);
      ctx.lineWidth = 0.8 * S;
      ctx.beginPath();
      ctx.moveTo(cx - glintLen, cy);
      ctx.lineTo(cx + glintLen, cy);
      ctx.moveTo(cx, cy - glintLen * 0.85);
      ctx.lineTo(cx, cy + glintLen * 0.85);
      ctx.stroke();

      ctx.fillStyle = '#F5F2EB';
      ctx.beginPath();
      ctx.arc(cx, cy, 2.2 * S, 0, TAU);
      ctx.fill();
    }

    function renderSingleButterfly(bf, tGlobal, dt, anchorX, anchorY, S) {
      const t = configRef.current.syncMotion ? tGlobal : (tGlobal + bf.phaseOffset) % LOOP_T;
      updatePoseForInstance(t, anchorX, anchorY, S);
      const { cx, cy, clapIntensity } = view;

      ctx.globalCompositeOperation = 'lighter';

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1.35 + 0.70 * clapIntensity, 0.70);
      const mistR = 160 * S;
      const mistGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, mistR);
      mistGrad.addColorStop(0.00, rgba(C_HOTPINK, 0.11 + 0.09 * clapIntensity));
      mistGrad.addColorStop(0.46, rgba(C_VIOLET, 0.042));
      mistGrad.addColorStop(1.00, rgba(C_INDIGO, 0));
      ctx.fillStyle = mistGrad;
      ctx.beginPath();
      ctx.arc(0, 0, mistR, 0, TAU);
      ctx.fill();
      ctx.restore();

      drawWaistFilaments(t);
      drawLowerTendrils(t);

      for (const wm of wingMeshes) {
        drawVolumetricWing(wm, t);
      }

      stepAndDrawParticles(bf.particles, dt, t);
      drawThoraxCoreAndAntennae(t);
    }

    function renderFrame(t, dt) {
      const W = cv.width, H = cv.height;
      const baseS = Math.min(W / 760, H / 640);
      const isCenterOnly = configRef.current.mode === 'center';
      const S = baseS * (isCenterOnly ? Math.max(0.65, configRef.current.scaleFactor * 1.8) : configRef.current.scaleFactor);

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const count = isCenterOnly ? 1 : butterflies.length;
      for (let i = 0; i < count; i++) {
        const anchor = getButterflyAnchor(i, W, H);
        renderSingleButterfly(butterflies[i], t, dt, anchor.x, anchor.y, S);
      }

      // Safe RGBA Clear + Source-Over Downsample
      let srcCanvas = cv;
      for (let i = 0; i < bloomPasses.length; i++) {
        const bp = bloomPasses[i];
        bp.ctx.imageSmoothingEnabled = true;
        bp.ctx.globalCompositeOperation = 'source-over';
        bp.ctx.clearRect(0, 0, bp.cv.width, bp.cv.height);
        bp.ctx.drawImage(srcCanvas, 0, 0, bp.cv.width, bp.cv.height);
        srcCanvas = bp.cv;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.globalCompositeOperation = 'lighter';
      const bloomWeights = [0.32, 0.45, 0.52];
      for (let i = 0; i < bloomPasses.length; i++) {
        ctx.globalAlpha = bloomWeights[i];
        ctx.drawImage(bloomPasses[i].cv, 0, 0, W, H);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // Pre-warm all 4 butterfly particle clouds
    const W0 = cv.width, H0 = cv.height;
    const S0 = Math.min(W0 / 760, H0 / 640) * configRef.current.scaleFactor;
    for (let b = 0; b < butterflies.length; b++) {
      const bf = butterflies[b];
      const anchor = getButterflyAnchor(b, W0, H0);
      updatePoseForInstance(0, anchor.x, anchor.y, S0);
      bf.particles.length = 0;
      for (let i = 0; i < PARTICLES_PER_BUTTERFLY; i++) {
        const p = {};
        spawnParticle(p, true);
        bf.particles.push(p);
      }
      for (let k = 0; k < 25; k++) {
        const tWarm = (k * 0.08) % LOOP_T;
        updatePoseForInstance(tWarm, anchor.x, anchor.y, S0);
        stepAndDrawParticles(bf.particles, 0.06, tWarm);
      }
    }

    let clock = 0;
    let lastTime = performance.now();
    let rafId = null;

    function animate(now) {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      const isPaused = configRef.current.paused;
      if (!isPaused) {
        clock = (clock + dt) % LOOP_T;
      }
      renderFrame(clock, isPaused ? 0 : dt);
      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      aria-label="4 Volumetric bioluminescent ember-orange and warm-white butterflies framing the login card"
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. ROLE DEFINITIONS FOR THE 4 FLOATING BOXES
   ═══════════════════════════════════════════════════════════════════════════ */
const ROLE_BOXES = [
  {
    id: 'student',
    label: 'Student',
    sub: 'Roll No & Password',
    icon: GraduationCap,
    delay: '0s'
  },
  {
    id: 'admin',
    label: 'Placement Cell',
    sub: 'Name & Special Key',
    icon: ShieldCheck,
    delay: '0.4s'
  },
  {
    id: 'recruiter',
    label: 'Recruiter',
    sub: 'Company & Password',
    icon: Building2,
    delay: '0.8s'
  },
  {
    id: 'demo',
    label: 'Demo',
    sub: 'Instant Student View',
    icon: Sparkles,
    delay: '1.2s'
  }
];

/* ═══════════════════════════════════════════════════════════════════════════
   3. CLEAN BLACK & WHITE + DARK ORANGE NEON GLASS LOGIN COMPONENT
      + Interactive Butterfly Control Bar (Mode, Size, Edge Offset, Sync, Hide)
   ═══════════════════════════════════════════════════════════════════════════ */
export function LoginPage({ onEnterPortal, onBackToLanding }) {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');

  // null = show the 4 slowly floating boxes first | 'student' | 'admin' | 'recruiter'
  const [selectedRole, setSelectedRole] = useState(() => {
    if (roleParam === 'student' || roleParam === 'admin' || roleParam === 'recruiter') {
      return roleParam;
    }
    return null;
  });

  useEffect(() => {
    if (roleParam === 'student' || roleParam === 'admin' || roleParam === 'recruiter') {
      setSelectedRole(roleParam);
    }
  }, [roleParam]);

  // Interactive Butterfly Controls State
  const [bfMode, setBfMode] = useState('sides');       // 'sides' | 'corners' | 'center'
  const [bfScale, setBfScale] = useState(0.35);        // 0.20 .. 0.60
  const [bfEdgePull, setBfEdgePull] = useState(0.79);  // 0.65 .. 0.90
  const [bfSync, setBfSync] = useState(true);
  const [showControls, setShowControls] = useState(true);

  // Student Form State
  const [studentRoll, setStudentRoll] = useState(DEMO_CREDENTIALS.student.rollNo);
  const [studentPass, setStudentPass] = useState(DEMO_CREDENTIALS.student.password);

  // Placement Cell (Admin) Form State
  const [adminName, setAdminName] = useState(DEMO_CREDENTIALS.admin.name);
  const [adminKey, setAdminKey] = useState(DEMO_CREDENTIALS.admin.specialKey);

  // Recruiter Form State (Dropdown + Manual Entry Toggle)
  const [companyMode, setCompanyMode] = useState('dropdown'); // 'dropdown' | 'manual'
  const [selectedCompany, setSelectedCompany] = useState(DEMO_CREDENTIALS.recruiter.company);
  const [manualCompany, setManualCompany] = useState('');
  const [recruiterPass, setRecruiterPass] = useState(DEMO_CREDENTIALS.recruiter.password);

  const [showPassword, setShowPassword] = useState(false);

  // Keyboard shortcut 'H' to hide/show the bottom butterfly control bar
  useEffect(() => {
    const onKeyDown = e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === 'h' || e.key === 'H') {
        setShowControls(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Fill demo credentials helper
  const handleFillDemo = () => {
    if (selectedRole === 'student') {
      setStudentRoll(DEMO_CREDENTIALS.student.rollNo);
      setStudentPass(DEMO_CREDENTIALS.student.password);
    } else if (selectedRole === 'admin') {
      setAdminName(DEMO_CREDENTIALS.admin.name);
      setAdminKey(DEMO_CREDENTIALS.admin.specialKey);
    } else if (selectedRole === 'recruiter') {
      setCompanyMode('dropdown');
      setSelectedCompany(DEMO_CREDENTIALS.recruiter.company);
      setRecruiterPass(DEMO_CREDENTIALS.recruiter.password);
    }
  };

  const navigate = useNavigate();

  const getPortalRoute = (role) => {
    switch (role) {
      case 'student':
      case 'demo':
        return '/student/overview';
      case 'admin':
        return '/admin/command-center';
      case 'recruiter':
        return '/recruiter/overview';
      default:
        return '/student/overview';
    }
  };

  // Clicking one of the 4 boxes
  const handleBoxClick = roleId => {
    if (roleId === 'demo') {
      try {
        sessionStorage.setItem('campuslink_auth', '1');
        sessionStorage.setItem('campuslink_role', 'student');
        sessionStorage.setItem('campuslink_user_name', 'Zahid');
      } catch (err) {
        /* ignore */
      }
      if (typeof onEnterPortal === 'function') {
        onEnterPortal('student');
      }
      navigate('/student/overview');
      return;
    }
    setSelectedRole(roleId);
    setShowPassword(false);
  };

  // Clicking Login inside the card — directly enters the page
  const handleFormSubmit = e => {
    e.preventDefault();
    const effectiveRole = selectedRole || 'student';
    try {
      sessionStorage.setItem('campuslink_auth', '1');
      sessionStorage.setItem('campuslink_role', effectiveRole);
      if (effectiveRole === 'student') {
        sessionStorage.setItem('campuslink_user_name', 'Zahid');
      } else if (effectiveRole === 'admin') {
        sessionStorage.setItem('campuslink_user_name', adminName || 'Dr. Ananya Verma');
      } else if (effectiveRole === 'recruiter') {
        const comp = companyMode === 'dropdown' ? selectedCompany : manualCompany;
        sessionStorage.setItem('campuslink_user_name', comp ? `${comp} Recruiter` : 'Rohit Khemka');
      }
    } catch (err) {
      /* ignore */
    }
    if (typeof onEnterPortal === 'function') {
      onEnterPortal(effectiveRole);
    }
    navigate(getPortalRoute(effectiveRole));
  };

  const handleBackToLanding = () => {
    if (typeof onBackToLanding === 'function') {
      onBackToLanding();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-transparent text-[#F5F2EB] flex items-center justify-center p-4 overflow-hidden select-none font-sans">
      {/* Slow Floating Animation Keyframes */}
      <style>{`
        @keyframes slowFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-slow-float {
          animation: slowFloat 4.8s ease-in-out infinite;
        }
      `}</style>

      {/* Atmospheric Star Showering & Architectural Grid */}
      <Backdrop forceDark={true} className="z-0" />

      {/* 4-Sided Plasma Butterflies Background */}
      <PlasmaButterfliesBg
        mode={bfMode}
        scaleFactor={bfScale}
        edgePull={bfEdgePull}
        syncMotion={bfSync}
      />

      {/* Top-Left Back to Landing Button */}
      <button
        type="button"
        onClick={handleBackToLanding}
        className="fixed top-5 left-5 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 hover:border-accent/40 text-xs text-zinc-400 hover:text-white transition cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to CampusLink</span>
      </button>

      {/* Center Content Area */}
      <main className="relative z-10 w-full max-w-[440px] px-4 sm:px-0 flex flex-col items-center justify-center my-auto">
        {selectedRole === null ? (
          /* ─── STEP 1: 4 SLOWLY FLOATING GLASS BOXES ─── */
          <div className="w-full animate-slow-float">
            <div className="text-center mb-5 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                Sign In
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Select your portal to continue
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
              {ROLE_BOXES.map(box => {
                const Icon = box.icon;
                return (
                  <button
                    key={box.id}
                    type="button"
                    onClick={() => handleBoxClick(box.id)}
                    style={{ animationDelay: box.delay }}
                    className="animate-slow-float group relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-black/45 backdrop-blur-xl border border-accent/40 hover:border-accent shadow-[0_0_24px_rgba(234,88,12,0.18)] hover:shadow-[0_0_32px_rgba(234,88,12,0.38)] transition-all duration-300 cursor-pointer text-center"
                  >
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-2.5 sm:mb-3 group-hover:scale-105 group-hover:bg-accent/15 group-hover:border-accent/30 transition-all">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-accent transition-colors" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-white tracking-tight">
                      {box.label}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 sm:mt-1">
                      {box.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ─── STEP 2: CLEAN BLACK & WHITE + ACCENT BORDER GLASS CARD ─── */
          <div className="w-full animate-slow-float rounded-2xl sm:rounded-3xl bg-black/50 backdrop-blur-2xl border border-accent/45 shadow-[0_0_35px_rgba(234,88,12,0.22)] p-5 sm:p-8">
            {/* Top Row: Back to 4 Boxes + Role Switcher Pills */}
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-1">
                {ROLE_BOXES.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleBoxClick(b.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                      selectedRole === b.id
                        ? 'bg-white text-black'
                        : 'text-zinc-400 hover:text-white bg-white/[0.04]'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clean Title + Subtle Fill Demo Link */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  {selectedRole === 'student' && 'Student Login'}
                  {selectedRole === 'admin' && 'Placement Cell Login'}
                  {selectedRole === 'recruiter' && 'Recruiter Login'}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  {selectedRole === 'student' && 'Enter your university roll number and password'}
                  {selectedRole === 'admin' && 'Enter your name and placement cell special key'}
                  {selectedRole === 'recruiter' && 'Select or enter your company name and password'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[11px] text-zinc-400 hover:text-accent underline underline-offset-4 transition cursor-pointer shrink-0 ml-2"
              >
                Fill demo
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* STUDENT INPUTS */}
              {selectedRole === 'student' && (
                <>
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1.5">
                      Roll No
                    </label>
                    <input
                      type="text"
                      required
                      value={studentRoll}
                      onChange={e => setStudentRoll(e.target.value)}
                      placeholder="e.g. 21CS3042"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-accent text-sm text-white placeholder-zinc-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={studentPass}
                        onChange={e => setStudentPass(e.target.value)}
                        placeholder="Enter password"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-black/50 border border-white/15 focus:border-accent text-sm text-white placeholder-zinc-500 outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* PLACEMENT CELL (ADMIN) INPUTS */}
              {selectedRole === 'admin' && (
                <>
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1.5">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={e => setAdminName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-accent text-sm text-white placeholder-zinc-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-300 mb-1.5">
                      Special Key
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={adminKey}
                        onChange={e => setAdminKey(e.target.value)}
                        placeholder="Enter special key"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-black/50 border border-white/15 focus:border-accent text-sm text-white placeholder-zinc-500 outline-none transition font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* RECRUITER INPUTS (Dropdown + Manual Entry) */}
              {selectedRole === 'recruiter' && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-zinc-300">
                        Company Name
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setCompanyMode(companyMode === 'dropdown' ? 'manual' : 'dropdown')
                        }
                        className="text-[11px] text-zinc-400 hover:text-accent underline underline-offset-2 transition cursor-pointer"
                      >
                        {companyMode === 'dropdown' ? 'Enter manually' : 'Choose from list'}
                      </button>
                    </div>

                    {companyMode === 'dropdown' ? (
                      <div className="relative">
                        <select
                          value={selectedCompany}
                          onChange={e => {
                            if (e.target.value === '__MANUAL__') {
                              setCompanyMode('manual');
                            } else {
                              setSelectedCompany(e.target.value);
                            }
                          }}
                          className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl bg-black/60 border border-white/15 focus:border-accent text-sm text-white outline-none transition cursor-pointer"
                        >
                          {PARTNER_COMPANIES.map(comp => (
                            <option key={comp} value={comp} className="bg-zinc-950 text-white">
                              {comp}
                            </option>
                          ))}
                          <option value="__MANUAL__" className="bg-zinc-950 text-zinc-300">
                            + Enter Company Manually...
                          </option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        required
                        value={manualCompany}
                        onChange={e => setManualCompany(e.target.value)}
                        placeholder="Type company name..."
                        autoFocus
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-accent text-sm text-white placeholder-zinc-500 outline-none transition"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={recruiterPass}
                        onChange={e => setRecruiterPass(e.target.value)}
                        placeholder="Enter password"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-black/50 border border-white/15 focus:border-accent text-sm text-white placeholder-zinc-500 outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Clean Black & White Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 py-2.5 px-5 rounded-xl bg-white hover:bg-zinc-200 text-black font-medium text-sm transition cursor-pointer"
              >
                Login
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ─── INTERACTIVE BUTTERFLY CONTROL BAR (BOTTOM FLOATING PILL) ─── */}
      {showControls ? (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 hidden sm:flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-3.5 py-2 rounded-2xl bg-zinc-950/85 border border-white/15 backdrop-blur-md text-xs text-zinc-200 shadow-2xl max-w-[95vw]">
          {/* Layout Mode Toggle: 4 Sides vs 4 Corners vs 1 Center */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setBfMode('sides')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                bfMode === 'sides'
                  ? 'bg-white text-black font-medium'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              4 Sides
            </button>
            <button
              type="button"
              onClick={() => setBfMode('corners')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                bfMode === 'corners'
                  ? 'bg-white text-black font-medium'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              4 Corners
            </button>
            <button
              type="button"
              onClick={() => setBfMode('center')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                bfMode === 'center'
                  ? 'bg-white text-black font-medium'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              1 Center
            </button>
          </div>

          {/* Size Slider */}
          <label className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/5">
            <span className="text-zinc-400">Size</span>
            <input
              type="range"
              min="0.20"
              max="0.60"
              step="0.01"
              value={bfScale}
              onChange={e => setBfScale(parseFloat(e.target.value))}
              className="w-20 accent-accent cursor-pointer"
            />
            <span className="text-white font-mono w-8 text-right">
              {Math.round(bfScale * 100)}%
            </span>
          </label>

          {/* Edge Offset Slider */}
          {bfMode !== 'center' && (
            <label className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/5">
              <span className="text-zinc-400">Edge Offset</span>
              <input
                type="range"
                min="0.65"
                max="0.90"
                step="0.01"
                value={bfEdgePull}
                onChange={e => setBfEdgePull(parseFloat(e.target.value))}
                className="w-20 accent-accent cursor-pointer"
              />
            </label>
          )}

          {/* Sync / Motion Phase Toggle */}
          {bfMode !== 'center' && (
            <button
              type="button"
              onClick={() => setBfSync(!bfSync)}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 transition cursor-pointer"
            >
              {bfSync ? 'Motion: Exact Sync' : 'Motion: Wave Offset'}
            </button>
          )}

          {/* Hide UI Button */}
          <button
            type="button"
            onClick={() => setShowControls(false)}
            className="px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
            title="Shortcut: Press H"
          >
            Hide UI (H)
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowControls(true)}
          className="fixed bottom-3 right-3 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-[11px] text-zinc-300 hover:text-white border border-white/15 backdrop-blur transition cursor-pointer"
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>Controls (H)</span>
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. PREVIEW WRAPPER (Simulates Landing "Get Started" -> Login -> App Page)
   ═══════════════════════════════════════════════════════════════════════════ */
export default function CampusLinkLoginApp() {
  const [stage, setStage] = useState('login'); // 'landing' | 'login' | 'app'
  const [activeRole, setActiveRole] = useState('student');

  if (stage === 'landing') {
    return (
      <div className="min-h-screen w-full bg-[#09090B] text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-semibold tracking-tight mb-3">CampusLink</h1>
        <p className="text-sm text-zinc-400 mb-6">Click Get Started to open the Login page</p>
        <button
          onClick={() => setStage('login')}
          className="px-6 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition cursor-pointer"
        >
          Get Started
        </button>
      </div>
    );
  }

  if (stage === 'login') {
    return (
      <LoginPage
        onBackToLanding={() => setStage('landing')}
        onEnterPortal={role => {
          setActiveRole(role);
          setStage('app');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white flex flex-col items-center justify-center p-6">
      <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/60 text-center max-w-sm w-full">
        <p className="text-xs uppercase tracking-widest text-zinc-400">AppShell Active</p>
        <h2 className="text-xl font-semibold mt-1 capitalize">{activeRole} Page Opened</h2>
        <button
          onClick={() => setStage('login')}
          className="mt-5 px-4 py-2 rounded-xl bg-white text-black text-xs font-medium hover:bg-zinc-200 transition cursor-pointer"
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
}