import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink, CheckCircle2, Clock, FileText, ArrowRight } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { Tabs } from '../../components/ui/Tabs';
import { Stamp } from '../../components/ui/Stamp';
import { Mark } from '../../components/ui/Mark';
import { MarginNote } from '../../components/ui/MarginNote';
import { PageTransition } from '../../components/ui/PageTransition';
import { cn } from '../../lib/utils';

export function StudentApplications() {
  const { applications, offers } = useStore();
  const [activeTab, setActiveTab] = useState('applications');
  const [expandedAppId, setExpandedAppId] = useState('app-1');

  const studentOffers = offers.filter((o) => o.studentId === 's-1' || o.studentName.includes('Ananya')) || [];

  const tabs = [
    { id: 'applications', label: 'My Applications', count: applications.length },
    { id: 'offers', label: 'Offer Letters & Docs', count: studentOffers.length },
  ];

  const toggleExpand = (id) => {
    setExpandedAppId((prev) => (prev === id ? null : id));
  };

  const stages = ['Applied', 'Screened', 'Interview', 'Offer'];

  return (
    <PageTransition className="space-y-6">
      <Masthead
        context="04 · APPLICATION REGISTRATION & AUDIT"
        title="Application Log & Decisions."
        lede="Inspect transparent shortlisting factor weightages, verified rejection diagnostics, and authenticated offer documentation."
      />

      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Applications */}
      {activeTab === 'applications' && (
        <div className="divide-y divide-line border-y border-line">
          {applications.map((app) => {
            const isExpanded = expandedAppId === app.id;
            const currentStageIndex = app.status === 'Shortlisted' ? 2 : app.status === 'Rejected' ? 1 : 1;

            return (
              <div key={app.id} className="transition-colors">
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(app.id)}
                  className="py-4 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-bone/40 select-none"
                >
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-display font-medium text-xl text-ink">
                        {app.company}
                      </h3>
                      <Stamp
                        tone={
                          app.status === 'Shortlisted'
                            ? 'jade'
                            : app.status === 'Rejected'
                            ? 'brick'
                            : 'ochre'
                        }
                      >
                        {app.status}
                      </Stamp>
                    </div>
                    <p className="font-sans text-xs text-ink-soft">
                      {app.role} · Package: <span className="font-mono text-ink font-semibold">{app.ctc}</span>
                    </p>
                  </div>

                  {/* Stage thread on 2px line */}
                  <div className="hidden md:flex items-center gap-1.5 font-mono text-[10.5px]">
                    {stages.map((st, sIdx) => {
                      const isComplete = sIdx <= currentStageIndex;
                      return (
                        <div key={st} className="flex items-center gap-1.5">
                          <span className={cn(isComplete ? 'text-ink font-bold' : 'text-ink-soft/50')}>
                            {st}
                          </span>
                          {sIdx < stages.length - 1 && (
                            <span className="text-line">→</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Fit Score & Chevron */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="font-mono text-[10px] uppercase text-ink-soft block">
                        AI FIT
                      </span>
                      <span className="font-mono font-bold text-sm text-ink tabular-nums">
                        {app.fitScore}%
                      </span>
                    </div>

                    <button
                      type="button"
                      className="w-7 h-7 rounded flex items-center justify-center text-ink-soft hover:text-ink transition-colors"
                    >
                      <ChevronDown
                        className={cn('w-4 h-4 transition-transform duration-200', isExpanded && 'rotate-180')}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Section: Margin Note + Why This Score Bars */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden bg-bone/30 border-t border-line px-5 py-5 space-y-5"
                    >
                      {/* Margin Note with Highlighters */}
                      <MarginNote label={`AI EVALUATION DIAGNOSTIC · LEVEL: ${app.level.toUpperCase()}`} strong>
                        {app.status === 'Rejected' ? (
                          <>
                            Below Threshold: The student's CGPA meets the cut-off, but the verified skills matrix shows a significant gap in{' '}
                            <Mark delay={0.3}>cloud infrastructure</Mark> &amp; distributed system design, and the{' '}
                            <Mark delay={0.6}>mock interview benchmark</Mark> is below the recruiter's threshold of 85.
                          </>
                        ) : (
                          <>
                            {app.explanation}
                          </>
                        )}
                      </MarginNote>

                      {/* Factor Weightage Bars */}
                      <div className="space-y-2 pt-1 max-w-2xl">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft block font-semibold">
                          DECISION FACTOR WEIGHTAGE &amp; ALIGNMENT
                        </span>

                        <div className="space-y-2">
                          {app.breakdown?.map((factor, fIdx) => (
                            <div key={fIdx} className="space-y-1">
                              <div className="flex items-center justify-between font-mono text-[11px]">
                                <span className="text-ink">
                                  {factor.factor} <span className="text-ink-soft">({factor.weight}% weight)</span>
                                </span>
                                <strong className="text-ink">{factor.score}/100</strong>
                              </div>
                              <div className="h-1.5 w-full bg-line/60 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${factor.score}%` }}
                                  transition={{ duration: 0.5, delay: fIdx * 0.08 }}
                                  className={cn(
                                    'h-full rounded-full',
                                    factor.score >= 80 ? 'bg-jade' : factor.score >= 60 ? 'bg-ochre' : 'bg-brick'
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Remediation Action Link */}
                      {app.status === 'Rejected' && (
                        <div className="pt-2 flex items-center gap-2 font-mono text-xs">
                          <span className="text-ink-soft">Actionable Roadmap:</span>
                          <a
                            href="https://notion.so"
                            target="_blank"
                            rel="noreferrer"
                            className="text-ink font-semibold hover:text-ochre-deep inline-flex items-center gap-1 underline underline-offset-4"
                          >
                            <span>Open Notion Remediation Module</span>
                            <ArrowRight className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Offer Letters */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          {studentOffers.map((offer) => (
            <div
              key={offer.id}
              className="bg-paper rounded-object border border-line p-6 shadow-object space-y-4 max-w-2xl"
            >
              <div className="flex items-start justify-between border-b border-line pb-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft block">
                    AUTHENTICATED OFFER RECORD · BPUT SEASON 2026
                  </span>
                  <h3 className="font-display font-medium text-2xl text-ink mt-0.5">
                    {offer.company}
                  </h3>
                  <p className="font-mono text-xs text-ink-soft mt-0.5">
                    CTC: <strong className="text-ink font-display text-base">{offer.ctc}</strong> · Joining: {offer.joiningDate}
                  </p>
                </div>
                <Stamp tone="jade">{offer.status}</Stamp>
              </div>

              <div>
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft font-semibold block mb-2">
                  Joining Document Checklist
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                  {offer.documents.map((doc, dIdx) => (
                    <div key={dIdx} className="p-2.5 bg-bone/50 rounded-xs border border-line flex items-center justify-between">
                      <span className="text-ink">{doc.name}</span>
                      {doc.status === 'verified' ? (
                        <span className="text-jade font-semibold">✓ Done</span>
                      ) : (
                        <span className="text-ochre-deep font-semibold">Pending</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
