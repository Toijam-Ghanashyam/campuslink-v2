import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, UserPlus, CheckCircle2, ShieldAlert, GraduationCap, ChevronDown } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Callout } from '../../components/ui/Callout';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';
import { cn } from '../../lib/utils';

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
      <div>
        <h1 className="font-display font-semibold text-3xl text-ink tracking-tight">
          Early Warning & At-Risk Candidate Analytics
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Machine learning predictive model identifying students at risk of remaining unplaced prior to season conclusion.
        </p>
      </div>

      <Callout tone="brick" title="Proactive Intervention Protocol (PS Deliverable 5)">
        Predictive flags triggered based on: CGPA &lt; 7.0, mock-interview score &lt; 60, zero interview shortlists after 3 drive applications, or active backlog status.
      </Callout>

      <Card className="p-0 overflow-hidden border-line">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-line bg-bone/60 text-[11px] uppercase tracking-wider font-semibold text-ink-soft">
                <th className="py-3.5 px-5">Student & Roll No.</th>
                <th className="py-3.5 px-5">Academic Record</th>
                <th className="py-3.5 px-5">Early Warning Flags</th>
                <th className="py-3.5 px-5">Risk Index</th>
                <th className="py-3.5 px-5 text-right">Intervention Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {atRisk.map((item) => (
                <tr key={item.id} className="hover:bg-bone/40 transition-colors">
                  <td className="py-4 px-5">
                    <p className="font-semibold text-ink">{item.name}</p>
                    <p className="text-xs font-mono text-ink-soft">{item.rollNo}</p>
                  </td>

                  <td className="py-4 px-5 text-xs">
                    <span className="font-semibold text-ink">{item.branch}</span>
                    <p className="text-ink-soft font-mono mt-0.5">{item.cgpa} CGPA</p>
                  </td>

                  <td className="py-4 px-5">
                    <div className="flex flex-wrap gap-1.5 max-w-sm">
                      {item.flags.map((flag, fIdx) => (
                        <span
                          key={fIdx}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-brick-tint text-brick border border-brick/20 font-medium"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2 max-w-[120px]">
                      <div className="h-2 flex-1 bg-bone rounded-full overflow-hidden border border-line">
                        <div
                          className="h-full bg-brick rounded-full"
                          style={{ width: `${item.riskScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-brick">
                        {item.riskScore}%
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-5 text-right relative">
                    {item.assignedMentor ? (
                      <motion.span
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-jade-tint text-jade text-xs font-semibold border border-jade/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{item.assignedMentor}</span>
                      </motion.span>
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

                        {/* Mentor Picker Popover */}
                        <AnimatePresence>
                          {activePopoverId === item.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 4 }}
                              className="absolute right-0 top-10 w-64 bg-paper rounded-xl border border-line shadow-xl z-30 p-2 text-left"
                            >
                              <span className="text-[10px] uppercase font-semibold text-ink-soft px-2 py-1 block">
                                Choose Faculty Mentor:
                              </span>
                              <div className="space-y-1">
                                {mentorsList.map((mentor, mIdx) => (
                                  <button
                                    key={mIdx}
                                    type="button"
                                    onClick={() => handleAssign(item, mentor)}
                                    className="w-full text-left p-2 rounded-lg text-xs text-ink hover:bg-bone hover:text-ochre-deep font-medium transition-colors flex items-center justify-between"
                                  >
                                    <span>{mentor}</span>
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
      </Card>
    </PageTransition>
  );
}

