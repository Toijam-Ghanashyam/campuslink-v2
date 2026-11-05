import React from 'react';
import { cn } from '../../lib/utils';

export function Tag({
  children,
  dot = false,
  dotColor = 'bg-ochre',
  className,
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-xs text-ink/90 select-none tracking-tight',
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
      )}
      <span>{children}</span>
    </span>
  );
}
