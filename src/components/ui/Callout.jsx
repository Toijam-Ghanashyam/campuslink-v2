import React from 'react';

export function Callout({
  icon,
  title,
  children,
  variant = 'neutral',
  className = '',
}) {
  const variantStyles = {
    accent: 'bg-indigo-950/30 border-indigo-700/40 text-indigo-200',
    jade: 'bg-emerald-950/30 border-emerald-700/40 text-emerald-200',
    brick: 'bg-rose-950/30 border-rose-700/40 text-rose-200',
    neutral: 'bg-slate-900/60 border-line text-fg-soft',
  };

  const currentVariant = variantStyles[variant] || variantStyles.neutral;

  return (
    <div
      className={`rounded-lg border p-3.5 text-xs leading-relaxed flex items-start gap-3 ${currentVariant} ${className}`}
    >
      {icon && <span className="text-base shrink-0 mt-0.5">{icon}</span>}
      <div className="space-y-1 flex-1">
        {title && <h4 className="font-bold text-fg tracking-tight">{title}</h4>}
        <div className="text-xs leading-relaxed text-inherit">{children}</div>
      </div>
    </div>
  );
}

export default Callout;
