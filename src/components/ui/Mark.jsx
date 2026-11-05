import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function Mark({
  children,
  delay = 0.2,
  duration = 0.5,
  className,
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <span className={cn('relative inline-block font-semibold', className)}>
        <span className="absolute inset-x-0 bottom-0.5 h-[55%] bg-ochre/30 -z-10 rounded-xs" />
        <span className="relative z-0 text-ink">{children}</span>
      </span>
    );
  }

  return (
    <span className={cn('relative inline-block font-semibold', className)}>
      <motion.span
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{
          duration,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ originX: 0 }}
        className="absolute inset-x-0 bottom-0.5 h-[55%] bg-ochre/35 -z-10 rounded-xs"
      />
      <span className="relative z-0 text-ink">{children}</span>
    </span>
  );
}

