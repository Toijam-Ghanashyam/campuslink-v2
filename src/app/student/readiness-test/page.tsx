'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProctoring } from '@/lib/use-proctoring';
import { ProctoredParagraphEditor } from '@/components/readiness/proctored-paragraph-editor';
import {
  MCQQuestion,
  ParagraphQuestion,
  KeystrokeTelemetry,
  AssessmentResult,
} from '@/types/readiness';

const TEST_DURATION_SECONDS = 25 * 60; // 25 Minutes

export default function ReadinessTestPage() {
  const router = useRouter();

  // Test Phase: 'PRE_CHECK' | 'IN_PROGRESS' | 'SUBMITTING' | 'COMPLETED'
  const [phase, setPhase] = useState<'PRE_CHECK' | 'IN_PROGRESS' | 'SUBMITTING' | 'COMPLETED'>('PRE_CHECK');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Assessment Data
  const [assessmentId, setAssessmentId] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [skillsTested, setSkillsTested] = useState<string[]>([]);
  const [studentName, setStudentName] = useState<string>('');
  const [mcqs, setMcqs] = useState<MCQQuestion[]>([]);
  const [paragraphs, setParagraphs] = useState<ParagraphQuestion[]>([]);

  // Answers & Telemetry State
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [paragraphAnswers, setParagraphAnswers] = useState<Record<string, string>>({});
  const [keystrokeTelemetry, setKeystrokeTelemetry] = useState<Record<string, KeystrokeTelemetry>>({});

  // Countdown Timer
  const [timeLeft, setTimeLeft] = useState<number>(TEST_DURATION_SECONDS);

  // Result state
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // Auto-submit ref to avoid stale closures
  const isSubmittingRef = useRef(false);

  // Initialize Proctoring Hook
  const proctoring = useProctoring({
    maxTabSwitches: 3,
    onAutoSubmit: () => {
      if (!isSubmittingRef.current && phase === 'IN_PROGRESS') {
        handleSubmitTest('AUTOMATIC_SUBMISSION_MAX_VIOLATIONS');
      }
    },
  });

  // Start Assessment Flow
  const handleStartTest = async () => {
    setErrorMsg('');
    setLoadingQuestions(true);

    try {
      // 1. Request camera & mic permissions
      const granted = await proctoring.requestMediaPermissions();
      if (!granted) {
        setErrorMsg('Camera and Microphone access are required to begin the proctored assessment.');
        setLoadingQuestions(false);
        return;
      }

      // 2. Fetch questions from API
      const res = await fetch('/api/readiness/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate assessment questions');
      }

      setAssessmentId(data.assessmentId);
      if (data.sessionToken) setSessionToken(data.sessionToken);
      setSkillsTested(data.skillsTested || []);
      setStudentName(data.studentName || 'Student');
      setMcqs(data.mcqs || []);
      setParagraphs(data.paragraphs || []);

      // 3. Enter Fullscreen
      await proctoring.enterFullscreen();

      // 4. Begin Test Phase
      setPhase('IN_PROGRESS');
      setTimeLeft(TEST_DURATION_SECONDS);

      // Take initial baseline snapshot after 5 seconds
      setTimeout(() => {
        proctoring.captureSnapshot();
      }, 5000);
    } catch (err: any) {
      console.error('Failed to start readiness test:', err);
      setErrorMsg(err.message || 'An error occurred while launching the test room.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Submit Assessment Flow
  const handleSubmitTest = useCallback(
    async (triggerReason?: string) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setPhase('SUBMITTING');

      try {
        // Capture final snapshot
        proctoring.captureSnapshot();

        const payload = {
          assessmentId,
          sessionToken,
          mcqAnswers,
          paragraphAnswers,
          keystrokeTelemetry,
          proctoringLogs: proctoring.logs,
          snapshots: proctoring.snapshots,
          triggerReason: triggerReason || 'NORMAL_SUBMISSION',
        };

        const res = await fetch('/api/readiness/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Error submitting assessment');
        }

        // Persist latest readiness result to localStorage for immediate client-side availability
        try {
          if (data.result) {
            localStorage.setItem(
              'campuslink_latest_readiness',
              JSON.stringify({
                score: data.result.totalScore,
                integrity: data.result.integrityScore,
                status: data.result.readinessStatus,
                updatedAt: data.result.completedAt,
              })
            );
          }
        } catch (e) {}

        setResult(data.result);
        setPhase('COMPLETED');
      } catch (err: any) {
        console.error('Submission error:', err);
        setErrorMsg(err.message || 'Error grading assessment. Please retry.');
        setPhase('IN_PROGRESS');
        isSubmittingRef.current = false;
      }
    },
    [assessmentId, mcqAnswers, paragraphAnswers, keystrokeTelemetry, proctoring]
  );

  // Timer Tick
  useEffect(() => {
    if (phase !== 'IN_PROGRESS') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest('TIME_EXPIRED');
          return 0;
        }

        // Capture periodic snapshot at midpoint
        if (prev === Math.round(TEST_DURATION_SECONDS / 2)) {
          proctoring.captureSnapshot();
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, handleSubmitTest, proctoring]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredMcqCount = Object.keys(mcqAnswers).length;
  const answeredParagraphCount = Object.values(paragraphAnswers).filter((v) => v.trim().length > 30).length;
  const totalAnswered = answeredMcqCount + answeredParagraphCount;
  const totalQuestions = mcqs.length + paragraphs.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 select-none pb-20">
      {/* ================= STRIKE / VIOLATION WARNING MODAL ================= */}
      {proctoring.violationAlert.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border-2 border-rose-500 bg-gradient-to-b from-rose-950 via-slate-950 to-slate-950 p-6 text-center shadow-2xl space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-600/30 text-rose-400 border border-rose-500 text-2xl font-bold">
              ⚠️
            </div>
            <div>
              <h3 className="text-lg font-bold text-rose-200">
                Proctoring Violation: Strike {proctoring.violationAlert.strike} / 3
              </h3>
              <p className="mt-2 text-xs text-rose-300/90 leading-relaxed">
                {proctoring.violationAlert.message}
              </p>
            </div>
            <div className="rounded-lg bg-rose-950/60 border border-rose-800/40 p-3 text-[11px] text-slate-300 text-left space-y-1">
              <p>• Tab-switching and leaving fullscreen are strictly prohibited.</p>
              <p>• Audio speech and absence from camera view are recorded.</p>
              <p className="font-bold text-rose-400">• Strike 3 will trigger IMMEDIATE automatic submission.</p>
            </div>
            <Button
              onClick={async () => {
                await proctoring.enterFullscreen();
                proctoring.dismissViolationAlert();
              }}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 text-xs shadow-lg"
            >
              I Understand — Return to Assessment
            </Button>
          </div>
        </div>
      )}

      {/* ================= FLOATING PIP PROCTORING VIDEO PREVIEW ================= */}
      {phase === 'IN_PROGRESS' && (
        <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-1.5 animate-in slide-in-from-bottom-2">
          <div className="relative overflow-hidden rounded-xl border-2 border-indigo-500/70 bg-slate-900 shadow-2xl w-44 sm:w-52 aspect-video">
            <video
              ref={proctoring.videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover transform -scale-x-100"
            />

            {/* Live Camera Face Status Pill */}
            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] backdrop-blur-sm border border-slate-700">
              <span
                className={`h-2 w-2 rounded-full ${
                  proctoring.faceStatus === 'NORMAL'
                    ? 'bg-emerald-400 animate-pulse'
                    : proctoring.faceStatus === 'LOOKING_AWAY'
                    ? 'bg-amber-400'
                    : 'bg-rose-500 animate-ping'
                }`}
              />
              <span className="font-semibold text-slate-200">
                {proctoring.faceStatus === 'NORMAL'
                  ? 'Face Verified'
                  : proctoring.faceStatus === 'LOOKING_AWAY'
                  ? 'Face Turned'
                  : proctoring.faceStatus === 'MULTIPLE_FACES'
                  ? '2+ Faces Detected!'
                  : 'No Face!'}
              </span>
            </div>

            {/* Audio Indicator */}
            <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center gap-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[9px] backdrop-blur-sm border border-slate-700">
              <span className="text-[10px]">🎙️</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-150 ${
                    proctoring.micVolume > 50 ? 'bg-rose-500' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, proctoring.micVolume * 1.5)}%` }}
                />
              </div>
              <span className="text-[8px] text-slate-400">{proctoring.micVolume}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= PHASE 1: PRE-CHECK & LAUNCH SCREEN ================= */}
      {phase === 'PRE_CHECK' && (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-3xl">
                🛡️
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-white">
                Proctored Student Readiness Assessment
              </CardTitle>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                CampusLink AI Diagnostic Engine • Dynamic Multi-Skill Evaluation &amp; Anti-Cheat Proctoring
              </p>
            </CardHeader>

            <CardContent className="space-y-5 pt-3">
              {/* Structure Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 text-center">
                  <span className="text-lg font-bold text-indigo-400">8 Questions</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Technical MCQs (80 Pts)</p>
                </div>
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 text-center">
                  <span className="text-lg font-bold text-indigo-400">2 Scenarios</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Architecture &amp; Debugging (20 Pts)</p>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-center">
                  <span className="text-lg font-bold text-emerald-400">25 Minutes</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Timed Countdown Exam</p>
                </div>
              </div>

              {/* Proctoring Rules Checklist */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <span>🔒 Proctored Environment Rules</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">1.</span>
                    <span><strong>Fullscreen Mandatory:</strong> Exiting fullscreen or switching browser tabs records a violation strike. <strong>3 strikes triggers automatic submission.</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">2.</span>
                    <span><strong>Webcam Face Verification:</strong> Keep your face centered in the camera. Absence (&gt;3s), multiple people, or turning away will deduct integrity points.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">3.</span>
                    <span><strong>Microphone Acoustic Monitor:</strong> Audio levels are monitored for external assistance or prompting.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">4.</span>
                    <span><strong>Anti-Copy/Paste &amp; Telemetry:</strong> Clipboard pasting is blocked on scenario questions. Keystroke telemetry tracks writing cadence to ensure authentic responses.</span>
                  </li>
                </ul>
              </div>

              {/* Webcam Preview Test Box */}
              <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="relative w-36 h-28 shrink-0 overflow-hidden rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <video
                    ref={proctoring.videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover transform -scale-x-100"
                  />
                  {!proctoring.hasPermissions && (
                    <span className="text-[11px] text-slate-500 text-center px-2">Webcam Preview</span>
                  )}
                </div>
                <div className="space-y-1.5 text-xs text-slate-300 flex-1">
                  <p className="font-semibold text-slate-200">Hardware Readiness Check:</p>
                  <p className="text-[11px] text-slate-400">
                    Clicking the button below will prompt your browser to allow camera and microphone access.
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[11px]">
                    <span className={proctoring.hasPermissions ? 'text-emerald-400' : 'text-amber-400'}>
                      {proctoring.hasPermissions ? '✓ Camera & Mic Connected' : '⏳ Awaiting Permission'}
                    </span>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/student')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ← Return to Dashboard
                </Button>
                <Button
                  disabled={loadingQuestions}
                  onClick={handleStartTest}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  {loadingQuestions ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Generating Custom Questions...</span>
                    </>
                  ) : (
                    <span>Enter Fullscreen &amp; Begin Exam →</span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================= PHASE 2: IN-PROGRESS ASSESSMENT ================= */}
      {phase === 'IN_PROGRESS' && (
        <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
          {/* Sticky Header Bar */}
          <header className="sticky top-4 z-30 rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-md p-4 shadow-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm">
                🛡️
              </span>
              <div>
                <h2 className="text-sm font-bold text-white leading-tight">
                  Student Readiness Assessment
                </h2>
                <p className="text-[11px] text-slate-400">
                  Candidate: <span className="font-semibold text-indigo-300">{studentName}</span> • {totalAnswered}/{totalQuestions} Completed
                </p>
              </div>
            </div>

            {/* Live Proctoring Indicators */}
            <div className="flex items-center gap-2.5">
              {/* Fullscreen Pill */}
              <Badge className="bg-indigo-950/80 text-indigo-300 border border-indigo-800/40 text-[10px]">
                {proctoring.isFullscreen ? '✓ Fullscreen Locked' : '⚠️ Fullscreen Required'}
              </Badge>

              {/* Strikes Pill */}
              <Badge
                className={`text-[10px] ${
                  proctoring.tabSwitchCount === 0
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                    : 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                }`}
              >
                Strikes: {proctoring.tabSwitchCount} / 3
              </Badge>

              {/* Countdown Timer */}
              <div
                className={`rounded-lg px-3 py-1 font-mono text-sm font-bold border ${
                  timeLeft < 180
                    ? 'border-rose-600 bg-rose-950 text-rose-300 animate-pulse'
                    : 'border-slate-700 bg-slate-950 text-indigo-300'
                }`}
              >
                ⏱️ {formatTime(timeLeft)}
              </div>

              {/* Submit CTA */}
              <Button
                size="sm"
                onClick={() => handleSubmitTest()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Submit Exam
              </Button>
            </div>
          </header>

          {/* Tested Skills Tags Banner */}
          {skillsTested.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-900/50 p-3 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Skills Assessed:</span>
              {skillsTested.map((s, idx) => (
                <span
                  key={idx}
                  className="rounded bg-indigo-950/60 px-2 py-0.5 text-[11px] text-indigo-300 border border-indigo-800/30"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* SECTION 1: 8 TECHNICAL MCQs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <span>Part 1: Technical Multiple Choice Questions (80 Pts)</span>
              </h3>
              <span className="text-xs text-slate-400">
                {answeredMcqCount} of {mcqs.length} answered
              </span>
            </div>

            {mcqs.map((mcq, idx) => {
              const selectedChoice = mcqAnswers[mcq.id];

              return (
                <Card
                  key={mcq.id}
                  className="border-slate-800 bg-slate-900/80 text-slate-100 shadow-md transition-all hover:border-slate-700"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-400">Question {idx + 1} of {mcqs.length}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {mcq.skill}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                          10 Pts
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-sm font-semibold text-slate-100 leading-snug mt-1">
                      {mcq.question}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-2 pt-0">
                    {mcq.options.map((option, optIdx) => {
                      const isSelected = selectedChoice === optIdx;

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => {
                            setMcqAnswers((prev) => ({ ...prev, [mcq.id]: optIdx }));
                          }}
                          className={`w-full text-left rounded-lg p-3 text-xs transition-all flex items-start gap-3 border ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-950/40 text-white font-medium shadow-sm'
                              : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold border ${
                              isSelected
                                ? 'border-indigo-400 bg-indigo-600 text-white'
                                : 'border-slate-700 bg-slate-900 text-slate-400'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="leading-relaxed pt-0.5">{option}</span>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* SECTION 2: 2 SCENARIO ARCHITECTURAL PARAGRAPHS */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <span>Part 2: Scenario &amp; Architectural Deep-Dive (20 Pts)</span>
              </h3>
              <span className="text-xs text-slate-400">
                {answeredParagraphCount} of {paragraphs.length} completed
              </span>
            </div>

            {paragraphs.map((para) => (
              <ProctoredParagraphEditor
                key={para.id}
                questionId={para.id}
                question={para.question}
                scenarioContext={para.scenarioContext}
                skill={para.skill}
                value={paragraphAnswers[para.id] || ''}
                onChange={(nextVal, telemetry) => {
                  setParagraphAnswers((prev) => ({ ...prev, [para.id]: nextVal }));
                  setKeystrokeTelemetry((prev) => ({ ...prev, [para.id]: telemetry }));
                }}
                onViolationLog={(type, msg) => {
                  proctoring.addLog(type, 'HIGH', msg);
                }}
              />
            ))}
          </div>

          {/* Bottom Submit Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Ready to Finalize Your Assessment?</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Ensure all 8 MCQs and 2 scenario questions have been answered. Submitting will compute your technical readiness &amp; proctoring integrity scores.
              </p>
            </div>
            <Button
              onClick={() => handleSubmitTest()}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-2.5 text-xs shadow-lg"
            >
              Submit &amp; View Readiness Score
            </Button>
          </div>
        </div>
      )}

      {/* ================= PHASE 3: SUBMITTING LOADER ================= */}
      {phase === 'SUBMITTING' && (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-center p-8 space-y-4">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <h3 className="text-lg font-bold text-white">Grading Assessment with Gemini AI</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Analyzing MCQ responses, grading architectural paragraph depth, evaluating keystroke telemetry, and calculating final proctoring integrity score...
            </p>
          </Card>
        </div>
      )}

      {/* ================= PHASE 4: COMPLETED SCORECARD ================= */}
      {phase === 'COMPLETED' && result && (
        <div className="max-w-4xl mx-auto px-4 pt-10 space-y-6">
          {/* Main Scorecard Header */}
          <Card className="border-indigo-500/40 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 text-slate-100 shadow-2xl p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-6 text-center sm:text-left">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Student Readiness Diagnostic Scorecard
                </span>
                <h2 className="text-2xl font-bold text-white">{studentName}</h2>
                <p className="text-xs text-slate-400">
                  Completed at {new Date(result.completedAt).toLocaleString()} • Official Assessment ID: {result.assessmentId.slice(0, 8)}
                </p>
              </div>

              {/* Status Pill */}
              <div className="flex flex-col items-center sm:items-end gap-1.5">
                <Badge
                  className={`text-xs px-3 py-1 font-bold ${
                    result.readinessStatus === 'HIGHLY_READY'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                      : result.readinessStatus === 'INTERVIEW_READY'
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}
                >
                  {result.readinessStatus === 'HIGHLY_READY'
                    ? '🌟 HIGHLY INTERVIEW READY'
                    : result.readinessStatus === 'INTERVIEW_READY'
                    ? '🎯 INTERVIEW READY'
                    : '⏳ NEEDS REMEDIATION'}
                </Badge>
                <span className="text-[11px] text-slate-400">Recorded on Student Profile</span>
              </div>
            </div>

            {/* Score Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-6">
              <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/30 p-4 text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase">Readiness Score</span>
                <div className="text-3xl font-black text-white mt-1">
                  {result.totalScore} <span className="text-base font-normal text-slate-400">/ 100</span>
                </div>
                <span className="text-[10px] text-indigo-300 mt-1 block">MCQ + Paragraph</span>
              </div>

              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase">Integrity Score</span>
                <div className={`text-3xl font-black mt-1 ${result.integrityScore >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.integrityScore}%
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Anti-Cheat Proctoring</span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase">MCQ Breakdown</span>
                <div className="text-2xl font-bold text-slate-200 mt-1">
                  {result.mcqScore} <span className="text-sm font-normal text-slate-500">/ 80 Pts</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {result.mcqReview.filter((m) => m.isCorrect).length} of 8 Correct
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase">Scenario Score</span>
                <div className="text-2xl font-bold text-slate-200 mt-1">
                  {result.paragraphScore} <span className="text-sm font-normal text-slate-500">/ 20 Pts</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">AI Technical Depth</span>
              </div>
            </div>

            {/* AI Summary Banner */}
            {result.summary && (
              <div className="mt-5 rounded-xl border border-indigo-900/50 bg-indigo-950/30 p-4 text-xs text-indigo-200 leading-relaxed">
                <span className="font-bold text-indigo-300 block mb-1">Diagnostic AI Evaluation:</span>
                {result.summary}
              </div>
            )}

            {/* Penalties if any */}
            {result.penalties && result.penalties.length > 0 && (
              <div className="mt-4 rounded-xl border border-rose-800/40 bg-rose-950/30 p-3.5 space-y-1.5 text-xs text-rose-300">
                <span className="font-bold text-rose-200 flex items-center gap-1.5">
                  <span>⚠️</span> Proctoring Deductions:
                </span>
                <ul className="space-y-1 text-[11px] list-disc list-inside">
                  {result.penalties.map((p, idx) => (
                    <li key={idx}>
                      {p.reason} (-{p.penalty}%)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Review: 2 Scenario Paragraph Feedback */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
              Scenario Deep-Dive Feedback &amp; Analysis
            </h3>
            {result.paragraphFeedback.map((fb, idx) => (
              <Card key={fb.questionId} className="border-slate-800 bg-slate-900 p-4 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200">
                    Scenario Question {idx + 1} ({fb.skill})
                  </span>
                  <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    {fb.score} / {fb.maxScore} Pts
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">{fb.feedback}</p>
                {fb.flaggedForSuspicion && (
                  <p className="text-rose-400 font-semibold text-[11px]">
                    ⚠️ Telemetry flagged: High burst insertion or automated typing pattern suspected.
                  </p>
                )}
              </Card>
            ))}
          </div>

          {/* Review: 8 MCQs */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
              Technical MCQ Detailed Review
            </h3>
            {result.mcqReview.map((m, idx) => (
              <Card
                key={m.id}
                className={`border p-4 text-xs space-y-2.5 ${
                  m.isCorrect
                    ? 'border-emerald-800/60 bg-emerald-950/20'
                    : 'border-rose-800/60 bg-rose-950/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">
                    Question {idx + 1}: {m.isCorrect ? '✓ Correct (+10 Pts)' : '✕ Incorrect (0 Pts)'}
                  </span>
                  <span className="text-[10px] text-slate-400">{m.skill}</span>
                </div>
                <p className="font-medium text-slate-100">{m.question}</p>
                <div className="space-y-1">
                  {m.options.map((opt, optIdx) => {
                    const isSelected = m.selectedOption === optIdx;
                    const isCorrect = m.correctOption === optIdx;

                    let bg = 'bg-slate-900 border-slate-800 text-slate-400';
                    if (isCorrect) bg = 'bg-emerald-950 border-emerald-600 text-emerald-200 font-medium';
                    else if (isSelected && !isCorrect) bg = 'bg-rose-950 border-rose-600 text-rose-200';

                    return (
                      <div
                        key={optIdx}
                        className={`rounded p-2 border flex items-center justify-between text-[11px] ${bg}`}
                      >
                        <span>
                          {String.fromCharCode(65 + optIdx)}. {opt}
                        </span>
                        {isCorrect && <span className="text-emerald-400 font-bold text-[10px]">✓ Correct Answer</span>}
                        {isSelected && !isCorrect && <span className="text-rose-400 font-bold text-[10px]">Your Choice</span>}
                      </div>
                    );
                  })}
                </div>
                {m.explanation && (
                  <p className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800">
                    <strong className="text-slate-300">Explanation:</strong> {m.explanation}
                  </p>
                )}
              </Card>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-6">
            <Button
              onClick={() => {
                window.location.href = '/student';
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2 text-xs"
            >
              Return to Student Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setPhase('PRE_CHECK');
                setMcqAnswers({});
                setParagraphAnswers({});
                setKeystrokeTelemetry({});
                isSubmittingRef.current = false;
              }}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
            >
              Retake Readiness Assessment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

