import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { Tabs } from '../../components/ui/Tabs';
import { Stamp } from '../../components/ui/Stamp';
import { Button } from '../../components/ui/Button';
import { Callout } from '../../components/ui/Callout';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';
import { cn } from '../../lib/utils';

export function AdminDrives() {
  const { drives, resolveDriveConflict } = useStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('all');
  const [resolvingId, setResolvingId] = useState(null);

  const cognizantDrive = drives.find((d) => d.id === 'd-2');
  const hasConflict = cognizantDrive && cognizantDrive.status === 'Conflict';

  const tabs = [
    { id: 'all', label: 'All Drives Calendar', count: drives.length },
    { id: 'ongoing', label: 'Ongoing', count: drives.filter((d) => d.status === 'Ongoing').length },
    { id: 'pending', label: 'Pending Approval', count: drives.filter((d) => d.status === 'Pending Approval').length },
  ];

  const handleResolveConflict = async (driveId) => {
    setResolvingId(driveId);
    await new Promise((r) => setTimeout(r, 700));
    resolveDriveConflict(driveId);
    toast('Conflict mitigated! Cognizant moved to Lab 2 (14:00-17:00). Synced with all portals.', 'jade');
    setResolvingId(null);
  };

  return (
    <PageTransition className="space-y-6">
      <Masthead
        context="04 · DRIVES CALENDAR & SCHEDULING DISPATCHER"
        title="Placement Drives Calendar."
        lede="Interval overlap tree detecting simultaneous room double-booking, panel unavailability, and candidate shortlist clashes."
      />

      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {/* Resource Allocation Matrix & Conflict Engine */}
      <AnimatePresence mode="wait">
        {hasConflict ? (
          <motion.div
            key="conflict-active"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-4"
          >
            {/* Brick Conflict Callout */}
            <div className="p-4 rounded-control border border-brick bg-brick-tint/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-brick uppercase tracking-wider block">
                  SCHEDULING CLASH DETECTED · LAB 4
                </span>
                <p className="font-sans text-ink leading-relaxed">
                  Cognizant Technology (09:00 - 12:00) overlaps with Tech Mahindra (10:00 - 13:00) in Computing Lab 4. Authorization blocked.
                </p>
              </div>

              <Button
                variant="danger"
                size="sm"
                loading={resolvingId === 'd-2'}
                onClick={() => handleResolveConflict('d-2')}
                className="shrink-0"
              >
                Auto-Mitigate Clash
              </Button>
            </div>

            {/* True Multi-Resource Timeline Object */}
            <div className="bg-surface rounded-object border border-line p-4 sm:p-5 shadow-object space-y-4 overflow-x-auto no-scrollbar">
              <div className="min-w-[560px] space-y-4">
                <div className="flex items-center justify-between font-mono text-xs border-b border-line pb-2">
                <span className="font-semibold text-fg uppercase tracking-wider">
                  VENUE INTERVAL GRID · NOV 02, 2026
                </span>
                <span className="text-accent-deep font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-accent" /> 2-HOUR ROOM OVERLAP
                </span>
              </div>

              {/* Time scale aligned with resource tracks */}
              <div className="flex items-center gap-4 border-b border-line/60 pb-2 font-mono text-[10px] text-fg-soft select-none">
                <span className="w-28 shrink-0 text-[10px] uppercase tracking-wider font-semibold">VENUE</span>
                <div className="flex-1 grid grid-cols-8 text-left">
                  <span>09:00</span>
                  <span>10:00</span>
                  <span>11:00</span>
                  <span>12:00</span>
                  <span>13:00</span>
                  <span>14:00</span>
                  <span>15:00</span>
                  <span>16:00</span>
                </div>
              </div>

              {/* Resource Rows */}
              <div className="space-y-3.5 font-mono text-xs">
                {/* Computing Lab 2 (Free morning, will receive Cognizant afternoon) */}
                <div className="flex items-center gap-4">
                  <span className="w-28 text-[11px] text-fg-soft shrink-0">Lab 2:</span>
                  <div className="flex-1 h-7 bg-surface/50 rounded border border-line/60 relative overflow-hidden flex items-center">
                    <div className="absolute left-[62.5%] w-[37.5%] h-full bg-jade/15 border border-jade/40 rounded flex items-center px-2 text-[10px] font-medium text-fg">
                      <span className="text-jade font-semibold mr-1.5">Free Window:</span> 14:00 - 17:00
                    </div>
                  </div>
                </div>

                {/* Computing Lab 4 (COLLISION - SEPARATE LANES WITH CLASH OVERLAP) */}
                <div className="flex items-start gap-4">
                  <div className="w-28 shrink-0 pt-1">
                    <span className="text-[11px] font-semibold text-accent-deep block">Lab 4:</span>
                    <span className="text-[9.5px] text-accent-deep/90 font-mono block">2-HR OVERLAP</span>
                  </div>

                  <div className="flex-1 space-y-1.5 relative">
                    {/* Background Collision Corridor Overlay across 10:00 - 12:00 */}
                    <div className="absolute left-[12.5%] w-[25%] -top-1 -bottom-1 border-x-2 border-dashed border-accent/80 bg-accent-tint/30 pointer-events-none rounded z-0" />

                    {/* Sub-Lane 1: Cognizant (09:00 - 12:00) */}
                    <div className="h-7 bg-surface/70 rounded border border-line relative overflow-hidden flex items-center z-10">
                      {/* 09:00 - 10:00: Non-overlapping company bar */}
                      <div className="absolute left-0 w-[12.5%] h-full bg-accent-tint/30 border-r border-accent/30 flex items-center px-2 text-[10px] font-medium text-fg truncate">
                        Cognizant (09:00)
                      </div>
                      {/* 10:00 - 12:00: OVERLAP TIME (Clash Zone) */}
                      <div className="absolute left-[12.5%] w-[25%] h-full bg-accent-tint/50 border-y border-r border-accent flex items-center justify-between px-2 text-[10px] font-semibold text-accent-deep">
                        <span className="truncate">Cognizant (10:00–12:00)</span>
                        <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-accent text-btn-hover-fg font-bold shrink-0 shadow-xs">
                          CLASH
                        </span>
                      </div>
                    </div>

                    {/* Sub-Lane 2: Tech Mahindra (10:00 - 13:00) */}
                    <div className="h-7 bg-surface/70 rounded border border-line relative overflow-hidden flex items-center z-10">
                      {/* 10:00 - 12:00: OVERLAP TIME (Clash Zone) */}
                      <div className="absolute left-[12.5%] w-[25%] h-full bg-accent-tint/50 border-y border-l border-accent flex items-center justify-between px-2 text-[10px] font-semibold text-accent-deep">
                        <span className="truncate">Tech Mahindra (10:00–12:00)</span>
                        <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-accent text-btn-hover-fg font-bold shrink-0 shadow-xs">
                          CLASH
                        </span>
                      </div>
                      {/* 12:00 - 13:00: Non-overlapping company bar */}
                      <div className="absolute left-[37.5%] w-[12.5%] h-full bg-surface border-l border-line flex items-center px-2 text-[10px] font-medium text-fg truncate">
                        Tech Mahindra (13:00)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seminar Hall A */}
                <div className="flex items-center gap-4">
                  <span className="w-28 text-[11px] text-fg-soft shrink-0">Hall A:</span>
                  <div className="flex-1 h-7 bg-surface/50 rounded border border-line/60 relative overflow-hidden flex items-center">
                    <div className="absolute left-0 w-[50%] h-full bg-surface border-r border-line rounded flex items-center px-3 text-[10px] text-fg-soft">
                      <span>Reserved for Orientation (09:00 - 13:00)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        ) : (
          <motion.div
            key="conflict-resolved"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-control bg-jade-tint/30 border border-jade flex items-center justify-between font-mono text-xs"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-jade shrink-0" />
              <div>
                <p className="font-bold text-ink">CONFLICT RESOLVED &amp; DISPATCHED</p>
                <p className="font-sans text-ink-soft">Cognizant moved to 14:00 - 17:00, Computing Lab 2. Zero venue or student clashes.</p>
              </div>
            </div>
            <Stamp tone="jade">OPTIMAL SCHEDULE LOCKED</Stamp>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ruled Table for Drives */}
      <div className="divide-y divide-line border-y border-line">
        {drives.map((drive) => (
          <div
            key={drive.id}
            className={cn(
              'py-4 px-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors',
              drive.status === 'Conflict' ? 'bg-brick-tint/15' : 'hover:bg-bone/40'
            )}
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5">
                <h4 className="font-display font-medium text-lg text-ink">
                  {drive.company}
                </h4>
                <Stamp tone={drive.status === 'Verified' ? 'jade' : drive.status === 'Conflict' ? 'brick' : 'ochre'}>
                  {drive.status}
                </Stamp>
              </div>
              <p className="font-sans text-xs text-ink-soft">
                {drive.role} · Eligible: <span className="font-mono text-ink">{drive.branches.join(', ')}</span>
              </p>
            </div>

            <div className="font-mono text-xs text-ink-soft flex flex-wrap gap-x-6 gap-y-1">
              <span>Date: <strong className="text-ink">{drive.date}</strong> ({drive.slot})</span>
              <span>Venue: <strong className="text-ink">{drive.venue}</strong></span>
              <span>Min CGPA: {drive.minCgpa}</span>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {drive.status === 'Conflict' ? (
                <Button
                  size="sm"
                  variant="primary"
                  loading={resolvingId === drive.id}
                  onClick={() => handleResolveConflict(drive.id)}
                >
                  Resolve Clash
                </Button>
              ) : (
                <Button size="sm" variant="secondary">
                  Manage Drive
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </PageTransition>
  );
}
