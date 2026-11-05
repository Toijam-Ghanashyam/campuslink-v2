import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion, animate } from 'framer-motion';
import { cn } from '../../lib/utils';

export function ScoreDial({
  value = 72,
  size = 240,
  label = 'Readiness Score',
  subtext,
  level = 'Developing',
  className,
}) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    const controls = animate(displayValue, value, {
      duration: 0.95,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        setDisplayValue(latest);
      },
    });

    return () => controls.stop();
  }, [value, shouldReduceMotion]);

  // Dimensions
  const cx = size / 2;
  const cy = size / 2 + 8;
  const outerR = size / 2 - 6;
  const arcR = outerR - 16;
  const arcLength = Math.PI * arcR;
  const progress = Math.min(Math.max(displayValue / 100, 0), 1);
  const strokeDashoffset = arcLength * (1 - progress);
  const needleAngle = -90 + progress * 180; // -90deg is left, +90deg is right

  // Generate 61 precision instrument ticks (every 3 degrees from 0 to 180)
  const ticks = Array.from({ length: 61 }).map((_, i) => {
    const angleDeg = 180 - i * 3;
    const rad = (angleDeg * Math.PI) / 180;
    const isMajor = i % 10 === 0;
    const len = isMajor ? 8 : 4;
    const r1 = outerR;
    const r2 = outerR - len;

    return {
      x1: cx + r1 * Math.cos(rad),
      y1: cy - r1 * Math.sin(rad),
      x2: cx + r2 * Math.cos(rad),
      y2: cy - r2 * Math.sin(rad),
      isMajor,
      number: isMajor ? Math.round((i / 60) * 100) : null,
    };
  });

  return (
    <div className={cn('flex flex-col items-center justify-center text-center select-none', className)}>
      <div className="relative" style={{ width: size, height: size / 2 + 48 }}>
        <svg
          width={size}
          height={size / 2 + 20}
          viewBox={`0 0 ${size} ${size / 2 + 20}`}
          className="overflow-visible"
        >
          {/* Instrument Ticks */}
          {ticks.map((t, idx) => (
            <line
              key={idx}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.isMajor ? '#14161C' : '#E6DFCF'}
              strokeWidth={t.isMajor ? 1.5 : 1}
              strokeLinecap="round"
            />
          ))}

          {/* Background track (line color, 2px) */}
          <path
            d={`M ${cx - arcR} ${cy} A ${arcR} ${arcR} 0 0 1 ${cx + arcR} ${cy}`}
            fill="none"
            stroke="#E6DFCF"
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* Value Arc (solid Ochre, 5px) */}
          <path
            d={`M ${cx - arcR} ${cy} A ${arcR} ${arcR} 0 0 1 ${cx + arcR} ${cy}`}
            fill="none"
            stroke="#E8A33D"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: shouldReduceMotion ? 'none' : 'stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />

          {/* Needle Indicator */}
          <g transform={`translate(${cx}, ${cy}) rotate(${needleAngle})`}>
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={-arcR + 4}
              stroke="#14161C"
              strokeWidth={1.75}
              strokeLinecap="round"
            />
            {/* Pivot Hub */}
            <circle cx={0} cy={0} r={4.5} fill="#14161C" />
            <circle cx={0} cy={0} r={1.5} fill="#FFFDF8" />
          </g>

          {/* Scale Labels */}
          <text x={cx - arcR} y={cy + 14} textAnchor="middle" className="font-mono text-[9px] fill-ink-soft">
            0
          </text>
          <text x={cx} y={cy - arcR - 4} textAnchor="middle" className="font-mono text-[9px] fill-ink-soft">
            50
          </text>
          <text x={cx + arcR} y={cy + 14} textAnchor="middle" className="font-mono text-[9px] fill-ink-soft">
            100
          </text>
        </svg>

        {/* Dial Center Reading */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <div className="font-display text-5xl text-ink tabular-nums leading-none tracking-tight">
            {Math.round(displayValue)}
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] font-semibold text-ochre-deep mt-1">
            {level}
          </span>
          {label && (
            <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-soft/80 mt-0.5">
              {label}
            </span>
          )}
        </div>
      </div>

      {subtext && (
        <p className="font-sans text-xs text-ink-soft mt-3 max-w-[240px] leading-relaxed">
          {subtext}
        </p>
      )}
    </div>
  );
}
