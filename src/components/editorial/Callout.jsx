'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Callout({
  tone = 'ochre',
  title,
  children,
  icon: CustomIcon,
  className,
  action,
}) {
  const tones = {
    ochre: {
      container: 'bg-accent-tint/50 border-accent/40 text-fg',
      icon: AlertTriangle,
      iconColor: 'text-accent-deep',
    },
    jade: {
      container: 'bg-jade-tint/50 border-jade/40 text-fg',
      icon: CheckCircle2,
      iconColor: 'text-jade',
    },
    brick: {
      container: 'bg-brick-tint/50 border-brick/40 text-fg',
      icon: AlertCircle,
      iconColor: 'text-brick',
    },
    ink: {
      container: 'bg-surface border-line text-fg',
      icon: Info,
      iconColor: 'text-fg-soft',
    },
  };

  const currentTone = tones[tone] || tones.ochre;
  const IconComponent = CustomIcon || currentTone.icon;

  return (
    <div
      className={cn(
        'p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row items-start gap-3 sm:gap-3.5 transition-all text-sm',
        currentTone.container,
        className
      )}
    >
      <IconComponent className={cn('w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 stroke-[1.75]', currentTone.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold text-sm mb-1 leading-snug text-fg">
            {title}
          </h4>
        )}
        <div className="text-xs sm:text-sm text-fg/90 leading-relaxed space-y-1">
          {children}
        </div>
      </div>
      {action && <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">{action}</div>}
    </div>
  );
}

export default Callout;
