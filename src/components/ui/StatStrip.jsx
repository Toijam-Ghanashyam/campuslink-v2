import React from 'react';
import { CountUp } from './CountUp';
import { cn } from '../../lib/utils';

export function StatStrip({ items = [], className }) {
  return (
    <div className={cn('w-full border-y border-line my-3.5 py-3', className)}>
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-line">
        {items.map((item, idx) => {
          const isNumeric =
            typeof item.value === 'number' ||
            (!isNaN(parseFloat(item.value)) && isFinite(item.value));

          return (
            <div
              key={idx}
              className={cn(
                'py-1.5 md:py-0.5 px-4 flex flex-col justify-between space-y-1',
                idx === 0 && 'md:pl-0',
                idx === items.length - 1 && 'md:pr-0'
              )}
            >
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-fg-soft block">
                {item.label}
              </span>

              <div className="font-display text-2xl sm:text-3xl font-semibold text-fg tracking-tight tabular-nums leading-tight">
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
                <span className="font-sans text-[11px] text-fg-soft leading-tight">
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

