import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  User,
  FileText,
  Clock,
  ShieldCheck,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { Tabs } from '../../components/ui/Tabs';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';
import { cn } from '../../lib/utils';

export function RecruiterPipeline() {
  const { pipeline, scheduleInterviewSlot } = useStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('all');
  const [selectedBioCandidate, setSelectedBioCandidate] = useState(null);
  const [activeSlotPopoverId, setActiveSlotPopoverId] = useState(null);

  const tabs = [
    { id: 'all', label: 'All Qualified Streams', count: pipeline.length },
    { id: 'cse-it', label: 'CSE / IT Cohort', count: pipeline.filter((p) => p.shortBranch === 'CSE' || p.shortBranch === 'IT').length },
    { id: 'ece', label: 'ECE Discipline', count: pipeline.filter((p) => p.shortBranch === 'ECE').length },
  ];

  const filtered = pipeline.filter((c) => {
    if (activeTab === 'cse-it') return c.shortBranch === 'CSE' || c.shortBranch === 'IT';
    if (activeTab === 'ece') return c.shortBranch === 'ECE';
    return true;
  }).sort((a, b) => b.aiMatch - a.aiMatch);

  const availableSlots = [
    { time: '10:00 - 10:45 AM', available: true },
    { time: '11:15 - 12:00 PM', available: true },
    { time: '02:00 - 02:45 PM', available: false, reason: 'Clashes with TCS Drive in Lab 4' },
    { time: '03:30 - 04:15 PM', available: true },
  ];

  const handleBookSlot = (candidate, slot) => {
    scheduleInterviewSlot(candidate.id, slot.time);
    setActiveSlotPopoverId(null);
    toast(`Interview slot (${slot.time}) booked for ${candidate.name}! Synced with student calendar.`, 'jade');
  };

  return (
    <PageTransition className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-display font-semibold text-3xl text-ink tracking-tight">
          Candidate Pipeline & Semantic AI Match
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          BPUT candidates ranked by vector skill-embedding similarity against Microsoft SDE profile criteria.
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {/* Main Table */}
      <Card className="p-0 overflow-hidden border-line">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-line bg-bone/60 text-[11px] uppercase tracking-wider font-semibold text-ink-soft">
                <th className="py-3.5 px-5">Candidate & Roll No.</th>
                <th className="py-3.5 px-5">Discipline & CGPA</th>
                <th className="py-3.5 px-5">AI Match Ranking</th>
                <th className="py-3.5 px-5">Pipeline Stage</th>
                <th className="py-3.5 px-5 text-right">Recruitment Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              <AnimatePresence>
                {filtered.map((candidate) => (
                  <motion.tr
                    key={candidate.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="hover:bg-bone/40 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <p className="font-semibold text-ink">{candidate.name}</p>
                      <p className="text-xs font-mono text-ink-soft">{candidate.rollNo}</p>
                    </td>

                    <td className="py-4 px-5 text-xs">
                      <span className="font-semibold text-ink">{candidate.branch}</span>
                      <p className="text-ink-soft font-mono mt-0.5">{candidate.cgpa} CGPA</p>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Sparkles className="w-4 h-4 text-ochre fill-current stroke-none" />
                          {/* Faint shimmer sweep */}
                          <motion.div
                            animate={{ opacity: [0.2, 0.8, 0.2] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute inset-0 bg-ochre/30 rounded-full blur-sm"
                          />
                        </div>
                        <span className="font-display font-bold text-base text-ink tabular-nums">
                          {candidate.aiMatch}% Fit
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <Badge
                        tone={
                          candidate.pipelineStatus.includes('R2')
                            ? 'jade'
                            : candidate.pipelineStatus.includes('R1')
                            ? 'ochre'
                            : 'ink'
                        }
                        size="sm"
                      >
                        {candidate.interviewSlot ? 'Slot Booked' : candidate.pipelineStatus}
                      </Badge>
                      {candidate.interviewSlot && (
                        <span className="block text-[10px] text-ink-soft mt-0.5">
                          {candidate.interviewSlot}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-right relative">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedBioCandidate(candidate)}
                        >
                          View Bio
                        </Button>

                        <div className="relative inline-block text-left">
                          <Button
                            size="sm"
                            variant={candidate.interviewSlot ? 'ghost' : 'primary'}
                            icon={Calendar}
                            disabled={Boolean(candidate.interviewSlot)}
                            onClick={() =>
                              setActiveSlotPopoverId((prev) => (prev === candidate.id ? null : candidate.id))
                            }
                          >
                            {candidate.interviewSlot ? 'Booked' : 'Schedule Slot'}
                          </Button>

                          {/* Slot Booking Popover */}
                          <AnimatePresence>
                            {activeSlotPopoverId === candidate.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                                className="absolute right-0 top-10 w-72 bg-paper rounded-2xl border border-line shadow-2xl z-40 p-3 text-left space-y-2"
                              >
                                <div className="border-b border-line pb-2">
                                  <span className="text-[11px] uppercase font-semibold text-ink-soft block">
                                    Conflict-Free Slots (Nov 05, 2026)
                                  </span>
                                  <p className="text-[10px] text-ink-soft">
                                    Synced with central venue & candidate availability
                                  </p>
                                </div>

                                <div className="space-y-1.5">
                                  {availableSlots.map((slot, sIdx) => (
                                    <button
                                      key={sIdx}
                                      type="button"
                                      disabled={!slot.available}
                                      onClick={() => handleBookSlot(candidate, slot)}
                                      className={cn(
                                        'w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between border',
                                        slot.available
                                          ? 'border-line hover:border-ochre hover:bg-ochre-tint/40 text-ink cursor-pointer'
                                          : 'border-line/40 bg-bone/40 text-ink-soft/50 cursor-not-allowed'
                                      )}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-ink-soft" />
                                        <span>{slot.time}</span>
                                      </div>
                                      {!slot.available && (
                                        <span className="text-[9px] text-brick font-semibold">
                                          Clash: TCS
                                        </span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Candidate Bio Drawer */}
      <Drawer
        open={Boolean(selectedBioCandidate)}
        onClose={() => setSelectedBioCandidate(null)}
        width="max-w-2xl"
        title={selectedBioCandidate?.name}
        subtitle={`${selectedBioCandidate?.branch} · BPUT Class of 2026`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedBioCandidate(null)}>
              Close Bio
            </Button>
            <Button
              variant="primary"
              icon={Calendar}
              onClick={() => {
                const cand = selectedBioCandidate;
                setSelectedBioCandidate(null);
                setActiveSlotPopoverId(cand.id);
              }}
            >
              Select Interview Slot
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* AI Match Explanation Box */}
          <div className="p-4 rounded-xl bg-ochre-tint/50 border border-ochre/40 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ochre-deep" />
              <h4 className="font-semibold text-sm text-ink">
                AI Match Justification ({selectedBioCandidate?.aiMatch}% Fit)
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-ink leading-relaxed">
              Highly Recommended: Candidate possesses verified proficiency in{' '}
              <span className="underline decoration-ochre decoration-2 underline-offset-4 font-semibold">
                React
              </span>
              ,{' '}
              <span className="underline decoration-ochre decoration-2 underline-offset-4 font-semibold">
                Python
              </span>
              , and{' '}
              <span className="underline decoration-ochre decoration-2 underline-offset-4 font-semibold">
                Data Structures
              </span>
              , exceeding the required mock interview benchmarks and CGPA cut-off.
            </p>
          </div>

          {/* Verified Skills Tags */}
          <div>
            <h5 className="text-xs uppercase tracking-wider font-semibold text-ink-soft mb-2.5">
              Verified Technical Stack Competencies
            </h5>
            <div className="flex flex-wrap gap-2">
              {selectedBioCandidate?.verifiedSkills.map((skill, idx) => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="px-3 py-1 rounded-lg bg-bone text-ink text-xs font-semibold border border-line flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-jade" />
                  <span>{skill}</span>
                </motion.span>
              ))}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-bone/50 rounded-xl border border-line text-center text-xs">
            <div>
              <span className="text-ink-soft block uppercase text-[10px]">CGPA</span>
              <strong className="font-display text-base text-ink">{selectedBioCandidate?.cgpa}</strong>
            </div>
            <div>
              <span className="text-ink-soft block uppercase text-[10px]">Projects</span>
              <strong className="font-display text-base text-ink">{selectedBioCandidate?.projectsCount} Repos</strong>
            </div>
            <div>
              <span className="text-ink-soft block uppercase text-[10px]">Experience</span>
              <strong className="text-ink block truncate">{selectedBioCandidate?.experienceYears}</strong>
            </div>
          </div>

          {/* Verified Resume Container Placeholder */}
          <div className="p-6 rounded-xl border-2 border-dashed border-line bg-paper text-center space-y-2">
            <FileText className="w-8 h-8 text-ochre-deep mx-auto stroke-[1.5]" />
            <h5 className="text-xs font-semibold text-ink">
              Verified Academic Resume PDF Attached
            </h5>
            <p className="text-[11px] text-ink-soft max-w-sm mx-auto">
              Scanned & authenticated against university records. Zero misattributed projects or grade discrepancies.
            </p>
          </div>
        </div>
      </Drawer>
    </PageTransition>
  );
}

