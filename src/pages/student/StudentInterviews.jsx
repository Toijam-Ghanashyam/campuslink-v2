import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Video } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { Stamp } from '../../components/ui/Stamp';
import { PageTransition } from '../../components/ui/PageTransition';

export function StudentInterviews() {
  const { studentInterviews } = useStore();

  const prepTips = [
    {
      num: '01',
      title: 'Review Core Algorithmic Complexities',
      desc: 'Tier-1 recruiters focus heavily on big-O space/time trade-offs across graphs, trees, and dynamic programming.',
    },
    {
      num: '02',
      title: 'Structure Behavioral Answers with STAR',
      desc: 'Frame your leadership and technical dispute experiences through Situation, Task, Action, and Measurable Result.',
    },
    {
      num: '03',
      title: 'Pre-Test Video & IDE Environment',
      desc: 'Ensure dual-monitor setup, microphone levels, and sandbox environment are ready 15 minutes before panel joins.',
    },
  ];

  return (
    <PageTransition className="space-y-6 max-w-4xl">
      <Masthead
        context="05 · INTERVIEW DISPATCHER & CALENDAR"
        title="Confirmed Interview Schedule."
        lede="Synchronized assessment calendar with corporate panels. New slots booked by recruiters lock automatically into your schedule."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pt-2">
        {/* Timeline Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-ink-soft block border-b border-line pb-2">
            CONCURRENT SCHEDULED SESSIONS ({studentInterviews.length})
          </span>

          <div className="relative border-l-2 border-line pl-6 ml-3 space-y-6 pt-2">
            {studentInterviews.map((interview, idx) => (
              <motion.div
                key={interview.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="relative"
              >
                {/* Timeline Node */}
                <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-paper border-2 border-ochre flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-ochre" />
                </div>

                <div className="p-4 bg-paper rounded-object border border-line shadow-subtle space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-medium text-lg text-ink">
                      {interview.company}
                    </h4>
                    <Stamp tone={interview.status === 'Confirmed' ? 'jade' : 'ochre'}>
                      {interview.status}
                    </Stamp>
                  </div>

                  <p className="font-sans text-xs font-semibold text-ink-soft">
                    {interview.role}
                  </p>

                  <div className="font-mono text-xs text-ink-soft flex flex-wrap gap-x-5 gap-y-1 pt-1">
                    <span className="text-ink">Date: {interview.date}</span>
                    <span>Slot: {interview.time}</span>
                    <span className="w-full text-ink-soft">Mode: {interview.mode}</span>
                  </div>

                  {interview.panel && (
                    <div className="pt-2 border-t border-line text-[11px] text-ink-soft font-mono">
                      Panel: <span className="text-ink font-semibold">{interview.panel}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Preparation Guidelines (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-ink-soft block border-b border-line pb-2">
            PLACEMENT CELL GUIDELINES
          </span>

          <div className="space-y-4 pt-2">
            {prepTips.map((tip) => (
              <div key={tip.num} className="space-y-1">
                <span className="font-mono text-xs font-semibold text-ochre-deep block">
                  {tip.num} · {tip.title}
                </span>
                <p className="font-serif italic text-xs sm:text-sm text-ink-soft leading-relaxed">
                  {tip.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
