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

    // Qronos Scene 2 vertical light streaks
    const NUM_STREAKS = 64;
    const streaks = Array.from({ length: NUM_STREAKS }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 50 + Math.random() * 145,
      speed: 0.3 + Math.random() * 0.85,
      opacity: 0.05 + Math.random() * 0.20,
      hasHeadDot: Math.random() > 0.55,
    }));

    // Ambient floating micro-particles
    const NUM_DOTS = 48;
    const dots = Array.from({ length: NUM_DOTS }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vy: 0.08 + Math.random() * 0.22,
      size: 1 + Math.random() * 1.2,
      alpha: 0.07 + Math.random() * 0.22,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const s of streaks) {
        s.y -= s.speed;
        if (s.y + s.length < 0) {
          s.y = height + Math.random() * 90;
          s.x = Math.random() * width;
        }

        const grad = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.length);
        grad.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
        grad.addColorStop(0.35, `rgba(255, 255, 255, ${s.opacity * 0.55})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x, s.y + s.length);
        ctx.stroke();

        if (s.hasHeadDot) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.42, s.opacity * 1.75)})`;
          ctx.fillRect(s.x - 0.5, s.y - 0.5, 2, 2);
        }
      }

      for (const d of dots) {
        d.y -= d.vy;
        if (d.y < 0) {
          d.y = height;
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
      className="pointer-events-none fixed inset-0 z-0 bg-[#000000] overflow-hidden"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="h-full w-full block opacity-90" />
      {/* Architectural vertical framing lines */}
      <div className="pointer-events-none fixed inset-y-0 left-4 lg:left-10 w-px bg-white/[0.08]" />
      <div className="pointer-events-none fixed inset-y-0 right-4 lg:right-10 w-px bg-white/[0.08]" />
    </div>
  );
}
