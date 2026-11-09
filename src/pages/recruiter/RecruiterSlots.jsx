// src/pages/recruiter/RecruiterSlots.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Plus,
  Check,
  Unlock,
  CalendarCheck,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

const DAYS = [
  'MONDAY (NOV 02)',
  'TUESDAY (NOV 03)',
  'WEDNESDAY (NOV 04)',
  'THURSDAY (NOV 05)',
  'FRIDAY (NOV 06)',
];

const TIME_ROWS = [
  '10:00 - 11:00 AM',
  '11:30 - 12:30 PM',
  '02:00 - 03:00 PM',
  '03:30 - 04:30 PM',
];

const INITIAL_SLOTS = {
  '0-0': { name: 'Rohan Senapati', role: 'SDE-1', fit: 94, roll: '220101012' },
  '0-1': { name: 'Ananya Sharma', role: 'SDE-1', fit: 91, roll: '220101045' },
  '0-3': { name: 'Priyanka Tripathy', role: 'SDE-1', fit: 89, roll: '220101088' },
  '1-1': { name: 'Ritika Samal', role: 'SDE-1', fit: 87, roll: '220101063' },
  '2-4': { name: 'Sneha Patra', role: 'SDE-1', fit: 92, roll: '220101029' },
};

const WAITLIST_CANDIDATES = [
  { name: 'Aarav Mohanty', role: 'SDE-1', fit: 90, roll: '220101019' },
  { name: 'Debasis Panda', role: 'SDE-1', fit: 88, roll: '220101054' },
  { name: 'Subham Nayak', role: 'SDE-1', fit: 86, roll: '220101077' },
  { name: 'Ishita Mishra', role: 'SDE-1', fit: 93, roll: '220101031' },
];

function InteractiveSlotCell({
  rowIdx,
  colIdx,
  booking,
  onToggleSlot,
  onHoverChange,
}) {
  const [hovered, setHovered] = useState(false);

  const handlePointerMove = (e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    el.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(1)}px`);
    el.style.setProperty('--my', `${(e.clientY - r.top).toFixed(1)}px`);
  };

  return (
    <motion.button
      type="button"
      layout
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      onPointerMove={handlePointerMove}
      onMouseEnter={() => {
        setHovered(true);
        onHoverChange(rowIdx, colIdx);
      }}
      onMouseLeave={() => {
        setHovered(false);
        onHoverChange(-1, -1);
      }}
      onClick={() => onToggleSlot(rowIdx, colIdx)}
      style={{ '--mx': '50%', '--my': '50%' }}
      className={`group relative h-[100px] sm:h-[104px] w-full rounded-control p-3 sm:p-3.5 text-left transition-colors duration-300 overflow-hidden select-none min-h-[44px] ${
        booking
          ? 'border border-line bg-surface/90 hover:border-jade/60 shadow-subtle'
          : 'border border-dashed border-line/80 bg-surface/20 hover:border-accent hover:bg-surface/60'
      }`}
    >
      {/* 1. Cursor-Following Radial Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: booking
            ? 'radial-gradient(150px circle at var(--mx) var(--my), rgb(var(--c-jade) / 0.18), transparent 70%)'
            : 'radial-gradient(150px circle at var(--mx) var(--my), rgb(var(--c-accent) / 0.18), transparent 70%)',
        }}
      />

      <AnimatePresence mode="wait">
        {booking ? (
          <motion.div
            key="locked"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 flex h-full flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs font-bold text-fg truncate group-hover:text-jade transition-colors">
                  {booking.name}
                </p>
                <p className="font-mono text-[10px] text-fg-soft mt-0.5 truncate">
                  {booking.role}
                </p>
              </div>

              {/* AI Fit Pill */}
              <span className="shrink-0 rounded bg-jade/15 border border-jade/35 px-1.5 py-0.5 font-mono text-[9px] font-bold text-jade">
                {booking.fit}%
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-jade">
                <Check className="h-3 w-3 stroke-[2.5]" />
                <span>Locked</span>
                <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-jade animate-pulse" />
              </span>

              <span className="font-mono text-[9px] uppercase tracking-wider text-fg-soft opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 flex items-center gap-1">
                <Unlock className="h-2.5 w-2.5" />
                Release
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="available"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex h-full flex-col items-center justify-center text-center"
          >
            <div className="relative flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border border-transparent group-hover:border-accent/50 group-hover:bg-accent/10 transition-all duration-300">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-fg-soft transition-all duration-300 group-hover:rotate-90 group-hover:scale-110 group-hover:text-accent" />
            </div>

            <span className="mt-1 font-mono text-[10.5px] sm:text-[11px] text-fg-soft transition-colors duration-200 group-hover:text-fg font-medium">
              Available
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function RecruiterSlots() {
  const { toast } = useToast();
  const [slots, setSlots] = useState(INITIAL_SLOTS);
  const [waitlistIdx, setWaitlistIdx] = useState(0);
  const [activeCell, setActiveCell] = useState({ row: -1, col: -1 });

  const handleToggleSlot = (rowIdx, colIdx) => {
    const key = `${rowIdx}-${colIdx}`;
    if (slots[key]) {
      const removed = slots[key];
      setSlots((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      toast(`Slot released: ${removed.name} returned to pool.`, 'ochre');
    } else {
      const nextCand =
        WAITLIST_CANDIDATES[waitlistIdx % WAITLIST_CANDIDATES.length];
      setWaitlistIdx((n) => n + 1);
      setSlots((prev) => ({ ...prev, [key]: nextCand }));
      toast(`Interview locked: ${nextCand.name} (${nextCand.fit}% Fit) scheduled.`, 'jade');
    }
  };

  const lockedCount = Object.keys(slots).length;
  const totalSlots = DAYS.length * TIME_ROWS.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Status Telemetry Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-2.5">
          <CalendarCheck className="h-4 w-4 text-accent shrink-0" />
          <span className="font-mono text-[11px] sm:text-xs uppercase tracking-widest text-fg-soft">
            PANEL MATRIX · <strong className="text-fg">{lockedCount} LOCKED</strong> / {totalSlots - lockedCount} AVAILABLE
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10.5px] sm:text-[11px] text-fg-soft">
          <Clock className="h-3.5 w-3.5 text-accent shrink-0" />
          <span>Click any slot to lock candidate or release</span>
        </div>
      </div>

      {/* Main Interview Slots Matrix Container */}
      <div className="rounded-xl sm:rounded-2xl border border-line bg-surface/40 p-3 sm:p-5 lg:p-7 space-y-5 sm:space-y-6 -mx-4 sm:mx-0 overflow-x-auto no-scrollbar">
        <div className="min-w-[680px] sm:min-w-[760px] space-y-5 sm:space-y-6">
          {/* 5 Day Column Headers */}
          <div className="grid grid-cols-5 gap-3 sm:gap-4">
            {DAYS.map((day, colIdx) => {
              const isColHovered = activeCell.col === colIdx;
              return (
                <div
                  key={day}
                  className={`rounded-control border py-2 px-2.5 sm:py-2.5 sm:px-3 text-center font-mono text-[10.5px] sm:text-xs tracking-wider transition-all duration-200 truncate ${
                    isColHovered
                      ? 'border-accent bg-accent/15 text-fg font-bold shadow-[0_0_15px_rgb(var(--c-accent)/0.2)]'
                      : 'border-line/70 bg-surface/60 text-fg-soft'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* 4 Time Slot Rows */}
          {TIME_ROWS.map((timeLabel, rowIdx) => {
            const isRowHovered = activeCell.row === rowIdx;
            return (
              <div key={timeLabel} className="space-y-2 sm:space-y-2.5">
                <div
                  className={`flex items-center gap-2 font-mono text-xs transition-colors duration-200 ${
                    isRowHovered ? 'text-accent font-semibold' : 'text-fg-soft'
                  }`}
                >
                  <Clock
                    className={`h-3.5 w-3.5 transition-transform duration-300 ${
                      isRowHovered ? 'scale-110 text-accent' : 'text-fg-soft'
                    }`}
                  />
                  <span>{timeLabel}</span>
                  {isRowHovered && (
                    <span className="ml-2 rounded bg-accent/15 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-accent-ink font-semibold">
                      ACTIVE WINDOW
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-5 gap-3 sm:gap-4">
                  {DAYS.map((_, colIdx) => {
                    const key = `${rowIdx}-${colIdx}`;
                    return (
                      <InteractiveSlotCell
                        key={key}
                        rowIdx={rowIdx}
                        colIdx={colIdx}
                        booking={slots[key]}
                        onToggleSlot={handleToggleSlot}
                        onHoverChange={(r, c) =>
                          setActiveCell({ row: r, col: c })
                        }
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RecruiterSlots;
