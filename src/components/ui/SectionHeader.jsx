import React from 'react';
import { cn } from '../../lib/utils';

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
  badge,
}) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6', className)}>
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="font-display font-semibold text-2xl text-ink tracking-tight">
            {title}
          </h2>
          {badge}
        </div>
        {subtitle && (
          <p className="text-sm text-ink-soft mt-1 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
}

