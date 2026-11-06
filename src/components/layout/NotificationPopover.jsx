import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Clock, CheckCircle2, AlertCircle, FileText, Briefcase } from 'lucide-react';
import { useStore } from '../../lib/store';
import { cn } from '../../lib/utils';

export function NotificationPopover({ open, onClose, role }) {
  const popoverRef = useRef(null);
  const { notifications, markNotificationRead, markAllNotificationsRead } = useStore();
  const roleNotifications = notifications[role] || [];
  const unreadCount = roleNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  const categoryIcons = {
    Shortlisting: CheckCircle2,
    Drives: Briefcase,
    Deadlines: Clock,
    Offers: FileText,
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-0 top-12 w-80 sm:w-96 glass-strong rounded-object border border-line shadow-2xl z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-line flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-base text-fg">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent-tint text-accent-deep font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllNotificationsRead(role)}
                className="text-xs text-fg-soft hover:text-accent-deep flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-line/60">
            {roleNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-soft">
                No notifications right now.
              </div>
            ) : (
              roleNotifications.map((notif) => {
                const Icon = categoryIcons[notif.category] || Bell;
                return (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationRead(role, notif.id)}
                    className={cn(
                      'p-3.5 flex items-start gap-3 transition-colors cursor-pointer',
                      notif.read ? 'bg-paper opacity-80 hover:bg-bone/40' : 'bg-ochre-tint/25 hover:bg-ochre-tint/40'
                    )}
                  >
                    <div className="w-7 h-7 rounded-lg bg-bone border border-line flex items-center justify-center text-ink shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h5 className="text-xs font-semibold text-ink truncate">{notif.title}</h5>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-ochre shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-ink-soft/70">
                        <span className="uppercase tracking-wider font-medium">{notif.category}</span>
                        <span>•</span>
                        <span>{notif.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-bone/40 border-t border-line text-center">
            <span className="text-[11px] text-ink-soft">
              Real-time campus placement event dispatcher
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

