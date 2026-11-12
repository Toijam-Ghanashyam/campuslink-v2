'use client';

import React, { useState, useEffect } from 'react';
import { Search, Video, Briefcase, Calendar, ShieldCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CommandPalette({ open, onClose }) {
  let navigate;
  try {
    navigate = useNavigate();
  } catch {
    navigate = (path) => {
      if (typeof window !== 'undefined') window.location.href = path;
    };
  }

  const [query, setQuery] = useState('');

  const COMMANDS = [
    { label: 'Live AI Video Interview Round', path: '/student/ai-interview', icon: Video, category: 'Assessments' },
    { label: 'Active Placement Drives', path: '/student/drives', icon: Briefcase, category: 'Placements' },
    { label: 'Interview Preparation & Company Dossier', path: '/student/interviews', icon: Calendar, category: 'Interviews' },
    { label: 'Student Readiness Overview', path: '/student/overview', icon: ShieldCheck, category: 'Dashboard' },
    { label: 'Recruiter Candidate Pipeline', path: '/recruiter/pipeline', icon: Search, category: 'Recruiter' },
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (onClose) onClose(!open);
      }
      if (e.key === 'Escape' && open && onClose) {
        onClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => onClose(false)} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-line bg-surface text-fg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-3 border-b border-line flex items-center gap-2.5">
          <Search className="w-4 h-4 text-fg-soft ml-1" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search portal..."
            className="w-full bg-transparent text-sm text-fg placeholder:text-fg-soft focus:outline-hidden"
          />
          <button onClick={() => onClose(false)} className="text-fg-soft hover:text-fg p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2 max-h-72 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-fg-soft font-mono">
              No commands found.
            </div>
          ) : (
            filtered.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.path}
                  onClick={() => {
                    navigate(cmd.path);
                    onClose(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/80 text-left transition-colors"
                >
                  <span className="flex items-center gap-2.5 text-xs text-fg">
                    <Icon className="w-4 h-4 text-indigo-400" />
                    <span>{cmd.label}</span>
                  </span>
                  <span className="font-mono text-[10px] text-fg-soft uppercase">
                    {cmd.category}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;

