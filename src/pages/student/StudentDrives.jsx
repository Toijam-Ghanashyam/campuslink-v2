import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { Tabs } from '../../components/ui/Tabs';
import { Stamp } from '../../components/ui/Stamp';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';
import { cn } from '../../lib/utils';

export function StudentDrives() {
  const { drives, applications, applyToDrive } = useStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('all');
  const [matchingDriveId, setMatchingDriveId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'all', label: 'All Streams', count: drives.length },
    { id: 'it', label: 'IT / Software', count: drives.filter((d) => d.stream === 'IT / Software').length },
    { id: 'core', label: 'Core Engg', count: drives.filter((d) => d.stream === 'Core Engg').length },
  ];

  const filteredDrives = drives.filter((drive) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'it' && drive.stream === 'IT / Software') ||
      (activeTab === 'core' && drive.stream === 'Core Engg');

    const matchesSearch =
      drive.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drive.role.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const handleApply = async (drive) => {
    setMatchingDriveId(drive.id);
    try {
      await new Promise((r) => setTimeout(r, 850));
      const result = applyToDrive(drive.id);
      toast(`Evaluation Logged: ${result.fitScore}% Fit calculated!`, 'jade');
    } catch {
      toast('Failed to process application', 'brick');
    } finally {
      setMatchingDriveId(null);
    }
  };

  return (
    <PageTransition className="space-y-6">
      <Masthead
        context="03 · PLACEMENT DRIVES REGISTER"
        title="Authorized Placement Drives."
        lede="Review active recruitment notices approved by BPUT Central Placement Cell. Submitting an application computes an explainable skill embedding match."
        action={
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-fg-soft" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter company or role..."
              className="w-full bg-[var(--surface)] text-[var(--fg)] pl-9 pr-3 py-1.5 rounded-control border border-line font-sans text-xs placeholder:text-fg-soft/60 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        }
      />

      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {/* Ruled Drives Register (Editorial 96px Rows) */}
      <div className="divide-y divide-line border-y border-line">
        {filteredDrives.map((drive) => {
          const application = applications.find((a) => a.driveId === drive.id);
          const isMatching = matchingDriveId === drive.id;

          return (
            <div
              key={drive.id}
              className={cn(
                'py-5 px-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative overflow-hidden transition-colors',
                drive.status === 'Conflict' ? 'bg-brick-tint/15' : 'hover:bg-bone/40'
              )}
            >
              {/* Laser Scan Line Sweep */}
              {isMatching && (
                <motion.div
                  initial={{ left: '-10%' }}
                  animate={{ left: '110%' }}
                  transition={{ duration: 0.85, ease: 'easeInOut' }}
                  className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-ochre/40 to-transparent pointer-events-none z-20"
                />
              )}

              {/* Left Column: Role & Discipline */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-display font-medium text-xl text-ink">
                    {drive.company}
                  </h3>
                  <span className="font-mono text-[10px] uppercase text-ink-soft bg-bone px-1.5 py-0.2 rounded-xs border border-line">
                    {drive.stream}
                  </span>
                  {drive.status === 'Conflict' && (
                    <Stamp tone="brick">CLASH</Stamp>
                  )}
                </div>

                <p className="font-sans text-xs text-ink-soft font-medium">
                  {drive.role}
                </p>

                {/* Key Skills */}
                <div className="font-mono text-[11px] text-ink-soft/80 flex flex-wrap items-center gap-1.5 pt-1">
                  <span>Skills:</span>
                  <span>{drive.skillsRequired.join(' · ')}</span>
                </div>
              </div>

              {/* Middle Column: Package, Date & Cut-off */}
              <div className="flex flex-wrap lg:flex-col lg:items-end gap-x-6 gap-y-1 font-mono text-xs text-ink-soft shrink-0">
                <span className="text-ink font-bold font-display text-base">
                  {drive.ctcString}
                </span>
                <span>Date: <strong className="text-ink">{drive.date}</strong></span>
                <span>Venue: {drive.venue}</span>
                <span>Cut-off: {drive.minCgpa} CGPA</span>
              </div>

              {/* Right Column: Actions / Stamps */}
              <div className="flex items-center gap-3 shrink-0 lg:pl-4">
                {application ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-ink">
                      FIT {application.fitScore}%
                    </span>
                    <Stamp
                      tone={
                        application.status === 'Shortlisted'
                          ? 'jade'
                          : application.status === 'Rejected'
                          ? 'brick'
                          : 'ochre'
                      }
                    >
                      {application.status}
                    </Stamp>
                  </div>
                ) : (
                  <Button
                    variant={drive.status === 'Conflict' ? 'secondary' : 'primary'}
                    loading={isMatching}
                    onClick={() => handleApply(drive)}
                  >
                    {isMatching ? 'Evaluating...' : 'Apply (AI Match)'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </PageTransition>
  );
}
