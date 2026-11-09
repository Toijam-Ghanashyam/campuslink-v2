// src/pages/student/StudentOverview.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';
import { useStore } from '../../lib/store';
import { ScoreDial } from '../../components/ui/ScoreDial';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const GAP_MODULES = [
  {
    id: 'cloud',
    label: 'Cloud Infrastructure (AWS / Azure)',
    boost: 4,
    tag: 'INFRA · LAB VERIFIED',
  },
  {
    id: 'sysdesign',
    label: 'Distributed System Design',
    boost: 3,
    tag: 'ARCHITECTURE · RUBRIC',
  },
  {
    id: 'mock',
    label: 'Mock Coding Interviews (Hard Algorithmic)',
    boost: 5,
    tag: 'DSA · PANEL EVALUATED',
  },
  {
    id: 'k8s',
    label: 'Certified Kubernetes Foundations',
    boost: 2,
    tag: 'DEVOPS · CREDENTIAL',
  },
];

export function StudentOverview() {
  const navigate = useNavigate();
  const store = useStore() || {};
  const student = store.currentStudent || store.students?.[0] || {
    name: 'Zahid Khan',
    roll: '21CS3042',
    branch: 'CSE',
    cgpa: 8.8,
    readiness: 72,
  };

  const baseScore = student.readiness || 72;
  const [completedGaps, setCompletedGaps] = useState({});
  const [hoveredBoost, setHoveredBoost] = useState(0);

  const toggleGap = (id) => {
    setCompletedGaps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const earnedBoost = GAP_MODULES.reduce(
    (sum, m) => sum + (completedGaps[m.id] ? m.boost : 0),
    0
  );
  const currentScore = Math.min(100, baseScore + earnedBoost);
  const currentTier =
    currentScore >= 85
      ? 'HIGHLY EMPLOYABLE'
      : currentScore >= 75
      ? 'READY'
      : currentScore >= 50
      ? 'DEVELOPING'
      : 'NOT READY';

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Top Quick Telemetry Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 border-b border-line pb-4 sm:pb-5 font-mono text-xs text-fg-soft">
        <div className="border-l border-line pl-2.5 sm:pl-3">
          <span className="block text-[9.5px] sm:text-[10px] uppercase tracking-widest opacity-60">
            ACADEMIC STANDING
          </span>
          <span className="font-sans text-xs sm:text-sm text-fg font-medium truncate block">
            {student.cgpa || '8.80'} CGPA & {student.branch || 'CSE'}
          </span>
        </div>
        <div className="border-l border-line pl-2.5 sm:pl-3">
          <span className="block text-[9.5px] sm:text-[10px] uppercase tracking-widest opacity-60">
            ELIGIBLE DRIVES
          </span>
          <span className="font-sans text-xs sm:text-sm text-fg font-medium truncate block">
            Across IT & product MNCs
          </span>
        </div>
        <div className="border-l border-line pl-2.5 sm:pl-3">
          <span className="block text-[9.5px] sm:text-[10px] uppercase tracking-widest opacity-60">
            INTERVIEW CALENDAR
          </span>
          <span className="font-sans text-xs sm:text-sm text-fg font-medium truncate block">
            Synchronized with recruiter desk
          </span>
        </div>
        <div className="border-l border-line pl-2.5 sm:pl-3">
          <span className="block text-[9.5px] sm:text-[10px] uppercase tracking-widest opacity-60">
            RESUME ARTIFACT
          </span>
          <span className="font-sans text-xs sm:text-sm text-fg font-medium truncate block">
            Verified ATS format
          </span>
        </div>
      </div>

      {/* Main Two-Column Readiness & Gap Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: 01 · PLACEMENT READINESS INSTRUMENT */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between border-b border-line pb-2 font-mono text-[10.5px] sm:text-[11px] uppercase tracking-widest">
            <span className="text-fg-soft">
              01 · PLACEMENT READINESS INSTRUMENT
            </span>
            <span className="text-accent-ink font-semibold">
              EVALUATION MODEL V2.4
            </span>
          </div>

          <Card className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 relative overflow-hidden">
            <div className="flex flex-col items-center text-center">
              <ScoreDial
                value={currentScore}
                baseValue={baseScore}
                previewDelta={hoveredBoost}
                label="EMPLOYABILITY DIAGNOSTIC"
              />

              <p className="font-sans text-xs sm:text-sm text-fg-soft max-w-md mt-3 leading-relaxed">
                Aggregated across authenticated university grades, mock coding interviews, and verified project repositories.
              </p>
            </div>

            {/* Interactive Animated Progression Ruler */}
            <div className="pt-4 border-t border-line space-y-3">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
                <span className="text-fg-soft">PROGRESSION RULER</span>
                <span
                  className={
                    currentScore >= 80
                      ? 'text-jade font-bold'
                      : 'text-accent-ink font-bold'
                  }
                >
                  {currentTier} ({currentScore}/100)
                </span>
              </div>

              {/* Continuous Illuminated Track + Live Sliding Marker */}
              <div className="relative h-2.5 w-full rounded-full bg-line/40 overflow-visible">
                {/* 80+ Target Benchmark Line */}
                <div
                  className="absolute -top-1.5 bottom-[-6px] w-[1.5px] bg-jade/70 z-10"
                  style={{ left: '80%' }}
                  title="80+ Target Ready Benchmark"
                />

                {/* Animated Progress Fill */}
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${currentScore}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                  style={{
                    background:
                      currentScore >= 80
                        ? 'linear-gradient(90deg, rgb(var(--c-accent)), rgb(var(--c-jade)))'
                        : 'linear-gradient(90deg, rgb(var(--c-accent) / 0.55), rgb(var(--c-accent)))',
                    boxShadow: '0 0 14px rgb(var(--c-accent) / 0.45)',
                  }}
                />

                {/* Glowing Live Score Beacon on the Ruler */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full border-2 border-white bg-accent shadow-[0_0_12px_rgb(var(--c-accent))]"
                  animate={{ left: `${currentScore}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                />
              </div>

              {/* 4 Milestone Tier Columns (Responsive on mobile) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider">
                {[
                  { label: 'NOT READY', min: 0, max: 49 },
                  { label: 'DEVELOPING', min: 50, max: 74 },
                  { label: 'READY', min: 75, max: 84 },
                  { label: 'HIGH FIT', min: 85, max: 100 },
                ].map((m) => {
                  const isActive =
                    currentScore >= m.min && currentScore <= m.max;
                  const isPassed = currentScore > m.max;
                  return (
                    <div
                      key={m.label}
                      className={`border-l pl-2 transition-colors duration-300 ${
                        isActive
                          ? 'border-accent text-fg font-bold'
                          : isPassed
                          ? 'border-jade/60 text-jade/80'
                          : 'border-line text-fg-soft/50'
                      }`}
                    >
                      {m.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: 02 · CLOSE TARGET GAPS */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between border-b border-line pb-2 font-mono text-[10.5px] sm:text-[11px] uppercase tracking-widest">
            <span className="text-fg-soft">02 · CLOSE TARGET GAPS</span>
            <span className="text-fg-soft">BENCHMARK: 80+ READY</span>
          </div>

          <div className="space-y-4">
            <p className="font-sans text-xs sm:text-sm text-fg-soft leading-relaxed">
              Targeting <strong className="text-fg">Microsoft India SDE</strong>.
              Select gaps to simulate completing recommended modules:
            </p>

            <div className="divide-y divide-line border-y border-line rounded-lg overflow-hidden bg-surface/30">
              {GAP_MODULES.map((mod) => {
                const checked = !!completedGaps[mod.id];
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => toggleGap(mod.id)}
                    onMouseEnter={() =>
                      !checked && setHoveredBoost(mod.boost)
                    }
                    onMouseLeave={() => setHoveredBoost(0)}
                    className={`w-full py-3 sm:py-3.5 px-3 flex items-center justify-between gap-3 text-left transition-all duration-200 group relative overflow-hidden min-h-[48px] ${
                      checked
                        ? 'bg-jade-tint/20'
                        : 'hover:bg-surface/60 hover:pl-4'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-200 ${
                          checked
                            ? 'bg-jade border-jade text-black shadow-[0_0_10px_rgb(var(--c-jade)/0.5)]'
                            : 'border-line group-hover:border-accent'
                        }`}
                      >
                        {checked && <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />}
                      </span>
                      <div className="min-w-0">
                        <span
                          className={`block font-sans text-xs sm:text-sm transition-colors truncate ${
                            checked
                              ? 'text-fg font-medium'
                              : 'text-fg-soft group-hover:text-fg'
                          }`}
                        >
                          {mod.label}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-widest text-fg-soft/60 block truncate">
                          {mod.tag}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`font-mono text-xs font-bold shrink-0 px-2 py-0.5 rounded transition-all ${
                        checked
                          ? 'bg-jade/20 text-jade'
                          : 'text-accent-ink group-hover:bg-accent/15'
                      }`}
                    >
                      +{mod.boost}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live Diagnostic Score Summary Bar */}
            <div className="flex items-center justify-between pt-1 font-mono text-xs">
              <span className="uppercase tracking-widest text-fg-soft text-[10.5px] sm:text-xs">
                DIAGNOSTIC SCORE:
              </span>
              <div className="flex items-center gap-2">
                {earnedBoost > 0 && (
                  <span className="text-jade font-semibold text-[11px] sm:text-xs">
                    (+{earnedBoost} simulated)
                  </span>
                )}
                <span className="text-sm font-bold text-fg">
                  {currentScore}/100
                </span>
              </div>
            </div>

            {currentScore >= 80 ? (
              <div className="rounded-object border border-jade/40 bg-jade-tint/25 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-jade shrink-0" />
                  <span className="font-mono text-xs text-fg">
                    Target 80+ threshold unlocked for Microsoft India SDE.
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => navigate('/student/drives')}
                  icon={ArrowRight}
                  className="w-full sm:w-auto"
                >
                  Apply Now
                </Button>
              </div>
            ) : (
              <div className="rounded-object border border-line bg-surface/50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="text-fg-soft">
                  <span className="font-mono text-xs">
                    Select +{80 - currentScore} more points above to cross the
                    80+ shortlist benchmark.
                  </span>
                </div>
                <TrendingUp className="h-4 w-4 text-accent shrink-0 hidden sm:block" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentOverview;
