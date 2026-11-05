import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle2, User, Plus } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';
import { cn } from '../../lib/utils';

export function RecruiterSlots() {
  const { pipeline } = useStore();
  const { toast } = useToast();

  const days = ['Monday (Nov 02)', 'Tuesday (Nov 03)', 'Wednesday (Nov 04)', 'Thursday (Nov 05)', 'Friday (Nov 06)'];
  const times = ['10:00 - 11:00 AM', '11:30 - 12:30 PM', '02:00 - 03:00 PM', '03:30 - 04:30 PM'];

  // Initial grid state with some booked slots
  const [grid, setGrid] = useState({
    '0-0': { candidate: 'Rohan Senapati', role: 'SDE-1', confirmed: true },
    '1-1': { candidate: 'Ritika Samal', role: 'SDE-1', confirmed: true },
    '3-0': { candidate: 'Priyanka Tripathy', role: 'SDE-1', confirmed: true },
    '4-2': { candidate: 'Sneha Patra', role: 'SDE-1', confirmed: true },
  });

  const handleBookCell = (dayIdx, timeIdx) => {
    const key = `${dayIdx}-${timeIdx}`;
    if (grid[key]) return;

    // Pick first unbooked candidate from pipeline
    const candidate = pipeline.find((p) => p.name && !Object.values(grid).some((s) => s.candidate === p.name));
    const name = candidate ? candidate.name : 'Ananya Sharma';

    setGrid((prev) => ({
      ...prev,
      [key]: { candidate: name, role: 'SDE-1', confirmed: true },
    }));

    toast(`Locked interview for ${name} on ${days[dayIdx]} @ ${times[timeIdx]}`, 'jade');
  };

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="font-display font-semibold text-3xl text-ink tracking-tight">
          Interview Slot Calendar Grid
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Weekly synchronized interview matrix preventing recruiter and candidate time overlap.
        </p>
      </div>

      <Card className="p-6 overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header Row of Days */}
          <div className="grid grid-cols-5 gap-3 pb-3 border-b border-line text-center text-xs font-semibold uppercase tracking-wider text-ink-soft">
            {days.map((day, idx) => (
              <div key={idx} className="p-2 bg-bone/60 rounded-xl">
                {day}
              </div>
            ))}
          </div>

          {/* Time Slots Rows */}
          <div className="space-y-3 pt-3">
            {times.map((time, tIdx) => (
              <div key={tIdx} className="space-y-1">
                <div className="text-[11px] font-mono text-ink-soft flex items-center gap-1.5 px-1">
                  <Clock className="w-3 h-3" />
                  <span>{time}</span>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  {days.map((_, dIdx) => {
                    const slotData = grid[`${dIdx}-${tIdx}`];
                    return (
                      <div
                        key={dIdx}
                        onClick={() => handleBookCell(dIdx, tIdx)}
                        className={cn(
                          'p-3 rounded-xl border text-xs min-h-[72px] flex flex-col justify-between transition-all select-none',
                          slotData
                            ? 'bg-paper border-line shadow-subtle'
                            : 'bg-bone/30 border-dashed border-line hover:border-ochre hover:bg-ochre-tint/20 cursor-pointer group'
                        )}
                      >
                        {slotData ? (
                          <>
                            <div>
                              <p className="font-semibold text-ink leading-tight truncate">
                                {slotData.candidate}
                              </p>
                              <span className="text-[10px] text-ink-soft">{slotData.role}</span>
                            </div>
                            <span className="text-[10px] text-jade font-semibold flex items-center gap-1 mt-1">
                              <CheckCircle2 className="w-3 h-3" /> Confirmed
                            </span>
                          </>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-ink-soft/60 group-hover:text-ochre-deep">
                            <Plus className="w-4 h-4 mb-0.5" />
                            <span className="text-[10px] font-medium">Free Slot</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </PageTransition>
  );
}

