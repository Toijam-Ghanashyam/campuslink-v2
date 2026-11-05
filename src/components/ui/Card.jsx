import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function Card({
  children,
  className,
  hover = false,
  onClick,
  ...props
}) {
  const Component = hover ? motion.div : 'div';
  const hoverProps = hover
    ? {
        whileHover: { y: -3, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
      }
    : {};

  return (
    <Component
      onClick={onClick}
      className={cn(
        'bg-paper rounded-2xl border border-line p-6 shadow-subtle relative overflow-hidden',
        hover && 'cursor-pointer hover:border-ochre/50 transition-colors',
        className
      )}
      {...hoverProps}
      {...props}
    >
      {children}
    </Component>
  );
}

