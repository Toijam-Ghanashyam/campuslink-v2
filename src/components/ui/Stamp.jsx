import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function Stamp({
  tone = 'jade',
  children,
  className,
  rotate = -2,
  animate = true,
}) {
  const shouldReduceMotion = useReducedMotion();

  const tones = {
    jade: 'border-jade text-jade bg-jade-tint/25',
    brick: 'border-brick text-brick bg-brick-tint/25',
    ochre: 'border-accent text-accent-deep bg-accent-tint/30',
    ink: 'border-fg text-fg bg-bg/40',
  };

  if (shouldReduceMotion || !animate) {
    return (
      <span
        style={{ transform: `rotate(${rotate}deg)` }}
        className={cn(
          'inline-flex items-center justify-center font-mono text-[10.5px] uppercase tracking-[0.14em] font-semibold border-[1.5px] rounded-[3px] px-2 py-0.5 select-none leading-none shrink-0 shadow-xs',
          tones[tone] || tones.ink,
          className
        )}
      >
        {children}
      </span>
    );
  }

  return (
    <motion.span
      initial={{ scale: 1.5, rotate: rotate - 6, opacity: 0 }}
      animate={{ scale: 1, rotate, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 480,
        damping: 22,
        mass: 0.8,
      }}
      className={cn(
        'inline-flex items-center justify-center font-mono text-[10.5px] uppercase tracking-[0.14em] font-semibold border-[1.5px] rounded-[3px] px-2 py-0.5 select-none leading-none shrink-0 shadow-xs',
        tones[tone] || tones.ink,
        className
      )}
    >
      {children}
    </motion.span>
  );
}

