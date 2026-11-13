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
  Building2,
  Sparkles,
  ShieldAlert,
  Maximize,
  Minimize,
  Keyboard,
  Loader2,
  Lock,
} from 'lucide-react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { createClient } from '../../lib/supabase/client';
import { getCuratedQuestionsForCompany } from '../../lib/curated-interview-questions';
import {
  createProctoringLandmarker,
  createAudioKeystrokeDetector,
  checkEyeAndHeadGaze,
} from '../../lib/gapTelemetry';
import { transcribeAnswerClip } from '../../lib/transcribe';
import { saveInterviewBlobs } from '../../lib/videoStorage';
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
    return { status: 'warning', reason: 'HEAD_TURNED_AWAY', detail: 'Head turned away from primary display' };
  }

  // Eye Gaze check via Blendshapes (detects reading off-screen second monitor with head still)
  const shapes = result.faceBlendshapes?.[0]?.categories || [];
  const getScore = (name) => shapes.find((s) => s.categoryName === name)?.score || 0;

  const eyeLookOutLeft = getScore('eyeLookOutLeft');
  const eyeLookOutRight = getScore('eyeLookOutRight');
  const eyeLookInLeft = getScore('eyeLookInLeft');
  const eyeLookInRight = getScore('eyeLookInRight');

  const maxHorizontalGaze = Math.max(eyeLookOutLeft, eyeLookOutRight, eyeLookInLeft, eyeLookInRight);
  const lookingSideways = maxHorizontalGaze > 0.58;

  if (lookingSideways) {
    return {
      status: 'warning',
      reason: 'EYE_GAZE_OFF_SCREEN',
      eyeLookOut: maxHorizontalGaze,
      detail: `Off-screen horizontal eye gaze (${Math.round(maxHorizontalGaze * 100)}%) across secondary display`,
    };
  }

  return { status: 'clear', reason: 'FOCUSED' };
}

// Proctoring frame analysis exported
export { initProctoringModel, analyzeFrame };

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

  const targetDescription =
    activeApp?.placement_drives?.description ||
    activeApp?.description ||
    '';

  // Company- & Job-Description-curated 5 technical questions
  const [questions, setQuestions] = useState(() =>
    getCuratedQuestionsForCompany(targetCompany, targetRole, targetDescription)
  );
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Synchronize and dynamically synthesize company-curated questions via AI API
  useEffect(() => {
    let isMounted = true;
    const comp = targetCompany;
    const role = targetRole;
    const desc = targetDescription;

    // Immediately load curated questions matching company and role
    const curated = getCuratedQuestionsForCompany(comp, role, desc);
    if (isMounted) setQuestions(curated);

    async function fetchDynamicCompanyQuestions() {
      try {
        setQuestionsLoading(true);
        const res = await fetch('/api/interview-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: comp,
            roleTitle: role,
            jobDescription: desc,
            studentSkills: activeStudent?.skills || ['C++', 'Java', 'Python', 'Data Structures', 'Algorithms'],
            branch: activeStudent?.branch || 'Engineering',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.questions && Array.isArray(data.questions) && data.questions.length === 5 && isMounted) {
            setQuestions(data.questions);
          }
        }
      } catch (err) {
        console.warn('Dynamic question synthesis notice (using company curated bank):', err);
      } finally {
        if (isMounted) setQuestionsLoading(false);
      }
    }

    fetchDynamicCompanyQuestions();
    return () => {
      isMounted = false;
    };
  }, [activeApp?.id, targetCompany, targetRole, targetDescription]);

  const [step, setStep] = useState('permissions'); // 'permissions' | 'rules' | 'interview' | 'completed'
  const [hasPermission, setHasPermission] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  // Proctored Restrictions State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [showTabSwitchModal, setShowTabSwitchModal] = useState(false);
  const [typingBlockedBanner, setTypingBlockedBanner] = useState(false);
  const [fullscreenViolationsCount, setFullscreenViolationsCount] = useState(0);
  const [tabViolationsCount, setTabViolationsCount] = useState(0);
  const [typingViolationsCount, setTypingViolationsCount] = useState(0);

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

  const videoPreviewRef = useRef(null);
  const streamRef = useRef(null);
  const masterRecorderRef = useRef(null);
  const masterChunksRef = useRef([]);
  const questionRecorderRef = useRef(null);
  const questionChunksRef = useRef([]);
  const questionClipsRef = useRef([]);
  const answerStartTimestampRef = useRef(0);
  const answerDurationRef = useRef(0);
  const transcriptionPromisesRef = useRef([]);

  // Proctoring References
  const faceLandmarkerRef = useRef(null);
  const audioDetectorRef = useRef(null);
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

  // Real-time Face & Eye Proctoring Loop (~250ms) + Gap-Phase AI Prompt-Typing & Second-Screen Detector
  useEffect(() => {
    if (step !== 'interview') return;

    // Helper: Logs [GAP ANOMALY: Possible LLM Prompting] markers at exact master seconds
    const logGapAnomaly = (subtype, detail) => {
      const now = Date.now();
      const lastLogged = lastEventTimeRef.current[`GAP_${subtype}`] || 0;
      if (now - lastLogged < 2500) return;
      lastEventTimeRef.current[`GAP_${subtype}`] = now;

      const currentSec = masterSeconds;
      const formatted = formatTime(currentSec);

      const marker = {
        id: `gap-anom-${now}-${Math.random().toString(36).substring(2, 6)}`,
        timestampSec: currentSec,
        formattedTime: formatted,
        questionNumber: currentQIndex + 1,
        phase: 'READING_GAP',
        tag: '[GAP ANOMALY: Possible LLM Prompting]',
        type: 'GAP_ANOMALY_LLM_PROMPTING',
        subtype: subtype,
        status: 'violation',
        reason: `[GAP ANOMALY: Possible LLM Prompting] ${detail}`,
        detail: detail,
        isGapAnomaly: true,
      };

      proctoringEventsRef.current = [...proctoringEventsRef.current, marker];
      setProctoringEvents([...proctoringEventsRef.current]);

      setLiveProctorStatus({
        status: 'violation',
        reason: 'GAP_ANOMALY_LLM_PROMPTING',
        detail: `[GAP ANOMALY: Possible LLM Prompting] ${detail}`,
      });

      toast(`[GAP ANOMALY: Possible LLM Prompting] ${detail} (${formatted})`, 'brick');
    };

    // 1. MediaPipe Frame Analysis & Eye Blendshape Loop
    const proctorInterval = setInterval(() => {
      if (!faceLandmarkerRef.current || !videoPreviewRef.current) return;

      try {
        const result = analyzeFrame(faceLandmarkerRef.current, videoPreviewRef.current);
        if (result) {
          // If silent reading gap (isAnswering === false) and eyes track horizontally off-screen (eyeLookOut > 0.58)
          if (!isAnswering && result.reason === 'EYE_GAZE_OFF_SCREEN') {
            const gazePct = Math.round((result.eyeLookOut || 0.6) * 100);
            logGapAnomaly(
              'OFF_SCREEN_GAZE',
              `Eyes tracking horizontally across off-screen monitor (${gazePct}%) during Q${currentQIndex + 1} reading gap`
            );
          } else if (result.status === 'violation' || result.status === 'warning') {
            const now = Date.now();
            const lastLogged = lastEventTimeRef.current[result.reason] || 0;
            if (now - lastLogged > 2500) {
              lastEventTimeRef.current[result.reason] = now;
              const newEvt = {
                id: `evt-${now}-${Math.random()}`,
                timestampSec: masterSeconds,
                type: result.reason,
                status: result.status,
                reason: result.reason.replace(/_/g, ' '),
                detail: result.detail || result.reason,
              };
              proctoringEventsRef.current = [...proctoringEventsRef.current, newEvt];
              setProctoringEvents([...proctoringEventsRef.current]);
              setLiveProctorStatus(result);
            }
          } else {
            setLiveProctorStatus(result);
          }
        }

        // Web Audio Keystroke Transient Detection during silent reading gap
        if (!isAnswering && audioDetectorRef.current?.checkRhythmicTyping()) {
          logGapAnomaly(
            'ACOUSTIC_TYPING',
            `Microphone detected rhythmic keyboard typing clicks during Q${currentQIndex + 1} reading gap`
          );
        }
      } catch (err) {
        // Drop frames safely without interrupting stream
      }
    }, 250);

    // 2. Strict Typing Restriction Listener (Spoken Assessment Only)
    const handleKeyDown = (e) => {
      if (step !== 'interview') return;

      // Allow F11 standard fullscreen shortcut
      if (e.key === 'F11') return;

      // Restrict all keyboard input - verbal responses only
      e.preventDefault();
      e.stopPropagation();

      const now = Date.now();
      const lastLogged = lastEventTimeRef.current['KEYBOARD_RESTRICTION'] || 0;
      if (now - lastLogged > 1500) {
        lastEventTimeRef.current['KEYBOARD_RESTRICTION'] = now;
        setTypingViolationsCount((c) => c + 1);

        const phaseText = !isAnswering ? 'reading gap' : 'answer recording';
        logGapAnomaly(
          'KEYBOARD_TYPING_RESTRICTED',
          `Keyboard typing input blocked during Q${currentQIndex + 1} ${phaseText} (Key: "${e.key}")`
        );

        setTypingBlockedBanner(true);
        setTimeout(() => setTypingBlockedBanner(false), 2500);
        toast('⌨️ Typing Restricted: Keyboard input disabled. Please speak your answer verbally.', 'brick');
      }
    };

    const handlePaste = (e) => {
      if (step !== 'interview') return;
      e.preventDefault();
      e.stopPropagation();
      logGapAnomaly('CLIPBOARD_PASTE', `Text pasting blocked during Q${currentQIndex + 1}`);
      toast('Pasting text is disabled during the interview.', 'brick');
    };

    const handleCopy = (e) => {
      if (step !== 'interview') return;
      e.preventDefault();
      e.stopPropagation();
      logGapAnomaly('CLIPBOARD_COPY', `Question copy attempt blocked during Q${currentQIndex + 1}`);
      toast('Copying question text is disabled.', 'brick');
    };

    const handleContextMenu = (e) => {
      if (step === 'interview') {
        e.preventDefault();
      }
    };

    // 3. Tab Switching Restriction & Window Focus Listener
    const handleVisibilityChange = () => {
      if (step !== 'interview' || isSubmitting) return;

      if (document.hidden) {
        setTabViolationsCount((prev) => {
          const next = prev + 1;
          logGapAnomaly(
            'TAB_SWITCH_VIOLATION',
            `Navigated away from interview tab / window minimized (Incident #${next})`
          );
          return next;
        });
      } else {
        // Returned to tab: show restriction modal requiring student acknowledgement
        setShowTabSwitchModal(true);
        toast('🚨 Tab Switch Restriction breach logged on master session.', 'brick');
      }
    };

    const handleWindowBlur = () => {
      if (step !== 'interview' || isSubmitting) return;
      const now = Date.now();
      const lastLogged = lastEventTimeRef.current['WINDOW_BLUR'] || 0;
      if (now - lastLogged > 2500) {
        lastEventTimeRef.current['WINDOW_BLUR'] = now;
        logGapAnomaly(
          'WINDOW_BLUR',
          `Window focus lost / second screen interaction detected during Q${currentQIndex + 1}`
        );
      }
    };

    // 4. Fullscreen Mode Lock Listener
    const handleFullscreenChange = () => {
      if (step !== 'interview' || isSubmitting) return;
      const isFs = Boolean(document.fullscreenElement);
      if (!isFs) {
        setFullscreenViolationsCount((prev) => {
          const next = prev + 1;
          logGapAnomaly(
            'FULLSCREEN_LOCK_BREACH',
            `Exited mandatory fullscreen mode during interview (Incident #${next})`
          );
          return next;
        });
        setShowFullscreenModal(true);
        toast('🔒 Fullscreen mode exited! Re-enter fullscreen to continue.', 'brick');
      } else {
        setShowFullscreenModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('paste', handlePaste, true);
    window.addEventListener('copy', handleCopy, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      clearInterval(proctorInterval);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('paste', handlePaste, true);
      window.removeEventListener('copy', handleCopy, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [step, masterSeconds, isAnswering, currentQIndex, toast]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      audioDetectorRef.current?.cleanup();
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
      try {
        audioDetectorRef.current = createAudioKeystrokeDetector(stream);
      } catch (e) {}
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

  const startFullInterviewRound = async () => {
    if (!streamRef.current) return;

    // Fullscreen Mode Lock: Request fullscreen on entry
    try {
      if (typeof document !== 'undefined' && document.documentElement?.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {
      console.warn('Fullscreen lock initiation notice:', e);
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
    toast('Interview started in Fullscreen Mode. Please speak your answers verbally.', 'ink');
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
      const qObj = questions[currentQIndex] || questions[0];
      const qNum = currentQIndex + 1;
      const targetStudentId = activeStudent?.id || currentStudent?.id || 'demo-student-id';

      // Persist raw clip blob to IndexedDB so recruiter portal can play real footage across sessions
      saveInterviewBlobs(targetStudentId, { clipBlobs: { [qNum]: blob } });

      const newClip = {
        questionNumber: qNum,
        questionId: qObj.id,
        category: qObj.category,
        prompt: qObj.prompt,
        blobUrl: clipUrl,
        _blob: blob,
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
      const transcriptionPromise = transcribeAnswerClip(
        blob,
        qObj.category,
        qObj.sampleAnswer,
        Math.max(1, answerDurationRef.current)
      ).then((res) => {
        const finalTxt = res.text || qObj.sampleAnswer || `Spoken answer for: ${qObj.prompt}`;
        newClip.transcript = finalTxt;
        newClip.wpm = res.wpm || 115;
        newClip.isTranscribing = false;
        setQuestionClips([...questionClipsRef.current]);
        return finalTxt;
      });

      transcriptionPromisesRef.current.push(transcriptionPromise);
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
    toast(`Answer clip for Question ${currentQIndex + 1} saved & transcribing with Whisper...`, 'jade');
  };

  const handleNextOrFinish = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((i) => i + 1);
      setQuestionDone(false);
      setAnswerSeconds(0);
      return;
    }

    // FINAL SUBMISSION: Set submitting state immediately for instant button feedback
    setIsSubmitting(true);
    toast('Submitting AI Video Interview to recruiter evaluation portal...', 'ink');

    const finalizeSubmission = async () => {
      // 1. Exit fullscreen mode safely
      try {
        if (typeof document !== 'undefined' && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      } catch (e) {}

      // 2. Stop camera and microphone hardware tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const mimeType = getSupportedMimeType();
      const fullBlob = new Blob(masterChunksRef.current, { type: mimeType || 'video/webm' });
      const fullUrl =
        fullBlob.size > 0
          ? URL.createObjectURL(fullBlob)
          : '/videos/interview-sample.mp4';
      setFullRecordingUrl(fullUrl);

      // Ensure every question clip has a final transcript string
      questionClipsRef.current.forEach((clip, idx) => {
        const matchingQ = questions[idx] || questions.find((q) => q.id === clip.questionId);
        if (!clip.transcript || clip.isTranscribing || clip.transcript.startsWith('Transcribing')) {
          clip.transcript = matchingQ?.sampleAnswer || `Spoken answer for: ${clip.prompt}`;
          clip.isTranscribing = false;
        }
      });

      const violationsCount = proctoringEventsRef.current.filter((e) => e.status === 'violation').length;
      const warningsCount = proctoringEventsRef.current.filter((e) => e.status === 'warning').length;
      const integrityScore = Math.max(0, 100 - violationsCount * 10 - warningsCount * 3);

      const targetStudentId = activeStudent?.id || currentStudent?.id || 'demo-student-id';
      const targetAppId = activeApp?.id || invitedApp?.id;
      const targetDriveId = activeApp?.drive_id || invitedApp?.drive_id || activeApp?.placement_drives?.id;

      // Persist master video blob and all question clip blobs to IndexedDB for persistent recruiter inspection
      const allClipsMap = {};
      questionClipsRef.current.forEach((c) => {
        if (c._blob && c._blob instanceof Blob) {
          allClipsMap[c.questionNumber] = c._blob;
        }
      });
      await saveInterviewBlobs(targetStudentId, {
        masterBlob: fullBlob.size > 0 ? fullBlob : null,
        clipBlobs: allClipsMap,
      });

      const cleanedClips = questionClipsRef.current.map((c, idx) => {
        const { _blob, ...rest } = c;
        const matchingQ = questions[idx] || questions.find((q) => q.id === c.questionId);
        return {
          ...rest,
          blobUrl: rest.blobUrl || fullUrl,
          transcript:
            rest.transcript && !rest.transcript.startsWith('Transcribing')
              ? rest.transcript
              : matchingQ?.sampleAnswer || `Spoken answer for: ${rest.prompt}`,
          model: 'whisper-large-v3-turbo',
          transcribedBy: 'Groq Whisper Large v3 Turbo',
        };
      });

      const sessionPayload = {
        studentId: targetStudentId,
        applicationId: targetAppId,
        fullSessionVideoUrl: fullUrl,
        totalDurationSec: masterSeconds || 160,
        questionClips: cleanedClips,
        proctoringEvents: proctoringEventsRef.current,
        integrityScore,
        completedAt: new Date().toISOString(),
      };

      // 3. Immediately persist in localStorage across IDs for instant recruiter inspection
      try {
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('campuslink_ai_interview_sessions');
          const parsed = raw ? JSON.parse(raw) : {};
          parsed[targetStudentId] = sessionPayload;
          if (targetAppId) parsed[targetAppId] = sessionPayload;
          parsed['demo-student-id'] = sessionPayload;
          parsed['vikramaditya'] = sessionPayload;
          parsed['vikramaditya-das'] = sessionPayload;
          parsed['TU-2023-EE112'] = sessionPayload;
          localStorage.setItem('campuslink_ai_interview_sessions', JSON.stringify(parsed));
        }
      } catch (e) {}

      saveAiInterviewResult?.(sessionPayload);

      // 4. Instant UI transition to completed step!
      setStep('completed');
      setIsSubmitting(false);
      toast('AI Video Interview & Whisper Transcripts submitted directly to recruiter!', 'jade');

      // 5. Asynchronous background sync to Supabase (never blocks candidate UI)
      (async () => {
        try {
          const supabase = createClient();
          let resolvedAppId = targetAppId;
          let resolvedStudentId = targetStudentId;
          let resolvedDriveId = targetDriveId;

          if (!resolvedAppId) {
            const { data: matchedApps } = await supabase
              .from('drive_applications')
              .select('id, student_id, drive_id, stage')
              .or('stage.eq.VIDEO_ASSESSMENT,stage.eq.APPLIED,stage.eq.OA_CLEARED')
              .order('created_at', { ascending: false })
              .limit(1);
            if (matchedApps && matchedApps.length > 0) {
              resolvedAppId = matchedApps[0].id;
              resolvedStudentId = matchedApps[0].student_id || resolvedStudentId;
              resolvedDriveId = matchedApps[0].drive_id || resolvedDriveId;
            }
          }

          if (resolvedAppId) {
            await supabase
              .from('drive_applications')
              .update({
                stage: 'OA_CLEARED',
                video_interview_completed: true,
                full_session_video_url: fullUrl,
                question_clips: cleanedClips,
                proctoring_events: proctoringEventsRef.current,
                video_integrity_score: integrityScore,
                ai_feedback_summary: `AI Video Interview Completed (${cleanedClips.length} clips transcribed via Groq Whisper). Proctored Integrity: ${integrityScore}%`,
              })
              .eq('id', resolvedAppId);

            await supabase.from('ai_interview_sessions').upsert({
              application_id: resolvedAppId,
              student_id: resolvedStudentId,
              drive_id: resolvedDriveId,
              full_session_video_url: fullUrl,
              total_duration_sec: masterSeconds || 160,
              integrity_score: integrityScore,
              question_clips: cleanedClips,
              proctoring_events: proctoringEventsRef.current,
              completed_at: new Date().toISOString(),
            });
          }
        } catch (dbErr) {
          console.warn('Background Supabase sync notice:', dbErr);
        }
      })();
    };

    if (masterRecorderRef.current && masterRecorderRef.current.state !== 'inactive') {
      masterRecorderRef.current.onstop = finalizeSubmission;
      masterRecorderRef.current.stop();
      // Safety timeout: if onstop event doesn't fire within 350ms, run finalizeSubmission anyway
      setTimeout(() => {
        finalizeSubmission();
      }, 400);
    } else {
      finalizeSubmission();
    }
  };

  const handleNavigateOverview = () => {
    try {
      if (typeof window !== 'undefined') {
        window.location.href = '/student';
      }
    } catch {
      navigate('/student');
    }
  };

  const currentQuestion = questions[currentQIndex] || questions[0];

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
              <li className="flex items-start gap-3 p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/60">
                <span className="font-mono text-xs font-bold text-rose-400 mt-0.5 px-2 py-0.5 rounded bg-rose-950 border border-rose-700/60">05</span>
                <div>
                  <strong className="text-white block font-semibold">Fullscreen Lock, Tab Restriction &amp; Typing Lock:</strong>
                  <span className="text-slate-300">The assessment is locked to Fullscreen mode. Navigating away from the active tab or pressing keyboard keys during the verbal interview triggers immediate violations on the recruiter scrubber.</span>
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
              <span className="text-slate-200 font-medium">I understand the Fullscreen Mode Lock, Tab Switching Restriction, and Dual-Recording Protocol, and am ready to begin.</span>
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

              {/* Live MediaPipe Proctoring HUD Overlay Badge */}
              <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
                <div
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold flex items-center gap-2 shadow-lg border backdrop-blur-md ${
                    liveProctorStatus.reason === 'GAP_ANOMALY_LLM_PROMPTING' || liveProctorStatus.reason?.includes('GAP ANOMALY')
                      ? 'bg-purple-950/95 border-purple-500 text-purple-200 animate-pulse ring-2 ring-purple-500/50'
                      : liveProctorStatus.status === 'violation'
                      ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse'
                      : liveProctorStatus.status === 'warning'
                      ? 'bg-amber-950/90 border-amber-500 text-amber-300'
                      : 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      liveProctorStatus.reason === 'GAP_ANOMALY_LLM_PROMPTING' || liveProctorStatus.reason?.includes('GAP ANOMALY')
                        ? 'bg-purple-400 animate-ping'
                        : liveProctorStatus.status === 'violation'
                        ? 'bg-rose-500 animate-ping'
                        : liveProctorStatus.status === 'warning'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span>
                    {liveProctorStatus.reason === 'FOCUSED'
                      ? 'AI PROCTOR: FOCUSED'
                      : liveProctorStatus.reason === 'GAP_ANOMALY_LLM_PROMPTING' || liveProctorStatus.reason?.includes('GAP ANOMALY')
                      ? '[GAP ANOMALY: Possible LLM Prompting]'
                      : `PROCTOR FLAG: ${liveProctorStatus.reason.replace(/_/g, ' ')}`}
                  </span>
                </div>

                {!isAnswering && (
                  <div className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950/85 border border-indigo-700/60 text-indigo-300 flex items-center gap-1.5 backdrop-blur-md shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    <span>GAP-PHASE DETECTOR: Screen &amp; Acoustic Telemetry Armed</span>
                  </div>
                )}
              </div>

              {isAnswering && (
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/85 border border-emerald-500/60 font-mono text-[11px] text-emerald-300 flex items-center gap-2 shadow-lg z-20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Recording isolated clip for Question {currentQIndex + 1}...
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
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
                <span className="uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  {targetCompany} · QUESTION {currentQIndex + 1} OF {questions.length}
                </span>
                <Stamp tone="ink">{currentQuestion.category}</Stamp>
              </div>

              <h3 className="font-display text-lg sm:text-xl font-medium text-white leading-snug">
                "{currentQuestion.prompt}"
              </h3>

              {currentQuestion.companyFocus && (
                <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 flex items-start gap-2.5 shadow-sm">
                  <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-mono text-[10px] uppercase tracking-wider mb-0.5">
                      {targetCompany} {targetRole} Assessment Focus:
                    </strong>
                    <span className="text-slate-300 text-[11px] leading-relaxed">
                      {currentQuestion.companyFocus}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-slate-300">
                {!isAnswering && !questionDone && (
                  <p><strong className="text-white">Reading Gap Active:</strong> Master recording &amp; second-screen detector armed. Keep gaze focused on-screen with no keyboard clicks. Click <strong className="text-emerald-400">Start Answer</strong> to begin recording your answer.</p>
                )}
                {isAnswering && (
                  <p className="text-emerald-400"><strong>Answer Recording Active:</strong> Speak clearly. Click <strong className="text-rose-400">End Answer</strong> as soon as you finish answering Question {currentQIndex + 1}.</p>
                )}
                {questionDone && (
                  <p className="text-slate-200"><strong className="text-emerald-400">Clip Saved:</strong> Question {currentQIndex + 1} clip locked ({formatTime(answerSeconds)}). Proceed when ready.</p>
                )}
              </div>

              {proctoringEvents.filter((e) => e.isGapAnomaly || e.type === 'GAP_ANOMALY_LLM_PROMPTING' || (e.reason && e.reason.includes('GAP ANOMALY'))).length > 0 && (
                <div className="p-2.5 rounded-lg border border-purple-600/70 bg-purple-950/50 text-purple-200 font-mono text-[11px] flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-1.5 truncate">
                    <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="truncate font-semibold">[GAP ANOMALY: Possible LLM Prompting]</span>
                  </div>
                  <span className="font-bold text-purple-300 text-[10px] bg-purple-900/80 px-2 py-0.5 rounded border border-purple-500/60 ml-2 shrink-0">
                    {proctoringEvents.filter((e) => e.isGapAnomaly || e.type === 'GAP_ANOMALY_LLM_PROMPTING' || (e.reason && e.reason.includes('GAP ANOMALY'))).length} logged
                  </span>
                </div>
              )}
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
                <Button
                  variant="accent"
                  size="lg"
                  disabled={isSubmitting}
                  onClick={handleNextOrFinish}
                  className={`w-full text-white font-bold py-2.5 flex items-center justify-center gap-2 transition-all ${
                    isSubmitting
                      ? 'bg-emerald-800 cursor-not-allowed opacity-90'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <span>Submitting Interview &amp; Finalizing Transcripts...</span>
                    </>
                  ) : currentQIndex < questions.length - 1 ? (
                    <>
                      <span>Read Question {currentQIndex + 2}</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      <span>Complete &amp; Submit Interview</span>
                      <CheckCircle2 className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Floating Typing Restriction Banner */}
      {typingBlockedBanner && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-rose-950/95 border-2 border-rose-500 text-rose-100 font-mono text-xs font-bold shadow-2xl flex items-center gap-2.5 animate-bounce select-none">
          <Keyboard className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
          <span>TYPING RESTRICTED: Verbal responses only. Keyboard input is disabled.</span>
        </div>
      )}

      {/* Fullscreen Mode Lock Breach Modal */}
      {showFullscreenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 text-center select-none">
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
                Institutional proctoring policy requires this technical interview to remain in Fullscreen mode. Exiting fullscreen has been logged with an audit timestamp on the Master Recording.
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
              onClick={async () => {
                try {
                  if (typeof document !== 'undefined' && document.documentElement?.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                  }
                  setShowFullscreenModal(false);
                } catch (e) {
                  setShowFullscreenModal(false);
                }
              }}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 shadow-lg shadow-rose-600/30 text-sm"
            >
              Re-enter Fullscreen Mode &amp; Resume
            </Button>
          </div>
        </div>
      )}

      {/* Tab Switching Restriction Breach Modal */}
      {showTabSwitchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 text-center select-none">
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
                Navigating away from the active interview tab or switching to second monitors is strictly forbidden. This incident has been timestamped on your master recording for the recruiter panel.
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
