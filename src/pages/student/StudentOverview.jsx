import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Calendar,
  Briefcase,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ScoreDial } from '../../components/ui/ScoreDial';
import { MetricCard } from '../../components/ui/MetricCard';
import { Button } from '../../components/ui/Button';
import { PageTransition } from '../../components/ui/PageTransition';
import { cn } from '../../lib/utils';

export function StudentOverview() {
  const { currentStudent, applications, drives, studentInterviews } = useStore();

  // Gap chips interactive state for signature animation
  const initialGaps = [
    { id: 'gap-1', skill: 'Cloud Infrastructure (AWS/Azure)', points: 4, inProgress: false },
    { id: 'gap-2', skill: 'Distributed System Design', points: 3, inProgress: false },
    { id: 'gap-3', skill: 'Mock Coding Interviews (Hard Algorithmic)', points: 5, inProgress: false },
    { id: 'gap-4', skill: 'Certified Kubernetes / DevOps Foundations', points: 2, inProgress: false },
  ];

  const [gaps, setGaps] = useState(initialGaps);

  // Compute dynamic score based on toggled gaps
  const baseScore = currentStudent.readinessScore || 72;
  const addedPoints = gaps.filter((g) => g.inProgress).reduce((acc, g) => acc + g.points, 0);
  const currentScore = Math.min(baseScore + addedPoints, 100);

  // Readiness Ladder determination
  const getLadderLevel = (score) => {
    if (score >= 90) return 'Highly Employable';
    if (score >= 80) return 'Ready';
    if (score >= 65) return 'Developing';
    return 'Not Ready';
  };

  const currentLevel = getLadderLevel(currentScore);
  const ladderSteps = ['Not Ready', 'Developing', 'Ready', 'Highly Employable'];

  const toggleGap = (id) => {
    setGaps((prev) =>
      prev.map((g) => (g.id === id ? { ...g, inProgress: !g.inProgress } : g))
    );
  };

  return (
    <PageTransition className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-semibold text-3xl text-ink tracking-tight">
              Welcome, {currentStudent.name}
            </h1>
            <Badge
              tone={currentStudent.verified ? 'jade' : 'ochre'}
              dot={true}
              size="md"
            >
              {currentStudent.verified ? 'Verified by Placement Cell' : currentStudent.verificationStatus}
            </Badge>
          </div>
          <p className="text-sm text-ink-soft mt-1">
            B.Tech Computer Science & Engineering · Roll No: {currentStudent.rollNo} · CGPA: {currentStudent.cgpa}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-soft">Academic Season:</span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-paper border border-line text-ink">
            2026 Graduating Cohort
          </span>
        </div>
      </div>

      {/* Row of 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          label="Eligible Drives"
          value={18}
          icon={Calendar}
          hint="Based on 8.8 CGPA & CSE branch"
        />
        <MetricCard
          label="Active Applications"
          value={applications.length}
          icon={FileText}
          hint="Across IT & Product MNCs"
        />
        <MetricCard
          label="Interviews Scheduled"
          value={studentInterviews.length}
          icon={Briefcase}
          hint="Upcoming on-campus & virtual"
        />
        <MetricCard
          label="AI Resume Score"
          value={currentStudent.resumeScore}
          suffix="%"
          icon={Award}
          hint="Verified against industry standards"
        />
      </div>

      {/* Main Split: Readiness Score & Diagnostic + Skill Gap Action Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Placement Readiness Score & Ladder */}
        <Card className="lg:col-span-5 p-6 flex flex-col items-center justify-between min-h-[440px]">
          <div className="w-full flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Continuous Employability Diagnostic
              </span>
              <h3 className="font-display font-semibold text-lg text-ink">
                Placement Readiness
              </h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-bone border border-line text-ink font-medium">
              ML Scoring Model
            </span>
          </div>

          {/* Large Animated ScoreDial */}
          <div className="my-6">
            <ScoreDial
              value={currentScore}
              size={210}
              label="Overall Readiness"
              subtext="Aggregates CGPA, aptitude benchmarks, technical stack depth, and mock interviews."
            />
          </div>

          {/* 4-Step Readiness Ladder (PS Deliverable 1 & C) */}
          <div className="w-full pt-4 border-t border-line/60">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-ink-soft mb-2">
              <span>Readiness Progression Ladder</span>
              <span className="text-ochre-deep font-bold">{currentLevel}</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 relative">
              {ladderSteps.map((step) => {
                const isCurrent = step === currentLevel;
                const isPassed =
                  ladderSteps.indexOf(step) <= ladderSteps.indexOf(currentLevel);

                return (
                  <div key={step} className="flex flex-col items-center text-center">
                    <div
                      className={cn(
                        'h-2 w-full rounded-full transition-all duration-500 relative',
                        isCurrent
                          ? 'bg-ochre shadow-sm'
                          : isPassed
                          ? 'bg-jade'
                          : 'bg-line/80'
                      )}
                    >
                      {isCurrent && (
                        <motion.div
                          layoutId="ladderPulse"
                          className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-ochre/30 flex items-center justify-center animate-ping"
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] mt-1.5 leading-tight select-none',
                        isCurrent ? 'font-bold text-ink' : 'text-ink-soft/70'
                      )}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Right Column: Skill Gaps for Target Job Roles */}
        <Card className="lg:col-span-7 p-6 flex flex-col justify-between min-h-[440px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-ochre-deep">
                  Target Recruiter Benchmark
                </span>
                <h3 className="font-display font-semibold text-lg text-ink">
                  Skill Gaps for Microsoft SDE
                </h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-ochre-tint text-ochre-deep font-semibold">
                Cut-off: 80+ Ready
              </span>
            </div>

            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed mb-6">
              Our AI engine identified specific areas where closing the gap will boost your overall readiness rating and qualify you for tier-1 recruiter shortlists. <span className="font-medium text-ink">Click a gap chip below to simulate completing the recommendation:</span>
            </p>

            {/* Interactive Signature Chips */}
            <div className="space-y-3">
              {gaps.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => toggleGap(item.id)}
                  className={cn(
                    'p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none',
                    item.inProgress
                      ? 'bg-ochre-tint/50 border-ochre text-ink shadow-subtle'
                      : 'bg-bone/40 border-line hover:border-line/80 text-ink'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-md border flex items-center justify-center transition-colors',
                        item.inProgress
                          ? 'bg-ochre border-ochre text-ink'
                          : 'border-ink-soft/40 bg-paper'
                      )}
                    >
                      {item.inProgress && (
                        <motion.svg
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.3 }}
                          className="w-3.5 h-3.5 text-ink"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </motion.svg>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-medium">
                      {item.skill}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded',
                        item.inProgress
                          ? 'bg-ochre text-ink'
                          : 'bg-paper text-ink-soft border border-line'
                      )}
                    >
                      +{item.points} pts
                    </span>
                    <span className="text-[11px] text-ink-soft hidden sm:inline">
                      {item.inProgress ? 'In Progress' : 'Click to add'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom Guidance Box */}
          <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between text-xs text-ink-soft">
            <span>
              Simulated score: <strong className="text-ink">{currentScore}/100</strong> ({currentLevel})
            </span>
            <span className="text-ochre-deep font-medium">
              {currentScore >= 80 ? '✓ Ready for Tier-1 Corporate Shortlisting' : 'Needs +8 pts to reach Ready tier'}
            </span>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}

