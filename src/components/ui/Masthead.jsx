import React from 'react';
import { cn } from '../../lib/utils';
import { Rule } from './Rule';

export function Masthead({
  context,
  title,
  lede,
  action,
  className,
  strong = false,
}) {
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4">
        <div>
          {context && (
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] font-semibold text-ink-soft block mb-1">
              {context}
            </span>
          )}
          <h1 className="font-display font-normal text-3xl sm:text-4xl text-ink tracking-tight leading-[1.08]">
            {title}
          </h1>
          {lede && (
            <p className="font-serif italic text-base sm:text-lg text-ink-soft/90 mt-1 max-w-3xl leading-relaxed">
              {lede}
            </p>
          )}
        </div>
        {action && <div className="shrink-0 flex items-center gap-3">{action}</div>}
      </div>
      <Rule strong={strong} className="my-0" />
    </div>
  );
}

