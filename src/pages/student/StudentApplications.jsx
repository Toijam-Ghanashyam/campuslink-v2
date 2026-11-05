import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Award,
  Calendar,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { Tabs } from '../../components/ui/Tabs';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Callout } from '../../components/ui/Callout';
import { PageTransition } from '../../components/ui/PageTransition';
import { cn } from '../../lib/utils';

// Typewriter component for the AI explanation
function TypewriterText({ text, onComplete }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayed(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        onComplete && onComplete();
      }
    }, 20);

    return () => clearInterval(interval);
  }, [text, onComplete]);

  return <span>{displayed}</span>;
}

export function StudentApplications() {
  const { applications, offers } = useStore();
  const [activeTab, setActiveTab] = useState('applications');
  const [expandedAppId, setExpandedAppId] = useState('app-1'); // Default open Microsoft for instant demo wow!
  const [showFactorBars, setShowFactorBars] = useState({});

  const studentOffers = offers.filter((o) => o.studentId === 's-1' || o.studentName.includes('Ananya')) || [];

  const tabs = [
    { id: 'applications', label: 'My Applications', count: applications.length },
    { id: 'offers', label: 'Verified Offers & Docs', count: studentOffers.length },
  ];

  const toggleExpand = (id) => {
    setExpandedAppId((prev) => (prev === id ? null : id));
  };

  return (
    <PageTransition className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-display font-semibold text-3xl text-ink tracking-tight">
          Applications & Placement Status
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Review transparent AI shortlisting factors, detailed feedback diagnostic, and verified corporate offers.
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Applications */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.map((app) => {
            const isExpanded = expandedAppId === app.id;
            const barsReady = showFactorBars[app.id];

            return (
              <Card key={app.id} className="p-0 overflow-hidden border-line">
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(app.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-bone/40 transition-colors select-none"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-1">
                      <h3 className="font-display font-semibold text-lg text-ink">
                        {app.company}
                      </h3>
                      <Badge
                        tone={
                          app.status === 'Shortlisted'
                            ? 'jade'
                            : app.status === 'Rejected'
                            ? 'brick'
                            : 'ochre'
                        }
                        size="sm"
                      >
                        {app.status}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-ink-soft">
                      {app.role} · CTC: <span className="text-ink font-semibold">{app.ctc}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[11px] uppercase tracking-wider block font-semibold text-ink-soft">
                        AI Fit Score
                      </span>
                      <span className="font-display font-bold text-lg text-ink tabular-nums">
                        {app.fitScore}%
                      </span>
                    </div>

                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg bg-bone border border-line flex items-center justify-center text-ink-soft hover:text-ink transition-colors"
                    >
                      <ChevronDown
                        className={cn('w-4 h-4 transition-transform duration-200', isExpanded && 'rotate-180')}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded AI Explanation Drawer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="border-t border-line bg-paper p-6 space-y-6"
                    >
                      {/* AI Explanation Banner */}
                      <div className="p-4 rounded-xl bg-ochre-tint/40 border border-ochre/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-ochre-deep" />
                          <h4 className="font-semibold text-xs sm:text-sm text-ink">
                            Explainable AI Shortlist Breakdown
                          </h4>
                          <span className="text-[11px] text-ochre-deep font-semibold ml-auto">
                            Level: {app.level}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-ink/90 leading-relaxed font-sans">
                          <TypewriterText
                            text={app.explanation}
                            onComplete={() =>
                              setShowFactorBars((prev) => ({ ...prev, [app.id]: true }))
                            }
                          />
                        </p>
                      </div>

                      {/* Factor Bars */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                            Decision Weightage & Factor Alignment
                          </span>
                          <span className="text-[11px] text-ink-soft">
                            Benchmark Minimum: 75/100
                          </span>
                        </div>

                        <div className="space-y-3">
                          {app.breakdown?.map((factor, fIdx) => (
                            <div key={fIdx} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-ink">
                                  {factor.factor} <span className="text-ink-soft">({factor.weight}% weight)</span>
                                </span>
                                <span className="font-mono font-semibold text-ink">
                                  {factor.score}/100
                                </span>
                              </div>
                              <div className="h-2 w-full bg-bone rounded-full overflow-hidden border border-line/40">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${factor.score}%` }}
                                  transition={{
                                    duration: 0.6,
                                    delay: fIdx * 0.1,
                                    ease: [0.22, 1, 0.36, 1],
                                  }}
                                  className={cn(
                                    'h-full rounded-full',
                                    factor.score >= 80
                                      ? 'bg-jade'
                                      : factor.score >= 60
                                      ? 'bg-ochre'
                                      : 'bg-brick'
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Remediation Roadmap Button for Rejected */}
                      {app.status === 'Rejected' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-bone/60 p-4 rounded-xl border border-line"
                        >
                          <div>
                            <p className="text-xs font-semibold text-ink">
                              Personalized Remediation Plan Available
                            </p>
                            <p className="text-[11px] text-ink-soft">
                              Follow the 4-week module to qualify for the Microsoft Spring Off-Campus Pool.
                            </p>
                          </div>
                          <a
                            href="https://notion.so"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink text-bone text-xs font-medium hover:bg-ink/90 transition-colors shrink-0"
                          >
                            <span>Open Notion Remediation Roadmap</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab 2: Offers & Documents */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          {studentOffers.length === 0 ? (
            <Card className="p-10 text-center text-ink-soft">
              <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No confirmed offers received yet.</p>
              <p className="text-xs mt-1">Offers extended by recruiters appear here with compliance document checklists.</p>
            </Card>
          ) : (
            studentOffers.map((offer) => (
              <Card key={offer.id} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-xl text-ink">
                        {offer.company}
                      </h3>
                      <Badge tone="jade" size="sm">
                        {offer.status}
                      </Badge>
                      {offer.reminderSent && (
                        <Badge tone="ochre" size="sm">
                          Reminder Received from Cell
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-ink-soft mt-1">
                      Package: <strong className="text-ink">{offer.ctc}</strong> · Expected Joining: {offer.joiningDate}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-3">
                    Joining Documentation Checklist
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {offer.documents.map((doc, dIdx) => (
                      <div
                        key={dIdx}
                        className="p-3 bg-bone/40 rounded-xl border border-line flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-ink">{doc.name}</span>
                        {doc.status === 'verified' ? (
                          <span className="text-jade font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-ochre-deep font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Pending Upload
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </PageTransition>
  );
}

