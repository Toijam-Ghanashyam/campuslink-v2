// src/components/ui/IntroOverlay.jsx
import React, { useEffect, useRef, useState } from 'react';

const T_IMPACT = 1.25;
const T_CRACK = 0.10; // Exact 0.1s sudden full-screen crack propagation
const T_BREAK = 1.60; // Holds the cracked display for 0.25s so the whole broken screen registers
const BREAK_SPREAD = 0.28;
const T_END = T_BREAK + BREAK_SPREAD + 1.55;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeOut = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);

function makeRng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

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

function buildShards(W, H, rnd) {
  const D = Math.hypot(W, H);
  const P = { x: W / 2, y: H / 2 };
  const rays = 24;
  const rings = [0, 0.03, 0.075, 0.14, 0.235, 0.37, 0.56, 1.12];
  const verts = [];
  const vid = (x, y) => {
    verts.push({ x, y });
    return verts.length - 1;
  };
  const center = vid(P.x, P.y);
  const grid = [[...Array(rays)].map(() => center)];
  const angs = [...Array(rays)].map(
    (_, k) => ((k + (rnd() - 0.5) * 0.55) / rays) * Math.PI * 2
  );
  for (let i = 1; i < rings.length; i += 1) {
    const row = [];
    for (let k = 0; k < rays; k += 1) {
      const a = angs[k] + (rnd() - 0.5) * 0.09;
      const r = rings[i] * (D / 2) * (1 + (rnd() - 0.5) * 0.28);
      row.push(vid(P.x + Math.cos(a) * r, P.y + Math.sin(a) * r));
    }
    grid.push(row);
  }

  const mids = new Map();
  const mid = (a, b) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (!mids.has(key)) {
      const A = verts[a];
      const B = verts[b];
      const mx = (A.x + B.x) / 2;
      const my = (A.y + B.y) / 2;
      const len = Math.hypot(B.x - A.x, B.y - A.y);
      const nx = -(B.y - A.y) / (len || 1);
      const ny = (B.x - A.x) / (len || 1);
      const j = (rnd() - 0.5) * len * 0.18;
      mids.set(key, { x: mx + nx * j, y: my + ny * j });
    }
    return mids.get(key);
  };

  const edges = new Map();
  const polys = [];
  const addPoly = (ids) => {
    const pts = [];
    for (let n = 0; n < ids.length; n += 1) {
      const a = ids[n];
      const b = ids[(n + 1) % ids.length];
      pts.push({ x: verts[a].x, y: verts[a].y });
      const m = mid(a, b);
      pts.push({ x: m.x, y: m.y });
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!edges.has(key)) edges.set(key, { a, b, m });
    }
    polys.push(pts);
  };

  for (let k = 0; k < rays; k += 1) {
    const k2 = (k + 1) % rays;
    addPoly([center, grid[1][k], grid[1][k2]]);
    for (let i = 1; i < rings.length - 1; i += 1) {
      const q = [grid[i][k], grid[i][k2], grid[i + 1][k2], grid[i + 1][k]];
      if (i >= 2 && rnd() < 0.5) {
        if (rnd() < 0.5) {
          addPoly([q[0], q[1], q[2]]);
          addPoly([q[0], q[2], q[3]]);
        } else {
          addPoly([q[0], q[1], q[3]]);
          addPoly([q[1], q[2], q[3]]);
        }
      } else {
        addPoly(q);
      }
    }
  }

  const shards = polys.map((pts) => {
    let cx = 0;
    let cy = 0;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    pts.forEach((p) => {
      cx += p.x;
      cy += p.y;
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
    cx /= pts.length;
    cy /= pts.length;
    const dx = cx - P.x;
    const dy = cy - P.y;
    const dist = Math.hypot(dx, dy);
    const d = dist / (D / 2);
    const dir =
      dist > 1
        ? { x: dx / dist, y: dy / dist }
        : { x: rnd() - 0.5, y: rnd() - 0.5 };
    const speed = (420 + rnd() * 460) * (1.25 - Math.min(1, d));
    return {
      pts,
      c: { x: cx, y: cy },
      bb: {
        x: Math.floor(minX) - 2,
        y: Math.floor(minY) - 2,
        w: Math.ceil(maxX - minX) + 4,
        h: Math.ceil(maxY - minY) + 4,
      },
      d,
      delay: d * BREAK_SPREAD * 1.45 + rnd() * 0.04,
      vx: dir.x * speed,
      vy: dir.y * speed - (110 + rnd() * 240),
      spin: (rnd() - 0.5) * 6.2,
      // 3D tumbling angular velocities so shards flip realistically in space
      tumbleX: (rnd() - 0.5) * 7.5,
      tumbleY: (rnd() - 0.5) * 7.5,
      grow: 0.45 * (1.05 - Math.min(1, d)) + rnd() * 0.14,
      phase: rnd() * Math.PI * 2,
      shine: 0.06 + rnd() * 0.14,
    };
  });

  const edgeList = [...edges.values()].map((e) => ({
    a: verts[e.a],
    b: verts[e.b],
    m: e.m,
    d: Math.min(
      Math.hypot(verts[e.a].x - P.x, verts[e.a].y - P.y),
      Math.hypot(verts[e.b].x - P.x, verts[e.b].y - P.y)
    ),
  }));
  return { shards, edges: edgeList, P, D };
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

  useEffect(() => {
    if (!active) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const html = document.documentElement;
    html.classList.add('intro-hold');
    const prevOverflow = html.style.overflow;
    html.style.overflow = 'hidden';

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    const freezeMatch = window.location.search.match(/[?&]introT=([\d.]+)/);
    const freezeAt = freezeMatch ? parseFloat(freezeMatch[1]) : null;

    const rnd = makeRng(20260711);
    const { shards, edges, P, D } = buildShards(W, H, rnd);

    const scene = document.createElement('canvas');
    scene.width = canvas.width;
    scene.height = canvas.height;
    const sctx = scene.getContext('2d');

    const specks = [...Array(70)].map(() => ({
      x: rnd() * W,
      y: rnd() * H,
      a: 0.1 + rnd() * 0.35,
      ph: rnd() * 6.28,
      fq: 0.6 + rnd() * 1.6,
    }));

    const fs = clamp(W * 0.068, 40, 92);
    const markSize = fs * 0.58;
    const wordFont = `600 ${fs}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
    const regFont = `600 ${fs * 0.26}px "JetBrains Mono", ui-monospace, monospace`;
    const capFont = `500 ${Math.max(10, fs * 0.15)}px "JetBrains Mono", ui-monospace, monospace`;

    const drawScene = (t) => {
      const c = sctx;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = '#000000';
      c.fillRect(0, 0, W, H);

      specks.forEach((s) => {
        const tw = 0.5 + 0.5 * Math.sin(t * s.fq * 2 + s.ph);
        c.fillStyle = `rgba(255,255,255,${(
          s.a *
          tw *
          smooth(0.1, 0.8, t)
        ).toFixed(3)})`;
        c.fillRect(s.x, s.y, 1, 1);
      });

      const push = 1 + 0.028 * smooth(0, T_IMPACT, t);
      c.save();
      c.translate(W / 2, H / 2);
      c.scale(push, push);
      c.translate(-W / 2, -H / 2);

      const a = smooth(0.1, 0.68, t);
      const rise = (1 - easeOut((t - 0.1) / 0.72)) * 14;
      c.globalAlpha = a;
      c.textBaseline = 'alphabetic';
      c.font = wordFont;
      const wordW = c.measureText('CampusLink').width;
      c.font = regFont;
      const regW = c.measureText('.register').width;
      const gap = fs * 0.28;
      const totalW = markSize + gap + wordW + fs * 0.12 + regW;
      const x0 = W / 2 - totalW / 2;
      const baseY = H / 2 + fs * 0.18 + rise;

      // Monogram Box [CL]
      const my = baseY - markSize * 0.98;
      c.fillStyle = '#FFFFFF';
      c.beginPath();
      c.roundRect(x0, my, markSize, markSize, markSize * 0.16);
      c.fill();
      c.fillStyle = '#000000';
      c.font = `700 ${markSize * 0.42}px "JetBrains Mono", ui-monospace, monospace`;
      c.textAlign = 'center';
      c.fillText('CL', x0 + markSize / 2, my + markSize * 0.65);
      c.textAlign = 'left';

      // Wordmark
      c.fillStyle = '#FFFFFF';
      c.font = wordFont;
      c.fillText('CampusLink', x0 + markSize + gap, baseY);
      c.fillStyle = '#FFD23F';
      c.font = regFont;
      c.fillText('.register', x0 + markSize + gap + wordW + fs * 0.12, baseY);

      // Caption
      c.font = capFont;
      c.fillStyle = 'rgba(255,255,255,0.46)';
      spacedText(
        c,
        'PLACEMENT REGISTER  ·  BPUT PS10',
        W / 2,
        baseY + fs * 0.62,
        fs * 0.05,
        'center'
      );

      // Tension Fuse Line Drawing Under Wordmark
      const lw = Math.min(W * 0.34, 360);
      const p = easeOut((t - 0.28) / 0.88);
      const ly = baseY + fs * 0.92;
      c.globalAlpha = a;
      c.fillStyle = 'rgba(255,255,255,0.14)';
      c.fillRect(W / 2 - lw / 2, ly, lw, 1);
      c.fillStyle = 'rgba(255,255,255,0.95)';
      c.fillRect(W / 2 - lw / 2, ly, lw * p, 1);

      if (p > 0.01 && p < 0.999) {
        const hx = W / 2 - lw / 2 + lw * p;
        const g = c.createRadialGradient(hx, ly + 0.5, 0, hx, ly + 0.5, 14);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g;
        c.fillRect(hx - 14, ly - 13, 28, 28);
      }
      c.restore();
      c.globalAlpha = 1;
    };

    const chips = [...Array(165)].map(() => {
      const a = rnd() * Math.PI * 2;
      const sp = 280 + rnd() * 1550;
      return {
        a,
        x: P.x + Math.cos(a) * rnd() * 34,
        y: P.y + Math.sin(a) * rnd() * 34,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 140,
        life: 0.5 + rnd() * 1.05,
        size: 0.9 + rnd() * 2.8,
        tri: rnd() < 0.38,
        rot: rnd() * 6.28,
        spin: (rnd() - 0.5) * 16,
      };
    });

    let frozenSceneDrawn = false;
    let t0 = performance.now();
    let raf = 0;
    let broke = false;
    let finished = false;
    let skip = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      html.classList.remove('intro-hold');
      html.style.overflow = prevOverflow;
      setActive(false);
      onDone?.();
    };

    const render = (t) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const preImpact = t < T_IMPACT;
      if (preImpact) {
        drawScene(t);
        frozenSceneDrawn = false;
      } else if (!frozenSceneDrawn) {
        drawScene(T_IMPACT);
        frozenSceneDrawn = true;
      }

      // High-impact camera jolt during the 0.1s crack
      let sx = 0;
      let sy = 0;
      const since = t - T_IMPACT;
      if (since > 0 && since < 0.32) {
        const k = Math.pow(1 - since / 0.32, 2) * 12;
        sx = (rnd() - 0.5) * 2 * k;
        sy = (rnd() - 0.5) * 2 * k;
      }
      ctx.save();
      ctx.translate(sx, sy);

      if (t < T_BREAK) {
        ctx.drawImage(scene, 0, 0, W, H);
      }

      // 0.1s Crack Propagation Across Whole Display from Dead Center
      const q = clamp(since / T_CRACK, 0, 1);
      if (since > 0 && t < T_BREAK + 0.04) {
        const reach = easeOut(q) * D * 0.65;
        ctx.lineCap = 'round';
        edges.forEach((e) => {
          if (e.d > reach) return;
          const fade = clamp((reach - e.d) / 70, 0, 1);
          const nearCenter = 1 - Math.min(1, e.d / (D * 0.32));

          // Subtle internal glass glow along primary fractures
          if (nearCenter > 0.35) {
            ctx.strokeStyle = `rgba(255,255,255,${(0.24 * fade * nearCenter).toFixed(3)})`;
            ctx.lineWidth = 3.2;
            ctx.beginPath();
            ctx.moveTo(e.a.x, e.a.y);
            ctx.lineTo(e.m.x, e.m.y);
            ctx.lineTo(e.b.x, e.b.y);
            ctx.stroke();
          }

          // Razor-sharp white glass crack line
          ctx.strokeStyle = `rgba(255,255,255,${(0.96 * fade).toFixed(3)})`;
          ctx.lineWidth = 1.15 + nearCenter * 1.05;
          ctx.beginPath();
          ctx.moveTo(e.a.x, e.a.y);
          ctx.lineTo(e.m.x, e.m.y);
          ctx.lineTo(e.b.x, e.b.y);
          ctx.stroke();
        });
      }

      // Center Impact Shockwave Flash
      if (since > 0 && since < 0.18) {
        const f = 1 - since / 0.18;
        const g = ctx.createRadialGradient(
          P.x,
          P.y,
          0,
          P.x,
          P.y,
          D * 0.44 * (0.35 + q)
        );
        g.addColorStop(0, `rgba(255,255,255,${(0.96 * f).toFixed(3)})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      // 3D Glass Shards Scatter & Tumble
      if (t >= T_BREAK - 0.04) {
        if (!broke && t >= T_BREAK) {
          broke = true;
          canvas.style.pointerEvents = 'none';
          html.classList.remove('intro-hold');
          html.style.overflow = prevOverflow;
          onBreak?.();
        }
        const g = 1850;
        shards.forEach((s) => {
          const tau = Math.max(0, t - T_BREAK - s.delay);
          const x = s.c.x + s.vx * tau;
          const y = s.c.y + s.vy * tau + 0.5 * g * tau * tau;
          const sc = 1 + s.grow * tau;
          const rot = s.spin * tau;

          // 3D foreshortening as each glass shard flips in space
          const flipX = Math.cos(s.tumbleX * tau);
          const flipY = Math.cos(s.tumbleY * tau);
          const sx3d =
            sc * Math.sign(flipX || 1) * Math.max(0.22, Math.abs(flipX));
          const sy3d =
            sc * Math.sign(flipY || 1) * Math.max(0.22, Math.abs(flipY));

          const alpha = 1 - smooth(0.58, 1.48, tau);
          if (alpha <= 0.002) return;
          if (x < -W * 0.6 || x > W * 1.6 || y > H * 2.2) return;

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(x, y);
          ctx.rotate(rot);
          ctx.scale(sx3d, sy3d);
          ctx.translate(-s.c.x, -s.c.y);

          ctx.beginPath();
          s.pts.forEach((p, i) =>
            i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)
          );
          ctx.closePath();

          ctx.save();
          ctx.clip();
          ctx.drawImage(
            scene,
            s.bb.x * dpr,
            s.bb.y * dpr,
            s.bb.w * dpr,
            s.bb.h * dpr,
            s.bb.x,
            s.bb.y,
            s.bb.w,
            s.bb.h
          );
          // Specular flash when the tumbling glass shard catches the light
          const shine =
            tau > 0
              ? s.shine +
                0.24 * Math.pow(Math.abs(Math.sin(rot * 2.1 + s.phase)), 2)
              : 0.03;
          ctx.fillStyle = `rgba(255,255,255,${shine.toFixed(3)})`;
          ctx.fillRect(s.bb.x, s.bb.y, s.bb.w, s.bb.h);
          ctx.restore();

          ctx.strokeStyle = `rgba(255,255,255,${tau > 0 ? 0.58 : 0.88})`;
          ctx.lineWidth = 1.15 / sc;
          ctx.stroke();
          ctx.restore();
        });
      }

      // Flying Glass Splinters & Dust
      if (since > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        chips.forEach((c) => {
          const life = since / c.life;
          if (life >= 1) return;
          const drag = Math.exp(-2.4 * since);
          const px = c.x + (c.vx * (1 - drag)) / 2.4;
          const py =
            c.y + (c.vy * (1 - drag)) / 2.4 + 0.5 * 900 * since * since;
          ctx.fillStyle = `rgba(255,255,255,${(0.88 * (1 - life)).toFixed(3)})`;
          if (c.tri) {
            const r = c.rot + c.spin * since;
            ctx.beginPath();
            ctx.moveTo(
              px + Math.cos(r) * c.size * 2.2,
              py + Math.sin(r) * c.size * 2.2
            );
            ctx.lineTo(
              px + Math.cos(r + 2.4) * c.size * 1.6,
              py + Math.sin(r + 2.4) * c.size * 1.6
            );
            ctx.lineTo(
              px + Math.cos(r + 4.1) * c.size * 1.2,
              py + Math.sin(r + 4.1) * c.size * 1.2
            );
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillRect(px, py, c.size, c.size);
          }
        });
        ctx.restore();
      }
      ctx.restore();
    };

    const frame = (now) => {
      let t = (now - t0) / 1000;
      if (skip && t < T_IMPACT) {
        t0 -= (T_IMPACT - t) * 1000;
        t = T_IMPACT;
        skip = false;
      }
      render(t);
      if (t >= T_END) {
        finish();
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const fontsReady = (async () => {
      try {
        await Promise.race([
          Promise.all([
            document.fonts.load(wordFont),
            document.fonts.load(regFont),
            document.fonts.load(capFont),
          ]),
          new Promise((r) => setTimeout(r, 700)),
        ]);
      } catch {
        /* fallback */
      }
    })();

    fontsReady.then(() => {
      if (finished) return;
      if (freezeAt !== null) {
        render(freezeAt);
        if (freezeAt >= T_BREAK) {
          html.classList.remove('intro-hold');
        }
        return;
      }
      t0 = performance.now();
      raf = requestAnimationFrame(frame);
    });

    const trigger = () => {
      skip = true;
    };
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') trigger();
    };
    window.addEventListener('pointerdown', trigger);
    window.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointerdown', trigger);
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
      className="fixed inset-0 z-[300]"
      style={{ background: 'transparent' }}
    />
  );
}

// Export as IntroOverlay as well so existing imports in LandingPage.jsx work seamlessly
export { ShatterIntro as IntroOverlay };
export default ShatterIntro;
