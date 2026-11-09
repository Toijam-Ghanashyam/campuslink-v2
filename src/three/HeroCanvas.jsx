// src/three/HeroCanvas.jsx
import React, { useEffect, useRef } from 'react';
import { useTheme } from '../theme/ThemeProvider.jsx';
import { tokens } from '../theme/tokens.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

const STRANDS = 175;
const POINTS = 84;
const BUCKETS = 14;
const SPARKS = 180;
const BG_STARS = 120;

function makeGlowSprite(rgb) {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`);
  grad.addColorStop(0.22, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.38)`);
  grad.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return c;
}

export default function HeroCanvas({ visible = true }) {
  const { theme } = useTheme();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return undefined;
    const ctx = canvas.getContext('2d', { alpha: false });
    const night = theme === 'night';
    const T = tokens[theme] || tokens.night;
    const ink = night ? [255, 255, 255] : hexToRgb(T.fg);
    const accent = hexToRgb(T.accent);
    const bgColor = night ? '#000000' : T.bg;
    const reduced =
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    const glow = makeGlowSprite(ink);
    const glowAccent = makeGlowSprite(accent);

    let W = 0;
    let H = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    let time = reduced ? 14 : 0;
    let last = performance.now();
    let lastScrollY = window.scrollY;
    let scrollBoost = 0;

    const ptr = { x: -9999, y: -9999, tx: -9999, ty: -9999, nx: 0, ny: 0 };

    let seed = 1337;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const A0 = new Float32Array(STRANDS);
    const K = new Float32Array(STRANDS);
    const SP = new Float32Array(STRANDS);
    const WOB = new Float32Array(STRANDS);
    const PH = new Float32Array(STRANDS);
    const JITTER = new Float32Array(STRANDS);

    for (let s = 0; s < STRANDS; s += 1) {
      A0[s] = (s / STRANDS) * Math.PI * 2 + (rnd() - 0.5) * 0.08;
      // Higher helical winding so the floor & top form tight silk accretion rings
      K[s] = 4.6 + rnd() * 1.4;
      SP[s] = 0.78 + rnd() * 0.38;
      WOB[s] = 0.04 + rnd() * 0.1;
      PH[s] = rnd() * Math.PI * 2;
      JITTER[s] = 0.96 + rnd() * 0.08;
    }

    const U = new Float32Array(POINTS + 1);
    const R = new Float32Array(POINTS + 1);
    const Y = new Float32Array(POINTS + 1);
    const PX = new Float32Array(STRANDS * (POINTS + 1));
    const PY = new Float32Array(STRANDS * (POINTS + 1));
    const NZ = new Float32Array(STRANDS * (POINTS + 1));
    const RIM = new Float32Array(STRANDS * (POINTS + 1));
    const seg = Array.from(
      { length: BUCKETS },
      () => new Float32Array(STRANDS * POINTS * 4)
    );
    const segCount = new Int32Array(BUCKETS);

    const sparks = Array.from({ length: SPARKS }, () => ({
      u: (rnd() - 0.5) * 2,
      ang: rnd() * Math.PI * 2,
      du: (0.00004 + rnd() * 0.0001) * (rnd() < 0.75 ? -1 : 1),
      da: 0.001 + rnd() * 0.0016,
      size: rnd() < 0.72 ? 1.05 : 1.85,
      base: 0.38 + rnd() * 0.62,
      ph: rnd() * Math.PI * 2,
      fq: 0.75 + rnd() * 1.75,
      glint: rnd() < 0.28,
      yellow: !night && rnd() < 0.28,
    }));

    const stars = Array.from({ length: BG_STARS }, () => ({
      x: rnd(),
      y: rnd(),
      a: 0.1 + rnd() * 0.28,
      ph: rnd() * Math.PI * 2,
      fq: 0.5 + rnd() * 1.4,
    }));

    let throatR = 44;
    let mask = { x: 0.5, y: 0.34, rx: 0.28, ry: 0.18 };

    // Parametric Qronos Blackhole Hyperboloid
    const profile = (u) => {
      const throatY = -H * 0.025;
      if (u >= 0) {
        // Upper funnel flaring wide to the top corners
        return {
          y: throatY - u * (H * 0.54),
          r: throatR + Math.pow(u, 2.35) * (W * 0.51),
        };
      }
      // Lower funnel flaring into a sweeping horizontal floor accretion disc
      const t = -u;
      return {
        y: throatY + Math.pow(t, 0.7) * (H * 0.43),
        r: throatR + Math.pow(t, 1.72) * (W * 0.92),
      };
    };

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
      throatR = Math.min(W * 0.044, 60);

      for (let j = 0; j <= POINTS; j += 1) {
        U[j] = -1 + (2 * j) / POINTS;
        const p = profile(U[j]);
        R[j] = p.r;
        Y[j] = p.y;
      }

      const copy = document.querySelector('[data-vortex-mask]');
      if (copy && parent) {
        const cr = copy.getBoundingClientRect();
        const pr = parent.getBoundingClientRect();
        mask = {
          x: (cr.left + cr.width / 2 - pr.left) / W,
          y: (cr.top + cr.height * 0.38 - pr.top) / H,
          rx: Math.max(0.22, cr.width / W / 1.85),
          ry: Math.max(0.11, cr.height / H / 2.2),
        };
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onPointer = (e) => {
      const r = canvas.getBoundingClientRect();
      ptr.tx = e.clientX - r.left;
      ptr.ty = e.clientY - r.top;
    };
    const onLeave = () => {
      ptr.tx = -9999;
      ptr.ty = -9999;
    };

    const draw = () => {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);

      const cx = W * 0.5 + ptr.nx * -12;
      const cy = H * 0.44;
      const pitch = 0.31 + ptr.ny * 0.03;
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const camDist = 1200;
      const yaw = ptr.nx * 0.15;
      // Smooth, slow blackhole rotation
      const rot = time * 0.42;
      const hasPtr = ptr.x > -999;

      // 1. Faint twinkling background starfield
      for (let i = 0; i < BG_STARS; i += 1) {
        const st = stars[i];
        const tw = 0.5 + 0.5 * Math.sin(time * st.fq * 2 + st.ph);
        ctx.fillStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${(
          st.a *
          tw *
          (night ? 0.95 : 0.55)
        ).toFixed(3)})`;
        ctx.fillRect(st.x * W, st.y * H, 1, 1);
      }

      segCount.fill(0);
      const baseMax = night ? 0.92 : 0.58;

      // 2. Compute 3D Silk Streamlines with Non-Linear Blackhole Accretion Twist
      for (let s = 0; s < STRANDS; s += 1) {
        const o = s * (POINTS + 1);
        const rJit = JITTER[s];
        for (let j = 0; j <= POINTS; j += 1) {
          const u = U[j];
          // Non-linear twist: winds tighter on the floor disc (u -> -1) and top flare (u -> +1)
          const nonLinearU = u + 0.85 * u * u * u;
          const ang =
            A0[s] +
            K[s] * nonLinearU +
            rot * SP[s] +
            yaw +
            WOB[s] * Math.sin(u * 2.6 + PH[s] + time * 0.3);

          const r = R[j] * rJit;
          const x3 = Math.cos(ang) * r;
          const z3 = Math.sin(ang) * r;
          const yRot = Y[j] * cosP - z3 * sinP;
          const zRot = Y[j] * sinP + z3 * cosP;
          const scale = camDist / (camDist + zRot + 420);

          PX[o + j] = cx + x3 * scale;
          PY[o + j] = cy + yRot * scale;
          NZ[o + j] = -z3 / Math.max(1, r); // +1 front, -1 back
          RIM[o + j] = Math.abs(x3) / Math.max(1, r); // 1 at left/right silhouette edges, 0 at center
        }

        for (let j = 0; j < POINTS; j += 1) {
          const a = o + j;
          const b = a + 1;
          const x1 = PX[a];
          const y1 = PY[a];
          const x2 = PX[b];
          const y2 = PY[b];

          const nz = (NZ[a] + NZ[b]) * 0.5;
          const rim = Math.pow((RIM[a] + RIM[b]) * 0.5, 1.45);
          const u = U[j];
          const near = smooth(-1, 1, nz);
          const throat = Math.exp(-Math.pow(u * 2.2, 2));
          const floorBoost = u < -0.45 ? smooth(-0.45, -0.92, u) * 0.26 : 0;

          // True Qronos Chiaroscuro: strong silhouette rim glow + floor accretion + front depth
          let al =
            0.04 +
            rim * (0.34 + 0.28 * throat) +
            near * 0.22 +
            throat * 0.24 * near +
            floorBoost * (0.4 + 0.6 * near);

          const my = (y1 + y2) * 0.5;
          const mx = (x1 + x2) * 0.5;

          // Feather top navbar edge and extreme side edges
          al *=
            smooth(0, H * 0.08, my) *
            (1 - 0.3 * smooth(0.54, 0.64, Math.abs(mx - W * 0.5) / W));

          // Center headline readability occlusion
          const dx = (mx / W - mask.x) / mask.rx;
          const dy = (my / H - mask.y) / mask.ry;
          al *= 1 - 0.68 * Math.exp(-(dx * dx + dy * dy));

          // Interactive cursor spotlight along strands
          if (hasPtr) {
            const pdx = mx - ptr.x;
            const pdy = my - ptr.y;
            al +=
              0.42 *
              Math.exp(-(pdx * pdx + pdy * pdy) / (2 * 135 * 135)) *
              (0.35 + 0.65 * near);
          }

          al = Math.min(baseMax, al);
          if (al < 0.018) continue;

          const bi = Math.min(
            BUCKETS - 1,
            Math.floor((al / baseMax) * BUCKETS)
          );
          const arr = seg[bi];
          const c = segCount[bi] * 4;
          arr[c] = x1;
          arr[c + 1] = y1;
          arr[c + 2] = x2;
          arr[c + 3] = y2;
          segCount[bi] += 1;
        }
      }

      // 3. Batch-render silk buckets
      ctx.lineCap = 'round';
      for (let b = 0; b < BUCKETS; b += 1) {
        const n = segCount[b];
        if (!n) continue;
        const f = (b + 0.5) / BUCKETS;
        ctx.strokeStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${(
          f * baseMax
        ).toFixed(3)})`;
        ctx.lineWidth = 0.5 + f * 0.85;
        ctx.beginPath();
        const arr = seg[b];
        for (let i = 0; i < n; i += 1) {
          const c = i * 4;
          ctx.moveTo(arr[c], arr[c + 1]);
          ctx.lineTo(arr[c + 2], arr[c + 3]);
        }
        ctx.stroke();
      }

      // 4. Event-Horizon Base Glow (where the funnel throat meets the floor accretion disc)
      {
        const hy =
          cy + (-H * 0.025 + Math.pow(0.36, 0.7) * (H * 0.43)) * cosP * 0.92;
        const gr = ctx.createRadialGradient(cx, hy, 4, cx, hy, W * 0.18);
        gr.addColorStop(
          0,
          `rgba(${ink[0]},${ink[1]},${ink[2]},${night ? 0.14 : 0.07})`
        );
        gr.addColorStop(1, `rgba(${ink[0]},${ink[1]},${ink[2]},0)`);
        ctx.fillStyle = gr;
        ctx.fillRect(cx - W * 0.22, hy - W * 0.22, W * 0.44, W * 0.44);
      }

      // 5. Sparkling Celestial Particles & 4-Point Star Glints
      ctx.lineWidth = 0.75;
      for (let i = 0; i < SPARKS; i += 1) {
        const p = sparks[i];
        if (!reduced) {
          p.u += p.du * (1 + scrollBoost * 2);
          if (p.u > 1) p.u = -1;
          if (p.u < -1) p.u = 1;
          p.ang += p.da * (1 + scrollBoost * 2);
        }
        const prof = profile(p.u);
        const ang = p.ang + yaw;
        const x3 = Math.cos(ang) * prof.r;
        const z3 = Math.sin(ang) * prof.r;
        const yRot = prof.y * cosP - z3 * sinP;
        const zRot = prof.y * sinP + z3 * cosP;
        const scale = camDist / (camDist + zRot + 420);
        const px = cx + x3 * scale;
        const py = cy + yRot * scale;
        const nz = -z3 / Math.max(1, prof.r);
        const near = smooth(-1, 1, nz);
        const tw = Math.pow(Math.sin(time * p.fq * 3 + p.ph) * 0.5 + 0.5, 3.2);
        let a = p.base * (0.22 + 0.78 * near) * (0.22 + 0.78 * tw);

        const dx = (px / W - mask.x) / mask.rx;
        const dy = (py / H - mask.y) / mask.ry;
        a *= 1 - 0.55 * Math.exp(-(dx * dx + dy * dy));

        if (a < 0.03 || py < 0 || py > H) continue;
        const size = p.size * (2.5 + tw * 4.2);

        ctx.globalAlpha = Math.min(1, a);
        ctx.drawImage(
          p.yellow ? glowAccent : glow,
          px - size * 1.6,
          py - size * 1.6,
          size * 3.2,
          size * 3.2
        );
        ctx.globalAlpha = 1;

        if (p.glint && near > 0.45 && tw > 0.32) {
          const len = 3.5 + tw * 8.5;
          ctx.strokeStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${Math.min(
            1,
            a * 1.15
          ).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(px - len, py);
          ctx.lineTo(px + len, py);
          ctx.moveTo(px, py - len);
          ctx.lineTo(px, py + len);
          ctx.stroke();
        }

        ctx.fillStyle = p.yellow
          ? `rgba(${accent[0]},${accent[1]},${accent[2]},${Math.min(
              1,
              a * 1.5
            ).toFixed(3)})`
          : `rgba(${ink[0]},${ink[1]},${ink[2]},${Math.min(
              1,
              a * 1.4
            ).toFixed(3)})`;
        ctx.fillRect(px - p.size * 0.5, py - p.size * 0.5, p.size, p.size);
      }

      // 6. Outer Edge Vignette
      const vg = ctx.createRadialGradient(
        W / 2,
        H * 0.46,
        Math.min(W, H) * 0.34,
        W / 2,
        H * 0.46,
        Math.max(W, H) * 0.78
      );
      vg.addColorStop(0, `${bgColor}00`);
      vg.addColorStop(1, `${bgColor}${night ? 'cc' : '99'}`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    };

    const frame = (now) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const sy = window.scrollY;
      const sv = Math.min(1, Math.abs(sy - lastScrollY) / 40);
      lastScrollY = sy;
      scrollBoost += (sv - scrollBoost) * 0.08;
      time += dt * (1 + scrollBoost * 2.8) * 0.3;

      if (ptr.tx > -999) {
        if (ptr.x < -999) {
          ptr.x = ptr.tx;
          ptr.y = ptr.ty;
        }
        ptr.x += (ptr.tx - ptr.x) * 0.12;
        ptr.y += (ptr.ty - ptr.y) * 0.12;
        ptr.nx += ((ptr.x / W - 0.5) * 2 - ptr.nx) * 0.06;
        ptr.ny += ((ptr.y / H - 0.5) * 2 - ptr.ny) * 0.06;
      } else {
        ptr.x = -9999;
        ptr.nx *= 0.95;
        ptr.ny *= 0.95;
      }
      draw();
      raf = requestAnimationFrame(frame);
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running && !reduced) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    if (reduced) {
      draw();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [theme, visible]);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      style={{ background: theme === 'night' ? '#000' : tokens.day.bg }}
    >
      <canvas ref={canvasRef} className="block h-full w-full pointer-events-none" />
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t ${
          theme === 'night'
            ? 'from-black via-black/40 to-transparent'
            : 'from-bg via-bg/40 to-transparent'
        }`}
      />
    </div>
  );
}
