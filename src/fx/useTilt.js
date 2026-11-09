import { useRef, useCallback } from 'react';

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarseOrTouch = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  (window.matchMedia('(hover: none)').matches || window.matchMedia('(pointer: coarse)').matches);

export function useTilt({ max = 6 } = {}) {
  const ref = useRef(null);
  const onPointerMove = useCallback((e) => {
    if (reduced() || isCoarseOrTouch()) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${((0.5 - py) * max * 2).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((px - 0.5) * max * 2).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
  }, [max]);

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}

export function useMagnetic({ strength = 0.25, radius = 90 } = {}) {
  const ref = useRef(null);
  const onPointerMove = useCallback((e) => {
    if (reduced() || isCoarseOrTouch()) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) > Math.max(r.width, r.height) / 2 + radius) return;
    el.style.transform = `translate(${(dx * strength).toFixed(1)}px, ${(dy * strength).toFixed(1)}px)`;
  }, [strength, radius]);

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (el) el.style.transform = '';
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}
