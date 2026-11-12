import React from 'react';

export function Stamp({
  label,
  children,
  variant,
  tone,
  className = '',
}) {
  const content = children || label;
  const currentTone = tone || variant || 'jade';

  const toneStyles = {
    jade: 'border-emerald-600/60 bg-emerald-950/40 text-emerald-400 shadow-xs shadow-emerald-950/40',
    accent: 'border-indigo-600/60 bg-indigo-950/40 text-indigo-300 shadow-xs shadow-indigo-950/40',
    brick: 'border-rose-600/60 bg-rose-950/40 text-rose-400 shadow-xs shadow-rose-950/40',
    ochre: 'border-amber-600/60 bg-amber-950/40 text-amber-400 shadow-xs shadow-amber-950/40',
    ink: 'border-slate-700/80 bg-slate-900/60 text-slate-300 shadow-xs',
    neutral: 'border-line bg-surface text-fg-soft',
  };

  const currentStyle = toneStyles[currentTone] || toneStyles.jade;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-[10px] uppercase font-bold tracking-widest select-none ${currentStyle} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {content}
    </span>
  );
}

export default Stamp;
