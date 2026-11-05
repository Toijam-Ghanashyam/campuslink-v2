import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function Rule({
  strong = false,
  draw = false,
  className,
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion || !draw) {
    return (
      <hr
        className={cn(
          'w-full border-0 my-6',
          strong ? 'h-px bg-ink/60' : 'h-px bg-line',
          className
        )}
      />
    );
  }

  return (
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ originX: 0 }}
      className={cn(
        'w-full my-6',
        strong ? 'h-px bg-ink/60' : 'h-px bg-line',
        className
      )}
    />
  );
}
