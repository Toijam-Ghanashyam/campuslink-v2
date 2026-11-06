import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function IntroOverlay() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    try {
      if (!sessionStorage.getItem('cl-intro')) {
        sessionStorage.setItem('cl-intro', '1');
        setShow(true);
      }
    } catch {
      // fallback
    }
  }, []);

  const dismiss = () => setShow(false);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => setShow(false), 1450);
    const handleKey = () => dismiss();
    window.addEventListener('keydown', handleKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onClick={dismiss}
          className="fixed inset-0 z-[100] bg-bg flex flex-col items-center justify-center cursor-pointer select-none"
        >
          <div className="flex flex-col items-center space-y-3">
            <span className="font-display font-medium text-5xl sm:text-6xl text-fg tracking-tight">
              CampusLink<span className="text-accent font-bold">.register</span>
            </span>
            <svg width="240" height="4" viewBox="0 0 240 4" className="overflow-visible">
              <motion.line
                x1="0"
                y1="2"
                x2="240"
                y2="2"
                stroke="rgb(var(--c-accent))"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-fg-soft pt-2">
              Institutional Placement Register · Initializing
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

