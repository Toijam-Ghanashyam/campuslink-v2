import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no records to display at this moment.',
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div className={cn('p-12 text-center rounded-object border border-dashed border-line bg-surface/50 flex flex-col items-center justify-center', className)}>
      <div className="w-12 h-12 rounded-object bg-bg flex items-center justify-center text-fg-soft mb-3 border border-line">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h4 className="font-display font-semibold text-lg text-fg">
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-fg-soft max-w-sm mt-1 mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

