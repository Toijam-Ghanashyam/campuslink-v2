import React from 'react';
import { CountUp } from './CountUp';
import { cn } from '../../lib/utils';

export function StatStrip({ items = [], className }) {
  return (
    <div className={cn('w-full border-y border-line my-6 py-5', className)}>
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-line">
        {items.map((item, idx) => {
          const isNumeric =
            typeof item.value === 'number' ||
            (!isNaN(parseFloat(item.value)) && isFinite(item.value));

          return (
            <div
              key={idx}
              className={cn(
                'py-3 md:py-1 px-4 flex flex-col justify-between',
                idx === 0 && 'md:pl-0',
                idx === items.length - 1 && 'md:pr-0'
              )}
            >
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] font-semibold text-ink-soft block mb-1">
                {item.label}
              </span>

              <div className="font-display text-4xl sm:text-5xl text-ink tracking-tight tabular-nums leading-none my-1">
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
                <span className="font-sans text-xs text-ink-soft/80 mt-1 block leading-tight">
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
