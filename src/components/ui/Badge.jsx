import React from 'react';
import { cn } from '../../lib/utils';

export function Badge({
  tone = 'ink',
  children,
  className,
  size = 'md',
  dot = false,
}) {
  const tones = {
    jade: 'bg-jade-tint text-jade border-jade/20',
    brick: 'bg-brick-tint text-brick border-brick/20',
    ochre: 'bg-ochre-tint text-ochre-deep border-ochre/25 font-semibold',
    ink: 'bg-bone text-ink border-line',
  };

  const dotColors = {
    jade: 'bg-jade',
    brick: 'bg-brick',
    ochre: 'bg-ochre',
    ink: 'bg-ink',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border tracking-wide select-none',
        tones[tone] || tones.ink,
        sizes[size],
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', dotColors[tone])} />
      )}
      {children}
    </span>
  );
}

