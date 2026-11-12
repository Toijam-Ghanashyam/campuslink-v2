'use client';

import React, { useState } from 'react';
import {
  Users,
  Video,
  Film,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  UserCheck,
  XCircle,
  PlayCircle,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Stamp } from '../../components/ui/Stamp';
import { Drawer } from '../../components/ui/Drawer';
import { PageTransition } from '../../components/ui/PageTransition';

export function RecruiterPipeline() {
  const { pipeline = [], setPipeline, students = [], aiInterviewSessions = {} } = useStore();
  const [selectedBioCandidate, setSelectedBioCandidate] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const handleOpenCandidate = (candidate) => {
    setSelectedBioCandidate(candidate);
    setDrawerOpen(true);
  };

  const handleAdvanceStage = (studentId, nextStatus) => {
    setPipeline((prev) =>
      prev.map((p) =>
        p.studentId === studentId ? { ...p, pipelineStatus: nextStatus } : p
      )
    );
    if (selectedBioCandidate && selectedBioCandidate.studentId === studentId) {
      setSelectedBioCandidate((prev) => ({ ...prev, pipelineStatus: nextStatus }));
    }
  };

  const currentSession =
    selectedBioCandidate &&
    (aiInterviewSessions[selectedBioCandidate.studentId] ||
      aiInterviewSessions['demo-student-id']); // fallback to demo if available

  const filteredPipeline = pipeline.filter((cand) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'interview') return cand.pipelineStatus.toLowerCase().includes('interview');
    if (activeTab === 'shortlisted') return cand.pipelineStatus.toLowerCase().includes('shortlisted');
    if (activeTab === 'offered') return cand.pipelineStatus.toLowerCase().includes('offer');
    return true;
  });

  const formatTime = (sec = 0) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <PageTransition className="space-y-6">
      <Masthead
        context="RECRUITER PIPELINE · TALENT ACQUISITION"
        title="Candidate Assessment & Pipeline Review."
        lede="Review applicants, inspect automated AI video interview recordings (unbroken session + 10 question clips), and advance candidate stages."
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-3">
        {[
          { id: 'all', label: 'All Candidates', count: pipeline.length },
          { id: 'shortlisted', label: 'Shortlisted for R2', count: pipeline.filter((c) => c.pipelineStatus.includes('Shortlisted')).length },
          { id: 'interview', label: 'Interview Rounds', count: pipeline.filter((c) => c.pipelineStatus.includes('Interview')).length },
          { id: 'offered', label: 'Offered', count: pipeline.filter((c) => c.pipelineStatus.includes('Offer')).length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-surface text-fg-soft border-line hover:text-fg hover:border-slate-700'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPipeline.map((candidate) => {
          const session = aiInterviewSessions[candidate.studentId];
          const hasInterview = Boolean(session);

          return (
            <Card
              key={candidate.id}
              className="p-5 space-y-4 hover:border-indigo-500/60 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-semibold text-base text-fg">
                      {candidate.studentName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-fg-soft mt-0.5">
                      <span>{candidate.rollNumber}</span>
                      <span>•</span>
                      <span>CGPA: <strong className="text-emerald-400">{candidate.cgpa}</strong></span>
                    </div>
                  </div>
                  <Badge variant={hasInterview ? 'jade' : 'primary'}>
                    {candidate.pipelineStatus}
                  </Badge>
                </div>

                <div className="p-2.5 rounded-lg bg-bg/50 border border-line text-xs space-y-1">
                  <div className="flex justify-between text-fg-soft">
                    <span>Applied Role:</span>
                    <strong className="text-fg">{candidate.role}</strong>
                  </div>
                  <div className="flex justify-between text-fg-soft">
                    <span>Company:</span>
                    <strong className="text-fg">{candidate.company}</strong>
                  </div>
                  <div className="flex justify-between text-fg-soft pt-1 border-t border-line">
                    <span>AI Fit Score:</span>
                    <strong className="text-indigo-400 font-mono">{candidate.aiMatch}% Match</strong>
                  </div>
                </div>

                {hasInterview && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-700/50 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                      <Video className="w-3.5 h-3.5 text-emerald-400" /> AI Video Round Archived
                    </span>
                    <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      10 Clips
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-line flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenCandidate(candidate)}
                  className="w-full"
                >
                  Inspect Candidate Bio & Video →
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Candidate Bio & Dual-Stream Recording Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedBioCandidate ? selectedBioCandidate.studentName : 'Candidate Review'}
        subtitle={selectedBioCandidate ? `${selectedBioCandidate.rollNumber} · ${selectedBioCandidate.branch}` : ''}
        width="w-full max-w-2xl"
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Close
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (selectedBioCandidate) handleAdvanceStage(selectedBioCandidate.studentId, 'Rejected');
                  setDrawerOpen(false);
                }}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (selectedBioCandidate) handleAdvanceStage(selectedBioCandidate.studentId, 'Offered');
                  setDrawerOpen(false);
                }}
              >
                Release Offer
              </Button>
            </div>
          </div>
        }
      >
        {selectedBioCandidate && (
          <div className="space-y-6 p-1">
            {/* Candidate Metadata Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg border border-line bg-bg/50">
                <div className="text-[10px] font-mono text-fg-soft uppercase">CGPA</div>
                <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                  {selectedBioCandidate.cgpa}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-line bg-bg/50">
                <div className="text-[10px] font-mono text-fg-soft uppercase">AI Match</div>
                <div className="text-base font-bold text-indigo-400 font-mono mt-0.5">
                  {selectedBioCandidate.aiMatch}%
                </div>
              </div>
              <div className="p-3 rounded-lg border border-line bg-bg/50">
                <div className="text-[10px] font-mono text-fg-soft uppercase">Stage</div>
                <div className="text-xs font-semibold text-fg mt-1 truncate">
                  {selectedBioCandidate.pipelineStatus}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-line bg-bg/50">
                <div className="text-[10px] font-mono text-fg-soft uppercase">Applied Drive</div>
                <div className="text-xs font-semibold text-fg mt-1 truncate">
                  {selectedBioCandidate.company}
                </div>
              </div>
            </div>

            {/* AI Technical Video Interview Round Section */}
            {currentSession ? (
              <div className="space-y-5 rounded-xl border border-indigo-500/40 bg-surface/70 p-4">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-accent-deep font-bold">
                      PROCTORED DUAL-STREAM RECORDINGS
                    </span>
                    <h4 className="font-display text-base font-semibold text-fg flex items-center gap-2">
                      <Video className="w-4 h-4 text-emerald-400" />
                      Live AI Video Interview Round
                    </h4>
                  </div>
                  <Stamp tone="jade">10 / 10 ANSWER CLIPS ARCHIVED</Stamp>
                </div>

                {/* Stream 1: Full Unbroken Session */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-fg flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-indigo-400" />
                      01 · Full Unbroken Session Recording
                    </span>
                    <span className="font-mono text-[11px] text-fg-soft">
                      Total: {formatTime(currentSession.totalDurationSec || 0)}
                    </span>
                  </div>
                  <p className="text-[11px] text-fg-soft">
                    Continuous master recording capturing the full round, reading pauses, and inter-question gaps.
                  </p>
                  {currentSession.fullSessionVideoUrl ? (
                    <video
                      controls
                      src={currentSession.fullSessionVideoUrl}
                      className="w-full aspect-video bg-black rounded-lg border border-line"
                    />
                  ) : (
                    <div className="p-4 rounded-lg bg-black text-center text-xs text-fg-soft border border-line">
                      Master video processing or unavailable.
                    </div>
                  )}
                </div>

                {/* Stream 2: 10 Individual Question Answer Clips */}
                <div className="space-y-3 pt-3 border-t border-line">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-fg flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-emerald-400" />
                      02 · Isolated Per-Question Answer Clips ({currentSession.questionClips?.length || 0})
                    </span>
                    <span className="font-mono text-[11px] text-emerald-400 font-semibold">
                      Segmented Answers
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 divide-y divide-line">
                    {(currentSession.questionClips || []).map((clip) => (
                      <div key={clip.questionId} className="pt-3 first:pt-0 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-indigo-400">Q{clip.questionNumber}</span>
                            <span className="text-fg-soft">· {clip.category}</span>
                          </div>
                          <span className="font-mono text-[11px] text-emerald-400">
                            {formatTime(clip.durationSec)}
                          </span>
                        </div>
                        <p className="text-xs text-fg leading-relaxed">
                          "{clip.prompt}"
                        </p>
                        {clip.blobUrl && (
                          <video
                            controls
                            src={clip.blobUrl}
                            className="w-full aspect-video bg-black rounded-lg border border-line"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Card className="p-6 text-center space-y-2 border-line bg-bg/40">
                <Video className="w-8 h-8 text-fg-soft mx-auto" />
                <h4 className="font-display font-medium text-sm text-fg">
                  No AI Video Interview Recorded Yet
                </h4>
                <p className="text-xs text-fg-soft max-w-sm mx-auto">
                  Candidate has not yet completed the autonomous 10-question dual-stream AI technical interview.
                </p>
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </PageTransition>
  );
}

export default RecruiterPipeline;
