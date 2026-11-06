import React, { useState, useRef } from 'react';
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
  Menu,
  X,
  Cpu,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { CommandPalette } from './CommandPalette';
import { NotificationPopover } from './NotificationPopover';
import { JudgeGuide } from './JudgeGuide';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Backdrop } from '../ui/Backdrop';
import { PageTurnWipe } from '../ui/PageTurnWipe';
import { useTheme } from '../../theme/ThemeProvider';
import { cn } from '../../lib/utils';

export function AppShell({ role = 'student', children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isNight = theme === 'night';
  const { currentStudent, notifications } = useStore();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const roleNotifications = notifications[role] || [];
  const unreadCount = roleNotifications.filter((n) => !n.read).length;

  const roleNavItems = {
    student: [
      { num: '01', to: '/student/overview', label: 'Readiness & Diagnostic', icon: LayoutDashboard },
      { num: '02', to: '/student/profile', label: 'Academic Record & Skills', icon: UserCheck },
      { num: '03', to: '/student/drives', label: 'Placement Drives', icon: CalendarDays },
      { num: '04', to: '/student/applications', label: 'Applications & Offers', icon: FileSpreadsheet },
      { num: '05', to: '/student/interviews', label: 'Interview Calendar', icon: Video },
    ],
    admin: [
      { num: '01', to: '/admin/command-center', label: 'Command Center', icon: BarChart3 },
      { num: '02', to: '/admin/verification', label: 'Verification Queue', icon: CheckCheck },
      { num: '03', to: '/admin/recruiters', label: 'Recruiter Partners', icon: Building2 },
      { num: '04', to: '/admin/drives', label: 'Drives & Clash Resolver', icon: Calendar },
      { num: '05', to: '/admin/at-risk', label: 'At-Risk Early Warning', icon: AlertTriangle },
      { num: '06', to: '/admin/offers', label: 'Offers & Compliance', icon: Award },
    ],
    recruiter: [
      { num: '01', to: '/recruiter/overview', label: 'Talent Overview', icon: LayoutDashboard },
      { num: '02', to: '/recruiter/jobs', label: 'Active Job Postings', icon: Briefcase },
      { num: '03', to: '/recruiter/pipeline', label: 'Candidate Pipeline', icon: Users, badge: 'AI Match' },
      { num: '04', to: '/recruiter/slots', label: 'Interview Slots Grid', icon: CalendarClock },
      { num: '05', to: '/recruiter/analytics', label: 'Hiring Analytics', icon: PieChart },
    ],
  };

  const navItems = roleNavItems[role] || roleNavItems.student;

  const tenantDetails = {
    student: {
      tag: '01 · STUDENT DESK',
      title: 'BPUT Central Student Hub',
      sub: 'Roll 220101045 · CSE',
      avatar: 'AS',
    },
    admin: {
      tag: '02 · PLACEMENT DIRECTORATE',
      title: 'BPUT Central Campus',
      sub: '42 Active Corporate Partners',
      avatar: 'AD',
    },
    recruiter: {
      tag: '03 · CORPORATE TA DESK',
      title: 'Microsoft India TA Portal',
      sub: 'Associate SDE Drive 2026',
      avatar: 'MS',
    },
  };

  const currentTenant = tenantDetails[role];
  const wipeRef = useRef(null);

  const handleRoleSwitch = (newRole) => {
    if (newRole === role) return;
    const dest =
      newRole === 'student'
        ? '/student/overview'
        : newRole === 'admin'
        ? '/admin/command-center'
        : '/recruiter/overview';

    if (wipeRef.current) {
      wipeRef.current.start(() => navigate(dest));
    } else {
      navigate(dest);
    }
  };

  return (
    <div
      className={cn(
        'min-h-screen text-fg flex flex-col antialiased relative',
        isNight ? 'bg-transparent' : 'bg-bg'
      )}
    >
      <PageTurnWipe ref={wipeRef} />
      <Backdrop />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        currentRole={role}
      />

      {/* Floating Judge Guide */}
      <JudgeGuide />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-line h-14 flex items-center justify-between px-4 sm:px-6">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-control text-fg hover:bg-surface/50 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <NavLink to="/" className="flex items-baseline gap-1 group select-none">
            <span className="font-display font-medium text-xl text-fg tracking-tight">CampusLink</span>
            <span className="font-mono text-xs text-accent font-bold">.register</span>
          </NavLink>

          <div className="hidden sm:block h-3.5 w-px bg-line mx-2" />

          {/* Institutional Tenant Label */}
          <div className="hidden sm:flex flex-col">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] font-semibold text-accent-deep leading-none">
              {currentTenant.tag}
            </span>
            <span className="font-sans text-xs font-semibold text-fg leading-tight mt-0.5">
              {currentTenant.title} <span className="font-normal text-fg-soft">({currentTenant.sub})</span>
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2.5 px-3 py-1 rounded-control border border-line bg-surface/40 hover:bg-surface hover:border-fg/40 text-fg-soft text-xs transition-all w-60 lg:w-72 select-none"
          >
            <Search className="w-3.5 h-3.5 text-fg-soft" />
            <span className="flex-1 text-left font-sans text-xs">Search or type a command...</span>
            <kbd className="px-1.5 py-0.5 rounded-xs bg-surface border border-line font-mono text-[10px] text-fg-soft">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Action Stack: ThemeToggle + Demo Role Switcher + Notifs + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {/* Demo Role Switcher */}
          <div className="bg-surface/80 p-0.5 rounded-control border border-line flex items-center font-mono text-[11px] uppercase tracking-wider">
            {['student', 'admin', 'recruiter'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleSwitch(r)}
                className={cn(
                  'px-2.5 py-1 rounded-xs transition-all font-semibold select-none',
                  role === r
                    ? 'bg-btn text-btn-fg shadow-xs'
                    : 'text-fg-soft hover:text-fg'
                )}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Notifications Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative w-8 h-8 rounded-control border border-line bg-surface hover:bg-surface/80 flex items-center justify-center text-fg transition-colors"
            >
              <Bell className="w-3.5 h-3.5 stroke-[1.75]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </button>
            <NotificationPopover
              open={notifOpen}
              onClose={() => setNotifOpen(false)}
              role={role}
            />
          </div>

          {/* User Profile Avatar */}
          <div className="w-7 h-7 rounded-full bg-sidebar text-sidebar-fg font-mono text-xs font-semibold flex items-center justify-center select-none shrink-0 border border-line">
            {currentTenant.avatar}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto relative z-10">
        {/* Left Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 bg-sidebar text-sidebar-fg border-r border-line shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] p-3.5 justify-between">
          <div>
            <div className="px-3 py-2 mb-2">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] font-semibold text-sidebar-fg/45">
                INDEX · NAVIGATION
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
                      'relative flex items-center justify-between px-3 py-2 rounded-control text-xs font-medium transition-all group select-none',
                      isActive
                        ? 'text-sidebar-fg bg-white/10 font-semibold'
                        : 'text-sidebar-fg/70 hover:text-sidebar-fg hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[10px] text-sidebar-fg/40 group-hover:text-sidebar-fg/70 shrink-0">
                        {item.num}
                      </span>
                      <Icon className={cn('w-3.5 h-3.5 shrink-0', isActive ? 'text-accent' : 'text-sidebar-fg/60')} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-xs bg-accent text-btn-fg font-semibold uppercase">
                        {item.badge}
                      </span>
                    )}

                    {isActive && (
                      <motion.div
                        layoutId="sidebarActiveMarker"
                        className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-accent rounded-r-full"
                        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      />
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 bg-white/5 rounded-control border border-white/10 font-mono text-[10px] text-sidebar-fg/60 space-y-1">
            <div className="flex items-center justify-between text-sidebar-fg/80 font-medium">
              <span>BPUT PS10</span>
              <span className="text-accent">VERIFIED v2.2</span>
            </div>
            <p className="font-sans text-[10px] text-sidebar-fg/50 leading-tight">
              Institutional Placement Register & Semantic Engine
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
              className="lg:hidden fixed inset-y-0 left-0 w-64 bg-sidebar z-50 p-4 flex flex-col justify-between shadow-2xl pt-16"
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
                          'flex items-center gap-2.5 px-3 py-2 rounded-control text-xs font-medium transition-colors',
                          isActive ? 'bg-white/10 text-bone font-semibold' : 'text-bone/70 hover:text-bone'
                        )}
                      >
                        <span className="font-mono text-[10px] text-bone/40">{item.num}</span>
                        <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-ochre' : 'text-bone/60')} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 bg-white/10 text-bone text-xs rounded-control font-mono"
              >
                CLOSE
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto relative z-10">
          <div className="max-w-[1180px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
