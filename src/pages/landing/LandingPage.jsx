import React, { useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  UserCheck,
  Building2,
  Briefcase,
  Layers,
  CalendarCheck,
  BellRing,
  Award,
  BarChart3,
  Cpu,
  Brain,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Stamp } from '../../components/ui/Stamp';
import { Mark } from '../../components/ui/Mark';
import { MarginNote } from '../../components/ui/MarginNote';
import { Rule } from '../../components/ui/Rule';
import { StatStrip } from '../../components/ui/StatStrip';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Backdrop } from '../../components/ui/Backdrop';
import { IntroOverlay } from '../../components/ui/IntroOverlay';
import { RegisterTicker } from '../../components/ui/RegisterTicker';
import { useTilt, useMagnetic } from '../../fx/useTilt';
import { useInView } from '../../fx/useInView';
import { useFx, setFxMode } from '../../fx/useFx';

const HeroCanvas = lazy(() => import('../../three/HeroCanvas.jsx'));

export function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const inView = useInView(heroRef);
  const { mode, use3d } = useFx();
  const tiltA = useTilt({ max: 5 });
  const tiltB = useTilt({ max: 5 });
  const magOpen = useMagnetic({ strength: 0.25 });

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
    <div className="min-h-screen bg-bg text-fg selection:bg-accent-tint selection:text-fg relative">
      <IntroOverlay />
      <Backdrop />
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur-sm border-b border-line px-6 lg:px-12 h-16 flex items-center justify-between">
        <div className="flex items-baseline gap-1.5 select-none">
          <span className="font-display font-medium text-2xl text-fg tracking-tight">CampusLink</span>
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
          <Button
            variant="primary"
            onClick={() => navigate('/student/overview')}
            icon={ArrowRight}
          >
            Launch System Demo
          </Button>
        </div>
      </header>

      {/* Hero Section: Asymmetric 12-Column Grid */}
      <section
        ref={heroRef}
        onPointerMove={handleHeroPointerMove}
        className="pt-16 pb-20 px-6 lg:px-12 max-w-[1240px] mx-auto border-b border-line relative overflow-hidden"
      >
        {use3d && (
          <div
            className="absolute inset-0 z-0 pointer-events-none transition-transform duration-100 ease-out"
            style={{ transform: 'translate3d(calc(var(--mx, 0) * -22px), 0, 0)' }}
          >
            <Suspense fallback={null}>
              <HeroCanvas visible={inView} />
            </Suspense>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column (7 cols): Editorial Typography */}
          <div className="lg:col-span-7 space-y-6">
            <span className="font-mono text-xs uppercase tracking-[0.16em] font-semibold text-accent-deep block">
              BPUT HACKATHON 2026 · PS10 PLACEMENT PLATFORM
            </span>

            <h1 className="font-display font-normal text-4xl sm:text-6xl text-fg tracking-tight leading-[1.04]">
              Every shortlist,{' '}
              <span className="font-serif italic font-normal">
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
              </span>
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
            </div>
          </div>

          {/* Right Column (5 cols): "The Physical Register" Artifacts with Parallax */}
          <div
            className="lg:col-span-5 relative py-6 transition-transform duration-100 ease-out"
            style={{ transform: 'translate3d(calc(var(--mx, 0) * 34px), calc(var(--my, 0) * 22px), 0)' }}
          >
            {/* Artifact B (Conflict Slip behind, rotated -2deg) */}
            <div
              ref={tiltB.ref}
              onPointerMove={tiltB.onPointerMove}
              onPointerLeave={tiltB.onPointerLeave}
              style={{ '--rot': '-2deg' }}
              className="tilt absolute top-0 right-4 w-[85%] bg-surface rounded-object border border-line p-5 shadow-subtle select-none opacity-85"
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
              className="tilt relative z-10 w-full glass-strong rounded-object border border-line p-6 shadow-object space-y-4"
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
      </section>

      {/* Register Ticker */}
      <RegisterTicker />

      {/* 6-Step Pipeline Thread Section */}
      <section id="pipeline" className="py-20 px-6 lg:px-12 max-w-[1240px] mx-auto border-b border-line">
        <div className="mb-12">
          <span className="font-mono text-xs uppercase tracking-[0.16em] font-semibold text-ochre-deep block mb-1">
            02 · THE PLACEMENT THREAD
          </span>
          <h2 className="font-display font-normal text-3xl sm:text-4xl text-ink">
            Six stages, one continuous pipeline.
          </h2>
        </div>

        {/* 6 Steps Grid with Thread */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pipelineSteps.map((step) => (
            <div key={step.num} className="border-t-2 border-line pt-4 space-y-2">
              <span className="font-mono text-sm font-semibold text-ochre-deep block">
                {step.num}
              </span>
              <h3 className="font-display font-medium text-xl text-ink">
                {step.title}
              </h3>
              <p className="font-sans text-xs sm:text-sm text-ink-soft leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Portals Section: Three Ruled Desks (Not Cards!) */}
      <section id="desks" className="py-20 px-6 lg:px-12 max-w-[1240px] mx-auto border-b border-line">
        <div className="mb-12">
          <span className="font-mono text-xs uppercase tracking-[0.16em] font-semibold text-ochre-deep block mb-1">
            03 · THREE UNIFIED DESKS
          </span>
          <h2 className="font-display font-normal text-3xl sm:text-4xl text-ink">
            One register, three connected perspectives.
          </h2>
        </div>

        <div className="divide-y divide-line border-y border-line">
          {desks.map((desk) => (
            <div
              key={desk.roman}
              onClick={() => navigate(desk.path)}
              className="py-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 cursor-pointer group hover:bg-bone/40 transition-colors px-2"
            >
              <div className="flex items-start gap-6 min-w-0">
                <span className="font-display text-4xl text-ink-soft/40 font-normal shrink-0 group-hover:text-ochre transition-colors">
                  {desk.roman}
                </span>
                <div className="space-y-1">
                  <h3 className="font-display font-medium text-2xl text-ink group-hover:text-ink transition-colors">
                    {desk.title}
                  </h3>
                  <p className="font-sans text-sm text-ink-soft max-w-2xl leading-relaxed">
                    {desk.desc}
                  </p>
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft/80 block pt-1">
                    {desk.tags}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2 font-mono text-xs font-semibold text-ink group-hover:text-ochre-deep transition-colors">
                <span>OPEN DESK</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Under the Hood Section */}
      <section id="architecture" className="py-20 bg-ink text-bone px-6 lg:px-12">
        <div className="max-w-[1240px] mx-auto space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.16em] font-semibold text-ochre block mb-1">
                04 · UNDER THE HOOD
              </span>
              <h2 className="font-display font-normal text-3xl sm:text-4xl text-bone">
                Rules where rules belong. Models where they add value.
              </h2>
            </div>
            <span className="font-mono text-xs text-bone/50 uppercase">
              BPUT PS10 ARCHITECTURE SPEC
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2 border-t border-white/10 pt-4">
              <h4 className="font-display font-medium text-lg text-bone">
                Rule + ML Hybrid Scoring
              </h4>
              <p className="font-sans text-xs text-bone/70 leading-relaxed">
                Academic thresholds (CGPA, backlogs, branch) are strictly enforced by deterministic logic, while project relevance and mock interviews are weighted by trained regression models.
              </p>
            </div>

            <div className="space-y-2 border-t border-white/10 pt-4">
              <h4 className="font-display font-medium text-lg text-bone">
                Semantic Match Embeddings
              </h4>
              <p className="font-sans text-xs text-bone/70 leading-relaxed">
                Candidate resumes and recruiter Job Notification Forms (JNFs) are parsed into normalized skill vectors to calculate cosine similarity fit scores without keyword stuffing bias.
              </p>
            </div>

            <div className="space-y-2 border-t border-white/10 pt-4">
              <h4 className="font-display font-medium text-lg text-bone">
                Interval Overlap Scheduling
              </h4>
              <p className="font-sans text-xs text-bone/70 leading-relaxed">
                Temporal interval intersection trees detect room collisions, candidate multi-shortlist clashes, and interview panel unavailability before drives are approved.
              </p>
            </div>
          </div>

          {/* Architecture Dataflow Box */}
          <div className="p-6 rounded-object border border-white/10 bg-white/5 overflow-x-auto">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-bone/50 block mb-4">
              PLATFORM OPERATIONAL DATA FLOW
            </span>
            <div className="flex items-center justify-between gap-3 min-w-[720px] font-mono text-xs">
              <div className="p-3 bg-white/5 border border-white/10 rounded flex-1 text-center">
                <span className="text-ochre text-[10px] block">01 INPUT</span>
                <span>Student Academic Records</span>
              </div>
              <span>→</span>
              <div className="p-3 bg-white/5 border border-white/10 rounded flex-1 text-center">
                <span className="text-ochre text-[10px] block">02 EVAL</span>
                <span>Semantic Matching Engine</span>
              </div>
              <span>→</span>
              <div className="p-3 bg-white/5 border border-white/10 rounded flex-1 text-center">
                <span className="text-ochre text-[10px] block">03 SCHEDULE</span>
                <span>Conflict-Free Allocator</span>
              </div>
              <span>→</span>
              <div className="p-3 bg-white/5 border border-white/10 rounded flex-1 text-center">
                <span className="text-ochre text-[10px] block">04 STORE</span>
                <span>Shared Reactive State</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section id="metrics" className="py-16 px-6 lg:px-12 max-w-[1240px] mx-auto">
        <StatStrip
          items={[
            { label: 'REGISTERED STUDENTS', value: 1420, hint: 'Across 6 BPUT disciplines' },
            { label: 'HIRING PARTNERS', value: 42, hint: 'Active corporate JNFs' },
            { label: 'PLACEMENT RATE', value: 78.4, decimals: 1, suffix: '%', hint: '↑ 12.8% vs last season' },
            { label: 'HIGHEST CTC', value: 34.0, decimals: 1, prefix: '₹', suffix: ' LPA', hint: 'Cloud Systems Architect' },
          ]}
        />
      </section>

      {/* Institutional Footer */}
      <footer className="border-t border-line py-8 px-6 lg:px-12 bg-surface/50 font-mono text-xs text-fg-soft">
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
  );
}
