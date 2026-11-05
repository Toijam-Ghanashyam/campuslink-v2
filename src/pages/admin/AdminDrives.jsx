import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, AlertTriangle, CheckCircle2, Clock, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Tabs } from '../../components/ui/Tabs';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
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
    // Simulate timeline animation transition
    await new Promise((r) => setTimeout(r, 700));
    resolveDriveConflict(driveId);
    toast('Conflict mitigated! Cognizant moved to Lab 2 (14:00-17:00). All portals synced.', 'jade');
    setResolvingId(null);
  };

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="font-display font-semibold text-3xl text-ink tracking-tight">
          Placement Drives & Scheduling Calendar
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Automated interval-overlap engine detecting venue collisions, date clashes, and panel double-booking.
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {/* SIGNATURE SECTION: Conflict Resolution Banner & Mini-Timeline */}
      <AnimatePresence mode="wait">
        {hasConflict ? (
          <motion.div
            key="conflict-active"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <Callout
              tone="brick"
              title="Drive Scheduling Conflict Detected (PS Deliverable 4)"
              action={
                <Button
                  size="sm"
                  variant="primary"
                  loading={resolvingId === 'd-2'}
                  onClick={() => handleResolveConflict('d-2')}
                >
                  Resolve Conflict (Auto-Mitigate)
                </Button>
              }
            >
              Request from <strong className="text-ink">Cognizant Technology</strong> for Nov 02, 2026 (09:00 - 12:00) overlaps with <strong className="text-ink">Tech Mahindra</strong> (10:00 - 13:00) in Computing Lab 4. Authorization blocked.
            </Callout>

            {/* Visual Mini Timeline of the Overlap */}
            <Card className="p-5 bg-paper border-brick/40">
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="font-semibold text-ink uppercase tracking-wider">
                  Timeline Visualizer: Computing Lab 4 (Nov 02, 2026)
                </span>
                <span className="text-brick font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> 2-Hour Overlap Collision
                </span>
              </div>

              {/* Time axis */}
              <div className="flex justify-between text-[11px] font-mono text-ink-soft mb-2 border-b border-line pb-1">
                <span>09:00</span>
                <span>10:00</span>
                <span>11:00</span>
                <span>12:00</span>
                <span>13:00</span>
                <span>14:00</span>
                <span>15:00</span>
                <span>16:00</span>
                <span>17:00</span>
              </div>

              {/* Slots Bar Graph */}
              <div className="space-y-2 py-2 relative">
                {/* Cognizant Bar */}
                <div className="h-7 w-full bg-bone rounded-lg relative overflow-hidden flex items-center">
                  <div
                    className="absolute left-0 w-[37.5%] h-full bg-ochre/40 border border-ochre rounded-lg flex items-center px-3 text-xs font-semibold text-ink"
                  >
                    Cognizant (09:00 - 12:00)
                  </div>
                </div>

                {/* Tech Mahindra Bar */}
                <div className="h-7 w-full bg-bone rounded-lg relative overflow-hidden flex items-center">
                  <div
                    className="absolute left-[12.5%] w-[37.5%] h-full bg-ink/10 border border-ink/40 rounded-lg flex items-center px-3 text-xs font-semibold text-ink"
                  >
                    Tech Mahindra (10:00 - 13:00)
                  </div>
                </div>

                {/* Overlap Hatching Indicator */}
                <div
                  className="absolute top-0 bottom-0 left-[12.5%] w-[25%] bg-brick/20 border-x-2 border-brick border-dashed pointer-events-none rounded flex items-center justify-center animate-pulse"
                >
                  <span className="text-[10px] font-bold text-brick bg-paper px-1 rounded shadow-sm">
                    CLASH (10:00-12:00)
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="conflict-resolved"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-jade-tint border border-jade/30 flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-jade shrink-0" />
              <div>
                <p className="font-semibold text-ink text-sm">Conflict Mitigated & Resolved</p>
                <p className="text-ink-soft">Cognizant moved to 14:00 - 17:00, Computing Lab 2. Zero venue or student shortlist clashes.</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-jade bg-paper px-2.5 py-1 rounded-md border border-jade/20">
              Optimal Schedule Locked
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drives Table */}
      <Card className="p-0 overflow-hidden border-line">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-line bg-bone/60 text-[11px] uppercase tracking-wider font-semibold text-ink-soft">
                <th className="py-3.5 px-5">Company & Role</th>
                <th className="py-3.5 px-5">Date & Slot</th>
                <th className="py-3.5 px-5">Allocated Venue</th>
                <th className="py-3.5 px-5">Eligible Disciplines</th>
                <th className="py-3.5 px-5">Audit Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {drives.map((drive) => (
                <tr
                  key={drive.id}
                  className={cn(
                    'transition-colors',
                    drive.status === 'Conflict' ? 'bg-brick-tint/20 hover:bg-brick-tint/30' : 'hover:bg-bone/40'
                  )}
                >
                  <td className="py-4 px-5">
                    <p className="font-semibold text-ink">{drive.company}</p>
                    <p className="text-xs text-ink-soft">{drive.role}</p>
                  </td>

                  <td className="py-4 px-5 text-xs text-ink">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-ink-soft" />
                      <span>{drive.date}</span>
                    </div>
                    <p className="text-[11px] text-ink-soft font-mono mt-0.5">{drive.slot}</p>
                  </td>

                  <td className="py-4 px-5 text-xs text-ink font-medium">
                    {drive.venue}
                  </td>

                  <td className="py-4 px-5">
                    <div className="flex flex-wrap gap-1">
                      {drive.branches.map((b) => (
                        <span key={b} className="text-[10px] px-1.5 py-0.5 rounded bg-bone border border-line text-ink font-medium">
                          {b}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-4 px-5">
                    <Badge
                      tone={
                        drive.status === 'Verified'
                          ? 'jade'
                          : drive.status === 'Conflict'
                          ? 'brick'
                          : 'ochre'
                      }
                      size="sm"
                      dot={drive.status === 'Conflict'}
                    >
                      {drive.status}
                    </Badge>
                  </td>

                  <td className="py-4 px-5 text-right">
                    {drive.status === 'Conflict' ? (
                      <Button
                        size="sm"
                        variant="primary"
                        loading={resolvingId === drive.id}
                        onClick={() => handleResolveConflict(drive.id)}
                      >
                        Resolve Conflict
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary">
                        Manage Drive
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageTransition>
  );
}

