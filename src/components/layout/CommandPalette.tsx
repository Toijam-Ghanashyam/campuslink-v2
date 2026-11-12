'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowRight,
  User,
  Shield,
  Briefcase,
  Calendar,
  Code2,
  Radio,
  Users,
} from 'lucide-react';

export function CommandPalette({
  open,
  onClose,
  currentRole,
}: {
  open: boolean;
  onClose: () => void;
  currentRole?: string;
}) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const allActions = [
    // Student Routes
    { title: 'Student Dashboard & Offer Acceptance', path: '/student', role: 'student', icon: User, category: 'Student Portal' },
    { title: 'Browse Active Placement Drives (PEP + AI Match)', path: '/student/drives', role: 'student', icon: Calendar, category: 'Student Portal' },
    { title: 'Candidate Live Dispatch Pager Board', path: '/student/live-status', role: 'student', icon: Radio, category: 'Student Portal' },
    { title: 'Native Remediation Studio & Monaco Sandbox', path: '/student/remediation', role: 'student', icon: Code2, category: 'Student Portal' },
    // Recruiter Routes
    { title: 'Corporate Recruiter Hub & AI JD Extractor', path: '/recruiter', role: 'recruiter', icon: Briefcase, category: 'Recruiter Desk' },
    { title: 'Enterprise Drive-Day War Room & Panel Dispatch', path: '/recruiter/war-room', role: 'recruiter', icon: Users, category: 'Recruiter Desk' },
    // Admin Routes
    { title: 'TPO Verification Queue & PEP Lock Console', path: '/admin?tab=students', role: 'admin', icon: Shield, category: 'TPO Admin' },
    { title: 'Manage & Publish Institutional Drives', path: '/admin?tab=drives', role: 'admin', icon: Calendar, category: 'TPO Admin' },
    { title: 'Curriculum & Market Skill Deficits', path: '/admin?tab=curriculum', role: 'admin', icon: Code2, category: 'TPO Admin' },
  ];

  const filtered = allActions.filter(
    (action) =>
      (!currentRole || action.role === currentRole) &&
      (action.title.toLowerCase().includes(query.toLowerCase()) ||
        action.category.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelect = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-24 px-3 sm:px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-fg/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl glass-strong rounded-object border border-line shadow-2xl overflow-hidden z-10"
          >
            <div className="flex items-center gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5 border-b border-line">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-fg-soft stroke-[1.75] shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search portal modules, drives, or studio... (Esc to exit)"
                className="flex-1 bg-transparent text-sm text-fg placeholder:text-fg-soft/60 focus:outline-none min-h-[36px]"
              />
              <span className="hidden sm:inline-flex font-mono text-[11px] font-medium text-fg-soft bg-bg px-2 py-0.5 rounded border border-line select-none">
                ESC
              </span>
            </div>

            <div className="max-h-72 sm:max-h-80 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-xs text-fg-soft">
                  No matching commands found for &ldquo;{query}&rdquo;.
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelect(item.path)}
                      className="w-full flex items-center justify-between p-2.5 rounded-control text-left hover:bg-bg/80 group transition-colors min-h-[44px] cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-control bg-bg flex items-center justify-center text-fg group-hover:bg-accent-tint group-hover:text-accent-deep transition-colors shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-fg truncate">{item.title}</p>
                          <p className="text-[11px] text-fg-soft">{item.category}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-fg-soft group-hover:text-accent-ink opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all shrink-0 ml-2" />
                    </button>
                  );
                })
              )}
            </div>

            <div className="px-4 py-2.5 bg-bg/40 border-t border-line font-mono text-[11px] text-fg-soft flex items-center justify-between">
              <span>CampusLink v2.0 Enterprise OS</span>
              <span>Role-Scoped Navigation</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

