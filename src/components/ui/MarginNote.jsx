import React from 'react';
import { cn } from '../../lib/utils';

export function MarginNote({
  label = 'AI NOTE',
  children,
  className,
  strong = false,
}) {
  return (
    <div
      className={cn(
        'border-l-2 pl-3.5 py-1 space-y-1',
        strong ? 'border-ochre' : 'border-line',
        className
      )}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] font-semibold text-ink-soft block select-none">
        {label}
      </span>
      <div className="font-serif italic text-sm text-ink/90 leading-relaxed max-w-[65ch]">
        {children}
      </div>
    </div>
  );
}
