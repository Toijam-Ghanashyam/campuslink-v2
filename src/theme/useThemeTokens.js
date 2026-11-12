'use client';

import { useEffect, useState } from 'react';
import { tokens } from './tokens.js';

const get = () => {
  if (typeof document !== 'undefined') {
    return tokens[document.documentElement.dataset.theme] || tokens.day;
  }
  return tokens.day;
};

export function useThemeTokens() {
  const [t, setT] = useState(get);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    setT(get());
    const mo = new MutationObserver(() => setT(get()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);
  return t;
}

export const sceneColors = (t) => ({
  a: t.threeA,
  b: t.threeB,
  dust: t.threeDust,
  edge: t.threeEdge,
  additive: t.threeAdditive === '1',
});
