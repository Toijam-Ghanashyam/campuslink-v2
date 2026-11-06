import { useSyncExternalStore } from 'react';

const KEY = 'cl-fx';
const listeners = new Set();
const read = () => {
  try {
    return localStorage.getItem(KEY) || 'full';
  } catch {
    return 'full';
  }
};
let mode = read();

export function setFxMode(next) {
  mode = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

let webglCache;
export function detectWebGL() {
  if (webglCache === undefined) {
    try {
      const c = document.createElement('canvas');
      webglCache = !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      webglCache = false;
    }
  }
  return webglCache;
}

export function useFx() {
  const m = useSyncExternalStore(subscribe, () => mode, () => 'full');
  const reduced =
    typeof matchMedia !== 'undefined' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;
  return { mode: m, setMode: setFxMode, use3d: m === 'full' && detectWebGL() && !reduced };
}
