'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Drawer({
  open = false,
  onClose,
  title,
  subtitle,
  width = 'w-full max-w-full sm:max-w-xl',
  children,
  footer,
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <aside
        className={`relative z-10 flex h-full flex-col bg-surface border-l border-line text-fg shadow-2xl transition-transform duration-300 ease-out animate-in slide-in-from-right ${width}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line px-5 py-4 bg-surface/90 backdrop-blur-md sticky top-0 z-10">
          <div className="space-y-1 pr-4">
            {typeof title === 'string' ? (
              <h2 className="text-base font-bold text-fg tracking-tight">{title}</h2>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-xs text-fg-soft font-mono flex items-center gap-1.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-fg-soft hover:bg-slate-800 hover:text-fg transition-colors"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 text-sm">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-line px-5 py-3.5 bg-surface/95 backdrop-blur-sm sticky bottom-0 z-10 flex items-center justify-between gap-3">
            {footer}
          </div>
        )}
      </aside>
    </div>
  );
}

export default Drawer;
