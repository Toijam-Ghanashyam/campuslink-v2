import React from 'react';

export function Skeleton({
  className = '',
  statusLine,
  lines = 1,
}) {
  return (
    <div className="space-y-3 w-full">
      {statusLine && (
        <div className="flex items-center gap-2 py-1">
          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping shrink-0" />
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-indigo-300 animate-pulse">
            {statusLine}
          </span>
        </div>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-md bg-slate-800/70 border border-line/40 ${className || 'h-4 w-full'}`}
        />
      ))}
    </div>
  );
}

export default Skeleton;
