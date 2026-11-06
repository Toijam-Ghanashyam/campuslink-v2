import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Button = React.forwardRef(({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  children,
  className,
  disabled,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-sans font-medium rounded-control transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre disabled:opacity-40 disabled:pointer-events-none select-none tracking-wide text-xs';

  const sizeStyles = {
    sm: 'h-7 px-2.5 text-[11px] gap-1.5',
    md: 'h-9 px-3.5 text-xs gap-2',
    lg: 'h-11 px-5 text-sm gap-2.5',
  };

  const variantStyles = {
    primary: 'btn-primary bg-btn text-btn-fg hover:bg-btn/90 active:scale-[0.98]',
    secondary: 'bg-surface text-fg border border-line hover:border-fg/40 hover:bg-bg/40 active:scale-[0.98]',
    ghost: 'text-fg hover:bg-bg/80',
    success: 'bg-jade text-surface hover:bg-jade/90',
    danger: 'bg-brick text-surface hover:bg-brick/90',
    accent: 'bg-accent text-btn-fg hover:bg-accent/90 font-semibold',
  };

  return (
    <motion.button
      ref={ref}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      disabled={disabled || loading}
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
      ) : Icon ? (
        <Icon className={cn('stroke-[1.75]', size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
});

Button.displayName = 'Button';
