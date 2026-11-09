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
        'border-t border-line pt-2 pb-1 space-y-1',
        className
      )}
    >
      <span className="font-mono text-[9.5px] sm:text-[10px] uppercase tracking-[0.14em] font-semibold text-fg-soft block select-none">
        {label}
      </span>
      <div className="font-serif italic text-xs sm:text-sm text-fg/90 leading-relaxed max-w-full lg:max-w-[65ch]">
        {children}
      </div>
    </div>
  );
}

