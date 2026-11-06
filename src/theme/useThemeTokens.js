import { useEffect, useState } from 'react';
import { tokens } from './tokens.js';
const get = () => tokens[document.documentElement.dataset.theme] || tokens.day;
export function useThemeTokens() {
  const [t, setT] = useState(get);
  useEffect(() => {
    const mo = new MutationObserver(() => setT(get()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);
  return t;
}
export const sceneColors = (t) => ({ a: t.threeA, b: t.threeB, dust: t.threeDust, edge: t.threeEdge, additive: t.threeAdditive === '1' });

