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
    jade: 'border-jade text-jade bg-jade-tint/40 dark:bg-jade-tint/20',
    brick: 'border-brick text-brick bg-brick-tint/40 dark:bg-brick-tint/20',
    ochre: 'border-accent text-accent-deep dark:text-accent bg-accent-tint/40 dark:bg-accent-tint/20',
    accent: 'border-accent text-accent-deep dark:text-accent bg-accent-tint/40 dark:bg-accent-tint/20',
    ink: 'border-fg text-fg bg-fg/10 dark:bg-fg/5',
  };

  if (shouldReduceMotion || !animate) {
    return (
      <span
        style={{ transform: `rotate(${rotate}deg)` }}
        className={cn(
          'inline-flex items-center justify-center font-mono text-[10px] sm:text-[10.5px] uppercase tracking-[0.14em] font-semibold border-[1.5px] rounded-[3px] px-2 py-0.5 select-none leading-none shrink-0 shadow-xs stamp-pill',
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
      initial={{ scale: 1.4, rotate: rotate - 6, opacity: 0 }}
      animate={{ scale: 1, rotate, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 480,
        damping: 22,
        mass: 0.8,
      }}
      className={cn(
        'inline-flex items-center justify-center font-mono text-[10px] sm:text-[10.5px] uppercase tracking-[0.14em] font-semibold border-[1.5px] rounded-[3px] px-2 py-0.5 select-none leading-none shrink-0 shadow-xs stamp-pill',
        tones[tone] || tones.ink,
        className
      )}
    >
      {children}
    </motion.span>
  );
}

export default Stamp;
