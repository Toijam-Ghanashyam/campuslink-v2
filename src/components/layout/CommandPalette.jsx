import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, User, Shield, Briefcase, Calendar, CheckSquare, AlertTriangle, Layers } from 'lucide-react';

export function CommandPalette({ open, onClose, currentRole }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
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
    // Student
    { title: 'Student Dashboard & Readiness Score', path: '/student/overview', role: 'student', icon: User, category: 'Navigation' },
    { title: 'Profile & Resume Verification', path: '/student/profile', role: 'student', icon: CheckSquare, category: 'Navigation' },
    { title: 'Browse Active Placement Drives', path: '/student/drives', role: 'student', icon: Calendar, category: 'Navigation' },
    { title: 'Track Applications & Match Explanations', path: '/student/applications', role: 'student', icon: Layers, category: 'Navigation' },
    { title: 'Upcoming Interview Schedule', path: '/student/interviews', role: 'student', icon: Calendar, category: 'Navigation' },
    // Admin
    { title: 'Placement Command Center Analytics', path: '/admin/command-center', role: 'admin', icon: Shield, category: 'Admin' },
    { title: 'Student Verification Queue', path: '/admin/verification', role: 'admin', icon: CheckSquare, category: 'Admin' },
    { title: 'Placement Drives & Conflict Resolution', path: '/admin/drives', role: 'admin', icon: Calendar, category: 'Admin' },
    { title: 'Early Warning & At-Risk Candidates', path: '/admin/at-risk', role: 'admin', icon: AlertTriangle, category: 'Admin' },
    { title: 'Offers & Document Verification', path: '/admin/offers', role: 'admin', icon: Briefcase, category: 'Admin' },
    // Recruiter
    { title: 'Talent Acquisition Dashboard', path: '/recruiter/overview', role: 'recruiter', icon: Briefcase, category: 'Recruiter' },
    { title: 'Candidate Pipeline & AI Match Ranking', path: '/recruiter/pipeline', role: 'recruiter', icon: User, category: 'Recruiter' },
    { title: 'Schedule Interview Slots', path: '/recruiter/slots', role: 'recruiter', icon: Calendar, category: 'Recruiter' },
    { title: 'Hiring Analytics & Funnel Breakdown', path: '/recruiter/analytics', role: 'recruiter', icon: Layers, category: 'Recruiter' },
  ];

  const filtered = allActions.filter(
    (action) =>
      action.title.toLowerCase().includes(query.toLowerCase()) ||
      action.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path) => {
    navigate(path);
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
            {/* Input Bar */}
            <div className="flex items-center gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5 border-b border-line">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-fg-soft stroke-[1.75] shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands, portals, drives... (Esc to exit)"
                className="flex-1 bg-transparent text-sm text-fg placeholder:text-fg-soft/60 focus:outline-none min-h-[36px]"
              />
              <span className="hidden sm:inline-flex text-[11px] font-medium text-fg-soft bg-bg px-2 py-0.5 rounded border border-line select-none">
                ESC
              </span>
            </div>

            {/* Results */}
            <div className="max-h-72 sm:max-h-80 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-xs text-fg-soft">
                  No matching commands found for "{query}".
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelect(item.path)}
                      className="w-full flex items-center justify-between p-2.5 rounded-control text-left hover:bg-bg/80 group transition-colors min-h-[44px]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-control bg-bg flex items-center justify-center text-fg group-hover:bg-accent-tint group-hover:text-accent-deep transition-colors shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-fg truncate">{item.title}</p>
                          <p className="text-[11px] text-fg-soft capitalize">{item.category}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-fg-soft group-hover:text-accent-ink opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all shrink-0 ml-2" />
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-bg/40 border-t border-line text-[11px] text-fg-soft flex items-center justify-between">
              <span className="hidden sm:inline">Navigate with arrow keys</span>
              <span className="text-[10px] sm:text-[11px] truncate">CampusLink AI Global Command</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

