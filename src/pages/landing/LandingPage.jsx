import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
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
import { Card } from '../../components/ui/Card';
import { CountUp } from '../../components/ui/CountUp';
import { Reveal, RevealGroup, revealChild } from '../../components/ui/Reveal';

export function LandingPage() {
  const navigate = useNavigate();

  const pipelineSteps = [
    {
      step: '01',
      title: 'Readiness Profiling',
      desc: 'Multi-source analysis across academic CGPA, verified projects, and mock scores.',
      icon: UserCheck,
    },
    {
      step: '02',
      title: 'AI Matching & Scoring',
      desc: 'Semantic skill-embedding comparison yielding explainable fit scores (0-100%).',
      icon: Brain,
    },
    {
      step: '03',
      title: 'Conflict-Free Scheduling',
      desc: 'Automated temporal & venue overlap mitigation across concurrent recruiter drives.',
      icon: CalendarCheck,
    },
    {
      step: '04',
      title: 'Targeted Notifications',
      desc: 'Real-time multi-channel alerts for shortlists, interviews, and compliance deadlines.',
      icon: BellRing,
    },
    {
      step: '05',
      title: 'Offer & Doc Tracking',
      desc: 'End-to-end post-selection tracking from CTC verification to joining status.',
      icon: Award,
    },
    {
      step: '06',
      title: 'Predictive Analytics',
      desc: 'Conversion rates, early warning for unplaced candidates, and recruiter ROI.',
      icon: BarChart3,
    },
  ];

  const portals = [
    {
      role: 'Student Portal',
      title: 'Personalized Career Readiness & Intelligent Drive Matching',
      icon: UserCheck,
      path: '/student/overview',
      bullets: [
        'Continuous readiness score (72/100) & ladder level progression',
        'Transparent skill-gap diagnostic against target roles',
        'Explainable AI application feedback with remediation roadmaps',
      ],
      badge: 'Student View',
    },
    {
      role: 'Placement Cell (Admin)',
      title: 'Campus Placement Command Center & Schedule Optimization',
      icon: ShieldCheck,
      path: '/admin/command-center',
      bullets: [
        'Rapid student credential verification with PDF audit drawers',
        'Automatic venue & slot clash detection with 1-click mitigation',
        'Early warning system flagging candidates at risk of being unplaced',
      ],
      badge: 'Central Cell',
    },
    {
      role: 'Corporate Recruiter',
      title: 'AI-Ranked Talent Pipeline & Frictionless Slot Booking',
      icon: Briefcase,
      path: '/recruiter/overview',
      bullets: [
        'Semantic candidate ranking with verified proficiency chips',
        'Explainable shortlist justifications with highlighted skill matches',
        'Conflict-free calendar booking directly synced to students',
      ],
      badge: 'Recruiter TA',
    },
  ];

  return (
    <div className="min-h-screen bg-bone text-ink selection:bg-ochre-tint selection:text-ink">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-bone/90 backdrop-blur-md border-b border-line px-6 lg:px-12 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ink flex items-center justify-center text-ochre shadow-subtle">
            <Sparkles className="w-5 h-5 fill-current stroke-none" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-ink">
            CampusLink<span className="text-ochre">.</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-soft">
          <a href="#pipeline" className="hover:text-ink transition-colors">Pipeline</a>
          <a href="#portals" className="hover:text-ink transition-colors">Portals</a>
          <a href="#architecture" className="hover:text-ink transition-colors">Architecture</a>
          <a href="#impact" className="hover:text-ink transition-colors">Metrics</a>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => navigate('/student/overview')}
            icon={ArrowRight}
          >
            Launch System Demo
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-36 px-6 lg:px-12 max-w-6xl mx-auto text-center hero-grid-pattern">
        {/* Subtle radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-ochre/15 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ochre-tint border border-ochre/30 text-ochre-deep text-xs font-semibold uppercase tracking-wider mb-8">
          <Sparkles className="w-3.5 h-3.5 text-ochre fill-current stroke-none" />
          BPUT Hackathon · Problem Statement 10 Prototype
        </div>

        <h1 className="font-display font-semibold text-4xl sm:text-6xl lg:text-7xl text-ink tracking-tight leading-[1.08] max-w-4xl mx-auto mb-8">
          From campus to corporate, in one <span className="italic font-normal underline decoration-ochre decoration-4 underline-offset-8">clear pipeline</span>.
        </h1>

        <p className="text-base sm:text-xl text-ink-soft max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
          An explainable, AI-powered placement management ecosystem eliminating spreadsheets, scheduling clashes, and opaque shortlisting across university drives.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            variant="primary"
            onClick={() => {
              const el = document.getElementById('portals');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Explore the Live Portals
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => {
              const el = document.getElementById('pipeline');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            See How the Pipeline Works
          </Button>
        </div>

        {/* Floating Quick Badges */}
        <div className="mt-14 pt-8 border-t border-line/60 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-medium text-ink-soft">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-jade" />
            Rule + AI Hybrid Matching
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-jade" />
            Conflict-Aware Venue Scheduler
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-jade" />
            Transparent Explainable Shortlists
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-jade" />
            Connected Multi-Portal State
          </span>
        </div>
      </section>

      {/* The 6-Step Pipeline Section */}
      <section id="pipeline" className="py-24 bg-paper border-y border-line px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-wider font-semibold text-ochre-deep">
              The Placement Lifecycle
            </span>
            <h2 className="font-display font-semibold text-3xl sm:text-4xl text-ink mt-2 mb-4">
              Digitised, automated, and intelligently optimized
            </h2>
            <p className="text-sm text-ink-soft leading-relaxed">
              Replacing fragmented WhatsApp groups and static spreadsheets with an unbroken operational chain from student readiness to corporate onboarding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
            {pipelineSteps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-bone/40 p-6 rounded-2xl border border-line hover:border-ochre/60 transition-all hover:-translate-y-1 group relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-paper border border-line flex items-center justify-center text-ink group-hover:bg-ochre-tint group-hover:text-ochre-deep transition-colors shadow-subtle">
                        <Icon className="w-5 h-5 stroke-[1.75]" />
                      </div>
                      <span className="font-display font-bold text-lg text-ink-soft/40 group-hover:text-ochre transition-colors">
                        {item.step}
                      </span>
                    </div>

                    <h3 className="font-display font-semibold text-lg text-ink mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-line/40 flex items-center gap-1.5 text-[11px] font-semibold text-ochre-deep uppercase tracking-wider">
                    <span>Active in Prototype</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section id="portals" className="py-24 px-6 lg:px-12 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-wider font-semibold text-ochre-deep">
            Three Unified Portals
          </span>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl text-ink mt-2 mb-4">
            One interconnected campus placement network
          </h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            Every portal shares a reactive real-time state. Approve a credential as Admin, and the Student badge updates instantly. Schedule a slot as Recruiter, and it appears on the Student interview timeline.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {portals.map((portal, idx) => {
            const Icon = portal.icon;
            return (
              <div
                key={idx}
                className="bg-paper p-8 rounded-2xl border border-line flex flex-col justify-between hover:border-ochre hover:shadow-hover transition-all duration-300 hover:-translate-y-1.5 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-bone border border-line flex items-center justify-center text-ink group-hover:bg-ink group-hover:text-bone transition-colors">
                      <Icon className="w-6 h-6 stroke-[1.75]" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-bone border border-line text-ink-soft">
                      {portal.badge}
                    </span>
                  </div>

                  <h3 className="font-display font-semibold text-xl text-ink mb-2">
                    {portal.role}
                  </h3>
                  <p className="text-xs text-ink-soft mb-6 leading-relaxed">
                    {portal.title}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {portal.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="text-xs text-ink/90 flex items-start gap-2.5 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-ochre mt-1.5 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  variant="primary"
                  onClick={() => navigate(portal.path)}
                  className="w-full justify-between group-hover:bg-ochre group-hover:text-ink transition-colors"
                  icon={ArrowRight}
                >
                  <span>Launch {portal.role}</span>
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Under the Hood / Architecture Section */}
      <section id="architecture" className="py-24 bg-ink text-bone px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-wider font-semibold text-ochre">
              Architecture & Algorithms
            </span>
            <h2 className="font-display font-semibold text-3xl sm:text-4xl text-bone mt-2 mb-4">
              Under the Hood: Deliverables 8 & 9
            </h2>
            <p className="text-sm text-bone/70 leading-relaxed">
              Engineered with deterministic heuristic guardrails and vector-based semantic candidate matching to ensure shortlisting is both equitable and explainable.
            </p>
          </div>

          {/* Three Architecture Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-ochre/20 text-ochre flex items-center justify-center mb-4">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-lg text-bone mb-2">
                Rule + AI Hybrid Scoring
              </h3>
              <p className="text-xs text-bone/70 leading-relaxed">
                Deterministic academic filters (CGPA cut-off, branch eligibility, backlogs) combined with NLP-weighted project and mock interview scores.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-ochre/20 text-ochre flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-lg text-bone mb-2">
                Semantic Match Embeddings
              </h3>
              <p className="text-xs text-bone/70 leading-relaxed">
                Recruiter Job Notification Forms (JNFs) parsed into skill vectors and compared via cosine similarity with verified student technical profiles.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-ochre/20 text-ochre flex items-center justify-center mb-4">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-lg text-bone mb-2">
                Conflict-Aware Scheduling
              </h3>
              <p className="text-xs text-bone/70 leading-relaxed">
                Temporal interval intersection tree detecting room double-booking, panel unavailability, and overlapping shortlist conflicts in real time.
              </p>
            </div>
          </div>

          {/* System Architecture Flow Diagram */}
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 overflow-x-auto">
            <div className="text-xs uppercase tracking-wider font-semibold text-bone/50 mb-6">
              CampusLink End-to-End System Data Flow
            </div>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-xs font-medium min-w-[760px]">
              <div className="p-4 rounded-xl bg-white/10 border border-white/10 text-center flex-1">
                <span className="text-ochre block text-[10px] uppercase font-semibold mb-1">Source Ingestion</span>
                <span>Student Academic Records & Resumes</span>
              </div>
              <ArrowRight className="w-4 h-4 text-ochre shrink-0" />

              <div className="p-4 rounded-xl bg-white/10 border border-white/10 text-center flex-1">
                <span className="text-ochre block text-[10px] uppercase font-semibold mb-1">Intelligence Layer</span>
                <span>Hybrid Scoring & Readiness Engine</span>
              </div>
              <ArrowRight className="w-4 h-4 text-ochre shrink-0" />

              <div className="p-4 rounded-xl bg-white/10 border border-white/10 text-center flex-1">
                <span className="text-ochre block text-[10px] uppercase font-semibold mb-1">Scheduler</span>
                <span>Conflict & Resource Allocation Matrix</span>
              </div>
              <ArrowRight className="w-4 h-4 text-ochre shrink-0" />

              <div className="p-4 rounded-xl bg-white/10 border border-white/10 text-center flex-1">
                <span className="text-ochre block text-[10px] uppercase font-semibold mb-1">Execution</span>
                <span>Reactive Real-Time Cross-Portal Store</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section id="impact" className="py-24 px-6 lg:px-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <Card className="p-6">
            <span className="text-xs uppercase tracking-wider font-semibold text-ink-soft">Registered Students</span>
            <div className="font-display font-semibold text-4xl text-ink mt-2 mb-1 tabular-nums">
              <CountUp to={1420} />
            </div>
            <span className="text-xs text-ink-soft">Across 6 BPUT disciplines</span>
          </Card>

          <Card className="p-6">
            <span className="text-xs uppercase tracking-wider font-semibold text-ink-soft">Recruiter Partners</span>
            <div className="font-display font-semibold text-4xl text-ink mt-2 mb-1 tabular-nums">
              <CountUp to={42} />
            </div>
            <span className="text-xs text-ink-soft">IT, Product & Core MNCs</span>
          </Card>

          <Card className="p-6">
            <span className="text-xs uppercase tracking-wider font-semibold text-ink-soft">Placement Rate</span>
            <div className="font-display font-semibold text-4xl text-ink mt-2 mb-1 tabular-nums">
              <CountUp to={78.4} decimals={1} suffix="%" />
            </div>
            <span className="text-xs text-jade font-medium">↑ 12.8% vs last season</span>
          </Card>

          <Card className="p-6">
            <span className="text-xs uppercase tracking-wider font-semibold text-ink-soft">Highest Package</span>
            <div className="font-display font-semibold text-4xl text-ink mt-2 mb-1 tabular-nums">
              <CountUp to={34.0} decimals={1} prefix="₹" suffix=" LPA" />
            </div>
            <span className="text-xs text-ink-soft">Cloud Systems Engineer</span>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line py-10 px-6 lg:px-12 bg-bone text-xs text-ink-soft">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-ink">CampusLink AI</span>
            <span>—</span>
            <span>BPUT Hackathon 2026 Submission</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Odisha Ink Palette</span>
            <span>Fraunces + Manrope Typography</span>
            <span>Zero Opaque Decisions</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

