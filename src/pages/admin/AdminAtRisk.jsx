import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, CheckCircle2, X } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { Mark } from '../../components/ui/Mark';
import { MarginNote } from '../../components/ui/MarginNote';
import { Button } from '../../components/ui/Button';
import { Stamp } from '../../components/ui/Stamp';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';

function MentorPickerPopover({ item, mentorsList, onAssign, onClose, anchorRef }) {
  const popoverRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 270, openUpward: false, maxHeight: 260 });

  const updatePosition = () => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(270, window.innerWidth - 24);

    // Account for mobile bottom bar (~76px on small screens) or viewport margin
    const bottomNavHeight = window.innerWidth < 640 ? 76 : 16;
    const availableBottom = window.innerHeight - bottomNavHeight;
    const spaceBelow = Math.max(0, availableBottom - rect.bottom - 8);
    const spaceAbove = Math.max(0, rect.top - 12);

    // Actual height of popover if measured, otherwise estimated 200px
    const popoverHeight = popoverRef.current ? popoverRef.current.scrollHeight : 200;

    // Open upward if space below is not enough for the full popover, or if space below is tighter than above
    const openUpward =
      (spaceBelow < popoverHeight && spaceAbove > spaceBelow) ||
      (spaceBelow < 150 && spaceAbove >= 150);

    let top;
    let maxHeight;

    if (openUpward) {
      maxHeight = Math.min(spaceAbove, 320);
      const renderHeight = Math.min(popoverHeight, maxHeight);
      top = Math.max(12, rect.top - renderHeight - 8);
    } else {
      maxHeight = Math.min(spaceBelow, 320);
      top = rect.bottom + 8;
      const renderHeight = Math.min(popoverHeight, maxHeight);
      if (top + renderHeight > availableBottom) {
        top = Math.max(12, availableBottom - renderHeight - 8);
      }
    }

    const left = Math.max(12, Math.min(rect.right - popoverWidth, window.innerWidth - popoverWidth - 12));

    setPos({
      top,
      left,
      width: popoverWidth,
      openUpward,
      maxHeight: Math.max(100, maxHeight),
    });
  };

  useLayoutEffect(() => {
    updatePosition();
    // Re-check after layout calculation to guarantee exact height fit
    const raf = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [anchorRef, onClose]);

  return createPortal(
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, scale: 0.95, y: pos.openUpward ? 6 : -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: pos.openUpward ? 6 : -6 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        maxHeight: pos.maxHeight,
        zIndex: 99999,
      }}
      className="bg-surface/95 backdrop-blur-xl rounded-object border border-line shadow-2xl p-2.5 text-left font-mono text-xs overflow-y-auto overscroll-contain space-y-1.5"
    >
      <div className="flex items-center justify-between border-b border-line pb-1 px-1">
        <span className="text-[10px] uppercase font-semibold text-fg-soft block">
          ASSIGN FACULTY ADVISOR:
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-fg-soft hover:text-fg text-xs p-0.5 rounded cursor-pointer leading-none"
          aria-label="Close mentor picker"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1 pt-0.5">
        {mentorsList.map((mentor, mIdx) => (
          <button
            key={mIdx}
            type="button"
            onClick={() => onAssign(item, mentor)}
            className="w-full text-left p-2 rounded-control text-xs text-fg hover:bg-fg/5 hover:text-accent-deep border border-transparent hover:border-line font-medium transition-colors cursor-pointer"
          >
            {mentor}
          </button>
        ))}
      </div>
    </motion.div>,
    document.body
  );
}

function MentorActionButton({ item, mentorsList, onAssign, isActive, onToggle, onClose }) {
  const buttonRef = useRef(null);

  return (
    <div className="relative inline-block text-left">
      <Button
        ref={buttonRef}
        size="sm"
        variant="secondary"
        icon={UserPlus}
        onClick={onToggle}
      >
        Assign Mentor
      </Button>

      <AnimatePresence>
        {isActive && (
          <MentorPickerPopover
            item={item}
            mentorsList={mentorsList}
            onAssign={onAssign}
            onClose={onClose}
            anchorRef={buttonRef}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

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
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 border-y border-line pt-2 no-scrollbar">
        <table className="w-full min-w-[680px] text-left text-sm border-collapse font-sans">
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
                    <MentorActionButton
                      item={item}
                      mentorsList={mentorsList}
                      onAssign={handleAssign}
                      isActive={activePopoverId === item.id}
                      onToggle={() =>
                        setActivePopoverId((prev) => (prev === item.id ? null : item.id))
                      }
                      onClose={() => setActivePopoverId(null)}
                    />
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
export default AdminAtRisk;
