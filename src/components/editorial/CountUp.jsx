'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion, animate } from 'framer-motion';

export function CountUp({
  to = 0,
  duration = 1.2,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(shouldReduceMotion ? to : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(to);
      return;
    }

    if (inView) {
      const numericTarget = typeof to === 'number' ? to : parseFloat(to) || 0;
      const controls = animate(0, numericTarget, {
        duration,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (latest) => {
          setDisplayValue(latest);
        },
      });

      return () => controls.stop();
    }
  }, [inView, to, duration, shouldReduceMotion]);

  const formatted = decimals > 0 
    ? Number(displayValue).toFixed(decimals) 
    : Math.round(displayValue).toLocaleString('en-IN');

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

