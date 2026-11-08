import React, { useRef, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useMotionValueEvent,
  useTransform,
} from 'framer-motion';
import { ReactLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';
import { ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Stamp } from '../../components/ui/Stamp';
import { Mark } from '../../components/ui/Mark';
import { MarginNote } from '../../components/ui/MarginNote';
import { StatStrip } from '../../components/ui/StatStrip';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Backdrop } from '../../components/ui/Backdrop';
import { IntroOverlay } from '../../components/ui/IntroOverlay';
import { RegisterTicker } from '../../components/ui/RegisterTicker';
import { useTilt, useMagnetic } from '../../fx/useTilt';
import { useInView } from '../../fx/useInView';
import { useFx, setFxMode } from '../../fx/useFx';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';

const HeroCanvas = lazy(() => import('../../three/HeroCanvas.jsx'));
const PipelineCanvas = lazy(() => import('../../three/PipelineCanvas.jsx'));
const LayersCanvas = lazy(() => import('../../three/LayersCanvas.jsx'));

const STEPS = [
  'Profiling',
  'Matching',
  'Scheduling',
  'Notification',
  'Offer tracking',
  'Analytics',
];

const LAYERS = [
  'Data sources',
  'Scoring & matching',
  'Scheduler',
  'Notifications',
  'Dashboards',
];

function QronosDivider({ isNight }) {
  if (!isNight) return null;
  return (
    <div className="relative h-8 w-full border-y border-white/[0.09] qronos-hatch-divider select-none overflow-hidden z-10">
      <span className="absolute left-4 lg:left-10 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] text-white/40">+</span>
      <span className="absolute right-4 lg:right-10 top-1/2 translate-x-1/2 -translate-y-1/2 font-mono text-[10px] text-white/40">+</span>
    </div>
  );
}

const DESK_ITEMS = [
  {
    roman: 'I',
    title: 'Student Desk',
    desc: 'See your readiness score, diagnose skill gaps against target roles, and understand shortlisting factors.',
    tags: ['READINESS', 'AI MATCH', 'INTERVIEWS'],
    path: '/student/overview',
    liveMetric: '72 → 86PTS',
    liveLabel: 'GAP SIMULATOR ACTIVE',
    accentColor: 'jade',
  },
  {
    roman: 'II',
    title: 'Placement Directorate (Admin)',
    desc: 'Audit student academic records, resolve venue double-booking with 1-click mitigation, and track at-risk candidates.',
    tags: ['VERIFICATION', 'CONFLICTS', 'AT-RISK'],
    path: '/admin/command-center',
    liveMetric: '0 CLASHES',
    liveLabel: '1,180 / 1,420 VERIFIED',
    accentColor: 'accent',
  },
  {
    roman: 'III',
    title: 'Corporate Recruiter',
    desc: 'Rank candidates by semantic skill embeddings, inspect explainable bios, and schedule conflict-free interview slots.',
    tags: ['PIPELINE', 'BIO DRAWER', 'SLOTS'],
    path: '/recruiter/overview',
    liveMetric: '94% FIT',
    liveLabel: '20 PANEL SLOTS LOCKED',
    accentColor: 'jade',
  },
];

function InteractiveDesksSection({ navigate, isNight }) {
  const [activeIdx, setActiveIdx] = React.useState(1);

  const handleRowPointerMove = (e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(1)}px`);
    el.style.setProperty('--my', `${(e.clientY - r.top).toFixed(1)}px`);
  };

  return (
    <section
      id="desks"
      className="relative z-10 py-20 px-6 lg:px-12 max-w-[1240px] mx-auto space-y-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.16em] font-semibold text-accent-ink block mb-1">
            03 · THREE ROLE-SPECIFIC DESKS
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-fg">
            Three desks, one shared truth.
          </h2>
        </div>
        <span className="font-mono text-xs text-fg-soft">
          HOVER TO INSPECT TELEMETRY · CLICK TO ENTER DESK
        </span>
      </div>

      <div className="divide-y divide-line/60 border-y border-line/80">
        {DESK_ITEMS.map((desk, idx) => {
          const isActive = activeIdx === idx;
          return (
            <motion.div
              key={desk.roman}
              onMouseEnter={() => setActiveIdx(idx)}
              onPointerMove={handleRowPointerMove}
              onClick={() =>
                navigate(
                  idx === 0
                    ? '/login?role=student'
                    : idx === 1
                    ? '/login?role=admin'
                    : '/login?role=recruiter'
                )
              }
              style={{ '--mx': '50%', '--my': '50%' }}
              className="group relative cursor-pointer py-8 px-6 lg:px-8 transition-colors duration-300 overflow-hidden select-none"
            >
              {/* Sliding Active Glass Frame (Moves smoothly between rows I, II, III) */}
              {isActive && (
                <motion.div
                  layoutId="desk-active-highlight"
                  transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                  className={`pointer-events-none absolute inset-0 rounded-none border ${
                    isNight
                      ? 'bg-white/[0.03] border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'bg-surface/90 border-fg/15 shadow-subtle'
                  }`}
                />
              )}

              {/* Cursor-Following Radial Spotlight */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: isNight
                    ? 'radial-gradient(360px circle at var(--mx) var(--my), rgba(245, 158, 11, 0.10), transparent 70%)'
                    : 'radial-gradient(360px circle at var(--mx) var(--my), rgba(10, 10, 11, 0.05), transparent 70%)',
                }}
              />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left: Roman Numeral + Title + Description + Interactive Tag Pills */}
                <div className="flex items-start gap-6 min-w-0">
                  <span
                    className={`font-display text-4xl font-normal shrink-0 transition-all duration-300 ${
                      isActive
                        ? 'text-accent-ink scale-105 translate-x-0.5'
                        : 'text-fg-soft/35'
                    }`}
                  >
                    {desk.roman}
                  </span>

                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display font-medium text-2xl sm:text-3xl text-fg tracking-tight group-hover:translate-x-1 transition-transform duration-300">
                        {desk.title}
                      </h3>
                      {isActive && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-accent-ink">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                          {desk.liveLabel}
                        </span>
                      )}
                    </div>

                    <p className="font-sans text-sm sm:text-base text-fg-soft leading-relaxed">
                      {desk.desc}
                    </p>

                    {/* Interactive Module Tag Pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {desk.tags.map((t) => (
                        <span
                          key={t}
                          className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest border transition-all duration-200 ${
                            isActive
                              ? 'border-line bg-bg/70 text-fg'
                              : 'border-transparent bg-transparent text-fg-soft/70'
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Live Telemetry Readout + Magnetic Open Desk Button */}
                <div className="flex items-center justify-between lg:justify-end gap-6 shrink-0 pl-11 lg:pl-0">
                  <div
                    className={`hidden sm:flex flex-col items-end font-mono transition-all duration-300 ${
                      isActive
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 translate-x-3 pointer-events-none'
                    }`}
                  >
                    <span className="text-sm font-bold text-fg">
                      {desk.liveMetric}
                    </span>
                    <span className="text-[9.5px] uppercase tracking-widest text-fg-soft">
                      LIVE TELEMETRY
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-widest font-semibold transition-all duration-300 ${
                      isActive
                        ? isNight
                          ? 'border-accent/60 bg-accent/15 text-accent shadow-[0_0_20px_rgba(245,158,11,0.18)]'
                          : 'border-fg bg-fg text-bg'
                        : 'border-transparent text-fg-soft group-hover:text-fg'
                    }`}
                  >
                    <span>OPEN DESK</span>
                    <ArrowRight
                      className={`h-3.5 w-3.5 transition-transform duration-300 ${
                        isActive ? 'translate-x-1' : 'group-hover:translate-x-1'
                      }`}
                    />
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function InteractiveClosingCTA({ navigate, isNight }) {
  const [modeView, setModeView] = React.useState('register'); // 'chaos' | 'register'
  const [quickDesk, setQuickDesk] = React.useState('/student/overview');
  const boxRef = React.useRef(null);

  const handleBoxMove = (e) => {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const nx = ((x / r.width) - 0.5) * 2;
    const ny = ((y / r.height) - 0.5) * 2;
    el.style.setProperty('--cx', `${x.toFixed(1)}px`);
    el.style.setProperty('--cy', `${y.toFixed(1)}px`);
    el.style.setProperty('--rx', `${(-ny * 3.5).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(nx * 4.5).toFixed(2)}deg`);
  };

  const handleBoxLeave = () => {
    const el = boxRef.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <section className="relative z-10 py-24 px-6 lg:px-12 max-w-[1240px] mx-auto">
      <div
        ref={boxRef}
        onPointerMove={handleBoxMove}
        onPointerLeave={handleBoxLeave}
        style={{
          '--cx': '50%',
          '--cy': '50%',
          '--rx': '0deg',
          '--ry': '0deg',
        }}
        className={`group relative rounded-2xl border px-6 py-16 sm:px-14 sm:py-24 text-center overflow-hidden select-none transition-colors duration-500 ${
          isNight
            ? 'bg-[#030305] border-white/[0.12] hover:border-white/25'
            : 'bg-surface border-line hover:border-fg/30 shadow-object'
        }`}
      >
        {/* 1. Interactive Cursor-Following Spotlight Aura */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: isNight
              ? 'radial-gradient(520px circle at var(--cx) var(--cy), rgba(245, 158, 11, 0.12), rgba(0, 238, 255, 0.05) 45%, transparent 72%)'
              : 'radial-gradient(520px circle at var(--cx) var(--cy), rgba(255, 210, 63, 0.22), transparent 70%)',
          }}
        />

        {/* 2. Subtle Concentric Radar Rings in Background */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-35 transition-opacity duration-500">
          <div className="h-[340px] w-[340px] rounded-full border border-dashed border-fg/20 animate-[spin_55s_linear_infinite]" />
          <div className="absolute h-[520px] w-[520px] rounded-full border border-fg/10" />
        </div>

        {/* 3. Interactive Workflow State Toggle Pill ("Spreadsheet Chaos" vs "Autonomous Register") */}
        <div className="relative z-10 flex flex-col items-center space-y-7 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1 rounded-full border border-line bg-bg/80 p-1 backdrop-blur-md">
            <button
              type="button"
              onMouseEnter={() => setModeView('chaos')}
              onClick={() => setModeView('chaos')}
              className={`rounded-full px-3.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-all ${
                modeView === 'chaos'
                  ? 'bg-brick/20 text-brick border border-brick/40 font-bold'
                  : 'text-fg-soft hover:text-fg'
              }`}
            >
              BEFORE: 40 WHATSAPP GROUPS
            </button>
            <button
              type="button"
              onMouseEnter={() => setModeView('register')}
              onClick={() => setModeView('register')}
              className={`rounded-full px-3.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-all ${
                modeView === 'register'
                  ? 'bg-jade/20 text-jade border border-jade/40 font-bold'
                  : 'text-fg-soft hover:text-fg'
              }`}
            >
              NOW: AUTONOMOUS REGISTER
            </button>
          </div>

          {/* 4. 3D Perspective-Tilting Headline */}
          <div
            className="transition-transform duration-200 ease-out"
            style={{
              transform:
                'perspective(900px) rotateX(var(--rx)) rotateY(var(--ry))',
            }}
          >
            <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight leading-[1.05]">
              <span
                className={`block transition-opacity duration-300 ${
                  modeView === 'chaos'
                    ? 'text-brick line-through decoration-brick/60'
                    : 'text-fg'
                }`}
              >
                Stop babysitting spreadsheets.
              </span>
              <span
                className={`block mt-1 transition-all duration-300 ${
                  modeView === 'register'
                    ? isNight
                      ? 'bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent'
                      : 'text-fg font-medium'
                    : 'text-fg-soft/50'
                }`}
              >
                Let the register own the drive.
              </span>
            </h2>
          </div>

          {/* Dynamic Subtitle Based on Toggle */}
          <p className="font-sans text-base sm:text-lg text-fg-soft max-w-xl mx-auto leading-relaxed">
            {modeView === 'chaos'
              ? 'Eliminate unverified CGPA sheets, venue double-bookings across labs, and opaque shortlist rejections.'
              : 'Turn every JNF, student verification, and interview slot into reliable work that carries its context forward.'}
          </p>

          {/* 5. Interactive Target Desk Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {[
              { label: '01 · Student Hub', path: '/student/overview' },
              { label: '02 · Admin Directorate', path: '/admin/command-center' },
              { label: '03 · Recruiter Desk', path: '/recruiter/overview' },
            ].map((d) => {
              const selected = quickDesk === d.path;
              return (
                <button
                  key={d.path}
                  type="button"
                  onMouseEnter={() => setQuickDesk(d.path)}
                  onClick={() => setQuickDesk(d.path)}
                  className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-all ${
                    selected
                      ? 'border-accent bg-accent/15 text-fg font-bold'
                      : 'border-line/70 bg-bg/40 text-fg-soft hover:text-fg'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          {/* 6. Dual Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                const targetRole = quickDesk.includes('admin')
                  ? 'admin'
                  : quickDesk.includes('recruiter')
                  ? 'recruiter'
                  : 'student';
                navigate(`/login?role=${targetRole}`);
              }}
              className={`rounded-full border px-8 py-4 font-mono text-xs uppercase tracking-widest transition-all flex items-center gap-2.5 ${
                isNight
                  ? 'border-white/25 bg-black/80 text-white hover:border-accent hover:shadow-[0_0_25px_rgba(245,158,11,0.22)]'
                  : 'border-fg/30 bg-bg text-fg hover:border-fg'
              }`}
            >
              <span>GET STARTED</span>
              <span className="text-accent">»</span>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login?role=admin')}
              className={`rounded-full px-8 py-4 font-mono text-xs font-bold uppercase tracking-widest transition-all ${
                isNight
                  ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.28)] hover:bg-accent hover:text-black'
                  : 'bg-fg text-bg shadow-object hover:bg-accent hover:text-fg'
              }`}
            >
              REQUEST A DEMO
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingPage({ onEnter } = {}) {
  const navigate = useNavigate();
  const handleGetStarted = () => {
    if (typeof onEnter === 'function') {
      onEnter();
    } else {
      navigate('/login');
    }
  };
  const { theme } = useTheme();
  const isNight = theme === 'night';
  const { markPipelineScrolled } = useStore();
  const lenisRef = useRef(null);
  const heroRef = useRef(null);
  const inView = useInView(heroRef);
  const { mode, use3d } = useFx();
  const tiltA = useTilt({ max: 5 });
  const tiltB = useTilt({ max: 5 });
  const magOpen = useMagnetic({ strength: 0.25 });

  const pipeRef = useRef(null);
  const pipeInView = useInView(pipeRef);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Guarantee that landing page starts from the very top on mount/reopen
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (lenisRef.current?.lenis) {
      lenisRef.current.lenis.scrollTo(0, { immediate: true });
    }
    const t = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (lenisRef.current?.lenis) {
        lenisRef.current.lenis.scrollTo(0, { immediate: true });
      }
    }, 60);
    return () => clearTimeout(t);
  }, []);

  const { scrollYProgress: pipeScroll } = useScroll({
    target: pipeRef,
    offset: ['start start', 'end end'],
  });
  const smoothPipe = useSpring(pipeScroll, { stiffness: 80, damping: 24 });

  useMotionValueEvent(smoothPipe, 'change', (p) => {
    const t = Math.min(Math.max(p, 0), 0.97);
    const idx = Math.min(5, Math.max(0, Math.round(t * 6 - 0.5)));
    setCurrentStepIdx((prev) => (prev !== idx ? idx : prev));
    if (p >= 0.95) {
      markPipelineScrolled?.();
    }
  });

  React.useEffect(() => {
    if (!use3d && pipeInView) {
      markPipelineScrolled?.();
    }
  }, [use3d, pipeInView, markPipelineScrolled]);

  const jumpToStage = (idx) => {
    const target = Math.min(5, Math.max(0, idx));
    setCurrentStepIdx(target);
    if (pipeRef.current) {
      const rect = pipeRef.current.getBoundingClientRect();
      const startY = rect.top + window.scrollY;
      const total = pipeRef.current.offsetHeight - window.innerHeight;
      window.scrollTo({ top: startY + (target / 5) * total + 5, behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    if (!pipeInView) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        jumpToStage(currentStepIdx + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        jumpToStage(currentStepIdx - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pipeInView, currentStepIdx]);

  const layRef = useRef(null);
  const layInView = useInView(layRef);
  const { scrollYProgress: layScroll } = useScroll({
    target: layRef,
    offset: ['start start', 'end end'],
  });
  const spread = useTransform(layScroll, [0.1, 0.7], [0, 1]);

  const handleHeroPointerMove = (e) => {
    const el = heroRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const my = ((e.clientY - r.top) / r.height - 0.5) * 2;
    requestAnimationFrame(() => {
      el.style.setProperty('--mx', mx.toFixed(3));
      el.style.setProperty('--my', my.toFixed(3));
    });
  };

  const pipelineSteps = [
    {
      num: '01',
      title: 'Readiness Profiling',
      desc: 'Multi-source analysis across academic CGPA, verified projects, and mock scores.',
    },
    {
      num: '02',
      title: 'AI Matching & Scoring',
      desc: 'Semantic skill-embedding comparison yielding explainable fit scores (0-100%).',
    },
    {
      num: '03',
      title: 'Conflict-Free Scheduling',
      desc: 'Automated temporal & venue overlap mitigation across concurrent recruiter drives.',
    },
    {
      num: '04',
      title: 'Targeted Notifications',
      desc: 'Real-time multi-channel alerts for shortlists, interviews, and compliance deadlines.',
    },
    {
      num: '05',
      title: 'Offer & Doc Tracking',
      desc: 'End-to-end post-selection tracking from CTC verification to joining status.',
    },
    {
      num: '06',
      title: 'Predictive Analytics',
      desc: 'Conversion rates, early warning for unplaced candidates, and recruiter ROI.',
    },
  ];

  return (
    <ReactLenis root ref={lenisRef}>
      <div
        className={`min-h-screen text-fg selection:bg-accent-tint selection:text-fg relative ${
          isNight ? 'bg-transparent' : 'bg-bg'
        }`}
      >
        <IntroOverlay />
        <Backdrop />

        {/* Navigation Bar */}
        <header
          className={`sticky top-0 z-50 backdrop-blur-md border-b px-6 lg:px-12 h-16 flex items-center justify-between ${
            isNight
              ? 'bg-black/80 border-white/[0.09]'
              : 'bg-bg/90 border-line'
          }`}
        >
          <div
            onClick={() => {
              window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              if (lenisRef.current?.lenis) {
                lenisRef.current.lenis.scrollTo(0);
              }
            }}
            className="flex items-center gap-2.5 select-none cursor-pointer"
          >
            {isNight && (
              <div className="w-6 h-6 rounded bg-white text-black font-bold flex items-center justify-center font-mono text-[11px] tracking-tight">
                CL
              </div>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-medium text-2xl text-fg tracking-tight">
                CampusLink
              </span>
              <span className="font-mono text-xs text-accent-ink font-bold">.register</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-wider text-fg-soft">
            <a href="#pipeline" className="hover:text-fg transition-colors">Pipeline</a>
            <a href="#desks" className="hover:text-fg transition-colors">Desks</a>
            <a href="#architecture" className="hover:text-fg transition-colors">Architecture</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isNight ? (
              <button
                type="button"
                onClick={handleGetStarted}
                className="rounded-full border border-white/25 bg-black/80 px-5 py-2 font-mono text-[11px] uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.06)]"
              >
                <span>GET STARTED</span>
                <span className="text-white/60">»</span>
              </button>
            ) : (
              <Button
                variant="primary"
                onClick={handleGetStarted}
                icon={ArrowRight}
              >
                Launch System Demo
              </Button>
            )}
          </div>
        </header>

        {/* SCENE 1 WRAPPER: Full-Bleed 3D Vortex Funnel in Dark Mode (Matching Screenshot 1) */}
        <section
          ref={heroRef}
          onPointerMove={handleHeroPointerMove}
          className={`relative overflow-hidden border-b ${
            isNight ? 'bg-black border-white/[0.09]' : 'border-line'
          }`}
        >
          {mode !== 'lite' && (
            <div
              className="absolute inset-0 z-0 pointer-events-none transition-transform duration-100 ease-out"
              style={{ transform: 'translate3d(calc(var(--mx, 0) * -16px), 0, 0)' }}
            >
              <Suspense fallback={null}>
                <HeroCanvas visible={inView} />
              </Suspense>
            </div>
          )}

          {/* Centered Hero Content Hierarchy (Matching Screenshot 1) */}
          <div
            data-vortex-mask
            className="pt-20 pb-20 px-6 lg:px-12 max-w-[1240px] mx-auto relative z-10 text-center"
          >
            {/* Centered Eyebrow */}
            <span
              className={`font-mono text-xs uppercase tracking-[0.2em] font-semibold inline-block mb-4 ${
                isNight ? 'text-zinc-400' : 'text-accent-deep'
              }`}
            >
              BPUT HACKATHON 2026 · PS10 PLACEMENT REGISTER
            </span>

            {/* Centered Main Headline */}
            <h1
              className={`font-display font-normal text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.04] max-w-4xl mx-auto ${
                isNight
                  ? 'bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)]'
                  : 'text-fg'
              }`}
            >
              Every shortlist,{' '}
              {isNight ? (
                <span className="font-serif italic font-normal text-white">
                  explained.
                </span>
              ) : (
                <span className="font-serif italic font-normal text-fg">
                  <Mark delay={0.4}>explained.</Mark>
                </span>
              )}
            </h1>

            {/* Centered Subtitle */}
            <p className="font-sans text-base sm:text-lg text-fg-soft leading-relaxed max-w-2xl mx-auto mt-6">
              CampusLink scores students, matches them to corporate recruiters, schedules placement drives without venue clashes, and explains why—in one unified system instead of forty WhatsApp groups.
            </p>

            {/* Centered Dual Pill CTA Buttons (Matching Screenshot 1) */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
              {isNight ? (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('desks');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="rounded-full border border-white/25 bg-black/70 backdrop-blur-md px-7 py-3.5 font-mono text-xs uppercase tracking-widest text-white hover:border-white/50 hover:bg-black/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.06)] flex items-center gap-2"
                >
                  <span>Open the Demo Desks</span>
                  <span className="text-zinc-400">»</span>
                </button>
              ) : (
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => {
                    const el = document.getElementById('desks');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Open the Demo Desks →
                </Button>
              )}

              {isNight ? (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="rounded-full bg-white text-black px-7 py-3.5 font-mono text-xs font-semibold uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_0_25px_rgba(255,255,255,0.22)]"
                >
                  Launch System Demo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('pipeline');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="font-mono text-xs uppercase tracking-wider font-semibold text-fg-soft hover:text-fg px-4 py-3 transition-colors"
                >
                  See the Pipeline ↓
                </button>
              )}
            </div>

            {/* Centered "Physical Register" Showcase Dock (Dual Cards over Lower Funnel) */}
            <div
              data-reveal-late
              className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-6 pt-12 text-left transition-transform duration-100 ease-out"
              style={{
                transform:
                  'translate3d(calc(var(--mx, 0) * 18px), calc(var(--my, 0) * 12px), 0)',
              }}
            >
              {/* Slip A: Candidate Shortlist */}
              <motion.div
                ref={tiltA.ref}
                onPointerMove={tiltA.onPointerMove}
                onPointerLeave={tiltA.onPointerLeave}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`tilt rounded-object border p-6 shadow-object space-y-4 ${
                  isNight
                    ? 'bg-black/50 border-white/12 backdrop-blur-xl shadow-2xl'
                    : 'glass-strong border-line'
                }`}
              >
                <div className="flex items-start justify-between border-b border-line pb-3">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-fg-soft block">
                      CANDIDATE · MICROSOFT INDIA SDE
                    </span>
                    <h3 className="font-display font-medium text-2xl text-fg mt-0.5">
                      Rohan Senapati
                    </h3>
                    <p className="font-mono text-xs text-fg-soft">
                      BPUT · CSE · CGPA 9.12
                    </p>
                  </div>
                  <Stamp tone="jade" rotate={-2}>SHORTLISTED</Stamp>
                </div>

                {/* Match bar */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-fg-soft">AI Semantic Match</span>
                    <strong className="text-fg font-mono">94% Fit</strong>
                  </div>
                  <div className="h-1.5 w-full bg-bg rounded-full overflow-hidden border border-line">
                    <div className="h-full bg-accent w-[94%]" />
                  </div>
                </div>

                {/* Margin Note with Highlighters */}
                <MarginNote label="AI MATCH JUSTIFICATION" strong>
                  Highly recommended: Candidate possesses verified proficiency in{' '}
                  <Mark delay={0.8}>React</Mark>, <Mark delay={1.1}>Python</Mark>, and{' '}
                  <Mark delay={1.4}>Data Structures</Mark>, comfortably exceeding the mock benchmark.
                </MarginNote>
              </motion.div>

              {/* Slip B: Resource Schedule Conflict */}
              <div
                ref={tiltB.ref}
                onPointerMove={tiltB.onPointerMove}
                onPointerLeave={tiltB.onPointerLeave}
                className={`tilt rounded-object border p-6 shadow-object space-y-4 flex flex-col justify-between ${
                  isNight
                    ? 'bg-black/50 border-white/12 backdrop-blur-xl shadow-2xl'
                    : 'bg-surface border-line'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-line pb-3 mb-3">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-fg-soft block">
                        RESOURCE SCHEDULE AUDIT
                      </span>
                      <h4 className="font-display font-medium text-lg text-fg mt-0.5">
                        Lab 4 Multi-Recruiter Overlap
                      </h4>
                    </div>
                    <Stamp tone="brick" rotate={-3}>CLASH</Stamp>
                  </div>
                  <div className="h-4 w-full bg-bg rounded hatch-brick my-3" />
                  <p className="font-mono text-xs text-brick leading-relaxed">
                    Cognizant Campus Drive overlaps with Tech Mahindra, 10:00 - 12:00 in Lab 4 (60 terminals).
                  </p>
                </div>

                <div className="border-t border-line pt-3 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-fg-soft">Automated Mitigation Ready</span>
                  <button
                    type="button"
                    onClick={() => navigate('/login?role=admin')}
                    className="font-mono text-[11px] uppercase tracking-wider text-accent-ink font-semibold hover:underline"
                  >
                    1-Click Resolve →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Register Ticker sits across the flared floor disc horizon of Scene 1 */}
          <div className="relative z-10">
            <RegisterTicker />
          </div>
        </section>

        {/* BELOW THE FOLD: Scene 2 (Vertical Light Streaks in Backdrop) takes over */}
        <QronosDivider isNight={isNight} />

        {/* 6-Step Pipeline Thread Section */}
        {use3d ? (
          <div id="pipeline" className="relative z-10">
            <div className="pt-20 pb-8 px-6 lg:px-12 max-w-[1240px] mx-auto">
              <span className="font-mono text-xs uppercase tracking-[0.16em] font-semibold text-accent-deep block mb-1">
                02 · THE PIPELINE
              </span>
              <h2 className="font-display font-normal text-3xl sm:text-5xl text-fg">
                Six stages, one thread.
              </h2>
            </div>

            <section ref={pipeRef} style={{ height: '500vh' }} className="relative">
              <div
                className={`sticky top-0 h-screen w-full overflow-hidden border-y ${
                  isNight ? 'bg-black/45 backdrop-blur-[2px] border-white/[0.09]' : 'bg-bg border-line'
                }`}
              >
                <div className="absolute inset-0 w-full h-full">
                  <Suspense fallback={null}>
                    <PipelineCanvas
                      visible={pipeInView}
                      progress={smoothPipe}
                      labels={STEPS}
                    />
                  </Suspense>
                </div>

                <div className="absolute left-6 lg:left-12 top-1/2 -translate-y-1/2 max-w-[420px] z-10 pointer-events-none">
                  <div
                    className={`rounded-object border p-8 space-y-4 shadow-object ${
                      isNight
                        ? 'bg-[#0A0A0E]/85 border-white/15 backdrop-blur-xl'
                        : 'glass-strong border-line'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-line pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs uppercase tracking-widest text-accent-ink font-semibold">
                          STAGE 0{currentStepIdx + 1} / 06
                        </span>
                        <div className="flex items-center gap-1 border-l border-line pl-2 pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => jumpToStage(currentStepIdx - 1)}
                            disabled={currentStepIdx === 0}
                            title="Upper arrow: Previous stage (above)"
                            aria-label="Previous stage above"
                            className="p-1 rounded hover:bg-fg/10 text-fg-soft hover:text-fg disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => jumpToStage(currentStepIdx + 1)}
                            disabled={currentStepIdx === 5}
                            title="Lower arrow: Next stage (below)"
                            aria-label="Next stage below"
                            className="p-1 rounded hover:bg-fg/10 text-fg-soft hover:text-fg disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 pointer-events-auto">
                        {pipelineSteps.map((s, idx) => (
                          <button
                            key={s.num}
                            type="button"
                            onClick={() => jumpToStage(idx)}
                            aria-label={`Jump to stage 0${idx + 1}: ${s.title}`}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                              idx === currentStepIdx
                                ? 'w-6 bg-accent'
                                : idx < currentStepIdx
                                ? 'w-2 bg-jade/70'
                                : 'w-2 bg-line'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStepIdx}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                      >
                        <span className="font-mono text-4xl font-bold text-accent-ink block">
                          {pipelineSteps[currentStepIdx].num}
                        </span>
                        <h3 className="font-display font-medium text-3xl sm:text-4xl text-fg leading-tight">
                          {pipelineSteps[currentStepIdx].title}
                        </h3>
                        <p className="font-sans text-sm text-fg-soft leading-relaxed">
                          {pipelineSteps[currentStepIdx].desc}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                <div className="absolute right-6 lg:right-12 bottom-8 z-10 font-mono text-[11px] text-fg-soft/75 uppercase tracking-wider flex items-center gap-2 select-none">
                  <span>USE UPPER ARROW</span>
                  <button
                    type="button"
                    onClick={() => jumpToStage(currentStepIdx - 1)}
                    disabled={currentStepIdx === 0}
                    className="inline-flex items-center justify-center w-5 h-5 rounded border border-line bg-surface/80 hover:bg-fg/10 text-fg disabled:opacity-25 transition-all cursor-pointer font-bold"
                    title="Upper arrow: Previous stage above (or press ↑)"
                    aria-label="Previous stage above"
                  >
                    ↑
                  </button>
                  <span>AND LOWER ARROW</span>
                  <button
                    type="button"
                    onClick={() => jumpToStage(currentStepIdx + 1)}
                    disabled={currentStepIdx === 5}
                    className="inline-flex items-center justify-center w-5 h-5 rounded border border-line bg-surface/80 hover:bg-fg/10 text-fg disabled:opacity-25 transition-all cursor-pointer font-bold"
                    title="Lower arrow: Next stage below (or press ↓)"
                    aria-label="Next stage below"
                  >
                    ↓
                  </button>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <section
            id="pipeline"
            className="relative z-10 py-20 px-6 lg:px-12 max-w-[1240px] mx-auto border-b border-line"
          >
            <div className="mb-12">
              <span className="font-mono text-xs uppercase tracking-[0.16em] font-semibold text-accent-deep block mb-1">
                02 · THE PLACEMENT THREAD
              </span>
              <h2 className="font-display font-normal text-3xl sm:text-4xl text-fg">
                Six stages, one continuous pipeline.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pipelineSteps.map((step) => (
                <div key={step.num} className="border-t-2 border-line pt-4 space-y-2">
                  <span className="font-mono text-sm font-semibold text-accent-deep block">
                    {step.num}
                  </span>
                  <h3 className="font-display font-medium text-xl text-fg">
                    {step.title}
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-fg-soft leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <QronosDivider isNight={isNight} />

        {/* Portals Section: Three Ruled Desks (Interactive Sliding Selection Frame) */}
        <InteractiveDesksSection navigate={navigate} isNight={isNight} />

        <QronosDivider isNight={isNight} />

        {/* Under the Hood Section */}
        <div
          id="architecture"
          className={`relative z-10 text-dark-section-fg border-b border-white/10 ${
            isNight ? 'bg-black/50 backdrop-blur-[2px]' : 'bg-dark-section'
          }`}
        >
          {use3d ? (
            <section ref={layRef} style={{ height: '250vh' }} className="relative">
              <div
                className={`sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center px-6 lg:px-12 ${
                  isNight ? 'bg-transparent' : 'bg-dark-section'
                }`}
              >
                <div className="max-w-[1240px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full py-12">
                  <div className="lg:col-span-5 space-y-6 z-10">
                    <div>
                      <span className="font-mono text-xs uppercase tracking-[0.16em] font-semibold text-accent block mb-1">
                        04 · UNDER THE HOOD
                      </span>
                      <h2 className="font-display font-normal text-3xl sm:text-4xl text-dark-section-fg leading-tight">
                        Rules where rules belong. Models where they add value.
                      </h2>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="border-t border-white/10 pt-3">
                        <h4 className="font-display font-medium text-base text-dark-section-fg">
                          Rule + ML Hybrid Scoring
                        </h4>
                        <p className="font-sans text-xs text-dark-section-fg/70 leading-relaxed mt-1">
                          Academic thresholds (CGPA, backlogs, branch) are strictly enforced by deterministic logic, while project relevance and mock interviews are weighted by trained regression models.
                        </p>
                      </div>

                      <div className="border-t border-white/10 pt-3">
                        <h4 className="font-display font-medium text-base text-dark-section-fg">
                          Semantic Match Embeddings
                        </h4>
                        <p className="font-sans text-xs text-dark-section-fg/70 leading-relaxed mt-1">
                          Candidate resumes and recruiter Job Notification Forms (JNFs) are parsed into normalized skill vectors to calculate cosine similarity fit scores without keyword stuffing bias.
                        </p>
                      </div>

                      <div className="border-t border-white/10 pt-3">
                        <h4 className="font-display font-medium text-base text-dark-section-fg">
                          Interval Overlap Scheduling
                        </h4>
                        <p className="font-sans text-xs text-dark-section-fg/70 leading-relaxed mt-1">
                          Temporal interval intersection trees detect room collisions, candidate multi-shortlist clashes, and interview panel unavailability before drives are approved.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 h-[420px] lg:h-[560px] relative w-full">
                    <Suspense fallback={null}>
                      <LayersCanvas
                        visible={layInView}
                        spread={spread}
                        labels={LAYERS}
                      />
                    </Suspense>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="py-20 px-6 lg:px-12 max-w-[1240px] mx-auto space-y-12">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <span className="font-mono text-xs uppercase tracking-[0.16em] font-semibold text-accent block mb-1">
                    04 · UNDER THE HOOD
                  </span>
                  <h2 className="font-display font-normal text-3xl sm:text-4xl text-dark-section-fg">
                    Rules where rules belong. Models where they add value.
                  </h2>
                </div>
                <span className="font-mono text-xs text-dark-section-fg/50 uppercase">
                  BPUT PS10 ARCHITECTURE SPEC
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <h4 className="font-display font-medium text-lg text-dark-section-fg">
                    Rule + ML Hybrid Scoring
                  </h4>
                  <p className="font-sans text-xs text-dark-section-fg/70 leading-relaxed">
                    Academic thresholds (CGPA, backlogs, branch) are strictly enforced by deterministic logic, while project relevance and mock interviews are weighted by trained regression models.
                  </p>
                </div>

                <div className="space-y-2 border-t border-white/10 pt-4">
                  <h4 className="font-display font-medium text-lg text-dark-section-fg">
                    Semantic Match Embeddings
                  </h4>
                  <p className="font-sans text-xs text-dark-section-fg/70 leading-relaxed">
                    Candidate resumes and recruiter Job Notification Forms (JNFs) are parsed into normalized skill vectors to calculate cosine similarity fit scores without keyword stuffing bias.
                  </p>
                </div>

                <div className="space-y-2 border-t border-white/10 pt-4">
                  <h4 className="font-display font-medium text-lg text-dark-section-fg">
                    Interval Overlap Scheduling
                  </h4>
                  <p className="font-sans text-xs text-dark-section-fg/70 leading-relaxed">
                    Temporal interval intersection trees detect room collisions, candidate multi-shortlist clashes, and interview panel unavailability before drives are approved.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        <QronosDivider isNight={isNight} />

        {/* Qronos Scene 2 Closing CTA Vault (Interactive 3D Perspective Tilt & Workflow State) */}
        <InteractiveClosingCTA navigate={navigate} isNight={isNight} />

        <QronosDivider isNight={isNight} />

        {/* Institutional Footer */}
        <footer
          className={`relative z-10 border-t py-8 px-6 lg:px-12 font-mono text-xs text-fg-soft ${
            isNight ? 'bg-black/80 border-white/[0.09]' : 'bg-surface/50 border-line'
          }`}
        >
          <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span>CAMPUSLINK REGISTER</span> · <span>BPUT HACKATHON 2026</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-fg-soft/60">EFFECTS:</span>
                <button
                  type="button"
                  onClick={() => setFxMode('full')}
                  className={`hover:text-fg transition-colors ${
                    mode === 'full'
                      ? 'text-fg font-bold underline underline-offset-4 decoration-accent'
                      : 'text-fg-soft'
                  }`}
                >
                  FULL
                </button>
                <span className="text-line">/</span>
                <button
                  type="button"
                  onClick={() => setFxMode('lite')}
                  className={`hover:text-fg transition-colors ${
                    mode === 'lite'
                      ? 'text-fg font-bold underline underline-offset-4 decoration-accent'
                      : 'text-fg-soft'
                  }`}
                >
                  LITE
                </button>
              </div>
              <div className="text-[11px] text-fg-soft/70 hidden sm:block">
                SIMULATED CAMPUS RECRUITMENT DATASET
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ReactLenis>
  );
}

export default LandingPage;
