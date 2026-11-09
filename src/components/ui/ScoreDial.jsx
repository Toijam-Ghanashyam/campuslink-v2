// src/components/ui/ScoreDial.jsx
import React, { useEffect, useId, useRef, useState } from 'react';

/**
 * High-Precision Gyroscopic Placement Readiness Instrument
 *
 * - Smooth spring-physics needle & animated score counter
 * - 41 radial micro-ticks that illuminate progressively up to the current score
 * - Continuous plasma energy pulse travelling along the active arc
 * - Optional `previewDelta` prop to show a ghost boost arc when hovering gap modules
 * - Fully responsive SVG scaling across mobile and desktop
 */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  if (Math.abs(endAngle - startAngle) < 0.1) return '';
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

export function ScoreDial({
  value = 72,
  score,
  baseValue,
  previewDelta = 0,
  label = 'EMPLOYABILITY DIAGNOSTIC',
  size = 290,
}) {
  const targetVal = clamp(score ?? value ?? 72, 0, 100);
  const previewVal = clamp(targetVal + previewDelta, 0, 100);
  const deltaFromBase =
    typeof baseValue === 'number' ? targetVal - baseValue : 0;

  const uid = useId().replace(/:/g, '');
  const [animVal, setAnimVal] = useState(0);
  const [hovered, setHovered] = useState(false);
  const valRef = useRef(0);
  const velRef = useRef(0);

  // Harmonic spring physics for needle & digital counter
  useEffect(() => {
    let rafId;
    let last = performance.now();

    const step = (now) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;

      // Spring stiffness & damping (slight realistic overshoot & settle)
      const stiffness = 135;
      const damping = 16;
      const force = (targetVal - valRef.current) * stiffness;
      velRef.current = (velRef.current + force * dt) * Math.exp(-damping * dt);
      valRef.current += velRef.current * dt;

      if (
        Math.abs(targetVal - valRef.current) > 0.04 ||
        Math.abs(velRef.current) > 0.08
      ) {
        setAnimVal(valRef.current);
        rafId = requestAnimationFrame(step);
      } else {
        valRef.current = targetVal;
        setAnimVal(targetVal);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [targetVal]);

  // Determine readiness tier & color tokens
  const tier =
    animVal >= 85
      ? {
          name: 'HIGHLY EMPLOYABLE',
          color: 'rgb(var(--c-jade))',
          badgeBg: 'bg-jade-tint/80 text-jade border-jade/40',
        }
      : animVal >= 75
      ? {
          name: 'READY',
          color: 'rgb(var(--c-jade))',
          badgeBg: 'bg-jade-tint/60 text-jade border-jade/30',
        }
      : animVal >= 50
      ? {
          name: 'DEVELOPING',
          color: 'rgb(var(--c-accent))',
          badgeBg: 'bg-accent-tint/60 text-accent-ink border-accent/35',
        }
      : {
          name: 'NOT READY',
          color: 'rgb(var(--c-brick))',
          badgeBg: 'bg-brick-tint/60 text-brick border-brick/35',
        };

  // Geometry constants (220-degree instrument sweep: -110 deg to +110 deg)
  const cx = 150;
  const cy = 142;
  const rTrack = 104;
  const rOuterBezel = 124;
  const rInnerRing = 76;
  const startAngle = -110;
  const endAngle = 110;
  const totalSweep = endAngle - startAngle; // 220 deg

  const currentAngle = startAngle + (clamp(animVal, 0, 100) / 100) * totalSweep;
  const previewAngle =
    startAngle + (clamp(previewVal, 0, 100) / 100) * totalSweep;
  const benchmark80Angle = startAngle + 0.8 * totalSweep;

  const fullArcPath = describeArc(cx, cy, rTrack, startAngle, endAngle);
  const activeArcPath = describeArc(
    cx,
    cy,
    rTrack,
    startAngle,
    Math.max(startAngle + 0.5, currentAngle)
  );
  const previewArcPath =
    previewDelta > 0
      ? describeArc(cx, cy, rTrack, currentAngle, previewAngle)
      : '';

  const needleTip = polarToCartesian(cx, cy, rTrack - 4, currentAngle);
  const needleTail = polarToCartesian(cx, cy, -18, currentAngle);
  const benchmarkPt = polarToCartesian(cx, cy, rTrack + 12, benchmark80Angle);

  // 41 precision radial ticks around the 220-degree bezel
  const NUM_TICKS = 40;
  const ticks = Array.from({ length: NUM_TICKS + 1 }, (_, i) => {
    const frac = i / NUM_TICKS;
    const deg = startAngle + frac * totalSweep;
    const isMajor = i % 10 === 0;
    const isMedium = i % 5 === 0 && !isMajor;
    const innerR = rTrack + (isMajor ? 9 : isMedium ? 10 : 11);
    const outerR = rTrack + (isMajor ? 19 : isMedium ? 16 : 14);
    const p1 = polarToCartesian(cx, cy, innerR, deg);
    const p2 = polarToCartesian(cx, cy, outerR, deg);
    const active = frac * 100 <= animVal + 0.5;
    const nearTip = Math.abs(frac * 100 - animVal) < 4.5;
    return { i, frac, deg, isMajor, isMedium, p1, p2, active, nearTip };
  });

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col items-center select-none group w-full"
    >
      <div className="w-full flex justify-center" style={{ maxWidth: size }}>
        <svg
          viewBox="0 0 300 218"
          className="w-full h-auto max-w-[280px] sm:max-w-[320px] overflow-visible"
        >
          <defs>
            {/* Active Arc Plasma Gradient */}
            <linearGradient id={`dial-grad-${uid}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(var(--c-accent))" stopOpacity="0.65" />
              <stop offset="60%" stopColor="rgb(var(--c-accent))" stopOpacity="1" />
              <stop offset="100%" stopColor={tier.color} stopOpacity="1" />
            </linearGradient>

            {/* Soft Ambient Core Radial Glow */}
            <radialGradient id={`dial-core-${uid}`} cx="50%" cy="62%" r="50%">
              <stop
                offset="0%"
                stopColor={tier.color}
                stopOpacity={hovered ? '0.22' : '0.12'}
              />
              <stop offset="70%" stopColor={tier.color} stopOpacity="0.03" />
              <stop offset="100%" stopColor={tier.color} stopOpacity="0" />
            </radialGradient>

            {/* Glow Filter for Arc & Needle Tip */}
            <filter id={`dial-glow-${uid}`} x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Ambient Core Telemetry Aura */}
          <circle cx={cx} cy={cy} r={118} fill={`url(#dial-core-${uid})`} />

          {/* 2. Slowly Counter-Rotating Gyroscopic Outer Bezel Ring */}
          <g
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              animation: 'spin 38s linear infinite',
            }}
            className="opacity-30 transition-opacity duration-500 group-hover:opacity-60"
          >
            <circle
              cx={cx}
              cy={cy}
              r={rOuterBezel}
              fill="none"
              stroke="rgb(var(--c-fg))"
              strokeWidth="0.75"
              strokeDasharray="3 8 14 8"
            />
          </g>

          {/* 3. Inner Radar Reference Arc */}
          <path
            d={describeArc(cx, cy, rInnerRing, startAngle, endAngle)}
            fill="none"
            stroke="rgb(var(--c-line))"
            strokeWidth="1"
            strokeDasharray="2 5"
            opacity="0.75"
          />

          {/* 4. Base Unlit Track Arc */}
          <path
            d={fullArcPath}
            fill="none"
            stroke="rgb(var(--c-line))"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.55"
          />

          {/* 5. Ghost Preview Arc (Lights up when hovering a Gap Module on the right) */}
          {previewDelta > 0 && previewArcPath && (
            <path
              d={previewArcPath}
              fill="none"
              stroke="rgb(var(--c-jade))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="4 4"
              opacity="0.75"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="16"
                to="0"
                dur="0.8s"
                repeatCount="indefinite"
              />
            </path>
          )}

          {/* 6. Active Illuminated Plasma Arc */}
          {activeArcPath && (
            <>
              <path
                d={activeArcPath}
                fill="none"
                stroke={`url(#dial-grad-${uid})`}
                strokeWidth="8.5"
                strokeLinecap="round"
                filter={`url(#dial-glow-${uid})`}
                className="score-dial-arc"
              />
              {/* Continuous Travelling Shimmer Pulse Along the Active Arc */}
              <path
                d={activeArcPath}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeLinecap="round"
                pathLength="100"
                strokeDasharray="12 120"
                opacity="0.65"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="112"
                  to="-20"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
              </path>
            </>
          )}

          {/* 7. 41 Precision Radial Bezel Ticks */}
          {ticks.map((t) => (
            <line
              key={t.i}
              x1={t.p1.x}
              y1={t.p1.y}
              x2={t.p2.x}
              y2={t.p2.y}
              stroke={
                t.nearTip
                  ? '#FFFFFF'
                  : t.active
                  ? tier.color
                  : 'rgb(var(--c-fg-soft))'
              }
              strokeWidth={t.isMajor ? 2.1 : t.isMedium ? 1.4 : 0.9}
              strokeLinecap="round"
              opacity={t.nearTip ? 1 : t.active ? 0.9 : t.isMajor ? 0.45 : 0.22}
            />
          ))}

          {/* 8. Scale Labels (0, 50, 80 Target Benchmark, 100) */}
          <text
            x={polarToCartesian(cx, cy, rTrack - 18, startAngle).x}
            y={polarToCartesian(cx, cy, rTrack - 18, startAngle).y + 12}
            textAnchor="middle"
            className="fill-fg-soft font-mono text-[10px]"
          >
            0
          </text>
          <text
            x={cx}
            y={cy - rTrack - 23}
            textAnchor="middle"
            className="fill-fg-soft font-mono text-[10px]"
          >
            50
          </text>
          <text
            x={polarToCartesian(cx, cy, rTrack - 18, endAngle).x}
            y={polarToCartesian(cx, cy, rTrack - 18, endAngle).y + 12}
            textAnchor="middle"
            className="fill-fg-soft font-mono text-[10px]"
          >
            100
          </text>

          {/* 80+ Target Benchmark Marker on the Outer Ring */}
          <g transform={`translate(${benchmarkPt.x}, ${benchmarkPt.y})`}>
            <circle
              r="3"
              fill={animVal >= 80 ? 'rgb(var(--c-jade))' : 'rgb(var(--c-accent))'}
            />
            <circle
              r="6"
              fill="none"
              stroke={animVal >= 80 ? 'rgb(var(--c-jade))' : 'rgb(var(--c-accent))'}
              strokeWidth="0.8"
              opacity="0.6"
            >
              <animate
                attributeName="r"
                values="4;8;4"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.7;0.1;0.7"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </g>

          {/* 9. Precision Tapered Instrument Needle & Target Reticle Tip */}
          <g filter={`url(#dial-glow-${uid})`}>
            <line
              x1={needleTail.x}
              y1={needleTail.y}
              x2={needleTip.x}
              y2={needleTip.y}
              stroke="rgb(var(--c-fg))"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="score-dial-needle"
            />
            {/* Glowing Reticle Ring at Needle Tip */}
            <circle
              cx={needleTip.x}
              cy={needleTip.y}
              r="4.2"
              fill={tier.color}
              stroke="#FFFFFF"
              strokeWidth="1.2"
            />
          </g>

          {/* Center Pivot Hub */}
          <circle
            cx={cx}
            cy={cy}
            r="6"
            fill="rgb(var(--c-surface))"
            stroke={tier.color}
            strokeWidth="2.2"
          />
          <circle cx={cx} cy={cy} r="2.2" fill={tier.color} />

          {/* 10. Live Digital Score Readout */}
          <text
            x={cx}
            y={cy + 50}
            textAnchor="middle"
            className="fill-fg font-display text-[45px] font-semibold tracking-tight"
          >
            {Math.round(animVal)}
          </text>
        </svg>
      </div>

      {/* Status Tier Pill + Live Boost Tag */}
      <div className="mt-0.5 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] transition-colors duration-300 ${tier.badgeBg}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            {tier.name}
          </span>

          {(deltaFromBase > 0 || previewDelta > 0) && (
            <span className="rounded-full bg-jade/15 border border-jade/40 px-2 py-0.5 font-mono text-[10px] font-bold text-jade animate-fade-in">
              +{deltaFromBase + previewDelta} PTS
            </span>
          )}
        </div>

        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-soft">
          {label}
        </span>
      </div>
    </div>
  );
}

export default ScoreDial;
