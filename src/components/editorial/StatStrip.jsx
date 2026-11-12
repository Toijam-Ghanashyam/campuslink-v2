'use client';

import React from 'react';
import { CountUp } from './CountUp';
import { cn } from '../../lib/utils';

export function StatStrip({ items = [], className }) {
  if (!items || items.length === 0) return null;

  return (
    <div className={cn('w-full border-y border-line my-3.5 py-2 sm:py-3', className)}>
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 divide-line">
        {items.map((item, idx) => {
          const isNumeric =
            typeof item.value === 'number' ||
            (!isNaN(parseFloat(item.value)) && isFinite(item.value));

          // Responsive divider styling: 2 cols on mobile/tablet, 4 on desktop
          const isEven = idx % 2 === 1;
          const isTopRow = idx < 2;

          return (
            <div
              key={idx}
              className={cn(
                'p-3 sm:p-4 lg:p-5 flex flex-col justify-between space-y-1.5 transition-colors',
                // Left border on second column of mobile
                isEven && 'border-l border-line sm:border-l-0',
                // Desktop left borders
                idx > 0 && 'lg:border-l lg:border-line',
                idx === 0 && 'pl-1 sm:pl-3 lg:pl-0',
                idx === items.length - 1 && 'pr-1 sm:pr-3 lg:pr-0'
              )}
            >
              <span className="font-mono text-[9.5px] sm:text-[10px] uppercase tracking-wider font-semibold text-fg-soft block truncate">
                {item.label}
              </span>

              <div className="font-display text-xl sm:text-2xl lg:text-3xl font-semibold text-fg tracking-tight tabular-nums leading-tight">
                {isNumeric ? (
                  <CountUp
                    to={typeof item.value === 'number' ? item.value : parseFloat(item.value)}
                    prefix={item.prefix || ''}
                    suffix={item.suffix || ''}
                    decimals={item.decimals || 0}
                  />
                ) : (
                  <span>
                    {item.prefix || ''}
                    {item.value}
                    {item.suffix || ''}
                  </span>
                )}
              </div>

              {item.hint && (
                <span className="font-sans text-[11px] text-fg-soft leading-tight line-clamp-2">
                  {item.hint}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StatStrip;
