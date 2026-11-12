import React from 'react';

export function Tag({
  label,
  children,
  variant = 'neutral',
  icon,
  className = '',
}) {
  const content = children || label;

  const variantStyles = {
    jade: 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300 font-medium',
    accent: 'bg-indigo-950/60 border-indigo-700/50 text-indigo-300 font-medium',
    brick: 'bg-rose-950/60 border-rose-700/50 text-rose-300 font-medium',
    neutral: 'bg-slate-900 border-line text-fg-soft font-normal',
  };

  const currentVariant = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] leading-tight select-none transition-colors ${currentVariant} ${className}`}
    >
      {icon && <span className="shrink-0 text-current">{icon}</span>}
      <span>{content}</span>
    </span>
  );
}

export default Tag;
