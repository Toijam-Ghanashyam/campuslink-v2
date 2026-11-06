import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, X, Compass } from 'lucide-react';
import { useStore } from '../../lib/store';
import { cn } from '../../lib/utils';

export function JudgeGuide() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentStudent,
    drives,
    applications,
    pipeline,
    studentInterviews,
    hasToggledTheme,
    hasScrolledPipeline,
  } = useStore();

  // Determine completed steps from store state
  const step1 = currentStudent.readinessScore > 72; // Gap chip toggled
  const step2 = applications.some((a) => a.driveId === 'd-1'); // Applied to Microsoft
  const step3 = currentStudent.verified; // Admin approved
  const step4 = drives.find((d) => d.id === 'd-2')?.status === 'Verified'; // Conflict resolved
  const step5 = pipeline.some((p) => p.interviewSlot !== null); // Slot booked
  const step6 = studentInterviews.length > 2; // Synced interview
  const step7 = Boolean(hasToggledTheme); // Switch Day / Night
  const step8 = Boolean(hasScrolledPipeline); // Scroll the landing pipeline

  const items = [
    {
      id: 1,
      title: 'Adjust skill gap chip',
      desc: 'Watch the physical dial needle sweep & ladder advance',
      path: '/student/overview',
      done: step1,
    },
    {
      id: 2,
      title: 'Apply (AI Match) on Microsoft SDE',
      desc: 'Trigger laser scan line & check typewriter feedback',
      path: '/student/drives',
      done: step2,
    },
    {
      id: 3,
      title: 'Audit & stamp student verification',
      desc: 'View transcript PDF and drop official VERIFIED stamp',
      path: '/admin/verification',
      done: step3,
    },
    {
      id: 4,
      title: 'Resolve Lab 4 scheduling clash',
      desc: 'Slide Cognizant bar into Lab 2 on resource timeline',
      path: '/admin/drives',
      done: step4,
    },
    {
      id: 5,
      title: 'Schedule slot from candidate pipeline',
      desc: 'Select conflict-free window & view underlined bio',
      path: '/recruiter/pipeline',
      done: step5,
    },
    {
      id: 6,
      title: 'Confirm cross-portal synchronization',
      desc: 'Verify interview round appears on Student timeline',
      path: '/student/interviews',
      done: step6,
    },
    {
      id: 7,
      title: 'Switch Day / Night',
      desc: 'Circular wipe reveal between frosted Alabaster & Obsidian Ember',
      path: '/',
      done: step7,
    },
    {
      id: 8,
      title: 'Scroll the landing pipeline',
      desc: 'Ride the 3D CatmullRom thread through all 6 recruitment stages',
      path: '/#pipeline',
      done: step8,
    },
  ];

  const completedCount = items.filter((i) => i.done).length;

  return (
    <div className="fixed bottom-5 left-5 z-40 select-none">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-80 sm:w-96 bg-surface rounded-object border border-line shadow-object mb-2.5 overflow-hidden"
          >
            {/* Header */}
            <div className="p-3.5 border-b border-line bg-surface flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-accent" />
                <span className="font-mono text-xs uppercase tracking-wider font-semibold text-fg">
                  Judge's 90-Second Walkthrough
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-fg-soft hover:text-fg hover:bg-bg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Checklist */}
            <div className="p-2 space-y-1 max-h-80 overflow-y-auto divide-y divide-line/40">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 flex items-start justify-between gap-3 hover:bg-bg/40 transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={cn(
                        'w-4 h-4 rounded-xs border flex items-center justify-center shrink-0 mt-0.5',
                        item.done
                          ? 'bg-jade border-jade text-surface'
                          : 'border-line bg-surface'
                      )}
                    >
                      {item.done && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'text-xs font-semibold leading-tight',
                          item.done ? 'line-through text-fg-soft' : 'text-fg'
                        )}
                      >
                        {item.id}. {item.title}
                      </p>
                      <p className="text-[11px] text-fg-soft leading-tight mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (item.path.startsWith('/#')) {
                        const el = document.getElementById(item.path.replace('/#', ''));
                        el?.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        navigate(item.path);
                      }
                      setOpen(false);
                    }}
                    className="font-mono text-[10px] text-accent hover:text-fg flex items-center gap-0.5 shrink-0 uppercase tracking-wider font-semibold"
                  >
                    <span>Go</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-surface border-t border-line text-center">
              <span className="font-mono text-[10px] text-fg-soft">
                {completedCount}/8 capabilities validated in live session
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Pill */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-control bg-sidebar text-sidebar-fg font-mono text-[11px] uppercase tracking-wider font-semibold hover:bg-sidebar/90 active:scale-95 transition-all shadow-subtle border border-line"
      >
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span>GUIDE {completedCount}/8</span>
      </button>
    </div>
  );
}

