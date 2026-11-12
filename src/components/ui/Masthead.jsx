import React from 'react';

export function Masthead({
  context,
  title,
  lede,
  children,
  action,
  className = '',
}) {
  return (
    <header className={`border-b border-slate-800 pb-5 space-y-2 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          {context && (
            <div className="font-mono text-[10px] tracking-widest uppercase font-bold text-indigo-400">
              {context}
            </div>
          )}
          {title && (
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {title}
            </h1>
          )}
          {lede && (
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              {lede}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </header>
  );
}

export default Masthead;
