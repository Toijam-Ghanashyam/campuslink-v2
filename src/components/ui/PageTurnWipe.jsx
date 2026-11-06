import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const PageTurnWipe = forwardRef(function PageTurnWipe({ onComplete }, ref) {
  const [animating, setAnimating] = useState(false);
  const [phase, setPhase] = useState('idle'); // 'covering', 'uncovering', 'idle'

  useImperativeHandle(ref, () => ({
    start(callback) {
      const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        callback();
        return;
      }
      setAnimating(true);
      setPhase('covering');

      // 380ms to cover
      setTimeout(() => {
        callback();
        setPhase('uncovering');
        // 380ms to uncover
        setTimeout(() => {
          setAnimating(false);
          setPhase('idle');
          if (onComplete) onComplete();
        }, 380);
      }, 380);
    },
  }));

  if (!animating) return null;

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none overflow-hidden">
      <motion.div
        className="w-full h-full bg-sidebar border-r-2 border-accent"
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{
          clipPath: phase === 'covering' ? 'inset(0 0% 0 0)' : 'inset(0 0 0 100%)',
        }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
});

