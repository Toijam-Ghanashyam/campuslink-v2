import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';

export function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const isNight = theme === 'night';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch theme"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control border border-line bg-surface text-fg hover:border-fg/40 transition-colors text-xs font-mono font-medium select-none cursor-pointer ${className}`}
    >
      {isNight ? (
        <>
          <Moon className="w-3.5 h-3.5 text-accent fill-accent/20" />
          <span className="text-[11px] uppercase tracking-wider">NIGHT</span>
        </>
      ) : (
        <>
          <Sun className="w-3.5 h-3.5 text-accent fill-accent/20" />
          <span className="text-[11px] uppercase tracking-wider">DAY</span>
        </>
      )}
    </button>
  );
}

