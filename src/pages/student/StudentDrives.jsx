'use client';

import React, { useState } from 'react';
import { Search, Globe, Sparkles, Building2, MapPin, Calendar, Award } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Stamp } from '@/components/ui/Stamp';
import { Tag } from '@/components/ui/Tag';
import { CompanyResearchDrawer } from '@/components/student/CompanyResearchDrawer';

export function StudentDrives() {
  const { drives = [], applications = [], applyToDrive, currentStudent } = useStore();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [matchingDriveId, setMatchingDriveId] = useState(null);
  const [researchDrive, setResearchDrive] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const tabs = [
    { id: 'all', label: 'All Streams', count: drives.length },
    { id: 'it', label: 'IT / Software', count: drives.filter((d) => (d.stream || '').includes('IT')).length },
    { id: 'core', label: 'Core Engg', count: drives.filter((d) => (d.stream || '').includes('Core')).length },
  ];

  const filteredDrives = drives.filter((drive) => {
    const stream = drive.stream || 'IT / Software';
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'it' && stream.includes('IT')) ||
      (activeTab === 'core' && stream.includes('Core'));

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (drive.company || drive.company_name || '').toLowerCase().includes(query) ||
      (drive.role || drive.role_title || '').toLowerCase().includes(query);

    return matchesTab && matchesSearch;
  });

  const handleApply = async (drive) => {
    setMatchingDriveId(drive.id);
    try {
      await new Promise((r) => setTimeout(r, 650));
      applyToDrive(drive.id);
    } catch (err) {
      console.error('Failed to apply:', err);
    } finally {
      setMatchingDriveId(null);
    }
  };

  const openResearch = (drive) => {
    setResearchDrive(drive);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 text-fg">
      {/* Masthead Header */}
      <header className="border-b border-line pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-fg-soft uppercase tracking-wider">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span>03 · PLACEMENT DRIVES REGISTER</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg">
              Authorized Placement Drives
            </h1>
            <p className="text-sm text-fg-soft mt-1 max-w-2xl">
              Review active campus recruitment notices verified by Central Placement Cell. Launch live intelligence dossiers powered by Tavily AI or submit AI-matched applications.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-fg-soft" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, tech or role..."
              className="w-full bg-surface text-fg pl-9 pr-3 py-2 rounded-lg border border-line text-xs placeholder:text-fg-soft/60 focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 pt-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent-tint text-accent border border-accent/40 font-semibold'
                  : 'bg-surface/50 text-fg-soft hover:text-fg hover:bg-surface border border-line'
              }`}
            >
              {tab.label} <span className="text-[10px] opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>
      </header>

      {/* Drives List */}
      <div className="divide-y divide-line border-y border-line">
        {filteredDrives.length === 0 ? (
          <div className="py-16 text-center text-fg-soft text-sm">
            No placement drives found matching your filter criteria.
          </div>
        ) : (
          filteredDrives.map((drive) => {
            const companyName = drive.company || drive.company_name || 'Target Company';
            const roleName = drive.role || drive.role_title || 'Software Engineer';
            const skills = drive.skillsRequired || drive.required_skills || [];
            const application = applications.find(
              (a) => a.driveId === drive.id || a.drive_id === drive.id
            );
            const isMatching = matchingDriveId === drive.id;

            return (
              <div
                key={drive.id}
                className="py-5 px-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors hover:bg-surface/40"
              >
                {/* Left: Role & Company Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-lg text-fg tracking-tight">
                      {companyName}
                    </h3>
                    {drive.stream && (
                      <span className="font-mono text-[10px] uppercase text-fg-soft bg-surface px-2 py-0.5 rounded border border-line">
                        {drive.stream}
                      </span>
                    )}
                    {drive.tier && (
                      <span className="font-mono text-[10px] uppercase text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40 font-semibold">
                        {drive.tier}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-medium text-fg-soft">
                    {roleName}
                  </p>

                  {/* Skills Required */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                      <span className="text-fg-soft text-[11px]">Skills:</span>
                      {skills.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded bg-surface border border-line text-[10px] font-mono text-fg-soft"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Middle: CTC & Logistics */}
                <div className="flex flex-wrap lg:flex-col lg:items-end gap-x-5 gap-y-1 font-mono text-xs text-fg-soft shrink-0">
                  <span className="text-emerald-400 font-bold text-sm">
                    {drive.ctcString || `₹${drive.min_ctc || 6} - ₹${drive.max_ctc || 10} LPA`}
                  </span>
                  {drive.date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-fg-soft" />
                      Date: <strong className="text-fg">{drive.date}</strong>
                    </span>
                  )}
                  {drive.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-fg-soft" />
                      Venue: {drive.venue}
                    </span>
                  )}
                  {drive.minCgpa && (
                    <span>Cut-off: {drive.minCgpa} CGPA</span>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2.5 shrink-0 lg:pl-4">
                  {/* Research Company Dossier Button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openResearch(drive)}
                    className="flex items-center gap-1.5 border-line bg-surface hover:bg-slate-800 text-fg"
                  >
                    <Globe className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Research Company</span>
                  </Button>

                  {/* Application Action / Status */}
                  {application ? (
                    <div className="flex items-center gap-2">
                      {application.fitScore && (
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          FIT {application.fitScore}%
                        </span>
                      )}
                      <Stamp tone={application.status === 'Shortlisted' ? 'jade' : 'ochre'}>
                        {application.status || application.stage || 'Applied'}
                      </Stamp>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      loading={isMatching}
                      onClick={() => handleApply(drive)}
                    >
                      {isMatching ? 'Evaluating...' : 'Apply (AI Match)'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Intelligence Drawer */}
      <CompanyResearchDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        drive={researchDrive}
        currentStudent={currentStudent}
        application={
          researchDrive
            ? applications.find(
                (a) => a.driveId === researchDrive.id || a.drive_id === researchDrive.id
              )
            : null
        }
        onApply={(target) => {
          handleApply(target || researchDrive);
          setDrawerOpen(false);
        }}
      />
    </div>
  );
}

export default StudentDrives;
