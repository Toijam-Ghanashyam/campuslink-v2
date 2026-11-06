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

    // 3D Parametric Slender Hyperboloid Funnel
    // Matches the exact Qronos proportions:
    // - Slender, elongated cylindrical waist (~52-58px radius)
    // - High, wide flaring mouth at the top reaching the corners
    // - Expansive horizontal flared perspective disc at the floor
    const getFunnel = (u) => {
      // u in [-1, 1]: -1 is bottom flared floor disc, 0 is waist/throat, +1 is top flare
      let r, y;
      const throatY = -height * 0.02;
      const throatR = Math.min(width * 0.040, 56);

      if (u >= 0) {
        // Upper funnel: stays tight through throat, flares smoothly upward to top corners
        const t = u; // 0 -> 1
        y = throatY - t * (height * 0.53);
        r = throatR + Math.pow(t, 2.45) * (width * 0.49);
      } else {
        // Lower funnel: stays slender then rapidly expands into horizontal floor plane
        const t = -u; // 0 -> 1
        y = throatY + Math.pow(t, 0.72) * (height * 0.43);
        r = throatR + Math.pow(t, 1.78) * (width * 0.88);
      }
      return { r, y };
    };

    // Camera 3D perspective projection parameters
    const pitch = 0.32; // camera pitch angle (rad)
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const camDist = 1200;

    const project = (x3, y3, z3, cx, cy) => {
      // Pitch rotation around X axis
      const yRot = y3 * cosP - z3 * sinP;
      const zRot = y3 * sinP + z3 * cosP;
      // Perspective division
      const scale = camDist / (camDist + zRot + 400);
      return {
        px: cx + x3 * scale,
        py: cy + yRot * scale,
        depth: scale,
        z: zRot,
        z3,
      };
    };

    // 750 Flowing celestial particles with real optical star glints & cross-diffraction flares
    const NUM_PARTICLES = 750;
    const particles = Array.from({ length: NUM_PARTICLES }, () => ({
      u: (Math.random() - 0.5) * 2, // [-1, 1]
      angle: Math.random() * Math.PI * 2,
      speedU: 0.00014 + Math.random() * 0.00034,
      speedAngle: 0.0013 + Math.random() * 0.0027,
      sparkleSize: Math.random() < 0.65 ? 1.0 : 1.9,
      baseAlpha: 0.38 + Math.random() * 0.58,
      direction: Math.random() > 0.48 ? 1 : -1,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleFreq: 1.1 + Math.random() * 2.0,
      hasGlint: Math.random() < 0.32, // ~32% have 4-point optical star cross flares
    }));

    let time = 0;

    const render = () => {
      // Slow, tranquil majestic speed matching the original Qronos reference
      time += 0.0007;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.44;

      // 1. SUBTLE FLOOR PERSPECTIVE RINGS (Concentric floor ellipses ONLY at the base)
      // Gives the sense of horizontal ground plane without wireframe rings on the neck
      const FLOOR_RINGS = 16;
      for (let i = 0; i < FLOOR_RINGS; i++) {
        const frac = i / FLOOR_RINGS;
        const u = -1 + frac * 0.30; // only u in [-1.0, -0.70]
        const { r, y } = getFunnel(u);

        const edgeFade = Math.pow(1 - frac, 1.4);
        const ringAlpha = 0.04 + edgeFade * 0.16;

        const segments = 64;
        for (let s = 0; s < segments; s++) {
          const theta1 = (s / segments) * Math.PI * 2;
          const theta2 = ((s + 1) / segments) * Math.PI * 2;

          const x3_1 = Math.cos(theta1) * r;
          const z3_1 = Math.sin(theta1) * r;
          const p1 = project(x3_1, y, z3_1, cx, cy);

          const x3_2 = Math.cos(theta2) * r;
          const z3_2 = Math.sin(theta2) * r;
          const p2 = project(x3_2, y, z3_2, cx, cy);

          const avgZ = (z3_1 + z3_2) * 0.5;
          const normZ = avgZ / Math.max(1, r);
          const alpha = normZ < 0 ? ringAlpha * 0.35 : ringAlpha * (0.5 + normZ * 0.5);

          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0.015, alpha)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // 2. DUAL-DIRECTION HELICAL STREAMLINES (Clockwise & Counter-Clockwise Silk Vortex)
      // Renders the dense sweeping filament vortex matching Qronos with black-to-white chiaroscuro
      const NUM_STRANDS = 88;
      const strandSteps = 64;

      const drawStrandSet = (direction) => {
        for (let s = 0; s < NUM_STRANDS; s++) {
          const baseAngle = (s / NUM_STRANDS) * Math.PI * 2;

          for (let j = 0; j < strandSteps; j++) {
            const u1 = -1 + (j / strandSteps) * 2;
            const u2 = -1 + ((j + 1) / strandSteps) * 2;

            const f1 = getFunnel(u1);
            const f2 = getFunnel(u2);

            // Helical swirl angle winding around the hyperboloid (calm, hypnotic drift)
            const theta1 = baseAngle + direction * (u1 * 4.6 + time * 0.48);
            const x3_1 = Math.cos(theta1) * f1.r;
            const z3_1 = Math.sin(theta1) * f1.r;
            const p1 = project(x3_1, f1.y, z3_1, cx, cy);

            const theta2 = baseAngle + direction * (u2 * 4.6 + time * 0.48);
            const x3_2 = Math.cos(theta2) * f2.r;
            const z3_2 = Math.sin(theta2) * f2.r;
            const p2 = project(x3_2, f2.y, z3_2, cx, cy);

            // Volumetric Black-to-White Depth & Throat Focus Chiaroscuro:
            const midZ = (z3_1 + z3_2) * 0.5;
            const midR = (f1.r + f2.r) * 0.5;
            const normZ = midZ / Math.max(1, midR); // in [-1, 1]
            const midX = (x3_1 + x3_2) * 0.5;
            const rim = Math.abs(midX) / Math.max(1, midR); // silhouette rim highlight

            // Gaussian focus at the waist throat (u approx 0) for intense white brightness
            const throatFocus = Math.exp(-Math.pow(u1 * 2.3, 2));

            let alpha;
            let lw;
            if (normZ < 0) {
              // Deep interior shadow (dark charcoal / black void)
              alpha = 0.025 + (normZ + 1) * 0.09;
              lw = 0.5;
            } else {
              // Illuminated front wall with brilliant throat luminescence & rim glints
              alpha = 0.16 + normZ * 0.44 + throatFocus * 0.38 + rim * 0.22;
              lw = 0.65 + normZ * 0.35 + throatFocus * 0.25;
            }

            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.96, alpha)})`;
            ctx.lineWidth = lw;
            ctx.stroke();
          }
        }
      };

      // Draw counter-rotating silk filament threads
      drawStrandSet(1);
      drawStrandSet(-1);

      // 3. OPTICAL CELESTIAL SPARKLES & 4-POINT STAR CROSS FLARES
      // Twinkling stars with radiant halos and micro diffraction spikes matching Qronos
      for (const pt of particles) {
        pt.u += pt.speedU * pt.direction;
        if (pt.u > 1) pt.u = -1;
        if (pt.u < -1) pt.u = 1;

        pt.angle += pt.speedAngle * pt.direction;

        const { r, y } = getFunnel(pt.u);
        const x3 = Math.cos(pt.angle) * r;
        const z3 = Math.sin(pt.angle) * r;

        const p = project(x3, y, z3, cx, cy);

        // Twinkle pulse cycle
        const twinkle = Math.pow(
          Math.sin(time * pt.twinkleFreq * 4.0 + pt.twinklePhase) * 0.5 + 0.5,
          3.2
        );

        // Radiance factor (front side sparkles glow with high brilliance)
        const isFront = z3 > 0;
        const frontRatio = Math.max(0.18, (z3 / r) * 0.5 + 0.5);
        const sparkAlpha = pt.baseAlpha * frontRatio * (0.28 + twinkle * 0.72);

        if (sparkAlpha > 0.04) {
          // A. Soft luminous aura (radial glow halo)
          const glowR = pt.sparkleSize * (2.8 + twinkle * 4.4);
          const aura = ctx.createRadialGradient(p.px, p.py, 0, p.px, p.py, glowR);
          aura.addColorStop(0, `rgba(255, 255, 255, ${sparkAlpha * 0.95})`);
          aura.addColorStop(0.35, `rgba(255, 255, 255, ${sparkAlpha * 0.32})`);
          aura.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = aura;
          ctx.beginPath();
          ctx.arc(p.px, p.py, glowR, 0, Math.PI * 2);
          ctx.fill();

          // B. 4-point micro star cross flare glints on prominent twinkling sparkles
          if (pt.hasGlint && isFront && twinkle > 0.30) {
            const spikeLen = 4.0 + twinkle * 7.5;
            ctx.strokeStyle = `rgba(255, 255, 255, ${sparkAlpha * 0.90})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(p.px - spikeLen, p.py);
            ctx.lineTo(p.px + spikeLen, p.py);
            ctx.moveTo(p.px, p.py - spikeLen);
            ctx.lineTo(p.px, p.py + spikeLen);
            ctx.stroke();
          }

          // C. Crisp white hot center core
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, sparkAlpha * 1.5)})`;
          ctx.fillRect(
            p.px - pt.sparkleSize * 0.5,
            p.py - pt.sparkleSize * 0.5,
            pt.sparkleSize,
            pt.sparkleSize
          );
        }
      }

      // 4. SUBTLE CONTRAST VIGNETTE
      // Gentle feather behind typography so the 3D black-to-white depth does the work
      const vignette = ctx.createRadialGradient(
        cx,
        cy - height * 0.04,
        15,
        cx,
        cy,
        Math.min(width * 0.44, 480)
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0.12)');
      vignette.addColorStop(0.6, 'rgba(0, 0, 0, 0.04)');
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
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-black select-none">
      <canvas ref={canvasRef} className="h-full w-full block" />
      {/* Subtle bottom transition gradient into Scene 2 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black via-black/35 to-transparent" />
    </div>
  );
}
