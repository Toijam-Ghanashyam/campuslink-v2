import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UserCheck,
  CalendarDays,
  FileSpreadsheet,
  Video,
  BarChart3,
  CheckCheck,
  Building2,
  Calendar,
  AlertTriangle,
  Award,
  Briefcase,
  Users,
  CalendarClock,
  PieChart,
  Search,
  Bell,
  Sparkles,
  ArrowUpRight,
  Menu,
  X,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { CommandPalette } from './CommandPalette';
import { NotificationPopover } from './NotificationPopover';
import { cn } from '../../lib/utils';

export function AppShell({ role = 'student', children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentStudent, notifications } = useStore();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const roleNotifications = notifications[role] || [];
  const unreadCount = roleNotifications.filter((n) => !n.read).length;

  const roleNavItems = {
    student: [
      { to: '/student/overview', label: 'Readiness Dashboard', icon: LayoutDashboard },
      { to: '/student/profile', label: 'Profile & Resume', icon: UserCheck },
      { to: '/student/drives', label: 'Placement Drives', icon: CalendarDays },
      { to: '/student/applications', label: 'My Applications', icon: FileSpreadsheet },
      { to: '/student/interviews', label: 'Interviews', icon: Video },
    ],
    admin: [
      { to: '/admin/command-center', label: 'Command Center', icon: BarChart3 },
      { to: '/admin/verification', label: 'Verification Queue', icon: CheckCheck },
      { to: '/admin/recruiters', label: 'Recruiter Partners', icon: Building2 },
      { to: '/admin/drives', label: 'Drives Calendar', icon: Calendar },
      { to: '/admin/at-risk', label: 'At-Risk Analytics', icon: AlertTriangle },
      { to: '/admin/offers', label: 'Offers & Joining', icon: Award },
    ],
    recruiter: [
      { to: '/recruiter/overview', label: 'Talent Overview', icon: LayoutDashboard },
      { to: '/recruiter/jobs', label: 'Active Job Postings', icon: Briefcase },
      { to: '/recruiter/pipeline', label: 'Candidate Pipeline', icon: Users, badge: 'AI Match' },
      { to: '/recruiter/slots', label: 'Interview Slots', icon: CalendarClock },
      { to: '/recruiter/analytics', label: 'Hiring Analytics', icon: PieChart },
    ],
  };

  const navItems = roleNavItems[role] || roleNavItems.student;

  const tenantDetails = {
    student: {
      title: 'BPUT Student Portal',
      subtitle: 'Batch of 2026 · Computer Science',
      avatar: 'AS',
      name: currentStudent.name,
    },
    admin: {
      title: 'BPUT Central Placement Cell',
      subtitle: 'Directorate of Career Development',
      avatar: 'AD',
      name: 'Dr. S. K. Mohapatra',
    },
    recruiter: {
      title: 'Microsoft India TA',
      subtitle: 'University Campus Hiring 2026',
      avatar: 'MS',
      name: 'R. Venkatesh',
    },
  };

  const currentTenant = tenantDetails[role];

  const handleRoleSwitch = (newRole) => {
    if (newRole === role) return;
    if (newRole === 'student') navigate('/student/overview');
    if (newRole === 'admin') navigate('/admin/command-center');
    if (newRole === 'recruiter') navigate('/recruiter/overview');
  };

  return (
    <div className="min-h-screen bg-bone flex flex-col antialiased">
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        currentRole={role}
      />

      {/* Top Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-md border-b border-line h-16 flex items-center justify-between px-4 sm:px-6">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-ink hover:bg-bone transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-ink flex items-center justify-center text-ochre shadow-subtle group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 fill-current stroke-none" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-bold text-xl tracking-tight text-ink">CampusLink</span>
              <span className="w-1.5 h-1.5 rounded-full bg-ochre inline-block" />
            </div>
          </NavLink>

          <div className="hidden sm:block h-4 w-px bg-line mx-2" />

          {/* Tenant Sub-Title */}
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold text-ink leading-none">{currentTenant.title}</span>
            <span className="text-[10px] text-ink-soft leading-none mt-1">{currentTenant.subtitle}</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl border border-line bg-bone/60 hover:bg-bone hover:border-line/80 text-ink-soft text-xs transition-all w-64 lg:w-72 select-none group"
          >
            <Search className="w-3.5 h-3.5 text-ink-soft group-hover:text-ink transition-colors" />
            <span className="flex-1 text-left">Search or run command...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-paper border border-line text-[10px] font-mono text-ink-soft shadow-subtle">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Action Stack: Demo Role Switcher + Notifs + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Demo Role Switcher Segmented Control */}
          <div className="bg-bone p-1 rounded-xl border border-line flex items-center text-xs font-medium">
            <button
              type="button"
              onClick={() => handleRoleSwitch('student')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-all',
                role === 'student' ? 'bg-paper text-ink shadow-subtle font-semibold' : 'text-ink-soft hover:text-ink'
              )}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('admin')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-all',
                role === 'admin' ? 'bg-paper text-ink shadow-subtle font-semibold' : 'text-ink-soft hover:text-ink'
              )}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('recruiter')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-all',
                role === 'recruiter' ? 'bg-paper text-ink shadow-subtle font-semibold' : 'text-ink-soft hover:text-ink'
              )}
            >
              Recruiter
            </button>
          </div>

          {/* Notifications Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative w-9 h-9 rounded-xl border border-line bg-paper hover:bg-bone/80 flex items-center justify-center text-ink transition-colors"
            >
              <Bell className="w-4 h-4 stroke-[1.75]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-ochre ring-2 ring-paper" />
              )}
            </button>
            <NotificationPopover
              open={notifOpen}
              onClose={() => setNotifOpen(false)}
              role={role}
            />
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-8 h-8 rounded-xl bg-ink text-bone font-medium text-xs flex items-center justify-center shadow-subtle select-none">
              {currentTenant.avatar}
            </div>
          </div>
        </div>
      </header>

      {/* Main Body with Fixed Sidebar + Content */}
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
        {/* Left Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-ink text-bone border-r border-ink/40 shrink-0 sticky top-16 h-[calc(100vh-4rem)] p-4 justify-between">
          <div>
            <div className="px-3 py-2 mb-3">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-bone/50">
                Navigation
              </span>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group select-none',
                      isActive
                        ? 'text-bone bg-white/10 font-semibold shadow-inner'
                        : 'text-bone/70 hover:text-bone hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn('w-4 h-4 stroke-[1.75]', isActive ? 'text-ochre' : 'text-bone/60 group-hover:text-bone')} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-ochre-tint text-ochre-deep font-semibold">
                        {item.badge}
                      </span>
                    )}

                    {isActive && (
                      <motion.div
                        layoutId="sidebarActiveMarker"
                        className="absolute left-0 top-2 bottom-2 w-1 bg-ochre rounded-r-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[11px] text-bone/60">
            <div className="flex items-center justify-between text-bone/80 font-medium mb-1">
              <span>BPUT PS10</span>
              <span className="text-ochre">v1.2 Live</span>
            </div>
            <p className="line-clamp-2 text-[10px]">
              AI Campus-to-Corporate Placement & Matching Engine
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: -200 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-64 bg-ink z-50 p-4 flex flex-col justify-between shadow-2xl pt-20"
            >
              <div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                          isActive ? 'bg-white/10 text-bone font-semibold' : 'text-bone/70 hover:text-bone'
                        )}
                      >
                        <Icon className={cn('w-4 h-4', isActive ? 'text-ochre' : 'text-bone/60')} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 bg-white/10 text-bone text-xs rounded-xl"
              >
                Close Menu
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-[1180px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

