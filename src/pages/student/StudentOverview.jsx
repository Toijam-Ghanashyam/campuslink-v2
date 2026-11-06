import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { StatStrip } from '../../components/ui/StatStrip';
import { ScoreDial } from '../../components/ui/ScoreDial';
import { Stamp } from '../../components/ui/Stamp';
import { Rule } from '../../components/ui/Rule';
import { PageTransition } from '../../components/ui/PageTransition';
import { useTilt } from '../../fx/useTilt';
import { cn } from '../../lib/utils';

export function StudentOverview() {
  const { currentStudent, applications, studentInterviews } = useStore();
  const dialTilt = useTilt({ max: 5 });

  const initialGaps = [
    { id: 'gap-1', skill: 'Cloud Infrastructure (AWS / Azure)', points: 4, inProgress: false },
    { id: 'gap-2', skill: 'Distributed System Design', points: 3, inProgress: false },
    { id: 'gap-3', skill: 'Mock Coding Interviews (Hard Algorithmic)', points: 5, inProgress: false },
    { id: 'gap-4', skill: 'Certified Kubernetes Foundations', points: 2, inProgress: false },
  ];

  const [gaps, setGaps] = useState(initialGaps);

  const baseScore = currentStudent.readinessScore || 72;
  const addedPoints = gaps.filter((g) => g.inProgress).reduce((acc, g) => acc + g.points, 0);
  const currentScore = Math.min(baseScore + addedPoints, 100);

  const getLadderLevel = (score) => {
    if (score >= 90) return 'Highly Employable';
    if (score >= 80) return 'Ready';
    if (score >= 65) return 'Developing';
    return 'Not Ready';
  };

  const currentLevel = getLadderLevel(currentScore);

  const toggleGap = (id) => {
    setGaps((prev) =>
      prev.map((g) => (g.id === id ? { ...g, inProgress: !g.inProgress } : g))
    );
  };

  const ladderTiers = [
    { label: 'NOT READY', threshold: 0 },
    { label: 'DEVELOPING', threshold: 65 },
    { label: 'READY', threshold: 80 },
    { label: 'HIGHLY EMPLOYABLE', threshold: 90 },
  ];

  return (
    <PageTransition className="space-y-6">
      {/* Editorial Masthead */}
      <Masthead
        context={`01 · STUDENT DESK · ROLL ${currentStudent.rollNo}`}
        title={`Good morning, ${currentStudent.name}.`}
        lede={`B.Tech Computer Science & Engineering (CGPA ${currentStudent.cgpa}). Your academic record is locked. Closing target skill gaps will advance your readiness to Tier-1 shortlists.`}
        action={
          <Stamp tone={currentStudent.verified ? 'jade' : 'ochre'}>
            {currentStudent.verified ? 'VERIFIED' : 'PENDING AUDIT'}
          </Stamp>
        }
      />

      {/* Ruled StatStrip (No separate card boxes!) */}
      <StatStrip
        items={[
          { label: 'ELIGIBLE DRIVES', value: 18, hint: '8.80 CGPA & CSE discipline' },
          { label: 'ACTIVE APPLICATIONS', value: applications.length, hint: 'Across IT & product MNCs' },
          { label: 'CONFIRMED INTERVIEWS', value: studentInterviews.length, hint: 'Synchronized with recruiter desk' },
          { label: 'AI RESUME SCORE', value: currentStudent.resumeScore, suffix: '%', hint: 'Verified ATS format' },
        ]}
      />

      {/* Asymmetric 7/5 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pt-2">
        {/* Left Column (7 cols): ScoreDial Instrument & Readiness Ruler */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border-b border-line pb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-ink-soft">
              01 · PLACEMENT READINESS INSTRUMENT
            </span>
            <span className="font-mono text-[10px] text-ochre-deep uppercase font-semibold">
              EVALUATION MODEL v2.4
            </span>
          </div>

          {/* Instrument Paper Object */}
          <div
            ref={dialTilt.ref}
            onPointerMove={dialTilt.onPointerMove}
            onPointerLeave={dialTilt.onPointerLeave}
            className="tilt glass-strong rounded-object border border-line p-6 shadow-object flex flex-col items-center"
          >
            <ScoreDial
              value={currentScore}
              size={230}
              level={currentLevel}
              label="Employability Diagnostic"
              subtext="Aggregated across authenticated grades, mock interviews, and verified project repos."
            />

            {/* The Horizontal Readiness Ruler */}
            <div className="w-full mt-6 pt-5 border-t border-line">
              <div className="flex justify-between font-mono text-[10px] uppercase text-ink-soft mb-2">
                <span>Progression Ruler</span>
                <span className="text-ochre-deep font-bold">{currentLevel}</span>
              </div>

              <div className="relative pt-3 pb-1">
                {/* Ruler track line */}
                <div className="h-px w-full bg-ink/40 relative">
                  {ladderTiers.map((tier, idx) => {
                    const isReached = currentScore >= tier.threshold;
                    return (
                      <div
                        key={tier.label}
                        className="absolute top-0 transform -translate-x-1/2"
                        style={{ left: `${(idx / 3) * 100}%` }}
                      >
                        {/* Tick mark */}
                        <div className={cn('h-2.5 w-px', isReached ? 'bg-ochre' : 'bg-ink/40')} />
                        <span className={cn('font-mono text-[9px] block mt-1 select-none', isReached ? 'text-ink font-bold' : 'text-ink-soft/60')}>
                          {tier.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Ruled Skill Gaps */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border-b border-line pb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-ink-soft">
              02 · CLOSE TARGET GAPS
            </span>
            <span className="font-mono text-[10px] text-ink-soft">
              BENCHMARK: 80+ READY
            </span>
          </div>

          <p className="font-sans text-xs text-ink-soft leading-relaxed">
            Targeting <strong className="text-ink">Microsoft India SDE</strong>. Select gaps to simulate completing recommended modules:
          </p>

          {/* Ruled rows (No heavy cards!) */}
          <div className="divide-y divide-line border-y border-line">
            {gaps.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleGap(item.id)}
                className={cn(
                  'py-3.5 px-2 flex items-center justify-between cursor-pointer transition-colors select-none',
                  item.inProgress ? 'bg-ochre-tint/30' : 'hover:bg-bone/40'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-4 h-4 rounded-xs border flex items-center justify-center transition-colors',
                      item.inProgress ? 'bg-ochre border-ochre text-ink' : 'border-line bg-paper'
                    )}
                  >
                    {item.inProgress && (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className={cn('text-xs font-medium', item.inProgress ? 'text-ink font-semibold' : 'text-ink-soft')}>
                    {item.skill}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-ochre-deep">
                    +{item.points}
                  </span>
                  {item.inProgress && (
                    <Stamp tone="ochre" rotate={0}>IN PROGRESS</Stamp>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 font-mono text-[11px] text-ink-soft flex justify-between">
            <span>DIAGNOSTIC SCORE:</span>
            <strong className="text-ink font-bold">{currentScore}/100</strong>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
