// src/three/PipelineCanvas.jsx
import React, { useEffect, useRef } from 'react';
import { useTheme } from '../theme/ThemeProvider.jsx';
import { tokens } from '../theme/tokens.js';

const DEFAULT_STEPS = [
  'Profiling',
  'Matching',
  'Scheduling',
  'Notification',
  'Offer tracking',
  'Analytics',
];

const STAGE_META = [
  { code: 'SYS·01', metric: 'ATS + CGPA VECTOR', sub: '6-AXIS READINESS' },
  { code: 'SYS·02', metric: 'COSINE SIMILARITY', sub: 'BIPARTITE MATCH' },
  { code: 'SYS·03', metric: '0 VENUE CLASHES', sub: 'SAT SLOT SOLVER' },
  { code: 'SYS·04', metric: '< 40ms DISPATCH', sub: 'MULTI-CHANNEL ACK' },
  { code: 'SYS·05', metric: 'SHA-256 LEDGER', sub: 'OFFER AUDIT TRAIL' },
  { code: 'SYS·06', metric: 'LIVE COHORT KPI', sub: 'NAAC / NIRF EXPORT' },
];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

// Catmull-Rom 3D spline evaluation for silky-smooth conduit curves
function evalSpline3D(pts, t) {
  const n = pts.length - 1;
  const scaled = clamp(t, 0, 1) * n;
  const i = Math.min(n - 1, Math.floor(scaled));
  const f = scaled - i;

  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[Math.min(n, i + 1)];
  const p3 = pts[Math.min(n, i + 2)];

  const f2 = f * f;
  const f3 = f2 * f;

  const interp = (k) =>
    0.5 *
    (2 * p1[k] +
      (-p0[k] + p2[k]) * f +
      (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * f2 +
      (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * f3);

  return { x: interp('x'), y: interp('y'), z: interp('z') };
}

export default function PipelineCanvas({
  visible = true,
  progress,
  steps = DEFAULT_STEPS,
}) {
  const { theme } = useTheme();
  const canvasRef = useRef(null);
  const progressRef = useRef(0);

  // Sync if progress is passed as a plain number or Framer Motion MotionValue
  useEffect(() => {
    if (typeof progress === 'number') {
      progressRef.current = progress;
      return undefined;
    }
    if (progress && typeof progress.get === 'function') {
      progressRef.current = progress.get();
      if (typeof progress.on === 'function') {
        return progress.on('change', (v) => {
          progressRef.current = v;
        });
      }
    }
    return undefined;
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return undefined;
    const ctx = canvas.getContext('2d');

    const night = theme === 'night';
    const T = tokens[theme] || tokens.night;
    const ink = night ? [255, 255, 255] : hexToRgb(T.fg);
    const accent = night ? [245, 158, 11] : hexToRgb(T.accentDeep || T.accent);
    const accentBright = hexToRgb(T.accent);
    const jade = hexToRgb(T.jade);

    let W = 0;
    let H = 0;
    let dpr = 1;
    let raf = 0;
    let time = 0;
    let smoothProg = progressRef.current || 0;

    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };

    const measure = () => {
      const parent = canvas.parentElement;
      const rect = parent
        ? parent.getBoundingClientRect()
        : { width: window.innerWidth, height: window.innerHeight };
      W = Math.max(320, Math.round(rect.width));
      H = Math.max(320, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const onPointerMove = (e) => {
      ptr.tx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      ptr.ty = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // 11 braided optical carrier filaments around the central spine
    const NUM_FILAMENTS = 11;
    const filaments = Array.from({ length: NUM_FILAMENTS }, (_, i) => ({
      phase: (i / NUM_FILAMENTS) * Math.PI * 2,
      freq: 2.5 + (i % 3) * 0.85,
      radius: 6 + (i % 4) * 4.5,
      alpha: 0.10 + (i % 3) * 0.08,
    }));

    // 46 high-speed photonic data packets streaming along the thread
    const packets = Array.from({ length: 46 }, (_, i) => ({
      t: (i / 46 + Math.random() * 0.02) % 1,
      speed: 0.0014 + Math.random() * 0.0022,
      offsetPhase: Math.random() * Math.PI * 2,
      offsetR: (Math.random() - 0.5) * 10,
      size: Math.random() < 0.3 ? 2.2 : 1.3,
      isAccent: Math.random() < 0.45,
    }));

    // Read scroll progress from prop or fallback to parent section scroll position
    const readScrollProgress = () => {
      if (progress && typeof progress.get === 'function') {
        return clamp(progress.get(), 0, 1);
      }
      if (typeof progress === 'number') {
        return clamp(progress, 0, 1);
      }
      const sec = canvas.closest('section');
      if (sec) {
        const r = sec.getBoundingClientRect();
        const scrollable = Math.max(1, r.height - window.innerHeight);
        return clamp(-r.top / scrollable, 0, 1);
      }
      return 0;
    };

    // Draw stage-specific live micro-schematic inside the active node
    const drawStageMicroSchematic = (idx, px, py, radius, t, rgbStr) => {
      ctx.save();
      ctx.translate(px, py);
      ctx.strokeStyle = `rgba(${rgbStr}, 0.75)`;
      ctx.fillStyle = `rgba(${rgbStr}, 0.85)`;
      ctx.lineWidth = 1;

      if (idx === 0) {
        // 01 PROFILING: 6-axis readiness radar polygon
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 - Math.PI / 2 + t * 0.25;
          const r =
            radius * (0.42 + 0.26 * Math.sin(t * 2.2 + k * 1.4));
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(${rgbStr}, 0.16)`;
        ctx.fill();
        ctx.stroke();
      } else if (idx === 1) {
        // 02 MATCHING: Bipartite vector nodes linking across the core
        for (let k = -1; k <= 1; k++) {
          const yOff = k * (radius * 0.34);
          const wave = Math.sin(t * 3 + k) * 4;
          ctx.beginPath();
          ctx.moveTo(-radius * 0.45, yOff);
          ctx.bezierCurveTo(
            -4,
            yOff + wave,
            4,
            -yOff - wave,
            radius * 0.45,
            -yOff
          );
          ctx.stroke();
        }
      } else if (idx === 2) {
        // 03 SCHEDULING: Rotating conflict-free time-slot arcs
        for (let k = 0; k < 4; k++) {
          const start = t * 0.9 + (k * Math.PI) / 2;
          ctx.beginPath();
          ctx.arc(0, 0, radius * 0.56, start, start + 0.9);
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else if (idx === 3) {
        // 04 NOTIFICATION: Concentric broadcast wave ripples
        for (let k = 0; k < 3; k++) {
          const p = ((t * 0.8 + k / 3) % 1);
          ctx.beginPath();
          ctx.arc(0, 0, radius * (0.2 + p * 0.65), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${rgbStr}, ${(1 - p) * 0.8})`;
          ctx.stroke();
        }
      } else if (idx === 4) {
        // 05 OFFER TRACKING: Counter-rotating cryptographic seal
        ctx.rotate(t * 0.6);
        ctx.strokeRect(
          -radius * 0.38,
          -radius * 0.38,
          radius * 0.76,
          radius * 0.76
        );
        ctx.rotate(-t * 1.2);
        ctx.strokeRect(
          -radius * 0.38,
          -radius * 0.38,
          radius * 0.76,
          radius * 0.76
        );
      } else {
        // 06 ANALYTICS: Live harmonic telemetry bars
        for (let k = -2; k <= 2; k++) {
          const bh =
            radius * (0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3.5 + k * 1.1)));
          ctx.fillRect(k * 5 - 1.5, bh * 0.5 - bh, 3, bh);
        }
      }
      ctx.restore();
    };

    const render = () => {
      time += 0.016;
      const targetProg = readScrollProgress();
      smoothProg += (targetProg - smoothProg) * 0.12;

      ptr.x += (ptr.tx - ptr.x) * 0.06;
      ptr.y += (ptr.ty - ptr.y) * 0.06;

      ctx.clearRect(0, 0, W, H);

      const isDesktop = W >= 900;
      const activeFloat = smoothProg * 5;
      const activeIdx = Math.min(
        5,
        Math.max(0, Math.round(smoothProg * 6 - 0.5))
      );

      // 1. Define the 6 3D Stage Anchors in the right/center-right theatre
      // Carefully laid out so labels NEVER overlap and NEVER collide with the bottom-left Stage Card!
      const rawNodes = isDesktop
        ? [
            { x: -W * 0.05, y: -H * 0.18, z: -80, labelSide: 'right' }, // 01 Profiling
            { x: W * 0.15, y: -H * 0.11, z: -20, labelSide: 'right' },  // 02 Matching
            { x: W * 0.02, y: -H * 0.01, z: 30, labelSide: 'left' },   // 03 Scheduling
            { x: W * 0.23, y: H * 0.08, z: 70, labelSide: 'right' },   // 04 Notification
            { x: W * 0.07, y: H * 0.19, z: 110, labelSide: 'left' },   // 05 Offer tracking
            { x: W * 0.27, y: H * 0.29, z: 150, labelSide: 'right' },  // 06 Analytics
          ]
        : [
            { x: -W * 0.14, y: -H * 0.24, z: -60, labelSide: 'right' },
            { x: W * 0.14, y: -H * 0.15, z: -20, labelSide: 'left' },
            { x: -W * 0.12, y: -H * 0.05, z: 20, labelSide: 'right' },
            { x: W * 0.14, y: H * 0.05, z: 50, labelSide: 'left' },
            { x: -W * 0.1, y: H * 0.15, z: 80, labelSide: 'right' },
            { x: W * 0.12, y: H * 0.25, z: 110, labelSide: 'left' },
          ];

      // Add smooth lead-in and lead-out control points so the thread enters and exits gracefully
      const splineControlPts = [
        {
          x: rawNodes[0].x - W * 0.16,
          y: rawNodes[0].y - H * 0.14,
          z: -160,
        },
        ...rawNodes,
        {
          x: rawNodes[5].x + W * 0.14,
          y: rawNodes[5].y + H * 0.14,
          z: 210,
        },
      ];

      // 3D Projection helper anchored to the center-right stage theatre
      const cx = (isDesktop ? W * 0.56 : W * 0.5) + ptr.x * 16;
      const cy = H * 0.52 + ptr.y * 10 + (0.5 - smoothProg) * 28;
      const camDist = 980;
      const floorY = H * 0.34;

      const project = (pt) => {
        const yaw = ptr.x * 0.08 + (smoothProg - 0.5) * 0.1;
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);
        const rx = pt.x * cosY - pt.z * sinY;
        const rz = pt.x * sinY + pt.z * cosY;
        const scale = camDist / Math.max(200, camDist - rz);
        return {
          px: cx + rx * scale,
          py: cy + pt.y * scale,
          scale,
          rz,
        };
      };

      // 2. Draw Subtle Architectural Perspective Floor Grid & Datum Crosshairs
      ctx.save();
      const gridAlpha = night ? 0.07 : 0.08;
      ctx.strokeStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${gridAlpha})`;
      ctx.lineWidth = 1;

      for (let g = -3; g <= 4; g++) {
        const gx = g * (W * 0.085);
        const pNear = project({ x: gx, y: floorY, z: 220 });
        const pFar = project({ x: gx, y: floorY, z: -220 });
        ctx.beginPath();
        ctx.moveTo(pNear.px, pNear.py);
        ctx.lineTo(pFar.px, pFar.py);
        ctx.stroke();
      }
      for (let zStep = -2; zStep <= 2; zStep++) {
        const gz = zStep * 95;
        const pLeft = project({ x: -W * 0.26, y: floorY, z: gz });
        const pRight = project({ x: W * 0.38, y: floorY, z: gz });
        ctx.beginPath();
        ctx.moveTo(pLeft.px, pLeft.py);
        ctx.lineTo(pRight.px, pRight.py);
        ctx.stroke();
      }
      ctx.restore();

      // Sample the 3D spline into 180 high-resolution points
      // Node 0 is at spline index 1/7 (t = 1/7 ≈ 0.1428), Node 5 is at index 6/7 (t = 6/7 ≈ 0.857)
      const tNodeStart = 1 / 7;
      const tNodeEnd = 6 / 7;
      const activeSplineT = lerp(
        tNodeStart,
        tNodeEnd,
        clamp(activeFloat / 5, 0, 1)
      );

      const SAMPLES = 180;
      const spinePts = [];
      for (let s = 0; s <= SAMPLES; s++) {
        const u = s / SAMPLES;
        const p3 = evalSpline3D(splineControlPts, u);
        const proj = project(p3);
        spinePts.push({ u, p3, ...proj });
      }

      // 3. Draw Vertical Datum Drop-Lines from Each of the 6 Stage Nodes to the Floor Plane
      const projectedNodes = rawNodes.map((n, idx) => {
        const nodeU = (idx + 1) / 7;
        const p3 = evalSpline3D(splineControlPts, nodeU);
        const proj = project(p3);
        const floorProj = project({ x: p3.x, y: floorY, z: p3.z });
        return {
          idx,
          nodeU,
          p3,
          ...proj,
          floorPx: floorProj.px,
          floorPy: floorProj.py,
          labelSide: n.labelSide,
          title: steps[idx] || DEFAULT_STEPS[idx],
          meta: STAGE_META[idx] || STAGE_META[0],
        };
      });

      projectedNodes.forEach((n) => {
        const isCurrent = n.idx === activeIdx;
        const isPassed = n.idx < activeIdx;
        const dropAlpha = isCurrent ? 0.35 : isPassed ? 0.16 : 0.08;

        ctx.save();
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = isCurrent
          ? `rgba(${accentBright[0]},${accentBright[1]},${accentBright[2]},${dropAlpha})`
          : `rgba(${ink[0]},${ink[1]},${ink[2]},${dropAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(n.px, n.py);
        ctx.lineTo(n.floorPx, n.floorPy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Floor anchor '+' crosshair
        ctx.fillStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${dropAlpha * 1.4})`;
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', n.floorPx, n.floorPy);
        ctx.restore();
      });

      // 4. Draw the 11 Braided Gossamer Optical Filaments ("One Thread")
      for (let f = 0; f < NUM_FILAMENTS; f++) {
        const fil = filaments[f];
        ctx.beginPath();
        for (let s = 0; s <= SAMPLES; s++) {
          const sp = spinePts[s];
          const waveAngle =
            sp.u * Math.PI * 2 * fil.freq - time * 1.1 + fil.phase;
          const r = fil.radius * sp.scale;
          const ox = Math.cos(waveAngle) * r;
          const oy = Math.sin(waveAngle) * r * 0.65;
          if (s === 0) ctx.moveTo(sp.px + ox, sp.py + oy);
          else ctx.lineTo(sp.px + ox, sp.py + oy);
        }
        ctx.strokeStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${
          night ? fil.alpha : fil.alpha * 0.85
        })`;
        ctx.lineWidth = 0.75;
        ctx.stroke();
      }

      // 5. Draw Base Spine Hairline (Full Length)
      ctx.beginPath();
      spinePts.forEach((sp, s) => {
        if (s === 0) ctx.moveTo(sp.px, sp.py);
        else ctx.lineTo(sp.px, sp.py);
      });
      ctx.strokeStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${
        night ? 0.22 : 0.2
      })`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 6. Draw Energized Core Waveguide (Up to Current Scroll Stage)
      // Outer soft energy sheath + razor-sharp 2px core (no bulky cartoon tube!)
      ctx.save();
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let s = 0; s <= SAMPLES; s++) {
        const sp = spinePts[s];
        if (sp.u > activeSplineT + 0.04) break;
        if (s === 0) ctx.moveTo(sp.px, sp.py);
        else ctx.lineTo(sp.px, sp.py);
      }
      ctx.strokeStyle = `rgba(${accentBright[0]},${accentBright[1]},${
        accentBright[2]
      },${night ? 0.28 : 0.35})`;
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.strokeStyle = night
        ? `rgba(${accentBright[0]},${accentBright[1]},${accentBright[2]},0.95)`
        : `rgba(${ink[0]},${ink[1]},${ink[2]},0.9)`;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();

      // 7. Render High-Speed Photonic Data Packets Streaming Along the Conduit
      for (let i = 0; i < packets.length; i++) {
        const pk = packets[i];
        pk.t = (pk.t + pk.speed) % 1;
        const p3 = evalSpline3D(splineControlPts, pk.t);
        const proj = project(p3);
        const swirl = pk.t * 16 + pk.offsetPhase - time * 1.5;
        const px = proj.px + Math.cos(swirl) * pk.offsetR * proj.scale;
        const py = proj.py + Math.sin(swirl) * pk.offsetR * 0.6 * proj.scale;

        const isEnergizedZone = pk.t <= activeSplineT + 0.05;
        const alpha =
          Math.sin(pk.t * Math.PI) * (isEnergizedZone ? 0.95 : 0.35);
        if (alpha < 0.05) continue;

        const rgb =
          pk.isAccent && isEnergizedZone
            ? `${accentBright[0]},${accentBright[1]},${accentBright[2]}`
            : `${ink[0]},${ink[1]},${ink[2]}`;

        // Glowing packet aura
        const r = pk.size * proj.scale * (isEnergizedZone ? 3.2 : 2.0);
        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, `rgba(${rgb},${alpha})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 8. Draw Optical Leader Tether from Active 3D Node to the Left Stage Card
      const activeNode = projectedNodes[activeIdx];
      if (activeNode && isDesktop) {
        const cardAnchorX = Math.min(W * 0.34, 430);
        const cardAnchorY = clamp(activeNode.py, H * 0.56, H * 0.82);
        const elbowX = lerp(cardAnchorX, activeNode.px, 0.38);

        ctx.save();
        const tetherGrad = ctx.createLinearGradient(
          cardAnchorX,
          cardAnchorY,
          activeNode.px,
          activeNode.py
        );
        tetherGrad.addColorStop(
          0,
          `rgba(${accentBright[0]},${accentBright[1]},${accentBright[2]},0.05)`
        );
        tetherGrad.addColorStop(
          0.5,
          `rgba(${accentBright[0]},${accentBright[1]},${accentBright[2]},0.45)`
        );
        tetherGrad.addColorStop(
          1,
          `rgba(${accentBright[0]},${accentBright[1]},${accentBright[2]},0.85)`
        );

        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = -time * 24;
        ctx.strokeStyle = tetherGrad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cardAnchorX, cardAnchorY);
        ctx.lineTo(elbowX, cardAnchorY);
        ctx.lineTo(activeNode.px, activeNode.py);
        ctx.stroke();
        ctx.setLineDash([]);

        // Elbow telemetry node dot
        ctx.fillStyle = `rgba(${accentBright[0]},${accentBright[1]},${accentBright[2]},0.8)`;
        ctx.beginPath();
        ctx.arc(elbowX, cardAnchorY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 9. Render the 6 Gyroscopic Stage Nodes & Non-Overlapping Architectural HUD Badges
      projectedNodes.forEach((n) => {
        const isCurrent = n.idx === activeIdx;
        const isPassed = n.idx < activeIdx;
        const prox = Math.max(0, 1 - Math.abs(activeFloat - n.idx));

        const baseR = (isCurrent ? 30 : isPassed ? 16 : 13) * n.scale;
        const nodeRgb = isCurrent
          ? `${accentBright[0]},${accentBright[1]},${accentBright[2]}`
          : isPassed
          ? `${jade[0]},${jade[1]},${jade[2]}`
          : `${ink[0]},${ink[1]},${ink[2]}`;

        // A. Ambient Halo on Active / Passed Node
        if (isCurrent || prox > 0.2) {
          const haloR = baseR * 2.5;
          const halo = ctx.createRadialGradient(
            n.px,
            n.py,
            0,
            n.px,
            n.py,
            haloR
          );
          halo.addColorStop(
            0,
            `rgba(${accentBright[0]},${accentBright[1]},${accentBright[2]},${
              night ? 0.28 : 0.22
            })`
          );
          halo.addColorStop(1, `rgba(${accentBright[0]},${accentBright[1]},${accentBright[2]},0)`);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(n.px, n.py, haloR, 0, Math.PI * 2);
          ctx.fill();
        }

        // B. Node Dark/Paper Backing Disc so filaments behind the node don't clutter it
        ctx.fillStyle = night ? 'rgba(5, 5, 8, 0.88)' : 'rgba(251, 251, 248, 0.92)';
        ctx.beginPath();
        ctx.arc(n.px, n.py, baseR, 0, Math.PI * 2);
        ctx.fill();

        // C. Outer Precision Ring
        ctx.strokeStyle = `rgba(${nodeRgb},${
          isCurrent ? 0.95 : isPassed ? 0.75 : 0.32
        })`;
        ctx.lineWidth = isCurrent ? 1.8 : 1.1;
        ctx.beginPath();
        ctx.arc(n.px, n.py, baseR, 0, Math.PI * 2);
        ctx.stroke();

        // D. Active Node Gyroscopic Reticle + Stage-Specific Live Schematic
        if (isCurrent) {
          // Outer rotating degree ticks
          ctx.save();
          ctx.translate(n.px, n.py);
          ctx.rotate(time * 0.35);
          ctx.strokeStyle = `rgba(${nodeRgb}, 0.45)`;
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 7]);
          ctx.beginPath();
          ctx.arc(0, 0, baseR + 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // 4 cardinal reticle ticks
          for (let k = 0; k < 4; k++) {
            const a = (k * Math.PI) / 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * (baseR + 3), Math.sin(a) * (baseR + 3));
            ctx.lineTo(Math.cos(a) * (baseR + 11), Math.sin(a) * (baseR + 11));
            ctx.stroke();
          }
          ctx.restore();

          // Stage-specific animated diagram inside the node
          drawStageMicroSchematic(
            n.idx,
            n.px,
            n.py,
            baseR,
            time,
            night ? '245, 158, 11' : '10, 10, 11'
          );
        } else {
          // Core dot for completed or upcoming stages
          ctx.fillStyle = `rgba(${nodeRgb},${isPassed ? 0.9 : 0.4})`;
          ctx.beginPath();
          ctx.arc(n.px, n.py, isPassed ? 4 : 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // E. Crisp Architectural HUD Callout Pill (Leader Line + Badge)
        const dir = n.labelSide === 'left' ? -1 : 1;
        const leaderLen = isCurrent ? 34 : 22;
        const startX = n.px + dir * (baseR + 4);
        const endX = startX + dir * leaderLen;
        const badgeY = n.py;

        // Horizontal leader tick
        ctx.strokeStyle = `rgba(${nodeRgb},${isCurrent ? 0.8 : 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX, badgeY);
        ctx.lineTo(endX, badgeY);
        ctx.stroke();

        // Measure HUD pill dimensions
        const numStr = `0${n.idx + 1}`;
        const titleStr = n.title.toUpperCase();
        ctx.font = `${isCurrent ? '700 12px' : '500 11px'} "JetBrains Mono", monospace`;
        const textW = ctx.measureText(`${numStr}  ${titleStr}`).width;
        const pillW = textW + (isCurrent ? 34 : 24);
        const pillH = isCurrent ? 44 : 28;
        const pillX = dir === 1 ? endX : endX - pillW;
        const pillY = badgeY - pillH * 0.5;

        // Pill background
        ctx.fillStyle = night
          ? isCurrent
            ? 'rgba(12, 12, 16, 0.92)'
            : 'rgba(8, 8, 11, 0.78)'
          : isCurrent
          ? 'rgba(255, 255, 255, 0.96)'
          : 'rgba(251, 251, 248, 0.85)';

        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 6);
        ctx.fill();

        // Pill border
        ctx.strokeStyle = isCurrent
          ? `rgba(${accentBright[0]},${accentBright[1]},${accentBright[2]},${
              night ? 0.85 : 0.9
            })`
          : isPassed
          ? `rgba(${jade[0]},${jade[1]},${jade[2]},0.4)`
          : `rgba(${ink[0]},${ink[1]},${ink[2]},0.14)`;
        ctx.lineWidth = isCurrent ? 1.4 : 1;
        ctx.stroke();

        // Status indicator dot inside pill
        const dotX = pillX + 12;
        const dotY = isCurrent ? pillY + 15 : pillY + pillH * 0.5;
        ctx.fillStyle = isCurrent
          ? `rgb(${accentBright[0]},${accentBright[1]},${accentBright[2]})`
          : isPassed
          ? `rgb(${jade[0]},${jade[1]},${jade[2]})`
          : `rgba(${ink[0]},${ink[1]},${ink[2]},0.35)`;
        ctx.beginPath();
        ctx.arc(dotX, dotY, isCurrent ? 3 : 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Stage Number + Title
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = `${
          isCurrent ? '700 11.5px' : '500 10.5px'
        } "JetBrains Mono", monospace`;
        ctx.fillStyle = night
          ? isCurrent
            ? '#FFFFFF'
            : isPassed
            ? 'rgba(255,255,255,0.85)'
            : 'rgba(255,255,255,0.52)'
          : isCurrent
          ? '#0A0A0B'
          : isPassed
          ? 'rgba(10,10,11,0.85)'
          : 'rgba(10,10,11,0.55)';
        ctx.fillText(`${numStr} · ${titleStr}`, dotX + 9, dotY);

        // Second telemetry row on the Active Stage Pill
        if (isCurrent) {
          ctx.font = '500 9.5px "JetBrains Mono", monospace';
          ctx.fillStyle = night
            ? `rgba(${accentBright[0]},${accentBright[1]},${accentBright[2]},0.9)`
            : `rgba(${accent[0]},${accent[1]},${accent[2]},0.95)`;
          ctx.fillText(n.meta.metric, dotX + 9, pillY + 31);
        }
      });

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [theme, visible, steps]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      <canvas ref={canvasRef} className="block h-full w-full pointer-events-none" />
    </div>
  );
}