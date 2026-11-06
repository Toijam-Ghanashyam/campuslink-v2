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
import { ArrowRight } from 'lucide-react';
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
import { JudgeGuide } from '../../components/layout/JudgeGuide';

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

export function LandingPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isNight = theme === 'night';
  const { markPipelineScrolled } = useStore();
  const heroRef = useRef(null);
  const inView = useInView(heroRef);
  const { mode, use3d } = useFx();
  const tiltA = useTilt({ max: 5 });
  const tiltB = useTilt({ max: 5 });
  const magOpen = useMagnetic({ strength: 0.25 });

  const pipeRef = useRef(null);
  const pipeInView = useInView(pipeRef);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

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

  const desks = [
    {
      roman: 'I',
      title: 'Student Desk',
      desc: 'See your readiness score, diagnose skill gaps against target roles, and understand shortlisting factors.',
      tags: 'READINESS · AI MATCH · INTERVIEWS',
      path: '/student/overview',
    },
    {
      roman: 'II',
      title: 'Placement Directorate (Admin)',
      desc: 'Audit student academic records, resolve venue double-booking with 1-click mitigation, and track at-risk candidates.',
      tags: 'VERIFICATION · CONFLICTS · AT-RISK',
      path: '/admin/command-center',
    },
    {
      roman: 'III',
      title: 'Corporate Recruiter',
      desc: 'Rank candidates by semantic skill embeddings, inspect explainable bios, and schedule conflict-free interview slots.',
      tags: 'PIPELINE · BIO DRAWER · SLOTS',
      path: '/recruiter/overview',
    },
  ];

  return (
    <ReactLenis root>
      <div
        className={`min-h-screen text-fg selection:bg-accent-tint selection:text-fg relative ${
          isNight ? 'bg-transparent' : 'bg-bg'
        }`}
      >
        <IntroOverlay />
        <Backdrop />
        <JudgeGuide />

        {/* Navigation Bar */}
        <header
          className={`sticky top-0 z-50 backdrop-blur-md border-b px-6 lg:px-12 h-16 flex items-center justify-between ${
            isNight
              ? 'bg-black/75 border-white/[0.09]'
              : 'bg-bg/90 border-line'
          }`}
        >
          <div className="flex items-baseline gap-1.5 select-none">
            <span className="font-display font-medium text-2xl text-fg tracking-tight">
              CampusLink
            </span>
            <span className="font-mono text-xs text-accent font-bold">.register</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-wider text-fg-soft">
            <a href="#pipeline" className="hover:text-fg transition-colors">Pipeline</a>
            <a href="#desks" className="hover:text-fg transition-colors">Desks</a>
            <a href="#architecture" className="hover:text-fg transition-colors">Architecture</a>
            <a href="#metrics" className="hover:text-fg transition-colors">Metrics</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isNight ? (
              <button
                type="button"
                onClick={() => navigate('/student/overview')}
                className="rounded-full border border-white/25 bg-black/80 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all flex items-center gap-2"
              >
                <span>Launch Demo</span>
                <span className="text-white/70">→</span>
              </button>
            ) : (
              <Button
                variant="primary"
                onClick={() => navigate('/student/overview')}
                icon={ArrowRight}
              >
                Launch System Demo
              </Button>
            )}
          </div>
        </header>

        {/* SCENE 1 WRAPPER: Full-Bleed Vortex Funnel in Dark Mode */}
        <section
          ref={heroRef}
          onPointerMove={handleHeroPointerMove}
          className={`relative overflow-hidden border-b ${
            isNight ? 'bg-black border-white/[0.09]' : 'border-line'
          }`}
        >
          {(use3d || isNight) && (
            <div
              className="absolute inset-0 z-0 pointer-events-none transition-transform duration-100 ease-out"
              style={{ transform: 'translate3d(calc(var(--mx, 0) * -18px), 0, 0)' }}
            >
              <Suspense fallback={null}>
                <HeroCanvas visible={inView} />
              </Suspense>
            </div>
          )}

          <div className="pt-16 pb-20 px-6 lg:px-12 max-w-[1240px] mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column (7 cols): Editorial Typography */}
              <div className="lg:col-span-7 space-y-6">
                <span className="font-mono text-xs uppercase tracking-[0.16em] font-semibold text-accent-deep block">
                  BPUT HACKATHON 2026 · PS10 PLACEMENT PLATFORM
                </span>

                <h1
                  className={`font-display font-normal text-4xl sm:text-6xl tracking-tight leading-[1.04] ${
                    isNight
                      ? 'bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent'
                      : 'text-fg'
                  }`}
                >
                  Every shortlist,{' '}
                  <span className="font-serif italic font-normal text-fg">
                    <Mark delay={0.4}>explained.</Mark>
                  </span>
                </h1>

                <p className="font-sans text-base sm:text-lg text-fg-soft leading-relaxed max-w-xl">
                  CampusLink scores students, matches them to corporate recruiters, schedules placement drives without venue clashes, and explains why—in one unified system instead of forty WhatsApp groups.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <span
                    ref={magOpen.ref}
                    onPointerMove={magOpen.onPointerMove}
                    onPointerLeave={magOpen.onPointerLeave}
                    className="inline-block"
                  >
                    {isNight ? (
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('desks');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="rounded-full bg-white text-black font-mono text-xs font-semibold uppercase tracking-wider px-6 py-3.5 hover:bg-zinc-200 transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                      >
                        Open the Demo Desks →
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
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('pipeline');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={
                      isNight
                        ? 'rounded-full border border-white/25 bg-black/60 backdrop-blur-md font-mono text-xs uppercase tracking-wider text-white hover:border-white/50 px-6 py-3.5 transition-all'
                        : 'font-mono text-xs uppercase tracking-wider font-semibold text-fg-soft hover:text-fg px-4 py-3 transition-colors'
                    }
                  >
                    See the Pipeline ↓
                  </button>
                </div>
              </div>

              {/* Right Column (5 cols): "The Physical Register" Artifacts with Parallax */}
              <div
                className="lg:col-span-5 relative py-6 transition-transform duration-100 ease-out"
                style={{
                  transform:
                    'translate3d(calc(var(--mx, 0) * 34px), calc(var(--my, 0) * 22px), 0)',
                }}
              >
                {/* Artifact B (Conflict Slip behind, rotated -2deg) */}
                <div
                  ref={tiltB.ref}
                  onPointerMove={tiltB.onPointerMove}
                  onPointerLeave={tiltB.onPointerLeave}
                  style={{ '--rot': '-2deg' }}
                  className={`tilt absolute top-0 right-4 w-[85%] rounded-object border p-5 shadow-subtle select-none opacity-85 ${
                    isNight
                      ? 'bg-[#0A0A0E]/90 border-white/15 backdrop-blur-md'
                      : 'bg-surface border-line'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-line pb-2 mb-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-fg-soft">
                      RESOURCE SCHEDULE · LAB 4
                    </span>
                    <Stamp tone="brick" rotate={-3}>CLASH</Stamp>
                  </div>
                  <div className="h-4 w-full bg-bg rounded hatch-brick my-2" />
                  <p className="font-mono text-[11px] text-brick leading-tight">
                    Cognizant overlaps with Tech Mahindra, 10:00-12:00
                  </p>
                </div>

                {/* Artifact A (Front Candidate Slip, rotated 1.5deg) */}
                <motion.div
                  ref={tiltA.ref}
                  onPointerMove={tiltA.onPointerMove}
                  onPointerLeave={tiltA.onPointerLeave}
                  style={{ '--rot': '1.5deg' }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className={`tilt relative z-10 w-full rounded-object border p-6 shadow-object space-y-4 ${
                    isNight
                      ? 'bg-[#09090C]/85 border-white/15 backdrop-blur-xl'
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
              </div>
            </div>
          </div>

          {/* Register Ticker sits over the flared floor of Scene 1 */}
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
                    <div className="flex items-center justify-between border-b border-line pb-2">
                      <span className="font-mono text-xs uppercase tracking-[0.16em] font-semibold text-accent-deep">
                        STAGE {(currentStepIdx + 1).toString().padStart(2, '0')} / 06
                      </span>
                      <div className="h-1 w-24 bg-line rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all duration-300"
                          style={{ width: `${((currentStepIdx + 1) / 6) * 100}%` }}
                        />
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
                        <span className="font-mono text-4xl font-bold text-accent block">
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

                <div className="absolute right-6 lg:right-12 bottom-8 z-10 pointer-events-none font-mono text-[11px] text-fg-soft/60 uppercase tracking-wider flex items-center gap-2">
                  <span>SCROLL TO RIDE THE THREAD</span>
                  <span>↓</span>
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

        {/* Portals Section: Three Ruled Desks */}
        <section
          id="desks"
          className="relative z-10 py-20 px-6 lg:px-12 max-w-[1240px] mx-auto border-b border-line"
        >
          <div className="mb-12">
            <span className="font-mono text-xs uppercase tracking-[0.16em] font-semibold text-accent-deep block mb-1">
              03 · THREE UNIFIED DESKS
            </span>
            <h2 className="font-display font-normal text-3xl sm:text-4xl text-fg">
              One register, three connected perspectives.
            </h2>
          </div>

          <div className="divide-y divide-line border-y border-line">
            {desks.map((desk) => (
              <div
                key={desk.roman}
                onClick={() => navigate(desk.path)}
                className={`py-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 cursor-pointer group transition-colors px-4 ${
                  isNight ? 'hover:bg-white/[0.04]' : 'hover:bg-surface/40'
                }`}
              >
                <div className="flex items-start gap-6 min-w-0">
                  <span className="font-display text-4xl text-fg-soft/40 font-normal shrink-0 group-hover:text-accent transition-colors">
                    {desk.roman}
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-display font-medium text-2xl text-fg group-hover:text-fg transition-colors">
                      {desk.title}
                    </h3>
                    <p className="font-sans text-sm text-fg-soft max-w-2xl leading-relaxed">
                      {desk.desc}
                    </p>
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-fg-soft/80 block pt-1">
                      {desk.tags}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 font-mono text-xs font-semibold text-fg group-hover:text-accent-deep transition-colors">
                  <span>OPEN DESK</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>

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

        {/* Metrics Section */}
        <section id="metrics" className="relative z-10 py-16 px-6 lg:px-12 max-w-[1240px] mx-auto">
          <StatStrip
            items={[
              { label: 'REGISTERED STUDENTS', value: 1420, hint: 'Across 6 BPUT disciplines' },
              { label: 'HIRING PARTNERS', value: 42, hint: 'Active corporate JNFs' },
              { label: 'PLACEMENT RATE', value: 78.4, decimals: 1, suffix: '%', hint: '↑ 12.8% vs last season' },
              { label: 'HIGHEST CTC', value: 34.0, decimals: 1, prefix: '₹', suffix: ' LPA', hint: 'Cloud Systems Architect' },
            ]}
          />
        </section>

        {/* Qronos Scene 2 Closing CTA Banner (Dark Mode Showcase) */}
        <section className="relative z-10 py-24 px-6 lg:px-12 max-w-[1240px] mx-auto text-center border-t border-line">
          <h2
            className={`font-display font-normal text-3xl sm:text-5xl tracking-tight max-w-2xl mx-auto leading-[1.1] ${
              isNight
                ? 'bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent'
                : 'text-fg'
            }`}
          >
            Stop babysitting spreadsheets.
            <br />
            Let the register own the drive.
          </h2>
          <p className="font-sans text-sm sm:text-base text-fg-soft max-w-lg mx-auto mt-4 leading-relaxed">
            Turn every JNF, student verification, and interview slot into explainable, conflict-free placement workflows.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <button
              type="button"
              onClick={() => navigate('/student/overview')}
              className={
                isNight
                  ? 'rounded-full border border-white/25 bg-black/70 backdrop-blur-md px-6 py-3 font-mono text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all'
                  : 'rounded-control border border-line bg-surface px-6 py-3 font-mono text-xs uppercase tracking-widest text-fg hover:bg-fg hover:text-bg transition-all'
              }
            >
              Get Started →
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/command-center')}
              className={
                isNight
                  ? 'rounded-full bg-white text-black px-6 py-3 font-mono text-xs font-semibold uppercase tracking-widest hover:bg-zinc-200 transition-all'
                  : 'rounded-control bg-btn text-btn-fg px-6 py-3 font-mono text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition-all'
              }
            >
              Open Command Center
            </button>
          </div>
        </section>

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
