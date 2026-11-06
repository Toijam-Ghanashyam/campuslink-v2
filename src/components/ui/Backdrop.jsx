import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../theme/ThemeProvider.jsx';

export function Backdrop() {
  const { theme } = useTheme();
  const isNight = theme === 'night';
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isNight) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Qronos Scene 2: Falling vertical light streaks (Brightened & Luminous)
    const NUM_STREAKS = 72;
    const streaks = Array.from({ length: NUM_STREAKS }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 50 + Math.random() * 160,
      speed: 0.32 + Math.random() * 0.82,
      opacity: 0.12 + Math.random() * 0.32,
      hasHeadDot: Math.random() > 0.40,
    }));

    // Ambient floating micro-dust particles
    const NUM_DOTS = 54;
    const dots = Array.from({ length: NUM_DOTS }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vy: 0.08 + Math.random() * 0.18,
      size: 1 + Math.random() * 1.4,
      alpha: 0.12 + Math.random() * 0.32,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Falling light streaks with bright glowing head dots and fading tails
      for (const s of streaks) {
        s.y += s.speed;
        if (s.y - s.length > height) {
          s.y = -Math.random() * 80;
          s.x = Math.random() * width;
        }

        // Gradient from top (tail fading out) to bottom (bright head)
        const grad = ctx.createLinearGradient(s.x, s.y - s.length, s.x, s.y);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.55, `rgba(255, 255, 255, ${s.opacity * 0.5})`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${s.opacity})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - s.length);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        // Glowing white head point at the bottom of the streak
        if (s.hasHeadDot) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.85, s.opacity * 2.8)})`;
          ctx.fillRect(s.x - 0.75, s.y - 0.75, 1.8, 1.8);
        }
      }

      // 2. Ambient drifting dust dots
      for (const d of dots) {
        d.y += d.vy;
        if (d.y > height) {
          d.y = 0;
          d.x = Math.random() * width;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${d.alpha})`;
        ctx.fillRect(d.x, d.y, d.size, d.size);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isNight]);

  if (!isNight) {
    return (
      <div className="backdrop" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 bg-[#000000] overflow-hidden select-none"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="h-full w-full block opacity-90" />
      {/* Architectural vertical framing lines */}
      <div className="pointer-events-none fixed inset-y-0 left-4 lg:left-10 w-px bg-white/[0.08]" />
      <div className="pointer-events-none fixed inset-y-0 right-4 lg:right-10 w-px bg-white/[0.08]" />
      <div className="pointer-events-none fixed inset-x-0 top-16 h-px bg-white/[0.08]" />

      {/* Subtle architectural intersection crosshairs */}
      <span className="pointer-events-none fixed left-4 lg:left-10 top-16 -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] text-white/35 z-10 select-none">+</span>
      <span className="pointer-events-none fixed right-4 lg:right-10 top-16 translate-x-1/2 -translate-y-1/2 font-mono text-[10px] text-white/35 z-10 select-none">+</span>
    </div>
  );
}
