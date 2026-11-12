'use client';

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
    <div className={cn('flex items-center gap-1 border-b border-line overflow-x-auto no-scrollbar whitespace-nowrap max-w-full -mx-4 px-4 sm:mx-0 sm:px-0', className)}>
      {tabs.map((tab) => {
        const isActive = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative pb-3 pt-2 px-3.5 sm:px-4 text-xs sm:text-sm font-medium transition-colors select-none whitespace-nowrap flex items-center gap-2 shrink-0 min-h-[40px]',
              isActive
                ? 'text-fg font-semibold'
                : 'text-fg-soft hover:text-fg hover:bg-fg/5 rounded-t-lg'
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full tabular-nums font-mono',
                  isActive
                    ? 'bg-accent-tint text-accent-deep font-bold border border-accent/20'
                    : 'bg-fg/10 text-fg-soft'
                )}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 inset-x-0 h-[2.5px] bg-accent rounded-t-full"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
