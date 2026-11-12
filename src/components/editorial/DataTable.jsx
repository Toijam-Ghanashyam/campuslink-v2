'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from './Skeleton';
import { cn } from '../../lib/utils';
import { Inbox } from 'lucide-react';

export function DataTable({
  columns = [],
  rows = [],
  loading = false,
  onRowClick,
  emptyMessage = 'No records found',
  className,
}) {
  return (
    <div className="w-full space-y-1.5">
      {/* Mobile-only micro-hint for wide tables */}
      <div className="sm:hidden flex justify-end px-1">
        <span className="font-mono text-[10px] text-[var(--fg-subtle)] text-fg-soft select-none tracking-wider">
          Swipe horizontally →
        </span>
      </div>

      <div className={cn('w-full overflow-x-auto no-scrollbar rounded-xl border border-line bg-surface shadow-subtle', className)}>
        <table className="w-full min-w-[620px] text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-subtle/60">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{ width: col.width }}
                  className={cn(
                    'py-3 px-3.5 sm:py-3.5 sm:px-4 text-[10.5px] sm:text-[11px] uppercase tracking-wider font-semibold text-fg-soft select-none whitespace-nowrap',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="py-3 px-3.5 sm:py-4 sm:px-4">
                      <Skeleton className="h-4 w-full max-w-[140px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-fg-soft">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 stroke-[1.5] text-fg-soft/60" />
                    <p className="text-sm font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {rows.map((row, rIdx) => (
                  <motion.tr
                    key={row.id || rIdx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(rIdx * 0.03, 0.3) }}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      'transition-colors duration-150',
                      onRowClick ? 'cursor-pointer hover:bg-surface-subtle/60' : 'hover:bg-surface-subtle/30',
                      row._highlight && 'bg-accent-tint/40'
                    )}
                  >
                    {columns.map((col, cIdx) => (
                      <td
                        key={cIdx}
                        className={cn(
                          'py-3 px-3.5 sm:py-3.5 sm:px-4 text-fg align-middle',
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                          col.className
                        )}
                      >
                        {col.render ? col.render(row, rIdx) : row[col.accessor]}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

