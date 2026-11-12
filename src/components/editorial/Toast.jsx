'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, tone = 'ink', duration = 3200) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, tone }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons = {
    jade: CheckCircle2,
    brick: AlertCircle,
    ochre: AlertTriangle,
    accent: AlertTriangle,
    ink: Info,
  };

  const toneStyles = {
    jade: 'bg-surface text-fg border-jade/40 shadow-hover text-jade',
    brick: 'bg-surface text-fg border-brick/40 shadow-hover text-brick',
    ochre: 'bg-surface text-fg border-accent/50 shadow-hover text-accent-deep dark:text-accent',
    accent: 'bg-surface text-fg border-accent/50 shadow-hover text-accent-deep dark:text-accent',
    ink: 'bg-sidebar text-sidebar-fg border-line shadow-hover',
  };

  return (
    <ToastContext.Provider value={{ toast: addToast, removeToast }}>
      {children}
      {/* Toast Container - Clears Mobile Bottom Navigation Bar (h-16) */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-[70] flex flex-col pointer-events-none gap-2">
        <AnimatePresence>
          {toasts.map((item) => {
            const Icon = icons[item.tone] || Info;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-object border shadow-object text-xs sm:text-sm font-medium w-full',
                  toneStyles[item.tone] || toneStyles.ink
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 stroke-[2]" />
                  <span className="truncate">{item.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(item.id)}
                  className="opacity-60 hover:opacity-100 transition-opacity p-0.5 ml-2 cursor-pointer"
                  aria-label="Close notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;
