'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function Card({
  children,
  className,
  hover = false,
  object = false,
  onClick,
  ...props
}) {
  const Component = hover ? motion.div : 'div';
  const hoverProps = hover
    ? {
        whileHover: { y: -2, transition: { duration: 0.15 } },
      }
    : {};

  return (
    <Component
      onClick={onClick}
      className={cn(
        'relative overflow-hidden transition-all',
        object
          ? 'glass-strong rounded-object p-5 shadow-object border border-[var(--border)] text-[var(--fg)]'
          : 'bg-[var(--surface)] text-[var(--fg)] rounded-object border border-[var(--border)] p-5 shadow-subtle',
        hover && 'cursor-pointer hover:border-[var(--border-strong)] hover:shadow-card',
        className
      )}
      {...hoverProps}
      {...props}
    >
      {children}
    </Component>
  );
}
