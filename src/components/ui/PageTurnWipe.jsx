// src/components/ui/PageTurnWipe.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../theme/ThemeProvider.jsx';

/**
 * Full-Viewport End-to-End (0px -> 100vw) White + Electric Neon-Blue Silk Transition (2.0s)
 *
 * - Mixes pure white hot-core silk strands (#FFFFFF) with electric cyan-blue (#00F0FF)
 *   and deep cobalt-blue (#0062FF) laser bloom strands.
 * - Spans 100% of the window from x = 0 to x = 100vw via createPortal.
 * - Never triggers on Dark/White theme toggle.
 */

const DURATION_MS = 1500;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeInOutCubic = (x) => {
  const t = clamp(x, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

function evalFullSpanSpline(pts, u) {
  const maxIdx = pts.length - 1;
  const scaled = clamp(u, 0, 1) * maxIdx;
  const i = Math.min(maxIdx - 1, Math.floor(scaled));
  const f = scaled - i;

  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[Math.min(maxIdx, i + 1)];
  const p3 = pts[Math.min(maxIdx, i + 2)];

  const f2 = f * f;
  const f3 = f2 * f;

  const interp = (k) =>
    0.5 *
    (2 * p1[k] +
      (-p0[k] + p2[k]) * f +
      (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * f2 +
      (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * f3);

  const deriv = (k) =>
    0.5 *
    ((-p0[k] + p2[k]) +
      2 * (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * f +
      3 * (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * f2);

  const x = interp(0);
  const y = interp(1);
  const tx = deriv(0);
  const ty = deriv(1);
  const len = Math.hypot(tx, ty) || 1;

  return {
    x,
    y,
    tx: tx / len,
    ty: ty / len,
    nx: -ty / len,
    ny: tx / len,
  };
}

export function PageTurnWipe({ triggerKey }) {
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const canvasRef = useRef(null);
  const prevKeyRef = useRef(null);
  const [activeRun, setActiveRun] = useState(0);

  useLayoutEffect(() => {
    if (triggerKey !== undefined && prevKeyRef.current !== triggerKey) {
      const prevKey = prevKeyRef.current;
      prevKeyRef.current = triggerKey;

      // Never show the neon-blue silk transition when loading or returning to the landing page
      if (triggerKey === 'landing' || triggerKey === '') {
        return;
      }

      // Play the neon-blue silk wipe when opening the login page or transitioning to dashboards
      setActiveRun((n) => n + 1);
    }
  }, [triggerKey]);

  useLayoutEffect(() => {
    if (activeRun === 0) return undefined;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setActiveRun(0);
      return undefined;
    }

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const isNight = themeRef.current === 'night';

    // Synchronously paint solid opaque cover right now in useLayoutEffect!
    // This executes BEFORE the browser can paint the new route DOM, eliminating any blink of content.
    ctx.fillStyle = isNight ? '#000000' : '#F6F5F0';
    ctx.fillRect(0, 0, W, H);

    // Full end-to-end window spline (from off-screen left -0.06W to off-screen right 1.06W)
    const mainPts = [
      [-W * 0.06, H * 0.62],
      [0, H * 0.58],
      [W * 0.13, H * 0.46],
      [W * 0.27, H * 0.47],
      [W * 0.36, H * 0.60],
      [W * 0.30, H * 0.78],
      [W * 0.22, H * 0.62],
      [W * 0.30, H * 0.47],
      [W * 0.46, H * 0.41],
      [W * 0.61, H * 0.37],
      [W * 0.72, H * 0.26],
      [W * 0.64, H * 0.13],
      [W * 0.55, H * 0.25],
      [W * 0.62, H * 0.40],
      [W * 0.81, H * 0.50],
      [W * 1.00, H * 0.55],
      [W * 1.06, H * 0.57],
    ];

    const branchPts = [
      [W * 0.28, H * 0.48],
      [W * 0.38, H * 0.43],
      [W * 0.52, H * 0.46],
      [W * 0.64, H * 0.62],
      [W * 0.72, H * 0.74],
    ];

    const SAMPLES = 380;
    const spine = Array.from({ length: SAMPLES + 1 }, (_, i) =>
      evalFullSpanSpline(mainPts, i / SAMPLES)
    );
    const branchSpine = Array.from({ length: 120 + 1 }, (_, i) =>
      evalFullSpanSpline(branchPts, i / 120)
    );

    // Palette mixing Pure White Silk + Electric Cyan-Blue + Deep Neon Cobalt
    // 0 = Pure White Core, 1 = Electric Neon Cyan (#00F0FF), 2 = Deep Laser Blue (#0066FF)
    const getStrandColor = (type) => {
      if (isNight) {
        if (type === 0) return '255, 255, 255';
        if (type === 1) return '0, 238, 255';
        return '15, 115, 255';
      }
      if (type === 0) return '10, 10, 14';
      if (type === 1) return '0, 132, 255';
      return '0, 72, 210';
    };

    const NUM_STRANDS = 72;
    const strands = Array.from({ length: NUM_STRANDS }, (_, i) => {
      const norm = (i / (NUM_STRANDS - 1)) * 2 - 1;
      // Mix ~45% pure white strands, ~35% electric cyan-blue, ~20% deep neon blue bloom
      const colorType = i % 5 === 0 ? 2 : i % 2 === 0 ? 0 : 1;
      return {
        norm,
        colorType,
        rgb: getStrandColor(colorType),
        freq: 3.0 + (i % 6) * 0.75,
        phase: (i * 1.19) % (Math.PI * 2),
        baseSpread: 10 + (i % 5) * 5.5,
        loopSpread: 1.55 + (i % 4) * 0.62,
        lag: (i % 9) * 0.011,
        alpha:
          (0.16 + (1 - Math.abs(norm)) * 0.30) *
          (colorType === 2 ? 0.65 : colorType === 1 ? 0.95 : 1.05),
        lw: colorType === 2 ? 2.4 : i % 5 === 0 ? 1.2 : 0.7,
      };
    });

    // 130 Scattering Silk Wisps & Neon-Blue/White Sparks
    const wisps = Array.from({ length: 130 }, (_, i) => {
      const uSpawn = 0.04 + (i / 130) * 0.92;
      const pt = evalFullSpanSpline(mainPts, uSpawn);
      const side = i % 2 === 0 ? 1 : -1;
      const colorType = i % 3 === 0 ? 1 : i % 5 === 0 ? 2 : 0;
      return {
        uSpawn,
        rgb: getStrandColor(colorType),
        x0: pt.x + pt.nx * side * (3 + (i % 16)),
        y0: pt.y + pt.ny * side * (3 + (i % 16)),
        vx: pt.tx * (55 + (i % 6) * 18) + 42,
        vy: pt.ty * 24 + side * (12 + (i % 5) * 9),
        len: 16 + (i % 5) * 12,
        ang: Math.atan2(pt.ty, pt.tx) + side * 0.24,
        alpha: 0.26 + (i % 4) * 0.16,
      };
    });

    const startTime = performance.now();
    let rafId;

    const render = (now) => {
      const elapsed = now - startTime;
      const p = clamp(elapsed / DURATION_MS, 0, 1);

      if (p >= 1) {
        ctx.clearRect(0, 0, W, H);
        setActiveRun(0);
        return;
      }

      ctx.clearRect(0, 0, W, H);

      // 1. Synchronized Wave Kinematics
      const headU = easeInOutCubic(clamp(p / 0.78, 0, 1));
      const tailU = easeInOutCubic(clamp((p - 0.32) / 0.68, 0, 1));
      const scatterPhase = smooth(0.40, 1.0, p);
      const globalFadeOut = 1 - smooth(0.80, 1.0, p);
      const driftX = scatterPhase * 36;

      const hIdx = Math.min(SAMPLES, Math.floor(headU * SAMPLES));
      const hPt = spine[hIdx];
      const hx = hPt.x + driftX * headU;

      // 2. 100% Solid Curtain Ahead of the Wave (Zero Blurry Under-Content Bleed)
      // When p = 0, hx starts at -W * 0.06 (curtain covers 100% of the screen).
      // As the laser sweeps right (hx: 0 -> W), the curtain opens cleanly behind it.
      // Ahead of the laser (right of endX): 100% solid opaque cover (no see-through, no blur).
      // Behind the laser (left of startX): canvas is clear (incoming page crystal clear).
      const feather = 100;
      const revealX = hx;

      if (revealX < W) {
        const startX = Math.max(0, revealX - feather);
        const endX = Math.max(startX + 1, Math.min(W, revealX + 24));

        // Draw the soft gradient transition seam right under the traveling laser star
        const curtainGrad = ctx.createLinearGradient(startX, 0, endX, 0);
        if (isNight) {
          curtainGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          curtainGrad.addColorStop(0.40, 'rgba(0, 0, 0, 0.82)');
          curtainGrad.addColorStop(1.0, '#000000');
        } else {
          curtainGrad.addColorStop(0, 'rgba(246, 245, 240, 0)');
          curtainGrad.addColorStop(0.40, 'rgba(246, 245, 240, 0.82)');
          curtainGrad.addColorStop(1.0, '#F6F5F0');
        }
        ctx.fillStyle = curtainGrad;
        ctx.fillRect(startX, 0, endX - startX, H);

        // Fill all remaining screen area to the right with 100% SOLID OPAQUE cover
        if (endX < W) {
          ctx.fillStyle = isNight ? '#000000' : '#F6F5F0';
          ctx.fillRect(endX, 0, W - endX, H);
        }
      }

      ctx.save();
      if (isNight) {
        // Additive blending so neon-blue and white strands glow like optical lasers where they cross
        ctx.globalCompositeOperation = 'lighter';
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 3. Soft Ambient Neon-Blue Core Spine Under-Glow
      if (headU > tailU + 0.02) {
        const gStart = Math.floor(tailU * SAMPLES);
        const gEnd = Math.min(SAMPLES, Math.ceil(headU * SAMPLES));
        ctx.beginPath();
        for (let i = gStart; i <= gEnd; i += 2) {
          const u = i / SAMPLES;
          const pt = spine[i];
          const x = pt.x + driftX * u;
          const y = pt.y;
          if (i === gStart) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = isNight
          ? `rgba(0, 140, 255, ${(0.14 * globalFadeOut).toFixed(3)})`
          : `rgba(0, 110, 255, ${(0.10 * globalFadeOut).toFixed(3)})`;
        ctx.lineWidth = 26;
        ctx.stroke();
      }

      // 4. Render All 72 Interwoven White + Neon-Blue Silk Filaments
      for (let s = 0; s < NUM_STRANDS; s++) {
        const st = strands[s];
        const sHead = clamp(headU - st.lag, 0, 1);
        const sTail = clamp(tailU - st.lag * 0.5, 0, 1);
        if (sHead <= sTail + 0.005) continue;

        const iStart = Math.floor(sTail * SAMPLES);
        const iEnd = Math.min(SAMPLES, Math.ceil(sHead * SAMPLES));

        ctx.beginPath();
        for (let i = iStart; i <= iEnd; i++) {
          const u = i / SAMPLES;
          const pt = spine[i];

          const loop1 = Math.exp(-Math.pow((u - 0.31) / 0.11, 2));
          const loop2 = Math.exp(-Math.pow((u - 0.69) / 0.11, 2));
          const loopWidth = 1 + (loop1 + loop2) * st.loopSpread;
          const scatterWidth = 1 + scatterPhase * (0.8 + u * 1.4);

          const wave = Math.sin(u * Math.PI * 2 * st.freq + st.phase - p * 4.8);
          const offset =
            (st.norm * 0.68 + wave * 0.32) *
            st.baseSpread *
            loopWidth *
            scatterWidth;

          const x = pt.x + pt.nx * offset + driftX * u;
          const y = pt.y + pt.ny * offset;

          if (i === iStart) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        const a = st.alpha * globalFadeOut;
        if (a > 0.008) {
          ctx.strokeStyle = `rgba(${st.rgb}, ${a.toFixed(3)})`;
          ctx.lineWidth = st.lw;
          ctx.stroke();
        }
      }

      // 4. Secondary Lower Scattering Branch (Mixed White & Neon Cyan)
      if (headU > 0.30) {
        const bHead = clamp((headU - 0.30) / 0.42, 0, 1);
        const bTail = clamp((tailU - 0.22) / 0.48, 0, 1);
        if (bHead > bTail + 0.01) {
          const bStart = Math.floor(bTail * 120);
          const bEnd = Math.min(120, Math.ceil(bHead * 120));
          for (let k = -5; k <= 5; k++) {
            const branchRgb = getStrandColor(Math.abs(k) % 2 === 0 ? 0 : 1);
            ctx.beginPath();
            for (let i = bStart; i <= bEnd; i++) {
              const u = i / 120;
              const pt = branchSpine[i];
              const spread = k * (2.8 + u * 8.5) * (1 + scatterPhase * 0.8);
              const x = pt.x + pt.nx * spread + driftX * 0.5;
              const y = pt.y + pt.ny * spread;
              if (i === bStart) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            const ba = 0.16 * (1 - Math.abs(k) / 7) * globalFadeOut;
            ctx.strokeStyle = `rgba(${branchRgb}, ${ba.toFixed(3)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // 5. Scattering Tangent Wisps & Neon-Blue/White Sparks
      for (let i = 0; i < wisps.length; i++) {
        const w = wisps[i];
        if (headU < w.uSpawn) continue;
        const age = clamp((headU - w.uSpawn) / 0.52, 0, 1);
        if (age >= 1) continue;

        const wx = w.x0 + w.vx * age + driftX * 0.5;
        const wy = w.y0 + w.vy * age;
        const wa = Math.sin(age * Math.PI) * w.alpha * globalFadeOut;
        if (wa <= 0.01) continue;

        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.quadraticCurveTo(
          wx + Math.cos(w.ang) * w.len * 0.55,
          wy + Math.sin(w.ang) * w.len * 0.55,
          wx + Math.cos(w.ang + 0.22) * w.len,
          wy + Math.sin(w.ang + 0.22) * w.len
        );
        ctx.strokeStyle = `rgba(${w.rgb}, ${(wa * 0.85).toFixed(3)})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();

        if (i % 2 === 0) {
          ctx.fillStyle = `rgba(${w.rgb}, ${wa.toFixed(3)})`;
          ctx.fillRect(wx - 1, wy - 1, 2, 2);
        }
      }

      // 6. Dual-Core White + Neon-Blue Laser Leading Star Tip
      if (headU > 0.01 && headU < 0.99) {
        const hIdx = Math.min(SAMPLES, Math.floor(headU * SAMPLES));
        const hPt = spine[hIdx];
        const hx = hPt.x + driftX * headU;
        const hy = hPt.y;

        const hGlow = ctx.createRadialGradient(hx, hy, 0, hx, hy, 64);
        hGlow.addColorStop(
          0,
          `rgba(255, 255, 255, ${(0.98 * globalFadeOut).toFixed(3)})`
        );
        hGlow.addColorStop(
          0.25,
          `rgba(0, 238, 255, ${(0.65 * globalFadeOut).toFixed(3)})`
        );
        hGlow.addColorStop(
          0.55,
          `rgba(0, 98, 255, ${(0.28 * globalFadeOut).toFixed(3)})`
        );
        hGlow.addColorStop(1, 'rgba(0, 98, 255, 0)');
        ctx.fillStyle = hGlow;
        ctx.beginPath();
        ctx.arc(hx, hy, 64, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [activeRun]);

  if (activeRun === 0 || typeof document === 'undefined') return null;

  return createPortal(
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] block h-screen w-screen"
    />,
    document.body
  );
}

export default PageTurnWipe;