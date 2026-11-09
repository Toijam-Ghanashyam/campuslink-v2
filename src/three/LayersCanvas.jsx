// src/three/LayersCanvas.jsx
import React, { useEffect, useRef } from 'react';
import { useTheme } from '../theme/ThemeProvider.jsx';
import { tokens } from '../theme/tokens.js';

const DEFAULT_LAYERS = [
  'Data sources',
  'Scoring & matching',
  'Scheduler',
  'Notifications',
  'Dashboards',
];

const LAYER_SPECS = [
  { code: 'L01', spec: 'ERP · CSV · GITHUB VERIFIED' },
  { code: 'L02', spec: 'HARD RULES + COSINE ML FIT' },
  { code: 'L03', spec: 'INTERVAL TREE SAT SOLVER' },
  { code: 'L04', spec: 'ZERO-LATENCY DISPATCH BUS' },
  { code: 'L05', spec: 'STUDENT · ADMIN · RECRUITER' },
];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

export default function LayersCanvas({
  visible = true,
  spread,
  layers = DEFAULT_LAYERS,
}) {
  const { theme } = useTheme();
  const canvasRef = useRef(null);
  const spreadRef = useRef(0.5);

  // Sync with Framer Motion MotionValue or numeric spread prop
  useEffect(() => {
    if (typeof spread === 'number') {
      spreadRef.current = spread;
      return undefined;
    }
    if (spread && typeof spread.get === 'function') {
      spreadRef.current = spread.get();
      if (typeof spread.on === 'function') {
        return spread.on('change', (v) => {
          spreadRef.current = v;
        });
      }
    }
    return undefined;
  }, [spread]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return undefined;
    const ctx = canvas.getContext('2d');

    const night = theme === 'night';
    const T = tokens[theme] || tokens.night;
    const ink = night ? [255, 255, 255] : hexToRgb(T.fg);
    const accent = hexToRgb(T.accent);
    const jade = hexToRgb(T.jade);

    let W = 0;
    let H = 0;
    let dpr = 1;
    let raf = 0;
    let time = 0;
    let smoothSpread = spreadRef.current || 0.45;
    let hoveredLayer = -1;

    const ptr = { x: -9999, y: -9999, nx: 0, ny: 0, tx: 0, ty: 0 };

    const measure = () => {
      const parent = canvas.parentElement;
      const rect = parent
        ? parent.getBoundingClientRect()
        : { width: window.innerWidth, height: window.innerHeight };
      W = Math.max(300, Math.round(rect.width));
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
      const r = canvas.getBoundingClientRect();
      ptr.x = e.clientX - r.left;
      ptr.y = e.clientY - r.top;
      ptr.tx = ((e.clientX - r.left) / Math.max(1, W) - 0.5) * 2;
      ptr.ty = ((e.clientY - r.top) / Math.max(1, H) - 0.5) * 2;
    };
    const onPointerLeave = () => {
      ptr.x = -9999;
      ptr.y = -9999;
      ptr.tx = 0;
      ptr.ty = 0;
      hoveredLayer = -1;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', onPointerLeave);

    // Rising vertical bus data packets (travelling from L0 Data Sources -> L4 Dashboards)
    const busPulses = Array.from({ length: 24 }, (_, i) => ({
      pillarIdx: i % 5, // 4 corners + 1 center core
      progress: (i / 24 + Math.random() * 0.05) % 1,
      speed: 0.0035 + Math.random() * 0.0035,
      isAccent: i % 2 === 0,
    }));

    const readSpreadValue = () => {
      if (spread && typeof spread.get === 'function') {
        return clamp(spread.get(), 0, 1);
      }
      if (typeof spread === 'number') {
        return clamp(spread, 0, 1);
      }
      const sec = canvas.closest('section');
      if (sec) {
        const r = sec.getBoundingClientRect();
        const scrollable = Math.max(1, r.height - window.innerHeight);
        return clamp((-r.top / scrollable - 0.08) / 0.65, 0, 1);
      }
      return 0.65;
    };

    const render = () => {
      time += 0.016;
      const targetSpread = readSpreadValue();
      smoothSpread += (targetSpread - smoothSpread) * 0.1;

      ptr.nx += (ptr.tx - ptr.nx) * 0.08;
      ptr.ny += (ptr.ty - ptr.ny) * 0.08;

      ctx.clearRect(0, 0, W, H);

      // Center stack on the left-center of the canvas so right-side callout badges have generous breathing room
      const stackCx = W * 0.42 + ptr.nx * 10;
      const stackCy = H * 0.52 + ptr.ny * 6;
      const plateRadius = Math.min(W * 0.25, H * 0.24, 155);

      // Isometric rotation angles (yaw rotates subtly with pointer + scroll)
      const yaw = -0.68 + ptr.nx * 0.08 + (smoothSpread - 0.5) * 0.08;
      const tilt = 0.46 + ptr.ny * 0.03; // vertical foreshortening of the isometric diamond
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);

      // Project normalized wafer coordinates (u, v in [-1, 1]) at elevation yElev
      const isoProject = (u, v, yElev) => {
        const rx = (u * cosY - v * sinY) * plateRadius;
        const rz = (u * sinY + v * cosY) * plateRadius;
        return {
          x: stackCx + rx,
          y: stackCy + rz * tilt - yElev,
        };
      };

      // Draw a 3D line on a specific layer's surface
      const drawIsoLine = (u1, v1, u2, v2, yElev) => {
        const p1 = isoProject(u1, v1, yElev);
        const p2 = isoProject(u2, v2, yElev);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      };

      // Draw a filled isometric polygon on a plate surface
      const fillIsoQuad = (u1, v1, u2, v2, yElev, fillStyle, strokeStyle) => {
        const p0 = isoProject(u1, v1, yElev);
        const p1 = isoProject(u2, v1, yElev);
        const p2 = isoProject(u2, v2, yElev);
        const p3 = isoProject(u1, v2, yElev);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        if (fillStyle) {
          ctx.fillStyle = fillStyle;
          ctx.fill();
        }
        if (strokeStyle) {
          ctx.strokeStyle = strokeStyle;
          ctx.stroke();
        }
      };

      // Compute elevations for the 5 layers (index 0 = bottom DATA SOURCES, index 4 = top DASHBOARDS)
      // Guaranteed minimum gap of 34px even when spread = 0 so labels NEVER overlap!
      const gap = lerp(34, Math.min(68, H * 0.125), smoothSpread);
      const activeScanFloat = (smoothSpread * 4.4 + ((time * 0.35) % 1) * 0.6) % 5;

      // Check if cursor is hovering near a specific layer
      if (ptr.x > 0 && ptr.x < W && ptr.y > 0 && ptr.y < H) {
        let bestIdx = -1;
        let bestDist = 52;
        for (let i = 0; i < 5; i++) {
          const baseElev = (i - 2) * gap;
          const centerPt = isoProject(0, 0, baseElev);
          const d = Math.hypot(
            (ptr.x - centerPt.x) * 0.65,
            ptr.y - centerPt.y
          );
          if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
        }
        hoveredLayer = bestIdx;
      } else {
        hoveredLayer = -1;
      }

      const layerElevs = [0, 1, 2, 3, 4].map((i) => {
        let elev = (i - 2) * gap;
        if (hoveredLayer !== -1) {
          if (i > hoveredLayer) elev += 10;
          if (i < hoveredLayer) elev -= 10;
          if (i === hoveredLayer) elev += 4;
        }
        return elev;
      });

      const bottomElev = layerElevs[0];
      const topElev = layerElevs[4];

      // 5 vertical optical bus coordinates in (u, v) wafer space
      const busCoords = [
        [-0.78, -0.78],
        [0.78, -0.78],
        [0.78, 0.78],
        [-0.78, 0.78],
        [0, 0], // Central core bus
      ];

      // 1. Draw Background Vertical Optical Bus Guide Lines (Full Stack Height)
      busCoords.forEach(([bu, bv], bIdx) => {
        const pBot = isoProject(bu, bv, bottomElev - 18);
        const pTop = isoProject(bu, bv, topElev + 22);
        ctx.beginPath();
        ctx.setLineDash(bIdx === 4 ? [] : [2, 4]);
        ctx.moveTo(pBot.x, pBot.y);
        ctx.lineTo(pTop.x, pTop.y);
        ctx.strokeStyle =
          bIdx === 4
            ? `rgba(${accent[0]},${accent[1]},${accent[2]},0.28)`
            : `rgba(${ink[0]},${ink[1]},${ink[2]},0.12)`;
        ctx.lineWidth = bIdx === 4 ? 1.4 : 0.8;
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 2. Render Each of the 5 Isometric Silicon/Glass Plates from Bottom (0) to Top (4)
      for (let i = 0; i < 5; i++) {
        const yElev = layerElevs[i];
        const isHovered = hoveredLayer === i;
        const scanProx = Math.max(
          0,
          1 - Math.abs(((time * 0.55) % 5) - i)
        );
        const isHighlighted =
          isHovered || (hoveredLayer === -1 && scanProx > 0.45);
        const energy = isHovered ? 1 : 0.35 + 0.65 * scanProx;

        // 4 corners of the top surface & 3D thickness slab (6px wafer depth)
        const thickness = 5.5;
        const c0 = isoProject(-1, -1, yElev);
        const c1 = isoProject(1, -1, yElev);
        const c2 = isoProject(1, 1, yElev);
        const c3 = isoProject(-1, 1, yElev);

        const b1 = isoProject(1, -1, yElev - thickness);
        const b2 = isoProject(1, 1, yElev - thickness);
        const b3 = isoProject(-1, 1, yElev - thickness);

        const primaryRgb = isHighlighted
          ? `${accent[0]},${accent[1]},${accent[2]}`
          : `${ink[0]},${ink[1]},${ink[2]}`;

        // A. Wafer 3D Bevel Side Walls (Front-Right & Front-Left edges)
        ctx.beginPath();
        ctx.moveTo(c3.x, c3.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.lineTo(b2.x, b2.y);
        ctx.lineTo(b3.x, b3.y);
        ctx.closePath();
        ctx.fillStyle = night
          ? `rgba(${primaryRgb}, ${isHighlighted ? 0.22 : 0.08})`
          : `rgba(10, 10, 11, ${isHighlighted ? 0.16 : 0.07})`;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.lineTo(b2.x, b2.y);
        ctx.lineTo(b1.x, b1.y);
        ctx.closePath();
        ctx.fillStyle = night
          ? `rgba(${primaryRgb}, ${isHighlighted ? 0.32 : 0.12})`
          : `rgba(10, 10, 11, ${isHighlighted ? 0.22 : 0.11})`;
        ctx.fill();

        // B. Top Glass Wafer Surface Fill (dark smoked obsidian in Night, warm frosted ivory in Day)
        ctx.beginPath();
        ctx.moveTo(c0.x, c0.y);
        ctx.lineTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.lineTo(c3.x, c3.y);
        ctx.closePath();

        const surfGrad = ctx.createLinearGradient(c0.x, c0.y, c2.x, c2.y);
        if (night) {
          surfGrad.addColorStop(
            0,
            isHighlighted ? 'rgba(28, 22, 12, 0.88)' : 'rgba(12, 12, 16, 0.84)'
          );
          surfGrad.addColorStop(
            1,
            isHighlighted ? 'rgba(42, 30, 12, 0.92)' : 'rgba(18, 18, 24, 0.88)'
          );
        } else {
          surfGrad.addColorStop(
            0,
            isHighlighted
              ? 'rgba(255, 248, 220, 0.94)'
              : 'rgba(251, 251, 248, 0.90)'
          );
          surfGrad.addColorStop(
            1,
            isHighlighted
              ? 'rgba(255, 241, 184, 0.96)'
              : 'rgba(242, 240, 234, 0.92)'
          );
        }
        ctx.fillStyle = surfGrad;
        ctx.fill();

        // C. Fine Internal Isometric Grid Lines on the Wafer
        ctx.beginPath();
        for (let g = -0.6; g <= 0.61; g += 0.4) {
          drawIsoLine(g, -0.92, g, 0.92, yElev);
          drawIsoLine(-0.92, g, 0.92, g, yElev);
        }
        ctx.strokeStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${
          night ? 0.055 : 0.06
        })`;
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // D. BESPOKE ARCHITECTURAL CIRCUIT SCHEMATIC FOR EACH LAYER
        const schAlpha = isHighlighted ? 0.88 : 0.42;
        const accentStr = `${accent[0]},${accent[1]},${accent[2]}`;
        const inkStr = `${ink[0]},${ink[1]},${ink[2]}`;
        const jadeStr = `${jade[0]},${jade[1]},${jade[2]}`;

        if (i === 0) {
          // LAYER 0 (DATA SOURCES): 3x3 Isometric Data Ingestion Memory Cells + Bus Tracks
          for (let gx = -1; gx <= 1; gx++) {
            for (let gz = -1; gz <= 1; gz++) {
              const u0 = gx * 0.46 - 0.16;
              const v0 = gz * 0.46 - 0.16;
              const pulse =
                0.5 + 0.5 * Math.sin(time * 3.2 + gx * 1.7 + gz * 2.3);
              const isHot = pulse > 0.72;
              fillIsoQuad(
                u0,
                v0,
                u0 + 0.32,
                v0 + 0.32,
                yElev,
                isHot
                  ? `rgba(${accentStr},${0.18 + 0.25 * energy})`
                  : `rgba(${inkStr},0.06)`,
                isHot
                  ? `rgba(${accentStr},${schAlpha})`
                  : `rgba(${inkStr},${schAlpha * 0.45})`
              );
            }
          }
        } else if (i === 1) {
          // LAYER 1 (SCORING & MATCHING): Left Deterministic Rule Bars + Right Neural Vector Mesh
          // Left half: Hard Rule Threshold Gates
          for (let r = 0; r < 3; r++) {
            const vPos = -0.55 + r * 0.45;
            const fillW = 0.35 + 0.25 * Math.sin(time * 2 + r * 1.5);
            fillIsoQuad(
              -0.75,
              vPos,
              -0.1,
              vPos + 0.18,
              yElev,
              `rgba(${inkStr},0.06)`,
              `rgba(${inkStr},${schAlpha * 0.5})`
            );
            fillIsoQuad(
              -0.75,
              vPos,
              -0.75 + fillW,
              vPos + 0.18,
              yElev,
              `rgba(${jadeStr},${0.35 * energy})`,
              null
            );
          }
          // Right half: Cosine Embedding Neural Vector Graph
          const vecNodes = [
            [0.12, -0.55],
            [0.12, 0.0],
            [0.12, 0.55],
            [0.65, -0.32],
            [0.65, 0.32],
          ];
          ctx.beginPath();
          for (let a = 0; a < 3; a++) {
            for (let b = 3; b < 5; b++) {
              drawIsoLine(
                vecNodes[a][0],
                vecNodes[a][1],
                vecNodes[b][0],
                vecNodes[b][1],
                yElev
              );
            }
          }
          ctx.strokeStyle = `rgba(${accentStr},${schAlpha * 0.75})`;
          ctx.lineWidth = 1.1;
          ctx.stroke();

          vecNodes.forEach(([nu, nv], nIdx) => {
            const np = isoProject(nu, nv, yElev);
            ctx.fillStyle =
              nIdx >= 3 ? `rgba(${accentStr},0.95)` : `rgba(${inkStr},0.85)`;
            ctx.beginPath();
            ctx.arc(np.x, np.y, isHighlighted ? 3.2 : 2.4, 0, Math.PI * 2);
            ctx.fill();
          });
        } else if (i === 2) {
          // LAYER 2 (SCHEDULER): Interval Overlap Timeline Tracks + Sliding Conflict-Free Slots
          for (let tr = -1; tr <= 1; tr++) {
            const vTrack = tr * 0.44;
            const slide = Math.sin(time * 1.6 + tr * 2.1) * 0.22;
            // Track rail
            ctx.beginPath();
            drawIsoLine(-0.72, vTrack, 0.72, vTrack, yElev);
            ctx.strokeStyle = `rgba(${inkStr},0.22)`;
            ctx.lineWidth = 1;
            ctx.stroke();
            // Non-overlapping scheduled slot block
            fillIsoQuad(
              slide - 0.32,
              vTrack - 0.12,
              slide + 0.32,
              vTrack + 0.12,
              yElev,
              tr === 0
                ? `rgba(${jadeStr},${0.28 + 0.2 * energy})`
                : `rgba(${accentStr},${0.22 + 0.2 * energy})`,
              tr === 0
                ? `rgba(${jadeStr},${schAlpha})`
                : `rgba(${accentStr},${schAlpha})`
            );
          }
        } else if (i === 3) {
          // LAYER 3 (NOTIFICATIONS): Radial Pub/Sub Broadcast Ripples & 4 Endpoint Beacons
          for (let ring = 1; ring <= 3; ring++) {
            const rScale =
              ((time * 0.45 + ring / 3) % 1) * 0.72;
            ctx.beginPath();
            const steps = 28;
            for (let s = 0; s <= steps; s++) {
              const a = (s / steps) * Math.PI * 2;
              const p = isoProject(
                Math.cos(a) * rScale,
                Math.sin(a) * rScale,
                yElev
              );
              if (s === 0) ctx.moveTo(p.x, p.y);
              else ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = `rgba(${accentStr},${
              (1 - rScale / 0.72) * schAlpha
            })`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        } else if (i === 4) {
          // LAYER 4 (DASHBOARDS): Top 3-Desk Executive Bento Schematic (Student / Admin / Recruiter)
          // Left Desk Widget
          fillIsoQuad(
            -0.76,
            -0.72,
            -0.08,
            0.72,
            yElev,
            `rgba(${inkStr},0.06)`,
            `rgba(${inkStr},${schAlpha * 0.65})`
          );
          // Animated KPI bars inside Left Widget
          for (let b = 0; b < 4; b++) {
            const bh = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(time * 2.8 + b));
            const bv = -0.52 + b * 0.3;
            fillIsoQuad(
              -0.66,
              bv,
              -0.66 + bh,
              bv + 0.14,
              yElev,
              `rgba(${accentStr},${0.45 + 0.35 * energy})`,
              null
            );
          }
          // Right Top & Bottom Desk Widgets
          fillIsoQuad(
            0.06,
            -0.72,
            0.76,
            -0.06,
            yElev,
            `rgba(${accentStr},${0.14 * energy})`,
            `rgba(${accentStr},${schAlpha * 0.85})`
          );
          fillIsoQuad(
            0.06,
            0.08,
            0.76,
            0.72,
            yElev,
            `rgba(${jadeStr},${0.14 * energy})`,
            `rgba(${jadeStr},${schAlpha * 0.8})`
          );
        }

        // E. Crisp Top Wafer Perimeter Border
        ctx.beginPath();
        ctx.moveTo(c0.x, c0.y);
        ctx.lineTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.lineTo(c3.x, c3.y);
        ctx.closePath();
        ctx.strokeStyle = isHighlighted
          ? `rgba(${accentStr}, ${night ? 0.92 : 0.95})`
          : `rgba(${inkStr}, ${night ? 0.32 : 0.28})`;
        ctx.lineWidth = isHighlighted ? 1.6 : 1.05;
        ctx.stroke();

        // F. Glowing Via Pads Where the 5 Vertical Optical Buses Pierce This Wafer
        busCoords.forEach(([bu, bv], bIdx) => {
          const vp = isoProject(bu, bv, yElev);
          ctx.fillStyle =
            bIdx === 4 || isHighlighted
              ? `rgba(${accentStr}, 0.95)`
              : `rgba(${inkStr}, 0.45)`;
          ctx.beginPath();
          ctx.arc(vp.x, vp.y, bIdx === 4 ? 3 : 2, 0, Math.PI * 2);
          ctx.fill();
        });

        // G. Precision Right-Hand Leader Line + Architectural HUD Callout Pill
        const labelTitle = (layers[i] || DEFAULT_LAYERS[i]).toUpperCase();
        const meta = LAYER_SPECS[i] || LAYER_SPECS[0];

        // Anchor leader on the rightmost corner (c1) of the isometric diamond
        const startX = c1.x + 4;
        const startY = c1.y;
        const pillX = Math.min(W - 195, Math.max(c1.x + 28, stackCx + plateRadius * 1.12));
        const pillY = startY;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(pillX - 6, pillY);
        ctx.strokeStyle = isHighlighted
          ? `rgba(${accentStr}, 0.85)`
          : `rgba(${inkStr}, 0.25)`;
        ctx.lineWidth = isHighlighted ? 1.3 : 0.9;
        ctx.stroke();

        // Leader connector dot
        ctx.fillStyle = isHighlighted
          ? `rgb(${accentStr})`
          : `rgba(${inkStr}, 0.45)`;
        ctx.beginPath();
        ctx.arc(pillX - 6, pillY, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Measure & Draw Callout Pill
        ctx.font = `${
          isHighlighted ? '700 11px' : '500 10.5px'
        } "JetBrains Mono", monospace`;
        const fullLabel = `${meta.code} · ${labelTitle}`;
        const textW = ctx.measureText(fullLabel).width;
        const boxW = textW + 22;
        const boxH = isHighlighted && smoothSpread > 0.35 ? 36 : 24;
        const boxTop = pillY - boxH * 0.5;

        ctx.fillStyle = night
          ? isHighlighted
            ? 'rgba(16, 14, 10, 0.94)'
            : 'rgba(9, 9, 12, 0.82)'
          : isHighlighted
          ? 'rgba(255, 255, 255, 0.96)'
          : 'rgba(251, 251, 248, 0.88)';
        ctx.beginPath();
        ctx.roundRect(pillX, boxTop, boxW, boxH, 5);
        ctx.fill();

        ctx.strokeStyle = isHighlighted
          ? `rgba(${accentStr}, 0.9)`
          : `rgba(${inkStr}, 0.15)`;
        ctx.lineWidth = isHighlighted ? 1.3 : 1;
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = night
          ? isHighlighted
            ? '#FFFFFF'
            : 'rgba(255, 255, 255, 0.68)'
          : isHighlighted
          ? '#0A0A0B'
          : 'rgba(10, 10, 11, 0.68)';
        ctx.fillText(
          fullLabel,
          pillX + 11,
          boxH > 28 ? boxTop + 12 : pillY
        );

        if (boxH > 28) {
          ctx.font = '500 8.5px "JetBrains Mono", monospace';
          ctx.fillStyle = `rgba(${accentStr}, 0.9)`;
          ctx.fillText(meta.spec, pillX + 11, boxTop + 26);
        }
      }

      // 3. Render Rising Photonic Data Pulses Travelling Up the 5 Vertical Bus Pillars
      busPulses.forEach((bp) => {
        bp.progress = (bp.progress + bp.speed) % 1;
        const [bu, bv] = busCoords[bp.pillarIdx];
        const curElev = lerp(bottomElev - 10, topElev + 14, bp.progress);
        const pt = isoProject(bu, bv, curElev);

        const alpha = Math.sin(bp.progress * Math.PI) * 0.95;
        const rgb = bp.isAccent
          ? `${accent[0]},${accent[1]},${accent[2]}`
          : `${ink[0]},${ink[1]},${ink[2]}`;

        const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 8);
        g.addColorStop(0, `rgba(${rgb}, ${alpha})`);
        g.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(pt.x - 1, pt.y - 1, 2, 2);
      });

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [theme, visible, layers]);

  return (
    <div className="relative h-full w-full min-h-[420px] select-none overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="block h-full w-full pointer-events-none" />
    </div>
  );
}