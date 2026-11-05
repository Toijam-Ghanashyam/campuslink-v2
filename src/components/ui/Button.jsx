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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre disabled:opacity-50 disabled:pointer-events-none select-none text-sm tracking-wide';

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-ink text-bone hover:bg-ink/90 shadow-subtle',
    secondary: 'bg-paper text-ink border border-line hover:bg-bone/60 shadow-subtle',
    ghost: 'text-ink hover:bg-bone/80',
    success: 'bg-jade text-paper hover:bg-jade/90 shadow-subtle',
    danger: 'bg-brick text-paper hover:bg-brick/90 shadow-subtle',
    accent: 'bg-ochre text-ink hover:bg-ochre/90 font-semibold shadow-subtle',
  };

  return (
    <motion.button
      ref={ref}
      whileHover={disabled || loading ? {} : { y: -2 }}
      whileTap={disabled || loading ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      disabled={disabled || loading}
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className={cn('stroke-[1.75]', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
});

Button.displayName = 'Button';

