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
          ? 'glass-strong rounded-object p-5 shadow-object'
          : 'bg-surface rounded-object border border-line p-5 shadow-subtle',
        hover && 'cursor-pointer hover:border-ink/40',
        className
      )}
      {...hoverProps}
      {...props}
    >
      {children}
    </Component>
  );
}
