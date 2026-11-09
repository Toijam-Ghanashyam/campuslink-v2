import React, { useState, useRef, useEffect } from 'react';
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
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { CommandPalette } from './CommandPalette';
import { NotificationPopover } from './NotificationPopover';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Backdrop } from '../ui/Backdrop';
import { useTheme } from '../../theme/ThemeProvider';
import { cn } from '../../lib/utils';

export function AppShell({ role = 'student', children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isNight = theme === 'night';
  const { notifications } = useStore();
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

  const storedName = typeof window !== 'undefined' ? sessionStorage.getItem('campuslink_user_name') : null;

  const tenantDetails = {
    student: {
      tag: 'STUDENT',
      title: 'Student Portal',
      avatar: 'ZA',
      name: storedName || 'Zahid',
      roleSubtitle: 'Free',
      avatarBg: 'bg-[#B94432]',
    },
    admin: {
      tag: 'PLACEMENT DIRECTORATE',
      title: 'BPUT Central Campus',
      avatar: 'AV',
      name: storedName || 'Dr. Ananya Verma',
      roleSubtitle: 'Placement Cell Director',
      avatarBg: 'bg-[#B91C1C]',
    },
    recruiter: {
      tag: 'CORPORATE RECRUITER',
      title: 'Atlassian India',
      avatar: 'RK',
      name: storedName || 'Rohit Khemka',
      roleSubtitle: 'Lead Talent Partner',
      avatarBg: 'bg-[#0369A1]',
    },
  };

  const currentTenant = tenantDetails[role];
  const mainRef = useRef(null);

  const scrollToTop = (smooth = true) => {
    const behavior = smooth ? 'smooth' : 'instant';
    window.scrollTo({ top: 0, left: 0, behavior });
    document.documentElement.scrollTo({ top: 0, behavior });
    document.body.scrollTo({ top: 0, behavior });
    if (mainRef.current) {
      if (smooth) {
        mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        mainRef.current.scrollTop = 0;
      }
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    scrollToTop(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleRoleSwitch = (newRole) => {
    if (newRole === role) {
      scrollToTop(true);
      return;
    }
    const dest =
      newRole === 'student'
        ? '/student/overview'
        : newRole === 'admin'
        ? '/admin/command-center'
        : '/recruiter/overview';

    scrollToTop(false);
    navigate(dest);
  };

  return (
    <div
      className={cn(
        'min-h-screen text-fg flex flex-col antialiased relative',
        isNight ? 'bg-transparent' : 'bg-bg'
      )}
    >
      <Backdrop />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        currentRole={role}
      />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-line h-14 flex items-center justify-between px-2.5 sm:px-6">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation drawer"
            className="lg:hidden p-2 rounded-control text-fg hover:bg-surface/60 border border-transparent hover:border-line transition-colors shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <NavLink
            to="/"
            onClick={() => scrollToTop(true)}
            className="flex items-baseline gap-1 group select-none shrink-0"
          >
            <span className="font-display font-medium text-base sm:text-xl text-fg tracking-tight">CampusLink</span>
            <span className="font-mono text-xs text-accent-ink font-bold hidden xs:inline">.register</span>
          </NavLink>

          <div className="hidden sm:block h-3.5 w-px bg-line mx-1.5" />

          {/* Institutional Tenant Label (condensed on smaller screens) */}
          <div className="hidden md:flex flex-col truncate">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] font-semibold text-accent-deep leading-none">
              {currentTenant.tag}
            </span>
            <span className="font-sans text-xs font-semibold text-fg leading-tight mt-0.5 truncate">
              {currentTenant.title}
            </span>
          </div>
        </div>

        {/* Global Search Bar (Desktop: full bar; Mobile: icon button) */}
        <div className="hidden md:flex items-center">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2.5 px-3 py-1 rounded-control border border-line bg-surface/40 hover:bg-surface hover:border-fg/40 text-fg-soft text-xs transition-all w-52 lg:w-72 select-none min-h-[36px]"
          >
            <Search className="w-3.5 h-3.5 text-fg-soft shrink-0" />
            <span className="flex-1 text-left font-sans text-xs truncate">Search or type ⌘K...</span>
          </button>
        </div>

        {/* Right Action Stack: Search Icon (Mobile) + ThemeToggle + Demo Role Switcher + Notifs + Profile */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {/* Mobile Search Icon Trigger */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
            className="md:hidden w-8 h-8 rounded-control border border-line bg-surface hover:bg-surface/80 flex items-center justify-center text-fg transition-colors min-h-[36px] min-w-[36px]"
          >
            <Search className="w-3.5 h-3.5 text-fg-soft" />
          </button>

          <ThemeToggle />

          {/* Demo Role Switcher (Desktop & Tablet) */}
          <div className="hidden sm:flex bg-surface/80 p-0.5 rounded-control border border-line items-center font-mono text-[10.5px] uppercase tracking-wider shrink-0">
            {['student', 'admin', 'recruiter'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleSwitch(r)}
                className={cn(
                  'px-2 sm:px-2.5 py-1 rounded-xs transition-all font-semibold select-none min-h-[28px]',
                  role === r
                    ? 'bg-btn text-btn-fg shadow-xs'
                    : 'text-fg-soft hover:text-fg'
                )}
              >
                <span className="md:hidden">
                  {r === 'student' ? 'STU' : r === 'admin' ? 'ADM' : 'REC'}
                </span>
                <span className="hidden md:inline">
                  {r === 'student' ? 'STUDENT' : r === 'admin' ? 'ADMIN' : 'RECRUITER'}
                </span>
              </button>
            ))}
          </div>

          {/* Mobile Portal Role Pill (tap to open switch drawer) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            title="Switch portal in menu"
            className="sm:hidden px-2 py-1 rounded-control bg-accent-tint text-accent-deep border border-accent/30 font-mono text-[9.5px] font-bold uppercase select-none min-h-[32px] flex items-center gap-1 shrink-0"
          >
            <span>{role === 'student' ? 'STU' : role === 'admin' ? 'ADM' : 'REC'}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* Notifications Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              aria-label="Notifications"
              className="relative w-8 h-8 rounded-control border border-line bg-surface hover:bg-surface/80 flex items-center justify-center text-fg transition-colors min-h-[36px] min-w-[36px] cursor-pointer"
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

          {/* User Profile Avatar & Sign Out */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div
              onClick={() => setMobileMenuOpen(true)}
              className="w-7 h-7 rounded-full bg-sidebar text-sidebar-fg font-mono text-xs font-semibold flex items-center justify-center select-none shrink-0 border border-line cursor-pointer"
              title={`${currentTenant.name} (${currentTenant.roleSubtitle})`}
            >
              {currentTenant.avatar}
            </div>
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.removeItem('campuslink_auth');
                } catch {}
                navigate('/login');
              }}
              title="Sign Out to Login Portal"
              aria-label="Sign Out"
              className="hidden sm:flex p-1.5 rounded-control text-fg-soft hover:text-fg hover:bg-surface/80 border border-transparent hover:border-line transition-all cursor-pointer min-h-[36px] min-w-[36px] items-center justify-center"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto relative z-10">
        {/* Left Desktop Sidebar (>= 1024px) */}
        <aside className="hidden lg:flex flex-col w-60 bg-sidebar text-sidebar-fg border-r border-line shrink-0 sticky top-14 self-start h-[calc(100vh-3.5rem)] p-3.5 justify-between overflow-hidden z-20">
          <div className="overflow-y-auto no-scrollbar">
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
                    onClick={() => scrollToTop(true)}
                    className={cn(
                      'relative flex items-center justify-between px-3 py-2 rounded-control text-xs font-medium transition-all group select-none min-h-[36px]',
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

          {/* Sidebar User Profile (Matching Image 3) */}
          <div className="pt-3 border-t border-white/10 shrink-0">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all group">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full ${currentTenant.avatarBg} text-white font-sans font-semibold text-xs flex items-center justify-center shrink-0 shadow-sm select-none`}
                >
                  {currentTenant.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-sans font-semibold text-xs text-sidebar-fg leading-tight truncate">
                    {currentTenant.name}
                  </p>
                  <p className="font-sans text-[11px] text-sidebar-fg/60 leading-tight truncate mt-0.5">
                    {currentTenant.roleSubtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.removeItem('campuslink_auth');
                  } catch {}
                  navigate('/login');
                }}
                title="Sign Out"
                aria-label="Sign Out"
                className="p-1.5 rounded-lg text-sidebar-fg/40 hover:text-sidebar-fg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Slide-Over Mobile Sidebar Drawer (< 1024px) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
              />

              {/* Drawer Panel */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-sidebar text-sidebar-fg p-5 flex flex-col justify-between shadow-2xl border-r border-white/10"
              >
                <div>
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                    <div className="flex flex-col">
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] font-semibold text-accent-deep">
                        {currentTenant.tag}
                      </span>
                      <span className="font-sans text-sm font-semibold text-sidebar-fg leading-tight mt-0.5">
                        {currentTenant.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1.5 rounded-control text-sidebar-fg/70 hover:text-sidebar-fg hover:bg-white/10 transition cursor-pointer"
                      aria-label="Close menu"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Role Switcher Pills in Drawer */}
                  <div className="mb-4">
                    <span className="font-mono text-[9.5px] uppercase tracking-wider text-sidebar-fg/40 block mb-1.5 px-1">
                      SWITCH ACTIVE PORTAL
                    </span>
                    <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-control border border-white/10 font-mono text-[11px]">
                      {['student', 'admin', 'recruiter'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            handleRoleSwitch(r);
                            setMobileMenuOpen(false);
                          }}
                          className={cn(
                            'py-1.5 rounded-xs transition text-center font-semibold uppercase',
                            role === r ? 'bg-accent text-btn-hover-fg' : 'text-sidebar-fg/70 hover:text-sidebar-fg'
                          )}
                        >
                          {r === 'student' ? 'STUDENT' : r === 'admin' ? 'ADMIN' : 'RECRUITER'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <nav className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.to;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            scrollToTop(true);
                          }}
                          className={cn(
                            'relative flex items-center justify-between px-3 py-2.5 rounded-control text-xs font-medium transition-colors min-h-[40px]',
                            isActive
                              ? 'bg-white/10 text-sidebar-fg font-semibold'
                              : 'text-sidebar-fg/70 hover:text-sidebar-fg hover:bg-white/5'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono text-[10px] text-sidebar-fg/40">{item.num}</span>
                            <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-accent' : 'text-sidebar-fg/60')} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-xs bg-accent text-btn-fg font-semibold uppercase">
                              {item.badge}
                            </span>
                          )}
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                          )}
                        </NavLink>
                      );
                    })}
                  </nav>
                </div>

                {/* Drawer User Profile (Matching Image 3) */}
                <div className="pt-4 border-t border-white/10 shrink-0">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full ${currentTenant.avatarBg} text-white font-sans font-semibold text-xs flex items-center justify-center shrink-0 shadow-sm select-none`}
                      >
                        {currentTenant.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-sans font-semibold text-xs text-sidebar-fg leading-tight truncate">
                          {currentTenant.name}
                        </p>
                        <p className="font-sans text-[11px] text-sidebar-fg/60 leading-tight truncate mt-0.5">
                          {currentTenant.roleSubtitle}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        try {
                          sessionStorage.removeItem('campuslink_auth');
                        } catch {}
                        navigate('/login');
                      }}
                      title="Sign Out"
                      aria-label="Sign Out"
                      className="p-1.5 rounded-lg text-sidebar-fg/40 hover:text-sidebar-fg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile & Tablet Bottom Tab Bar (Visible on all screens < 1024px) */}
        <nav
          aria-label="Mobile Navigation Bar"
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar/95 backdrop-blur-md text-sidebar-fg border-t border-white/10 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.35)]"
        >
          <div className="max-w-md md:max-w-lg mx-auto grid grid-cols-5 h-14 sm:h-16 items-center px-1 sm:px-2">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => scrollToTop(true)}
                  className={cn(
                    'relative flex flex-col items-center justify-center h-full text-[10px] sm:text-xs font-medium transition-all group select-none min-h-[44px]',
                    isActive
                      ? 'text-sidebar-fg font-semibold'
                      : 'text-sidebar-fg/60 hover:text-sidebar-fg'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobileBottomActiveTab"
                      className="absolute top-0 inset-x-2 sm:inset-x-3 h-0.5 bg-accent rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Icon className={cn('w-4 h-4 mb-0.5 shrink-0', isActive ? 'text-accent' : 'text-sidebar-fg/60')} />
                  <span className="truncate max-w-[62px] sm:max-w-[76px] text-[9px] sm:text-[10px] leading-tight">
                    {item.label.split(' ')[0]}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Main Content Viewport */}
        <main
          ref={mainRef}
          className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 sm:pb-12 lg:pb-10 overflow-y-auto relative z-10"
        >
          <div className="max-w-[1180px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;
