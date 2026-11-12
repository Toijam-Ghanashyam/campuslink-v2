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
          <Card className="lg:col-span-7 aspect-video bg-black rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-800 p-0 shadow-xl">
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] ${hasPermission ? 'opacity-100' : 'opacity-0'}`}
            />
            {!hasPermission && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-slate-950/90">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                  <Camera className="w-6 h-6 text-indigo-400" />
                </div>
                <p className="font-mono text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  CAMERA & MICROPHONE STREAM INACTIVE
                </p>
              </div>
            )}
          </Card>

          <Card className="lg:col-span-5 space-y-5 p-6 bg-slate-900 border border-slate-800 text-slate-100 shadow-xl">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
                STEP 01 OF 03 · HARDWARE DIAGNOSTIC
              </span>
              <h3 className="font-display text-xl font-bold text-white">
                Grant Camera &amp; Microphone Access
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Verify your camera and microphone streams before reviewing the AI interview rules.
              </p>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-200">
                  <Camera className="w-4 h-4 text-indigo-400" /> Video Stream (720p HD)
                </span>
                <Stamp tone={hasPermission ? 'jade' : 'ochre'}>
                  {hasPermission ? 'VERIFIED' : 'PENDING'}
                </Stamp>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-200">
                  <Mic className="w-4 h-4 text-indigo-400" /> Audio Input (Noise-Suppressed)
                </span>
                <Stamp tone={hasPermission ? 'jade' : 'ochre'}>
                  {hasPermission ? 'VERIFIED' : 'PENDING'}
                </Stamp>
              </div>
            </div>

            <div className="pt-2">
              {!hasPermission ? (
                <Button variant="primary" icon={Camera} onClick={requestMediaPermissions} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5">
                  Allow Camera &amp; Microphone
                </Button>
              ) : (
                <Button variant="accent" icon={ArrowRight} onClick={() => setStep('rules')} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5">
                  Proceed to Step 2: Rules &amp; Regulations
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {step === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <Card className="lg:col-span-7 space-y-5 p-6 bg-slate-900 border border-slate-800 text-slate-100 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
                STEP 02 OF 03 · MANDATORY BRIEFING
              </span>
              <h3 className="font-display text-xl font-bold text-white mt-1">
                AI Interview Rules &amp; Dual-Recording Protocol
              </h3>
            </div>

            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <li className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
                <span className="font-mono text-xs font-bold text-indigo-400 mt-0.5 px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/60">01</span>
                <div>
                  <strong className="text-white block font-semibold">10 Technical Questions:</strong>
                  <span className="text-slate-300">Sequential evaluation across DSA, System Design, Core Engineering, and Behavioral scenarios.</span>
                </div>
              </li>
              <li className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
                <span className="font-mono text-xs font-bold text-indigo-400 mt-0.5 px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/60">02</span>
                <div>
                  <strong className="text-white block font-semibold">Full-Session Master Recording:</strong>
                  <span className="text-slate-300">Clicking <em className="text-indigo-300 font-medium">"I'm Ready"</em> starts an unbroken master video recording covering the entire 10-question round, including reading pauses and inter-question gaps.</span>
                </div>
              </li>
              <li className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
                <span className="font-mono text-xs font-bold text-indigo-400 mt-0.5 px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/60">03</span>
                <div>
                  <strong className="text-white block font-semibold">Per-Question Answer Clips:</strong>
                  <span className="text-slate-300">For each question, read the prompt, click <strong className="text-emerald-400 font-semibold">Start Answer</strong> to record your isolated clip, and click <strong className="text-rose-400 font-semibold">End Answer</strong> when finished.</span>
                </div>
              </li>
            </ul>

            <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer select-none text-xs font-medium text-slate-200 hover:border-indigo-600/60 transition-colors">
              <input
                type="checkbox"
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600 bg-slate-900 border-slate-700 cursor-pointer"
              />
              <span className="text-slate-200 font-medium">I understand the dual-recording protocol and am ready to begin.</span>
            </label>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
              <Button
                variant="secondary"
                onClick={() => setStep('permissions')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 px-4"
              >
                Back
              </Button>
              <Button
                variant="primary"
                icon={ShieldCheck}
                disabled={!rulesAccepted}
                onClick={startFullInterviewRound}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                I'm Ready — Start Interview Round
              </Button>
            </div>
          </Card>

          <Card className="lg:col-span-5 p-4 space-y-3 bg-slate-900 border border-slate-800 text-slate-100 shadow-xl">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
              LIVE CAMERA CHECK
            </span>
            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-800">
              <video ref={videoPreviewRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            </div>
            <p className="font-mono text-[11px] text-emerald-400 flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Stream armed for continuous + per-question capture
            </p>
          </Card>
        </div>
      )}

      {step === 'interview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <Card className="lg:col-span-7 p-4 space-y-4 bg-slate-900 border border-slate-800 text-slate-100 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 font-mono text-xs">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-rose-950/50 border border-rose-600/50 text-rose-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>FULL SESSION REC · {formatTime(masterSeconds)}</span>
              </div>

              <div
                className={`flex items-center gap-2 px-2.5 py-1 rounded-md border font-semibold transition-colors ${
                  isAnswering
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : questionDone
                    ? 'bg-slate-950 border-slate-700 text-slate-200'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400'
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

            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800">
              <video ref={videoPreviewRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              {isAnswering && (
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/85 border border-emerald-500/60 font-mono text-[11px] text-emerald-300 flex items-center gap-2 shadow-lg">
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

          <Card className="lg:col-span-5 p-6 space-y-6 flex flex-col justify-between bg-slate-900 border border-slate-800 text-slate-100 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="uppercase tracking-wider text-indigo-400 font-bold">
                  QUESTION {currentQIndex + 1} OF {AI_QUESTIONS.length}
                </span>
                <Stamp tone="ink">{currentQuestion.category}</Stamp>
              </div>

              <h3 className="font-display text-lg sm:text-xl font-medium text-white leading-snug">
                "{currentQuestion.prompt}"
              </h3>

              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-slate-300">
                {!isAnswering && !questionDone && (
                  <p><strong className="text-white">Reading Gap:</strong> Full session video is recording. Click <strong className="text-emerald-400">Start Answer</strong> to begin recording your specific clip for Question {currentQIndex + 1}.</p>
                )}
                {isAnswering && (
                  <p className="text-emerald-400"><strong>Answer Recording Active:</strong> Speak clearly. Click <strong className="text-rose-400">End Answer</strong> as soon as you finish answering Question {currentQIndex + 1}.</p>
                )}
                {questionDone && (
                  <p className="text-slate-200"><strong className="text-emerald-400">Clip Saved:</strong> Question {currentQIndex + 1} clip locked ({formatTime(answerSeconds)}). Proceed when ready.</p>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              {!isAnswering && !questionDone && (
                <Button variant="primary" size="lg" icon={Play} onClick={handleStartQuestionAnswer} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5">
                  Start Answer (Question {currentQIndex + 1})
                </Button>
              )}
              {isAnswering && (
                <Button variant="danger" size="lg" icon={Square} onClick={handleEndQuestionAnswer} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5">
                  End Answer ({formatTime(answerSeconds)})
                </Button>
              )}
              {questionDone && (
                <Button variant="accent" size="lg" icon={ArrowRight} onClick={handleNextOrFinish} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5">
                  {currentQIndex < AI_QUESTIONS.length - 1 ? `Read Question ${currentQIndex + 2} →` : 'Complete & Submit Interview'}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {step === 'completed' && (
        <div className="space-y-6">
          <Card className="p-6 border-emerald-500/40 bg-emerald-950/20 text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <Stamp tone="jade">DUAL RECORDINGS ARCHIVED</Stamp>
              <h3 className="font-display text-xl font-bold text-white pt-1">
                AI Interview Submitted to Placement &amp; Recruiter Portals
              </h3>
              <p className="text-xs text-slate-300">
                Full Unbroken Session: <strong className="font-mono text-white">{formatTime(masterSeconds)}</strong> · Segmented Question Clips: <strong className="font-mono text-white">{questionClips.length} / 10</strong>
              </p>
            </div>
            <Button variant="primary" onClick={handleNavigateOverview} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5">
              View Updated Readiness Score →
            </Button>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-5 p-5 space-y-3 bg-slate-900 border border-slate-800 text-slate-100 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-indigo-400" /> 01 · Full Unbroken Recording
                </span>
                <span className="font-mono text-[11px] text-slate-400">{formatTime(masterSeconds)}</span>
              </div>
              <p className="text-xs text-slate-400">
                Continuous recording across all 10 questions including reading pauses and gaps.
              </p>
              {fullRecordingUrl && (
                <video src={fullRecordingUrl} controls className="w-full aspect-video bg-black rounded-lg border border-slate-800" />
              )}
            </Card>

            <Card className="lg:col-span-7 p-5 space-y-4 bg-slate-900 border border-slate-800 text-slate-100 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-emerald-400" /> 02 · Per-Question Answer Clips ({questionClips.length})
                </span>
                <span className="font-mono text-[11px] text-emerald-400 font-semibold">Start-to-End Isolated</span>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 divide-y divide-slate-800">
                {questionClips.map((clip) => (
                  <div key={clip.questionId} className="pt-3 first:pt-0 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-7 space-y-1">
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="font-bold text-indigo-400">Q{clip.questionNumber}</span>
                        <span className="text-slate-400">· {clip.category}</span>
                        <span className="text-emerald-400 font-semibold">({formatTime(clip.durationSec)})</span>
                      </div>
                      <p className="text-xs text-slate-200 line-clamp-2">{clip.prompt}</p>
                    </div>
                    <div className="sm:col-span-5">
                      <video src={clip.blobUrl} controls className="w-full aspect-video bg-black rounded-lg border border-slate-800" />
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
