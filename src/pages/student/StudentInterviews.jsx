'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Video, Globe, Sparkles, Building2, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Stamp } from '@/components/ui/Stamp';
import { MarginNote } from '@/components/ui/MarginNote';
import { CompanyResearchDrawer } from '@/components/student/CompanyResearchDrawer';

export function StudentInterviews() {
  const { studentInterviews = [], currentStudent, applications = [], drives = [] } = useStore();
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const prepTips = [
    {
      num: '01',
      title: 'Review Core Algorithmic Complexities',
      desc: 'Tier-1 recruiters focus heavily on big-O space/time trade-offs across graphs, trees, and dynamic programming.',
    },
    {
      num: '02',
      title: 'Structure Behavioral Answers with STAR',
      desc: 'Frame your leadership and technical dispute experiences through Situation, Task, Action, and Measurable Result.',
    },
    {
      num: '03',
      title: 'Inspect Live Company Tech Stack & News',
      desc: 'Use the Prep Dossier to study recent cloud modernisations, interview round expectations, and team focus areas.',
    },
    {
      num: '04',
      title: 'Pre-Test Video & Coding Environment',
      desc: 'Ensure reliable audio input, high-speed connection, and development sandbox are tested 15 minutes prior to panel arrival.',
    },
  ];

  const handleOpenDossier = (interview) => {
    // Look up associated drive if exists, or synthesize from interview
    const matchedDrive = drives.find(
      (d) =>
        d.id === interview.driveId ||
        (d.company || d.company_name) === interview.company
    ) || {
      id: interview.driveId || interview.id,
      company_name: interview.company,
      company: interview.company,
      role_title: interview.role,
      role: interview.role,
      required_skills: ['Data Structures', 'System Design', 'Core CS Fundamentals'],
    };

    setSelectedInterview(matchedDrive);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 text-fg">
      {/* Masthead Header */}
      <header className="border-b border-line pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-fg-soft uppercase tracking-wider">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span>05 · INTERVIEW DISPATCHER & CALENDAR</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg">
              Confirmed Interview Schedule
            </h1>
            <p className="text-sm text-fg-soft mt-1 max-w-2xl">
              Synchronized assessment calendar with corporate panels. Access on-demand intelligence dossiers to review company tech stacks, round timelines, and interview tips.
            </p>
          </div>
          <div className="text-xs font-mono text-fg-soft bg-surface border border-line px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-400" />
            <span>Active Slots: <strong className="text-fg">{studentInterviews.length}</strong></span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start pt-2">
        {/* Timeline Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-fg-soft">
              CONCURRENT SCHEDULED SESSIONS ({studentInterviews.length})
            </span>
          </div>

          <div className="relative border-l-2 border-line pl-4 sm:pl-6 ml-2 sm:ml-3 space-y-6 pt-2">
            {studentInterviews.length === 0 ? (
              <div className="py-12 text-center text-fg-soft text-sm">
                No active interview slots booked yet. Keep checking as recruiters shortlist your applications.
              </div>
            ) : (
              studentInterviews.map((interview) => (
                <div key={interview.id} className="relative group">
                  {/* Timeline Node */}
                  <div className="absolute -left-[23px] sm:-left-[31px] top-3 w-3.5 h-3.5 rounded-full bg-surface border-2 border-accent flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  </div>

                  <div className="p-4 bg-surface rounded-xl border border-line shadow-sm space-y-3 hover:border-slate-700 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-base sm:text-lg text-fg tracking-tight">
                          {interview.company}
                        </h4>
                        <p className="text-xs font-medium text-fg-soft">
                          {interview.role}
                        </p>
                      </div>
                      <Stamp tone={interview.status === 'Confirmed' ? 'jade' : 'ochre'}>
                        {interview.status}
                      </Stamp>
                    </div>

                    <div className="font-mono text-xs text-fg-soft flex flex-wrap gap-x-5 gap-y-1 pt-1 border-t border-line/60">
                      <span className="text-fg flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-fg-soft" /> {interview.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-fg-soft" /> {interview.time}
                      </span>
                      <span className="w-full text-fg-soft flex items-center gap-1">
                        <Video className="h-3 w-3 text-fg-soft" /> {interview.mode}
                      </span>
                    </div>

                    {interview.panel && (
                      <div className="pt-2 border-t border-line/60 text-[11px] text-fg-soft font-mono">
                        Panel: <span className="text-fg font-semibold">{interview.panel}</span>
                      </div>
                    )}

                    {/* Action Bar with Prep Dossier */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-line/60">
                      <span className="text-[11px] text-indigo-400 font-mono">
                        Live Grounding Ready
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenDossier(interview)}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border-line text-xs font-semibold"
                      >
                        <Globe className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Prep Dossier</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Preparation Guidelines (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border-b border-line pb-2">
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-fg-soft">
              PLACEMENT CELL GUIDELINES
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {prepTips.map((tip) => (
              <div key={tip.num} className="space-y-1 p-3.5 rounded-xl border border-line bg-surface/50">
                <span className="font-mono text-xs font-bold text-accent block">
                  {tip.num} · {tip.title}
                </span>
                <p className="text-xs text-fg-soft leading-relaxed">
                  {tip.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Intelligence Drawer */}
      <CompanyResearchDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        drive={selectedInterview}
        currentStudent={currentStudent}
        application={
          selectedInterview
            ? applications.find(
                (a) =>
                  a.driveId === selectedInterview.id ||
                  a.drive_id === selectedInterview.id
              )
            : null
        }
      />
    </div>
  );
}

export default StudentInterviews;
