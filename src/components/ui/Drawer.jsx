import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Drawer({
  open = false,
  onClose,
  title,
  subtitle,
  width = 'max-w-xl',
  children,
  footer,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed top-14 inset-x-0 bottom-0 z-50 flex justify-end pointer-events-none">
          {/* Backdrop with clearance below navbar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed top-14 inset-x-0 bottom-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm cursor-pointer pointer-events-auto"
          />

          {/* Drawer Surface */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className={cn(
              'relative w-full bg-surface h-full shadow-2xl flex flex-col z-10 border-l border-line pointer-events-auto',
              width
            )}
          >
            {/* Header with generous top space from navbar */}
            <div className="flex items-center justify-between px-6 pt-7 pb-5 border-b border-line bg-surface/95 backdrop-blur-sm shrink-0">
              <div>
                <h3 className="font-display font-semibold text-xl text-fg">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-fg-soft mt-1 leading-normal">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-fg-soft hover:text-fg hover:bg-bg transition-colors shrink-0 ml-4"
              >
                <X className="w-5 h-5 stroke-[1.75]" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-6 border-t border-line bg-bg/40 shrink-0 flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
