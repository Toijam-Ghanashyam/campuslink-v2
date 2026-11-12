import React from 'react';

export function Stamp({
  label,
  children,
  variant = 'jade',
  className = '',
}) {
  const content = children || label;

  const variantStyles = {
    jade: 'border-emerald-600/60 bg-emerald-950/40 text-emerald-400 shadow-xs shadow-emerald-950/40',
    accent: 'border-indigo-600/60 bg-indigo-950/40 text-indigo-300 shadow-xs shadow-indigo-950/40',
    brick: 'border-rose-600/60 bg-rose-950/40 text-rose-400 shadow-xs shadow-rose-950/40',
    neutral: 'border-line bg-surface text-fg-soft',
  };

  const currentVariant = variantStyles[variant] || variantStyles.jade;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-[10px] uppercase font-bold tracking-widest select-none ${currentVariant} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {content}
    </span>
  );
}

export default Stamp;
