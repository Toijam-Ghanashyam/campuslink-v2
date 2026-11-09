// src/components/ui/IntroOverlay.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Clean Pitch-Black Loading Intro with Cursor-Only Ripples & Smooth Fade-Out
 *
 * - Pitch black (#000000) with white "CampusLink" and "#F59E0B" ".register" (matching Landing Page)
 * - Smooth horizontal loading bar draws under the wordmark (0.20s -> 1.35s)
 * - No falling drop and NO big central ripple at the end
 * - Moving the cursor inside the intro spawns silky water ripples at the cursor position ONLY
 * - At 1.35s -> 2.15s, the overlay smoothly fades out to reveal the Landing Page
 */

const T_LOAD_DONE = 1.35;
const T_FADE_END = 2.15;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeOutCubic = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
const easeInOutSine = (x) => -(Math.cos(Math.PI * clamp(x, 0, 1)) - 1) / 2;

function spacedText(ctx, text, x, y, spacing, align = 'left') {
  let total = 0;
  for (const ch of text) total += ctx.measureText(ch).width + spacing;
  total -= spacing;
  let cx = align === 'center' ? x - total / 2 : x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
  return total;
}

function drawCursorRipple(ctx, x, y, radius, bandWidth, alpha) {
  if (radius <= 2 || alpha <= 0.003) return;
  const rInner = Math.max(0, radius - bandWidth);
  const rOuter = radius + bandWidth;
  const grad = ctx.createRadialGradient(x, y, rInner, x, y, rOuter);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  grad.addColorStop(0.35, `rgba(255, 255, 255, ${(alpha * 0.45).toFixed(4)})`);
  grad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha.toFixed(4)})`);
  grad.addColorStop(0.65, `rgba(255, 255, 255, ${(alpha * 0.45).toFixed(4)})`);
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, rOuter, 0, Math.PI * 2);
  if (rInner > 1) {
    ctx.arc(x, y, rInner, 0, Math.PI * 2, true);
  }
  ctx.fill();
}

export function ShatterIntro({ onBreak, onDone }) {
  const canvasRef = useRef(null);
  const [active, setActive] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (/[?&]nointro\b/.test(window.location.search)) return false;
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return false;
    return true;
  });

  useEffect(() => {
    if (active) return undefined;
    document.documentElement.classList.remove('intro-hold');
    onBreak?.();
    onDone?.();
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (!active) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const html = document.documentElement;
    html.classList.add('intro-hold');
    const prevOverflow = html.style.overflow;
    html.style.overflow = 'hidden';

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, H);
    };
    resize();
    window.addEventListener('resize', resize);

    const fs = clamp(W * 0.065, 24, 76);
    const markSize = fs * 0.56;
    const wordFont = `600 ${fs}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
    const regFont = `700 ${fs * 0.26}px "JetBrains Mono", ui-monospace, monospace`;
    const capFont = `500 ${Math.max(10, fs * 0.145)}px "JetBrains Mono", ui-monospace, monospace`;

    // Faint background stars in the intro
    const specks = Array.from({ length: 65 }, (_, i) => ({
      x: ((i * 1973) % 997) / 997,
      y: ((i * 3571) % 991) / 991,
      a: 0.12 + ((i * 71) % 28) / 100,
      ph: i * 1.1,
      fq: 0.7 + (i % 5) * 0.3,
    }));

    // Cursor-only water ripples (active ONLY inside IntroOverlay - mid-level balanced pacing)
    const cursorRipples = [];
    let lastX = -9999;
    let lastY = -9999;
    let lastSpawn = 0;

    const spawnCursorRipple = (x, y, maxR = 90, strength = 0.16, rings = 1) => {
      const now = performance.now() / 1000;
      for (let r = 0; r < rings; r++) {
        cursorRipples.push({
          x,
          y,
          born: now + r * 0.08,
          duration: 0.85 + r * 0.12,
          maxR: maxR * (1 - r * 0.15),
          strength: strength * Math.pow(0.72, r),
        });
      }
      if (cursorRipples.length > 14) {
        cursorRipples.splice(0, cursorRipples.length - 14);
      }
    };

    const onPointerMove = (e) => {
      const now = performance.now();
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      if (dist > 38 && now - lastSpawn > 115) {
        lastX = e.clientX;
        lastY = e.clientY;
        lastSpawn = now;
        spawnCursorRipple(e.clientX, e.clientY, 90, 0.16, 1);
      }
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    let t0 = performance.now();
    let raf = 0;
    let unlocked = false;
    let finished = false;
    let skip = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      if (canvas) canvas.style.backgroundColor = 'transparent';
      html.classList.remove('intro-hold');
      html.style.overflow = prevOverflow;
      setActive(false);
      onDone?.();
    };

    const render = (t, nowSec) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const cx = W * 0.5;
      const cy = H * 0.5;

      // Unlock the landing page hero stagger right as the fade-out begins
      if (!unlocked && t >= T_LOAD_DONE) {
        unlocked = true;
        canvas.style.pointerEvents = 'none';
        canvas.style.backgroundColor = 'transparent';
        html.classList.remove('intro-hold');
        html.style.overflow = prevOverflow;
        onBreak?.();
      }

      // Smooth full-screen fade from 1.0 -> 0.0 after loading completes
      const fadeOutProg = smooth(T_LOAD_DONE, T_FADE_END, t);
      const overlayAlpha = 1 - easeInOutSine(fadeOutProg);

      ctx.save();
      ctx.globalAlpha = overlayAlpha;

      // 1. Pitch-Black Backdrop + Subtle Twinkling Stars
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < specks.length; i++) {
        const s = specks[i];
        const tw = 0.5 + 0.5 * Math.sin(t * s.fq * 2 + s.ph);
        ctx.fillStyle = `rgba(255, 255, 255, ${(s.a * tw * smooth(0.05, 0.6, t)).toFixed(3)})`;
        ctx.fillRect(s.x * W, s.y * H, 1.2, 1.2);
      }

      // 2. Cursor-Only Water Ripples (inside IntroOverlay only)
      for (let i = cursorRipples.length - 1; i >= 0; i--) {
        const rp = cursorRipples[i];
        const age = nowSec - rp.born;
        if (age < 0) continue;
        if (age >= rp.duration) {
          cursorRipples.splice(i, 1);
          continue;
        }
        const p = age / rp.duration;
        const r = 5 + easeOutCubic(p) * rp.maxR;
        const band = 10 + p * 18;
        const a =
          Math.sin(Math.min(1, p * 3.2) * (Math.PI / 2)) *
          Math.pow(1 - p, 1.7) *
          rp.strength;
        drawCursorRipple(ctx, rp.x, rp.y, r, band, a);
      }

      // 3. Wordmark ("[CL] CampusLink .register") + Smooth Horizontal Loading Bar
      const textAlpha = smooth(0.08, 0.65, t);
      const rise = (1 - easeOutCubic((t - 0.08) / 0.72)) * 12;

      ctx.save();
      ctx.globalAlpha = overlayAlpha * textAlpha;
      ctx.textBaseline = 'alphabetic';
      ctx.font = wordFont;
      const wordW = ctx.measureText('CampusLink').width;
      ctx.font = regFont;
      const regW = ctx.measureText('.register').width;
      const gap = fs * 0.26;
      const totalW = markSize + gap + wordW + fs * 0.12 + regW;
      const x0 = cx - totalW / 2;
      const baseY = cy + fs * 0.14 + rise;

      // [CL] Monogram Box
      const my = baseY - markSize * 0.96;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(x0, my, markSize, markSize, markSize * 0.16);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = `700 ${markSize * 0.42}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('CL', x0 + markSize / 2, my + markSize * 0.65);
      ctx.textAlign = 'left';

      // "CampusLink" in pure white
      ctx.fillStyle = '#FFFFFF';
      ctx.font = wordFont;
      ctx.fillText('CampusLink', x0 + markSize + gap, baseY);

      // ".register" in theme accent color (#EA580C in day, #F59E0B in night)
      const isDayTheme = document.documentElement.dataset.theme === 'day';
      ctx.fillStyle = isDayTheme ? '#EA580C' : '#F59E0B';
      ctx.font = regFont;
      ctx.fillText('.register', x0 + markSize + gap + wordW + fs * 0.12, baseY);

      // Caption
      ctx.font = capFont;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.44)';
      spacedText(
        ctx,
        'PLACEMENT REGISTER  ·  BPUT PS10',
        cx,
        baseY + fs * 0.62,
        fs * 0.05,
        'center'
      );

      // Horizontal Loading Line with Glowing Head
      const lw = Math.min(W * 0.34, 360);
      const lineProg = easeOutCubic((t - 0.20) / (T_LOAD_DONE - 0.22));
      const ly = baseY + fs * 0.92;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.fillRect(cx - lw / 2, ly, lw, 1.2);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(cx - lw / 2, ly, lw * lineProg, 1.2);

      if (lineProg > 0.01 && lineProg < 0.999) {
        const hx = cx - lw / 2 + lw * lineProg;
        const g = ctx.createRadialGradient(hx, ly + 0.5, 0, hx, ly + 0.5, 14);
        g.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
        g.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(hx - 14, ly - 13, 28, 28);
      }

      ctx.restore();
      ctx.restore();
    };

    const frame = (now) => {
      const nowSec = now / 1000;
      let t = (now - t0) / 1000;
      if (skip && t < T_LOAD_DONE) {
        t0 -= (T_LOAD_DONE - t) * 1000;
        t = T_LOAD_DONE;
        skip = false;
      }
      render(t, nowSec);
      if (t >= T_FADE_END) {
        finish();
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    // Start animation loop immediately — zero delay, zero blank frames
    t0 = performance.now();
    raf = requestAnimationFrame(frame);

    // Warm up web fonts asynchronously in background without stalling animation
    try {
      if (document.fonts?.load) {
        document.fonts.load(wordFont).catch(() => {});
        document.fonts.load(regFont).catch(() => {});
        document.fonts.load(capFont).catch(() => {});
      }
    } catch {
      /* ignore */
    }

    const onPointerDown = (e) => {
      if (e.clientX && e.clientY) {
        spawnCursorRipple(e.clientX, e.clientY, 120, 0.22, 2);
      }
      skip = true;
    };
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        skip = true;
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
      html.classList.remove('intro-hold');
      html.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-[300] bg-black"
      style={{ backgroundColor: '#000000' }}
    />
  );
}

export { ShatterIntro as IntroOverlay };
export default ShatterIntro;