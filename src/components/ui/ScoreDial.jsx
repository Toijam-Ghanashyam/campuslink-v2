import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion, animate } from 'framer-motion';
import { cn } from '../../lib/utils';

export function ScoreDial({
  value = 72,
  size = 180,
  label = 'Readiness Score',
  subtext,
  className,
}) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);
  const [targetValue, setTargetValue] = useState(value);

  // SVG parameters
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = Math.PI * radius; // Half circle length

  useEffect(() => {
    setTargetValue(value);
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    const controls = animate(displayValue, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        setDisplayValue(latest);
      },
    });

    return () => controls.stop();
  }, [value, shouldReduceMotion]);

  // Percentage 0 to 100
  const progress = Math.min(Math.max(displayValue / 100, 0), 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className={cn('flex flex-col items-center justify-center text-center', className)}>
      <div className="relative" style={{ width: size, height: size / 2 + 30 }}>
        <svg
          width={size}
          height={size / 2 + strokeWidth + 4}
          viewBox={`0 0 ${size} ${size / 2 + strokeWidth + 4}`}
          className="overflow-visible"
        >
          {/* Background track (line color) */}
          <path
            d={`M ${strokeWidth} ${size / 2 + 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size / 2 + 2}`}
            fill="none"
            stroke="var(--line)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active arc (ochre) */}
          <path
            d={`M ${strokeWidth} ${size / 2 + 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size / 2 + 2}`}
            fill="none"
            stroke="var(--ochre)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: shouldReduceMotion ? 'none' : 'stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </svg>

        {/* Center reading */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center">
          <div className="font-display font-semibold text-4xl text-ink tabular-nums tracking-tight">
            {Math.round(displayValue)}
            <span className="text-xl text-ink-soft font-sans font-normal ml-0.5">/100</span>
          </div>
          {label && (
            <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-soft mt-1">
              {label}
            </span>
          )}
        </div>
      </div>

      {subtext && (
        <p className="text-xs text-ink-soft mt-2 max-w-[200px] leading-relaxed">
          {subtext}
        </p>
      )}
    </div>
  );
}

