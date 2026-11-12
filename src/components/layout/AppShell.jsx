'use client';

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  Radio,
  Sparkles,
  Video,
  Users,
  Shield,
  GraduationCap,
  Bell,
  Search,
  Menu,
  X,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { Badge } from '../ui/badge';

export const roleNavItems = {
  student: [
    { num: '01', to: '/student/overview', label: 'Overview', icon: LayoutDashboard },
    { num: '02', to: '/student/drives', label: 'Placement Drives', icon: Briefcase },
    { num: '03', to: '/student/interviews', label: 'Interviews & Prep', icon: Calendar },
    { num: '04', to: '/student/live-status', label: 'Live Status', icon: Radio },
    { num: '05', to: '/student/remediation', label: 'Skill Remediation', icon: Sparkles },
    { num: '06', to: '/student/ai-interview', label: 'AI Video Round', icon: Video },
  ],
  recruiter: [
    { num: '01', to: '/recruiter/pipeline', label: 'Candidate Pipeline', icon: Users },
    { num: '02', to: '/recruiter/war-room', label: 'Drive-Day War Room', icon: Shield },
  ],
};

export function AppShell({ children, role = 'student' }) {
  let location;
  try {
    location = useLocation();
  } catch {
    location = { pathname: typeof window !== 'undefined' ? window.location.pathname : '/' };
  }

  const { currentStudent = {}, notifications = {} } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = roleNavItems[role] || roleNavItems.student;
  const unreadCount = (notifications[role] || []).length;

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Portal Switcher */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 font-bold">
                CL
              </div>
              <div>
                <span className="font-display font-bold text-base tracking-tight text-fg">
                  CampusLink
                </span>
                <span className="ml-1 text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-700/60">
                  v2.0
                </span>
              </div>
            </Link>

            <span className="text-fg-soft font-mono text-xs hidden sm:inline">•</span>

            <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider text-fg-soft">
              {role === 'student' ? 'Student Portal' : 'Enterprise Recruiter Portal'}
            </span>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-fg-soft hover:text-fg hover:bg-surface/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Notification Badge */}
            <div className="relative">
              <button
                className="w-8 h-8 rounded-lg border border-line bg-surface flex items-center justify-center text-fg-soft hover:text-fg hover:border-slate-700 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Avatar & Info */}
            <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-line">
              <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-700/60 flex items-center justify-center font-bold text-xs text-indigo-300">
                {(currentStudent.name || currentStudent.full_name || 'U').charAt(0)}
              </div>
              <div className="text-left text-xs">
                <div className="font-semibold text-fg leading-tight">
                  {currentStudent.name || currentStudent.full_name || 'Student'}
                </div>
                <div className="text-[10px] font-mono text-fg-soft">
                  {currentStudent.roll_number || currentStudent.rollNumber || 'TU-2024'}
                </div>
              </div>
            </div>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg border border-line text-fg-soft hover:text-fg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-line bg-surface/95 backdrop-blur-md p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-fg-soft hover:text-fg hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-line py-4 px-6 text-center text-xs font-mono text-fg-soft bg-surface/50">
        CampusLink v2.0 Autonomous Placement Readiness Engine · Tech University
      </footer>
    </div>
  );
}

export default AppShell;
