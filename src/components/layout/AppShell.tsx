'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarDays,
  Radio,
  Code2,
  CheckCheck,
  Calendar,
  BarChart3,
  Briefcase,
  Users,
  Search,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getCollegeById } from '@/lib/colleges';
import { CommandPalette } from './CommandPalette';
import { ThemeToggle } from '@/components/editorial/ThemeToggle';
import { Backdrop } from '@/components/editorial/Backdrop';
import { useTheme } from '@/theme/ThemeProvider';
import { cn } from '@/lib/utils';

export function AppShell({
  role = 'student',
  children,
  activeAdminTab,
  onAdminTabChange,
}: {
  role: 'student' | 'recruiter' | 'admin';
  children: React.ReactNode;
  activeAdminTab?: 'students' | 'drives' | 'curriculum';
  onAdminTabChange?: (tab: 'students' | 'drives' | 'curriculum') => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const isNight = theme === 'night';
  const supabase = createClient();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [collegeTitle, setCollegeTitle] = useState<string>('BPUT Affiliated Campus');

  useEffect(() => {
    async function fetchUserSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        const fName = user.user_metadata?.first_name || user.email?.split('@')[0] || 'User';
        const lName = user.user_metadata?.last_name || '';
        setUserName(`${fName} ${lName}`.trim());
        const col = getCollegeById(user.user_metadata?.college_id);
        setCollegeTitle(`${col.name} (${col.code})`);
      }
    }
    fetchUserSession();
  }, []);

  const roleNavItems = {
    student: [
      { num: '01', to: '/student', label: 'Dashboard & Offers', icon: LayoutDashboard },
      { num: '02', to: '/student/drives', label: 'Placement Drives', icon: CalendarDays, badge: 'PEP' },
      { num: '03', to: '/student/live-status', label: 'Live Dispatch Board', icon: Radio, badge: 'Live' },
      { num: '04', to: '/student/remediation', label: 'Remediation Studio', icon: Code2, badge: 'AI IDE' },
    ],
    recruiter: [
      { num: '01', to: '/recruiter', label: 'Corporate Drive Hub', icon: Briefcase, badge: 'AI JD' },
      { num: '02', to: '/recruiter/war-room', label: 'Drive-Day War Room', icon: Users, badge: 'Live' },
    ],
    admin: [
      { num: '01', to: '/admin?tab=students', tabId: 'students' as const, label: 'Verification Queue', icon: CheckCheck, badge: 'PEP' },
      { num: '02', to: '/admin?tab=drives', tabId: 'drives' as const, label: 'Placement Drives', icon: Calendar },
      { num: '03', to: '/admin?tab=curriculum', tabId: 'curriculum' as const, label: 'Curriculum Deficits', icon: BarChart3 },
    ],
  };

  const navItems = roleNavItems[role] || roleNavItems.student;

  const tenantDetails = {
    student: {
      tag: 'CANDIDATE PORTAL',
      title: collegeTitle,
      avatar: (userName || 'ST').slice(0, 2).toUpperCase(),
      name: userName || 'Student Candidate',
      roleSubtitle: userEmail || 'BPUT Placement Candidate',
      avatarBg: 'bg-[#B94432]',
    },
    admin: {
      tag: 'TPO DIRECTORATE',
      title: collegeTitle,
      avatar: (userName || 'TP').slice(0, 2).toUpperCase(),
      name: userName || 'TPO Administrator',
      roleSubtitle: userEmail || 'Placement Cell Authority',
      avatarBg: 'bg-[#B91C1C]',
    },
    recruiter: {
      tag: 'CORPORATE RECRUITER',
      title: 'Enterprise Hiring Desk',
      avatar: (userName || 'RC').slice(0, 2).toUpperCase(),
      name: userName || 'Corporate Recruiter',
      roleSubtitle: userEmail || 'Talent Acquisition Partner',
      avatarBg: 'bg-[#0369A1]',
    },
  };

  const currentTenant = tenantDetails[role];
  const mainRef = useRef<HTMLElement>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
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
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-line h-14 flex items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation drawer"
            className="lg:hidden p-2 rounded-control text-fg hover:bg-surface/60 border border-transparent hover:border-line transition-colors shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <Link href="/" className="flex items-baseline gap-1.5 group select-none shrink-0">
            <span className="font-display font-semibold text-base sm:text-xl text-fg tracking-tight">
              CampusLink
            </span>
            <span className="font-mono text-[10px] text-accent font-semibold">.v2</span>
          </Link>

          <div className="hidden sm:block h-3.5 w-px bg-line mx-1.5" />

          <div className="hidden md:flex flex-col truncate">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] font-semibold text-accent-deep leading-none">
              {currentTenant.tag}
            </span>
            <span className="font-sans text-xs font-semibold text-fg leading-tight mt-0.5 truncate max-w-[320px]">
              {currentTenant.title}
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2.5 px-3 py-1 rounded-control border border-line bg-surface/40 hover:bg-surface hover:border-fg/40 text-fg-soft text-xs transition-all w-56 lg:w-72 select-none min-h-[36px] cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-fg-soft shrink-0" />
            <span className="flex-1 text-left font-sans text-xs truncate">Search modules or press ⌘K...</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
            className="md:hidden w-8 h-8 rounded-control border border-line bg-surface hover:bg-surface/80 flex items-center justify-center text-fg transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-fg-soft" />
          </button>

          <ThemeToggle />

          <div className="flex items-center gap-1.5 pl-1">
            <div
              className="w-7 h-7 rounded-full bg-sidebar text-sidebar-fg font-mono text-xs font-semibold flex items-center justify-center select-none shrink-0 border border-line"
              title={`${currentTenant.name} (${currentTenant.roleSubtitle})`}
            >
              {currentTenant.avatar}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 rounded-control text-fg-soft hover:text-fg hover:bg-surface/80 border border-transparent hover:border-line transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto relative z-10">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 bg-sidebar text-sidebar-fg border-r border-line shrink-0 sticky top-14 self-start h-[calc(100vh-3.5rem)] p-3.5 justify-between overflow-hidden z-20">
          <div className="overflow-y-auto no-scrollbar">
            <div className="px-3 py-2 mb-2">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] font-semibold text-sidebar-fg/45">
                INDEX · NAVIGATION
              </span>
            </div>

            <nav className="space-y-1">
              {navItems.map((item: any) => {
                const Icon = item.icon;
                const isActive =
                  role === 'admin' && item.tabId && activeAdminTab
                    ? activeAdminTab === item.tabId
                    : pathname === item.to;

                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => {
                      if (role === 'admin' && item.tabId && onAdminTabChange) {
                        onAdminTabChange(item.tabId);
                      } else {
                        router.push(item.to);
                      }
                    }}
                    className={cn(
                      'w-full relative flex items-center justify-between px-3 py-2 rounded-control text-xs font-medium transition-all group select-none min-h-[36px] cursor-pointer text-left',
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
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-xs bg-accent text-btn-fg font-semibold uppercase">
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
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-3 border-t border-white/10 shrink-0">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/10">
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
                  <p className="font-mono text-[10px] text-sidebar-fg/60 leading-tight truncate mt-0.5">
                    {currentTenant.roleSubtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                title="Sign Out"
                className="p-1.5 rounded-lg text-sidebar-fg/40 hover:text-sidebar-fg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Slide-Over Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-sidebar text-sidebar-fg p-5 flex flex-col justify-between shadow-2xl border-r border-white/10"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] font-semibold text-accent">
                        {currentTenant.tag}
                      </span>
                      <span className="font-sans text-sm font-semibold text-sidebar-fg truncate mt-0.5">
                        {currentTenant.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1.5 rounded-control text-sidebar-fg/70 hover:text-sidebar-fg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <nav className="space-y-1">
                    {navItems.map((item: any) => {
                      const Icon = item.icon;
                      const isActive =
                        role === 'admin' && item.tabId && activeAdminTab
                          ? activeAdminTab === item.tabId
                          : pathname === item.to;

                      return (
                        <button
                          key={item.to}
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            if (role === 'admin' && item.tabId && onAdminTabChange) {
                              onAdminTabChange(item.tabId);
                            } else {
                              router.push(item.to);
                            }
                          }}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2.5 rounded-control text-xs font-medium transition-colors min-h-[40px] text-left',
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
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full py-2.5 px-3 rounded-control bg-white/5 hover:bg-white/10 text-sidebar-fg text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Viewport */}
        <main
          ref={mainRef}
          className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 sm:pb-12 lg:pb-10 overflow-y-auto relative z-10"
        >
          <div className="max-w-[1180px] mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

