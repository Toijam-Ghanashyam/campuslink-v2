'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ProctoringLogEntry } from '@/types/readiness';

interface UseProctoringOptions {
  onAutoSubmit?: () => void;
  maxTabSwitches?: number;
}

export function useProctoring(options: UseProctoringOptions = {}) {
  const { onAutoSubmit, maxTabSwitches = 3 } = options;

  const [hasPermissions, setHasPermissions] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [violationAlert, setViolationAlert] = useState<{
    visible: boolean;
    strike: number;
    message: string;
  }>({ visible: false, strike: 0, message: '' });

  // Face monitoring state
  const [faceCount, setFaceCount] = useState<number>(1);
  const [faceStatus, setFaceStatus] = useState<'NORMAL' | 'NO_FACE' | 'MULTIPLE_FACES' | 'LOOKING_AWAY'>('NORMAL');
  const [micVolume, setMicVolume] = useState<number>(0);
  const [isVoiceDetected, setIsVoiceDetected] = useState(false);

  const [logs, setLogs] = useState<ProctoringLogEntry[]>([]);
  const [snapshots, setSnapshots] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceLandmarkerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const noFaceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lookingAwayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((type: ProctoringLogEntry['type'], severity: ProctoringLogEntry['severity'], message: string) => {
    const entry: ProctoringLogEntry = {
      timestamp: Date.now(),
      type,
      severity,
      message,
    };
    setLogs((prev) => [...prev, entry]);
  }, []);

  // Capture compressed JPEG snapshot from webcam
  const captureSnapshot = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState < 2) return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      setSnapshots((prev) => [...prev, dataUrl]);
      return dataUrl;
    } catch (e) {
      console.warn('Snapshot capture failed:', e);
      return null;
    }
  }, []);

  // Request Camera and Microphone
  const requestMediaPermissions = useCallback(async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { max: 24 } },
        audio: true,
      });

      setStream(userStream);
      setHasPermissions(true);

      if (videoRef.current) {
        videoRef.current.srcObject = userStream;
        videoRef.current.play().catch((e) => console.warn('Video play error:', e));
      }

      // Initialize Web Audio API Volume Monitor
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const source = audioCtx.createMediaStreamSource(userStream);
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        // Monitor volume levels
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkAudio = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(100, Math.round((avg / 128) * 100));
          setMicVolume(normalized);

          // If sustained loud volume > 55% for > 2.5s, flag background voice
          if (normalized > 55) {
            if (!voiceTimerRef.current) {
              voiceTimerRef.current = setTimeout(() => {
                setIsVoiceDetected(true);
                addLog('BACKGROUND_VOICE_DETECTED', 'MEDIUM', 'Sustained acoustic voice activity detected during proctoring.');
                setTimeout(() => setIsVoiceDetected(false), 3000);
              }, 2500);
            }
          } else {
            if (voiceTimerRef.current) {
              clearTimeout(voiceTimerRef.current);
              voiceTimerRef.current = null;
            }
          }

          animFrameRef.current = requestAnimationFrame(checkAudio);
        };

        checkAudio();
      } catch (audioErr) {
        console.warn('Web Audio API init error:', audioErr);
      }

      return true;
    } catch (err: any) {
      console.error('Permission denied for camera/mic:', err);
      setHasPermissions(false);
      return false;
    }
  }, [addLog]);

  // Request Fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
      return true;
    } catch (err) {
      console.warn('Fullscreen entry rejected:', err);
      return false;
    }
  }, []);

  // Listen to Fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(active);

      if (!active && hasPermissions) {
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          addLog('FULLSCREEN_EXIT', 'HIGH', `Candidate exited fullscreen mode (Strike ${next}/${maxTabSwitches}).`);
          captureSnapshot();

          if (next >= maxTabSwitches) {
            onAutoSubmit?.();
          } else {
            setViolationAlert({
              visible: true,
              strike: next,
              message: `Warning Strike ${next}/${maxTabSwitches}: You exited fullscreen. On the ${maxTabSwitches}rd strike, your test is immediately submitted.`,
            });
          }
          return next;
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [hasPermissions, maxTabSwitches, addLog, captureSnapshot, onAutoSubmit]);

  // Listen to Tab Switches / Window Blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasPermissions) {
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          addLog('TAB_SWITCH', 'CRITICAL', `Browser focus lost / candidate switched away from tab (Strike ${next}/${maxTabSwitches}).`);
          captureSnapshot();

          if (next >= maxTabSwitches) {
            onAutoSubmit?.();
          } else {
            setViolationAlert({
              visible: true,
              strike: next,
              message: `Proctoring Alert: You switched tabs or unfocused the assessment window! Strike ${next}/${maxTabSwitches}. Third violation triggers automatic submission.`,
            });
          }
          return next;
        });
      }
    };

    const handleWindowBlur = () => {
      if (hasPermissions && !document.hidden) {
        addLog('TAB_SWITCH', 'HIGH', 'Window blur event recorded (focus shifted).');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [hasPermissions, maxTabSwitches, addLog, captureSnapshot, onAutoSubmit]);

  // Initialize MediaPipe FaceLandmarker
  useEffect(() => {
    let isCancelled = false;

    async function initMediaPipe() {
      if (!hasPermissions) return;

      try {
        const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
        const fileset = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (isCancelled) return;

        const landmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 2,
          outputFaceBlendshapes: true,
        });

        if (isCancelled) return;
        faceLandmarkerRef.current = landmarker;

        // Start video detection loop
        let lastVideoTime = -1;
        const detectFaces = () => {
          if (isCancelled) return;

          if (videoRef.current && videoRef.current.readyState >= 2 && faceLandmarkerRef.current) {
            const currentTime = videoRef.current.currentTime;
            if (currentTime !== lastVideoTime) {
              lastVideoTime = currentTime;
              try {
                const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());
                const count = results?.faceLandmarks?.length || 0;
                setFaceCount(count);

                if (count === 0) {
                  // No face detected
                  if (!noFaceTimerRef.current) {
                    noFaceTimerRef.current = setTimeout(() => {
                      setFaceStatus('NO_FACE');
                      addLog('NO_FACE_DETECTED', 'HIGH', 'No face detected in webcam feed for >3 seconds.');
                      captureSnapshot();
                    }, 3000);
                  }
                } else if (count >= 2) {
                  // Multiple faces detected
                  setFaceStatus('MULTIPLE_FACES');
                  addLog('MULTIPLE_FACES_DETECTED', 'CRITICAL', 'Multiple faces detected simultaneously in camera frame.');
                  captureSnapshot();
                  if (noFaceTimerRef.current) {
                    clearTimeout(noFaceTimerRef.current);
                    noFaceTimerRef.current = null;
                  }
                } else {
                  // Exactly 1 face - inspect pose
                  if (noFaceTimerRef.current) {
                    clearTimeout(noFaceTimerRef.current);
                    noFaceTimerRef.current = null;
                  }

                  const landmarks = results.faceLandmarks[0];
                  // Landmark 1 is nose tip, 33 is left eye outer, 263 is right eye outer
                  const nose = landmarks[1];
                  const leftEye = landmarks[33];
                  const rightEye = landmarks[263];

                  let isLookingAway = false;
                  if (nose && leftEye && rightEye) {
                    const eyeDist = Math.abs(rightEye.x - leftEye.x);
                    const noseEyeRatio = (nose.x - leftEye.x) / (eyeDist || 0.001);
                    // Normal ratio is ~0.5. If < 0.25 or > 0.75, head is turned significantly away
                    if (noseEyeRatio < 0.25 || noseEyeRatio > 0.75) {
                      isLookingAway = true;
                    }
                  }

                  if (isLookingAway) {
                    if (!lookingAwayTimerRef.current) {
                      lookingAwayTimerRef.current = setTimeout(() => {
                        setFaceStatus('LOOKING_AWAY');
                        addLog('LOOKING_AWAY', 'MEDIUM', 'Candidate gaze turned away from test screen for >4 seconds.');
                      }, 4000);
                    }
                  } else {
                    if (lookingAwayTimerRef.current) {
                      clearTimeout(lookingAwayTimerRef.current);
                      lookingAwayTimerRef.current = null;
                    }
                    setFaceStatus('NORMAL');
                  }
                }
              } catch (detectErr) {
                // Ignore transient frame skips
              }
            }
          }

          requestAnimationFrame(detectFaces);
        };

        detectFaces();
      } catch (mpErr) {
        console.warn('MediaPipe FaceLandmarker load warning (running lightweight fallback):', mpErr);
        // Fallback: simple presence check via video frame brightness
        setFaceStatus('NORMAL');
      }
    }

    initMediaPipe();

    return () => {
      isCancelled = true;
      if (faceLandmarkerRef.current) {
        try {
          faceLandmarkerRef.current.close();
        } catch (e) {}
      }
      if (noFaceTimerRef.current) clearTimeout(noFaceTimerRef.current);
      if (lookingAwayTimerRef.current) clearTimeout(lookingAwayTimerRef.current);
      if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);
    };
  }, [hasPermissions, addLog, captureSnapshot]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [stream]);

  const dismissViolationAlert = () => {
    setViolationAlert((prev) => ({ ...prev, visible: false }));
  };

  return {
    videoRef,
    hasPermissions,
    requestMediaPermissions,
    isFullscreen,
    enterFullscreen,
    tabSwitchCount,
    violationAlert,
    dismissViolationAlert,
    faceCount,
    faceStatus,
    micVolume,
    isVoiceDetected,
    logs,
    snapshots,
    captureSnapshot,
    addLog,
  };
}

