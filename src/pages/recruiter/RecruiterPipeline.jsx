'use client';

import React, { useState, useRef } from 'react';
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
  Bot,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Stamp } from '../../components/ui/Stamp';
import { Drawer } from '../../components/ui/Drawer';
import { PageTransition } from '../../components/ui/PageTransition';
import { InteractiveProctoringTimeline } from '../../components/interview/InteractiveProctoringTimeline';

export function RecruiterPipeline() {
  const { pipeline = [], setPipeline, students = [], aiInterviewSessions = {} } = useStore();
  const [selectedBioCandidate, setSelectedBioCandidate] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [streamViewMode, setStreamViewMode] = useState('both'); // 'both' | 'transcripts_only'
  const [copiedAll, setCopiedAll] = useState(false);
  const masterVideoRef = useRef(null);

  const handleCopyAllTranscripts = (clips) => {
    const fullText = (clips || [])
      .map(
        (c) =>
          `[Question ${c.questionNumber} - ${c.category}]\nQuestion: "${c.prompt}"\n\nCandidate Spoken Answer (Transcribed by whisper-large-v3-turbo via Groq API):\n"${c.transcript || 'N/A'}"\n`
      )
      .join('\n========================================\n\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(fullText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

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
        lede="Review applicants, inspect automated AI video interview recordings (unbroken session + 5 question clips), and advance candidate stages."
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
                      {aiInterviewSessions[candidate.studentId]?.questionClips?.length || 5} Clips
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
                  <Stamp tone="jade">
                    {currentSession.questionClips?.length || 5} / {currentSession.questionClips?.length || 5} ANSWER CLIPS ARCHIVED
                  </Stamp>
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

                  {/* Interactive Scrubber with Jump-to-Violation Pins */}
                  <InteractiveProctoringTimeline
                    videoRef={masterVideoRef}
                    totalDurationSec={currentSession.totalDurationSec || 180}
                    questionClips={currentSession.questionClips || []}
                    proctoringEvents={currentSession.proctoringEvents || []}
                  />

                  {currentSession.fullSessionVideoUrl ? (
                    <video
                      ref={masterVideoRef}
                      controls
                      src={currentSession.fullSessionVideoUrl}
                      className="w-full aspect-video bg-black rounded-lg border border-slate-800 shadow-lg"
                    />
                  ) : (
                    <div className="p-4 rounded-lg bg-black text-center text-xs text-fg-soft border border-line">
                      Master video processing or unavailable.
                    </div>
                  )}
                </div>

                {/* Stream 2: Per-Question Answer Clips with Groq Whisper Transcripts */}
                <div className="space-y-3 pt-3 border-t border-line">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-bold text-fg flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-emerald-400" />
                      02 · Isolated Question Clips &amp; Transcripts ({currentSession.questionClips?.length || 0})
                    </span>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setStreamViewMode('both')}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                            streamViewMode === 'both'
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Video &amp; Q&amp;A
                        </button>
                        <button
                          type="button"
                          onClick={() => setStreamViewMode('transcripts_only')}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                            streamViewMode === 'transcripts_only'
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Full Transcript
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyAllTranscripts(currentSession.questionClips)}
                        className="flex items-center gap-1 text-[10px] font-mono font-semibold text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 px-2 py-1 rounded border border-indigo-700/60 transition-colors"
                        title="Copy all questions and transcribed answers to clipboard"
                      >
                        {copiedAll ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedAll ? 'Copied!' : 'Copy Q&A'}</span>
                      </button>
                    </div>
                  </div>

                  {/* STT Model Banner */}
                  <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 font-mono text-indigo-300 font-medium">
                      <Bot className="w-3.5 h-3.5 text-indigo-400" />
                      Voice-to-Text Model: <strong className="text-white">whisper-large-v3-turbo</strong>
                    </span>
                    <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/80">
                      Powered by Groq API
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1 divide-y divide-slate-800/80">
                    {(currentSession.questionClips || []).map((clip) => (
                      <div key={clip.questionId} className="pt-4 first:pt-0 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/60">
                              Question {clip.questionNumber}
                            </span>
                            <span className="text-fg-soft font-semibold">· {clip.category}</span>
                          </div>
                          <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                            Duration: {formatTime(clip.durationSec)}
                          </span>
                        </div>

                        <p className="text-xs text-white font-medium leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800">
                          <strong className="text-indigo-300 font-mono text-[11px] block mb-0.5">Prompt:</strong>
                          "{clip.prompt}"
                        </p>

                        {streamViewMode === 'both' && clip.blobUrl && (
                          <video
                            controls
                            src={clip.blobUrl}
                            className="w-full aspect-video bg-black rounded-lg border border-line shadow-md"
                          />
                        )}

                        {/* Transcribed Q&A Section */}
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3 text-indigo-400" />
                              Transcribed Candidate Response
                            </span>
                            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80 flex items-center gap-1">
                              <Bot className="w-2.5 h-2.5 text-emerald-400" />
                              whisper-large-v3-turbo
                            </span>
                          </div>

                          <div className="p-2.5 rounded bg-slate-900/90 border-l-2 border-indigo-500 text-slate-200 leading-relaxed text-xs">
                            {clip.transcript ? (
                              <p className="text-slate-100 italic whitespace-pre-wrap font-sans">
                                "{clip.transcript}"
                              </p>
                            ) : (
                              <p className="text-slate-500 italic">
                                {clip.isTranscribing
                                  ? 'Transcribing spoken audio with Whisper Large v3 Turbo via Groq API...'
                                  : 'Transcription pending.'}
                              </p>
                            )}
                          </div>
                        </div>
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
                  Candidate has not yet completed the autonomous 5-question dual-stream AI technical interview.
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
