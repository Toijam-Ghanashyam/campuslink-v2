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
      container: 'bg-ochre-tint border-ochre/30 text-ink',
      icon: AlertTriangle,
      iconColor: 'text-ochre-deep',
    },
    jade: {
      container: 'bg-jade-tint border-jade/30 text-ink',
      icon: CheckCircle2,
      iconColor: 'text-jade',
    },
    brick: {
      container: 'bg-brick-tint border-brick/30 text-ink',
      icon: AlertCircle,
      iconColor: 'text-brick',
    },
    ink: {
      container: 'bg-bone border-line text-ink',
      icon: Info,
      iconColor: 'text-ink-soft',
    },
  };

  const currentTone = tones[tone] || tones.ochre;
  const IconComponent = CustomIcon || currentTone.icon;

  return (
    <div
      className={cn(
        'p-4 rounded-xl border flex items-start gap-3.5 transition-all text-sm',
        currentTone.container,
        className
      )}
    >
      <IconComponent className={cn('w-5 h-5 shrink-0 mt-0.5 stroke-[1.75]', currentTone.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold text-sm mb-1 leading-snug">
            {title}
          </h4>
        )}
        <div className="text-xs sm:text-sm text-ink/90 leading-relaxed space-y-1">
          {children}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

