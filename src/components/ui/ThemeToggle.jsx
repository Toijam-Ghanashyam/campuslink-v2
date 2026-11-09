import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';
import { useStore } from '../../lib/store';

export function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const { markThemeToggled } = useStore();
  const isNight = theme === 'night';

  const handleClick = (e) => {
    markThemeToggled?.();
    toggle(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isNight ? 'Switch to Day Mode' : 'Switch to Night Mode'}
      aria-label={isNight ? 'Switch to Day Mode' : 'Switch to Night Mode'}
      className={`w-8 h-8 rounded-control border border-line bg-surface hover:bg-surface/80 flex items-center justify-center text-fg hover:border-fg/40 transition-colors select-none cursor-pointer min-h-[36px] min-w-[36px] shrink-0 ${className}`}
    >
      {isNight ? (
        <Moon className="w-4 h-4 text-accent fill-accent/20" />
      ) : (
        <Sun className="w-4 h-4 text-accent-ink fill-accent-ink/20" />
      )}
    </button>
  );
}

export default ThemeToggle;
