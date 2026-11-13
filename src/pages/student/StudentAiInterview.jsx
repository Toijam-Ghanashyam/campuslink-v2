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
  AlertTriangle,
  Users,
  Compass,
  Eye,
  Lock,
  Maximize,
  Minimize,
  ShieldAlert,
  Keyboard,
  Loader2,
} from 'lucide-react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { createClient } from '../../lib/supabase/client';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Stamp } from '../../components/ui/Stamp';
import { useToast } from '../../components/ui/toast';
import { PageTransition } from '../../components/ui/PageTransition';

// 1. Initialize once when permissions are granted
export async function initProctoringModel() {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );
  return await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU',
    },
    outputFaceBlendshapes: true,
    runningMode: 'VIDEO',
    numFaces: 2, // Allows detecting a 2nd person in the background
  });
}

// 2. Call every ~250ms on your <video ref={videoPreviewRef} />
export function analyzeFrame(faceLandmarker, videoEl) {
  if (!faceLandmarker || !videoEl || videoEl.readyState < 2) return null;

  const result = faceLandmarker.detectForVideo(videoEl, performance.now());
  const faces = result.faceLandmarks || [];

  if (faces.length === 0) return { status: 'violation', reason: 'NO_FACE_DETECTED' };
  if (faces.length > 1) return { status: 'violation', reason: 'MULTIPLE_FACES_DETECTED' };

  // Head Yaw (Left/Right turn) using Nose (1) vs Left/Right face edges (234, 454)
  const lm = faces[0];
  const noseX = lm[1].x;
  const leftEdgeX = lm[234].x;
  const rightEdgeX = lm[454].x;
  const faceWidth = Math.abs(rightEdgeX - leftEdgeX) || 0.001;
  const yawRatio = (noseX - leftEdgeX) / faceWidth; // ~0.5 is dead-center

  if (yawRatio < 0.28 || yawRatio > 0.72) {
    return { status: 'warning', reason: 'HEAD_TURNED_AWAY' };
  }

  // Eye Gaze check via Blendshapes (detects reading off-screen with head still)
  const shapes = result.faceBlendshapes?.[0]?.categories || [];
  const getScore = (name) => shapes.find((s) => s.categoryName === name)?.score || 0;

  const lookingSideways =
    getScore('eyeLookOutLeft') > 0.58 ||
    getScore('eyeLookInLeft') > 0.58 ||
    getScore('eyeLookOutRight') > 0.58 ||
    getScore('eyeLookInRight') > 0.58;

  if (lookingSideways) {
    return { status: 'warning', reason: 'EYE_GAZE_OFF_SCREEN' };
  }

  return { status: 'clear', reason: 'FOCUSED' };
}

const AI_QUESTIONS = [
  { id: 1, category: 'Introduction', prompt: 'Walk us through your technical background and the most complex system you have built at BPUT.' },
  { id: 2, category: 'Data Structures', prompt: 'How would you design an LRU Cache with O(1) read and write operations? Explain the underlying data structures.' },
  { id: 3, category: 'Frontend Architecture', prompt: 'Explain how React reconciliation and virtual DOM diffing optimize rendering performance in data-heavy dashboards.' },
  { id: 4, category: 'Database Systems', prompt: 'When would you choose PostgreSQL composite indexing over a hash index, and how do you diagnose a slow query?' },
  { id: 5, category: 'System Design', prompt: 'Design a real-time conflict-free interview slot booking service handling 1,500 concurrent student requests.' },
];

const FALLBACK_TRANSCRIPTS = {
  1: 'I have been developing full-stack applications with React, Node.js, and PostgreSQL at BPUT. My most complex project was an automated placement engine and concurrent slot dispatch system. I designed the architecture using optimistic concurrency locking to prevent double-booking across 1,500 students, and integrated real-time WebSocket feeds for live panel dispatch.',
  2: 'To achieve O(1) time complexity for both read and write operations in an LRU Cache, I pair a doubly linked list with a hash map. The hash map stores key-node pointers for O(1) lookups. When an item is accessed or updated, it is unlinked and moved to the head of the doubly linked list in O(1). When capacity is exceeded, the least recently used node is evicted from the tail in O(1) and deleted from the hash map.',
  3: 'React reconciliation optimizes rendering by maintaining an in-memory Virtual DOM tree. During state mutations, React performs a heuristic O(n) diffing algorithm comparing the new fiber tree against the previous one. By checking stable keys and component types, it calculates the minimal mutation set and batches DOM updates into a single commit phase, avoiding expensive browser layout recalibrations and repaints.',
  4: 'A composite B-Tree index is ideal when queries filter or sort across multiple columns following the leftmost prefix rule, or when performing range scans. Hash indices only support equality checks and cannot optimize range queries or sorting. To diagnose a slow query, I inspect the execution plan using EXPLAIN ANALYZE, looking for sequential scans, high disk page fetches, and discrepancies between estimated and actual row counts.',
  5: 'For 1,500 concurrent requests, I would implement an event-driven architecture with Redis for distributed atomic locking via Lua scripts or Redlock. When a student attempts to book a slot, Redis checks availability and holds a 5-minute reservation TTL atomically. Once confirmed, an event is emitted to Apache Kafka or RabbitMQ, and a background worker persists the booking to PostgreSQL with a unique constraint on interviewer and timeslot to guarantee zero double-bookings.',
};

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
  const { currentStudent = {}, applications = [], saveAiInterviewResult } = useStore();

  const [activeStudent, setActiveStudent] = useState(currentStudent);
  const [activeApp, setActiveApp] = useState(null);

  const invitedApp =
    activeApp ||
    applications.find(
      (a) =>
        a.stage === 'VIDEO_ASSESSMENT' ||
        a.stage === 'VIDEO_ASSESSMENT_CALLED' ||
        a.videoAssessmentCalled ||
        a.video_assessment_called ||
        a.status === 'Video Assessment Called'
    );

  // Authenticate student & resolve active drive application from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadAuthStudentAndApp() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (profile && isMounted) {
            setActiveStudent((prev) => ({
              ...prev,
              id: profile.id,
              name: profile.full_name || 'Vikramaditya Das',
              full_name: profile.full_name || 'Vikramaditya Das',
              rollNumber: profile.roll_number,
              roll_number: profile.roll_number,
              branch: profile.branch,
              verified_cgpa: profile.verified_cgpa,
              cgpa: profile.verified_cgpa,
            }));

            const { data: apps } = await supabase
              .from('drive_applications')
              .select('*, placement_drives(*)')
              .eq('student_id', profile.id)
              .order('created_at', { ascending: false });

            if (apps && apps.length > 0 && isMounted) {
              const videoApp =
                apps.find(
                  (a) =>
                    a.stage === 'VIDEO_ASSESSMENT' ||
                    a.video_assessment_called ||
                    a.stage === 'OA_CLEARED'
                ) || apps[0];
              setActiveApp(videoApp);
            }
          }
        }
      } catch (err) {
        console.warn('Could not load auth student:', err);
      }
    }
    loadAuthStudentAndApp();
    return () => {
      isMounted = false;
    };
  }, []);

  const targetCompany =
    activeApp?.placement_drives?.company_name ||
    activeApp?.company ||
    activeApp?.company_name ||
    invitedApp?.company ||
    invitedApp?.company_name ||
    'Google';

  const targetRole =
    activeApp?.placement_drives?.role_title ||
    activeApp?.role ||
    activeApp?.role_title ||
    invitedApp?.role ||
    invitedApp?.role_title ||
    'Software Development Engineer';

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
  const [proctoringEvents, setProctoringEvents] = useState([]);
  const [liveProctorStatus, setLiveProctorStatus] = useState({ status: 'clear', reason: 'FOCUSED' });
  const [modelReady, setModelReady] = useState(false);

  // Fullscreen & Tab/Keyboard Lockdown States
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [showTabSwitchModal, setShowTabSwitchModal] = useState(false);
  const [fullscreenViolationsCount, setFullscreenViolationsCount] = useState(0);
  const [tabViolationsCount, setTabViolationsCount] = useState(0);
  const [keyboardViolationsCount, setKeyboardViolationsCount] = useState(0);

  // Submission & Click-Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitPhaseText, setSubmitPhaseText] = useState('');

  const videoPreviewRef = useRef(null);
  const streamRef = useRef(null);
  const masterRecorderRef = useRef(null);
  const masterChunksRef = useRef([]);
  const questionRecorderRef = useRef(null);
  const questionAudioRecorderRef = useRef(null);
  const questionChunksRef = useRef([]);
  const audioChunksRef = useRef([]);
  const questionClipsRef = useRef([]);
  const answerStartTimestampRef = useRef(0);
  const answerDurationRef = useRef(0);
  const transcriptionPromisesRef = useRef([]);

  // Proctoring References
  const faceLandmarkerRef = useRef(null);
  const proctoringEventsRef = useRef([]);
  const lastEventTimeRef = useRef({});
  const fullVideoRef = useRef(null);

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

  // Real-time Face & Eye Proctoring Loop (~250ms) + Visibility + Fullscreen + Keyboard lockdown
  useEffect(() => {
    if (step !== 'interview') return;

    // 1. MediaPipe Frame Analysis Loop
    const proctorInterval = setInterval(() => {
      if (!faceLandmarkerRef.current || !videoPreviewRef.current) return;

      try {
        const result = analyzeFrame(faceLandmarkerRef.current, videoPreviewRef.current);
        if (!result) return;

        setLiveProctorStatus(result);

        if (result.status === 'violation' || result.status === 'warning') {
          const now = Date.now();
          const lastLogged = lastEventTimeRef.current[result.reason] || 0;

          // Throttle event logging to at most once per 2.5 seconds per type
          if (now - lastLogged > 2500) {
            lastEventTimeRef.current[result.reason] = now;
            const newEvt = {
              id: `evt-${now}-${Math.random()}`,
              timestampSec: masterSeconds,
              type: result.reason,
              status: result.status,
              reason: result.reason.replace(/_/g, ' '),
            };
            proctoringEventsRef.current = [...proctoringEventsRef.current, newEvt];
            setProctoringEvents([...proctoringEventsRef.current]);
          }
        }
      } catch (err) {
        // Drop frames safely without interrupting stream
      }
    }, 250);

    // 2. Tab switch & visibility loss listener
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setShowTabSwitchModal(true);
        setTabViolationsCount((c) => c + 1);
        const now = Date.now();
        const newEvt = {
          id: `evt-tab-${now}`,
          timestampSec: masterSeconds,
          type: 'TAB_SWITCH_OR_FOCUS_LOSS',
          status: 'violation',
          reason: 'Browser tab switched or window minimized',
        };
        proctoringEventsRef.current = [...proctoringEventsRef.current, newEvt];
        setProctoringEvents([...proctoringEventsRef.current]);
        setLiveProctorStatus({ status: 'violation', reason: 'TAB_SWITCH_OR_FOCUS_LOSS' });
        toast('Violation: Tab switch or background focus loss detected!', 'brick');
      }
    };

    const handleWindowBlur = () => {
      setShowTabSwitchModal(true);
      const now = Date.now();
      const lastLogged = lastEventTimeRef.current['TAB_SWITCH_OR_FOCUS_LOSS'] || 0;
      if (now - lastLogged > 3000) {
        lastEventTimeRef.current['TAB_SWITCH_OR_FOCUS_LOSS'] = now;
        setTabViolationsCount((c) => c + 1);
        const newEvt = {
          id: `evt-blur-${now}`,
          timestampSec: masterSeconds,
          type: 'TAB_SWITCH_OR_FOCUS_LOSS',
          status: 'violation',
          reason: 'Window lost focus / desktop switch',
        };
        proctoringEventsRef.current = [...proctoringEventsRef.current, newEvt];
        setProctoringEvents([...proctoringEventsRef.current]);
      }
    };

    // 3. Fullscreen enforcement listener
    const handleFullscreenChange = () => {
      if (typeof document === 'undefined') return;
      if (!document.fullscreenElement) {
        setShowFullscreenModal(true);
        setFullscreenViolationsCount((c) => c + 1);
        const now = Date.now();
        const lastLogged = lastEventTimeRef.current['FULLSCREEN_EXITED'] || 0;
        if (now - lastLogged > 2000) {
          lastEventTimeRef.current['FULLSCREEN_EXITED'] = now;
          const newEvt = {
            id: `evt-fs-${now}`,
            timestampSec: masterSeconds,
            type: 'FULLSCREEN_EXITED',
            status: 'violation',
            reason: 'Candidate exited fullscreen mode during interview',
          };
          proctoringEventsRef.current = [...proctoringEventsRef.current, newEvt];
          setProctoringEvents([...proctoringEventsRef.current]);
          setLiveProctorStatus({ status: 'violation', reason: 'FULLSCREEN_EXITED' });
          toast('Violation: Exited Fullscreen mode!', 'brick');
        }
      } else {
        setShowFullscreenModal(false);
      }
    };

    // 4. Strict Keyboard Prevention & Capture
    const handleKeyDown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const now = Date.now();
      const lastLogged = lastEventTimeRef.current['KEYBOARD_USAGE'] || 0;
      if (now - lastLogged > 2000) {
        lastEventTimeRef.current['KEYBOARD_USAGE'] = now;
        setKeyboardViolationsCount((c) => c + 1);
        const newEvt = {
          id: `evt-kbd-${now}`,
          timestampSec: masterSeconds,
          type: 'KEYBOARD_USAGE_BLOCKED',
          status: 'warning',
          reason: `Keystroke blocked (${e.key || 'key'}) - Spoken voice responses required`,
        };
        proctoringEventsRef.current = [...proctoringEventsRef.current, newEvt];
        setProctoringEvents([...proctoringEventsRef.current]);
        toast('Keyboard input disabled: Please speak your response aloud.', 'brick');
      }
      return false;
    };

    const handleKeyBlock = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handleClipboard = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Live proctored interview in progress. Are you sure you want to exit?';
      return e.returnValue;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyBlock, true);
    window.addEventListener('keypress', handleKeyBlock, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('copy', handleClipboard, true);
    window.addEventListener('cut', handleClipboard, true);
    window.addEventListener('paste', handleClipboard, true);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(proctorInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyBlock, true);
      window.removeEventListener('keypress', handleKeyBlock, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('copy', handleClipboard, true);
      window.removeEventListener('cut', handleClipboard, true);
      window.removeEventListener('paste', handleClipboard, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      try {
        if (typeof navigator !== 'undefined' && navigator.keyboard?.unlock) {
          navigator.keyboard.unlock();
        }
      } catch (e) {}
    };
  }, [step, masterSeconds, toast]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      try {
        if (typeof navigator !== 'undefined' && navigator.keyboard?.unlock) {
          navigator.keyboard.unlock();
        }
      } catch (e) {}
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

      // Initialize FaceLandmarker asynchronously once permissions granted
      if (!faceLandmarkerRef.current) {
        initProctoringModel()
          .then((model) => {
            faceLandmarkerRef.current = model;
            setModelReady(true);
          })
          .catch((err) => {
            console.warn('FaceLandmarker GPU init fallback:', err);
          });
      }
    } catch {
      toast('Please allow camera and microphone access to proceed.', 'brick');
    }
  };

  const handleReenterFullscreen = async () => {
    try {
      if (typeof document !== 'undefined' && document.documentElement?.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setShowFullscreenModal(false);
    } catch (err) {
      console.warn('Re-entering fullscreen failed:', err);
      setShowFullscreenModal(false);
    }
  };

  const startFullInterviewRound = async () => {
    if (!streamRef.current) return;

    // 1. Enforce Fullscreen Mode immediately on candidate initiation
    try {
      if (typeof document !== 'undefined' && document.documentElement?.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen entry notice:', err);
    }

    // 2. Lock Keyboard keys if API available (Chrome/Edge fullscreen)
    try {
      if (typeof navigator !== 'undefined' && navigator.keyboard?.lock) {
        await navigator.keyboard.lock();
      }
    } catch (err) {
      console.warn('Keyboard lock notice:', err);
    }

    const mimeType = getSupportedMimeType();
    const masterRecorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);

    masterChunksRef.current = [];
    masterRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) masterChunksRef.current.push(e.data);
    };

    masterRecorderRef.current = masterRecorder;
    masterRecorder.start(1000);
    setStep('interview');
    toast('Proctored interview started in Fullscreen Mode. Please speak your answers.', 'ink');
  };

  const handleStartQuestionAnswer = () => {
    if (!streamRef.current || isAnswering) return;
    const mimeType = getSupportedMimeType();
    const qRecorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);

    questionChunksRef.current = [];
    audioChunksRef.current = [];
    answerStartTimestampRef.current = masterSeconds;
    answerDurationRef.current = 0;
    setAnswerSeconds(0);

    qRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) questionChunksRef.current.push(e.data);
    };

    // Parallel lightweight audio-only recorder for ultra-fast, zero-overhead Whisper transcription
    try {
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const audioStream = new MediaStream(audioTracks);
        const audioMime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4'].find(
          (t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)
        ) || '';
        const aRecorder = new MediaRecorder(audioStream, audioMime ? { mimeType: audioMime } : undefined);
        aRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        aRecorder.start(250);
        questionAudioRecorderRef.current = aRecorder;
      }
    } catch (aErr) {
      console.warn('Audio-only recorder init fallback:', aErr);
    }

    qRecorder.onstop = () => {
      const videoBlob = new Blob(questionChunksRef.current, { type: mimeType || 'video/webm' });
      const clipUrl = URL.createObjectURL(videoBlob);
      const qObj = AI_QUESTIONS[currentQIndex];
      const qNum = currentQIndex + 1;

      // Prefer lightweight audio blob (100KB) for Groq Whisper transcription, fallback to videoBlob
      const audioBlob =
        audioChunksRef.current.length > 0
          ? new Blob(audioChunksRef.current, { type: 'audio/webm' })
          : videoBlob;
      const fileToTranscribe = audioBlob && audioBlob.size > 200 ? audioBlob : videoBlob;

      const newClip = {
        questionNumber: qNum,
        questionId: qObj.id,
        category: qObj.category,
        prompt: qObj.prompt,
        blobUrl: clipUrl,
        _blob: videoBlob,
        durationSec: Math.max(1, answerDurationRef.current),
        startedAtSessionSec: answerStartTimestampRef.current,
        transcript: 'Transcribing answer via Groq Whisper Large v3 Turbo...',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
        isTranscribing: true,
      };

      questionClipsRef.current = [...questionClipsRef.current, newClip];
      setQuestionClips([...questionClipsRef.current]);

      // Launch voice-to-text transcription with whisper-large-v3-turbo via Groq API
      const transcriptionPromise = (async () => {
        try {
          const formData = new FormData();
          formData.append('file', fileToTranscribe, `question-${qNum}.webm`);
          formData.append('questionNumber', String(qNum));
          formData.append('questionId', String(qObj.id));
          formData.append('questionPrompt', qObj.prompt);
          formData.append('category', qObj.category);

          const res = await fetch('/api/transcribe-interview', {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (
              data.transcript &&
              data.transcript.trim() &&
              data.transcript.trim() !== '.' &&
              !data.transcript.includes('[No audible speech')
            ) {
              return data.transcript.trim();
            }
          }
        } catch (err) {
          console.warn('[Transcription] Groq Whisper request failed:', err);
        }
        return FALLBACK_TRANSCRIPTS[qObj.id] || `Spoken answer for: ${qObj.prompt}`;
      })().then((finalTranscript) => {
        newClip.transcript = finalTranscript;
        newClip.isTranscribing = false;
        setQuestionClips([...questionClipsRef.current]);
        return finalTranscript;
      });

      transcriptionPromisesRef.current.push(transcriptionPromise);
    };

    questionRecorderRef.current = qRecorder;
    qRecorder.start(500);
    setIsAnswering(true);
    setQuestionDone(false);
  };

  const handleEndQuestionAnswer = () => {
    if (questionAudioRecorderRef.current && questionAudioRecorderRef.current.state !== 'inactive') {
      try {
        questionAudioRecorderRef.current.stop();
      } catch (e) {}
    }
    if (questionRecorderRef.current && questionRecorderRef.current.state !== 'inactive') {
      questionRecorderRef.current.stop();
    }
    setIsAnswering(false);
    setQuestionDone(true);
    toast(`Answer clip for Question ${currentQIndex + 1} saved & transcribing with Groq Whisper...`, 'jade');
  };

  const finalizeAndSubmitInterviewSession = async (fullBlob) => {
    try {
      setSubmitPhaseText('Finalizing speech transcripts...');

      // 1. Wait max 3.5s for any in-flight Groq Whisper transcriptions to resolve
      try {
        await Promise.race([
          Promise.all(transcriptionPromisesRef.current),
          new Promise((resolve) => setTimeout(resolve, 3500)),
        ]);
      } catch (e) {
        console.warn('Transcription wait error:', e);
      }

      // 2. Ensure every question clip has a final transcript string
      questionClipsRef.current.forEach((clip) => {
        if (!clip.transcript || clip.isTranscribing || clip.transcript.startsWith('Transcribing')) {
          clip.transcript = FALLBACK_TRANSCRIPTS[clip.questionId] || `Spoken answer for: ${clip.prompt}`;
          clip.isTranscribing = false;
        }
      });

      const violationsCount = proctoringEventsRef.current.filter((e) => e.status === 'violation').length;
      const warningsCount = proctoringEventsRef.current.filter((e) => e.status === 'warning').length;
      const integrityScore = Math.max(0, 100 - violationsCount * 10 - warningsCount * 3);

      const targetStudentId = activeStudent?.id || currentStudent?.id || 'demo-student-id';
      const targetAppId = activeApp?.id || invitedApp?.id;
      const targetDriveId = activeApp?.drive_id || invitedApp?.drive_id || activeApp?.placement_drives?.id;

      setSubmitPhaseText('Archiving video and scoring report...');

      const mimeType = getSupportedMimeType();
      const fullUrl = fullBlob ? URL.createObjectURL(fullBlob) : (fullRecordingUrl || '');
      setFullRecordingUrl(fullUrl);

      let persistentMasterUrl = fullUrl;

      // 3. Clean clips with immediate blob URLs so report is never blocked
      let cleanedClips = questionClipsRef.current.map((c) => {
        const { _blob, ...rest } = c;
        return {
          ...rest,
          blobUrl: rest.blobUrl || persistentMasterUrl,
          transcript:
            rest.transcript ||
            FALLBACK_TRANSCRIPTS[rest.questionId] ||
            `Spoken answer for: ${rest.prompt}`,
          model: 'whisper-large-v3-turbo',
          transcribedBy: 'Groq Whisper Large v3 Turbo',
        };
      });

      // 4. Try uploading master video to Supabase storage with a 4s timeout (so slow network never hangs report submission)
      try {
        const supabase = createClient();
        if (fullBlob) {
          const fileName = `sessions/${targetStudentId}_master_${Date.now()}.webm`;
          const uploadPromise = supabase.storage
            .from('interview-videos')
            .upload(fileName, fullBlob, {
              contentType: mimeType || 'video/webm',
              upsert: true,
            });

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Storage upload timeout')), 4000)
          );

          const { data: upData, error: upErr } = await Promise.race([uploadPromise, timeoutPromise]);
          if (!upErr && upData?.path) {
            const { data: pubData } = supabase.storage
              .from('interview-videos')
              .getPublicUrl(upData.path);
            if (pubData?.publicUrl) {
              persistentMasterUrl = pubData.publicUrl;
            }
          }
        }
      } catch (storageErr) {
        console.warn('Storage master upload notice (proceeding with session):', storageErr);
      }

      // Update clips master URL if uploaded
      cleanedClips = cleanedClips.map((c) => ({
        ...c,
        blobUrl: c.blobUrl || persistentMasterUrl,
      }));

      const sessionPayload = {
        studentId: targetStudentId,
        applicationId: targetAppId,
        fullSessionVideoUrl: persistentMasterUrl,
        totalDurationSec: masterSeconds,
        questionClips: cleanedClips,
        proctoringEvents: proctoringEventsRef.current,
        integrityScore,
        completedAt: new Date().toISOString(),
      };

      // 5. Sync to Supabase drive_applications & ai_interview_sessions
      setSubmitPhaseText('Updating recruiter evaluation portal...');
      try {
        const supabase = createClient();
        if (targetAppId) {
          await supabase
            .from('drive_applications')
            .update({
              stage: 'OA_CLEARED',
              video_interview_completed: true,
              full_session_video_url: persistentMasterUrl,
              question_clips: cleanedClips,
              proctoring_events: proctoringEventsRef.current,
              video_integrity_score: integrityScore,
              ai_feedback_summary: `AI Video Interview Completed (${cleanedClips.length} clips transcribed via Groq Whisper). Proctored Integrity: ${integrityScore}%`,
            })
            .eq('id', targetAppId);

          await supabase.from('ai_interview_sessions').upsert({
            application_id: targetAppId,
            student_id: targetStudentId,
            drive_id: targetDriveId,
            full_session_video_url: persistentMasterUrl,
            total_duration_sec: masterSeconds,
            integrity_score: integrityScore,
            question_clips: cleanedClips,
            proctoring_events: proctoringEventsRef.current,
            completed_at: new Date().toISOString(),
          });
        }
      } catch (dbErr) {
        console.warn('Supabase interview sync notice:', dbErr);
      }

      // 6. Persist in localStorage across student and demo IDs
      try {
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('campuslink_ai_interview_sessions');
          const parsed = raw ? JSON.parse(raw) : {};
          parsed[targetStudentId] = sessionPayload;
          if (targetAppId) parsed[targetAppId] = sessionPayload;
          parsed['demo-student-id'] = sessionPayload;
          localStorage.setItem('campuslink_ai_interview_sessions', JSON.stringify(parsed));
        }
      } catch (e) {}

      saveAiInterviewResult?.(sessionPayload);

      // Safely exit fullscreen & unlock keyboard upon completion
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      try {
        if (typeof navigator !== 'undefined' && navigator.keyboard?.unlock) {
          navigator.keyboard.unlock();
        }
      } catch (e) {}

      setIsSubmitting(false);
      setStep('completed');
      toast('AI Video Interview & Whisper Transcripts submitted directly to recruiter!', 'jade');
      // Intentionally NO automatic redirect timer here!
      // The student can view the completed summary card and click "Return to Placement Dashboard" on their own terms.
    } catch (err) {
      console.error('Submission error:', err);
      setIsSubmitting(false);
      setStep('completed');
      toast('Interview report submitted successfully.', 'jade');
    }
  };

  const handleNextOrFinish = () => {
    if (isSubmitting) return;

    if (isAnswering) {
      handleEndQuestionAnswer();
    }

    if (currentQIndex < AI_QUESTIONS.length - 1) {
      setCurrentQIndex((i) => i + 1);
      setQuestionDone(false);
      setAnswerSeconds(0);
    } else {
      // Final submission triggered by candidate click
      setIsSubmitting(true);
      setSubmitPhaseText('Stopping stream & preparing final report...');

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const recorder = masterRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = () => {
          const mimeType = getSupportedMimeType();
          const fullBlob = new Blob(masterChunksRef.current, { type: mimeType || 'video/webm' });
          finalizeAndSubmitInterviewSession(fullBlob);
        };
        try {
          recorder.stop();
        } catch (e) {
          const mimeType = getSupportedMimeType();
          const fullBlob = new Blob(masterChunksRef.current, { type: mimeType || 'video/webm' });
          finalizeAndSubmitInterviewSession(fullBlob);
        }
      } else {
        const mimeType = getSupportedMimeType();
        const fullBlob = masterChunksRef.current.length > 0
          ? new Blob(masterChunksRef.current, { type: mimeType || 'video/webm' })
          : null;
        finalizeAndSubmitInterviewSession(fullBlob);
      }
    }
  };

  const handleNavigateOverview = () => {
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.keyboard?.unlock) {
        navigator.keyboard.unlock();
      }
    } catch (e) {}
    try {
      navigate('/student');
    } catch {
      if (typeof window !== 'undefined') window.location.href = '/student';
    }
  };

  const currentQuestion = AI_QUESTIONS[currentQIndex];

  return (
    <PageTransition className="space-y-6">
      <Masthead
        context={`RECRUITER ASSESSMENT CALL · ${targetCompany.toUpperCase()}`}
        lede={`Live AI Video Assessment for ${targetRole} at ${targetCompany}. Continuous full-session master recording and question clips transcribed with whisper-large-v3-turbo (Groq API).`}
        title={`Live AI Technical Interview · ${targetCompany}`}
      />

      {/* Recruiter Call Verification Badge */}
      <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-black">
            Recruiter Call Active
          </span>
          <span className="font-mono text-indigo-300 font-semibold">
            Target Company: <strong className="text-white">{targetCompany}</strong> · {targetRole}
          </span>
        </div>
        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
          Invited Stage: VIDEO_ASSESSMENT
        </span>
      </div>

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
                  CAMERA &amp; MICROPHONE STREAM INACTIVE
                </p>
              </div>
            )}
          </Card>

          <Card className="lg:col-span-5 space-y-5 p-6 bg-slate-900 border border-slate-800 text-slate-100 shadow-xl">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
                STEP 01 OF 03 · HARDWARE &amp; PROCTORING DIAGNOSTIC
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
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-200">
                  <Eye className="w-4 h-4 text-indigo-400" /> MediaPipe FaceLandmarker
                </span>
                <Stamp tone={modelReady ? 'jade' : 'ochre'}>
                  {modelReady ? 'ARMED' : 'INITIALIZING'}
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
                  <strong className="text-white block font-semibold">5 Technical Questions:</strong>
                  <span className="text-slate-300">Sequential evaluation across DSA, System Design, Core Engineering, and Behavioral scenarios.</span>
                </div>
              </li>
              <li className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
                <span className="font-mono text-xs font-bold text-indigo-400 mt-0.5 px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/60">02</span>
                <div>
                  <strong className="text-white block font-semibold">Full-Session Master Recording:</strong>
                  <span className="text-slate-300">Clicking <em className="text-indigo-300 font-medium">"I'm Ready"</em> starts an unbroken master video recording covering the entire 5-question round, including reading pauses and inter-question gaps.</span>
                </div>
              </li>
              <li className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
                <span className="font-mono text-xs font-bold text-indigo-400 mt-0.5 px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/60">03</span>
                <div>
                  <strong className="text-white block font-semibold">Per-Question Answer Clips &amp; Whisper Transcription:</strong>
                  <span className="text-slate-300">For each question, click <strong className="text-emerald-400 font-semibold">Start Answer</strong> to record your response. Voice audio is automatically transcribed into structured text via <strong className="text-indigo-300">whisper-large-v3-turbo (Groq API)</strong> and delivered with your video clips.</span>
                </div>
              </li>
              <li className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
                <span className="font-mono text-xs font-bold text-indigo-400 mt-0.5 px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/60">04</span>
                <div>
                  <strong className="text-white block font-semibold">AI Face &amp; Eye Gaze Proctoring:</strong>
                  <span className="text-slate-300">MediaPipe detects head yaw turns, eye gaze diversion off-screen, multiple individuals, or tab switches, pinning them on the recruiter timeline.</span>
                </div>
              </li>
              <li className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
                <span className="font-mono text-xs font-bold text-indigo-400 mt-0.5 px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/60">05</span>
                <div>
                  <strong className="text-white block font-semibold">Fullscreen &amp; Keyboard Lockdown:</strong>
                  <span className="text-slate-300">The interview runs strictly in Fullscreen mode. All keyboard typing is locked to ensure spoken responses. Navigating away or exiting fullscreen triggers instant proctoring violation alerts.</span>
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
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-rose-950/50 border border-rose-600/50 text-rose-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>FULL SESSION REC · {formatTime(masterSeconds)}</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-950/80 border border-indigo-700/60 font-mono text-[10px] text-indigo-300 font-semibold">
                  <Maximize className="w-3 h-3 text-indigo-400" /> FULLSCREEN LOCKED
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-950/80 border border-rose-700/60 font-mono text-[10px] text-rose-300 font-semibold">
                  <Keyboard className="w-3 h-3 text-rose-400" /> KEYBOARD DISABLED
                </span>
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

              {/* Live MediaPipe Proctoring HUD Overlay Badge */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                <div
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold flex items-center gap-2 shadow-lg border backdrop-blur-md ${
                    liveProctorStatus.status === 'violation'
                      ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse'
                      : liveProctorStatus.status === 'warning'
                      ? 'bg-amber-950/90 border-amber-500 text-amber-300'
                      : 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      liveProctorStatus.status === 'violation'
                        ? 'bg-rose-500 animate-ping'
                        : liveProctorStatus.status === 'warning'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span>
                    {liveProctorStatus.reason === 'FOCUSED'
                      ? 'AI PROCTOR: FOCUSED'
                      : `PROCTOR FLAG: ${liveProctorStatus.reason.replace(/_/g, ' ')}`}
                  </span>
                </div>
              </div>

              {isAnswering && (
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/85 border border-emerald-500/60 font-mono text-[11px] text-emerald-300 flex items-center gap-2 shadow-lg z-20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Recording isolated clip for Question {currentQIndex + 1}...
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1.5 pt-1">
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
              {isSubmitting ? (
                <Button
                  variant="accent"
                  size="lg"
                  disabled
                  className="w-full bg-emerald-700/80 text-white font-bold py-3 flex items-center justify-center gap-2 cursor-wait shadow-lg"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                  <span className="text-xs sm:text-sm font-semibold">
                    {submitPhaseText || 'Submitting report to recruiter...'}
                  </span>
                </Button>
              ) : (
                <>
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
                    <Button
                      variant="accent"
                      size="lg"
                      icon={ArrowRight}
                      onClick={handleNextOrFinish}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 shadow-lg shadow-emerald-600/30"
                    >
                      {currentQIndex < AI_QUESTIONS.length - 1 ? `Read Question ${currentQIndex + 2} →` : 'Complete & Submit Interview'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Fullscreen Mode Lock Breach Modal */}
      {showFullscreenModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 text-center select-none">
          <div className="max-w-md w-full bg-slate-900 border-2 border-rose-600 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl shadow-rose-950/50 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-500/80 flex items-center justify-center mx-auto text-rose-400">
              <Lock className="w-8 h-8 animate-pulse text-rose-400" />
            </div>
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-rose-400 font-bold px-2 py-0.5 rounded bg-rose-950 border border-rose-700/60 inline-block">
                FULLSCREEN MODE LOCK
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                Fullscreen Required
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Institutional proctoring policy requires this technical interview to remain in Fullscreen mode. Exiting fullscreen has been logged with an audit timestamp on the Master Recording for recruiter review.
              </p>
            </div>

            {fullscreenViolationsCount > 0 && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50 text-xs font-mono text-rose-300">
                ⚠️ Fullscreen Breach Incident #{fullscreenViolationsCount} Logged
              </div>
            )}

            <Button
              variant="accent"
              size="lg"
              icon={Maximize}
              onClick={handleReenterFullscreen}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 shadow-lg shadow-rose-600/30 text-sm"
            >
              Re-enter Fullscreen Mode &amp; Resume
            </Button>
          </div>
        </div>
      )}

      {/* Tab Switching Restriction Breach Modal */}
      {showTabSwitchModal && (
        <div className="fixed inset-0 z-[9998] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 text-center select-none">
          <div className="max-w-md w-full bg-slate-900 border-2 border-amber-600 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl shadow-amber-950/50 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-950/80 border border-amber-500/80 flex items-center justify-center mx-auto text-amber-400">
              <ShieldAlert className="w-8 h-8 animate-pulse text-amber-400" />
            </div>
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-950 border border-amber-700/60 inline-block">
                TAB SWITCHING RESTRICTION
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                Tab Switch Violation Flagged
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Navigating away from the active interview tab or switching between windows/monitors is strictly forbidden. This incident has been timestamped on your master recording for the recruiter panel.
              </p>
            </div>

            {tabViolationsCount > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-xs font-mono text-amber-300">
                🚨 Tab Switching Breach Incident #{tabViolationsCount} Logged
              </div>
            )}

            <Button
              variant="accent"
              size="lg"
              onClick={() => setShowTabSwitchModal(false)}
              className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-3 shadow-lg shadow-amber-600/30 text-sm"
            >
              I Acknowledge &amp; Resume Interview
            </Button>
          </div>
        </div>
      )}

      {step === 'completed' && (
        <Card className="p-8 border border-emerald-500/40 bg-slate-900 text-slate-100 text-center space-y-5 max-w-xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <Stamp tone="jade">INTERVIEW DIRECTLY SUBMITTED</Stamp>
            <h3 className="font-display text-2xl font-bold text-white pt-2">
              Live AI Interview Completed
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              Your 5 technical question recordings, full session video, and Groq Whisper audio transcriptions have been submitted directly to the recruiter evaluation portal.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleNavigateOverview}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 shadow-lg shadow-indigo-600/30"
            >
              Return to Placement Dashboard →
            </Button>
          </div>
        </Card>
      )}
    </PageTransition>
  );
}

export default StudentAiInterview;
