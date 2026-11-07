import { createContext, useContext, useState, useCallback } from 'react';
import { flushSync } from 'react-dom';

const Ctx = createContext(null);
const KEY = 'cl-theme';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => document.documentElement.dataset.theme || 'day');

  const apply = useCallback((t) => {
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* ignore */
    }
    setThemeState(t);
  }, []);

  const toggle = useCallback(async (e) => {
    const next = theme === 'night' ? 'day' : 'night';
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduce || !e) {
      apply(next);
      return;
    }
    const x = e.clientX ?? window.innerWidth / 2;
    const y = e.clientY ?? 0;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const vt = document.startViewTransition(() => {
      flushSync(() => apply(next));
    });
    await vt.ready;
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 650, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
    );
  }, [theme, apply]);

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
