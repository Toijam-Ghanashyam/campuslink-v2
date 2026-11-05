import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function Tabs({
  tabs = [],
  value,
  onChange,
  className,
}) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-line overflow-x-auto no-scrollbar', className)}>
      {tabs.map((tab) => {
        const isActive = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative pb-3 pt-1 px-4 text-sm font-medium transition-colors select-none whitespace-nowrap flex items-center gap-2',
              isActive ? 'text-ink font-semibold' : 'text-ink-soft hover:text-ink hover:bg-bone/40 rounded-t-lg'
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'text-xs px-1.5 py-0.2 rounded-full tabular-nums',
                  isActive ? 'bg-ochre-tint text-ochre-deep font-semibold' : 'bg-bone text-ink-soft'
                )}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 inset-x-0 h-[2.5px] bg-ochre rounded-t-full"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

