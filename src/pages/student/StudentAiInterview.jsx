'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Mic,
  ShieldCheck,
  Play,
  Square,
  CheckCircle2,
  Video,
  ArrowRight,
  Radio,
  Film,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Stamp } from '../../components/ui/Stamp';
import { useToast } from '../../components/ui/toast';
import { PageTransition } from '../../components/ui/PageTransition';

const AI_QUESTIONS = [
  { id: 1, category: 'Introduction', prompt: 'Walk us through your technical background and the most complex system you have built at BPUT.' },
  { id: 2, category: 'Data Structures', prompt: 'How would you design an LRU Cache with O(1) read and write operations? Explain the underlying data structures.' },
  { id: 3, category: 'Frontend Architecture', prompt: 'Explain how React reconciliation and virtual DOM diffing optimize rendering performance in data-heavy dashboards.' },
  { id: 4, category: 'Database Systems', prompt: 'When would you choose PostgreSQL composite indexing over a hash index, and how do you diagnose a slow query?' },
  { id: 5, category: 'System Design', prompt: 'Design a real-time conflict-free interview slot booking service handling 1,500 concurrent student requests.' },
  { id: 6, category: 'API Security', prompt: 'Compare stateless JWT authentication with session-based cookies. How do you mitigate token replay attacks?' },
  { id: 7, category: 'Concurrency', prompt: 'How does the Node.js event loop handle CPU-bound tasks vs. asynchronous I/O operations?' },
  { id: 8, category: 'Cloud & DevOps', prompt: 'Describe your strategy for zero-downtime deployment using Docker containers and CI/CD pipelines.' },
  { id: 9, category: 'Debugging Scenario', prompt: 'A production microservice is experiencing gradual memory leaks every 6 hours. How do you isolate and fix it?' },
  { id: 10, category: 'Behavioral & Ownership', prompt: 'Tell us about a time a hackathon or production deadline was at risk. How did you prioritize and deliver?' },
];

export function StudentAiInterview() {
  let navigate;
  try {
    navigate = useNavigate();
  } catch {
    navigate = (path) => {
      if (typeof window !== 'undefined') window.location.href = path;
    };
  }

  const { toast } = useToast();
  const { currentStudent = {}, saveAiInterviewResult } = useStore();

  const [step, setStep] = useState('permissions'); // 'permissions' | 'rules' | 'interview' | 'completed'
  const [hasPermission, setHasPermission] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);
  const [questionDone, setQuestionDone] = useState(false);

  const [masterSeconds, setMasterSeconds] = useState(0);
  const [answerSeconds, setAnswerSeconds] = useState(0);

  const [fullRecordingUrl, setFullRecordingUrl] = useState(null);
  const [questionClips, setQuestionClips] = useState([]);

  const videoPreviewRef = useRef(null);
  const streamRef = useRef(null);
  const masterRecorderRef = useRef(null);
  const masterChunksRef = useRef([]);
  const questionRecorderRef = useRef(null);
  const questionChunksRef = useRef([]);
  const questionClipsRef = useRef([]);
  const answerStartTimestampRef = useRef(0);
  const answerDurationRef = useRef(0);

  useEffect(() => {
    if (videoPreviewRef.current && streamRef.current) {
      videoPreviewRef.current.srcObject = streamRef.current;
    }
  }, [step]);

  useEffect(() => {
    if (step !== 'interview') return;
    const timer = setInterval(() => setMasterSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (!isAnswering) return;
    const timer = setInterval(() => {
      setAnswerSeconds((s) => {
        answerDurationRef.current = s + 1;
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isAnswering]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const getSupportedMimeType = () => {
    const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
    return types.find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) || '';
  };

  const requestMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      setHasPermission(true);
      toast('Camera and Microphone verified.', 'jade');
    } catch {
      toast('Please allow camera and microphone access to proceed.', 'brick');
    }
  };

  const startFullInterviewRound = () => {
    if (!streamRef.current) return;
    const mimeType = getSupportedMimeType();
    const masterRecorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);

    masterChunksRef.current = [];
    masterRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) masterChunksRef.current.push(e.data);
    };

    masterRecorderRef.current = masterRecorder;
    masterRecorder.start(1000);
    setStep('interview');
    toast('Full session recording started. Click Start Answer when ready for Q1.', 'ink');
  };

  const handleStartQuestionAnswer = () => {
    if (!streamRef.current || isAnswering) return;
    const mimeType = getSupportedMimeType();
    const qRecorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);

    questionChunksRef.current = [];
    answerStartTimestampRef.current = masterSeconds;
    answerDurationRef.current = 0;
    setAnswerSeconds(0);

    qRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) questionChunksRef.current.push(e.data);
    };

    qRecorder.onstop = () => {
      const blob = new Blob(questionChunksRef.current, { type: mimeType || 'video/webm' });
      const clipUrl = URL.createObjectURL(blob);
      const qObj = AI_QUESTIONS[currentQIndex];

      const newClip = {
        questionNumber: currentQIndex + 1,
        questionId: qObj.id,
        category: qObj.category,
        prompt: qObj.prompt,
        blobUrl: clipUrl,
        durationSec: Math.max(1, answerDurationRef.current),
        startedAtSessionSec: answerStartTimestampRef.current,
      };

      questionClipsRef.current = [...questionClipsRef.current, newClip];
      setQuestionClips(questionClipsRef.current);
    };

    questionRecorderRef.current = qRecorder;
    qRecorder.start(500);
    setIsAnswering(true);
    setQuestionDone(false);
  };

  const handleEndQuestionAnswer = () => {
    if (!questionRecorderRef.current || !isAnswering) return;
    questionRecorderRef.current.stop();
    setIsAnswering(false);
    setQuestionDone(true);
    toast(`Answer clip for Question ${currentQIndex + 1} saved.`, 'jade');
  };

  const handleNextOrFinish = () => {
    if (currentQIndex < AI_QUESTIONS.length - 1) {
      setCurrentQIndex((i) => i + 1);
      setQuestionDone(false);
      setAnswerSeconds(0);
    } else if (masterRecorderRef.current && masterRecorderRef.current.state !== 'inactive') {
      masterRecorderRef.current.onstop = () => {
        const mimeType = getSupportedMimeType();
        const fullBlob = new Blob(masterChunksRef.current, { type: mimeType || 'video/webm' });
        const fullUrl = URL.createObjectURL(fullBlob);
        setFullRecordingUrl(fullUrl);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        saveAiInterviewResult?.({
          studentId: currentStudent.id,
          fullSessionVideoUrl: fullUrl,
          totalDurationSec: masterSeconds,
          questionClips: questionClipsRef.current,
          completedAt: new Date().toISOString(),
        });

        setStep('completed');
        toast('AI Interview submitted! Full recording + 10 answer clips archived.', 'jade');
      };
      masterRecorderRef.current.stop();
    }
  };

  const handleNavigateOverview = () => {
    try {
      navigate('/student/overview');
    } catch {
      if (typeof window !== 'undefined') window.location.href = '/student';
    }
  };

  const currentQuestion = AI_QUESTIONS[currentQIndex];

  return (
    <PageTransition className="space-y-6">
      <Masthead
        context="06 · AUTONOMOUS AI VIDEO ASSESSMENT"
        lede="Dual-stream proctored evaluation: continuous session recording plus isolated question-by-question answer capture."
        title="Live AI Technical Interview."
      />

      {step === 'permissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <Card className="lg:col-span-7 aspect-video bg-black rounded-xl overflow-hidden relative flex items-center justify-center border border-line p-0">
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] ${hasPermission ? 'opacity-100' : 'opacity-0'}`}
            />
            {!hasPermission && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-surface border border-line flex items-center justify-center text-fg-soft">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="font-mono text-xs uppercase tracking-wider text-fg-soft">
                  CAMERA & MICROPHONE STREAM INACTIVE
                </p>
              </div>
            )}
          </Card>

          <Card className="lg:col-span-5 space-y-5 p-6">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent-deep font-semibold">
                STEP 01 OF 03 · HARDWARE DIAGNOSTIC
              </span>
              <h3 className="font-display text-xl font-semibold text-fg">
                Grant Camera & Microphone Access
              </h3>
              <p className="text-xs text-fg-soft leading-relaxed">
                Verify your camera and microphone streams before reviewing the AI interview rules.
              </p>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 rounded-lg border border-line bg-surface/50 flex items-center justify-between">
                <span className="flex items-center gap-2 text-fg">
                  <Camera className="w-4 h-4 text-indigo-400" /> Video Stream (720p HD)
                </span>
                <Stamp tone={hasPermission ? 'jade' : 'ochre'}>
                  {hasPermission ? 'VERIFIED' : 'PENDING'}
                </Stamp>
              </div>
              <div className="p-3 rounded-lg border border-line bg-surface/50 flex items-center justify-between">
                <span className="flex items-center gap-2 text-fg">
                  <Mic className="w-4 h-4 text-indigo-400" /> Audio Input (Noise-Suppressed)
                </span>
                <Stamp tone={hasPermission ? 'jade' : 'ochre'}>
                  {hasPermission ? 'VERIFIED' : 'PENDING'}
                </Stamp>
              </div>
            </div>

            <div className="pt-2">
              {!hasPermission ? (
                <Button variant="primary" icon={Camera} onClick={requestMediaPermissions} className="w-full">
                  Allow Camera & Microphone
                </Button>
              ) : (
                <Button variant="accent" icon={ArrowRight} onClick={() => setStep('rules')} className="w-full">
                  Proceed to Step 2: Rules & Regulations
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {step === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <Card className="lg:col-span-7 space-y-5 p-6">
            <div className="border-b border-line pb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent-deep font-semibold">
                STEP 02 OF 03 · MANDATORY BRIEFING
              </span>
              <h3 className="font-display text-xl font-semibold text-fg mt-0.5">
                AI Interview Rules & Dual-Recording Protocol
              </h3>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-fg leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-xs font-bold text-indigo-400 mt-0.5">01.</span>
                <span><strong>10 Technical Questions:</strong> Sequential questions across DSA, System Design, Core Engineering, and Behavioral skills.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-xs font-bold text-indigo-400 mt-0.5">02.</span>
                <span><strong>Full-Session Recording:</strong> Clicking <em>"I'm Ready"</em> starts an unbroken master video recording covering the entire 10-question session, including pauses and reading gaps.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-xs font-bold text-indigo-400 mt-0.5">03.</span>
                <span><strong>Per-Question Answer Recording:</strong> For each question, read the prompt, click <strong>Start Answer</strong> to record your response clip, and click <strong>End Answer</strong> when finished.</span>
              </li>
            </ul>

            <label className="flex items-center gap-2.5 pt-2 cursor-pointer select-none text-xs font-medium text-fg">
              <input
                type="checkbox"
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600"
              />
              <span>I understand the dual-recording protocol and am ready to begin.</span>
            </label>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-line">
              <Button variant="secondary" onClick={() => setStep('permissions')}>Back</Button>
              <Button variant="primary" icon={ShieldCheck} disabled={!rulesAccepted} onClick={startFullInterviewRound}>
                I'm Ready — Start Interview Round
              </Button>
            </div>
          </Card>

          <Card className="lg:col-span-5 p-4 space-y-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-fg-soft block">LIVE CAMERA CHECK</span>
            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-line">
              <video ref={videoPreviewRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            </div>
            <p className="font-mono text-[11px] text-jade flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Stream armed for continuous + per-question capture
            </p>
          </Card>
        </div>
      )}

      {step === 'interview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <Card className="lg:col-span-7 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 font-mono text-xs">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-rose-950/40 border border-rose-600/40 text-rose-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>FULL SESSION REC · {formatTime(masterSeconds)}</span>
              </div>

              <div
                className={`flex items-center gap-2 px-2.5 py-1 rounded-md border font-semibold transition-colors ${
                  isAnswering
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400'
                    : questionDone
                    ? 'bg-surface border-line text-fg'
                    : 'bg-surface/40 border-line text-fg-soft'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 text-emerald-400 ${isAnswering ? 'animate-spin' : ''}`} />
                <span>
                  {isAnswering
                    ? `Q${currentQIndex + 1} ANSWER REC · ${formatTime(answerSeconds)}`
                    : questionDone
                    ? `Q${currentQIndex + 1} CLIP SAVED (${formatTime(answerSeconds)})`
                    : `Q${currentQIndex + 1} STANDBY (GAP)`}
                </span>
              </div>
            </div>

            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-line">
              <video ref={videoPreviewRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              {isAnswering && (
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/75 border border-emerald-500/50 font-mono text-[11px] text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Recording isolated clip for Question {currentQIndex + 1}...
                </div>
              )}
            </div>

            <div className="grid grid-cols-10 gap-1.5 pt-1">
              {AI_QUESTIONS.map((q, idx) => (
                <div
                  key={q.id}
                  className={`h-1.5 rounded-full transition-colors ${
                    idx < currentQIndex || (idx === currentQIndex && questionDone)
                      ? 'bg-emerald-500'
                      : idx === currentQIndex
                      ? 'bg-indigo-500'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-5 p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="uppercase tracking-wider text-accent-deep font-bold">
                  QUESTION {currentQIndex + 1} OF {AI_QUESTIONS.length}
                </span>
                <Stamp tone="ink">{currentQuestion.category}</Stamp>
              </div>

              <h3 className="font-display text-lg sm:text-xl font-medium text-fg leading-snug">
                "{currentQuestion.prompt}"
              </h3>

              <div className="p-3.5 rounded-lg bg-slate-900/60 border border-line font-mono text-[11px] text-fg-soft">
                {!isAnswering && !questionDone && (
                  <p><strong className="text-fg">Reading Gap:</strong> Full session video is recording. Click <strong>Start Answer</strong> to begin recording your specific clip for Question {currentQIndex + 1}.</p>
                )}
                {isAnswering && (
                  <p className="text-emerald-400"><strong>Answer Recording Active:</strong> Speak clearly. Click <strong>End Answer</strong> as soon as you finish answering Question {currentQIndex + 1}.</p>
                )}
                {questionDone && (
                  <p className="text-fg"><strong>Clip Saved:</strong> Question {currentQIndex + 1} clip locked ({formatTime(answerSeconds)}). Proceed when ready.</p>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-line">
              {!isAnswering && !questionDone && (
                <Button variant="primary" size="lg" icon={Play} onClick={handleStartQuestionAnswer} className="w-full">
                  Start Answer (Question {currentQIndex + 1})
                </Button>
              )}
              {isAnswering && (
                <Button variant="danger" size="lg" icon={Square} onClick={handleEndQuestionAnswer} className="w-full">
                  End Answer ({formatTime(answerSeconds)})
                </Button>
              )}
              {questionDone && (
                <Button variant="accent" size="lg" icon={ArrowRight} onClick={handleNextOrFinish} className="w-full">
                  {currentQIndex < AI_QUESTIONS.length - 1 ? `Read Question ${currentQIndex + 2} →` : 'Complete & Submit Interview'}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {step === 'completed' && (
        <div className="space-y-6">
          <Card className="p-6 border-emerald-500/40 bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Stamp tone="jade">DUAL RECORDINGS ARCHIVED</Stamp>
              <h3 className="font-display text-xl font-semibold text-fg pt-1">
                AI Interview Submitted to Placement & Recruiter Portals
              </h3>
              <p className="text-xs text-fg-soft">
                Full Unbroken Session: <strong className="font-mono text-fg">{formatTime(masterSeconds)}</strong> · Segmented Question Clips: <strong className="font-mono text-fg">{questionClips.length} / 10</strong>
              </p>
            </div>
            <Button variant="primary" onClick={handleNavigateOverview}>
              View Updated Readiness Score →
            </Button>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-5 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-fg flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-indigo-400" /> 01 · Full Unbroken Recording
                </span>
                <span className="font-mono text-[11px] text-fg-soft">{formatTime(masterSeconds)}</span>
              </div>
              <p className="text-xs text-fg-soft">
                Continuous recording across all 10 questions including reading pauses and gaps.
              </p>
              {fullRecordingUrl && (
                <video src={fullRecordingUrl} controls className="w-full aspect-video bg-black rounded-lg border border-line" />
              )}
            </Card>

            <Card className="lg:col-span-7 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-fg flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-emerald-400" /> 02 · Per-Question Answer Clips ({questionClips.length})
                </span>
                <span className="font-mono text-[11px] text-emerald-400 font-semibold">Start-to-End Isolated</span>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 divide-y divide-line">
                {questionClips.map((clip) => (
                  <div key={clip.questionId} className="pt-3 first:pt-0 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-7 space-y-1">
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="font-bold text-accent-deep">Q{clip.questionNumber}</span>
                        <span className="text-fg-soft">· {clip.category}</span>
                        <span className="text-emerald-400 font-semibold">({formatTime(clip.durationSec)})</span>
                      </div>
                      <p className="text-xs text-fg line-clamp-2">{clip.prompt}</p>
                    </div>
                    <div className="sm:col-span-5">
                      <video src={clip.blobUrl} controls className="w-full aspect-video bg-black rounded-lg border border-line" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

export default StudentAiInterview;
