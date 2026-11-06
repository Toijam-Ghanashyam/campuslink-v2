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
        'border-t border-line pt-2.5 pb-1 space-y-1',
        className
      )}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] font-semibold text-fg-soft block select-none">
        {label}
      </span>
      <div className="font-serif italic text-sm text-fg/90 leading-relaxed max-w-[65ch]">
        {children}
      </div>
    </div>
  );
}

