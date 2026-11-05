import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, CheckCircle2, AlertTriangle, ArrowRight, Filter, Search } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
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
      // Simulate scan line animation duration (800ms)
      await new Promise((r) => setTimeout(r, 850));
      const result = applyToDrive(drive.id);
      toast(`AI Evaluation Logged: ${result.fitScore}% Fit!`, 'jade');
    } catch {
      toast('Failed to process application', 'brick');
    } finally {
      setMatchingDriveId(null);
    }
  };

  return (
    <PageTransition className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-3xl text-ink tracking-tight">
            Campus Placement Drives
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            Browse corporate recruitment drives authorized by BPUT Central Placement Cell.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company or role..."
            className="w-full bg-paper pl-9 pr-3 py-1.5 rounded-xl border border-line text-xs text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-ochre"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      {/* Drive Cards / Table */}
      <div className="space-y-3.5">
        {filteredDrives.map((drive) => {
          const application = applications.find((a) => a.driveId === drive.id);
          const isMatching = matchingDriveId === drive.id;

          return (
            <Card
              key={drive.id}
              className={cn(
                'p-5 transition-all relative overflow-hidden',
                drive.status === 'Conflict' && 'border-brick/40 bg-brick-tint/10'
              )}
            >
              {/* SIGNATURE ANIMATION: Thin ochre scan line sweep */}
              {isMatching && (
                <motion.div
                  initial={{ left: '-10%' }}
                  animate={{ left: '110%' }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                  className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-ochre/40 to-transparent pointer-events-none z-20"
                />
              )}

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Company & Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="font-display font-semibold text-lg text-ink">
                      {drive.company}
                    </h3>
                    <Badge tone={drive.stream === 'Core Engg' ? 'ink' : 'ochre'} size="sm">
                      {drive.stream}
                    </Badge>
                    {drive.status === 'Conflict' && (
                      <Badge tone="brick" size="sm" dot>
                        Schedule Conflict (Admin Resolving)
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm font-medium text-ink-soft mb-2">
                    {drive.role}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-ink-soft">
                    <span>
                      Package: <strong className="text-ink">{drive.ctcString}</strong>
                    </span>
                    <span>
                      Drive Date: <strong className="text-ink">{drive.date}</strong> ({drive.slot})
                    </span>
                    <span>
                      Cut-off: <strong className="text-ink">{drive.minCgpa} CGPA</strong>
                    </span>
                    <span>
                      Venue: <strong className="text-ink">{drive.venue}</strong>
                    </span>
                  </div>
                </div>

                {/* Right: Action or Status Badge */}
                <div className="flex items-center gap-3 shrink-0">
                  {application ? (
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[11px] uppercase tracking-wider block font-semibold text-ink-soft">
                          Fit Score
                        </span>
                        <span className="font-display font-bold text-sm text-ink">
                          {application.fitScore}% Match
                        </span>
                      </div>
                      <Badge
                        tone={
                          application.status === 'Shortlisted'
                            ? 'jade'
                            : application.status === 'Rejected'
                            ? 'brick'
                            : 'ochre'
                        }
                        size="md"
                      >
                        {application.status}
                      </Badge>
                    </div>
                  ) : (
                    <Button
                      variant={drive.status === 'Conflict' ? 'secondary' : 'primary'}
                      icon={Sparkles}
                      loading={isMatching}
                      onClick={() => handleApply(drive)}
                    >
                      {isMatching ? 'Matching...' : 'Apply (AI Match)'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Required Skills Row */}
              <div className="mt-3 pt-3 border-t border-line/50 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider mr-2">
                  Key Skills:
                </span>
                {drive.skillsRequired.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-bone text-ink border border-line"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </PageTransition>
  );
}

