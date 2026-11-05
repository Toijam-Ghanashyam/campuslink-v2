import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, FileText, CheckCircle2, Inbox, ShieldCheck, Eye } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';
import { cn } from '../../lib/utils';

export function AdminVerification() {
  const { verificationQueue, approveStudent, rejectStudent } = useStore();
  const { toast } = useToast();

  const [animatingRows, setAnimatingRows] = useState({}); // { [id]: 'approving' | 'rejecting' }
  const [selectedDoc, setSelectedDoc] = useState(null);

  const handleApprove = async (item) => {
    setAnimatingRows((prev) => ({ ...prev, [item.id]: 'approving' }));
    // Wait for stroke check and green flash
    await new Promise((r) => setTimeout(r, 650));
    approveStudent(item.studentId);
    toast(`Verified credentials for ${item.name}! Student notified.`, 'jade');
  };

  const handleReject = async (item) => {
    setAnimatingRows((prev) => ({ ...prev, [item.id]: 'rejecting' }));
    // Wait for shake & brick flash
    await new Promise((r) => setTimeout(r, 650));
    rejectStudent(item.studentId);
    toast(`Requested revision from ${item.name}`, 'brick');
  };

  return (
    <PageTransition className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-3xl text-ink tracking-tight">
            Academic Verification Queue
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            Audit student-uploaded transcripts and lock verified CGPA records before placement drive cut-offs.
          </p>
        </div>

        <Badge tone={verificationQueue.length > 0 ? 'ochre' : 'jade'} size="md">
          {verificationQueue.length} Pending Audit
        </Badge>
      </div>

      {/* Main Queue Container */}
      <Card className="p-0 overflow-hidden border-line">
        {verificationQueue.length === 0 ? (
          <div className="p-16 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-14 h-14 rounded-full bg-jade-tint text-jade mx-auto flex items-center justify-center mb-4"
            >
              <CheckCircle2 className="w-8 h-8 stroke-[2]" />
            </motion.div>
            <h3 className="font-display font-semibold text-xl text-ink">
              All caught up!
            </h3>
            <p className="text-xs text-ink-soft mt-1">
              Every student transcript and CGPA record in the queue has been audited.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-line bg-bone/60 text-[11px] uppercase tracking-wider font-semibold text-ink-soft">
                  <th className="py-3.5 px-5">Student & Roll No.</th>
                  <th className="py-3.5 px-5">Discipline</th>
                  <th className="py-3.5 px-5">Reported CGPA</th>
                  <th className="py-3.5 px-5">Official Transcript</th>
                  <th className="py-3.5 px-5 text-right">Audit Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                <AnimatePresence>
                  {verificationQueue.map((item) => {
                    const animationState = animatingRows[item.id];

                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        animate={
                          animationState === 'rejecting'
                            ? { x: [-8, 8, -6, 6, -3, 3, 0] }
                            : {}
                        }
                        transition={{ duration: 0.4 }}
                        className={cn(
                          'transition-colors duration-300',
                          animationState === 'approving' && 'bg-jade-tint/60',
                          animationState === 'rejecting' && 'bg-brick-tint/60',
                          !animationState && 'hover:bg-bone/40'
                        )}
                      >
                        <td className="py-4 px-5">
                          <p className="font-semibold text-ink">{item.name}</p>
                          <p className="text-xs font-mono text-ink-soft">{item.rollNo}</p>
                        </td>

                        <td className="py-4 px-5 text-xs text-ink">
                          {item.branch}
                        </td>

                        <td className="py-4 px-5">
                          <span className="font-display font-bold text-base text-ink">
                            {item.reportedCgpa}
                          </span>
                          <span className="text-xs text-ink-soft font-normal ml-0.5">/ 10.0</span>
                        </td>

                        <td className="py-4 px-5">
                          <button
                            type="button"
                            onClick={() => setSelectedDoc(item)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:text-ochre-deep transition-colors bg-bone px-2.5 py-1 rounded-lg border border-line"
                          >
                            <FileText className="w-3.5 h-3.5 text-ochre-deep" />
                            <span>View Transcript PDF</span>
                          </button>
                        </td>

                        <td className="py-4 px-5 text-right">
                          {animationState === 'approving' ? (
                            <div className="inline-flex items-center gap-1 text-jade font-semibold text-xs py-1.5 px-3 rounded-lg bg-jade-tint">
                              <motion.svg
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.3 }}
                                className="w-4 h-4 text-jade"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </motion.svg>
                              <span>Verified</span>
                            </div>
                          ) : animationState === 'rejecting' ? (
                            <span className="inline-flex items-center gap-1 text-brick font-semibold text-xs py-1.5 px-3 rounded-lg bg-brick-tint">
                              <X className="w-4 h-4" />
                              <span>Rejected</span>
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="success"
                                icon={Check}
                                onClick={() => handleApprove(item)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                icon={X}
                                onClick={() => handleReject(item)}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Transcript PDF Audit Drawer */}
      <Drawer
        open={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        title={`Audit Transcript: ${selectedDoc?.name}`}
        subtitle={`Roll No: ${selectedDoc?.rollNo} · Branch: ${selectedDoc?.branch}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedDoc(null)}>
              Close Audit
            </Button>
            <Button
              variant="success"
              icon={Check}
              onClick={() => {
                const doc = selectedDoc;
                setSelectedDoc(null);
                handleApprove(doc);
              }}
            >
              Approve Record
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-bone rounded-xl border border-line flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-ink">BPUT Controller of Examination Seal</p>
              <p className="text-ink-soft">Digital Signature Validated via DigiLocker API</p>
            </div>
            <span className="text-jade font-semibold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Validated
            </span>
          </div>

          {/* Placeholder PDF Page Preview */}
          <div className="bg-paper p-8 rounded-xl border-2 border-line shadow-inner min-h-[380px] flex flex-col justify-between font-mono text-xs">
            <div className="text-center pb-4 border-b border-line space-y-1">
              <h4 className="font-serif font-bold text-base text-ink uppercase">
                Biju Patnaik University of Technology, Rourkela
              </h4>
              <p className="text-[11px] text-ink-soft">Grade Card & Official Transcript</p>
            </div>

            <div className="my-6 space-y-2 text-ink-soft text-xs">
              <div className="flex justify-between">
                <span>Candidate Name:</span>
                <strong className="text-ink">{selectedDoc?.name}</strong>
              </div>
              <div className="flex justify-between">
                <span>University Reg No:</span>
                <strong className="text-ink">{selectedDoc?.rollNo}</strong>
              </div>
              <div className="flex justify-between">
                <span>Cumulative Grade Point Average (CGPA):</span>
                <strong className="text-ink text-sm">{selectedDoc?.reportedCgpa} / 10.00</strong>
              </div>
              <div className="flex justify-between">
                <span>Audit Status:</span>
                <span className="text-ochre-deep font-semibold">Pending Placement Cell Stamp</span>
              </div>
            </div>

            <div className="pt-4 border-t border-line text-[10px] text-ink-soft flex justify-between items-center">
              <span>BPUT-AUT-2026-ENCL</span>
              <span>Encrypted PDF Document</span>
            </div>
          </div>
        </div>
      </Drawer>
    </PageTransition>
  );
}

