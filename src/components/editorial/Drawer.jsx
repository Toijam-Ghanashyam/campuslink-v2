'use client';

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
  width = 'w-full max-w-full sm:max-w-md md:max-w-lg',
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
            className="fixed top-14 inset-x-0 bottom-0 bg-black/50 backdrop-blur-xs cursor-pointer pointer-events-auto"
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
            <div className="flex items-center justify-between px-4 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5 border-b border-line bg-surface/95 backdrop-blur-sm shrink-0">
              <div className="min-w-0 flex-1 pr-3">
                <h3 className="font-display font-semibold text-lg sm:text-xl text-fg truncate">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-fg-soft mt-1 leading-normal truncate">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-control border border-line bg-surface hover:bg-surface/80 flex items-center justify-center text-fg-soft hover:text-fg transition cursor-pointer shrink-0"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-sm text-fg">
              {children}
            </div>

            {/* Optional Footer */}
            {footer && (
              <div className="p-4 sm:p-6 border-t border-line bg-surface/95 backdrop-blur-sm shrink-0">
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

export default Drawer;
