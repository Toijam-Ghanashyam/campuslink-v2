import React, { useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';
import { cn } from '../../lib/utils';

export function RecruiterSlots() {
  const { pipeline } = useStore();
  const { toast } = useToast();

  const days = ['Monday (Nov 02)', 'Tuesday (Nov 03)', 'Wednesday (Nov 04)', 'Thursday (Nov 05)', 'Friday (Nov 06)'];
  const times = ['10:00 - 11:00 AM', '11:30 - 12:30 PM', '02:00 - 03:00 PM', '03:30 - 04:30 PM'];

  const [grid, setGrid] = useState({
    '0-0': { candidate: 'Rohan Senapati', role: 'SDE-1', confirmed: true },
    '1-1': { candidate: 'Ritika Samal', role: 'SDE-1', confirmed: true },
    '3-0': { candidate: 'Priyanka Tripathy', role: 'SDE-1', confirmed: true },
    '4-2': { candidate: 'Sneha Patra', role: 'SDE-1', confirmed: true },
  });

  const handleBookCell = (dayIdx, timeIdx) => {
    const key = `${dayIdx}-${timeIdx}`;
    if (grid[key]) return;

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
      <Masthead
        context="04 · INTERVIEW TIMETABLE &amp; SLOTS"
        title="Synchronized Interview Slots."
        lede="Weekly interview matrix preventing recruiter panel double-booking and candidate assessment overlaps."
      />

      <div className="bg-paper rounded-object border border-line p-5 shadow-subtle overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header Row */}
          <div className="grid grid-cols-5 gap-2 pb-3 border-b border-line text-center font-mono text-[11px] font-semibold uppercase text-ink-soft">
            {days.map((day, idx) => (
              <div key={idx} className="p-2 bg-bone/60 rounded-xs">
                {day}
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="space-y-2 pt-3">
            {times.map((time, tIdx) => (
              <div key={tIdx} className="space-y-1">
                <div className="font-mono text-[10.5px] text-ink-soft flex items-center gap-1.5 px-1">
                  <Clock className="w-3 h-3" />
                  <span>{time}</span>
                </div>

                <div className="grid grid-cols-5 gap-2 font-mono text-xs">
                  {days.map((_, dIdx) => {
                    const slotData = grid[`${dIdx}-${tIdx}`];
                    return (
                      <div
                        key={dIdx}
                        onClick={() => handleBookCell(dIdx, tIdx)}
                        className={cn(
                          'p-2.5 rounded-xs border text-xs min-h-[64px] flex flex-col justify-between transition-all select-none',
                          slotData
                            ? 'bg-paper border-line shadow-xs'
                            : 'bg-bone/30 border-dashed border-line hover:border-ink hover:bg-ochre-tint/20 cursor-pointer group'
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
                            <span className="text-[9.5px] text-jade font-semibold flex items-center gap-1 mt-1">
                              ✓ Locked
                            </span>
                          </>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-ink-soft/50 group-hover:text-ink">
                            <Plus className="w-3.5 h-3.5" />
                            <span className="text-[9.5px]">Available</span>
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
      </div>
    </PageTransition>
  );
}
