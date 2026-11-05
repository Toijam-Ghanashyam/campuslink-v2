import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { Stamp } from '../../components/ui/Stamp';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';
import { cn } from '../../lib/utils';

export function AdminVerification() {
  const { verificationQueue, approveStudent, rejectStudent } = useStore();
  const { toast } = useToast();

  const [animatingRows, setAnimatingRows] = useState({});
  const [selectedDoc, setSelectedDoc] = useState(null);

  const handleApprove = async (item) => {
    setAnimatingRows((prev) => ({ ...prev, [item.id]: 'approving' }));
    await new Promise((r) => setTimeout(r, 650));
    approveStudent(item.studentId);
    toast(`Verified credentials for ${item.name}! Student notified.`, 'jade');
  };

  const handleReject = async (item) => {
    setAnimatingRows((prev) => ({ ...prev, [item.id]: 'rejecting' }));
    await new Promise((r) => setTimeout(r, 650));
    rejectStudent(item.studentId);
    toast(`Requested revision from ${item.name}`, 'brick');
  };

  return (
    <PageTransition className="space-y-6">
      <Masthead
        context="02 · CREDENTIAL AUDIT & VERIFICATION"
        title="Student Verification Queue."
        lede="Audit semester grade cards, certify active backlogs, and officially lock student eligibility before corporate drive cut-offs."
        action={
          <span className="font-mono text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-control bg-paper border border-line text-ink">
            {verificationQueue.length} PENDING AUDIT
          </span>
        }
      />

      {/* Verification Queue (Ruled Table Format) */}
      {verificationQueue.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-12 h-12 rounded-full bg-jade-tint text-jade mx-auto flex items-center justify-center border border-jade/30"
          >
            <CheckCircle2 className="w-6 h-6 stroke-[2]" />
          </motion.div>
          <h3 className="font-display font-medium text-2xl text-ink">
            All caught up.
          </h3>
          <p className="font-sans text-xs text-ink-soft">
            Every submitted student transcript and CGPA record in the queue has been certified.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border-y border-line">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-line bg-bone/60 font-mono text-[10.5px] uppercase tracking-wider text-ink-soft">
                <th className="py-3 px-4">Student &amp; Roll No.</th>
                <th className="py-3 px-4">Discipline</th>
                <th className="py-3 px-4">Reported CGPA</th>
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4 text-right">Audit Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
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
                          ? { x: [-8, 8, -5, 5, 0] }
                          : {}
                      }
                      transition={{ duration: 0.35 }}
                      className={cn(
                        'transition-colors duration-250',
                        animationState === 'approving' && 'bg-jade-tint/50',
                        animationState === 'rejecting' && 'bg-brick-tint/50',
                        !animationState && 'hover:bg-bone/40'
                      )}
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-ink">{item.name}</p>
                        <p className="font-mono text-xs text-ink-soft">{item.rollNo}</p>
                      </td>

                      <td className="py-3.5 px-4 font-sans text-xs text-ink">
                        {item.branch}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-display font-bold text-base text-ink">
                          {item.reportedCgpa}
                        </span>
                        <span className="font-mono text-xs text-ink-soft ml-0.5">/ 10.0</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedDoc(item)}
                          className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-ink hover:text-ochre-deep transition-colors bg-bone px-2.5 py-1 rounded-control border border-line"
                        >
                          <FileText className="w-3.5 h-3.5 text-ochre-deep" />
                          <span>View PDF Slip</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {animationState === 'approving' ? (
                          <Stamp tone="jade">VERIFIED</Stamp>
                        ) : animationState === 'rejecting' ? (
                          <Stamp tone="brick">REJECTED</Stamp>
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

      {/* PDF Transcript Preview Drawer */}
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
        <div className="space-y-4 font-mono text-xs">
          <div className="p-3 bg-bone rounded-control border border-line flex items-center justify-between">
            <div>
              <p className="font-bold text-ink">BPUT Controller of Examination Seal</p>
              <p className="text-ink-soft">Digital Signature Validated via DigiLocker API</p>
            </div>
            <span className="text-jade font-semibold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Validated
            </span>
          </div>

          <div className="bg-paper p-6 rounded-control border border-line space-y-4">
            <div className="text-center pb-3 border-b border-line space-y-0.5">
              <h4 className="font-display font-medium text-base text-ink uppercase">
                Biju Patnaik University of Technology
              </h4>
              <p className="text-[11px] text-ink-soft">Official Consolidated Grade Transcript</p>
            </div>

            <div className="space-y-2 text-ink-soft text-xs">
              <div className="flex justify-between">
                <span>Candidate Name:</span>
                <strong className="text-ink">{selectedDoc?.name}</strong>
              </div>
              <div className="flex justify-between">
                <span>University Reg No:</span>
                <strong className="text-ink">{selectedDoc?.rollNo}</strong>
              </div>
              <div className="flex justify-between">
                <span>Verified CGPA:</span>
                <strong className="text-ink text-sm font-display">{selectedDoc?.reportedCgpa} / 10.00</strong>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </PageTransition>
  );
}
