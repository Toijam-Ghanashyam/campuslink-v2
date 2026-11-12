import React from 'react';

export function MarginNote({
  label,
  children,
  className = '',
}) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {label && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
            {label}
          </span>
          <div className="h-px flex-1 bg-line/80" />
        </div>
      )}
      {children && <div className="text-fg-soft text-xs leading-relaxed">{children}</div>}
    </div>
  );
}

export default MarginNote;
