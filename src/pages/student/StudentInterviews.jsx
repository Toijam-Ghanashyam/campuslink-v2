import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Video, MapPin, CheckCircle2, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageTransition } from '../../components/ui/PageTransition';

export function StudentInterviews() {
  const { studentInterviews } = useStore();

  const prepTips = [
    {
      title: 'Review Core Data Structures',
      desc: 'Top recruiters frequently assess time complexities on graphs, trees, and dynamic programming.',
    },
    {
      title: 'Prepare STAR Framework Responses',
      desc: 'Structure your behavioral stories around Situation, Task, Action, and Result for panel evaluations.',
    },
    {
      title: 'Test Microphone & Video 15 Mins Prior',
      desc: 'Ensure virtual interview room credentials and dual monitors are configured before panel joins.',
    },
  ];

  return (
    <PageTransition className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display font-semibold text-3xl text-ink tracking-tight">
          Upcoming Interview Schedule
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Synchronized calendar of confirmed on-campus and virtual recruiter interviews.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Timeline Column */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-display font-semibold text-lg text-ink">
            Confirmed Sessions ({studentInterviews.length})
          </h3>

          <div className="relative border-l-2 border-line pl-6 ml-3 space-y-6">
            {studentInterviews.map((interview, idx) => (
              <motion.div
                key={interview.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.1 }}
                className="relative"
              >
                {/* Timeline Node */}
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-paper border-2 border-ochre flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-ochre" />
                </div>

                <Card className="p-5 space-y-3 hover:border-line/80 transition-all">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-semibold text-base text-ink">
                      {interview.company}
                    </h4>
                    <Badge tone={interview.status === 'Confirmed' ? 'jade' : 'ochre'} size="sm">
                      {interview.status}
                    </Badge>
                  </div>

                  <p className="text-xs font-medium text-ink-soft">
                    {interview.role}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-ink-soft pt-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-ink" />
                      {interview.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-ink" />
                      {interview.time}
                    </span>
                    <span className="flex items-center gap-1.5 sm:col-span-2">
                      <Video className="w-3.5 h-3.5 text-ink" />
                      {interview.mode}
                    </span>
                  </div>

                  {interview.panel && (
                    <div className="pt-2 border-t border-line/50 text-[11px] text-ink-soft">
                      Assessment Panel: <strong className="text-ink">{interview.panel}</strong>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Preparation Tips Column */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="font-display font-semibold text-lg text-ink">
            Placement Cell Tips
          </h3>

          <Card className="p-6 bg-paper space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-line text-ochre-deep font-semibold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Interview Success Guidelines
            </div>

            <div className="space-y-4">
              {prepTips.map((tip, tIdx) => (
                <div key={tIdx} className="space-y-1">
                  <h5 className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-ochre" />
                    {tip.title}
                  </h5>
                  <p className="text-xs text-ink-soft leading-relaxed pl-5">
                    {tip.desc}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}

