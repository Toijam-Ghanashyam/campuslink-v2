'use client';

import React from 'react';
import { Card } from './Card';
import { CountUp } from './CountUp';
import { cn } from '../../lib/utils';

export function MetricCard({
  label,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  hint,
  icon: Icon,
  tone = 'ink',
  className,
}) {
  const isNumeric = typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value));

  return (
    <Card className={cn('p-4 sm:p-5 flex flex-col justify-between hover:border-line/80 transition-all', className)}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-ink-soft">
          {label}
        </span>
        {Icon && (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-bone flex items-center justify-center text-ink shrink-0">
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.75]" />
          </div>
        )}
      </div>

      <div className="my-1">
        <div className="font-display font-semibold text-2xl sm:text-3xl lg:text-4xl text-ink tabular-nums tracking-tight">
          {isNumeric ? (
            <CountUp
              to={typeof value === 'number' ? value : parseFloat(value)}
              prefix={prefix}
              suffix={suffix}
              decimals={decimals}
            />
          ) : (
            <span>{prefix}{value}{suffix}</span>
          )}
        </div>
      </div>

      {hint && (
        <div className="text-xs text-ink-soft mt-1 leading-relaxed flex items-center gap-1.5">
          {hint}
        </div>
      )}
    </Card>
  );
}

