import React, { useEffect, useRef } from 'react';
import { SceneCanvas, HeroScene } from './Scenes.jsx';
import { useTheme } from '../theme/ThemeProvider.jsx';

export default function HeroCanvas({ visible = true }) {
  const { theme } = useTheme();
  const isNight = theme === 'night';
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isNight || !visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Parametric funnel profile: wide top mouth -> narrow throat -> flared bottom disc
    const getFunnelProfile = (t) => {
      let radius;
      let y;
      if (t < 0.64) {
        const u = t / 0.64;
        y = -height * 0.56 + u * (height * 0.80);
        radius = width * 0.042 + Math.pow(1 - u, 2.15) * (width * 0.44);
      } else {
        const u = (t - 0.64) / 0.36;
        y = height * 0.24 + Math.pow(u, 0.72) * (height * 0.25);
        radius = width * 0.042 + Math.pow(u, 1.48) * (width * 0.70);
      }
      return { y, radius };
    };

    const NUM_PARTICLES = 850;
    const particles = Array.from({ length: NUM_PARTICLES }, () => ({
      t: Math.random(),
      angle: Math.random() * Math.PI * 2,
      speedT: 0.0005 + Math.random() * 0.0011,
      speedAngle: 0.01 + Math.random() * 0.016,
      size: Math.random() < 0.82 ? 1.1 : 1.8,
      alpha: 0.16 + Math.random() * 0.52,
    }));

    let time = 0;

    const render = () => {
      time += 0.011;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.46;
      const tilt = 0.27;

      // 1. Swirling orbital spline rings
      const NUM_RINGS = 76;
      for (let i = 0; i < NUM_RINGS; i++) {
        const t = ((i / NUM_RINGS) + time * 0.022) % 1;
        const { y, radius } = getFunnelProfile(t);
        const edgeFade = Math.sin(t * Math.PI);
        const alpha = Math.max(0.03, edgeFade * 0.21);

        ctx.beginPath();
        const segments = 60;
        for (let s = 0; s <= segments; s++) {
          const theta = (s / segments) * Math.PI * 2 + time * (1.15 - t * 0.55) + t * 8;
          const wobble = Math.sin(theta * 3 + time * 1.8 + t * 11) * (radius * 0.032);
          const r = radius + wobble;

          const px = cx + Math.cos(theta) * r;
          const py = cy + y + Math.sin(theta) * r * tilt;

          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 0.85;
        ctx.stroke();
      }

      // 2. Twisting longitudinal meridian strands
      const NUM_STRANDS = 34;
      for (let s = 0; s < NUM_STRANDS; s++) {
        const baseAngle = (s / NUM_STRANDS) * Math.PI * 2;
        ctx.beginPath();
        const steps = 48;
        for (let j = 0; j <= steps; j++) {
          const t = j / steps;
          const { y, radius } = getFunnelProfile(t);
          const theta = baseAngle + t * 7.2 - time * 1.3;
          const px = cx + Math.cos(theta) * radius;
          const py = cy + y + Math.sin(theta) * radius * tilt;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.065)';
        ctx.lineWidth = 0.75;
        ctx.stroke();
      }

      // 3. Flowing white/silver vortex particles
      for (const p of particles) {
        p.t += p.speedT;
        if (p.t > 1) p.t -= 1;
        p.angle += p.speedAngle * (1.35 - p.t * 0.55);

        const { y, radius } = getFunnelProfile(p.t);
        const px = cx + Math.cos(p.angle) * radius;
        const py = cy + y + Math.sin(p.angle) * radius * tilt;

        const depthBoost = (Math.sin(p.angle) + 1) * 0.5;
        const finalAlpha = p.alpha * (0.35 + depthBoost * 0.65) * Math.sin(p.t * Math.PI);

        ctx.fillStyle = `rgba(255, 255, 255, ${finalAlpha})`;
        ctx.fillRect(px, py, p.size, p.size);
      }

      // 4. Readability vignette behind Hero copy & candidate slips
      const vignette = ctx.createRadialGradient(
        cx - width * 0.12,
        cy - height * 0.04,
        20,
        cx,
        cy,
        width * 0.45
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0.68)');
      vignette.addColorStop(0.55, 'rgba(0, 0, 0, 0.32)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isNight, visible]);

  if (!isNight) {
    return (
      <SceneCanvas visible={visible} camera={{ position: [0, 0, 8], fov: 50 }}>
        <HeroScene />
      </SceneCanvas>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-black">
      <canvas ref={canvasRef} className="h-full w-full block" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/65 to-transparent" />
    </div>
  );
}
