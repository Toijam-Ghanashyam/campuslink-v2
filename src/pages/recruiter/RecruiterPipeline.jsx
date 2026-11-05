import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, FileText, ArrowRight } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { Tabs } from '../../components/ui/Tabs';
import { Stamp } from '../../components/ui/Stamp';
import { Mark } from '../../components/ui/Mark';
import { MarginNote } from '../../components/ui/MarginNote';
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
      <Masthead
        context="03 · CANDIDATE PIPELINE · MICROSOFT SDE"
        title="Ranked Candidate Pipeline."
        lede="Candidates pre-screened and ranked by semantic skill embedding similarity against Microsoft SDE profile benchmarks."
      />

      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {/* Ruled Candidate Register Table */}
      <div className="overflow-x-auto border-y border-line">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-line bg-bone/60 font-mono text-[10.5px] uppercase tracking-wider text-ink-soft">
              <th className="py-3 px-4">Candidate &amp; Roll No.</th>
              <th className="py-3 px-4">Discipline &amp; CGPA</th>
              <th className="py-3 px-4">Semantic Fit</th>
              <th className="py-3 px-4">Pipeline Stage</th>
              <th className="py-3 px-4 text-right">Recruitment Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            <AnimatePresence>
              {filtered.map((candidate) => (
                <motion.tr
                  key={candidate.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hover:bg-bone/40 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <p className="font-display font-medium text-base text-ink">{candidate.name}</p>
                    <p className="font-mono text-xs text-ink-soft">{candidate.rollNo}</p>
                  </td>

                  <td className="py-3.5 px-4 font-sans text-xs">
                    <span className="font-semibold text-ink">{candidate.branch}</span>
                    <p className="font-mono text-ink-soft text-[11px]">{candidate.cgpa} CGPA</p>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <strong className="text-ink font-bold tabular-nums">
                        {candidate.aiMatch}%
                      </strong>
                      <div className="h-1.5 w-16 bg-line rounded-full overflow-hidden">
                        <div
                          className="h-full bg-ochre"
                          style={{ width: `${candidate.aiMatch}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <Stamp
                      tone={
                        candidate.pipelineStatus.includes('R2')
                          ? 'jade'
                          : candidate.pipelineStatus.includes('R1')
                          ? 'ochre'
                          : 'ink'
                      }
                    >
                      {candidate.interviewSlot ? 'SLOT LOCKED' : candidate.pipelineStatus}
                    </Stamp>
                    {candidate.interviewSlot && (
                      <span className="block font-mono text-[10px] text-ink-soft mt-0.5">
                        {candidate.interviewSlot}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right relative">
                    <div className="flex items-center justify-end gap-3 font-mono text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedBioCandidate(candidate)}
                        className="text-ink hover:text-ochre-deep font-semibold underline underline-offset-4"
                      >
                        View Bio →
                      </button>

                      <div className="relative inline-block text-left">
                        <Button
                          size="sm"
                          variant={candidate.interviewSlot ? 'ghost' : 'primary'}
                          disabled={Boolean(candidate.interviewSlot)}
                          onClick={() =>
                            setActiveSlotPopoverId((prev) => (prev === candidate.id ? null : candidate.id))
                          }
                        >
                          {candidate.interviewSlot ? 'Booked' : 'Schedule Slot'}
                        </Button>

                        {/* Slot Booking Popover (L2 Object) */}
                        <AnimatePresence>
                          {activeSlotPopoverId === candidate.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 4 }}
                              className="absolute right-0 top-10 w-72 bg-paper rounded-object border border-line shadow-object z-40 p-3 text-left space-y-2 font-mono text-xs"
                            >
                              <div className="border-b border-line pb-1.5">
                                <span className="text-[10px] uppercase font-semibold text-ink-soft block">
                                  CONFLICT-FREE SLOTS (NOV 05, 2026)
                                </span>
                              </div>

                              <div className="space-y-1">
                                {availableSlots.map((slot, sIdx) => (
                                  <button
                                    key={sIdx}
                                    type="button"
                                    disabled={!slot.available}
                                    onClick={() => handleBookSlot(candidate, slot)}
                                    className={cn(
                                      'w-full text-left p-2 rounded-control text-xs transition-colors flex items-center justify-between border',
                                      slot.available
                                        ? 'border-line hover:border-ink hover:bg-bone/40 text-ink cursor-pointer'
                                        : 'border-line/40 bg-bone/30 text-ink-soft/40 cursor-not-allowed'
                                    )}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3 h-3 text-ink-soft" />
                                      <span>{slot.time}</span>
                                    </div>
                                    {!slot.available && (
                                      <span className="text-[9px] text-brick font-semibold">
                                        CLASH: TCS
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

      {/* Candidate Bio Drawer */}
      <Drawer
        open={Boolean(selectedBioCandidate)}
        onClose={() => setSelectedBioCandidate(null)}
        width="max-w-xl"
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
          {/* AI Justification Margin Note with Highlighters */}
          <MarginNote label={`01 · AI MATCH JUSTIFICATION · ${selectedBioCandidate?.aiMatch}% FIT`} strong>
            Highly Recommended: Candidate possesses verified proficiency in{' '}
            <Mark delay={0.3}>React</Mark>, <Mark delay={0.6}>Python</Mark>, and{' '}
            <Mark delay={0.9}>Data Structures</Mark>, comfortably exceeding the mock benchmark cut-off and academic criteria.
          </MarginNote>

          {/* Verified Skills */}
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft font-semibold block mb-2">
              02 · VERIFIED TECHNICAL STACK
            </span>
            <div className="flex flex-wrap gap-1.5 font-mono text-xs">
              {selectedBioCandidate?.verifiedSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-control bg-bone text-ink border border-line"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Academic Slip */}
          <div className="p-4 bg-bone/40 rounded-object border border-line font-mono text-xs space-y-2">
            <span className="text-[10px] uppercase text-ink-soft block font-semibold">
              03 · AUTHENTICATED METRICS
            </span>
            <div className="flex justify-between">
              <span>Cumulative CGPA:</span>
              <strong className="text-ink">{selectedBioCandidate?.cgpa} / 10.00</strong>
            </div>
            <div className="flex justify-between">
              <span>Verified Project Repositories:</span>
              <strong className="text-ink">{selectedBioCandidate?.projectsCount} Repos</strong>
            </div>
            <div className="flex justify-between">
              <span>Prior Industry Experience:</span>
              <strong className="text-ink">{selectedBioCandidate?.experienceYears}</strong>
            </div>
          </div>
        </div>
      </Drawer>
    </PageTransition>
  );
}
