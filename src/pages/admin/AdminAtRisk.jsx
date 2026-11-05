import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { Mark } from '../../components/ui/Mark';
import { MarginNote } from '../../components/ui/MarginNote';
import { Button } from '../../components/ui/Button';
import { Stamp } from '../../components/ui/Stamp';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';

export function AdminAtRisk() {
  const { atRisk, assignMentor } = useStore();
  const { toast } = useToast();

  const [activePopoverId, setActivePopoverId] = useState(null);

  const mentorsList = [
    'Dr. R. Mishra (Dept of CSE)',
    'Prof. P. K. Sahoo (Career Cell)',
    'Dr. S. Panda (Training Directorate)',
  ];

  const handleAssign = (riskItem, mentorName) => {
    assignMentor(riskItem.id, mentorName);
    setActivePopoverId(null);
    toast(`Assigned ${mentorName} to ${riskItem.name}`, 'jade');
  };

  return (
    <PageTransition className="space-y-6">
      <Masthead
        context="05 · EARLY WARNING INTERVENTION ENGINE"
        title="At-Risk Candidate Analytics."
        lede="Machine learning classifier flagging students at statistical risk of remaining unplaced prior to season conclusion."
      />

      {/* Margin Note Criteria with Highlighters */}
      <MarginNote label="PREDICTIVE CLASSIFIER BENCHMARKS" strong>
        Flags triggered dynamically when: <Mark delay={0.2}>CGPA &lt; 7.0</Mark>,{' '}
        <Mark delay={0.5}>mock score &lt; 60/100</Mark>, active backlog history, or zero conversions across three consecutive technical rounds.
      </MarginNote>

      {/* Ruled Table */}
      <div className="overflow-x-auto border-y border-line pt-2">
        <table className="w-full text-left text-sm border-collapse font-sans">
          <thead>
            <tr className="border-b border-line bg-bone/60 font-mono text-[10.5px] uppercase tracking-wider text-ink-soft">
              <th className="py-3 px-4">Candidate &amp; Roll No.</th>
              <th className="py-3 px-4">Discipline &amp; CGPA</th>
              <th className="py-3 px-4">Early Warning Triggers</th>
              <th className="py-3 px-4">Risk Index</th>
              <th className="py-3 px-4 text-right">Faculty Intervention</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {atRisk.map((item) => (
              <tr key={item.id} className="hover:bg-bone/40 transition-colors">
                <td className="py-3.5 px-4">
                  <p className="font-display font-medium text-base text-ink">{item.name}</p>
                  <p className="font-mono text-xs text-ink-soft">{item.rollNo}</p>
                </td>

                <td className="py-3.5 px-4 font-mono text-xs">
                  <span className="font-semibold text-ink">{item.branch}</span>
                  <p className="text-ink-soft">{item.cgpa} CGPA</p>
                </td>

                <td className="py-3.5 px-4">
                  <div className="flex flex-wrap gap-1.5 font-mono text-[10.5px]">
                    {item.flags.map((flag, fIdx) => (
                      <span
                        key={fIdx}
                        className="px-2 py-0.5 rounded-xs bg-brick-tint/50 text-brick border border-brick/30 font-semibold"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2 max-w-[110px] font-mono text-xs">
                    <strong className="text-brick font-bold">{item.riskScore}%</strong>
                    <div className="h-1.5 flex-1 bg-line rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brick rounded-full"
                        style={{ width: `${item.riskScore}%` }}
                      />
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-right relative">
                  {item.assignedMentor ? (
                    <Stamp tone="jade">
                      {item.assignedMentor}
                    </Stamp>
                  ) : (
                    <div className="relative inline-block text-left">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={UserPlus}
                        onClick={() =>
                          setActivePopoverId((prev) => (prev === item.id ? null : item.id))
                        }
                      >
                        Assign Mentor
                      </Button>

                      {/* Mentor Picker Popover (L2 Object) */}
                      <AnimatePresence>
                        {activePopoverId === item.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 4 }}
                            className="absolute right-0 top-10 w-64 bg-paper rounded-object border border-line shadow-object z-30 p-2 text-left font-mono text-xs"
                          >
                            <span className="text-[10px] uppercase font-semibold text-ink-soft px-2 py-1 block">
                              ASSIGN FACULTY ADVISOR:
                            </span>
                            <div className="space-y-1">
                              {mentorsList.map((mentor, mIdx) => (
                                <button
                                  key={mIdx}
                                  type="button"
                                  onClick={() => handleAssign(item, mentor)}
                                  className="w-full text-left p-2 rounded text-xs text-ink hover:bg-bone hover:text-ochre-deep font-medium transition-colors"
                                >
                                  {mentor}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageTransition>
  );
}
